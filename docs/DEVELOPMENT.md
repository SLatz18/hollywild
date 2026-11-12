# Building Hollywild

Hollywild targets a native Game Boy Color cartridge for Chromatic. A development computer runs the editor, compiler, and tests. There is no separate desktop or browser game target in this project.

## Open a fresh clone in the editor

1. Clone this repository and keep its directory structure intact.
2. Install [GB Studio 4.3.2](https://github.com/chrismaltby/gb-studio/releases/tag/v4.3.2).
3. Open `hollywild.gbsproj`. The accompanying `project/` and `assets/` directories contain the editable native resources.
4. Keep the project set to **Color Only**, with the existing MBC5 cartridge settings, and choose **Export ROM**.
5. Inspect and test the exported cartridge before installing it on hardware. See [Installing on a Chromatic](HARDWARE_INSTALL.md), which also covers flashing from a computer other than the development computer.

The included resources are sufficient to open the game in the editor. Regenerating the project is optional. An editor export is a separate build from any published cartridge, even when both use the same source version. Hardware installation is not part of these commands.

## Local command-line build

The helper expects an already prepared official GB Studio source checkout at `.tools/gb-studio`, including its dependencies, native engine, and compiled CLI. Tool installation is local and ignored by Git. This repository does not yet provide an automated fresh-machine setup script.

The development checkout uses GB Studio 4.3.2 commit `ccb891b2670134ba8237416772eea4ed09d34e1e`, with GBVM commit `bd6f41cc5e05cbe6601dcc7f8e2db89bed527fe3`. Consult the [pinned upstream README](https://github.com/chrismaltby/gb-studio/blob/ccb891b2670134ba8237416772eea4ed09d34e1e/README.md) for source installation and `make:cli`. Use the pinned checkout's dependency definitions and Node requirements when preparing a new environment. Do not substitute the current development branch.

Once `out/cli/gb-studio-cli.js` exists within that checkout, run from the Hollywild repository:

```bash
python3 scripts/build-game.py hollywild.gbsproj
python3 scripts/inspect-rom.py build/rom/hollywild.gbc
```

The build helper invokes the official native `make:rom` command. It checks the GB Studio and GBVM commits, rejects tracked changes in those source checkouts, records the compiled CLI hash, detects changes to project inputs during compilation, validates the cartridge header and checksums, and keeps matching debug symbols. Outputs remain in ignored `build/` directories. The helper currently uses a macOS temporary directory; the editor export is the simpler path on other hosts.

`build/rom/build-manifest.json` records source hashes, the ROM hash, and debug-artifact hashes. Clean pinned source and a recorded CLI hash improve traceability, but the helper does not independently validate every tool binary or engine dependency. Neither byte-for-byte reproducibility nor save compatibility between rebuilt cartridges is promised.

## Authoring and regeneration

The checked-in native resources are editable in GB Studio. Campaign writing lives in `content/campaign.json`. The generators provide another authoring path:

```bash
python3 scripts/create-assets.py
node scripts/create-game.mjs
node scripts/check-campaign.mjs
python3 scripts/create-campaign-tests.py
```

**These commands overwrite generated art, world data, project settings, scenes, actors, and scripts.** Commit or preserve deliberate editor changes before regeneration. Do not run them as a routine prerequisite for opening or exporting the included project.

`create-assets.py` uses Python's standard library. `create-game.mjs` uses Node's built-in modules and reads template resources from the pinned `.tools/gb-studio` checkout. Keep gameplay changes in the generator when regeneration is intended to remain the source of truth. Avoid modifying the same generated resources in parallel with a build.

## Validation tools

Create an isolated test environment and install the pinned test dependencies:

```bash
python3 -m venv .tools/emulator
.tools/emulator/bin/python -m pip install -r requirements-test.txt
.tools/emulator/bin/python scripts/test-game.py
.tools/emulator/bin/python scripts/emulator-qa.py
```

The test runner executes asset and native-resource checks, then each checked-in button replay on a fresh test cartridge, retaining a report for the exact ROM.

The asset check verifies source colors, dimensions, the chosen tile budget, walkability to interaction sites, and district connectivity. The campaign checker exercises emitted native event logic; it complements the separate actual-ROM walkthroughs. The separate ROM inspector checks the actual compiled file. Neither check proves that the game plays correctly.

The emulator harness runs the genuine cartridge in PyBoy with no display window. It accepts one JSON command per input line, for example:

```json
{"tap":"a","frames":200}
{"hold":"right","frames":32}
{"capture":"current-screen.png"}
{"assert":{"coins":100}}
{"restart":true}
{"stop":true}
```

Additional commands support `read` (advance dialogue but stop at a choice menu), `choose` (1-based selection, or 0 for B), `travel` (walk through connected scenes), and `interact` (walk to an actor and press A). These helpers send ordinary buttons and check observed positions. They do not teleport or alter state.

Buttons advance the game. Debug symbols from the matching build allow read-only observation of variables and position. The harness does not inject gameplay state or write game memory. Restart carries cartridge RAM into a newly booted emulator; it does not restore an emulator save state. A fresh harness process starts with blank test cartridge RAM and does not access a player's save files.

The harness requires the manifest and symbols produced by `build-game.py`; it cannot inspect an arbitrary editor export without those matching artifacts. Screenshots and command observations go to ignored `test-results/`. Its assertion responses must be checked: it reports failed commands and continues the interactive session. The process exits with a nonzero status if any command failed. Replay the checked-in opening regression with:

```bash
.tools/emulator/bin/python scripts/emulator-qa.py < tests/opening-loop.jsonl
.tools/emulator/bin/python scripts/emulator-qa.py < tests/free-roam.jsonl
```

This is targeted regression coverage, not exhaustive acceptance testing.

Successful compilation, emulator checks, and physical Chromatic testing are separate evidence. Consult the build status for the checks completed on a particular ROM. Saving during a power interruption and compatibility with a replacement ROM remain separate tests.

## Neighborhood expansion

Author optional tracks in `content/side-stories.json` using `content/SIDE_CONTRACT.md`. The side engine appends state after the original campaign variables. Preserve IDs and existing menu indexes. `scripts/create-assets.py` places the separate neighborhood desks; `scripts/create-game.mjs` integrates them and applies economic perks.

After authoring, regenerate assets and native resources, run `node scripts/check-side.mjs`, and generate button walkthroughs with `python3 scripts/create-side-tests.py`. Generate the mixed-progress scenario with `python3 scripts/create-interleave-test.py`. The standard full regression runner includes both side paths and the mixed-progress scenario. `node scripts/check-side-economy.mjs` exercises generated economic branches at boundary states in a source interpreter, separately from real-ROM tests.

The emulator and suite reports record elapsed wall seconds and simulated frames. They are automated execution measurements with scripted dialogue advancement, known answers, retries and save tests. Neither is a human completion-time measurement. Fresh run IDs, exact command matching and ROM hashes prevent stale traces from passing as current evidence.
