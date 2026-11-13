#!/usr/bin/env python3
"""Run native-source checks and button-driven regressions on one exact ROM."""
import hashlib
import json
import os
import time
import uuid
from pathlib import Path
import shutil
import subprocess
import sys

SUITE_STARTED = time.perf_counter()
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "test-results"
OUT.mkdir(exist_ok=True)
manifest = json.loads((ROOT / "build/rom/build-manifest.json").read_text())
rom = ROOT / manifest["rom"]
expected = manifest["cartridge"]["sha256"]
assert hashlib.sha256(rom.read_bytes()).hexdigest() == expected, "ROM differs from manifest"
for filename, digest in manifest.get("generation_sha256", {}).items():
    assert hashlib.sha256((ROOT / filename).read_bytes()).hexdigest() == digest, f"Build source changed: {filename}"
report = {"romSha256": expected, "checks": [], "replays": [], "passed": True,
          "timingNote": "Automated wall time and simulated frames are measured separately; neither estimates human pacing."}
for runtime, name in ((sys.executable, "validate-assets.py"), (sys.executable, "check-native-source.py"),
                      ("node", "check-campaign.mjs"), ("node", "check-side.mjs"),
                      ("node", "check-side-economy.mjs"), ("node", "check-dialogue.mjs"),
                      ("node", "check-challenges.mjs")):
    check_started = time.perf_counter()
    result = subprocess.run([runtime, str(ROOT / "scripts" / name)], cwd=ROOT,
                            capture_output=True, text=True)
    (OUT / (name + ".log")).write_text(result.stdout + result.stderr)
    report["checks"].append({"name": name, "passed": result.returncode == 0,
                             "elapsedWallSeconds": round(time.perf_counter() - check_started, 6)})
    report["passed"] &= result.returncode == 0
    print(f"{name}: {'PASS' if result.returncode == 0 else 'FAIL'}", flush=True)

for commands in sorted((ROOT / "tests").glob("*.jsonl")):
    # Each process starts with blank cartridge RAM. A restart command carries
    # only that scenario's RAM, without relying on another scenario's save.
    log = OUT / (commands.stem + ".log")
    trace_path = OUT / "emulator-session.json"
    trace_path.unlink(missing_ok=True)
    run_id = str(uuid.uuid4())
    replay_started = time.perf_counter()
    with commands.open() as stdin, log.open("w") as stdout:
        result = subprocess.run([sys.executable, str(ROOT / "scripts/emulator-qa.py")],
                                cwd=ROOT, stdin=stdin, stdout=stdout, stderr=subprocess.STDOUT,
                                env={**os.environ, "HOLLYWILD_QA_RUN_ID": run_id})
    entry = {"name": commands.name, "passed": result.returncode == 0,
             "runId": run_id, "elapsedWallSeconds": round(time.perf_counter() - replay_started, 6)}
    trace_path = OUT / "emulator-session.json"
    if trace_path.exists():
        trace = json.loads(trace_path.read_text())
        completed = trace.get("commands", [])
        expected_commands = [json.loads(line) for line in commands.read_text().splitlines() if line.strip()]
        expected_count = len(expected_commands)
        entry["commands"] = len(completed)
        entry["assertionCheckpoints"] = sum(
            isinstance(c.get("input"), dict) and "assert" in c["input"] for c in completed
        )
        entry["emulatorElapsedWallSeconds"] = trace.get("elapsedWallSeconds")
        entry["simulatedFrames"] = trace.get("simulatedFrames")
        entry["passed"] &= (trace.get("runId") == run_id
                            and trace.get("romSha256") == expected
                            and len(completed) == expected_count
                            and [c.get("input") for c in completed] == expected_commands
                            and all(c.get("passed") for c in completed))
        shutil.copyfile(trace_path, OUT / (commands.stem + "-result.json"))
    else:
        entry["passed"] = False
    report["replays"].append(entry)
    report["passed"] &= entry["passed"]
    print(f"{commands.name}: {'PASS' if entry['passed'] else 'FAIL'}", flush=True)

report["passed"] &= hashlib.sha256(rom.read_bytes()).hexdigest() == expected
report["buildInputsUnchanged"] = all(
    (ROOT / filename).is_file() and hashlib.sha256((ROOT / filename).read_bytes()).hexdigest() == digest
    for table in ("authored_sha256", "generation_sha256")
    for filename, digest in manifest.get(table, {}).items()
)
report["passed"] &= report["buildInputsUnchanged"]
report["elapsedWallSeconds"] = round(time.perf_counter() - SUITE_STARTED, 6)
report["simulatedFrames"] = sum(r.get("simulatedFrames") or 0 for r in report["replays"])
(OUT / "regression-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
sys.exit(0 if report["passed"] else 1)
