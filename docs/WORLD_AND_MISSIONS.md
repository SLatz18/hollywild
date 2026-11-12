# Hollywild: world, missions, and presentation specification

Design proposal for integration into the master plan. All content below is original design, not an assertion that a scene, mechanic, or asset is implemented. The intended display is 160 x 144. Asset counts are planning targets; engine, palette, actor, and memory limits still require verification. Economy amounts belong to the economy specification and are referenced here by named reward tokens.

## Creative direction

Hollywild is a city worth exploring and improving. The pleasure is the contrast between what a place is and what it could become: a dark garage becomes a humming workshop, a shuttered café becomes a warm corner, an isolated neighborhood becomes part of a working city.

GTA contributes a connected city, opportunistic jobs, shortcuts, vehicles as a later possibility, and freedom to pursue a side objective. Elf contributes sincere optimism colliding with absurd urban problems. Zillow contributes discovery, property comparison, surprising disclosures, and the desire to see inside one more building. None requires copied characters, geography, dialogue, branding, or a large seamless world.

Humor should come from competent people handling ridiculous circumstances. Pip cares about residents; Rivet cares about sound construction; Nib treats every viewing like opening night. Avoid making every elf interchangeable or making property ownership a spreadsheet exercise. Every substantial purchase changes both a useful system and a visible place.

Three design promises:

1. At least one interesting find per short outing: a clue, shortcut, useful item, unusual listing, or character beat.
2. Every district restoration visibly changes a familiar scene, so progress feels owned.
3. Every important choice produces a readable consequence. Dialogue remembers a handful of meaningful events instead of pretending to remember everything.

Tone defaults: comic mischief, low-stakes pursuit, neighborhood warmth, and an eccentric property rival. No graphic violence. A terminal failure or retreat forfeits all unbanked expedition loot, never the entire business. Tutorial spotlight detection is a separate nonterminal setback that clears only the optional bonus. Failure and retreat do not award a productive work tick. Tone can be adjusted without changing the core systems.

## Campaign spine and district progression

The Aurora Works once distributed heat through an ingenious citywide network. After a winter failure, its components were separated for repair. Records were lost, neighborhoods improvised, and the network never restarted. Sterling Slush is buying disconnected sites to build a sealed luxury district. His mistake is treating each property as an isolated asset. The player's advantage is making the places work together.

Slush should have a credible motive: he thinks centralized control is the only way to stop another collapse. He is funny and stubborn rather than a secretly supernatural villain. The final conflict tests whether a resilient network can outperform his closed system.

| District | Play identity | Story discovery | New strategic choice | Unlock and payoff |
| --- | --- | --- | --- | --- |
| Frostwick | Small brick main street, garage, depot | The garage contains an Aurora service badge and a misfiled route map | Safe salvage versus optional bonus haul; first crew assignment | Restore Cocoa Corner; warm windows and occupied benches replace shutters |
| Candy Row | Dense market lanes and parcel counters | Deliveries once followed the old heat-service routes | Fast contracts versus dependable routes; recruit Moxie | Reopen Parcel Palace; market awnings and a delivery circuit animate the street |
| Brassworks | Repair yards and compact production floors | A dismantled regulator can be rebuilt with local knowledge | Specialize production or preserve materials for renovation | Restore Tinsel Toolworks; factory windows light and a formerly silent whistle sounds |
| Velvet Heights | Ornate houses, strange open houses, hidden service alleys | Slush's showcase estate sits above an essential junction | Negotiate, inspect, or trade favors; recruit Nib and advance Dot's discovery arc | Restore Lantern Flats and secure junction access; public paths reconnect formerly closed streets |
| Aurora Yard | Snowy rail approaches and the old station | The system failed from a single-point dependency, not a lack of holiday spirit | Coordinate acquired capabilities and choose the final restoration emphasis | Restore Aurora Station; the Winterlight Festival transforms a previously explored route |

District access is unlocked by explicit story milestones, not an invisible reputation score. Each district can have optional prosperity goals, but a less optimized player still reaches the ending. Required objects cannot be sold, discarded, or consumed by production.

Campaign content target: five districts and twelve authored missions, added incrementally. The first release candidate can be Frostwick alone if that loop is fun. Campaign length should be measured during playtests, not promised from a mission count.

## Crew: identities, arcs, and remembered moments

