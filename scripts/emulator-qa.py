#!/usr/bin/env python3
"""Drive the genuine ROM with buttons; observe matching-build symbols read-only.

JSON commands on stdin: tap, hold, tick, capture, assert, restart, navigate, stop.
Only button input changes gameplay. No state injection or memory writes.
The actor position layout is from the pinned GBVM actor_t structure.
"""
import hashlib
import io
import json
import os
import time
import uuid
import wave
import numpy as np
import re
import sys
from collections import deque
from pathlib import Path

from pyboy import PyBoy

SESSION_STARTED = time.perf_counter()
SIMULATED_FRAMES = 0
RUN_ID = os.environ.get("HOLLYWILD_QA_RUN_ID", str(uuid.uuid4()))


def tick(machine, frames):
    global SIMULATED_FRAMES
    machine.tick(frames)
    SIMULATED_FRAMES += frames


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build/rom"
OUT = Path(os.environ.get('HOLLYWILD_QA_OUT', str(ROOT / "test-results")))
OUT.mkdir(parents=True, exist_ok=True)
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
music_symbols = {symbols['_song_' + key + '_Data']: key for key in
                 ('garage','frostwick','candy','brassworks','velvet','aurora','finale')
                 if '_song_' + key + '_Data' in symbols}
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
    machine = PyBoy(str(rom), window="null", sound_emulated=os.environ.get('HOLLYWILD_QA_AUDIO') == '1',
                    sound_sample_rate=48000, ram_file=ram)
    machine.set_emulation_speed(0)
    tick(machine, 180)
    return machine


pyboy = boot()
history = {"romSha256": rom_hash, "runId": RUN_ID, "commands": [],
           "timingNote": "Automated wall time and simulated frames are measured separately; neither estimates human pacing."}


def write_history():
    history["elapsedWallSeconds"] = round(time.perf_counter() - SESSION_STARTED, 6)
    history["simulatedFrames"] = SIMULATED_FRAMES
    (OUT / "emulator-session.json").write_text(json.dumps(history, indent=2) + "\n")


def word(address):
    return pyboy.memory[address] + 256 * pyboy.memory[address + 1]


def state():
    mem, actor, scene = symbols["_script_memory"], symbols["_actors"], symbols["_current_scene"]
    far = (pyboy.memory[scene] << 16) + word(scene + 1)
    result = {k: word(mem + index * 2) for k, index in variables.items() if not k.startswith("temp_")}
    result.update(scene=scene_symbols.get(far, hex(far)), x=word(actor + 1) / 256,
                  y=word(actor + 3) / 256,
                  windowX=pyboy.memory[symbols["_win_pos_x"]],
                  windowY=pyboy.memory[symbols["_win_pos_y"]],
                  textDrawn=pyboy.memory[symbols["_text_drawn"]])
    if '_music_current_track_bank' in symbols:
        bank=pyboy.memory[symbols['_music_current_track_bank']]
        pointer=word(symbols['_music_current_track'])
        result['musicTrack']='muted' if bank==255 else music_symbols.get((bank<<16)+pointer,hex((bank<<16)+pointer))
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
        tick(pyboy, 8)
        pyboy.button_release(button)
        tick(pyboy, 1)
        observed = state()
        walked.append({"button": button, "frames": 8, "scene": observed["scene"], "x": observed["x"], "y": observed["y"]})
        if observed["scene"] != scene_name:
            assert observed["scene"] == expected_scene, f"Unexpected transition: {observed['scene']}"
            return walked
        assert (observed["x"], observed["y"]) == point, f"Navigation stopped: expected {point}, got {(observed['x'], observed['y'])}"
        # Trigger scripts fade before switching the current-scene pointer. Do
        # not issue another movement step while that transition owns input.
        if expected_scene and any(overlap(bounds(player, *point), area) for area in permitted_triggers):
            tick(pyboy, 120)
            arrived = state()
            assert arrived["scene"] == expected_scene, f"Expected transition to {expected_scene}, still in {arrived['scene']}"
            return walked
    if expected_scene:
        tick(pyboy, 120)
        assert state()["scene"] == expected_scene, f"Expected transition to {expected_scene}, still in {state()['scene']}"
    return walked


def read_dialogue(limit=240):
    """Press A through text, stopping before a right-side choice menu.

    GB Studio's checked-in menu renderer positions menu layouts at x=80.
    Dialogue is at x=0. This observes rendered UI position, not story state.
    """
    presses = 0
    tick(pyboy, 200)
    while state()["windowY"] != 144 and state()["windowX"] != 80:
        assert presses < limit, "Dialogue did not close within the button budget"
        pyboy.button("a")
        tick(pyboy, 200)
        presses += 1
    return presses


def choose(index):
    current = state()
    assert current["windowY"] < 144 and current["windowX"] == 80, "No choice menu is open"
    assert isinstance(index, int) and 0 <= index <= 8
    if index == 0:
        pyboy.button("b")
        tick(pyboy, 200)
    else:
        for _ in range(index - 1):
            pyboy.button("down")
            tick(pyboy, 20)
        pyboy.button("a")
        tick(pyboy, 200)
    return read_dialogue()


