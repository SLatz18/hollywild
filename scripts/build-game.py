#!/usr/bin/env python3
"""Compile an editable GB Studio project into a genuine Game Boy Color ROM.

Uses the project's local, pinned official GB Studio CLI. This is not an
alternative game engine. No browser export or device flashing is performed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / ".tools" / "gb-studio"
CLI = STUDIO / "out" / "cli" / "gb-studio-cli.js"
PIN = "ccb891b2670134ba8237416772eea4ed09d34e1e"
ENGINE = STUDIO / "appData" / "engine" / "gbvm"
ENGINE_PIN = "bd6f41cc5e05cbe6601dcc7f8e2db89bed527fe3"
LOGO = bytes.fromhex(
    "CEED6666CC0D000B03730083000C000D"
    "0008111F8889000EDCCC6EE6DDDDD999"
    "BBBB67636E0EECCCDDDC999FBBB9333E"
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def authored_snapshot(folder: Path) -> dict[str, str]:
    # Only authored GB Studio inputs participate. Repository docs and live agent
    # state are unrelated to the build and may legitimately change concurrently.
    files = list(folder.glob("*.gbsproj")) + list(folder.glob("*.gbsres"))
    for resource_dir in ("project", "assets", "plugins"):
        base = folder / resource_dir
        if base.is_dir():
            files.extend(path for path in base.rglob("*") if path.is_file())
    return {
        str(path.relative_to(folder)): digest(path)
        for path in sorted(files)
    }


def generation_snapshot() -> dict[str, str]:
    paths = ["scripts/create-assets.py", "scripts/create-game.mjs", "scripts/campaign-events.mjs",
             "world-layout.json", "content/campaign.json"]
    return {name: digest(ROOT / name) for name in paths if (ROOT / name).is_file()}


def inspect_rom(path: Path) -> dict:
    data = path.read_bytes()
    if len(data) < 0x150:
        raise ValueError("Compiler output is too short to contain a cartridge header")
    if data[0x104:0x134] != LOGO:
        raise ValueError("Invalid Nintendo logo in compiled cartridge header")
    header_sum = 0
    for byte in data[0x134:0x14D]:
        header_sum = (header_sum - byte - 1) & 0xFF
    if header_sum != data[0x14D]:
        raise ValueError("Compiled cartridge header checksum does not match")
    global_sum = (sum(data[:0x14E]) + sum(data[0x150:])) & 0xFFFF
    stored_sum = int.from_bytes(data[0x14E:0x150], "big")
    if global_sum != stored_sum:
        raise ValueError("Compiled cartridge global checksum does not match")
    size_code = data[0x148]
    expected_size = 32768 << size_code if size_code <= 8 else None
    if expected_size is not None and len(data) != expected_size:
        raise ValueError("Compiled ROM size differs from its header")
    return {
        "bytes": len(data),
        "sha256": digest(path),
        "title": data[0x134:0x143].split(b"\0")[0].decode("ascii", "replace"),
        "cgb_flag": f"0x{data[0x143]:02X}",
        "cartridge_type": f"0x{data[0x147]:02X}",
        "rom_size_code": size_code,
        "ram_size_code": data[0x149],
        "header_checksum_valid": True,
        "global_checksum_valid": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", nargs="?", help="Project .gbsproj path")
    parser.add_argument("--output", default="build/rom/hollywild.gbc")
    parser.add_argument("--allow-monochrome", action="store_true", help="Only for upstream template probes")
    args = parser.parse_args()
    candidates = list(ROOT.glob("*.gbsproj")) + list((ROOT / "game").glob("*.gbsproj"))
    project = Path(args.project).resolve() if args.project else (candidates[0] if len(candidates) == 1 else None)
    if project is None or not project.is_file() or project.suffix != ".gbsproj":
        parser.error("Supply one existing .gbsproj file; default searches the repository root and game/*.gbsproj")
    if not project.is_relative_to(ROOT):
        parser.error("The authored project must be inside this repository")
    output = (ROOT / args.output).resolve()
    if not output.is_relative_to(ROOT / "build"):
        parser.error("Generated cartridges must be written inside build/")
    tracked = subprocess.run(["git", "ls-files", "--error-unmatch", str(output.relative_to(ROOT))], cwd=ROOT, capture_output=True)
    if tracked.returncode == 0:
        parser.error("Refusing to replace a tracked cartridge")
    if not CLI.is_file():
        parser.error("Local official GB Studio CLI is missing at .tools/gb-studio/out/cli/gb-studio-cli.js")
    actual_ref = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=STUDIO, text=True).strip()
    if actual_ref != PIN:
        parser.error(f"Expected GB Studio 4.3.2 commit {PIN}, found {actual_ref}")
    engine_ref = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ENGINE, text=True).strip()
    if engine_ref != ENGINE_PIN:
        parser.error(f"Expected GBVM commit {ENGINE_PIN}, found {engine_ref}")
    for checkout in (STUDIO, ENGINE):
        changes = subprocess.check_output(
            ["git", "status", "--porcelain", "--untracked-files=no"], cwd=checkout, text=True
        ).strip()
        if changes:
            parser.error(f"Tracked toolchain source has local changes in {checkout.name}")
    node = shutil.which("node")
    if not node:
        parser.error("Node.js is required")

    before = authored_snapshot(project.parent)
    generation_before = generation_snapshot()
    output.parent.mkdir(parents=True, exist_ok=True)
    # GBDK's subprocess commands cannot safely compile beneath a space-bearing
    # temp path. Use a unique short scratch root; authored paths remain unchanged.
    # Unique roots also isolate concurrent builds and stale debug artifacts.
    temporary = Path(tempfile.mkdtemp(prefix="hollywild-native-", dir="/private/tmp"))
    env = dict(os.environ, TMPDIR=str(temporary), TMP=str(temporary), TEMP=str(temporary))
    produced = temporary / output.name
    command = [node, str(CLI), "make:rom", str(project), str(produced), "--verbose"]
    print(f"Building native cartridge from {project.relative_to(ROOT)}", flush=True)
    log_path = output.parent / "build.log"
    with log_path.open("w") as log:
        result = subprocess.run(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    after = authored_snapshot(project.parent)
    if before != after or generation_before != generation_snapshot():
        print("ERROR: Authored project files changed during compilation. Outputs were not promoted.", file=sys.stderr)
        return 1
    if result.returncode != 0 or not produced.is_file():
        print(log_path.read_text()[-12000:], file=sys.stderr)
        print(f"Native build failed; full log: {log_path}", file=sys.stderr)
        return 1
    rom = inspect_rom(produced)
    if not args.allow_monochrome and rom["cgb_flag"] != "0xC0":
        raise ValueError(f"Expected Color Only project, received CGB flag {rom['cgb_flag']}")

    build_rom_dir = temporary / "_gbsbuild" / "build" / "rom"
    debug_dir = output.parent / "debug" / rom["sha256"][:16]
    debug_dir.mkdir(parents=True, exist_ok=True)
    debug_files = {}
    if build_rom_dir.is_dir():
        for source in sorted(build_rom_dir.iterdir()):
            if source.is_file() and source.suffix in {".noi", ".sym", ".map", ".cdb", ".i"}:
                dest = debug_dir / source.name
                shutil.copy2(source, dest)
                debug_files[str(dest.relative_to(ROOT))] = digest(dest)
    shutil.copy2(produced, output)
    manifest = {
        "project": str(project.relative_to(ROOT)),
        "rom": str(output.relative_to(ROOT)),
        "gb_studio_version": "4.3.2",
        "gb_studio_commit": actual_ref,
        "gbvm_commit": engine_ref,
        "tracked_toolchain_source_clean": True,
        "cli_sha256": digest(CLI),
        "node_version": subprocess.check_output([node, "--version"], text=True).strip(),
        "authored_files_unchanged": True,
        "authored_sha256": before,
        "generation_sha256": generation_before,
        "cartridge": rom,
        "debug_artifacts_sha256": debug_files,
        "runtime_test_status": "Not established by compilation or header inspection",
    }
    (output.parent / "build-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"rom": manifest["rom"], "cartridge": rom, "debug_artifacts": list(debug_files)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
