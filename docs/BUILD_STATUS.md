# Native prototype status

Version 0.2.0 prototype, checked November 12, 2026. This report describes the tested cartridge, not the entire campaign design. [Previous prototype evidence](history/v0.1.0-prototype.md).

## Build identity

- Project: `hollywild.gbsproj`, native GB Studio 4.3.2 resources.
- Target: Game Boy Color only, intended for ModRetro Chromatic.
- Cartridge: 262,144 bytes, MBC5 with RAM and battery, 32 KB save RAM.
- ROM SHA-256: `1e96c98a82546b88e6263eaf866d9a245dc978a08246389ce8f4ea489085681d`.
- Official GB Studio source: `ccb891b2670134ba8237416772eea4ed09d34e1e`.
- GBVM engine: `bd6f41cc5e05cbe6601dcc7f8e2db89bed527fe3`.

The compiler completed with authored files unchanged during compilation. An independent cartridge parser verified the native logo, color flag, ROM size, header checksum, and global checksum. Tool binaries and builds are local outputs. Rebuilding is not promised to produce identical bytes or compatible saves.

## Implemented

Five freely connected districts, a garage, and four enterable property interiors: Cocoa Corner, Parcel Palace, Tinsel Toolworks, and Lantern Flats. All interiors are publicly inspectable before purchase. The native project contains ten scenes and forty interaction sites.

Systems include five one-time neighborhood commissions, walking and collisions, route guidance, job boards, repeatable salvage and delivery jobs, optional bonus salvage, workshop production, four property purchases, a restoration objective, basic sound effects, and manual garage saves.

Rivet can make goods (2 surplus scrap for 30 Coins while protecting 4 scrap), recycle (2 scrap without an input), or run deliveries (10 Coins without an input). Role changes are available between jobs; dispatch records the chosen role. Work/Rest controls whether production occurs. Local commissions pay 25 Coins and 2 scrap each, once, without advancing production.

Property ownership changes the sign to a check flag. Public streets have no story locks. Crew production resolves on successful jobs; walking and cancelling do not advance it. Job crates and parcel stops in other districts are valid alternatives to the suggested opening route.

## Executed checks

PyBoy 2.6.1 ran the actual ROM with button inputs. Matching-build symbols were read to verify state. The tests did not write game memory or restore emulator save states. Test cartridge RAM starts blank and is retained only for the explicit restart check.

| Check | Result and scope |
| --- | --- |
| Native asset validation | All ten scenes passed dimensions, allowed source colors, selected tile budget, approachability, safe destinations, and graph connectivity |
| Native resource checks | 112 resources, 43 variables, and 2,213 events passed reference, ID, and menu checks; five checker corruption tests passed |
| Commissions regression | 224 commands, 45 checkpoints passed; all four interiors and five commissions, preaccept collection guard, repeat guards, and saved completion flags |
| Crew roles regression | 240 commands, 47 checkpoints passed; recycler and runner payouts, saved role, active-job role-change rejection, and cancellation |
| Opening regression | 177 commands, 33 assertion checkpoints passed |
| Fresh-game free roam | 40 commands, 10 assertion checkpoints passed; visited every district and completed east and west loops with no workshop or property purchases |
| Shortcuts | Frostwick/Brassworks, Candy/Velvet, Frostwick/Aurora connections exercised both ways |
| Opening economy | Banked salvage, repaired workshop, delivered parcel, purchased Cocoa, received Cocoa income |
| Repeat ownership interaction | No second purchase or duplicated reward |
| Cancellation | Repeat salvage carried 6 scrap; cancel returned to zero carried with stored supplies, Coins, and production cycles unchanged |
| Checkpoint | Saved, rebooted with cartridge RAM, resumed with resources and ownership intact |
| Active-job save/load | Save was rejected during a job; explicitly confirmed Load restored the earlier checkpoint |
| Rendering | Inspected actual ROM frames for all four new interiors, crew menu fit, property ownership sign, garage, and district streets |

The required-route ledger observed in the ROM:

| Point | Coins | Stored scrap | Cheer | Successful jobs |
| --- | ---: | ---: | ---: | ---: |
| New game | 100 | 0 | 0 | 0 |
| First salvage banked | 100 | 10 | 0 | 1 |
| Workshop repaired | 60 | 6 | 0 | 1 |
| First delivery plus workshop batch | 110 | 4 | 0 | 2 |
| Cocoa purchased | 10 | 0 | 5 | 2 |
| Next delivery plus Cocoa income | 46 | 0 | 5 | 3 |

The full suite passed 681 commands and 135 assertion checkpoints. The crew scenario includes the opening scenario, so these are regression checkpoints rather than 135 unique behaviors. The five commission rewards ended at 225 Coins, 10 scrap, 5 Cheer, and zero production cycles; save/restart retained all five completion flags. Recycler and runner deliveries ended at 82 Coins/2 scrap and 128 Coins/2 scrap, respectively, after the standard opening.

Replay commands are in `tests/opening-loop.jsonl`, `tests/free-roam.jsonl`, `tests/commissions.jsonl`, and `tests/crew-roles.jsonl`. See [development instructions](DEVELOPMENT.md). Raw runtime captures and logs remain local. Failed assertions produce a nonzero process exit.

## Limits and next work

This is an early prototype. It is not the full twelve-mission campaign. Driving, traffic, timed hazards, multiple simultaneous crew assignments, continuous world simulation, and a music soundtrack remain unimplemented. The three crew roles are a first strategy choice, not a full workforce system. Toolworks is a passive recycler; Lantern Flats is currently a finale prerequisite. Property progress changes signs rather than rebuilding entire facades.

The tested path covers Cocoa and the opening workshop. Purchasing every other property, the finale, optional bonus collection, near-cap balances, active-main-job commission turn-in rejection, and long-session balance still need dedicated runtime coverage. Capacity and transaction guards received source review, which does not replace those playthroughs. Scene traversal and a handful of frames do not establish worst-case performance or sprite scanline behavior.

The native player collision box is 16 by 8 pixels; some alley interactions rely on that footprint. Expanding it requires a new world-layout review.

Manual saves use one garage slot and are disabled during active jobs. No autosave or power-interruption guarantee is claimed. Physical playback, controls, audio quality, save persistence on the Chromatic, cartridge installation, and save compatibility across different builds remain untested. The plugin and physical device are not required for further source development.

See the [team assignments](TEAM_BUILD_PLAN.md) for the next builder milestones.