def travel(destination):
    """Cross the native scene graph using real directional inputs."""
    by_id = {resource["id"]: name for name, (_, resource) in scene_resources.items()}
    graph = {}
    for name, (path, _) in scene_resources.items():
        graph[name] = []
        for trigger_path in sorted((path.parent / "triggers").glob("*.gbsres")):
            trigger = checked_resource(trigger_path)
            for event in trigger.get("script", []):
                if event.get("command") == "EVENT_SWITCH_SCENE":
                    graph[name].append((by_id[event["args"]["sceneId"]], trigger))
    start = state()["scene"]
    queue, previous = deque([start]), {start: None}
    while queue and destination not in previous:
        scene = queue.popleft()
        for target, trigger in graph[scene]:
            if target not in previous:
                previous[target] = (scene, trigger)
                queue.append(target)
    assert destination in previous, f"No scene route to {destination}"
    route, target = [], destination
    while previous[target] is not None:
        prior, trigger = previous[target]
        route.append((target, trigger))
        target = prior
    moves = []
    for target, trigger in reversed(route):
        moves.extend(navigate({"x": trigger["x"], "y": trigger["y"], "expectScene": target}))
        tick(pyboy, 160)
        read_dialogue()
        assert state()["scene"] == target
    return moves


def interact(target):
    """Walk to an authored actor and press A; no teleportation or memory writes."""
    if target.get("scene") and state()["scene"] != target["scene"]:
        travel(target["scene"])
    scene_path, _ = scene_resources[state()["scene"]]
    actor_path = scene_path.parent / "actors" / (target["actor"] + ".gbsres")
    actor = checked_resource(actor_path)
    x, y = actor["x"], actor["y"]
    approaches = ((x, y + 1, "up"), (x, y - 2, "down"),
                  (x - 2, y, "right"), (x + 2, y, "left"))
    for px, py, direction in approaches:
        try:
            walked = navigate({"x": px, "y": py})
        except AssertionError as error:
            # These path-planning failures occur before any buttons are sent.
            if str(error).startswith(("Navigation target is blocked", "No unobstructed route")):
                continue
            raise
        pyboy.button_press(direction)
        tick(pyboy, 8)
        pyboy.button_release(direction)
        tick(pyboy, 1)
        pyboy.button("a")
        tick(pyboy, 200)
        read_dialogue()
        return walked
    raise AssertionError(f"No safe interaction approach to {actor_path.name}")


print(json.dumps({"ready": True, "state": state()}), flush=True)
try:
    for line in sys.stdin:
        try:
            cmd = json.loads(line)
            navigation_steps = None
            if "travel" in cmd:
                navigation_steps = travel(cmd["travel"])
            if "navigate" in cmd:
                navigation_steps = navigate(cmd["navigate"])
            if "interact" in cmd:
                navigation_steps = interact(cmd["interact"])
            if "tap" in cmd:
                for _ in range(cmd.get("count", 1)):
                    pyboy.button(cmd["tap"])
                    tick(pyboy, cmd.get("frames", 40))
            if "hold" in cmd:
                pyboy.button_press(cmd["hold"])
                tick(pyboy, cmd.get("frames", 8))
                pyboy.button_release(cmd["hold"])
                tick(pyboy, 1)
            if "tick" in cmd:
                tick(pyboy, cmd["tick"])
            if "restart" in cmd:
                ram.seek(0)
                pyboy.stop(ram_file=ram)
                pyboy = boot()
            if cmd.get("read"):
                read_dialogue()
            if "choose" in cmd:
                choose(cmd["choose"])
            if "capture" in cmd:
                name = Path(cmd["capture"]).name
                assert name.endswith(".png")
                tick(pyboy, 1)
                pyboy.screen.image.save(OUT / name)
            if "audio" in cmd:
                assert os.environ.get('HOLLYWILD_QA_AUDIO') == '1', 'Enable real audio capture explicitly'
                spec=cmd['audio'];name=Path(spec['name']).name;assert name.endswith('.wav')
                seconds=spec.get('seconds',6);assert 0 < seconds <= 240
                chunks=[]
                for _ in range(round(seconds*59.7275)):
                    tick(pyboy,1)
                    # PyBoy 2.6.1's ndarray convenience accessor slices rows
                    # with a byte count, including one stale stereo sample.
                    # Use the documented raw buffer and its actual byte head.
                    head=pyboy.sound.raw_buffer_head
                    assert head % 2 == 0
                    valid_samples=head // 2
                    assert valid_samples <= len(pyboy.sound.raw_ndarray)
                    chunks.append(pyboy.sound.raw_ndarray[:valid_samples].copy())
                samples=np.concatenate(chunks).astype(np.int16)*256
                with wave.open(str(OUT/name),'wb') as output:
                    output.setnchannels(2);output.setsampwidth(2);output.setframerate(48000);output.writeframes(samples.astype('<i2').tobytes())
            current = state()
            if "assert" in cmd:
                for key, expected in cmd["assert"].items():
                    assert current[key] == expected, f"{key}: expected {expected}, got {current[key]}"
            history["commands"].append({"input": cmd, "state": current, "passed": True,
                                        **({"navigation_steps": navigation_steps} if navigation_steps is not None else {})})
            write_history()
            print(json.dumps({"ok": True, "state": current}), flush=True)
            if cmd.get("stop"):
                break
        except Exception as error:
            history["commands"].append({"input": line.strip(), "passed": False, "error": str(error)})
            write_history()
            print(json.dumps({"ok": False, "error": str(error), "state": state()}), flush=True)
finally:
    pyboy.stop(save=False)
    write_history()

# Interactive exploration may continue after an assertion, but batch replay
# must fail visibly if any command failed.
sys.exit(0 if all(item["passed"] for item in history["commands"]) else 1)
