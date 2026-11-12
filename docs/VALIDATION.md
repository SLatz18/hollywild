# Planning validation

Checked November 12, 2026. These are document and arithmetic checks, not emulator or hardware test results.

## Independent economy replay

The opening ledger was replayed separately from the proposed implementation, using the published costs and rewards.

| Scenario | Coins after Cocoa | Salvage after Cocoa | Productive ticks | Result |
| --- | ---: | ---: | ---: | --- |
| Required route only | 10 | 0 | 2 | Arithmetic passes |
| Optional depot bonus | 10 | 4 | 2 | Arithmetic passes |
| Failed delivery followed by successful retry | 10 | 0 | 2 | Reservation release preserves owned supplies; arithmetic passes |

Coin equation: 100 - 40 + 20 + 30 - 100 = 10.

Required Salvage equation: 10 - 4 - 2 - 4 = 0.

The initial six-Salvage proposal would finish four Salvage short. Ten guaranteed Salvage corrects it without relying on an optional route or repeated contract.

With five stored Salvage and a reserve floor of four, a two-Salvage job must pause. The next successful safe delivery after Cocoa adds 20 mission Coins and 16 property Coins, taking the base-path balance from 10 to 46; the workshop pauses without inputs.

These checks validate the stated arithmetic only. They do not prove the eventual game implements it, feels rewarding, or runs within hardware limits.

## Review corrections integrated

- Mission rewards settle before optional production, so storage priority is consistent.
- Reservations are part of owned stock. Releasing one never creates a second copy of its resources.
- Productive ticks require completed payable contracts. Inspections, purchases, empty returns, failures, and retreats do not create passive income.
- M03's story quest is separate from its one payable delivery contract.
- Tutorial spotlight detection is a nonterminal setback; terminal retreat still forfeits ordinary carried loot.
- Depot success requires the required pickup. An early return is retreat.
- The depot entrance can display the listing needed for M01, avoiding a hidden progression gate.
- Saves restore safe hub checkpoints. No mid-mission or power-loss-safe storage guarantee is assumed.
- Saved checkpoints explicitly restore HOME with the resolution lock clear, so purchases remain available after loading.
- The conservation equation includes sales, conversions, and deliberate disposals as signed resource changes.
- Pending overflow claims are explicit saved state. They block new dispatch, while hub spending and management remain available to resolve them.
- Three location concepts are the baseline; up to six room scenes are an engineering contingency, not additional content scope.

## Outstanding runtime validation

This was the pre-build planning review. Current compilation, asset, emulator, and save/load evidence is recorded in [Native prototype status](BUILD_STATUS.md). Physical hardware checks and additional edge cases remain pending as listed there.

See the [engineering test matrix](ENGINEERING.md#test-matrix) for acceptance cases. The independent planning review found transaction and progression ambiguities; those were corrected in the specifications before publication.
