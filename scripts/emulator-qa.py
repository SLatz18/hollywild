#!/usr/bin/env python3
"""Drive the genuine ROM with buttons; observe matching-build symbols read-only.

JSON commands on stdin: tap, hold, tick, capture, assert, restart, navigate, stop.
Only button input changes gameplay. No state injection or memory writes.
The actor position layout is from the pinned GBVM actor_t structure.
"""
import hashlib
import io
import json
import re
import sys
from collections import deque
from pathlib import Path

from pyboy import PyBoy

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build/rom"
OUT = ROOT / "test-results"
OUT.mkdir(exist_ok=True)
manifest = json.loads((BUILD / "build-manifest.json").read_text())
rom = ROOT / manifest["rom"]
rom_hash = hashlib.sha256(rom.read_bytes()).hexdigest()
assert rom_hash == manifest["cartridge"]["sha256"]
artifacts = manifest["debug_artifacts_sha256"]
for filename, expected in artifacts.items():
    assert hashlib.sha256((ROOT / filename).read_bytes()).hexdigest() == expected
noi = next(ROOT / p for p in artifacts if p.endswith(".noi"))
globals_file = next(ROOT / p for p in artifacts if p.endswith("globals.i"))
symbols = {k: int(v, 16) for k, v in re.findall(r"^DEF (\S+) 0x([0-9A-Fa-f]+)$", noi.read_text(), re.M)}
variables = {k[4:].lower(): int(v) for k, v in re.findall(r"^(VAR_\w+) = (\d+)$", globals_file.read_text(), re.M)}
scene_symbols = {}
scene_resources = {}


def checked_resource(path):
    relative = str(path.relative_to(ROOT))
    assert hashlib.sha256(path.read_bytes()).hexdigest() == manifest["authored_sha256"].get(relative), (
        f"Native resource differs from tested build: {relative}")
    return json.loads(path.read_text())


for scene_path in sorted((ROOT / "project/scenes").glob("*/scene.gbsres")):
    scene_resource = checked_resource(scene_path)
    symbol = "_" + scene_resource["symbol"]
    assert symbol in symbols, f"Scene symbol missing from matching ROM: {symbol}"
    scene_symbols[symbols[symbol]] = scene_path.parent.name
    scene_resources[scene_path.parent.name] = (scene_path, scene_resource)
ram_bytes = {0: 0, 1: 2048, 2: 8192, 3: 32768, 4: 131072, 5: 65536}[rom.read_bytes()[0x149]]
ram = io.BytesIO(bytes(ram_bytes))


def boot():
    ram.seek(0)
    machine = PyBoy(str(rom), window="null", sound_emulated=False, ram_file=ram)
    machine.set_emulation_speed(0)
    machine.tick(180)
    return machine


pyboy = boot()
history = {"romSha256": rom_hash, "commands": []}


def word(address):
    return pyboy.memory[address] + 256 * pyboy.memory[address + 1]


def state():
    mem, actor, scene = symbols["_script_memory"], symbols["_actors"], symbols["_current_scene"]
    far = (pyboy.memory[scene] << 16) + word(scene + 1)
    result = {k: word(mem + index * 2) for k, index in variables.items() if not k.startswith("temp_")}
    result.update(scene=scene_symbols.get(far, hex(far)), x=word(actor + 1) / 256,
                  y=word(actor + 3) / 256,
                  windowY=pyboy.memory[symbols["_win_pos_y"]],
                  textDrawn=pyboy.memory[symbols["_text_drawn"]])
    return result


