# Hollywild: Elf-Made Empire

## Detailed production blueprint

Version 0.4, November 12, 2026. This document describes the larger design. A native prototype now builds and has emulator coverage; see [current build status](docs/BUILD_STATUS.md) for implemented scope and evidence. Physical cartridge testing and measured playtime are pending.

This is the entry point for the expanded plan. This blueprint and its linked specifications define the current proposal. Numeric values are tuning hypotheses until playtested.

## The recommendation

Build an open-world holiday city adventure centered on property, expeditions, and automation. Geographic freedom is a core requirement; see the [open-world contract](docs/OPEN_WORLD.md). The first release should earn its depth through interacting systems: a property changes what your crew can produce, that production changes which expedition is worthwhile, and the expedition reveals the next property opportunity.

The personal fit comes from the creative brief:

| Inspiration | What we borrow | What the player experiences |
| --- | --- | --- |
| GTA | City freedom, memorable jobs, shortcuts, escalating mischief | Choose a route and an opportunity; discover something while traveling |
| Elf | Earnest enthusiasm in an ordinary city, holiday absurdity | A sincere elf crew that treats a condemned garage like a palace |
| Zillow | Browsing homes, comparing potential, imagining transformations | Inspect listings, uncover quirks, specialize buildings, admire improvements |
| Strategy and automation | Set priorities, manage scarce inputs, build useful systems | Choose crew assignments and see their consequences after each expedition |

Use original characters and a fictional listing service, SnowPlace. The game needs neither company data nor live property feeds. Its reward should be a warmer, busier neighborhood and a satisfying operation you designed.

## The product promise

You arrive in Frostwick with a garage and 100 Coins. The city has lost its winter power system, the Aurora Works. You turn overlooked properties into useful places, recruit a peculiar crew, and recover what each district needs to reconnect it. Rival developer Sterling Slush makes expeditions troublesome and provides comic friction.

Explore, bring something back, make one meaningful decision, and see a visible change. A short session should deliver a complete useful action. A long session should support planning and discovery without requiring unattended waiting.

```mermaid
flowchart LR
    A[Browse and inspect properties] --> B[Choose an expedition and crew jobs]
    B --> C[Explore, collect, solve, return]
    C --> D[Resolve rewards and production]
    D --> E[Buy, renovate, or specialize]
    E --> F[New routes, crew, and opportunities]
    F --> A
```

## How much we build, and when

| Stage | Playable scope | Evidence needed to proceed |
| --- | --- | --- |
| Feasibility | One character, one interaction, one compiled ROM | Build reproducibly; load in an emulator; verify buttons and display |
| First chapter | Garage, neighborhood street, depot; two expeditions; workshop production; café acquisition | Finish the entire loop, recover from failure, and preserve state through save/load |
| One-district release | More property decisions, side jobs, crew choices, inspection clues | Several strategies work; readable menus; no repeated chore required to progress |
| Campaign | Five freely connected districts, optional jobs, staged recruits, and restoration milestones | Each district adds a meaningful choice and fits the measured hardware budget |
| Optional expansion | Heat, deeper route variation, and further mission packs | Each feature proves fun and affordable in isolation before integration |

The first chapter targets 10–15 minutes, but only playtesting can establish its actual duration. The larger campaign is a content direction, not a delivery estimate. Prototype driving after walking and city transitions work, before committing to the full campaign art. Its feasibility remains unverified.

## The opening we should build first

The garage starts dim, with snow blowing through a broken window. Pip introduces the city in a few short dialogue pages. The player can examine nearby listings before heading to the depot.

The depot offers a clear required salvage route and a riskier optional branch. Returning with the required haul allows the workshop repair. Rivet then runs a production batch while the player completes a short delivery. The combined proceeds allow Cocoa Corner's acquisition and repair. Its windows light up, the street changes, and the player sees a new district lead.

This teaches exploration, risk, spending, crew assignment, production, and property ownership through action. The optional reward improves the player's position but never supplies a missing mandatory resource.

Tutorial economy and settlement rules are specified in the gameplay document. Treat those definitions as authoritative over numbers in the original pitch or incidental examples elsewhere.

## AI that belongs in this game

The verified AI workflow is creation: use Codex to help author and revise scenes, art, dialogue, and game logic, compile builds, and test them. The official [ModRetro development guide](https://developers.openai.com/blog/build-a-game-with-modretro-chromatic) describes this workflow.

Standalone play is designed around local game logic. Companions can remember a rescue, react to a broken promise, prefer certain jobs, and follow an understandable production policy. These are authored rules and saved choices. They do not require or imply a live language model running on the console.

The useful design question is whether a companion reacts in a memorable, understandable way. A small number of consequential reactions is better than large volumes of interchangeable dialogue. Each important memory flag should change something the player can actually notice.

If we later add Codex-authored mission packs, they are new game builds with deliberate installation and save-compatibility checks. They are not assumed to arrive automatically during play.

## Decisions already made for this plan

- Standalone cartridge play is the target.
- The core is strategy, property transformation, and expeditions.
- Connect public streets across all five districts without main-story travel locks. Use compact connected scenes as the initial implementation.
- Advance the economy through explicit expedition resolution, not wall-clock waiting.
- Keep early resources and menus small enough to understand on a handheld.
- Keep mandatory progression recoverable after a mistake or failed mission.
- Put visible outcomes behind remembered choices.
- Use a fictional setting, original dialogue, original art, and original music.
- Test the first district before producing the whole campaign's assets.

## Open questions that require evidence

The preferred workflow uses the ModRetro plugin, with direct GB Studio authoring and export as a documented alternative. The official GB Studio native toolchain has been exercised locally. Physical deployment remains unverified.

The following are development checks, not reasons to stop designing: which toolchain is available, how the chosen save configuration behaves, the actual scene and sprite budget, which controller mappings the preview uses, and whether proposed driving or hazard mechanics perform well. Hardware testing waits for the physical console.

Do not treat the detailed plan as proof of feasibility. Compilation, emulator testing, and physical playback are separate release gates.

## Definition of a successful first chapter

The player can start fresh, understand the next action without external instructions, complete the depot expedition, repair the workshop, assign production, complete a delivery, acquire Cocoa Corner, see the neighborhood change, and resume the same state after saving and loading.

The same build must survive cancellation, insufficient funds, repeated interaction, defeat or retreat, and a full inventory without duplicating rewards or permanently blocking progress. A reviewer should be able to follow the economy trace independently and reproduce every listed acceptance case in the eventual game.

No cartridge is written until a build passes emulator checks and the owner confirms the target cartridge contents may be replaced. Installing a game can overwrite its game and saves, as described in the [official deployment guide](https://developers.openai.com/blog/build-a-game-with-modretro-chromatic).

## Reading order

0. [Open-world contract](docs/OPEN_WORLD.md): free exploration, geographic connections, persistent state, and travel acceptance checks.
1. [Gameplay and economy](docs/GAMEPLAY.md): exact opening ledger, resources, properties, production, recovery, and edge cases.
2. [World and missions](docs/WORLD_AND_MISSIONS.md): five districts, twelve missions, three scene specifications, characters, dialogue, art, and interface design.
3. [Engineering and verification](docs/ENGINEERING.md): data model, settlement contract, saving, thirteen backlog items, toolchain alternatives, and release gates.
4. [Planning validation](docs/VALIDATION.md): independent arithmetic checks and resolved review findings.

When specifications overlap, the gameplay document owns numeric rules and economic ordering; engineering owns persistence and runtime state; the world document owns content and scene behavior. A nonterminal tutorial detection is distinct from a failed or retreated contract. Change related specifications together when these contracts change.
