# Native build status: v0.5.1-holiday-accents

This update places original holiday accents where the scene calls for them. It retains the relaxed jazz/hip-hop foundation. Gameplay, visuals, dialogue and music controls are unchanged from v0.5.

## Musical placement

Each track has 32 bars. Selected bars receive a short music-box phrase or soft, paired noise pulses suggesting sleigh percussion.

| Track | Music-box bars | Sleigh-percussion bars |
| --- | ---: | ---: |
| garage | 4 | 0 |
| frostwick | 4 | 8 |
| candy | 8 | 8 |
| finale | 24 | 24 |

Brassworks, Velvet and regular Aurora retain byte-identical v0.5 music files. The garage has no sleigh percussion. Every track retains its previous tempo, harmony, comping, bass, loop length, and kick/snare/rim notes. The festival finale reprises the garage motif with a fuller seasonal treatment; its sparse breakdown remains quiet. These are original melodies and synthesized sounds, not recorded bells or a traditional carol medley. See [soundtrack details](SOUNDTRACK.md).

An independent agent parsed baseline and new UGE assets through the official local reader. It checked the actual selected bars, exported instrument usage, unchanged accompaniment, protected drum notes and the three byte-identical tracks. This was a structural score review, not a listening review.

## Exact tested cartridge

- Native Game Boy Color Only, MBC5 with battery-backed RAM; 1,048,576 bytes and a 32 KB save-RAM header.
- SHA-256: `17fa74718a9c50df9602722b4aefd7ca01fca5c67ed172cb19fd4a77f5e41721`.
- Pinned GB Studio 4.3.2: `ccb891b2670134ba8237416772eea4ed09d34e1e`; GBVM: `bd6f41cc5e05cbe6601dcc7f8e2db89bed527fe3`.
- Header, size and both checksums passed. All 52 linked code areas fit the 16 KB bank limit.
- Build inputs remained unchanged through compilation and the final regression suite.

## Verification

All ten actual-ROM scenarios passed, covering 4,659 commands and 1,479 assertion checkpoints: three campaign endings, local commissions, crew roles, free roaming, the opening economy loop, mixed main/side progress, and both side-story paths. Six source/asset checks also passed. Suite wall time was 162.77 seconds, an automated measurement with known answers and routes, not human playtime.

The UI regression passed all 18 observations on this exact ROM, including the five-page introduction, readable menus, mute confirmation and sprite restoration. Audio routing passed 35 commands, and the finale path passed 452 commands. The six ordinary tracks were each captured for 104.647 seconds, and the finale for 94.685 seconds. Every capture extends beyond one complete loop; all contained sound in every full one-second interval and had no digital clipping. Muted output was digital zero for 2.987 seconds, and the setting persisted after checkpoint save and reboot.

These tests use normal button inputs, fresh isolated cartridge RAM, and read-only state observations. They do not inject gameplay state or load emulator save states. The [compact report](verification/v0.5.1-holiday-accents.json) records the exact cartridge and results.

## Delivery and limits

[Download v0.5.1](https://github.com/SLatz18/hollywild/releases/tag/v0.5.1-holiday-accents). The native `.gbc` file is the playable artifact. [Build instructions](DEVELOPMENT.md) and [hardware installation](HARDWARE_INSTALL.md) remain available.

Physical Chromatic playback, hardware audio/save persistence, cross-release save compatibility, human pacing and subjective music quality remain unverified. The [v0.5 agent usability research](PLAYER_RESEARCH.md) belongs to its recorded earlier ROMs, not a new blind test of this soundtrack. The existing navigation and checkpoint-discovery limitations remain. There is no live AI/network dependency in the cartridge.

The prior detailed gameplay, art and testing record is preserved in [v0.5 history](history/v0.5.0-atmosphere.md).
