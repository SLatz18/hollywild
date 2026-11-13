/** Authored score. Each bar is explicit onset:pitch:duration in 16 rows.
 * Scientific pitches describe intended audible pitch, not hUGE's octave labels.
 * A/B are complete eight-bar phrases with matching harmony and bass lines.
 */
const bars = s => s.trim().split('|').map(b => b.trim());
export const score = {
  garage: {
    name:'Porchlight Pocket', ticks:10, groove:'pocket',
    form:['theme','answer','bridge','space','return','outro'],
    identity:'A rising E-G-A invitation answered by a descending home phrase; borrowed minor color in the bridge.',
    A:{chords:'Cmaj9 Am9 Dm9 G13 Em7 A7 Dm9 G13'.split(' '),
      lead:bars(`1:E4:3 5:G4:2 8:A4:5 14:G4:1 | 0:E4:5 7:D4:2 11:C4:4 |
        2:F4:3 6:E4:2 10:D4:5 | 0:B3:3 5:D4:2 8:E4:3 13:D4:2 |
        1:E4:3 5:G4:2 8:B4:5 14:A4:1 | 0:G4:4 6:E4:3 12:C#4:3 |
        2:D4:3 6:F4:2 10:E4:2 13:D4:2 | 0:B3:4 6:D4:3 11:G4:3`),
      bass:bars(`0:C2:5 7:E2:2 11:G2:3 15:G#2:1 | 0:A2:5 7:E2:3 12:C2:2 15:C#2:1 |
        0:D2:6 8:A2:3 13:F#2:2 | 0:G2:5 7:D2:3 12:F2:2 15:D#2:1 |
        0:E2:5 7:B2:2 11:G2:3 15:G#2:1 | 0:A2:5 7:E2:3 12:C#2:3 |
        0:D2:6 8:F2:3 13:F#2:2 | 0:G2:6 8:D2:3 13:B1:2`)},
    B:{chords:'Fmaj9 Fm6 Em7 A7 Dm9 G13 C6 G13'.split(' '),
      lead:bars(`0:A4:6 8:G4:3 13:E4:2 | 1:Ab4:5 8:G4:2 12:F4:3 |
        0:G4:5 7:E4:3 12:D4:2 | 2:C#4:4 8:E4:2 12:G4:3 |
        0:F4:3 4:A4:3 9:G4:2 13:F4:2 | 0:E4:4 6:D4:3 12:B3:3 |
        1:E4:3 5:G4:2 8:A4:4 14:G4:1 | 0:F4:5 7:D4:3 12:B3:2`),
      bass:bars(`0:F2:6 8:C3:3 13:Ab2:2 | 0:F2:7 9:Ab2:2 13:D#2:2 |
        0:E2:6 8:G2:3 13:G#2:2 | 0:A2:5 7:E2:3 12:C#2:3 |
        0:D2:6 8:F2:3 13:F#2:2 | 0:G2:5 7:D2:3 12:B1:2 |
        0:C2:7 9:E2:3 14:F#2:1 | 0:G2:6 8:F2:3 13:B1:2`)}
  },
  frostwick:{
    name:'Snowglass Steps',ticks:11,groove:'brush',form:['theme','space','bridge','answer','return','outro'],
    identity:'An unhurried F-E-D descent, a held ninth, and a later answering rise.',
    A:{chords:'Dm9 G13 Cmaj9 Fmaj9 Bm7b5 E7 Am9 A7'.split(' '),
      lead:bars(`0:F4:6 8:E4:3 13:D4:2 | 2:D4:4 8:B3:5 |
        0:E4:4 6:G4:3 11:D5:4 | 0:C5:6 9:A4:5 |
        2:F4:4 8:A4:3 13:F4:2 | 0:G#4:5 7:F4:3 12:E4:3 |
        0:B4:6 9:A4:5 | 2:G4:4 8:E4:3 13:C#4:2`),
      bass:bars(`0:D2:8 10:A2:4 | 0:G2:7 10:F2:3 14:B1:1 |
        0:C2:8 10:E2:4 | 0:F2:8 10:A2:3 14:Bb2:1 |
        0:B2:7 9:F2:3 14:D#2:1 | 0:E2:8 10:B2:3 14:G#2:1 |
        0:A2:8 10:E2:4 | 0:A2:7 9:G2:3 14:C#2:1`)},
    B:{chords:'Fmaj9 G13 Em7 Am9 Dm9 G13 Cmaj9 A7'.split(' '),
      lead:bars(`3:A4:3 7:C5:3 12:B4:3 | 0:A4:5 8:G4:5 |
        2:G4:4 8:B4:4 | 0:C5:5 8:B4:2 12:A4:3 |
        0:F4:6 8:E4:3 13:D4:2 | 2:B3:3 7:D4:3 12:E4:3 |
        0:G4:7 10:E4:4 | 2:G4:4 8:E4:3 13:C#4:2`),
      bass:bars(`0:F2:8 10:C3:3 14:F#2:1 | 0:G2:7 9:D2:3 14:D#2:1 |
        0:E2:8 10:G2:3 14:G#2:1 | 0:A2:7 9:E2:3 14:C#2:1 |
        0:D2:8 10:A2:3 14:F#2:1 | 0:G2:7 9:F2:3 14:B1:1 |
        0:C2:8 10:E2:3 14:G#2:1 | 0:A2:7 9:G2:3 14:C#2:1`)}
  },
  candy:{
    name:'Peach Soda Pavement',ticks:9,groove:'skip',form:['theme','answer','bridge','return','break','outro'],
    identity:'A cheeky repeated A-C pickup and offbeat gaps; longer phrases open the middle section.',
    A:{chords:'F6 Dm9 Gm9 C13 Fmaj9 Bbmaj9 Gm9 C13'.split(' '),
      lead:bars(`0:A4:2 3:C5:2 7:A4:2 10:G4:2 14:F4:1 | 1:F4:3 6:A4:2 10:E4:4 |
        0:Bb4:3 5:A4:2 9:G4:4 | 2:E4:2 6:G4:2 10:A4:3 14:G4:1 |
        0:A4:2 3:C5:2 7:D5:3 12:C5:3 | 1:Bb4:4 7:A4:2 11:F4:3 |
        0:G4:3 5:Bb4:2 9:A4:3 | 2:G4:3 7:E4:3 12:C4:2`),
      bass:bars(`0:F2:3 5:C3:2 8:F2:3 13:C#2:2 | 0:D2:4 6:F2:2 10:A2:3 15:F#2:1 |
        0:G2:3 5:D2:2 8:Bb2:3 13:B1:2 | 0:C2:4 6:G2:2 10:Bb2:3 15:E2:1 |
        0:F2:3 5:A2:2 8:C3:3 13:A2:2 | 0:Bb2:4 6:F2:2 10:D2:3 15:F#2:1 |
        0:G2:3 5:D2:2 8:F2:3 13:B1:2 | 0:C2:4 6:G2:2 10:Bb2:3 15:E2:1`)},
    B:{chords:'Bbmaj9 Bbm6 Am7 D7 Gm9 C13 F6 C13'.split(' '),
      lead:bars(`0:D5:6 8:C5:4 | 2:Db5:5 10:Bb4:4 |
        0:C5:3 5:B4:2 9:A4:5 | 1:F#4:4 7:A4:3 12:C5:3 |
        0:Bb4:6 8:A4:3 13:G4:2 | 2:E4:3 7:G4:3 12:A4:3 |
        0:A4:2 3:C5:2 7:A4:2 10:G4:2 14:F4:1 | 1:E4:5 8:G4:3 13:C4:2`),
      bass:bars(`0:Bb2:5 7:F2:3 12:D2:3 | 0:Bb2:5 7:Db2:3 12:Ab2:3 |
        0:A2:3 5:E2:2 8:G2:3 13:C#2:2 | 0:D2:4 6:F#2:2 10:A2:3 15:F#2:1 |
        0:G2:3 5:D2:2 8:Bb2:3 13:B1:2 | 0:C2:4 6:G2:2 10:Bb2:3 15:E2:1 |
        0:F2:5 7:A2:3 12:B1:2 | 0:C2:4 6:G2:2 10:Bb2:3 15:E2:1`)}
  },
  brassworks:{
    name:'Copper After Hours',ticks:9,groove:'machine',form:['theme','bridge','break','answer','return','outro'],
    identity:'A low E-B-D riff with displaced accents; a climbing bridge provides relief from the machinery.',
    A:{chords:'Em9 A9 Dmaj9 B7 Em9 Cmaj9 Am9 B7'.split(' '),
      lead:bars(`0:E4:2 3:B3:2 6:D4:3 11:E4:3 | 0:E4:2 3:C#4:2 7:G4:4 |
        1:F#4:3 6:E4:2 10:D4:5 | 0:D#4:3 5:F#4:2 9:A4:4 |
        0:E4:2 3:B3:2 6:D4:3 11:G4:3 | 1:E4:5 8:D4:2 12:C4:3 |
        0:E4:3 5:G4:2 9:B4:4 | 2:A4:3 7:F#4:3 12:D#4:2`),
      bass:bars(`0:E2:3 4:E2:2 7:B2:3 12:D2:2 | 0:A2:3 4:E2:2 7:G2:3 12:C#2:2 |
        0:D2:3 5:A2:2 8:C#2:3 13:B1:2 | 0:B2:3 4:F#2:2 7:A2:3 12:D#2:2 |
        0:E2:3 4:E2:2 7:G2:3 12:B1:2 | 0:C2:3 5:G2:2 8:B2:3 13:G#2:2 |
        0:A2:3 4:E2:2 7:G2:3 12:A#2:2 | 0:B2:3 5:F#2:2 8:A2:3 13:D#2:2`)},
    B:{chords:'Cmaj9 D13 Em9 Em9 Am9 D13 Gmaj9 B7'.split(' '),
      lead:bars(`0:G4:5 7:B4:4 | 2:A4:3 7:F#4:3 12:E4:3 |
        0:G4:3 5:B4:3 10:D5:5 | 1:B4:6 10:G4:4 |
        0:A4:4 6:G4:3 12:E4:3 | 2:F#4:4 9:A4:5 |
        0:B4:6 8:A4:3 13:G4:2 | 1:F#4:4 7:D#4:4 13:B3:2`),
      bass:bars(`0:C2:5 7:G2:3 12:C#2:3 | 0:D2:5 7:F#2:3 12:D#2:3 |
        0:E2:3 4:E2:2 7:B2:3 12:D2:2 | 0:E2:5 7:G2:3 12:G#2:3 |
        0:A2:3 4:E2:2 7:G2:3 12:C#2:2 | 0:D2:5 7:A2:3 12:F#2:3 |
        0:G2:5 7:D2:3 12:A#2:3 | 0:B2:3 5:F#2:2 8:A2:3 13:D#2:2`)}
  },
  velvet:{
    name:'Lilac Window Seat',ticks:12,groove:'halftime',form:['theme','space','bridge','hush','return','outro'],
    identity:'A low, spacious C-Eb-Bb phrase with a held arrival; gentle half-time drums leave room for the harmony.',
    A:{chords:'Abmaj9 Fm9 Bbm9 Eb13 Cm7 Dbmaj9 Bbm9 Eb13'.split(' '),
      lead:bars(`1:C4:6 10:Eb4:4 | 0:Bb3:7 10:Ab3:4 |
        2:Db4:5 10:C4:4 | 0:Bb3:6 9:G3:5 |
        1:Eb4:6 10:G4:4 | 0:F4:7 10:Eb4:4 |
        2:Db4:5 10:C4:4 | 0:Bb3:6 9:G3:5`),
      bass:bars(`0:Ab2:9 15:G2:1 | 0:F2:9 15:A2:1 |
        0:Bb2:9 15:D2:1 | 0:Eb2:9 15:B1:1 |
        0:C2:9 15:C2:1 | 0:Db2:9 15:A2:1 |
        0:Bb2:9 15:D2:1 | 0:Eb2:8 11:G2:3`)},
    B:{chords:'Dbmaj9 Dbm6 Cm7 F7 Bbm9 Eb13 Abmaj9 Eb13'.split(' '),
      lead:bars(`0:F4:7 10:Ab4:4 | 2:E4:6 11:Eb4:4 |
        0:G4:6 9:Eb4:5 | 1:A3:5 9:C4:5 |
        0:Db4:7 10:F4:4 | 2:Eb4:6 11:Db4:4 |
        1:C4:6 10:Eb4:4 | 0:Bb3:7 10:G3:4`),
      bass:bars(`0:Db2:9 15:Ab2:1 | 0:Db2:9 15:B1:1 |
        0:C2:9 15:E2:1 | 0:F2:9 15:A2:1 |
        0:Bb2:9 15:D2:1 | 0:Eb2:9 15:G2:1 |
        0:Ab2:9 15:D2:1 | 0:Eb2:8 11:G2:3`)}
  },
  aurora:{
    name:'Rooftop Blue Hour',ticks:10,groove:'suspended',form:['theme','bridge','space','answer','return','outro'],
    identity:'An unresolved E-B-C figure and changing suspended harmony; the bridge opens the skyline without holiday instrumentation.',
    A:{chords:'Am9 Fmaj9 Cmaj9 Gsus Dm9 Fmaj9 Esus E7'.split(' '),
      lead:bars(`0:E4:5 7:B4:3 12:C5:3 | 2:A4:6 11:G4:4 |
        0:E4:5 7:G4:3 12:B4:3 | 1:A4:7 11:G4:4 |
        0:F4:5 7:E4:3 12:D4:3 | 2:A4:6 11:C5:4 |
        0:B4:7 10:A4:4 | 2:G#4:5 10:E4:4`),
      bass:bars(`0:A2:7 9:E2:4 | 2:F2:7 11:G2:3 |
        0:C2:7 9:E2:4 | 2:G2:7 11:F2:3 |
        0:D2:7 9:A2:4 | 2:F2:7 11:D#2:3 |
        0:E2:7 9:B2:4 | 2:E2:6 10:G#2:4`)},
    B:{chords:'Fmaj9 G13 Em7 Am9 Dm9 G13 Cmaj9 E7'.split(' '),
      lead:bars(`0:C5:5 7:A4:3 12:G4:3 | 2:B4:5 10:A4:4 |
        0:G4:4 6:E4:3 12:D4:3 | 1:E4:5 8:A4:6 |
        0:F4:4 6:A4:3 12:C5:3 | 2:B4:5 10:A4:4 |
        0:G4:7 10:E4:4 | 2:G#4:5 10:B4:4`),
      bass:bars(`0:F2:7 9:A2:4 | 2:G2:7 11:D#2:3 |
        0:E2:7 9:G2:4 | 2:A2:7 11:C#2:3 |
        0:D2:7 9:F2:4 | 2:G2:7 11:B1:3 |
        0:C2:7 9:E2:4 | 2:E2:6 10:G#2:4`)}
  },
  finale:{
    name:'All the Windows Glow',ticks:9,groove:'celebration',form:['opening','theme','bridge','break','return','outro'],
    identity:'The garage E-G-A hook returns with an upper answer and a fuller band, then leaves a breath before looping home.',
    A:{chords:'C6 Em7 Fmaj9 G13 Am9 D9 Dm9 G13'.split(' '),
      lead:bars(`1:E4:3 5:G4:2 8:A4:5 14:G4:1 | 0:B4:4 6:G4:3 12:E4:3 |
        0:A4:3 4:C5:3 9:D5:5 | 0:B4:5 8:A4:3 13:G4:2 |
        1:E5:5 8:D5:3 13:C5:2 | 0:B4:3 5:A4:3 10:F#4:4 |
        0:F4:3 4:A4:3 9:C5:5 | 0:B4:5 8:G4:3 13:D4:2`),
      bass:bars(`0:C2:4 6:E2:2 10:G2:3 15:D#2:1 | 0:E2:4 6:B2:2 10:G2:3 15:E2:1 |
        0:F2:4 6:A2:2 10:C3:3 15:F#2:1 | 0:G2:4 6:D2:2 10:F2:3 15:G#2:1 |
        0:A2:4 6:E2:2 10:C3:3 15:C#2:1 | 0:D2:4 6:F#2:2 10:A2:3 15:C#2:1 |
        0:D2:4 6:F2:2 10:A2:3 15:F#2:1 | 0:G2:4 6:D2:2 10:F2:3 15:B1:1`)},
    B:{chords:'Fmaj9 Fm6 Em7 A7 Dm9 G13 C6 G13'.split(' '),
      lead:bars(`0:C5:6 8:A4:4 | 1:Ab4:5 8:G4:2 12:F4:3 |
        0:B4:5 7:G4:3 12:E4:3 | 2:C#5:5 10:B4:4 |
        0:A4:3 4:C5:3 9:D5:5 | 0:B4:4 6:A4:3 12:G4:3 |
        1:E4:3 5:G4:2 8:A4:5 14:G4:1 | 0:E4:4 6:D4:3 12:B3:2`),
      bass:bars(`0:F2:5 7:A2:3 12:C3:3 | 0:F2:5 7:Ab2:3 12:D#2:3 |
        0:E2:4 6:B2:2 10:G2:3 15:G#2:1 | 0:A2:4 6:E2:2 10:G2:3 15:C#2:1 |
        0:D2:4 6:F2:2 10:A2:3 15:F#2:1 | 0:G2:4 6:D2:2 10:F2:3 15:B1:1 |
        0:C2:6 8:E2:3 13:F#2:2 | 0:G2:6 8:F2:3 13:B1:2`)}
  }
};

// Accents stay local. A longer form does not mean more Christmas instrumentation.
export const seasonal = {
  garage:{boxBars:[0,2,32,34],sleighBars:[]},
  frostwick:{boxBars:[0,2,32,34],sleighBars:[0,1,2,3,32,33,34,35]},
  candy:{boxBars:[8,9,10,11,24,25,26,27],sleighBars:[8,9,10,11,24,25,26,27]},
  finale:{boxBars:[...Array.from({length:8},(_,i)=>i+8),...Array.from({length:8},(_,i)=>i+32)],
    sleighBars:[...Array.from({length:8},(_,i)=>i+8),...Array.from({length:8},(_,i)=>i+32)]}
};
