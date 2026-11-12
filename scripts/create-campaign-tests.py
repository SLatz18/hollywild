#!/usr/bin/env python3
"""Create real-button campaign walkthroughs from authored objective locations.

The story data supplies locations and intended solutions. Independent editorial
review must establish that clues actually support those solutions. These tests
establish runtime progress, retries, accounting, persistence and all endings.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
campaign = json.loads((ROOT / "content/campaign.json").read_text())
layout = json.loads((ROOT / "world-layout.json").read_text())
aliases = {"candy_row": "candy", "velvet_heights": "velvet", "aurora_yard": "aurora"}
locations, checkpoints = {}, {}
desk = None
for scene in layout["scenes"]:
    name = aliases.get(scene["id"], scene["id"])
    for site in scene["sites"]:
        target = {"scene": name, "actor": site["id"]}
        if site["type"] == "campaign_node":
            locations[site["node"]] = target
        elif site["type"] == "campaign_save":
            checkpoints[name] = target
        elif site["type"] == "campaign_desk":
            desk = target
assert desk

for ending in (1, 2, 3):
    commands = []
    def add(**command):
        commands.append(command)
    def check(**expected):
        add(**{"assert": expected})
    def actor(target):
        add(interact=target)
    def pocket(index):
        add(tap="start", frames=200, read=True)
        add(choose=index)

    add(read=True)
    check(coins=100, salvage=0, story_mission=0, story_completed=0)
    # A future quest object remains publicly inspectable without advancing it.
    optional = campaign["lore"][0]
    actor(locations[optional["node"]])
    check(story_mission=0, **{"lore_" + optional["id"]: 1})
    actor(desk)
    add(choose=0)
    check(story_mission=0)
    actor(desk)
    add(choose=1)
    check(story_mission=1, story_step=0, story_completed=0)
    pocket(7)
    check(story_mission=1, story_step=0, story_completed=0, coins=100, salvage=0)
    if ending == 1:
        # A repeatable job deliberately blocks the first story payout, without
        # losing story evidence. No development cheats or inventory injection.
        actor({"scene": "frostwick", "actor": "frostwick_board"})
        add(choose=1)
        check(job=1, cycles=0)

    coins, salvage, remembered = 100, 0, {}
    for mission in campaign["missions"]:
        number = mission["id"]
        for index, step in enumerate(mission["steps"]):
            target = locations[step["node"]]
            actor(target)
            if step["type"] in ("puzzle", "choice"):
                check(story_mission=number, story_step=index)
                if ending == 1:
                    add(choose=0)
                    check(story_mission=number, story_step=index, coins=coins, salvage=salvage)
                    actor(target)
                    if step["type"] == "puzzle":
                        wrong = step["answer"] % len(step["options"]) + 1
                        add(choose=wrong)
                        check(story_mission=number, story_step=index, coins=coins, salvage=salvage)
                        actor(target)
                if step["type"] == "puzzle":
                    selected = step["answer"]
                else:
                    selected = ending if step["choiceKey"] == "ending" else min(ending, len(step["options"]))
                    remembered["story_" + step["choiceKey"]] = step.get("choiceValues", list(range(1, len(step["options"]) + 1)))[selected - 1]
                add(choose=selected)
            final = index == len(mission["steps"]) - 1
            if not final:
                check(story_mission=number, story_step=index + 1, story_completed=number - 1,
                      coins=coins, salvage=salvage, **remembered)
                if ending == 1 and index == 1:
                    pocket(7)
                    check(story_mission=number, story_step=index + 1, story_completed=number - 1,
                          coins=coins, salvage=salvage, **remembered)
            elif ending == 1 and number == 1:
                check(story_mission=1, story_step=len(mission["steps"]), story_completed=0,
                      job=1, coins=100, salvage=0, cycles=0)
                pocket(7)
                check(story_mission=1, story_step=len(mission["steps"]), story_completed=0,
                      job=1, coins=100, salvage=0, cycles=0)
                pocket(4)
                add(choose=1)
                check(job=0, coins=100, salvage=0, cycles=0)
                pocket(6)
            if final:
                coins += mission["reward"]["coins"]
                salvage += mission["reward"]["salvage"]
                check(story_mission=number + 1, story_step=0, story_completed=number,
                      coins=coins, salvage=salvage, cycles=0, **remembered)
                # When the next objective differs, repeating this completed
                # objective must not pay or advance the new mission.
                next_mission = campaign["missions"][number] if number < 24 else None
                if next_mission is None or next_mission["steps"][0]["node"] != step["node"]:
                    actor(target)
                    check(story_mission=number + 1, story_step=0, coins=coins, salvage=salvage, cycles=0)
                if ending == 1 and number in (4, 8, 12, 16, 20, 24):
                    actor(checkpoints[target["scene"]])
                    add(choose=1)
                    add(restart=True, read=True)
                    add(choose=1)
                    check(story_mission=number + 1, story_step=0, story_completed=number,
                          coins=coins, salvage=salvage, **remembered,
                          **{"lore_" + optional["id"]: 1})

    check(story_mission=25, story_completed=24, story_ending=ending, festival=1, aurora=1,
          cheer=100, cycles=0, coins=coins, salvage=salvage)
    add(travel="garage")
    check(scene="garage", story_completed=24, coins=coins, salvage=salvage)
    add(capture=f"campaign-ending-{ending}.png")
    add(stop=True)
    output = ROOT / "tests" / f"campaign-ending-{ending}.jsonl"
    output.write_text("".join(json.dumps(command) + "\n" for command in commands))
    print(f"{output.name}: {len(commands)} commands, {sum('assert' in c for c in commands)} checkpoints")
