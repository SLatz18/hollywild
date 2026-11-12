# Hollywild team build plan

The team is building the native Game Boy Color cartridge version of Hollywild for ModRetro Chromatic. The computer is the authoring, compilation, and emulator-testing environment. A separate Mac game is outside this plan.

Repository: [SLatz18/hollywild](https://github.com/SLatz18/hollywild).

## Shared product direction

All five districts are reachable from the start. Connected streets form a loop with crosslinks, and the garage is an enterable home base. The player can explore while holding a job, decline work, revisit properties, and take a different route home. Story prerequisites can constrain a particular opportunity or the finale, but must not gate whole districts.

The first useful release combines free roaming with a complete loop: salvage, repair the workshop, run a delivery, resolve crew production, restore Cocoa Corner, and retain progress through saving. The larger campaign adds meaningful choices and places to explore after this foundation is tested.

## Four builder lanes

| Lane | Owned files and responsibility | Immediate acceptance criteria | Handoff |
| --- | --- | --- | --- |
| World and art | `scripts/create-assets.py`, `world-layout.json`, PNGs under `assets/backgrounds/` and `assets/sprites/` | Native source colors and dimensions pass validation; connected collision paths; every exit has a safe destination; each district has a distinct visual identity | Layout, PNGs, palette ordering, interaction coordinates, and tile counts to gameplay and QA |
| Gameplay and economy | `scripts/create-game.mjs`, `hollywild.gbsproj`, `gameplay-source.json`, `project/`, and background/sprite `.gbsres` sidecars | Native scenes reference real assets; jobs cannot duplicate rewards; reservations remain owned supplies until consumed; purchases and cancellation behave consistently | Complete editable project and expected state transitions to native build and QA |
| Native build and toolchain | `scripts/build-game.py`, `scripts/inspect-rom.py`, and the local ignored official toolchain under `.tools/gb-studio/` | Compile the actual `.gbsproj`; validate the cartridge header and checksums; preserve authored inputs; associate debug artifacts with the exact ROM | Cartridge, build manifest, warnings, tool versions, and matching debug files to QA |
| QA and integration | `scripts/validate-assets.py`, `scripts/emulator-qa.py`, `requirements-test.txt`, review findings, build-status documentation, and publication | Independently exercise the ROM; verify world traversal, economics, menus, save/load, and regression cases; publish only supported claims | Verified build or reproducible defects back to the responsible builder |

World/art owns image pixels; gameplay owns the corresponding native metadata. Changing a sprite's dimensions or animation layout requires an explicit handoff between those lanes. Integration owns cross-lane decisions and the final repository update. Builders do not revert or overwrite another lane's work.

## Present foundation

The authored source currently contains five districts, a garage, four property interiors, ten campaign locations, fourteen original sprite sheets, and 111 scripted interaction sites. The five districts are connected by a bidirectional street loop and additional north/south routes. The game generator defines movement, route guidance, job boards, salvage, deliveries, property purchases, workshop production, five local commissions, three crew roles, a restoration objective, and a garage save/load interaction.

The local native build pipeline has produced a Game Boy Color ROM from the actual editable project, with header and checksum inspection recorded in its build manifest. Compilation establishes a cartridge artifact; it does not establish a correct playthrough, reliable physical saves, or compatibility with a particular cartridge.

This is the implemented foundation, not a claim that the full planned campaign has shipped. Runtime coverage belongs in the current test report. Physical Chromatic testing remains a separate gate when the device and installation path are available.

## Integration order and dependencies

1. **Agree on the shared layout.** World/art publishes stable scene IDs, background filenames, 8-pixel coordinate units, collision cells, palette slots, exits, and interaction-site IDs. Gameplay maps those sites to events without inventing a second layout.
2. **Generate the native project.** Gameplay creates the `.gbsproj` and distributed resources using the pinned GB Studio version. The source generator and generated resources must describe the same game.
3. **Freeze authored inputs for a build.** Integration announces the freeze. Other lanes can review or work on separate documents, but cannot rewrite source images or resources while the compiler snapshots them.
4. **Compile and inspect.** Native build produces the real cartridge and matching debug information. A different standalone C sample does not substitute for this project build.
5. **Test the exact cartridge.** QA uses the manifest's ROM hash and matching symbols. Test outcomes distinguish ordinary button-input playthroughs from any diagnostic state manipulation.
6. **Fix the smallest demonstrated defect.** The owning builder changes the source, regenerates affected resources, and hands it back for a fresh build. Existing successful checks are repeated when the fix could affect them.
7. **Publish a coherent revision.** Integration checks source ownership, licenses, generated-resource consistency, and supported status wording. Tool installations, private session history, save files, and local logs stay outside the public source commit.

## Neighborhood expansion

Version 0.4 adds four independent three-mission side arcs, six short encounters, four ownership-required improvement projects, twenty neighborhood desks, four persistent choices, and eight economic unlocks. Sol Medium builders owned authored stories, native state logic, and button-based QA. A Sol High reviewer independently checked all 22 puzzle answers and economic boundary behavior. Root owns integration, native compilation, exact-ROM regressions, documentation and publication. See [current evidence](BUILD_STATUS.md); human duration and hardware playback remain untested.

## Campaign delivered

Version 0.3 adds the six-act, 24-mission campaign, 45 puzzles, persistent choices, three endings, 40 optional discoveries, and completed-evidence Clues journal. Sol Medium builders implemented narrative, world, and native logic; a Sol High reviewer independently checked the story and state rules. The parent ran complete actual-ROM routes. Two hours remains an unmeasured first-time pacing target. See [build status](BUILD_STATUS.md) for exact evidence and limits.

## Earlier expansion delivered

The 0.2.0 prototype adds publicly inspectable interiors, one-time local commissions across all five districts, and selectable maker/recycler/runner roles. All four native regression scenarios pass, including saved commission completion and crew selection. See [build evidence](BUILD_STATUS.md) for the exact ROM, coverage, and limits.

## Milestones after the foundation

| Milestone | Builder emphasis | Completion evidence |
| --- | --- | --- |
| Reliable first city | Gameplay, QA, native build | Fresh game reaches every district and returns home through another route; boundaries preserve job and resource state; no transition trap |
| Complete economic loop | Gameplay and QA | Required-route ledger closes; optional bonus remains optional; repeat interactions, retries, cancellation, insufficient funds, and near-cap balances behave as specified |
| Trustworthy checkpoints | Gameplay, native build, QA | Save/load restores resources, ownership, jobs, and a usable location in the actual ROM; hardware save behavior remains separately labeled until tested |
| Visible property progress | World/art and gameplay | Restored properties visibly change or gain clearly distinct interactions, and keep their state after travel and reload |
| Richer exploration | World/art and gameplay | Useful interiors, optional clues, local shortcuts, and district-specific jobs add choices without reinstating district locks |
| Crew depth | Gameplay and QA | Additional assignments and priorities introduce opportunity costs; every paused job explains its reason; new production chains respect reservation and capacity rules |
| Vehicle feasibility | Native build, gameplay, world/art, QA | A small driving experiment proves entering/exiting, collision, camera movement, scene transitions, and vehicle recovery before broader traffic work |
| Physical-device candidate | Integration and QA | Approved cartridge installation, controls, screen readability, audio, and normal power-cycle persistence pass on the actual Chromatic |

Driving and traffic remain research and prototype work. Neither is claimed in the current foundation. Continuous map streaming, crowds, and decorative effects are also measured experiments. They must not take priority over navigable routes, readable interactions, or reliable saves.

## Rules that keep the team aligned

- The [open-world contract](OPEN_WORLD.md) owns traversal freedom and world access.
- The gameplay source and its current build notes must explicitly identify any simplification from the larger [economy design](GAMEPLAY.md).
- A PNG preview is evidence of authored artwork. A running-ROM frame is evidence of runtime rendering. The two are not interchangeable.
- A hardware object, a game actor, and an artwork tile are different resource units. QA checks actual crowding and scanline pressure instead of assuming an actor count guarantees a clear screen.
- Companions currently use authored behavior and saved state. Live generative AI on the cartridge is not a verified capability or a dependency.
- New engine plugins or a different engine require a demonstrated requirement that existing events cannot meet. Preserve the editable native project as the baseline.
- A passing emulator test is not a physical-device result. Report both honestly.

## Minimum release checklist

The candidate includes editable source, attributed third-party assets where used, build instructions, exact toolchain identification, the cartridge hash, test coverage, known limitations, and save-compatibility notes. The public README must make clear which systems are implemented, which were tested, and which remain planned.

The authoring team can continue building while the plugin and device are unavailable. Cartridge installation waits for a verified device path and confirmation that the target cartridge's existing contents may be replaced.
