# Hollywild: Elf-Made Empire

A holiday city adventure about finding overlooked properties, running mischievous expeditions, and building an automated elf-powered empire.

**Status: detailed design and production planning. No playable ROM has been built yet.**

Target platform: Game Boy Color-compatible ModRetro Chromatic. Preferred authoring workflow: GB Studio, assisted by Codex and the ModRetro plugin. Direct GB Studio authoring and export are also documented options. Build instructions will be added after a toolchain is selected and verified.

## The game

Start with a rundown garage and an optimistic elf dispatcher. Explore snowy neighborhoods, inspect questionable property listings, bring back salvage, renovate buildings, and recruit a crew. Assign production and deliveries, then head back into the city while your operation develops.

The inspiration is free-roaming city adventures, earnest holiday comedy, property hunting, and strategy. All planned characters, locations, dialogue, artwork, and music are original.

## Plan

- [Start here: production blueprint](BUILD_PLAN.md)
- [Gameplay, economy, properties, and crew](docs/GAMEPLAY.md)
- [World, twelve missions, and first-chapter scenes](docs/WORLD_AND_MISSIONS.md)
- [Engineering, milestones, and verification](docs/ENGINEERING.md)
- [Planning checks and review findings](docs/VALIDATION.md)

## First playable target

Three locations: garage, street, and salvage depot. Complete a salvage expedition, repair the workshop, assign a worker, finish a delivery, and restore Cocoa Corner. The design aims for a 10–15 minute opening; duration and fun remain to be measured.

The larger plan contains five districts and twelve authored missions. Driving and more elaborate simulation are optional expansions, gated on a working first chapter.

## AI and offline play

Codex assists development. Standalone companions are designed with authored behaviors, saved choices, and reactive dialogue. Live generative AI on the cartridge is not a verified feature or a dependency.

## Next milestone

Verify the toolchain, compile a minimal project, test its controls in an emulator, and begin the complete first-chapter loop. Numerical balance, performance, saving, and cartridge installation remain unvalidated in a running game.
