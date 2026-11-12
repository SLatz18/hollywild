# Hollywild implementation and verification plan

Planning date: November 12, 2026. Status: design specification only. No game build, plugin installation, performance measurement, save test, or hardware test has been completed for this plan.

## Recommendation

Build a small, complete Game Boy Color management adventure in GB Studio first. The first release should prove exploration, salvage, a property upgrade, one crew production job, a second property purchase, and reliable progress saving. Design the larger city as connected districts, with the feeling of freedom supplied by routes and choices rather than by a seamless open-world simulation.

Keep the ModRetro plugin as the preferred authoring and deployment helper, but do not make its availability a dependency for designing the game. GB Studio itself documents local play previews and ROM and web export. That establishes a viable software development route if the plugin issue persists; it does not establish that the tools are installed or that physical cartridge deployment works here. [GB Studio build documentation](https://www.gbstudio.dev/docs/build/)

## Verified capabilities versus project choices

| Item | Evidence or status | Consequence |
| --- | --- | --- |
| Connected top-down scenes | GB Studio documents scene types, actors, triggers, and scene transitions | Use the built-in top-down mode for the first chapter |
| ROM and browser preview | GB Studio documents both exports | The first playable game can be tested on the Mac before the console arrives |
| GB Studio save/load events | Documented, including three slots and a BATTERY cartridge-type requirement | Use these features only after testing the selected build and cartridge configuration |
| Color-only project mode | Documented by GB Studio | Proposed target is GBC color-only, subject to confirming the actual build settings |
| Standalone C with GBDK | Official GBDK setup includes macOS builds and templates; the official OpenAI guide describes the route | Available alternative if an essential mechanic demonstrably needs native code |
| Live ChatGPT on a standalone cartridge | Not verified | Do not promise it or depend on it |
| Performance, sprite capacity, ROM size, save durability | Not measured for this project | Prototype budgets below are design targets, not hardware specifications |

References: [scenes](https://www.gbstudio.dev/docs/project-editor/scenes/), [settings](https://www.gbstudio.dev/docs/settings/), [save data](https://www.gbstudio.dev/docs/scripting/script-glossary/save-data/), [GBDK getting started](https://gbdk.org/docs/api/docs_getting_started.html).

## First playable boundary

The complete chapter is the product of the first milestone sequence, not a disposable movement demo. Target 10–15 minutes for a familiar player, then measure a first-time player's duration. Exclude driving, free placement of buildings, live services, multiplayer, dynamic weather simulation, and infinite generated maps.

Include one visually upgraded hub, a neighborhood street, a depot expedition, a compact listing interface, two crew members, one automatic job, one recoverable failure, one optional discovery, and a clear chapter ending. Placeholder graphics are acceptable until the full loop works. Test persistence before expanding the world.

All controls must work with D-pad, A, B, Start, and Select. Management runs in a paused menu or dedicated quiet scene. There is no simulation while menus are open and no requirement to leave the console powered on.

## Scene and asset budget hypotheses

These are conservative planning ceilings chosen to reduce development complexity. The compiler and emulator remain the authority on whether a scene fits and runs correctly.

| Budget | First playable target | Expansion trigger |
| --- | --- | --- |
| Playable locations | 3 location concepts, split into up to 6 room scenes if needed | Add another district after the chapter passes its acceptance tests |
| Management/title/results surfaces | Up to 4 menu or overlay layouts | Reuse layouts rather than create a unique menu per building |
| Simultaneous NPC/hazard actors | Aim for at most 4 beyond the player in the busiest prototype view | Increase only after inspecting the actual asset and performance report |
| Moving hazards | 1 patrol or spotlight pattern | Add a second only after first-time readability testing |
| Crew | Pip and Rivet | Add one new role per expansion chapter |
| Property prospects | 3 listings, only one next acquisition required | Reveal later property types after the first production loop |
| Music | 2 short loops and a completion cue | Add district music after the relevant district is playable |
| Sound effects | Up to 8 clear cues | New cues must have a distinct player-facing meaning |
| Dialogue | Aim for under 50 short pages | Trim repeated instructions before adding more |

The hub's repair can use two authored backgrounds or controlled tile changes, chosen after a technical spike. Do not assume seamless map streaming is needed. Use ordinary transitions before experimenting with shared tilesets or instant scene changes.

## Program structure

Implement equivalent components using GB Studio custom events and variables; these names do not imply a particular programming language or engine extension.

| Component | Responsibility | Must not do |
| --- | --- | --- |
| Input and interaction | Route movement, confirmation, cancellation, and nearby interactions | Trigger a purchase twice while A is held |
| Scene presentation | Rebuild visible actors and property appearance from canonical state | Award mission rewards from a scene's initialization script |
| Mission controller | Start, advance, complete, fail, and retreat from an expedition | Resolve the same expedition twice |
| Economy | Validate and apply resource changes and caps | Permit negative balances or arithmetic wraparound |
| Property manager | Check ownership and upgrade prerequisites | Spend resources before the final validity check |
| Crew scheduler | Resolve a bounded list of assignments | Consume expedition loot that is not yet banked |
| Cycle resolver | Apply a single cycle in a defined order | Advance time during browsing or save/load |
| Dialogue selector | Choose short text using story and choice flags | Modify economy as a side effect of reading flavor text |
| Persistence | Save and restore a complete safe checkpoint | Claim corruption-proof storage without testing |
| Diagnostics | Record state and outcomes in development builds | Ship debug rewards or progression bypasses |

## State contract

Use a small explicit registry, even if GB Studio represents every entry as an individual variable. The numeric ranges below are proposed application limits, not statements about GB Studio's internal representation. Confirm supported arithmetic before implementation.

| Group | Required state |
| --- | --- |
| Identity | build ID, save schema version, active checkpoint identifier |
| Progression | chapter ID, tutorial step, unlocked district flags |
| Economy | Coins, owned Salvage, reserved_salvage, Cheer; configured resource caps |
| Properties | fixed property IDs, ownership, upgrade level, specialization |
| Crew | recruited flag, assignment ID, priority, reserve setting |
| Expedition | story quest ID, payable contract ID, phase, loot carried, one-time pickup flags, chosen route; frozen crew jobs, input reservations, property ownership and upgrades |
| Resolution | productive cycle, attempt count, expedition serial, last resolved serial, resolution lock, settlement summary |
| Overflow claim | pending return Coins and Salvage, claim run ID, remaining amounts, cleared flag; saved after every claim action. Derive maximum pending amounts from one validated run reward plus its frozen passive payouts and verify arithmetic width |
| Story | named booleans such as rescued_courier and discovered_depot_cache |
| Presentation | preferred text speed and sound setting, if included |

Proposed mission phases: HOME, PREPARING, ACTIVE, RETURNING, RESOLVING, RESULTS. Only HOME permits purchases and assignment changes. Pause screens do not create an extra phase. Abandoning a preparation screen returns to HOME without starting a cycle.

M03 is a story quest that completes at Cocoa restoration; its delivery is a separate payable contract that grants exactly one work tick. M01 and purchases grant none. Keep mission-local pickup flags separate from permanent discoveries. Define whether every flag resets on a retry. Initial implementation should avoid randomness in essential progression. Optional random flavor must never decide whether the tutorial can be completed.

## Cycle transaction

Reservation accounting: owned Salvage includes reserved inputs. Track reserved_salvage separately; spendable equals owned minus reserved. Completing a job subtracts its inputs from owned stock once and releases the reservation. Failure, retreat, or a paused job only releases the reservation; it never adds to unchanged owned stock. Every reference to a refund means this release.


The gameplay specification defines exact reward values and final resource caps. The following contract incorporates the agreed successful-completion-only production policy:

1. At departure, validate the mission and freeze the crew assignment snapshot. Reserve each eligible job's inputs from opening storage in a fixed priority order, respecting the player's reserve floor. Do not count future expedition loot. A job that cannot fully reserve its inputs stays idle.
2. Give the expedition a fresh serial and enter ACTIVE. A retreat or failure still produces one terminal outcome.
3. On return, lock input and enter RESOLVING. If this serial already equals last_resolved_serial, skip economic changes and rebuild the existing result screen.
4. Determine whether the outcome qualifies for a production tick. Only successful completion of an authored expedition or service contract qualifies. Bank mission rewards first, routing excess into the single pending return claim. Rewards have priority over optional production. A failed or retreated contract banks no ordinary carried loot.
5. On qualifying success, resolve frozen jobs in priority order against the remaining capacity. Consume reserved inputs only when the full job output fits; otherwise pause that job and refund its reservation. Resolve frozen property income, holding excess in the same return claim. On failure or retreat, refund every reservation and produce nothing. Never use newly banked loot to fund this run's jobs.
6. Apply bounds, then progression and story changes. Record the result summary. Increment the production cycle once only for an eligible successful completion, and mark this run serial resolved regardless of outcome.
7. Return to a known safe hub position. Clear completed input reservations, set phase=HOME and resolution_lock=false in canonical state, then save a complete checkpoint when persistence has been verified. Keep presentation input disabled until saving finishes. On load, normalize a valid checkpoint to HOME at the safe hub with the lock clear; never resume a RESOLVING phase as interactive play. Preserve any pending return claim and result summary while clearing mission-only state. Show a saving state and then the result summary. Pending claims block the next dispatch, but must leave hub purchases and management available. Persist every subsequent claim transfer, sale, donation, spend, or discard before allowing another dispatch.
8. Unlock input only after the transaction is complete.

The once-only serial guard prevents duplicate rewards during normal play; it does not make the physical save write atomic. GB Studio's documented save event is not evidence of power-loss-proof storage. Initially allow saving only at safe hub checkpoints. A loss of power during a mission returns to the previous checkpoint, potentially losing that mission's progress. That tradeoff should be explained in the title/help screen.

## Persistence and update policy

Early technical spike: save at the hub, return to title, load, and compare every tracked field. Repeat after buying a property and after a failed mission. Then test a normal console power cycle using a test save once hardware is available.

For the first release use one clearly labeled checkpoint slot. Reserve other slots for a later verified backup design rather than claiming redundancy simply because the engine offers slots. If a backup is added, it needs a validity check, schema version, newest-valid selection, and tests demonstrating fallback behavior.

Keep variable identities stable after a release. Treat a rebuilt ROM as potentially incompatible with existing saves until a migration test proves otherwise. Never silently reset an unknown save format. Show an understandable incompatible-save message and preserve the old save where the verified tools permit it. New Game must explicitly confirm before replacing the current checkpoint.

## Executable backlog

| ID | Deliverable and dependency | Acceptance criterion |
| --- | --- | --- |
| B01 | Toolchain probe | Record exact tool versions; compile and run one official/template sample; no guessed success |
| B02 | Project skeleton; after B01 | Start screen enters the hub; clean rebuild reproduces a bootable ROM |
| B03 | Input and scene transitions; after B02 | D-pad movement, collision, interaction, and cancellation work; all exits lead to valid positions |
| B04 | State registry and economy functions; after B02 | Bounds, affordability, repeat interaction, and exact-once deductions pass table-driven cases |
| B05 | Mission loop; after B03/B04 | Success, failure, and retreat each return home with one terminal outcome |
| B06 | Crew and cycle resolution; after B04/B05 | A prepared state yields the same documented result every run; no duplicate production on menu reopen |
| B07 | Property purchase and visible upgrade; after B04 | Insufficient funds spends nothing; successful purchase changes state and appearance exactly once |
| B08 | Save/load spike; after B04 | Hub, property, crew, resources, and flags survive an emulator restart; production does not run again on load |
| B09 | First chapter integration; after B05–B08 | New Game reaches Cocoa Corner acquisition and chapter ending without debug tools |
| B10 | Art, dialogue, sound pass; after B09 | All mandatory text fits; player and hazards remain distinguishable; silent play is possible |
| B11 | Emulator regression; after B10 | Every case in the test matrix has a captured pass or documented defect |
| B12 | Chromatic installation and hardware validation; after B11 and physical access | Approved test cartridge boots, controls work, text is readable, sound is acceptable, and normal power-cycle save test passes |
| B13 | First expansion decision; after B12 or explicitly labeled emulator-only release | Add one district only if the loop is enjoyable and no progression/save blocker remains |

B08 should be started as soon as there is meaningful state, rather than left until final polish. B12 requires the console, compatible cartridge, supported installation path, and explicit confirmation before overwriting existing cartridge contents.

## Test matrix

Use independent expected state tables, rather than treating the implementation's own output as the oracle.

| Test | Expected behavior |
| --- | --- |
| Fresh game | Defined balances, crew flags, property state, and starting position |
| Exact-price purchase | Resources reach the expected remainder and ownership changes once |
| One resource short | No resource or ownership mutation |
| Hold A on purchase | One transaction only |
| Double interaction with mission reward | One reward only |
| Success / failure / retreat | Each resolves one run; only eligible success advances production; failure/retreat refunds reserved crew inputs |
| Immediate retreat | No production tick; reserved inputs are refunded; repeated aborts cannot farm production |
| Insufficient crew inputs | No partial input loss and a clear stalled-job explanation |
| Competing crew jobs | Fixed priority gives predictable outcomes |
| Full storage / maximum coins | Defined overflow behavior, no arithmetic wraparound |
| Pause, map, dialogue, shop browsing | No cycle advancement |
| Scene exit and reentry | Pickups and permanent upgrades reconstruct correctly |
| Save then reload | State is equal; no replayed rewards or production |
| Mission interrupted before return | Load returns to the last completed hub checkpoint |
| Incompatible save version | Clear warning, no silent new game |
| Lowest recoverable resources | Safe activity restores access to the core loop without a paid entry fee |
| Audio muted | Hazards and required information remain understandable |
| Physical screen | Text, interaction cues, and threat visibility pass on the actual handheld |

Resolved anti-farming decision: a successful authored expedition or service contract grants one production tick. Browsing, inspection, room exits, retreat, and failure grant none. This deliberately revises the original design's rule that any return advanced production. Keep a repeatable, free-entry safe courier contract so production remains accessible without encouraging instant aborts.

## AI implementation

At build time, use Codex for content authoring, code generation, collision-map inspection, animation revisions, and test assistance. During standalone play, companions use authored rules, saved flags, small behavior states, and dialogue variants. Market them as reactive characters, not as live language models.

Possible later experiment: a computer companion creates mission packs between sessions. This is a separate connected product requiring an authenticated service, cost controls, content validation, a transfer mechanism, and save-compatibility work. It is not a feature of the first cartridge and is not necessary to deliver the game's fantasy.

## If the ModRetro plugin remains unavailable

If the preferred plugin cannot be installed, identify the exact app, missing button or error, and documented requirements before changing settings. Plugin availability does not establish whether GB Studio can build the project directly.

Preferred fallback sequence:

1. Use GB Studio directly to author and export the same project. Verify its local installation and sample build before relying on it.
2. Use GB Studio's own preview or ROM/web export to continue testing. Keep deployment as a separately unresolved milestone.
3. If a tested core mechanic requires native code, run one minimal GBDK example, then prototype only that mechanic. The official GBDK guide documents templates and macOS compilation; no installed version has been verified here.
4. Avoid a custom assembly engine unless both simpler routes fail a concrete essential requirement. OpenAI's guide mentions separately installed RGBDS, but this plan does not recommend that complexity.

Do not install a second full engine merely because plugin search is empty. Do not claim a generic USB file copy will flash the cartridge. Hardware deployment remains tied to verified ModRetro instructions and the actual cartridge.

## Scope cuts and risks

Cut in this order if complexity rises: driving, seamless map transitions, large crowds and weather effects, procedural missions, advanced conditional automation, additional property specializations, then extra districts. Preserve the complete expedition-to-upgrade loop, readable menus, a recovery path, and tested saving.

Principal risks are an unclear plugin installation route, resource/economy contradictions, instant-retreat production farming, crowded screens, menu fatigue, incompatible saves after ROM updates, and a large content plan becoming a substitute for a fun loop. Resolve them with one empirical probe or narrow playtest each, not wholesale engine changes.

## Evidence to retain

For every released build retain the editable project, authored assets and licenses, pinned tool versions, build instructions, ROM checksum, test matrix results, emulator captures, known issues, and save compatibility notes. Keep hardware installation evidence separate from emulator evidence. A successful emulator boot is not a successful cartridge release.

## Primary sources checked

- https://developers.openai.com/blog/build-a-game-with-modretro-chromatic (official workflow reference; authoring and deployment workflow)
- https://www.gbstudio.dev/docs/build/ (checked this pass; local previews and exports)
- https://www.gbstudio.dev/docs/project-editor/scenes/ (checked this pass; scenes, actors, triggers, transitions)
- https://www.gbstudio.dev/docs/settings/ (checked this pass; color modes and project settings)
- https://www.gbstudio.dev/docs/scripting/script-glossary/save-data/ (checked this pass; save/load and BATTERY requirement)
- https://gbdk.org/docs/api/docs_getting_started.html (checked this pass; sample builds and templates)
