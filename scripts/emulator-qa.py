#!/usr/bin/env python3
"""Drive the genuine ROM with buttons; observe matching-build symbols read-only.

JSON commands on stdin: tap, hold, tick, capture, assert, restart, stop.
Only button input changes gameplay. No state injection or memory writes.
The actor position layout is from the pinned GBVM actor_t structure.
"""
import hashlib
import io
import json
import re
import sys
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
scene_symbols = {v: k[7:] for k, v in symbols.items()
                 if k in ["_scene_" + s for s in ("frostwick", "candy", "brassworks", "velvet", "aurora", "garage")]}
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


print(json.dumps({"ready": True, "state": state()}), flush=True)
try:
    for line in sys.stdin:
        try:
            cmd = json.loads(line)
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
            history["commands"].append({"input": cmd, "state": current, "passed": True})
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