Pip is present from the opening. Other recruits require a clear introduction and one demonstrated skill. An available recruit never silently disappears because a player selected the wrong joke.

| Character | Visual silhouette | Personality and role | Small character arc | State that changes dialogue |
| --- | --- | --- | --- | --- |
| Pip | Short hat, oversized clipboard, quick two-step | Earnest dispatcher; makes priorities and next steps understandable | Learns that optimism can include an honest estimate | First repair, first failed outing, first restored property, festival |
| Rivet | Broad mittens, square cap, tool satchel | Practical builder; explains input/output tradeoffs | Starts by fixing objects, ends proud of a functioning neighborhood | Workshop restored, reserve policy chosen, regulator completed |
| Moxie | Long scarf, parcel harness, forward lean | Confident courier; seeks clever routes rather than speed alone | Learns that reliable delivery is a skill worth boasting about | Courier rescued, safe or risky route selected, depot reopened |
| Dot | Round glasses, notebook, lantern | Reserved scout; notices a tiny detail others missed | Moves from reporting clues to making a decisive recommendation | Clue inspected, optional service path found, junction restored |
| Nib | Bow tie, folding sign, dramatic pointing pose | Negotiator; performs confidence but reads contracts carefully | Gives up the perfect pitch to make one honest promise | Listing disclosure checked, favor honored, public path opened |
| Sterling Slush | Tall coat, umbrella, rolled blueprint | Property rival; dislikes uncertainty and loves ribbon-cuttings | Can concede that a distributed solution worked without becoming a different person | Three district milestones and final plan choice |

The elf crew can be fully organic fictional characters. Their reactive game behavior does not require them to be robots or literal in-world AI. Prototype speaking cast: Pip and Rivet only. Slush can appear as a signature on a sign or letter. Moxie, Dot, and Nib are expansion assets.

Reactive dialogue priority: immediate objective problem, mission result, property milestone, remembered choice, then flavor. This avoids a character joking about the weather while the player needs to know why production stopped. Each character receives short authored variations rather than an unconstrained dialogue generator.

Example pages, to be broken into measured in-game text boxes:

- Pip, arrival: "Good news: you own a garage." / "Better news: most of it is still indoors."
- Rivet, first inspection: "The beam is crooked. The idea is good. We can fix one of those."
- Pip, failed outing: "You're back. That's the important bit." / "The crates will still be there."
- Rivet, production blocked: "I kept your repair supplies aside. Need more scrap for this job."
- Moxie: "Fastest route? Easy. Best route? Give me a second."
- Dot: "That wall has a door on the old map." / "Walls are terrible at keeping secrets."
- Nib: "I described it as open-plan." / "The inspector said roofless."
- Slush: "My plan has only one flaw." / "It requires everyone to agree with me."
- Pip, first restoration: "People are staying for a second cup." / "I think that's how a neighborhood starts."

## Twelve-mission campaign

Reward names below are references for the gameplay specification. A mission's one-time reward and repeatable contract payout must be distinct to prevent duplicate awards.

