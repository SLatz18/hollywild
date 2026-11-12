# Campaign implementation contract

Target a roughly 120-minute first-time story playthrough with optional exploration. Duration is an unmeasured pacing target. Do not add waits, repeated money grinding, or unreadable dialogue to manufacture length.

Native GB Studio game only. Existing five districts, ten scenes, economy, crew roles, and regression paths remain usable. All public geography stays open. Story progress is opt-in at a new garage campaign desk. Existing opening pages and menu indexes remain stable.

## Authored data

`content/campaign.json` contains `title`, `targetMinutes`, `acts`, `missions`, `lore`, `endings`.

Each of 24 missions: `id` (1..24), `act` (1..6), `title`, `summary`, `minutes` (pacing estimate), `intro` (array of short pages), `steps`, `outro` (pages), `reward` (`coins`, `salvage`). Each mission has 4..7 meaningful steps, varied across locations and mechanic types. Main story order is sequential; optional work and free exploration can occur at any time.

Each step: `node` (one of the keys below), `type` (`talk`, `collect`, `puzzle`, `choice`), `hint` (clear destination plus action), `pages` (short dialogue pages). Puzzle adds `options` (2..4 strings, max 7 characters), `answer` (1-based index), `wrong` (pages); no progress on wrong choice or B. A step may add `reactions` (array of `{key, value, pages}`) for conditional dialogue based on a prior persistent choice. Choice adds `options`, `outcomes` (one page-array per option), `choiceKey` (one of `route`, `policy`, `trust`, `ending`), and optional `choiceValues` (integer values per option, default index). Choices must have later authored consequences, not only saved numbers. Talk/collect complete once after dialogue. Quest items are flags, never ordinary sellable scrap.

Each lore entry: `id`, `node`, `title`, `pages`; optional inspectable narrative, available out of order and remembered without a resource payout. Endings: `warmth`, `industry`, `commons`, each an array of ending pages. The ending choice occurs before the final mission finishes and has three options mapping to those endings; later story steps should show its consequences. Main story rewards have a shared guarded transaction; no duplicate reward and no repeatable-job production tick. Award only while no repeatable job is active and capacity allows; do not lose pending mission completion when wallet/storage is full.

Pages use plain printable ASCII, no em dashes. Keep words <=18 characters, paragraphs suitable for automatic wrapping to 18 glyphs by 5 lines (at most roughly 70 characters per page preferred). Natural dialogue and specific environmental clues. Target 6,000+ meaningful authored words across campaign, optional lore, and endings, with readable page breaks. Do not repeat boilerplate to reach a word count.

## Native progress

Append globals after existing IDs 0..42. Suggested: `story_mission` (0 not started, 1..24 active, 25 complete), `story_step` (0-based), `story_completed`, choice globals, and lore flags. The garage desk starts the campaign. Completing a mission at its final objective awards it and activates the next mission there, without mandatory trips back to the garage. Every step advances exactly once. The journal gives current mission and exact next destination. Native scene scripts and saved state own progress. Add safe story checkpoints in new rooms using the existing one-slot save semantics; saving with a repeatable job active remains blocked. No transient story reset on load.

Use `campaign_node` actor sites with field `node` matching below. `campaign_desk` at garage starts/shows story. `campaign_save` may reuse existing save terminal behavior in new rooms. Add a `Story` pocket-menu option after existing entries, preserving old menu indexes. Never auto-advance multiple adjacent steps from one actor interaction.

## New world nodes

World builder adds ten distinct 256x256 scene rooms (all public), two per district. Each has four reachable interactable campaign nodes, thoughtful navigational layout, a safe entrance/return route, and visible thematic labels. New scene names and node IDs are fixed:

| Scene | Four node keys |
| --- | --- |
| frostwick_archive | archive_catalog, archive_badge, archive_blueprint, archive_clerk |
| frostwick_depot | depot_manifest, depot_toolbox, depot_gate, depot_foreman |
| candy_sorting | sorting_red, sorting_blue, sorting_addresses, sorting_moxie |
| candy_rooftops | roof_courier, roof_vane, roof_antenna, roof_parcel |
| brassworks_foundry | foundry_gears, foundry_regulator, foundry_rivet, foundry_shelf |
| brassworks_control | control_pump, control_gauge, control_relay, control_dot |
| velvet_lodge | lodge_listing, lodge_disclosure, lodge_junction, lodge_nib |
| velvet_rooftops | velvet_permits, velvet_slush, velvet_skylight, velvet_survey |
| aurora_signal | signal_box, signal_map, signal_lantern, signal_clerk |
| aurora_core | core_turbine, core_bypass, core_grid, core_festival |

Narrative can use any node in any mission, but the hint must name the room and distinguish its object. Add at least one later consequence for each persistent choice key and an earned final reconciliation with Slush. Economics should fund the optional property fantasy without requiring repeat-job grinding to finish the story. The full campaign supersedes the prototype's 1000-Coin/property-gated Aurora ending. Before story completion the old station interaction gives a campaign lead; afterward it celebrates the restored network. Property ownership remains optional business progression. No early legacy ending may mark the story festival complete.