def navigate(destination):
    """Find a same-scene path, then verify every actual button-driven tile step.

    Uses native collision/bounds resources belonging to the tested build. Dynamic
    actors are not predicted: any unexpected position stops with an assertion.
    Trigger entry requires expectScene, preventing accidental transitions.
    """
    current = state()
    assert current["windowY"] == 144, "Close dialogue/menu before navigation"
    scene_name = current["scene"]
    scene_path, scene = scene_resources[scene_name]
    start = (current["x"], current["y"])
    target = (destination["x"], destination["y"])
    assert all(float(n).is_integer() for n in start + target), "Navigation requires tile-aligned positions"
    expected_scene = destination.get("expectScene")
    tiles = []
    encoded = scene["collisions"]
    offset = 0
    while offset < len(encoded):
        tile = int(encoded[offset:offset + 2], 16)
        offset += 2
        repeat = re.match(r"(!|[0-9a-f]+\+)", encoded[offset:], re.I)
        assert repeat, "Malformed native collision RLE"
        token = repeat.group(0)
        tiles.extend([tile] * (1 if token == "!" else int(token[:-1], 16)))
        offset += len(token)
    assert len(tiles) == scene["width"] * scene["height"]
    sprites = {item["id"]: item for item in
               (checked_resource(path) for path in (ROOT / "assets/sprites").glob("*.gbsres"))}
    settings = checked_resource(ROOT / "project/settings.gbsres")
    player = sprites[settings["defaultPlayerSprites"][scene["type"]]]

    def bounds(sprite, x, y):
        left, top = x * 8 + sprite["boundsX"], y * 8 + sprite["boundsY"]
        return left, top, left + sprite["boundsWidth"] - 1, top + sprite["boundsHeight"] - 1

    def overlap(a, b):
        return a[0] <= b[2] and b[0] <= a[2] and a[1] <= b[3] and b[1] <= a[3]

    obstacles = []
    for path in (scene_path.parent / "actors").glob("*.gbsres"):
        actor = checked_resource(path)
        if not actor.get("isPinned"):
            obstacles.append(bounds(sprites[actor["spriteSheetId"]], actor["x"], actor["y"]))
    triggers = []
    for path in (scene_path.parent / "triggers").glob("*.gbsres"):
        trigger = checked_resource(path)
        triggers.append((trigger["x"] * 8, trigger["y"] * 8,
                         (trigger["x"] + trigger["width"]) * 8 - 1,
                         (trigger["y"] + trigger["height"]) * 8 - 1))
    target_bounds = bounds(player, *target)
    permitted_triggers = [area for area in triggers if expected_scene and overlap(area, target_bounds)]

    def free(point):
        area = bounds(player, *point)
        if area[0] < 0 or area[1] < 0 or area[2] >= scene["width"] * 8 or area[3] >= scene["height"] * 8:
            return False
        if any(tiles[y * scene["width"] + x] for y in range(int(area[1] // 8), int(area[3] // 8) + 1)
               for x in range(int(area[0] // 8), int(area[2] // 8) + 1)):
            return False
        if any(overlap(area, obstacle) for obstacle in obstacles):
            return False
        return not any(overlap(area, trigger) for trigger in triggers if trigger not in permitted_triggers)

    assert free(target), f"Navigation target is blocked or is an unapproved trigger: {target}"
    queue, previous = deque([start]), {start: None}
    while queue and target not in previous:
        point = queue.popleft()
        for dx, dy, button in ((1, 0, "right"), (-1, 0, "left"), (0, 1, "down"), (0, -1, "up")):
            candidate = (point[0] + dx, point[1] + dy)
            if candidate not in previous and free(candidate):
                previous[candidate] = (point, button)
                queue.append(candidate)
    assert target in previous, f"No unobstructed route from {start} to {target}"
    path, point = [], target
    while previous[point] is not None:
        prior, button = previous[point]
        path.append((point, button))
        point = prior
    walked = []
    for point, button in reversed(path):
        pyboy.button_press(button)
        pyboy.tick(8)
        pyboy.button_release(button)
        pyboy.tick(1)
        observed = state()
        walked.append({"button": button, "frames": 8, "scene": observed["scene"], "x": observed["x"], "y": observed["y"]})
        if observed["scene"] != scene_name:
            assert observed["scene"] == expected_scene, f"Unexpected transition: {observed['scene']}"
            return walked
        assert (observed["x"], observed["y"]) == point, f"Navigation stopped: expected {point}, got {(observed['x'], observed['y'])}"
        # Trigger scripts fade before switching the current-scene pointer. Do
        # not issue another movement step while that transition owns input.
        if expected_scene and any(overlap(bounds(player, *point), area) for area in permitted_triggers):
            pyboy.tick(120)
            arrived = state()
            assert arrived["scene"] == expected_scene, f"Expected transition to {expected_scene}, still in {arrived['scene']}"
            return walked
    if expected_scene:
        pyboy.tick(120)
        assert state()["scene"] == expected_scene, f"Expected transition to {expected_scene}, still in {state()['scene']}"
    return walked


print(json.dumps({"ready": True, "state": state()}), flush=True)
try:
    for line in sys.stdin:
        try:
            cmd = json.loads(line)
            navigation_steps = None
            if "navigate" in cmd:
                navigation_steps = navigate(cmd["navigate"])
            if "tap" in cmd:
                for _ in range(cmd.get("count", 1)):
                    pyboy.button(cmd["tap"])
                    pyboy.tick(cmd.get("frames", 40))
            if "hold" in cmd:
                pyboy.button_press(cmd["hold"])
                pyboy.tick(cmd.get("frames", 8))
                pyboy.button_release(cmd["hold"])
                pyboy.tick(1)
            if "tick" in cmd:
                pyboy.tick(cmd["tick"])
            if "capture" in cmd:
                name = Path(cmd["capture"]).name
                assert name.endswith(".png")
                pyboy.tick(1)
                pyboy.screen.image.save(OUT / name)
            if "restart" in cmd:
                ram.seek(0)
                pyboy.stop(ram_file=ram)
                pyboy = boot()
            current = state()
            if "assert" in cmd:
                for key, expected in cmd["assert"].items():
                    assert current[key] == expected, f"{key}: expected {expected}, got {current[key]}"
            history["commands"].append({"input": cmd, "state": current, "passed": True,
                                        **({"navigation_steps": navigation_steps} if navigation_steps is not None else {})})
            (OUT / "emulator-session.json").write_text(json.dumps(history, indent=2))
            print(json.dumps({"ok": True, "state": current}), flush=True)
            if cmd.get("stop"):
                break
        except Exception as error:
            history["commands"].append({"input": line.strip(), "passed": False, "error": str(error)})
            (OUT / "emulator-session.json").write_text(json.dumps(history, indent=2))
            print(json.dumps({"ok": False, "error": str(error), "state": state()}), flush=True)
finally:
    pyboy.stop(save=False)

# Interactive exploration may continue after an assertion, but batch replay
# must fail visibly if any command failed.
sys.exit(0 if all(item["passed"] for item in history["commands"]) else 1)
