#!/usr/bin/env python3
"""Check native resource integrity before compiling, without changing files.

Cross-check references and persistent variable IDs against the generated native
resources. This does not substitute for runtime, economy, or hardware testing.
"""
import argparse
import json
import re
from pathlib import Path

# Cartridge save compatibility contract from the released 36-variable schema.
# New variables append after these IDs; updating the generated manifest alone
# must never silently rename or reorder persistent storage.
LEGACY_VARIABLES = """initialized coins salvage cheer workshop cocoa job first_salvage
carried bonus crew_enabled crew_reserved cocoa_snapshot cycles choice flats toolworks
parcel aurora toolworks_snapshot parcel_snapshot district_count visited_frostwick
visited_candy visited_brassworks visited_velvet visited_aurora cache_frostwick
cache_candy cache_brassworks cache_velvet cache_aurora deliveries salvage_runs festival
save_version""".split()
LEGACY_VARIABLES += "quest_frostwick quest_candy quest_brassworks quest_velvet quest_aurora crew_mode crew_mode_snapshot".split()
UUID = re.compile(r"^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$", re.I)


def check(root):
    errors, resources, uuid_locations = [], [], {}

    def require(condition, message):
        if not condition:
            errors.append(message)

    def walk(value, location):
        if isinstance(value, dict):
            yield value, location
            for key, item in value.items():
                yield from walk(item, f"{location}/{key}")
        elif isinstance(value, list):
            for index, item in enumerate(value):
                yield from walk(item, f"{location}/{index}")

    files = sorted((root / "project").rglob("*.gbsres")) + sorted((root / "assets").rglob("*.gbsres"))
    require(bool(files), "No native resources found")
    for path in files:
        relative = str(path.relative_to(root))
        try:
            data = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError) as error:
            errors.append(f"{relative}: cannot read resource: {error}")
            continue
        resources.append((path, data))
        for value, location in walk(data, relative):
            identifier = value.get("id")
            if isinstance(identifier, str) and UUID.fullmatch(identifier):
                require(identifier not in uuid_locations,
                        f"Duplicate resource/event ID {identifier}: {location} and {uuid_locations.get(identifier)}")
                uuid_locations[identifier] = location

    by_type = {}
    for path, data in resources:
        by_type.setdefault(data.get("_resourceType"), []).append((path, data))
    indexes = {kind: {data["id"]: data for _, data in values if "id" in data}
               for kind, values in by_type.items()}
    scene_index = indexes.get("scene", {})
    require(bool(scene_index), "No scenes found")
    variables = [entry for _, data in by_type.get("variables", []) for entry in data.get("variables", [])]
    var_ids = {entry.get("id") for entry in variables}
    require(len(var_ids) == len(variables), "Duplicate persistent variable IDs")
    require(all(isinstance(v, str) and v.isdigit() for v in var_ids), "Persistent variable IDs must be numeric strings")
    actual_variables = {entry.get("id"): entry.get("symbol", "").lower() for entry in variables}
    for index, name in enumerate(LEGACY_VARIABLES):
        require(actual_variables.get(str(index)) == "var_" + name,
                f"Save compatibility: variable {index} must remain var_{name}")
    var_symbols = {entry.get("symbol") for entry in variables}
    require(len(var_symbols) == len(variables), "Duplicate persistent variable symbols")
    require("var_save_version" in var_symbols, "Missing save version variable")

    manifest_path = root / "gameplay-source.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        declared = {item["id"]: item["symbol"].lower() for item in manifest.get("variables", {}).values()}
        actual = {item["id"]: item["symbol"].lower() for item in variables}
        require(declared == actual, "Save-variable IDs/symbols differ between gameplay manifest and native variables")

    def reference(value, kind, location, optional=False):
        if optional and value in (None, ""):
            return
        require(value in indexes.get(kind, {}), f"{location}: missing {kind} reference {value!r}")

    event_count = 0
    for path, data in resources:
        label = str(path.relative_to(root))
        kind = data.get("_resourceType")
        if kind in ("background", "sprite", "font"):
            filename = data.get("filename")
            require(bool(filename) and (path.parent / filename).is_file(), f"{label}: missing source asset {filename!r}")
        if kind == "scene":
            reference(data.get("backgroundId"), "background", label)
            for field in ("paletteIds", "spritePaletteIds"):
                for value in data.get(field, []):
                    reference(value, "palette", f"{label}/{field}", optional=True)
        if kind == "actor":
            reference(data.get("spriteSheetId"), "sprite", label)
            reference(data.get("paletteId"), "palette", label, optional=True)
        if kind == "settings":
            reference(data.get("startSceneId"), "scene", label)
            reference(data.get("defaultFontId"), "font", label)
            for value in data.get("defaultPlayerSprites", {}).values():
                reference(value, "sprite", label)

        for value, location in walk(data, label):
            if value.get("type") == "variable":
                require(value.get("value") in var_ids, f"{location}: undefined variable {value.get('value')!r}")
            if "command" not in value:
                continue
            event_count += 1
            command, args = value["command"], value.get("args", {})
            for field in ("variable", "vectorX"):
                if field in args:
                    require(args[field] in var_ids, f"{location}: undefined {field} {args[field]!r}")
            if args.get("other") == "var":
                require(args.get("vectorY") in var_ids, f"{location}: undefined vectorY")
            if command == "EVENT_MENU":
                count = args.get("items", 0)
                require(isinstance(count, int) and 1 <= count <= 8, f"{location}: invalid menu count")
                for index in range(1, count + 1):
                    option = args.get(f"option{index}")
                    require(isinstance(option, str) and 0 < len(option) <= 7,
                            f"{location}: menu label {index} missing or exceeds 7 glyphs: {option!r}")
            if command in ("EVENT_SAVE_DATA", "EVENT_LOAD_DATA", "EVENT_IF_SAVED_DATA"):
                require(args.get("saveSlot") == 0, f"{location}: unexpected save slot in single-slot game")
            if command == "EVENT_SWITCH_SCENE":
                destination = args.get("sceneId")
                reference(destination, "scene", location)
                target = scene_index.get(destination)
                if target:
                    for axis, extent in (("x", "width"), ("y", "height")):
                        coordinate = args.get(axis, {})
                        require(coordinate.get("type") == "number" and isinstance(coordinate.get("value"), int)
                                and 0 <= coordinate["value"] < target[extent] - 1,
                                f"{location}: invalid {axis} arrival in destination {target.get('name')}")
            if "actorId" in args:
                actor = args.get("actorId")
                require(actor in ("$self$", "player") or actor in indexes.get("actor", {}),
                        f"{location}: missing actor reference {actor!r}")
            if command == "EVENT_ACTOR_SET_SPRITE":
                reference(args.get("spriteSheetId"), "sprite", location)
            if command == "EVENT_CALL_CUSTOM_EVENT":
                reference(args.get("customEventId"), "script", location)

    # A scene must have a real return path, not merely an inbound link.
    graph = {identifier: set() for identifier in scene_index}
    scene_dirs = {path.parent: data["id"] for path, data in by_type.get("scene", [])}
    for path, data in resources:
        owner = next((identifier for directory, identifier in scene_dirs.items() if path.is_relative_to(directory)), None)
        if owner:
            for value, _ in walk(data, ""):
                if value.get("command") == "EVENT_SWITCH_SCENE":
                    graph[owner].add(value.get("args", {}).get("sceneId"))
    for start in graph:
        seen, pending = {start}, [start]
        while pending:
            for target in graph.get(pending.pop(), ()):
                if target not in seen:
                    seen.add(target)
                    pending.append(target)
        require(set(graph) <= seen, f"Scene {scene_index[start].get('name')} cannot reach every scene")

    return {"passed": not errors, "resources": len(resources), "scenes": len(scene_index),
            "variables": len(variables), "events": event_count, "errors": errors}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    result = check(parser.parse_args().root.resolve())
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["passed"] else 1)
