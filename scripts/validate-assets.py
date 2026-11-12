#!/usr/bin/env python3
"""Independent asset and walkability checks for the authored city."""
import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BG_COLORS = {(7, 24, 33), (48, 104, 80), (134, 192, 108), (224, 248, 207)}
SPRITE_COLORS = {(7, 24, 33), (134, 192, 108), (224, 248, 207), (101, 255, 0)}


def main():
    manifest = json.loads((ROOT / "world-layout.json").read_text())
    scenes = {s["id"]: s for s in manifest["scenes"]}
    assert len(scenes) == len(manifest["scenes"]), "Duplicate scene ID"
    report = []
    for scene in scenes.values():
        img = Image.open(ROOT / "assets/backgrounds" / scene["background"]).convert("RGB")
        assert img.size == (scene["width"], scene["height"])
        assert img.width % 8 == img.height % 8 == 0
        assert set(img.get_flattened_data()) <= BG_COLORS, scene["id"] + ": invalid source shades"
        unique = {img.crop((x, y, x + 8, y + 8)).tobytes()
                  for y in range(0, img.height, 8) for x in range(0, img.width, 8)}
        assert len(unique) <= 256, scene["id"] + ": exceeds chosen art budget"
        width, height = img.width // 8, img.height // 8
        collision = scene["collisions"]
        assert len(collision) == width * height

        def free(x, y):
            return (0 <= x < width - 1 and 0 <= y < height - 1 and
                    all(collision[(y + dy) * width + x + dx] == 0
                        for dy in range(2) for dx in range(2)))

        start = (scene["spawn"]["x"], scene["spawn"]["y"])
        assert free(*start), scene["id"] + ": blocked spawn"
        pending, seen = deque([start]), {start}
        while pending:
            x, y = pending.popleft()
            for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if point not in seen and free(*point):
                    seen.add(point)
                    pending.append(point)
        for site in scene["sites"]:
            x, y = site["x"], site["y"]
            assert any(p in seen for p in ((x-2, y), (x+2, y), (x, y-2), (x, y+2))), (
                scene["id"], site["id"], "unapproachable interaction")
        for exit_ in scene["exits"]:
            target = scenes[exit_["destScene"]]
            tw = target["width"] // 8
            tx, ty = exit_["destX"], exit_["destY"]
            assert 0 <= tx < tw - 1 and 0 <= ty < target["height"] // 8 - 1
            assert all(target["collisions"][(ty+dy)*tw+tx+dx] == 0
                       for dy in range(2) for dx in range(2)), "Blocked transition destination"
            assert any(exit_["x"] <= x < exit_["x"] + exit_["width"] and
                       exit_["y"] <= y < exit_["y"] + exit_["height"]
                       for x, y in seen), (scene["id"], "unreachable exit", exit_)
        report.append({"scene": scene["id"], "uniqueBackgroundTiles": len(unique),
                       "reachablePlayerPositions": len(seen)})

    visited, pending = {"frostwick"}, deque(["frostwick"])
    while pending:
        current = pending.popleft()
        for exit_ in scenes[current]["exits"]:
            if exit_["destScene"] not in visited:
                visited.add(exit_["destScene"])
                pending.append(exit_["destScene"])
    assert visited == set(scenes), "City graph contains an unreachable scene"
    for path in (ROOT / "assets/sprites").glob("*.png"):
        img = Image.open(path).convert("RGB")
        assert img.height == 16 and img.width % 16 == 0, path.name
        assert set(img.get_flattened_data()) <= SPRITE_COLORS, path.name + ": invalid sprite colors"
    print(json.dumps({"passed": True, "scenes": report}, indent=2))


if __name__ == "__main__":
    main()