| ID | Mission and location | Objective and interesting choice | Outcome and reward reference | Expansion stage |
| --- | --- | --- | --- | --- |
| M01 | Keys to Almost Somewhere, Frostwick | Inspect the garage; compare three listings; accept the depot job. Optional: inspect the old service badge | Unlock depot, reveal first objective; no spend required | First playable |
| M02 | Midnight Pickup, Frostwick depot | Collect marked salvage and return. Take a safe lane or optional spotlight lane | DEPOT_FIRST_BASE; optional DEPOT_FIRST_BONUS; unlock workshop repair | First playable |
| M03 | A Warm Welcome, Frostwick | Repair workshop, recruit Rivet, assign one batch, complete a safe delivery, restore Cocoa Corner | DELIVERY_SAFE; production outcome; district milestone | First playable |
| M04 | The Great Cocoa Spill, Candy Row | Walk a replacement shipment around frozen puddles; choose direct lane or longer covered route | DELIVERY_STANDARD; unlock repeatable market contracts | Expansion 1 |
| M05 | Lost in the Post, Candy Row | Match three parcels to environmental address clues; optional rescue of a stranded courier | COURIER_RECRUIT; record courier rescue; recruit Moxie | Expansion 1 |
| M06 | Operation Sleigh Repo, Candy Row | Recover a repossessed delivery sled using lawful release documents or a comic service-gate diversion | PARCEL_PALACE_UNLOCK; route choice flavor; reusable shortcut | Expansion 1 |
| M07 | The Parts That Matter, Brassworks | Inspect a broken regulator; recover components from two small yard rooms; optional cosmetic salvage | REGULATOR_COMPONENTS, protected quest items; introduce Dot | Expansion 2 |
| M08 | Shift Happens, Brassworks | Configure two workstations to route supplies around a stalled conveyor. Choose efficiency or a buffer | TOOLWORKS_UNLOCK; production specialization; regulator repaired | Expansion 2 |
| M09 | Open House, Closed Portal, Velvet Heights | Inspect a dubious listing whose service closet opens into a forgotten toy warehouse; compare disclosure to evidence | LISTING_CLUE; access route; Dot recruit milestone | Expansion 3 |
| M10 | Permit Panic, Velvet Heights | Recover windblown permit pages through a connected rooftop route, then choose an honest concession in negotiation | JUNCTION_ACCESS; Nib joins; Lantern Flats restoration available | Expansion 3 |
| M11 | Last Stop, Warmth, Aurora Yard | Bring protected components to the station and solve three short routing problems using acquired crew skills | AURORA_READY; final mission available | Expansion 4 |
| M12 | The Winterlight Run, city finale | Complete a compact festival supply route; select a restoration emphasis; start the Aurora Works | FESTIVAL_COMPLETE; ending variants; return to free play | Expansion 4 |

For M06, recovery of the sled can be represented as an object delivered at the exit. Drivable vehicles are not required. For M08, a menu-and-switch puzzle is the baseline; physically simulated conveyors are optional. M09's portal is a whimsical scene transition to a normal authored room, not a procedural world. M10 uses walkable roof paths with marked edges, not precision jumping unless separately validated.

Repeatable post-mission contracts reuse clear spaces and vary pickup/drop-off markers, cargo type, or one route obstruction. Authored campaign missions remain finite and testable. Random variation should never hide a required campaign item or change the cost after accepting a job.

## First playable: exactly three scenes

The first chapter uses a garage, a street, and a depot. A 10–15 minute first playthrough is an unmeasured pacing target, not a promise. Cocoa Corner is an exterior transformation with a management panel. No café interior, driving, extra district, procedural map, combat, or separate cinematic scene is needed.

### Scene F01: inherited garage

Purpose: home, repair target, production assignment, and safe return point.

Layout target: one screen or a very small connected room. South door leads to F02 street. North wall contains the broken workbench. Pip stands to one side of the entry path. The assignment board occupies the opposite wall. An old Aurora service badge sits on a shelf as an optional inspectable. Rivet appears beside the repaired bench once recruited. Keep all walking paths at least one player-width plus a visible margin; no actor may stand in the entry landing tile.

Entrances: new game places the player inside the south door, facing north; normal street entry uses the same landing; expedition results return to this location after summary resolution. Exits: the south door remains usable unless the first one-time arrival text is being shown.

Interaction sequence:

1. Talk to Pip, setting intro_seen. Repeated talk gives the current objective.
2. Inspect the bench. Before depot completion, show a repair preview with requirements but no forced spending.
3. Inspect service badge, optionally setting badge_seen and adding a short journal note. This is never mandatory for progression.
4. After successful M02, choose Repair at the bench. The economy transaction checks requirements and changes workshop_state from broken to restored exactly once.
5. Rivet's introduction sets rivet_recruited without a separate fee in the tutorial unless the gameplay specification explicitly budgets one.
6. Assignment board shows one job, Produce, with input, expected output, and the time unit. Confirm sets the next-cycle assignment. There is no production just from opening the panel.
7. Return from a qualifying expedition and show one summary of mission rewards plus production outcome. A blocked production reason is named directly.

Failure recovery: no damaging objects or timers; B exits panels; insufficient funds leaves all state unchanged; re-entering never replays recruitment or refunds costs. If an interaction script is interrupted by save/reload, committed state drives the visible scene. The first available safe contract remains accessible.

Scene flags and states: intro_seen, badge_seen, workshop_state, rivet_recruited, production_assignment, first_production_seen. Persistent ownership and resource state come from the economy model. Don't create a second local copy.

Scene acceptance: player can enter, inspect, leave, repair, assign, and return without being trapped. Repeated A at the bench cannot double-charge. Pip's current-objective hint changes after each milestone. Broken and restored bench states are visually distinct without relying only on color.

