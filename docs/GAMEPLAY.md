# Hollywild gameplay and economy specification

Design proposal for the first playable chapter and staged expansion. Numerical values are explicit tuning hypotheses, not playtest results. Read alongside the production blueprint and related specifications.

## Design decisions

The best version is a small city-building adventure with short playable errands and satisfying automation. The game should reward choosing an opportunity, doing something in the city, and seeing a building improve. Complexity belongs in combinations of a few clear rules.

The first chapter has three scenes: garage, Frostwick street, depot. SnowPlace and Cocoa Corner are street interactions; Cocoa has no explorable interior yet. Three tutorial mission IDs are agreed with the world designer: M01 inspect listings and accept depot job, M02 complete depot salvage, M03 repair workshop, recruit Rivet, assign production, finish a safe street delivery, and acquire Cocoa Corner.

The old draft's 6 guaranteed Salvage cannot cover workshop repair (4), the demonstration batch (2), and Cocoa restoration (4). Increase guaranteed first-depot salvage to 10. This makes the intended sequence feasible in two productive expeditions without asking the player to grind or discover an unstated extra reward.

Also change the old rule that every retreat advances production. Immediate retreat must not print money. Only a successful authored contract awards a work tick. This is a deliberate revision to the initial concept.

## Loop and timing

Hub planning -> accept contract -> review expected reward and queued production -> depart -> complete objective -> return -> see one settlement summary -> buy or upgrade -> repeat.

Hub browsing, conversations, purchases, crew assignments, and scene exits consume no work ticks. A contract awards at most one tick. Completing a multi-part contract does not award a tick for each sub-objective. A replay requires accepting a new run and replaying its objectives.

A successful eligible contract advances the productive cycle counter by one and resolves queued work once. A failed contract or voluntary retreat increments a separate attempt counter only. It provides no property income, production, relationship bonuses, or automatic scouting result. Reserved workshop inputs are refunded. This distinction appears in the pre-departure card as "Crew work completes when this job succeeds."

This is a game abstraction rather than a literal clock simulation. No wall-clock or offline income is proposed. Pausing, closing the console, or leaving the character idle never produces money. Repeating the safe delivery legitimately produces income because the player still performs its route. No anti-player diminishing rewards are needed; district progression also requires missions, recruits, and restored landmarks, so money alone cannot skip the story.

First-chapter pacing target: 1–2 minutes of introduction, 3–4 minutes of depot exploration, 2–3 minutes of setup and discovery, 2–3 minutes of delivery, and 1–2 minutes of restoration payoff. This 9–14 minute target is unvalidated.

## Resources and player-readable limits

| State | Starting value | Design cap | Use |
| --- | ---: | ---: | --- |
| Coins | 100 | 9,999 | Purchases and upgrades |
| Stored Salvage | 0 | 99 | Renovation and production |
| Expedition Salvage bag | 0 | 16 | Unbanked collection on a mission |
| Cheer | 0 | 100 | Persistent neighborhood reputation, never a consumable |
| Worker capacity | 1 | 3 in expansion | Simultaneous productive assignments |
| Salvage reserve | 4 | Player selectable later: 0, 4, 8 | Prevents jobs consuming construction supplies |

These are proposed game rules, not hardware limits. Pip is a dispatcher and uses no worker slot. Rivet uses one slot. Cheer is visible but does not need its own tutorial system. First restoration awards 5 Cheer. Cheer never decays, and main-story access must not depend on an optional, missable Cheer event.

Resource math uses whole numbers. Costs are shown before confirmation. A purchase validates all requirements and deducts all costs together; partial payments do not occur. Buying and restoring Cocoa are one transaction in the first chapter.

## Settlement contract

Reservation accounting: owned Salvage includes reserved inputs. Track reserved_salvage separately; spendable equals owned minus reserved. Completing a job subtracts its inputs from owned stock once and releases the reservation. Failure, retreat, or a paused job only releases the reservation; it never adds to unchanged owned stock. Every reference to a refund means this release.


