#!/usr/bin/env python3
"""Inspect an actual native ROM, independently of compiler success messages."""
import argparse
import hashlib
import json
from pathlib import Path

LOGO = bytes.fromhex(
    "CE ED 66 66 CC 0D 00 0B 03 73 00 83 00 0C 00 0D "
    "00 08 11 1F 88 89 00 0E DC CC 6E E6 DD DD D9 99 "
    "BB BB 67 63 6E 0E EC CC DD DC 99 9F BB B9 33 3E")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("rom", type=Path)
    args = parser.parse_args()
    data = args.rom.read_bytes()
    assert len(data) >= 32768, "ROM too short"
    assert data[0x104:0x134] == LOGO, "Invalid cartridge logo"
    checksum = 0
    for value in data[0x134:0x14d]:
        checksum = (checksum - value - 1) & 255
    assert checksum == data[0x14d], "Invalid header checksum"
    expected_global = int.from_bytes(data[0x14e:0x150], "big")
    actual_global = (sum(data) - sum(data[0x14e:0x150])) & 0xffff
    assert actual_global == expected_global, "Invalid global checksum"
    assert data[0x143] == 0xc0, "Expected the chosen Game Boy Color-only target"
    size_code = data[0x148]
    assert size_code <= 8 and len(data) == 32768 << size_code, "Unexpected ROM size"
    print(json.dumps({
        "file": args.rom.name, "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "colorFlag": hex(data[0x143]), "cartridgeType": hex(data[0x147]),
        "ramSizeCode": hex(data[0x149]), "headerChecksumValid": True,
        "globalChecksumValid": True,
        "hardwareTested": False,
    }, indent=2))


if __name__ == "__main__":
    main()
