# Chromatic City original soundtrack

Seven original, editable hUGETracker v6 songs use Game Boy Color's four native channels. The direction is warm jazz harmony, relaxed hip-hop rhythms, rounded bass and playful keys. No existing song melodies, recordings, samples or lyrics are incorporated. The artist field identifies the project, not a real performer.

| Area | Composition | Approx. BPM | Harmonic home | Loop |
| --- | --- | --- | --- | --- |
| Garage | Porchlight Pocket | 90 | Cmaj9, Am9, Dm9, G9 | 86 s |
| Frostwick | Snowglass Steps | 82 | Dm9, Gm11, Cmaj9, Fmaj9 | 94 s |
| Candy | Peach Soda Pavement | 100 | F6/9, Dm9, G9, Cmaj9 | 77 s |
| Brassworks | Copper After Hours | 100 | Em9, A9, Dm9, G9 | 77 s |
| Velvet | Lilac Window Seat | 82 | Abmaj9, Fm9, Dbmaj9, Eb9 | 94 s |
| Aurora | Rooftop Blue Hour | 90 | Am11, Fmaj9, Cmaj9, G9 | 86 s |
| Finale | All the Windows Glow | 100 | Cmaj9, Em9, F6/9, G9 | 77 s |

Each song contains 32 bars in eight four-bar blocks: introduction, melodic answer, reordered harmony, lifted answer, sparse breakdown, returning answer, high-register passage, and turnaround. The harmony, motif, rhythmic accents and/or density differ between areas. The final harmonic destination returns into the opening without a silent tail. Native hUGE playback repeats its order list. Tempos assume the default roughly 60 Hz driver, with 16 rows per bar. The manifest uses 59.7275 Hz to estimate loop durations.

## Four-channel arrangement

- Pulse 1 carries chord-tone melodic phrases with ninths, sevenths and occasional elevenths. Phrases leave gaps and use syncopated rows instead of constant runs. The high passage changes octave and timbre.
- Pulse 2 plays quieter third/seventh/ninth shells and broken voicings. This implies extended chords within monophonic hardware limits.
- Wave carries root/fifth bass phrases, rests and anticipated next roots. Its 32-sample rounded waveform is authored mathematically and uses half output level.
- Noise carries low kicks, brush snares, quiet hats and end-of-phrase ghost notes. Velvet removes the early backbeat for a half-time feel.

The soundbank is **Felt Pocket Keys**, **Soft Chord Dust**, **Glass Bell Answer**, **Copper Muted Keys**, **Rounded Sine Bass**, **Low Pillow Kick**, **Brushed Backbeat**, **Closed Dust Hat**, and **Soft Rim Ghost**. Pulse volumes are 5-9 of 15 and use falling envelopes with no pitch sweep. Noise levels are 3-10 of 15 with short hardware lengths. Explicit note cuts create key and bass rests. Unused instrument slots are padded because the official writer expects all 15 slots in each instrument bank.

## Reproduction and integration

Run `node scripts/create-music.mjs` after the pinned `.tools/gb-studio` dependencies are installed. The generator bundles the official local `saveUGESong` and `loadUGESong` helpers using that checkout's esbuild and TypeScript alias configuration. It downloads nothing. Temporary helper code stays in the system temporary directory and is removed on completion.

Outputs are `assets/music/<area>.uge`, matching `.uge.gbsres` resource sidecars, and `content/soundtrack.json`. The manifest exposes `musicResources` in the official GB Studio resource shape, as well as `tracks` with IDs, harmonic descriptions, counts, hashes and timing. IDs are deterministically namespaced and remain stable on regeneration. Filename values are relative to `assets/music/`.

Play a track with `EVENT_MUSIC_PLAY` and `args: { musicId: track.id }`. The pinned official event implementation uses `musicId`. Native scene routing and the music setting are integrated by the main project generator.

The `.uge` assets open in GB Studio's music editor. To make lasting authored changes, edit the composition generator; rerunning it replaces generated music and metadata.

## Validation and limits

Generation requires a byte-identical official parser/writer roundtrip for every song, eight sequence blocks, 32 channel patterns, valid native note indices and a meaningful note count on all four channels. Each composition contains 179 melody notes, 180 comping notes and 112 bass notes, plus 232-324 noise hits. Pattern cells are 64 rows and subpatterns are 64 rows, matching the pinned v6 format. The scripts set explicit note gates, hardware instrument lengths and decaying envelopes instead of relying on unlimited held notes.

These checks establish native resource compatibility and arrangement structure. They do not establish subjective musical quality or playback on physical hardware. ROM compilation, emulator audio capture and scene-routing checks belong to the integration verification.
