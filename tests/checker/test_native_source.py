"""Prove source guardrails reject damaged resources before ROM compilation."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("native_source", ROOT / "scripts/check-native-source.py")
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class SourceGuards(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ("project", "assets"):
            shutil.copytree(ROOT / name, self.root / name)
        shutil.copy2(ROOT / "gameplay-source.json", self.root / "gameplay-source.json")

    def change(self, relative, mutate):
        path = self.root / relative
        value = json.loads(path.read_text())
        mutate(value)
        path.write_text(json.dumps(value))

    def rejected(self, fragment):
        result = checker.check(self.root)
        self.assertFalse(result["passed"])
        self.assertTrue(any(fragment in error for error in result["errors"]), result)

    def test_preserves_save_ids_even_if_manifest_is_edited_to_match(self):
        self.change("project/variables.gbsres", lambda data: data["variables"][1].update(symbol="var_renamed"))
        self.change("gameplay-source.json", lambda data: data["variables"]["coins"].update(symbol="VAR_RENAMED"))
        self.rejected("variable 1 must remain var_coins")

    def test_duplicate_scene_id(self):
        other = json.loads((self.root / "project/scenes/garage/scene.gbsres").read_text())["id"]
        self.change("project/scenes/frostwick/scene.gbsres", lambda data: data.update(id=other))
        self.rejected("Duplicate resource/event ID")

    def test_missing_background(self):
        self.change("project/scenes/frostwick/scene.gbsres", lambda data: data.update(backgroundId="absent"))
        self.rejected("missing background reference")

    def test_long_menu_label(self):
        path = self.root / "project/scenes/garage/scene.gbsres"
        data = json.loads(path.read_text())
        data["script"].append({"command": "EVENT_MENU", "args": {"items": 1, "option1": "Too long"}})
        path.write_text(json.dumps(data))
        self.rejected("exceeds 7 glyphs")

    def test_broken_scene_destination(self):
        self.change("project/scenes/garage/scene.gbsres", lambda data: data["script"].append(
            {"command": "EVENT_SWITCH_SCENE", "args": {"sceneId": "absent"}}))
        self.rejected("missing scene reference")


if __name__ == "__main__":
    unittest.main()
