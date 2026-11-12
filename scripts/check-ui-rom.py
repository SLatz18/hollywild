#!/usr/bin/env python3
"""Button-only UI regression against a fresh cartridge, with read-only probes.

Run with .tools/emulator/bin/python scripts/check-ui-rom.py after building.
Screenshots require a separate visual review; register checks do not verify prose.
"""
import hashlib
import argparse
import io
import json
import re
import time
from pathlib import Path

from PIL import Image
from pyboy import PyBoy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "test-results/ui-regression"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--intro-pages", type=int, default=5,
                        help="Expected runtime intro page count (default: 5)")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT / "build/rom/build-manifest.json").read_text())
    rom = ROOT / manifest["rom"]
    digest = sha(rom)
    assert digest == manifest["cartridge"]["sha256"], "Manifest ROM mismatch"
    artifacts = manifest["debug_artifacts_sha256"]
    noi = next(ROOT / p for p in artifacts if p.endswith(".noi"))
    assert sha(noi) == artifacts[str(noi.relative_to(ROOT))], "Symbol file mismatch"
    symbols = {k: int(v, 16) for k, v in
               re.findall(r"^DEF (\S+) 0x([0-9A-Fa-f]+)$", noi.read_text(), re.M)}
    names = ("_win_pos_x", "_win_pos_y", "_win_dest_pos_x",
             "_win_dest_pos_y", "_text_drawn")
    assert all(name in symbols for name in names), "Required UI probes absent"
    ram_size = {0: 0, 1: 2048, 2: 8192, 3: 32768, 4: 131072,
                5: 65536}[rom.read_bytes()[0x149]]
    # Pass an isolated zero-filled SRAM stream, never the user's save file.
    ram = io.BytesIO(bytes(ram_size))
    machine = PyBoy(str(rom), window="null", sound_emulated=False, ram_file=ram)
    machine.set_emulation_speed(0)
    result = {"romSha256": digest, "freshSram": True,
              "method": "actual buttons; read-only UI symbols and hardware LCDC",
              "expectedIntroPages": args.intro_pages,
              "observations": [], "inputs": [], "status": "running"}
    frame = 0
    started = time.monotonic()

    def tick(count=1):
        nonlocal frame
        machine.tick(count)
        frame += count

    def state():
        observed = {name[1:]: machine.memory[symbols[name]] for name in names}
        observed["LCDC"] = machine.memory[0xFF40]
        return observed

    def settle(visible):
        # A full reveal and completed window slide must remain true for 24
        # consecutive frames. The bounded loop tolerates text-speed changes.
        stable = 0
        for _ in range(1800):
            tick()
            s = state()
            ready = (s["win_pos_y"] < 144 and s["text_drawn"] != 0
                     and s["win_pos_y"] == s["win_dest_pos_y"]
                     and s["win_pos_x"] == s["win_dest_pos_x"])
            if not visible:
                ready = s["win_pos_y"] == s["win_dest_pos_y"] == 144
            stable = stable + 1 if ready else 0
            if stable == 24:
                return s
        raise AssertionError(f"Timed out waiting for visible={visible}: {state()}")

    def capture(label, visible=True, expected=None, menu=False):
        s = settle(visible)
        native = OUT / f"{label}.png"
        enlarged = OUT / f"{label}-4x.png"
        screenshot = machine.screen.image.copy()
        assert screenshot.size == (160, 144)
        screenshot.save(native)
        screenshot.resize((640, 576), Image.Resampling.NEAREST).save(enlarged)
        observation = {"name": label, "frame": frame, "state": s,
                       "expectedVisibleText": expected,
                       "nativeScreenshot": str(native.relative_to(ROOT)),
                       "enlargedScreenshot": str(enlarged.relative_to(ROOT))}
        result["observations"].append(observation)
        if visible:
            assert s["win_pos_x"] == (80 if menu else 0), (
                f"{label}: expected {'menu' if menu else 'dialogue'} X, got {s['win_pos_x']}")
        assert s["LCDC"] & 2 == (0 if visible else 2), (
            f"{label}: LCDC sprite-enable wrong: {s['LCDC']:#04x}")
        return observation

    def tap(button):
        result["inputs"].append({"button": button, "frame": frame})
        machine.button_press(button)
        tick(2)
        machine.button_release(button)
        # Release and allow script dispatch before polling the reveal probes.
        tick(12)

    try:
        tick(120)
        capture("intro-1", expected="HOLLYWILD / ELF-MADE EMPIRE")
        for number in range(2, args.intro_pages + 1):
            tap("a")
            expected = {
                3: "PIP: Good news! / You own a garage. / Most is still / indoors.",
                4: "D-PAD: walk. / A: talk / confirm. / START: pocket book. / SELECT: city map. / B: cancel menus.",
                5: "First job? / Exit south. Look / right of the door / for the job board. / Or explore freely!",
            }.get(number)
            if args.intro_pages != 5 and number >= 4:
                expected = None
            capture(f"intro-{number}", expected=expected)
        tap("a")
        capture("intro-closed", visible=False)
        tap("start")
        capture("pocket-status-1", expected="COINS 100 / SCRAP 0 / CHEER 0")
        tap("a")
        capture("pocket-status-2", expected="Jobs done: 0 / Places found: 0/5")
        tap("a")
        capture("pocket-menu", menu=True, expected="Job / Guide / Crew / Cancel / Close / Story / Clues / Side")
        tap("down")
        capture("pocket-guide-selected", menu=True)
        tap("a")
        capture("guide-menu", menu=True, expected="Help / Music / Back")
        tap("down")
        capture("guide-music-selected", menu=True)
        tap("a")
        capture("music-explanation-1", expected="MUSIC / Original city / score. / Save at a / checkpoint")
        tap("a")
        capture("music-explanation-2", expected="to keep your / choice.")
        tap("a")
        capture("music-menu", menu=True, expected="Play / Mute / Back")
        tap("down")
        capture("music-mute-selected", menu=True)
        tap("a")
        capture("music-muted", expected="Music muted.")
        tap("a")
        capture("music-closed", visible=False)
        assert sha(rom) == digest, "ROM changed during test"
        result["status"] = "passed"
    except Exception as exc:
        result["status"] = "failed"
        result["error"] = f"{type(exc).__name__}: {exc}"
        machine.screen.image.save(OUT / "failure.png")
        raise
    finally:
        result["simulatedFrames"] = frame
        result["elapsedWallSeconds"] = round(time.monotonic() - started, 3)
        (OUT / "result.json").write_text(json.dumps(result, indent=2) + "\n")
        machine.stop(save=False)
        print(json.dumps({"status": result["status"], "romSha256": digest,
                          "observations": len(result["observations"]),
                          "result": str(OUT / "result.json")}))


if __name__ == "__main__":
    main()