### Scene F02: Frostwick street

Purpose: property fantasy, safe exploration, short delivery, and the first visible neighborhood payoff.

Layout target: one compact street. Garage door on west side; listing board near the central square; Cocoa Corner on east side; depot entrance at north end; safe delivery pickup and destination at opposite corners, with a simple snowbank detour. Two locked prospective properties are visible but clearly marked Preview. The first playable does not need pedestrians with schedules.

Entrances: garage exit lands beside its door; depot exit lands at the north end; other edges are visibly blocked by fences or snowdrifts. Return paths are obvious and never locked behind a purchase.

SnowPlace board has three entries: Cocoa Corner (available after workshop milestone), Lantern Flats (later), Parcel Palace (later). A highlighted entry opens a compact property detail panel. Only Cocoa can be purchased in this chapter, so a player cannot accidentally spend the tutorial budget on an unproductive property. Previews explicitly say when they become available.

M01 ends when the player has inspected at least one listing and accepted the depot job. Viewing all three is optional. The depot job can also be accepted directly at its entrance if the player missed the board; that interaction first shows Cocoa's compact listing and sets listing_seen before offering the job. Intro hints should not force repetitive backtracking.

M03 safe delivery: pick up a labeled parcel from the public pickup stand, walk to the café shutter, and press A. Successful delivery completes one productive work tick, invoking the shared cycle-resolution logic. A menu trip or door transition alone never advances production. The player can preview the route and payout before accepting. Until Cocoa is restored, this safe task remains available as recovery work with a clear repeat payout distinct from its first-time reward.

Cocoa purchase: show full cost and current balances before the final confirm. After a successful atomic purchase/repair transaction, shutter tiles become a lit window and awning; a sign changes from For Sale to Open. A short, skippable dialogue celebrates the change. Repeated interaction now opens the property panel rather than purchase confirmation.

Failure recovery: delivery has no timer in the prototype; player can return to pickup and cancel without a fee. Cancellation grants no productive work tick and refunds any reserved production inputs, following the shared economy specification. No parcel can be permanently lost in this scene. Buying Cocoa never disables the free recovery contract. A failed affordability check changes nothing.

Scene flags and states: listing_seen, depot_job_accepted, delivery_state, cocoa_state, first_delivery_reward_claimed, frostwick_restored. All one-time rewards have a saved claimed flag committed with their reward transaction.

Scene acceptance: reach every functional doorway; view all listing cards; cancel a purchase; fail affordability; complete delivery once and repeat safely; purchase Cocoa once; re-enter and see its restored appearance. Delivery completion and retreat/cancel must not accidentally resolve two productive work ticks.

### Scene F03: Frostwick depot

Purpose: one small expedition with readable risk and a satisfying route choice.

Layout target: one screen where practical, otherwise a short room with a visible return route. South entrance is a safe staging area. The left route leads around crates to the guaranteed salvage pickup. The right route passes a single periodic spotlight to optional bonus salvage. A low fence prevents entering the bonus area without passing its clearly marked opening. The exit stays visible or is marked by a distinct arrow/sign.

Entrances: south staging point, facing north. Exits: south return gate opens a Return Home confirmation with carried loot preview. There is no automatic exit just for brushing a boundary.

Hazard presentation: spotlight alternates between marked scan positions on a fixed, learnable sequence. Show a warning pose or ground marker before it moves. If dynamic lighting is too expensive, use a patrol marker with clearly highlighted danger tiles. The mechanic is avoid a readable hazard, not render a lighting effect.

Interactions: A picks up salvage; pickup objects disappear for the current run. The safe route guarantees access to DEPOT_FIRST_BASE, 10 Salvage on successful completion. DEPOT_FIRST_BONUS adds 4 optional Salvage and is never needed for the tutorial. An inspectable painted Aurora route marker sets depot_route_clue_seen, with a small icon added to the journal. It provides story flavor without affecting the economy.

Nonterminal DETECTED setback: detection returns the player to the safe staging point with a short message and clears only the optional bonus carried this run. Required tutorial salvage already collected remains secured for the first tutorial expedition. Later contracts can use the general unbanked-loot rule. A visible Retreat option remains available, granting no productive work tick and refunding reserved production inputs under the shared economy rules. No detection can take banked funds, purchased buildings, or protected quest objects.

