# Hollywild native visual direction

The original procedural pixel art pairs winter blue shadows with cranberry masonry, amber shop windows, muted mint storefronts, and soft violet stone. Pale warm snow connects the districts. Contrast stays strongest on interactive actors, doors, and existing solid fixtures. Roads use quiet repeated granite tiles so the relaxed holiday city stays readable at the Game Boy Color's native resolution.

All artwork is authored by `scripts/create-assets.py`. It uses four native source shades per background tile and the existing seven world palettes; palette slot seven remains reserved for UI. There are no copied images, external image dependencies, music recordings, or runtime dependencies.

## Districts and public rooms

- Frostwick: timber lintels, softly lit windows, snow scallops, shuttered garage, and warm welcome-room details.
- Candy Row: mint and cranberry awnings, candy-striped facade posts, ribboned parcels, and detailed sorting cubbies.
- Brassworks: copper trim, riveted lintels, snow-capped stacks, workshop tools, machine gauges, and pipe housings.
- Velvet Heights: pale columns, violet masonry, quiet lodge upholstery, reading furniture, and winter skylights.
- Aurora Yard: tram rails, inset roof vents, muted mint signal equipment, calibrated dials, and warm turbine details.

A restrained string-light motif ties together the city's roofs, public rooms, garage, and property interiors. It is drawn on existing facades and walls. Archive shelves have individually bound books. Freight rooms have tied packages. Roof wells have inset glazing bars. Reading-room furniture has upholstery and book details. Existing object outlines remain the collision cue.

The authored atmosphere pass changes no scene dimensions, collisions, exits, site coordinates, or spawns. It introduces no actors. An in-memory comparison checks that geometry before and after the pass is identical. Root integration remains responsible for native cartridge rendering checks.

## Property improvements

Every property keeps its actual public inspection room. The generator also outputs an improved version of that same room:

| Room | Variable | Improved background | Visible improvement | Changed tile cells | Shared tile replacements |
| --- | --- | --- | --- | ---: | ---: |
| Cocoa Corner | `perk_cocoa` | `cocoa_interior_upgraded.png` | Polished serving counter, espresso machine, renewed cafe tables | 26 | 15 |
| Parcel Palace | `perk_parcel` | `parcel_interior_upgraded.png` | Brass sorting cubbies and reinforced ribboned packages | 48 | 12 |
| Tinsel Toolworks | `perk_toolworks` | `toolworks_interior_upgraded.png` | Better tools and calibrated copper lathe | 20 | 19 |
| Lantern Flats | `perk_flats` | `flats_interior_upgraded.png` | Renewed upholstery, brass key desk, small record cabinet | 26 | 22 |

The per-scene `backgroundVariants` array contains `variable`, `background`, `paletteIndices`, and `uniqueTiles`. Variant dimensions and palette indices match their base scene. The variable names are stable existing perk identifiers; the art generator does not allocate gameplay variables.

The replacement contract is compatible with native shared VRAM tile replacement: every occurrence of one source 8-by-8 tile maps to exactly one destination tile. A final normalization discards ambiguous proposed edits. An unchanged occurrence participates in that check, so an upgrade cannot accidentally repaint a reused floor or wall tile. Native integration should derive replacement coordinates and tileset data from the PNG pair, select the variant using the perk variable on scene initialization, and apply the same replacements after the perk is acquired for an immediate visible result.

## Ambient animation

Six existing NPC sheets (`pip`, `rivet`, `moxie`, `nib`, `dot`, `slush`) and two existing interaction sheets (`book`, `property_sign`) use a 96-by-16 directional animated layout. Their metadata declares `profile: directional_animated`, `ambientAnimation: true`, and `suggestedAnimSpeed: 31`.

The six frames follow the existing native template: down at horizontal offsets 0/16, right at 32/48, and up at 64/80. NPC animation is a subtle scarf or cap movement, with stationary feet. Books turn a page highlight; property signs have a gentle light glint. Native resources use looping two-frame idle states and preserve the old nonplayer collision bounds. All dialogue and menus temporarily hide hardware sprites so animated world icons cannot cover interface text.

The player uses the same directional frame order. Existing static parcel, crate, board, and door-marker sprites stay static. No new colliding actor is required for animation.

## Native tile budgets

In-memory source checks produce the following unique tile counts. Every base and improved background is below the 256-tile ceiling.

| Scene | Unique tiles |
| --- | ---: |
| Frostwick | 81 |
| Candy Row | 77 |
| Brassworks | 92 |
| Velvet Heights | 97 |
| Aurora Yard | 97 |
| Garage | 42 |
| Cocoa Corner | 57 |
| Parcel Palace | 52 |
| Tinsel Toolworks | 72 |
| Lantern Flats | 77 |
| Frostwick Archive | 68 |
| Frostwick Depot | 67 |
| Candy Sorting | 65 |
| Candy Rooftops | 65 |
| Brassworks Foundry | 60 |
| Brassworks Control | 56 |
| Velvet Lodge | 77 |
| Velvet Rooftops | 66 |
| Aurora Signal | 63 |
| Aurora Core | 66 |

Improved backgrounds contain 57, 52, 72, and 75 unique tiles respectively. These are source-generation checks, separate from native rendered evidence and physical-device testing.

## Property integration

`create-upgrade-tiles.py` verifies that every repeated base tile maps to exactly one replacement tile across the improved background. Native tile-replacement events then apply those changes immediately after project completion and when returning to the room. The palette-index map stays unchanged. This avoids duplicate scenes and preserves existing navigation and interaction coordinates.
