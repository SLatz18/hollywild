# Hands-on Hollywild

This is a first gameplay variety pass. Two optional activities add spatial repair and route execution to the existing city. The 67 campaign and side-story menu puzzles still exist; this update does not claim to have replaced that structure throughout the game.

## Pipe workshop

In Brassworks, use the small door to the right of TOOLS. Take the interior east exit, then go north through the Foundry to reach Control. No purchase is required. Walk to the four elbow pieces and press A to rotate them. Each has two visible open ports. Connect the left tank to the right pressure gauge through matching neighboring ports. The gauge lights when pressure reaches it; inspect it to collect 25 Coins once. The tank explains the controls, and the reset sign restores the original orientations without restoring the reward.

The game derives neighboring connections from actual positions. It does not compare a menu answer or accept a memorized code. Rotations make a short sound without opening dialogue. The gauge identifies how far pressure traveled when a connection is broken. Pipe positions and payment persist in ordinary checkpoint saves.

## Rooftop parcel trial

In Candy Row, use the small door to the right of PARCEL, then the interior east exit and the next north connection to the roof. No purchase is required. This is an on-foot parcel course inspired by careful driving lines, not a drivable vehicle mode. Start at the marked sign, then choose your route by walking it.

- The longer left route has three flags to cross in order and pays 12 Coins for an intact parcel.
- The shorter central corridor pays 16 for a clean run. Steer around the two staggered rough strips and cross its exit flag.
- A rough-strip hit reduces the result to 6. Retreating out of a committed short route requires a reset.
- Only improvement over the best paid result earns more Coins. A 12-point run followed by a 16-point run pays 4 more, for a lifetime maximum of 16.

There is no countdown or lost cargo charge. Resetting keeps the best paid result. A full wallet or active ordinary job defers the reward; claim it at the finish afterward. Neither activity runs workshop production or changes ordinary delivery rewards.

## Payoff and voice

Repairing the garage now changes the workbench, task light and little crawler truck. The change remains visible on reentry. SAVE, STORY and SIDE labels identify the garage desks. SELECT names the current location. START > Guide > Play lists both activities.

Campaign and side-story openings and endings use shorter conversational writing, practical details and dry humor. All original puzzle clues, options, answers and branching consequences are preserved. Completing a campaign mission returns control without automatically playing the next introduction; START > Story provides that briefing. The existing free-roaming city stays open.

## Research and possible next activities

An agent reviewed primary developer material for [Portal](https://store.steampowered.com/app/400/Portal/), [Mini Motorways](https://dinopoloclub.com/games/mini-motorways/), [Poly Bridge](https://store.steampowered.com/app/367450/Poly_Bridge/), and [Captain Toad](https://csassets.nintendo.com/noaext/image/private/t_KA_PDF/manual-WiiU-Captain_Toad_Treasure_Tracker_en?_a=BATCtdAA0). The design direction is to change what the player does: arrange connections, build usable paths, choose and execute routes, or move objects to alter access.

Possible later prototypes include recoverable bridge planks, a crate-and-gate relay, paired freight chutes, and a rotating crossing. These are original adaptations proposed for a small tile-based game. They are not implemented here. This cartridge does not have Portal's engine, 3D physics or portal rendering.

Runtime verification belongs in BUILD_STATUS and its exact-ROM report. Agent reviews and automated replays do not establish human enjoyment, completion time or physical Chromatic behavior.

### Off-road research for a later crawler course

Saber's developer guides describe reading terrain before committing to a route, using low gear when traction matters, and recovering with a winch. Those suggest a small original toy-crawler course: a long dry trail, a short muddy line, a visible recovery anchor, and a delivered plank that opens a bridge. See the [MudRunner developer guide](https://blog.playstation.com/archive/2017/10/27/from-reading-the-terrain-to-fuel-conservation-8-tips-for-tackling-ps4-off-road-sim-spintires-mudrunner-out-next-week) and [SnowRunner developer guide](https://blog.playstation.com/2020/04/23/8-tips-to-master-the-machines-of-snowrunner-out-april-28/).

A possible GBC version would use discrete tiles and explicit dry, mud and stuck states. It would teach one recovery action, then combine a delivery with a repaired crossing. This is researched design work only. Vehicles, low gear, winching and bridge placement are not implemented or tested in this release.