Completion: Return Home counts as success only after required_salvage_collected is true. Returning earlier is a retreat, with no work tick and no ordinary loot banked. Successful Return Home transfers secured salvage and any valid bonus exactly once, resolves one productive work tick, records depot_first_clear, and returns to F01 for the summary. Re-entering the depot later is a separate repeatable contract with its own payout, not a replay of the first-clear award.

Scene flags and states: run_active, required_salvage_collected, bonus_salvage_carried, depot_route_clue_seen, depot_first_clear, run_reward_committed. Run-local flags reset only when a new contract starts; durable flags survive reload. Saving is allowed only at safe hub checkpoints, with clear messaging. A normal load restores the last completed checkpoint, not a partial expedition.

Scene acceptance: safe route can be completed without exposure; bonus can be collected and banked; detection clears bonus only; retreat is always possible; crossing the return trigger twice cannot duplicate a reward; replaying first-clear cannot duplicate its one-time reward.

## First chapter economy handoff

Reservation accounting: owned Salvage includes reserved inputs. Track reserved_salvage separately; spendable equals owned minus reserved. Completing a job subtracts its inputs from owned stock once and releases the reservation. Failure, retreat, or a paused job only releases the reservation; it never adds to unchanged owned stock. Every reference to a refund means this release.


The integrated tutorial uses the economy specification's resolved values. Start at 100 Coins. The successful depot outing awards 10 guaranteed Salvage, with 4 optional. Repair the workshop for 40 Coins and 4 Salvage. Assign GARAGE_BATCH with the default 4-Salvage reserve. Complete one DELIVERY_SAFE for 20 Coins; the batch consumes 2 Salvage and produces 30 Coins. The guaranteed path then holds 110 Coins and 4 Salvage, enough for COCOA_RESTORE at 100 Coins and 4 Salvage. Completion leaves 10 Coins and zero Salvage and awards COCOA_FIRST_CHEER of 5. No repeated contract is required.

M01 inspection grants no work tick. M02 success is tick 1. The successful delivery inside M03 is tick 2. Purchasing and restoring Cocoa grants no work tick. Failure, retreat, and cancellation grant no productive tick and refund reserved inputs. Production reservations and payouts belong to the shared economy transaction, not scene-local scripts.

Agency within this short chapter comes from inspecting listings in any order, choosing whether to inspect the badge and route marker, and choosing the optional bonus route. Progress has a necessary teaching sequence, but the player should not be marched through forced inspections or repeated deliveries. After the first restoration, the game opens optional contracts and preparations for the next district.

## Mission-state rules and ending variation

Use mission states Locked, Available, Active, Ready to Turn In, Complete, with a separate repeatable-contract record. A completed story mission never returns to Active because a player revisits a room. Persistent quest flags should describe facts, not UI states.

Each mission record specifies prerequisites, start interaction, objective facts, protected items, reward identifier, claimed flag, failure reset behavior, and next unlock. Shared mission outcomes go through one resolution path. A source of truth prevents the café's visual Open state from disagreeing with ownership.

Only three optional decisions need visible ending variation initially:

- courier_helped: Moxie gives a personal thank-you and a festival delivery cameo.
- public_path_opened: the finale route uses an opened neighborhood shortcut and residents gather there.
- restoration_emphasis: the player selects community warmth or industrial renewal for a cosmetic festival focus and a different closing paragraph. Both restore the network and allow continued play.

Do not claim dozens of endings. One coherent ending with a few earned details is sufficient. Slush's final line changes based on district prosperity, not an opaque morality score.

## SnowPlace listing copy

Use one short disclosure per card; longer inspection text is optional.

| Property | Short listing disclosure | Inspectable discovery |
| --- | --- | --- |
| Inherited Garage | Includes tools. Some assembly remains. | A prior owner's Aurora service badge |
| Cocoa Corner | Strong foot traffic. Feet currently cold. | A hand-written menu with one missing family recipe |
| Lantern Flats | Sunny rooms. Landlord has not met winter. | A shared staircase that reconnects two streets |
| Parcel Palace | Excellent connections. Parcels disagree. | Old routing labels beneath the newer signs |
| Tinsel Toolworks | Move-in ready, if you are a wrench. | A machine still set to the final unfinished shift |
| Velvet Lodge | Open plan. Roof restoration encouraged. | Fresh footprints at a supposedly unused service door |
| Aurora Station | Historic charm. History requires supervision. | A wall map matching the garage badge |

