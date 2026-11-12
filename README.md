# Hollywild: Elf-Made Empire

An open-world holiday city adventure about overlooked properties, mischievous expeditions, and an elf-powered business empire.

**Status: full story campaign built for native Game Boy Color. Approximately two hours is the first-time pacing target, not a measured playtime. Physical Chromatic testing is pending.**

Built for ModRetro Chromatic using GB Studio 4.3.2. The development computer runs the editor, compiler, and tests. The playable deliverable is a native `.gbc` cartridge.

## Playable foundation

- Five freely connected districts, a garage, four property interiors, and ten new campaign locations.
- Original pixel art, characters, dialogue, and property listings.
- Salvage jobs, optional bonus salvage, deliveries, five local commissions, and cancellation.
- Three crew roles, workshop production, and purchasable properties with visible ownership signs.
- A 24-mission campaign with 144 objectives, 45 puzzles, and three endings.
- Forty optional discoveries, a saved Clues journal, and ten city checkpoints.

The inspiration is city freedom, earnest holiday comedy, property hunting, and strategy. Driving, traffic, and multiple simultaneous crew assignments remain planned. The current build uses simple sound effects and has no music soundtrack.

![Archive in the running ROM](docs/images/frostwick_archive-campaign.png) ![A campaign puzzle in the running ROM](docs/images/campaign-puzzle.png)

[Download the current native prototype](https://github.com/SLatz18/hollywild/releases/tag/v0.3.0-campaign)

## Story campaign

Help Pip investigate why Hollywild keeps freezing. Trace missing public records, repair a regulator, untangle Slush's property scheme, negotiate access, and prove that a city can run a reliable shared network. Choices about routes, repair supplies, trust, and investment return later in the story.

Talk to the **story desk in the garage** and choose Begin. START → Story shows the next objective; START → Clues rereads evidence you have already collected. All streets and campaign rooms are open, and you can pause the story for jobs or property work.

[Campaign overview and pacing](docs/CAMPAIGN.md) contains a full walkthrough and puzzle answers, so it includes spoilers.

## Start here

- [Team builder assignments and handoffs](docs/TEAM_BUILD_PLAN.md)
- [Current build, test evidence, and limitations](docs/BUILD_STATUS.md)
- [Build or edit the native game](docs/DEVELOPMENT.md)
- [Production blueprint](BUILD_PLAN.md)
- [Open-world rules](docs/OPEN_WORLD.md)
- [Gameplay and economy design](docs/GAMEPLAY.md)
- [World and campaign design](docs/WORLD_AND_MISSIONS.md)
- [Engineering roadmap](docs/ENGINEERING.md)
- [Third-party notices](licenses/README.md)

## Controls and first steps

D-pad walks, A interacts and confirms, B closes menus, START opens the pocket book, and SELECT shows routes. Save at the garage or a city checkpoint between repeatable jobs. Story progress can be saved between objectives.

Start with 100 Coins. Leave the garage, accept Salvage at a job board, collect a marked depot crate, and Bank the haul. Repair the garage workshop, then finish a delivery to fund Cocoa Corner. Every district is open from the beginning, so this opening route is optional.

## AI and offline play

Codex assists development. Companions use authored behaviors and saved state. Live generative AI on the cartridge is neither verified nor required. The game does not use company data or live property feeds.

Published prototypes are development builds. Hardware playback, physical save persistence, and save compatibility between different builds remain unverified.
