#!/usr/bin/env python3
"""Mix nonzero campaign and side progress using actual ROM button input only."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
campaign = json.loads((ROOT / 'content/campaign.json').read_text())
tracks = json.loads((ROOT / 'content/side-stories.json').read_text())['tracks']
layout = json.loads((ROOT / 'world-layout.json').read_text())
aliases = {'candy_row': 'candy', 'velvet_heights': 'velvet', 'aurora_yard': 'aurora'}
locations = {site['node']: {'scene': aliases.get(scene['id'], scene['id']), 'actor': site['id']}
             for scene in layout['scenes'] for site in scene['sites'] if site['type'] == 'campaign_node'}
courier = next(t for t in tracks if t['id'] == 'courier')
other = next(t for t in tracks if t['kind'] == 'arc' and t['id'] != 'courier')
commands = []
expected = dict(coins=100, salvage=0, cycles=0, job=0, deliveries=0, salvage_runs=0,
                cocoa=0, parcel=0, toolworks=0, flats=0, workshop=0,
                story_mission=0, story_step=0, story_completed=0, story_ending=0,
                festival=0, aurora=0)
for m in campaign['missions']:
    for step in m['steps']:
        if 'choiceKey' in step:
            expected['story_' + step['choiceKey']] = 0
for lore in campaign['lore']:
    expected['lore_' + lore['id']] = 0
for track in tracks:
    for field in ('mission', 'step'):
        expected[f'side_{track["id"]}_{field}'] = 0
    if any(s['type'] == 'choice' for m in track['missions'] for s in m['steps']):
        expected[f'side_{track["id"]}_choice'] = 0
    if track.get('perk'):
        expected[track['perk']] = 0


def add(**command):
    commands.append(command)


def check():
    add(**{'assert': dict(expected)})


def select(track, node=None, journal=False):
    if journal:
        add(tap='start', frames=200, read=True)
        add(choose=8)
        available = [t for t in tracks if t['kind'] == track['kind']]
    else:
        add(interact={'scene': node, 'actor': 'side_' + node})
        available = [t for t in tracks if t['kind'] == track['kind'] and
                     (t['home'] == node or any(s['node'] == node for m in t['missions'] for s in m['steps']))]
    add(choose=['arc', 'encounter', 'project'].index(track['kind']) + 1)
    add(choose=[t['id'] for t in available].index(track['id']) + 1)


def begin(track):
    select(track, track['home'])
    add(choose=1)
    expected[f'side_{track["id"]}_mission'] = 1
    check()


def side_step(track, index):
    mission = track['missions'][0]
    step = mission['steps'][index]
    select(track, step['node'])
    if step['type'] in ('puzzle', 'choice'):
        check()
        add(choose=step['answer'] if step['type'] == 'puzzle' else 2)
        if step['type'] == 'choice':
            expected[f'side_{track["id"]}_choice'] = 2
    expected[f'side_{track["id"]}_step'] = index + 1
    if index == len(mission['steps']) - 1:
        expected[f'side_{track["id"]}_mission'] = 2
        expected[f'side_{track["id"]}_step'] = 0
        expected['coins'] += mission['reward']['coins']
        expected['salvage'] += mission['reward']['salvage']
    check()


def main_step(index):
    mission = campaign['missions'][0]
    step = mission['steps'][index]
    add(interact=locations[step['node']])
    if step['type'] in ('puzzle', 'choice'):
        check()
        selected = step['answer'] if step['type'] == 'puzzle' else 1
        add(choose=selected)
        if step['type'] == 'choice':
            expected['story_' + step['choiceKey']] = step.get('choiceValues', list(range(1, len(step['options']) + 1)))[selected - 1]
    expected['story_step'] = index + 1
    if index == len(mission['steps']) - 1:
        expected.update(story_mission=2, story_step=0, story_completed=1)
        expected['coins'] += mission['reward']['coins']
        expected['salvage'] += mission['reward']['salvage']
    check()


def save_reload():
    add(interact={'scene': 'garage', 'actor': 'save'})
    add(choose=1)
    add(restart=True, read=True)
    add(choose=1)
    check()


add(read=True)
check()
add(interact={'scene': 'garage', 'actor': 'campaign_desk'})
add(choose=1)
expected['story_mission'] = 1
check()
main_step(0)
main_step(1)
begin(courier)
side_step(courier, 0)
begin(other)
side_step(other, 0)
# Preserve nonzero progress in all three independent state machines.
save_reload()
main_step(2)
side_step(courier, 1)
side_step(other, 1)
main_step(3)
side_step(courier, 2)
main_step(4)
side_step(courier, 3)
# Persist the nondefault side choice while the main mission remains active.
save_reload()
main_step(5)
side_step(courier, 4)
# Both first-mission payouts happened exactly once; the other side track stays
# partially complete and all ordinary job counters and property flags stay zero.
for track in (courier, other):
    select(track, journal=True)
    check()
add(tap='start', frames=200, read=True)
add(choose=6)
check()
save_reload()
add(capture='side-interleave.png')
add(stop=True)
output = ROOT / 'tests/side-interleave.jsonl'
output.write_text(''.join(json.dumps(c) + '\n' for c in commands))
print(f'{output.name}: {len(commands)} commands, {sum("assert" in c for c in commands)} checkpoints')