Use this exact order to keep the economy reproducible:

1. At dispatch, assign a unique run ID. Freeze crew jobs, property ownership, upgrades, reserve level, and applicable bonuses. Newly acquired buildings and new assignments cannot produce for an already-dispatched run.
2. Queue jobs in player-selected priority order; use stable property ID order when no preference is set. Reserve their inputs from existing storage. A job can reserve input only if stock after reservation remains at or above the reserve. Pause unaffordable jobs without consuming anything. Display why.
3. No new stock acquired during the expedition can fund this run's production. Returned Salvage becomes eligible at the next departure.
4. During play, keep carried loot separate from stored supplies. The first release saves only at safe hub checkpoints. An interrupted mission restarts from the prior checkpoint, including its uncommitted reservations. Do not settle production midway through a mission.
5. At terminal outcome, first check whether this run ID has already settled. If so, do nothing. Mission success and final return are one settlement event, even if both fire scene triggers.
6. On success, bank guaranteed and optional mission rewards first. Increment the productive cycle once. Settle eligible queued work and property payouts from the frozen snapshot. Consume reserved inputs only for jobs that actually complete. Returned rewards have priority over optional production when storage is constrained.
7. On failure or retreat, bank no ordinary unbanked loot and grant no work tick. Refund reserved inputs. Keep all prior stored stock, upgrades, property ownership, and completed story flags. Explicit rescue/story flags that were committed earlier remain only where the mission design says so.
8. Update milestone flags, display the transaction list, mark this run settled, and save the complete post-settlement state together. Reloading restores either the previous safe hub checkpoint or the completed settlement, never a mixture of rewards and old flags. No mid-mission saves are planned.

Saved snapshots are design requirements; the implementation must validate how the chosen engine implements atomicity. Do not claim a hardware guarantee based on this design.

## First chapter ledger and reward IDs

| Event | Reward/cost ID | Coins change | Salvage change | Ending Coins | Ending Salvage |
| --- | --- | ---: | ---: | ---: | ---: |
| Start | START_C100 | +100 | 0 | 100 | 0 |
| Inspect/accept M01 | none | 0 | 0 | 100 | 0 |
| M02 depot success, work tick 1 | DEPOT_FIRST_BASE | 0 | +10 | 100 | 10 |
| Repair workshop | GARAGE_REPAIR | -40 | -4 | 60 | 6 |
| Recruit Rivet | RIVET_INTRO | 0 | 0 | 60 | 6 |
| Dispatch M03 delivery | reserve 2 Salvage, not yet consumed | 0 | 0 | 60 | 6 owned, 4 spendable |
| Delivery success reward | DELIVERY_SAFE | +20 | 0 | 80 | 6 owned |
| Workshop completes at work tick 2 | GARAGE_BATCH | +30 | -2 | 110 | 4 |
| Buy and restore Cocoa | COCOA_RESTORE | -100 | -4 | 10 | 0 |
| Restoration milestone | COCOA_FIRST_CHEER | 0 | 0 | 10 | 0, plus 5 Cheer |

Optional first-depot route: DEPOT_FIRST_BONUS adds 4 Salvage. Its final post-Cocoa balance is 10 Coins and 4 Salvage. It is a bonus, never required. Both base and bonus are one-time reward flags. A later replay uses DEPOT_REPEAT_BASE instead: 6 Salvage, plus an optional 2. The depot has no entry cost and remains accessible.

The next successful safe delivery after Cocoa yields 20 Coins from the mission and 16 Coins from Cocoa. The garage has no eligible input and pauses. Final balance: 46 Coins and 0 Salvage. This fourth-step demonstration can be an optional post-chapter loop; it should not delay the first light-up celebration.

M03 includes the purchase as its story completion condition, but the delivery sub-contract awards its single work tick upon return. Purchasing Cocoa cannot award another work tick. Distinguish the story quest from the payable contract in data.

