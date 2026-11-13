# Hollywild voice and play

Hollywild sounds like capable people dealing with a city that has made simple work unnecessarily complicated. Keep the lines short, specific, and conversational. Let a character notice the actual problem before making a joke about it.

The player enjoys getting a thing to work. Repairs should leave evidence: a lamp comes on, a crooked wheel sits straight, a pressure gauge rises, or a repaired bench stays repaired on the next visit. Give the result room on screen. A congratulatory paragraph cannot replace seeing it happen.

## Dialogue rules

- Say what changed and what the player can do next.
- Use concrete nouns. Name the valve, receipt, drawer, wheel, or coffee machine.
- Give institutions a small, recognizable absurdity. Do not turn every person into a cynic.
- Let warmth come from useful help, remembered details, and somebody staying to finish the work.
- Keep setbacks proportionate. A silly permit can be funny without making the whole town cruel.
- Use original lines. Avoid quotations, personal biographical references, borrowed lyrics, imitation, or private source material.
- No em dashes, corporate filler, forced sentiment, or speech that explains the game's implementation.

## Example lines

These are original candidates, not a script already installed in the game.

| Moment | Line |
| --- | --- |
| Garage, before repair | "The bench has three good legs. That's a start." |
| Garage, work begins | "Hold that end. The wobble is doing most of the talking." |
| Garage, repair complete | "Solid bench. Working light. That little truck might survive a second lap." |
| First drive after repair | "It cleared the curb. The curb remains unimpressed." |
| Pipe room, introduction | "Four elbows. One gauge. Somehow there's also a permit." |
| Pipe room, wrong route | "That sends the pressure into a dead end. Turn the next elbow." |
| Pipe room, success | "Gauge is up. Nothing's leaking. I'll take it." |
| Parcel counter | "The label says fragile. They put it under the anvils." |
| Property inspection | "Nice paint. Open the cabinet before we call it fixed." |
| Cafe, completed upgrade | "The machine works. The coffee no longer tastes like the machine." |
| Holiday street | "They decorated the road barrier. Still a road barrier." |
| Crew, quiet thanks | "You fixed the light over my table. I can finish this now." |

## Readable choices and results

The garage signs use SAVE for the journal, STORY for the main campaign desk, and SIDE for neighborhood stories. Their conversations should start with the same plain labels. Keep the repair interaction tied to the physical workbench.

Physical challenges should expose their current state in the room. Pipe elbows show their open directions; a receiving gauge changes when flow reaches it. Use dialogue to explain controls and confirm an observed result. Let the player try again without repeating a long introduction.

Optional stories can be odd and small. A stubborn toy truck, a cabinet that nobody measured, or a delivery form with no box for the actual answer can carry a scene. Resolve the specific problem and show the payoff. Leave the town a little more usable.

## Garage restoration contract

The base garage contains a worn bench, uneven little crawler, and tired wall fixture. The `workshop` background variant restores the bench, aligns the truck's wheels, and adds a warm task light. It changes no collision, palette assignments, exits, site coordinates, or scene dimensions.

All background changes pass the same whole-scene tile consistency check used for property upgrades. A reused source tile must have one destination everywhere, including unchanged occurrences. This keeps native shared-tile replacements from repainting unrelated floor or wall cells. Native integration must apply the variant when `workshop` is set and when the player returns to the garage.

The art generator also defines four static elbow orientations and a source tank plus two receiver states. Their files are original 16-by-16 native sprite art with the existing source shades. The gameplay integration owns actor placement, palettes, current orientation, flow checks, and state persistence.
