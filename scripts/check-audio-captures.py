#!/usr/bin/env python3
"""Check actual-ROM audio captures and provenance, not subjective music quality."""
import hashlib
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sha = hashlib.sha256((ROOT / "build/rom/hollywild.gbc").read_bytes()).hexdigest()
loops = {t['key']: t['loopSeconds'] for t in json.loads((ROOT / "content/soundtrack.json").read_text())['tracks']}
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
        assert duration > (2 if track == "muted" else loops[track] + 2)
        # Captures expand signed 8-bit APU samples into PCM16 without gain.
        # Detect the original positive rail too, not just PCM16 full scale.
        assert peak == 0 if track == "muted" else 0 < peak < 127 / 128
        silent = np.all(samples == 0, axis=1)
        edges = np.flatnonzero(np.diff(np.concatenate(([False], silent, [False]))))
        longest_silence = float(np.max(edges[1::2] - edges[::2], initial=0) / 48000)
        if track != "muted":
            # The new sparse passages intentionally breathe. Their longest
            # authored rest is under two seconds; longer gaps indicate dropout.
            assert longest_silence < 2.5, (track, longest_silence)
        report["captures"].append({"track": track, "seconds": round(duration, 3),
                                   "peakFullScale": round(peak, 6), "rmsFullScale": round(rms, 6),
                                   "longestSilentSeconds": round(longest_silence, 3)})
(ROOT / "test-results/audio-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