## Buildings and specialization

Prototype contains only the repaired garage and Cocoa. The other SnowPlace prospects can be inspected with clear future access requirements; the player cannot spend tutorial funds on unrelated purchases before Cocoa restoration. This protection is part of the brief introduction and disappears at the first milestone.

| Property | Acquisition/restoration cost | Base effect | Optional specialization after the prototype |
| --- | --- | --- | --- |
| Inherited Garage | 40 Coins + 4 Salvage | One worker converts 2 Salvage to 30 Coins per work tick | Cargo annex increases expedition bag from 16 to 24; Efficient bench keeps recipe at 2 Salvage but pays 36 Coins. Choose one for 120 Coins + 6 Salvage |
| Cocoa Corner | 100 Coins + 4 Salvage | 16 Coins per work tick, no worker | Premium bar pays 24 Coins; Neighborhood table pays 16 Coins and +1 Cheer, up to 100. Either costs 100 Coins + 4 Salvage |
| Lantern Flats | 240 Coins + 8 Salvage | +1 worker capacity immediately, maximum 3 | A later second housing upgrade grants the third slot; no resident rent simulation |
| Tinsel Toolworks | 220 Coins + 8 Salvage | One worker converts 2 Salvage to 36 Coins per work tick | Assembler pays 48 Coins for 2 Salvage; Recycler generates 2 Salvage per tick with the worker. Either costs 140 Coins + 6 Salvage |
| Parcel Palace | 260 Coins + 8 Salvage | One worker earns 20 Coins per work tick | Express route pays 28 Coins; Supply route pays 14 Coins and 1 Salvage. Either costs 140 Coins + 6 Salvage |
| Aurora Station | Story milestone | Restores district services and unlocks final chapter | Cost and components remain deferred until chapter pacing is measured |

Upgrades add their effect beginning at the next dispatch. For the first expansion, specialization can be changed at the hub for a modest 20 Coins, with its original unlock remaining purchased. This makes experimentation reversible. Do not include specialization switching in the prototype UI.

Passive Cocoa has a 6.25-work-tick coin-only payback before valuing its Salvage cost. Its 100-Coin upgrade adds 8 Coins per tick, a 12.5-tick coin-only payback. These are explicit tuning inputs. If the campaign is shorter than roughly 20 meaningful contracts, reduce upgrade prices or improve effects; otherwise the purchase is strategically unattractive.

## Crew assignment interface and tradeoffs

Prototype crew page shows Rivet, Workshop, "2 Salvage -> 30 Coins", "Keep 4 Salvage", and the next-job status. A sets Work or Rest. No scripting interface. On departure show "Rivet: ready" or "Rivet: needs 2 surplus Salvage."

Expansion workers can take building jobs or personal specialist tasks, but never both in one cycle. Housing expands the number of productive assignments. Rivet can operate manufacturing, Moxie can operate delivery, Dot can scout, and Nib can negotiate. Specialist restrictions should be introduced only when each recruit has at least two useful options.

Proposed specialist tasks: Dot reveals one fixed undiscovered property detail after a successful contract. Nib earns a one-use discount on one named unowned property, capped at 10% of its Coin cost; it does not stack or reduce Salvage requirements. Their results are authored state changes, not random promises. Details need numerical review with the content roster before implementation.

Interesting midgame choices come from opportunity cost:

- Run the depot for 6 Salvage to fund renovation, or run delivery for 20 immediate Coins.
- Assign a scarce worker to manufacture profit, deliver dependable cash, or reveal a better property prospect.
- Keep 8 Salvage for a purchase, or lower the reserve and accelerate current income.
- Buy housing and broaden automation, or improve one existing building.
- Restore community spaces for Cheer and story consequences, or specialize for stronger cash flow.

Recycler and Garage can form a renewable chain, but Recycler output cannot fuel Garage until the following cycle. Two workers and two buildings are required. A snapshot rule prevents ordering tricks or accidental same-cycle compounding.

