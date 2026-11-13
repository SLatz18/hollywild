# Native build status: v0.7.0-hands-on

The first physical gameplay pass adds rotating pipe connections and an on-foot rooftop parcel course. Garage repairs now change the bench and task light. All 24 campaign and 22 side missions have shorter conversational openings and endings; existing puzzle clues, answers and choices are retained. Completing a campaign mission returns control, with the next briefing available in START > Story.

[Activity rules and research](HANDS_ON_PLAY.md) explain what is implemented. The 67 existing campaign and side-story menu puzzles remain. RC vehicles, bridge construction and Portal-inspired freight chutes are researched future ideas, not shipped features.

## Exact tested cartridge

- SHA-256: `1c5fe62a60c83001063e98cb239b5e9b67c38b52d07ca816be8ec34759361d71`.
- Native Game Boy Color Only, MBC5 with battery-backed RAM; 1,048,576 bytes and a 32 KB save-RAM header.
- Pinned GB Studio 4.3.2: `ccb891b2670134ba8237416772eea4ed09d34e1e`; GBVM: `bd6f41cc5e05cbe6601dcc7f8e2db89bed527fe3`.
- Header and both checksums passed. All 55 linked code areas fit the 16 KB bank limit.
- All 141 existing variable IDs are preserved, with 14 new activity globals appended. This is not proof of cross-release save compatibility.
- Authored and generated build inputs remained unchanged through compilation and the final regression suite.

## Verification

All 11 actual-ROM scenarios passed: 4,710 commands and 1,511 assertion checkpoints. Coverage includes three campaign endings, both side-story paths, mixed story progress, free roaming, commissions, crew roles, the opening economy and the new physical activities. Seven source/asset checks passed. The suite ran in 167.91 automated wall seconds with known routes and answers. It does not estimate human playtime.

The new activity replay uses ordinary movement and interaction buttons to rotate pipes, claim the reward, reset, solve again without duplicate payment, and preserve state through checkpoint save/restart. It completes the safe, damaged and clean-shortcut parcel outcomes, checks the 12-to-16 improvement pays only four more Coins, and reloads the final result. A separate connectivity oracle checks all 256 pipe configurations and 1,024 rotations. Source tests cover wallet capacity and active-job deferred rewards.

The UI regression passed 24 observations on this exact ROM, including the five-page introduction, menu behavior, mute, sprite restoration and all four complete activity-directions pages. A separate 38-command native replay captures garage appearance before repair, immediately afterward and on return. Actual screenshots were visually inspected. The [compact report](verification/v0.7.0-hands-on.json) records the evidence.

The navigation harness now lets activity triggers finish before reading checkpoint state. It retains exact destination assertions and uses no state injection. Tests use isolated fresh cartridge RAM; restart carries only that scenario's checkpoint save.

## Agent usability findings

One screen-only agent session on an earlier build in this pass reached Brassworks but failed to find either activity. This exposed confusing public entrances and menu ordering. Guide now puts Play above Back, supplies exact entrance directions, and explains that public rooms do not require buying property. The final UI and native route tests verify those pages and traversable routes. No second blind navigation session has been run. See [the agent research report](PLAYER_RESEARCH_ACTIONS.md).

Remaining issues include the two status pages before START's menu, limited entrance labeling, missing dialogue advance cues and the broader menu-heavy campaign structure. The small crawler artwork is partly obscured; the bench and light provide the clearer renovation payoff.

## Music, delivery and limits

All seven music assets remain byte-identical to the tested v0.6 composed score. Its full-loop captures and independent structural/audio-signal review are preserved in [v0.6 history](history/v0.6.0-composed-score.md). They are not a new listening review of this cartridge.

[Download v0.7.0](https://github.com/SLatz18/hollywild/releases/tag/v0.7.0-hands-on). The `.gbc` is the playable artifact. [Build instructions](DEVELOPMENT.md) and [hardware installation](HARDWARE_INSTALL.md) are available.

Physical Chromatic playback and saves, cross-release save compatibility, human enjoyment and campaign duration remain unverified. The cartridge uses authored behavior and requires no live AI or network connection.
