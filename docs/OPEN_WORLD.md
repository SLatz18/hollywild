# Open-world design contract

Direction update, November 12, 2026. This document supersedes earlier proposals to unlock entire districts in a fixed story order. It describes intended behavior, not a claim that every feature is already implemented. Consult the build status for implemented coverage.

## Freedom is the core requirement

Hollywild is an explorable city with property, crew, and job systems. The player may wander, inspect buildings, talk to people, collect clues, compare opportunities, or accept a job. A main-story objective supplies direction without preventing an unrelated outing.

Five districts form one connected place. Their public streets are available from the opening of the eventual full-city version. Story prerequisites may protect a particular warehouse, job, upgrade, or finale. They must not place a generic story lock on a whole neighborhood.

The first native build should demonstrate this direction through five traversable district scenes and an enterable home base. It does not need all twelve campaign missions or every proposed interior to establish an open-world foundation.

## City structure

- Connect districts through recognizable streets, alleys, bridges, or marked passages. Use a loop, with additional cross-connections when the layout supports them.
- Give every district at least two public connections, allowing the player to approach familiar locations from more than one direction.
- Keep exits reciprocal. Returning through a route places the player at the corresponding entrance, facing away from the boundary, without immediately retriggering it.
- Provide landmarks and directional signs. Crossing a district boundary should preserve orientation and the feeling of a journey.
- Keep streets available while a job is active. Crossing an ordinary boundary never completes, cancels, or pays a job.
- Use connected scenes and readable transitions as the baseline. Continuous scrolling across every district is a separate performance experiment, not a requirement for geographic freedom.

The city's size will be expanded against actual compiled resource use and playtesting. Do not promise a particular number of screens or interiors from theoretical cartridge capacity.

## Things to discover

Every implemented district needs a distinct visual identity, at least one useful interaction, and a clear reason to return. Targets include a property prospect, a contact or job board, a supply opportunity, and a memorable optional detail.

Interiors are authored places with a purpose: a workshop, a shop, a home to inspect, a hidden storeroom, or a mission location. Add useful interiors before decorative empty rooms. A purchased property changes its visible state or interaction and retains that state on return.

Side content can be discovered before a main-story character mentions it. An inspected clue can be remembered so the player is not forced to repeat the discovery later. Required story objects remain protected from ordinary sales and production.

## Jobs and progression

Jobs are offers, not the only reason movement is allowed. The prototype can support one active payable contract at a time, with explicit accept and abandon options. The player can still explore during it. A collected parcel or job flag persists through ordinary scene transitions.

Successful completion grants its defined reward and one eligible production tick. Wandering, opening a menu, crossing a district, or abandoning an empty run grants none. Repeatable work uses fresh run state and a published payout, while one-time discoveries use persistent flags.

The garage-to-Cocoa sequence remains a guided route whose arithmetic is independently checked. It is not a promise that every player follows that route or has the same balance afterward. Free-choice spending requires free recovery jobs and supplies so a different purchase cannot permanently block progression.

Campaign access restrictions should name the missing capability, item, relationship, or construction task. Favor an alternative approach or detour when practical. Story order should follow genuine dependencies rather than district numbering. The final Aurora restoration can still require earlier work across the city.

## Persistent city, bounded simulation

Persist owned buildings, repairs, recruits, completed jobs, discovered clues, and important choices. Reset temporary actors and hazards from documented rules when entering a scene. A reset must not duplicate a one-time reward.

Show the crew's status in management and explain why a job is paused. Production remains deterministic and tied to successful contracts in the prototype. There is no claim that every distant NPC or shop runs a continuous real-time simulation.

The first build uses a garage checkpoint. Additional safe locations are a later usability priority so a larger map does not require repeated cross-city trips simply to save. Each added checkpoint must preserve the same transaction and save guarantees.

## Movement and vehicles

Responsive walking, reliable collision, and good route design come first. Driving is now an early feasibility experiment for the open-world direction, after walking and transitions work, rather than an assumption deferred until all story content is finished.

A vehicle prototype must demonstrate entering/exiting, collision, camera behavior, scene transitions, and safe recovery if the vehicle is left elsewhere. If it does not work well, improve walking routes and later transport options before changing the entire engine. No drivable-vehicle feature is claimed until that experiment succeeds.

## Open-world acceptance checks

1. A fresh player can reach all five implemented districts without buying a property or completing the main quest.
2. The player can return home through another public route, with no one-way trap or repeated boundary transition.
3. Ordinary travel preserves money, inventory, ownership, and active job state exactly.
4. A player can decline a job, roam, and return to accept it later.
5. Buying or inspecting a property does not automatically advance an unrelated story mission.
6. Re-entering a scene does not duplicate a reward or undo a completed repair.
7. At zero spendable resources, an available free task can restore progress.
8. An active job can be abandoned explicitly without generating income or duplicating reserved supplies.
9. A loaded checkpoint restores a coherent city state and places the player in a safe, usable location.
10. Each district contains something useful to do; distance alone does not count as content.

These checks complement the economic and save tests. A small compiled city that passes them is a stronger starting point than a large map that only looks open.
