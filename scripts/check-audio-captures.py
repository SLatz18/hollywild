#!/usr/bin/env python3
"""Check actual-ROM audio captures and provenance, not subjective music quality."""
import hashlib
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sha = hashlib.sha256((ROOT / "build/rom/hollywild.gbc").read_bytes()).hexdigest()
report = {"romSha256": sha, "passed": True, "captures": [],
          "limit": "Signal and routing checks, not a listening review or hardware test."}
for directory, tracks in (
    ("audio-final", ["garage", "frostwick", "candy", "brassworks", "velvet", "aurora", "muted"]),
    ("audio-finale-final", ["finale"]),
):
    folder = ROOT / "test-results" / directory
    trace = json.loads((folder / "emulator-session.json").read_text())
    assert trace["romSha256"] == sha, "Audio capture belongs to another ROM"
    assert trace["commands"] and all(c["passed"] for c in trace["commands"])
    for track in tracks:
        with wave.open(str(folder / (track + ".wav"))) as stream:
            assert (stream.getnchannels(), stream.getsampwidth(), stream.getframerate()) == (2, 2, 48000)
            samples = np.frombuffer(stream.readframes(stream.getnframes()), dtype="<i2").reshape(-1, 2).astype(float) / 32768
        duration = len(samples) / 48000
        peak = float(np.max(np.abs(samples)))
        rms = float(np.sqrt(np.mean(samples ** 2)))
        assert duration > (90 if track == "finale" else 2 if track == "muted" else 7)
        assert peak == 0 if track == "muted" else 0 < peak < 1
        if track == "finale":
            # The ~77-second order list must produce sound beyond its first loop.
            assert all(np.any(samples[n:n + 48000]) for n in range(0, len(samples) - 48000, 48000))
        report["captures"].append({"track": track, "seconds": round(duration, 3),
                                   "peakFullScale": round(peak, 6), "rmsFullScale": round(rms, 6)})
(ROOT / "test-results/audio-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
