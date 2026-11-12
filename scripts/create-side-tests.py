#!/usr/bin/env python3
"""Generate independent real-ROM side walkthroughs using only button commands.

The authored locations supply routing and intended puzzle solutions. This checks
runtime progression and accounting, not independent editorial clue quality.
Every scenario boots fresh, earns resources in play, buys properties at signs,
and reads state without writing emulator memory.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'content/side-stories.json').read_text())
TRACKS = DATA['tracks']
KINDS = ['arc', 'encounter', 'project']
ALIASES = {'candy_row': 'candy', 'velvet_heights': 'velvet', 'aurora_yard': 'aurora'}
LAYOUT = json.loads((ROOT / 'world-layout.json').read_text())
PROPERTIES = {}
for scene in LAYOUT['scenes']:
    for site in scene['sites']:
        if site['type'] == 'property':
            key = {'cocoa': 'cocoa', 'parcel_palace': 'parcel', 'toolworks': 'toolworks', 'lantern_flats': 'flats'}[site['id']]
            PROPERTIES[key] = {'scene': ALIASES.get(scene['id'], scene['id']), 'actor': site['id']}

for path in (1, 2):
    commands = []
    # GB Studio omits never-referenced choice globals for tracks without a choice.
    # Observe only real compiled state; do not manufacture values for those slots.
    side = {f'side_{t["id"]}_{field}': 0 for t in TRACKS for field in
            (('mission', 'step', 'choice') if any(s['type'] == 'choice' for m in t['missions'] for s in m['steps'])
             else ('mission', 'step'))}
    perks = {t['perk']: 0 for t in TRACKS if t.get('perk')}
    owned = dict.fromkeys(('cocoa', 'parcel', 'toolworks', 'flats'), 0)
    economy = {'coins': 100, 'salvage': 0, 'cycles': 0, 'deliveries': 0, 'salvage_runs': 0, 'job': 0}
    campaign = json.loads((ROOT / 'content/campaign.json').read_text())
    main_keys = {'story_mission', 'story_step', 'story_completed', 'story_ending', 'festival', 'aurora'}
    main_keys.update('story_' + s['choiceKey'] for m in campaign['missions'] for s in m['steps'] if 'choiceKey' in s)
    main_keys.update('lore_' + lore['id'] for lore in campaign['lore'])
    main = dict.fromkeys(sorted(main_keys), 0)

    def add(**kw):
        commands.append(kw)

    def check(**extra):
        add(**{'assert': {**main, **side, **perks, **owned, **economy, **extra}})

    def interact(scene, actor):
        add(interact={'scene': scene, 'actor': actor})

    def pocket(index):
        add(tap='start', frames=200, read=True)
        add(choose=index)

    def select(track, node=None, journal=False):
        if journal:
            pocket(8)
            eligible = [t for t in TRACKS if t['kind'] == track['kind']]
        else:
            interact(node, 'side_' + node)
            eligible = [t for t in TRACKS if t['kind'] == track['kind'] and
                        (t['home'] == node or any(s['node'] == node for m in t['missions'] for s in m['steps']))]
        add(choose=KINDS.index(track['kind']) + 1)
        add(choose=[t['id'] for t in eligible].index(track['id']) + 1)

    def save_reload():
        interact('garage', 'save')
        add(choose=1)
        add(restart=True, read=True)
        add(choose=1)
        check()

    def job(delivery=False):
        interact('frostwick', 'frostwick_board')
        add(choose=2 if delivery else 1)
        economy['job'] = 2 if delivery else 1
        check()
        if delivery:
            interact('frostwick', 'cocoa')
            economy['coins'] += 20 + 5 * perks.get('perk_courier', 0)
            economy['deliveries'] += 1
        else:
            interact('frostwick', 'salvage')
            interact('frostwick', 'bonus_cache')
            interact('frostwick', 'frostwick_board')
            add(choose=3)
            economy['salvage'] += (14 if economy['salvage_runs'] == 0 else 8) + perks.get('perk_rivals', 0)
            economy['salvage_runs'] += 1
        economy['coins'] += 16 * owned['cocoa'] + 20 * owned['parcel']
        economy['coins'] += sum(perks.get(key, 0) * n for key, n in
                                [('perk_cocoa', 4), ('perk_parcel', 6), ('perk_flats', 3)])
        economy['salvage'] += 2 * owned['toolworks'] + perks.get('perk_toolworks', 0)
        economy['cycles'] += 1
        economy['job'] = 0
        check()

    add(read=True)
    check()
    # Journal inspection cannot start any track, including owned-property work.
    for track in TRACKS:
        select(track, journal=True)
        check()
    if path == 1:
        # Every ownership gate is exercised before earning or buying anything.
        for track in TRACKS:
            if track.get('requires'):
                select(track, track['home'])
                check()
        # Both menu B paths close without changing any track.
        interact('garage', 'side_garage')
        add(choose=0)
        check()
        pocket(8)
        add(choose=1)
        add(choose=0)
        check()

    # Begin two independent stories before progressing either one.
    started = set()
    for track in [t for t in TRACKS if not t.get('requires')][:2]:
        select(track, track['home'])
        if path == 1:
            add(choose=0)
            check()
            select(track, track['home'])
        add(choose=1)
        side[f'side_{track["id"]}_mission'] = 1
        started.add(track['id'])
        check()
    save_reload()

    for ti, track in enumerate(TRACKS):
        tid = track['id']
        prefix = 'side_' + tid + '_'
        if track.get('requires'):
            key = track['requires']
            cost, scrap = {'cocoa': (100, 4), 'parcel': (260, 8), 'toolworks': (220, 8), 'flats': (240, 8)}[key]
            cost -= 20 * perks.get('perk_listing', 0)
            while economy['coins'] < cost:
                job(delivery=True)
            while economy['salvage'] < scrap:
                job()
            interact(**PROPERTIES[key])
            add(choose=1)
            economy['coins'] -= cost
            economy['salvage'] -= scrap
            owned[key] = 1
            check()
        if tid not in started:
            select(track, track['home'])
            add(choose=1)
            side[prefix + 'mission'] = 1
            check()
            if track.get('requires'):
                add(capture=track['requires'] + '-before.png')
        for mi, mission in enumerate(track['missions'], 1):
            blocked = path == 1 and ti == 0 and mi == 1
            if blocked:
                interact('frostwick', 'frostwick_board')
                add(choose=1)
                economy['job'] = 1
                check()
            for si, step in enumerate(mission['steps']):
                if path == 1 and si == 0:
                    other_nodes = {track['home']} | {s['node'] for m in track['missions'] for s in m['steps']}
                    wrong_node = next((n for n in sorted(other_nodes) if n != step['node']), None)
                    if wrong_node:
                        select(track, wrong_node)
                        check()
                select(track, step['node'])
                if step['type'] in ('puzzle', 'choice'):
                    check()
                    if path == 1:
                        add(choose=0)
                        check()
                        select(track, step['node'])
                        if step['type'] == 'puzzle':
                            add(choose=step['answer'] % len(step['options']) + 1)
                            check()
                            select(track, step['node'])
                    selected = step['answer'] if step['type'] == 'puzzle' else min(path, len(step['options']))
                    add(choose=selected)
                    if step['type'] == 'choice':
                        side[prefix + 'choice'] = selected
                side[prefix + 'step'] = si + 1
                if si == len(mission['steps']) - 1:
                    if blocked:
                        check()
                        select(track, journal=True)
                        check()
                        pocket(4)
                        add(choose=1)
                        economy['job'] = 0
                        check()
                        save_reload()  # Pending payout survives saving and reboot.
                        select(track, journal=True)
                    economy['coins'] += mission['reward']['coins']
                    economy['salvage'] += mission['reward']['salvage']
                    side[prefix + 'mission'] = mi + 1
                    side[prefix + 'step'] = 0
                    if mi == len(track['missions']) and track.get('perk'):
                        perks[track['perk']] = 1
                check()
                if path == 1 and mi == 1 and si == 0:
                    select(track, journal=True)
                    check()
            # Completed track inspections must never duplicate rewards.
            if mi == len(track['missions']):
                select(track, track['home'])
                check()
                select(track, journal=True)
                check()
        if track['kind'] == 'project':
            add(capture=track['requires'] + '-after.png')
            job(delivery=True)  # Exercises purchased and improved property income.
        save_reload()

    # Exercise courier, rivals and all property improvements together.
    job()
    job(delivery=True)
    # Five districts and four purchases grant25 Cheer; neighbors doubles
    # the next donation's normal one-Cheer benefit.
    while economy['coins'] < 100:
        job(delivery=True)
    for district in ('frostwick', 'candy', 'brassworks', 'velvet', 'aurora'):
        add(travel=district)
    check(cheer=25)
    interact('frostwick', 'frostwick_board')
    add(choose=6)
    add(choose=1)
    economy['coins'] -= 100
    check(cheer=27)
    add(capture=f'side-path-{path}.png')
    check()
    add(stop=True)
    output = ROOT / 'tests' / f'side-path-{path}.jsonl'
    output.write_text(''.join(json.dumps(c) + '\n' for c in commands))
    print(f'{output.name}: {len(commands)} commands, {sum("assert" in c for c in commands)} checkpoints')
