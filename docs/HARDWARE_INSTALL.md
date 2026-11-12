# Installing Hollywild on a Chromatic

Checked November 12, 2026. Device detection and a cartridge read passed on a real Chromatic. Writing Hollywild to the cartridge, booting it, and physical playback have not been tested yet.

## When the Chromatic is plugged into a different computer

The ModRetro plugin finds, reads, and writes a Chromatic only through a local USB connection. Its documentation states that it does not give a remote server access to local USB devices. When the development computer and the Chromatic are in different places, build on one computer and flash from the other:

1. Build the ROM on the development computer, or download `hollywild.gbc` from a [release](https://github.com/SLatz18/hollywild/releases). Each release includes `SHA256SUMS.txt`.
2. Copy the `.gbc` file to the computer that the Chromatic is plugged into.
3. On that computer, install ModRetro's Chromatic CLI and run the commands below.

The flashing computer does not need Codex, GB Studio, or this repository.

## Install the Chromatic CLI

ModRetro publishes the CLI on npm:

```bash
npm install --global @modretro/chromatic-cli
```

Without npm, download the platform package directly, for example `@modretro/chromatic-cli-darwin-arm64`, and use `package/bin/chromatic-cli` from the tarball. Plugin 1.0.34 bundles CLI 1.2.1. Its `third-party/chromatic-cli/PROVENANCE.json` records the SHA-256 of each platform tarball. The darwin-arm64 1.2.1 tarball is `017d4a4a58e5cf2e0a0c2fc580623b8708ad7be826a706f619f7fd9f665e8875`.

According to the CLI README, macOS needs no driver installation. On Linux, run `sudo chromatic-cli install-drivers`. On Windows, run `chromatic-cli install-drivers` from an Administrator terminal.

Tested on macOS (Apple silicon) with CLI 1.2.1 from the darwin-arm64 package. That binary is ad hoc signed.

## How the Chromatic appears on USB

The Chromatic connects as two USB devices behind a small hub:

| Device name | USB ID | Role |
| --- | --- | --- |
| GWU2X | `33aa:0120` | Cartridge flashing interface |
| Chromatic - Player 01 | `374e:0101` | Console, which also provides a USB serial port |

`list-devices` pairs the two devices into a single device entry. If only GWU2X is present, the CLI lists it under `unmatched` with the reason `missing_counterpart`. That means the console device is not on the bus. During testing the console device dropped off and came back after the console was switched on and the cable reconnected. The test did not isolate which of the two steps was required.

The plugin's capture path checks for streaming USB `374e:010f`. This unit reported `374e:0101`, but it was still listed and its cartridge read correctly. Capture was not tested.

## Commands

Commands that access the device require `--yes`. Without it, the CLI returns `interaction.confirmation_required`.

```bash
chromatic-cli list-devices --format json
chromatic-cli detect-cart --all --player 1 --format json --yes
chromatic-cli write-homebrew hollywild.gbc --player 1 --expect-sha256 <rom sha256> --format json --yes
```

These are the same arguments that the plugin uses. `--expect-sha256` stops the write if the file does not match the hash. Take the hash from the release's `SHA256SUMS.txt`, or from `shasum -a 256 hollywild.gbc`. Writing replaces the game that is on the cartridge.

## Recorded cartridge read

| Field | Value |
| --- | --- |
| Flash | ISSI IS29GL032-70TLET-TR, 4 MB, 64 KB sectors |
| Existing cartridge type | MBC5+RUMBLE+RAM+BATTERY |
| Existing ROM | 128 KB, 32 KB RAM, Color enhanced, title `OPENAI` |
| Header checksum | Valid |

The v0.4.0 ROM is 1,048,576 bytes, which is within the 4 MB flash.

## Approaches that did not work

- **USB over a network** with a USB-sharing server. The plugin does not support remote USB devices. On a managed computer, endpoint security software can also stop the server from starting. In this test the server never started.
- **SSH alone.** SSH forwards network connections, not USB devices. It can carry the console's serial port, but the CLI identifies the device by USB ID and needs both USB devices. A forwarded serial port cannot replace them.

## Still to test

Writing a Hollywild ROM, boot, controls, screen readability, sound, and save persistence across a normal power cycle. These are the hardware checks in [Engineering](ENGINEERING.md) item B12.
