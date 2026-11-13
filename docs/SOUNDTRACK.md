# Hollywild composed score (v0.6)

Seven original four-channel pieces now use explicit eight-bar A/B melodies and bass parts, rather than the previous common chord-tone pattern. Each has a 48-bar form with a contrasting middle passage, a quieter section, and a thematic return. Repetition is retained where it establishes a hook; extra length alone is not evidence of musical quality.

| Area | Piece | Approx. BPM | Loop | Musical idea |
| --- | --- | ---: | ---: | --- |
| Garage | Porchlight Pocket | 90 | 129 s | A rising E-G-A invitation answered by a descending home phrase; borrowed minor color in the bridge. |
| Frostwick | Snowglass Steps | 81.82 | 141 s | An unhurried F-E-D descent, a held ninth, and a later answering rise. |
| Candy | Peach Soda Pavement | 100 | 116 s | A cheeky repeated A-C pickup and offbeat gaps; longer phrases open the middle section. |
| Brassworks | Copper After Hours | 100 | 116 s | A low E-B-D riff with displaced accents; a climbing bridge provides relief from the machinery. |
| Velvet | Lilac Window Seat | 75 | 154 s | A low, spacious C-Eb-Bb phrase with a held arrival; gentle half-time drums leave room for the harmony. |
| Aurora | Rooftop Blue Hour | 90 | 129 s | An unresolved E-B-C figure and changing suspended harmony; the bridge opens the skyline without holiday instrumentation. |
| Finale | All the Windows Glow | 100 | 116 s | The garage E-G-A hook returns with an upper answer and a fuller band, then leaves a breath before looping home. |

## Composition and arrangement

`content/score.mjs` contains the authored melodies, matching A/B harmonies, bass lines and section orders. A note is written as `onset:pitch:duration`, in sixteenth-note rows within a 16-row bar. Pitches describe intended audible scientific pitch. The compiler compensates for the engine's note-table octave labels: note index zero produces approximately C2 on pulse but C1 on wave.

The garage's rising E-G-A invitation returns in the finale. Frostwick uses a falling answer and held phrase goals; Candy Row uses short repeated pickups and offbeat gaps; Brassworks uses a lower riff and tighter accents; Velvet uses a slower half-time feel and more space; Aurora leaves suspended phrases before resolving. Bridges introduce new melodic sentences and harmonic color. Short bass approaches connect chord changes; pickups at section boundaries are retargeted to the actual following root rather than assuming the original phrase repeats.

The lead ranges from audible G3 to E5. Accompaniment is reduced to one or two quieter guide tones in most bars, with some three-note fills. Those tones move to nearby voicings instead of restarting the same arpeggio on each chord. The bass is centered an octave above the previous arrangement and has a stronger second harmonic for small-speaker audibility. Occasional brief B1 pickups lead into C2; the ordinary range is C2-C3.

Every piece has its own two-bar percussion and accompaniment pattern. Small one- or two-frame note delays provide measured timing offsets, rather than moving an entire snare a sixteenth late. Quiet passages remove the first four melody bars (six in Velvet's hush), reduce accompaniment and bass attacks, and retain only a sparse percussion pattern. Natural envelope decay and explicit note gates leave room between phrases. Written gate length is an upper bound: a plucked tone can decay before its gate ends.

## Holiday placement

Holiday timbres stay local despite the broader score rewrite. Garage has four music-box bars and no sleigh percussion. Frostwick has four music-box bars and eight sleigh-accent bars. Candy Row has eight of each. The finale uses both in 16 of its 48 bars. Brassworks, Velvet and regular Aurora contain neither instrument. All melodies remain original; there are no sampled recordings, copied lyrics or traditional carol medleys.

## Corrected sound design

The previous short kick used a noise-clock setting with shift 14. [Pan Docs](https://raw.githubusercontent.com/gbdev/pandocs/master/src/Audio_Registers.md) states that shifts 14/15 stop the hardware noise clock. An isolated diagnostic ROM also produced zero captured samples for the old short-hit configuration, while valid settings produced nonzero output. That diagnostic wrote sound registers only in its own empty emulator instance; it was separate from button-only game tests. PyBoy does not fully implement the stopped-clock rule or hardware length behavior, so this is not a physical-device test.

The new kick uses noise note 46 with a 7-bit sequence; the snare uses note 46 with a 15-bit sequence; hats use note 54, and selective sleigh accents use 49/51. Every emitted noise note is checked to avoid the invalid clock range. Pulse volumes are 4-7 (music box 5), with quieter accompaniment and separate phrase envelopes. Bass uses half output level, or quarter level in sparse sections. The waveform's added second harmonic supplies audible upper information without making the fundamental an octave too low.

## Reproduction and evidence

Run `node scripts/create-music.mjs` using the pinned local GB Studio checkout. It compiles the authored score into editable `.uge` files and matching resource sidecars, using the official writer and parser. Resource IDs remain stable. The native cartridge needs no new runtime plugin or online service.

Checks cover official binary roundtrips, 12 orders/48 patterns per track, legal note ranges and effects, voice overlaps, bounded note delays, substantially reduced quiet sections, seasonal-instrument placement, and distinct complete arrangements. An independent review inspected actual exported patterns, instruments and loop boundaries. Full native audio captures cover every section and a loop wrap, while gameplay tests cover routing, mute, save/reboot, and the finale. Source changes belong in the score/compiler; regeneration replaces manual music-editor changes.

Structural review and audio-signal tests do not establish enjoyment, subjective mix quality or physical Chromatic playback. The new previews are captured from the running native cartridge in the emulator, without added instruments or post-production effects.