## Failure, shortages, and overflow

A free repeatable safe street delivery is always available after M02. It guarantees 20 Coins for completing its route and has no timer, entry fee, or damage requirement. The depot is always available for essential Salvage. Failure forfeits unbanked loot only. There is no debt, mandatory upkeep, foreclosure, hunger timer, or expiring essential purchase in the prototype.

First-depot pickups respawn on a failed or abandoned run. Reward flags are set only when the full successful transaction commits. The safe route contains all 10 required first-time Salvage. No optional skill challenge can prevent completion.

A job that cannot reserve inputs pauses with a reason. No negative stock, partial batch, or automatic reserve override is permitted. After the initial Cocoa restoration, reserve changes require a visible confirmation card when they would expose supplies for a pinned purchase. Pinning a purchase proposes its required Salvage as the reserve; the player can deliberately override it.

Overflow follows a bounded rule. If a mission reward exceeds storage, keep that single run's excess in a return crate and block the next dispatch until it is resolved. The player can spend resources, transfer what fits, sell ordinary Salvage for 2 Coins each if Coin space exists, or explicitly leave unwanted excess. Excess Coins can be donated in full without adding spendable resources. Essential quest items are separate flags and are never discarded or converted. Ordinary production that would overflow pauses and refunds its reserved input; do not silently destroy input or output. Property income that cannot fit is held with the same one-run settlement claim. Never accumulate a second return crate.

The full overflow UI is not on the tutorial path but must exist before prolonged free play. The implementation can choose lower or higher caps after testing, provided the visible rules remain consistent.

## Independent checks and playtest targets

Arithmetic invariant: starting balance + awarded resources + produced output + sale/conversion receipts - purchases - consumed inputs - items surrendered in sales/conversions - explicit discards/donations = final owned resources, including any pending return crate. Apply each term per resource: a sale removes Salvage and adds Coins; a donation removes Coins. Reserved resources remain owned until consumed or refunded. Spendable balance excludes reservations.

Test cases:

1. Base tutorial yields exactly 10 Coins, 0 Salvage, 5 Cheer, repaired garage, Cocoa owned, and two productive ticks.
2. Optional depot path yields exactly 10 Coins and 4 Salvage at that same milestone.
3. Failure during delivery refunds 2 reserved Salvage: balances remain 60 Coins/6 Salvage, with no work tick. Successful retry produces the same tutorial result.
4. Exit and immediately retreat ten times: no Coin or Salvage gain and no productive ticks.
5. Trigger the return event twice or reload after the result screen: a settled run grants nothing twice.
6. Dispatch with 5 Salvage and reserve 4: workshop pauses. Return with 6 new Salvage: no workshop output this run; it becomes eligible on the next departure.
7. With two queued jobs and stock sufficient for only one, selected priority determines the winner consistently. No job partially consumes its input.
8. Buy Cocoa after returning: no retroactive income for the prior mission.
9. Dispatch at a storage cap and earn rewards: one return crate appears, no resource vanishes, and further dispatch is blocked until resolved.
10. Reach zero Coins/Salvage with no active jobs: safe delivery and depot still provide a recovery path.
11. Try purchasing without enough of either resource: neither balance changes.
12. Advance productive ticks while Cheer is 100: Coin rewards remain correct and Cheer stays at 100.

Playtest hypotheses: first visible restoration within 15 minutes, no required repeat mission before Cocoa, at most two menu pages between selecting a job and departing, and each recurring contract enjoyable enough to repeat three times. Track completion time, menu time, failed purchases, unused crew, reserve confusion, and players who cannot explain where their last reward came from. Measure these through actual play; do not present them as achieved.

Deferred systems: driving, Heat, combat, worker injuries, debt, dynamic rent, random market prices, live listings, live generative conversations, co-op, offline income, and infinite procedural districts. Expand only after the first complete loop is fun and reliable.