Listing panel prioritizes property name, price, condition, function, and next unlock. Humor is secondary; it must not hide a real cost or prerequisite.

## Environmental storytelling

Frostwick before restoration: one lit garage lamp, crossed-out opening hours at Cocoa, footprints stopping at a shutter. After: warm windows, fresh footprints between garage and café, a repaired bench, and a short original musical phrase.

Candy Row: piles of wrongly addressed parcels become sorted stacks; signs acquire clear route icons; a previously stranded courier appears at work.

Brassworks: scattered tools line up on pegboards; steam appears only as a light decorative loop; repaired equipment shares the same emblem seen in the garage.

Velvet Heights: extravagant For Sale signs contrast with narrow closed passages. Restoring the public path creates a visibly simpler route and new foot traffic.

Aurora Yard: the final lighting sequence revisits familiar visual motifs. Avoid introducing an unseen spectacular location only for the ending. The payoff is transformation of spaces the player already knows.

## Readable handheld interface

Screen specification is a design target, to be verified on a real display. Prototype layouts should work with short labels and large, high-contrast pixel text. Determine actual glyph widths in-engine before finalizing line counts.

Exploration: minimal resource strip when useful; action hint appears near a lower edge when an object can be used; current objective available with Select. No permanent minimap competing with the play area.

SnowPlace: one property per detail page. Name at top; small portrait; compact Price/Repair/Use fields; Buy and Back actions. List navigation shows three names at a time with a visible selection cursor. Locked previews say Later rather than accepting input and silently failing.

Crew assignment: one crew member per page with job, input, output, and status. Status uses text such as Working, Needs Scrap, or Reserve Held, plus an icon. Use left/right to change crew and up/down to select a job.

Return summary: mission result first, gained/lost resources second, production result third, next objective last. Allow A to page forward. Never overflow into an unreadably dense ledger.

Dialogue: short text pages, no timed auto-dismiss, optional fast text. Names can be abbreviated only if consistent. Line wrapping must be checked in the actual font. B skips already-seen flavor but should not accidentally select a consequential choice.

Accessibility targets: hazard states distinguishable by shape and timing as well as color; visual equivalents for audio cues; text speed setting; no flashing full-screen success sequence; option to reduce decorative snow; no mandatory rapid tapping; no essential time pressure in the first chapter; menus pause world hazards if supported and verified.

## Art and audio inventory

First playable asset targets:

| Asset group | Minimum contents | Reuse strategy |
| --- | --- | --- |
| Player | Idle and walk in four directions; interact pose optional | Same base sprite through all three scenes |
| NPCs | Pip and Rivet, idle and a small expressive pose | Dialogue portraits optional, not required |
| Environment | Garage, street, depot; one broken/restored bench state; one shutter/open café state | Shared snow, brick, crate, fence, door, and sign tiles |
| Interactions | Salvage pickup, parcel, spotlight/patrol marker, listing board, service badge | Consistent outline or marker for usable objects |
| UI | Font, cursor, panel border, three resource icons, objective marker | Same panel language across listings, crew, and results |
| Music | One quiet hub loop, one depot loop, one restoration phrase | Street can share hub music |
| Effects | Confirm, cancel, collect, blocked action, detected, purchase, production, mission complete | Keep distinct and brief |

These are authoring estimates, not ROM capacity promises. One actor or palette implementation may combine several visual roles. Engineering validation establishes actual format and limits.

Expansion art adds one district tile family at a time. Avoid building five districts' finished art before the prototype proves the interaction rhythm. Music themes should be original and should not quote famous holiday film music or GTA radio tracks.

## Content acceptance and editorial review

First chapter content is ready only when a fresh player can tell what to do without the designer narrating. Check objective hints, visible interactables, feedback after spending, and the reason a crew job is blocked. Test both the direct route and optional detour, with dialogue skipped and with every object inspected.

Review every listing against the actual property cost and effect. Review every mission hint against a reachable object. Read every text box at actual display size. Verify that every saved choice has its promised consequence and that no flavor line contradicts a failed or incomplete mission.

Preserve the warm city-building fantasy if scope is reduced: cut driving, extra interiors, ambient NPC schedules, and procedural contracts before cutting the property transformation or first successful automation result.
