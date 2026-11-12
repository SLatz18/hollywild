#!/usr/bin/env python3
"""Generate original palette-safe Hollywild art and an explicit world layout.

No third-party image library is required. PNGs are authored in native GB Studio
source shades; world-layout.json carries the scene palette assignments.
"""
from pathlib import Path
import json
import struct
import zlib
from collections import deque

ROOT = Path(__file__).resolve().parents[1]
BG = ROOT / "assets" / "backgrounds"
SPRITES = ROOT / "assets" / "sprites"
SHADES = [(7, 24, 33), (48, 104, 80), (134, 192, 108), (224, 248, 207)]
TRANSPARENT = (101, 255, 0)
PALETTES = [
    ["17334D", "587B95", "B1CFDE", "F0F5E9"],  # snow and winter stone
    ["202A46", "40556B", "7C96A0", "D4E1DC"],  # streets and iron
    ["183E39", "397059", "80B47D", "E7EFD4"],  # evergreen
    ["401F3D", "8C4157", "D68A83", "F8DDC4"],  # brick / cranberry
    ["3C3348", "906F51", "E8B665", "FFF0B1"],  # lights / timber
    ["263355", "526399", "A6A3D0", "EEE5F4"],  # slate / violet
    ["254650", "4A929A", "91CDC0", "E1F3D5"],  # mint
    ["172C42", "46657C", "9EB6C3", "F7F4DA"],  # UI reserved
]


def png(path, pixels, width, height):
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    raw = b"".join(b"\0" + bytes(c for p in pixels[y * width:(y + 1) * width] for c in p) for y in range(height))
    out = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    out += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(out)


class Canvas:
    def __init__(self, width, height, fill=3):
        self.width, self.height = width, height
        self.p = [fill] * (width * height)

    def pixel(self, x, y, c):
        if 0 <= x < self.width and 0 <= y < self.height:
            self.p[y * self.width + x] = c

    def rect(self, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.pixel(xx, yy, c)

    def line(self, x1, y1, x2, y2, c):
        dx, dy = abs(x2 - x1), -abs(y2 - y1)
        sx, sy, err = (1 if x1 < x2 else -1), (1 if y1 < y2 else -1), dx + dy
        while True:
            self.pixel(x1, y1, c)
            if x1 == x2 and y1 == y2:
                break
            twice = 2 * err
            if twice >= dy:
                err += dy
                x1 += sx
            if twice <= dx:
                err += dx
                y1 += sy

    def save(self, path, sprite=False):
        assert set(self.p) <= ({0, 2, 3, 4} if sprite else {0, 1, 2, 3}), (path, "invalid source shades")
        table = SHADES + [TRANSPARENT]
        png(path, [table[v] for v in self.p], self.width, self.height)

    def tiles(self):
        return {tuple(self.p[(y + row) * self.width + x:(y + row) * self.width + x + 8][col]
                      for row in range(8) for col in range(8))
                for y in range(0, self.height, 8) for x in range(0, self.width, 8)}


GLYPHS = {
    "A": ["010", "101", "111", "101", "101"], "B": ["110", "101", "110", "101", "110"],
    "C": ["011", "100", "100", "100", "011"], "D": ["110", "101", "101", "101", "110"],
    "E": ["111", "100", "110", "100", "111"], "F": ["111", "100", "110", "100", "100"],
    "G": ["011", "100", "101", "101", "011"], "H": ["101", "101", "111", "101", "101"],
    "I": ["111", "010", "010", "010", "111"], "J": ["001", "001", "001", "101", "010"],
    "K": ["101", "101", "110", "101", "101"], "L": ["100", "100", "100", "100", "111"],
    "M": ["101", "111", "111", "101", "101"], "N": ["101", "111", "111", "111", "101"],
    "O": ["010", "101", "101", "101", "010"], "P": ["110", "101", "110", "100", "100"],
    "R": ["110", "101", "110", "101", "101"], "S": ["011", "100", "010", "001", "110"],
    "T": ["111", "010", "010", "010", "010"], "U": ["101", "101", "101", "101", "111"],
    "V": ["101", "101", "101", "101", "010"], "W": ["101", "101", "111", "111", "101"],
    "X": ["101", "101", "010", "101", "101"], "Y": ["101", "101", "010", "010", "010"],
    " ": ["000"] * 5,
}


def label(c, text, x, y, ink=0):
    for ch in text:
        for yy, row in enumerate(GLYPHS.get(ch, GLYPHS[" "])):
            for xx, bit in enumerate(row):
                if bit == "1":
                    c.pixel(x + xx, y + yy, ink)
        x += 4


class District:
    def __init__(self, ident, name, roof=3, width=256, height=256):
        self.c = Canvas(width, height)
        self.tw, self.th = width // 8, height // 8
        self.pal = [0] * (self.tw * self.th)
        self.col = [0] * (self.tw * self.th)
        self.data = {"id": ident, "name": name, "background": ident + ".png", "width": width, "height": height,
                     "exits": [], "sites": [], "spawn": {"x": 15, "y": 17}, "roofPalette": roof}

    def area(self, x, y, w, h, palette=None, block=None):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if 0 <= xx < self.tw and 0 <= yy < self.th:
                    i = yy * self.tw + xx
                    if palette is not None:
                        self.pal[i] = palette
                    if block is not None:
                        self.col[i] = block

    def road(self, x, y, w, h):
        self.area(x, y, w, h, palette=1, block=0)
        self.c.rect(x * 8, y * 8, w * 8, h * 8, 1)
        # Repeated granite texture makes broad roads readable without unique-tile bloat.
        for yy in range(y * 8, (y + h) * 8, 8):
            for xx in range(x * 8, (x + w) * 8, 8):
                self.c.pixel(xx + 2, yy + 2, 2)
                self.c.pixel(xx + 6, yy + 6, 0)

    def tree(self, tx, ty):
        x, y = tx * 8, ty * 8
        self.area(tx, ty, 2, 3, 2, 1)
        self.c.rect(x + 7, y + 16, 3, 7, 1)
        for top, width in [(0, 10), (5, 14), (10, 16)]:
            for r in range(8):
                half = min(width // 2, r + 1)
                self.c.rect(x + 8 - half, y + top + r, half * 2, 1, 0 if r == 7 else 1)
            self.c.line(x + 6, y + top + 2, x + 9, y + top + 2, 3)
        self.c.rect(x + 2, y + 21, 12, 2, 2)

    def lamp(self, tx, ty):
        x, y = tx * 8, ty * 8
        self.area(tx, ty, 1, 2, 4, 1)
        self.c.rect(x + 3, y + 5, 2, 10, 0)
        self.c.rect(x + 1, y + 1, 6, 6, 0)
        self.c.rect(x + 2, y + 2, 4, 3, 3)
        self.c.rect(x + 1, y + 14, 6, 2, 1)

    def building(self, tx, ty, w, h, name, palette, door=True):
        x, y = tx * 8, ty * 8
        self.area(tx, ty, w, h, palette, 1)
        self.c.rect(x + 1, y + 4, w * 8 - 2, h * 8 - 4, 0)
        self.c.rect(x + 3, y + 6, w * 8 - 6, h * 8 - 8, 2)
        self.c.rect(x, y, w * 8, 24, 1)
        self.c.rect(x, y, w * 8, 4, 3)
        for yy in [8, 16]:
            self.c.line(x, y + yy, x + w * 8 - 1, y + yy, 0)
            for xx in range(x + (4 if yy == 8 else 0), x + w * 8, 8):
                self.c.line(xx, y + yy - 6, xx, y + yy - 1, 2)
        self.c.rect(x, y + 23, w * 8, 3, 0)
        self.c.rect(x, y + 24, w * 8, 2, 3)
        self.area(tx, ty + 3, w, h - 3, 4)
        for wx in range(x + 8, x + w * 8 - 9, 16):
            self.c.rect(wx, y + 29, 10, 12, 0)
            self.c.rect(wx + 1, y + 30, 8, 10, 3)
            self.c.line(wx + 5, y + 30, wx + 5, y + 39, 1)
            self.c.line(wx + 1, y + 35, wx + 8, y + 35, 1)
            self.c.rect(wx - 1, y + 41, 12, 2, 3)
        label_x = x + (w * 8 - len(name) * 4 + 1) // 2
        self.c.rect(x + 3, y + 16, w * 8 - 6, 7, 3)
        label(self.c, name, label_x, y + 17)
        if door:
            dx = tx + w // 2 - 1
            self.c.rect(dx * 8, (ty + h - 2) * 8, 16, 16, 0)
            self.c.rect(dx * 8 + 2, (ty + h - 2) * 8 + 2, 12, 14, 1)
            self.c.rect(dx * 8 + 3, (ty + h - 2) * 8 + 3, 10, 5, 3)
            self.c.pixel(dx * 8 + 11, (ty + h - 2) * 8 + 11, 3)
        return tx + w // 2 - 1, ty + h

    def crate(self, tx, ty, palette=4):
        x, y = tx * 8, ty * 8
        self.area(tx, ty, 2, 2, palette, 1)
        self.c.rect(x, y, 16, 16, 0)
        self.c.rect(x + 1, y + 1, 14, 14, 2)
        self.c.rect(x + 2, y + 2, 12, 12, 1)
        self.c.line(x + 2, y + 2, x + 13, y + 13, 3)
        self.c.line(x + 13, y + 2, x + 2, y + 13, 3)

    def bench(self, tx, ty):
        x, y = tx * 8, ty * 8
        self.area(tx, ty, 3, 1, 4, 1)
        self.c.rect(x, y, 24, 2, 0)
        self.c.rect(x, y + 3, 24, 3, 1)
        self.c.rect(x + 2, y + 6, 2, 2, 0)
        self.c.rect(x + 20, y + 6, 2, 2, 0)

    def site(self, ident, typ, x, y, **extra):
        self.area(x, y, 2, 2, block=0)
        self.data["sites"].append({"id": ident, "type": typ, "x": x, "y": y, **extra})

    def finish(self):
        self.c.save(BG / self.data["background"])
        self.data["collisions"] = self.col
        self.data["paletteIndices"] = self.pal
        self.data["uniqueTiles"] = len(self.c.tiles())
        assert self.data["uniqueTiles"] <= 256, (self.data["id"], self.data["uniqueTiles"])
        return self.data


def street(ident, name, names, roof):
    d = District(ident, name, roof)
    # Snow texture, stable on the 8px grid.
    for ty in range(32):
        for tx in range(32):
            if (tx + ty) % 3 == 0:
                d.c.pixel(tx * 8 + 2, ty * 8 + 3, 2)
                d.c.pixel(tx * 8 + 3, ty * 8 + 3, 2)
    d.area(0, 0, 32, 1, block=1)
    d.area(0, 31, 32, 1, block=1)
    d.area(0, 0, 1, 32, block=1)
    d.area(31, 0, 1, 32, block=1)
    d.road(0, 14, 32, 6)
    d.road(14, 0, 4, 32)
    # Sidewalks and crosswalks provide route landmarks.
    for y in [13, 20]:
        d.c.rect(0, y * 8, 256, 8, 2)
        for x in range(0, 256, 8):
            d.c.line(x, y * 8, x, y * 8 + 7, 3)
    for x in [12, 19]:
        for y in range(14 * 8, 20 * 8, 8):
            d.c.rect(x * 8, y + 1, 8, 4, 3)
    d.building(3, 3, 9, 7, names[0], roof)
    d.building(21, 3, 8, 7, names[1], 6 if roof == 3 else 3)
    d.building(3, 24, 9, 7, names[2], 5)
    d.building(21, 24, 8, 7, names[3], roof)
    # Walkways reach front doors and side alleys without crossing blocked walls.
    for x in [7, 24]:
        d.road(x, 10, 2, 4)
        d.road(x, 21, 2, 3)
    for x, y in [(0, 2), (29, 2), (0, 25), (29, 25), (11, 21), (18, 8)]:
        d.tree(x, y)
    for x, y in [(3, 11), (27, 11), (3, 21), (27, 21)]:
        d.lamp(x, y)
    d.bench(10, 11)
    d.bench(19, 21)
    return d


def make_world():
    configs = [
        ("frostwick", "Frostwick", ["GARAGE", "COCOA", "HOMES", "DEPOT"], 3),
        ("candy_row", "Candy Row", ["SWEETS", "PARCEL", "BAKERY", "CAFE"], 6),
        ("brassworks", "Brassworks", ["TOOLS", "DEPOT", "REPAIR", "WORKS"], 4),
        ("velvet_heights", "Velvet Heights", ["LANTERN", "LODGE", "MANOR", "GALLERY"], 5),
        ("aurora_yard", "Aurora Yard", ["STATION", "POWER", "STORES", "RELAY"], 1),
    ]
    districts = [street(*conf) for conf in configs]
    ids = [d.data["id"] for d in districts]
    for i, d in enumerate(districts):
        d.data["exits"] += [
            {"x": 30, "y": 14, "width": 2, "height": 6, "destScene": ids[(i + 1) % 5], "destX": 2, "destY": 16},
            {"x": 0, "y": 14, "width": 2, "height": 6, "destScene": ids[(i - 1) % 5], "destX": 28, "destY": 16},
        ]
        d.site(ids[i] + "_board", "job_board", 11, 12, sprite="board", name="City jobs")
    shortcuts = [(0, "north", 2, "south"), (1, "north", 3, "south"), (4, "north", 0, "south")]
    for a, edgea, b, edgeb in shortcuts:
        for src, edge, dst in [(a, edgea, b), (b, edgeb, a)]:
            d = districts[src]
            if edge == "north":
                d.data["exits"].append({"x": 14, "y": 0, "width": 4, "height": 2, "destScene": ids[dst], "destX": 15, "destY": 28})
            else:
                d.data["exits"].append({"x": 14, "y": 30, "width": 4, "height": 2, "destScene": ids[dst], "destX": 15, "destY": 2})
    # Seal unused road ends with a low barrier. Crossing routes remain explicit.
    for d in districts:
        edges = {e["y"] for e in d.data["exits"] if e["width"] == 4}
        for y in [0, 30]:
            if y not in edges:
                d.area(14, y, 4, 2, 1, 1)
                d.c.rect(112, y * 8 + 4, 32, 3, 0)
                for x in [114, 124, 134, 142]:
                    d.c.rect(x, y * 8, 2, 12, 0)
    f, c, b, v, a = districts
    # Distinct district silhouettes, all built from original repeated tile motifs.
    # Frostwick's inherited garage has a broad rolling shutter.
    f.c.rect(40, 64, 32, 16, 0)
    f.c.rect(42, 65, 28, 15, 2)
    for yy in range(67, 80, 3):
        f.c.line(42, yy, 69, yy, 1)
    # Candy Row uses striped market awnings and candy-cane shopfront posts.
    for tx in [3, 21]:
        for x in range(tx * 8, (tx + (9 if tx == 3 else 8)) * 8, 4):
            c.c.rect(x, 48, 4, 8, 3 if (x // 4) % 2 else 1)
        c.area(tx, 6, 9 if tx == 3 else 8, 1, 3 if tx == 3 else 6)
    # Brassworks has rooftop stacks with snow caps and exposed pipework.
    for tx in [4, 9, 23, 27]:
        x=tx*8
        b.c.rect(x, 8, 8, 20, 0)
        b.c.rect(x+1, 9, 6, 17, 2)
        b.c.rect(x, 8, 8, 3, 3)
        b.area(tx, 1, 1, 3, 4, 1)
    b.c.rect(24, 56, 4, 24, 0)
    b.c.rect(25, 56, 2, 22, 3)
    # Velvet Heights adds a small frozen fountain on a pale stone plinth.
    v.area(18, 4, 3, 3, 5, 1)
    v.c.rect(144, 40, 24, 12, 0)
    v.c.rect(146, 39, 20, 13, 2)
    v.c.rect(148, 38, 16, 12, 3)
    v.c.rect(154, 32, 4, 15, 1)
    v.c.rect(150, 35, 12, 3, 2)
    # Aurora Yard's tram rails cross the main boulevard; they are walkable.
    for y in [122, 134]:
        a.c.rect(0, y, 256, 2, 0)
        a.c.rect(0, y+2, 256, 1, 2)
    for x in range(0, 256, 8):
        a.c.rect(x+2, 120, 2, 18, 2)
    # Painted arrows show that city roads continue beyond the current room.
    for d in districts:
        for x, sign in [(8,-1),(240,1)]:
            y=128
            d.c.line(x-3,y,x+3,y,3)
            d.c.line(x+3*sign,y,x,y-3,3)
            d.c.line(x+3*sign,y,x,y+3,3)
    f.site("pip", "npc", 18, 12, sprite="pip", name="Pip")
    f.site("cocoa", "property", 24, 10, sprite="property_sign", name="Cocoa Corner", costCoins=100, costSalvage=4)
    f.site("salvage", "salvage", 24, 21, sprite="crate", name="Frostwick depot salvage")
    f.site("bonus_cache", "bonus", 7, 21, sprite="parcel", name="Back-alley bonus cache")
    f.site("cocoa_delivery", "delivery", 24, 12, sprite="parcel", name="Cocoa delivery counter")
    f.site("garage_door", "door", 7, 10, sprite="door_marker", name="Your garage", destScene="garage", destX=9, destY=14)
    f.data["exits"].append({"x":7,"y":10,"width":2,"height":1,"destScene":"garage","destX":9,"destY":14})
    c.site("moxie", "npc", 18, 12, sprite="moxie", name="Moxie")
    c.site("parcel_palace", "property", 24, 10, sprite="property_sign", name="Parcel Palace", costCoins=260, costSalvage=8)
    c.site("delivery_target", "delivery", 7, 10, sprite="parcel", name="Parcel counter")
    b.site("rivet_yard", "npc", 18, 12, sprite="rivet", name="Rivet")
    b.site("toolworks", "property", 7, 10, sprite="property_sign", name="Tinsel Toolworks", costCoins=220, costSalvage=8)
    b.site("salvage", "salvage", 24, 10, sprite="crate", name="Depot salvage")
    b.crate(22, 21)
    b.crate(25, 21)
    v.site("nib", "npc", 18, 12, sprite="nib", name="Nib")
    v.site("lantern_flats", "property", 7, 10, sprite="property_sign", name="Lantern Flats", costCoins=240, costSalvage=8)
    v.site("rare_listing", "inspect", 24, 10, sprite="board", name="Velvet Lodge")
    a.site("dot", "npc", 18, 12, sprite="dot", name="Dot")
    a.site("station", "aurora", 7, 10, sprite="board", name="Aurora Station")
    a.site("relay_cache", "salvage", 24, 10, sprite="crate", name="Relay salvage")
    # Two visible rails create an industrial identity without changing walkability.
    for tx in [22, 26]:
        for ty in range(21, 24):
            x,y=tx*8,ty*8
            a.area(tx,ty,1,1,1)
            a.c.line(x+1,y,x+1,y+7,0); a.c.line(x+6,y,x+6,y+7,0)
            a.c.rect(x,y+3,8,2,2)
    g = District("garage", "Your Garage", 4, 160, 144)
    g.c.rect(0, 0, 160, 144, 2)
    g.area(0, 0, 20, 18, 4)
    for ty in range(18):
        for tx in range(20):
            g.c.line(tx*8,ty*8,tx*8+7,ty*8,1)
            g.c.pixel(tx*8,ty*8+4,1)
    g.c.rect(0,0,160,24,0);g.c.rect(8,8,144,16,1)
    g.area(0,0,20,3,block=1);g.area(0,0,1,18,block=1);g.area(19,0,1,18,block=1)
    g.area(0,17,20,1,block=1);g.area(8,16,4,2,block=0)
    g.c.rect(64,128,32,16,0);g.c.rect(68,128,24,16,1)
    g.c.rect(16,32,48,16,0);g.c.rect(17,33,46,10,3);g.c.rect(20,44,5,12,1);g.c.rect(55,44,5,12,1)
    label(g.c,"WORKBENCH",20,35)
    g.area(2,4,6,3,block=1)
    g.crate(15,4);g.crate(15,7)
    g.c.rect(104,24,32,16,0);g.c.rect(106,26,28,12,3);label(g.c,"CREW",112,29)
    g.site("workbench","workshop",4,7,sprite="rivet",name="Workshop")
    g.site("crew","crew",13,6,sprite="board",name="Crew board")
    g.site("save","save",15,12,sprite="book",name="Save journal")
    g.site("pip_garage","npc",4,12,sprite="pip",name="Pip")
    g.data["spawn"]={"x":9,"y":14}
    g.data["exits"]=[{"x":8,"y":16,"width":4,"height":2,"destScene":"frostwick","destX":7,"destY":11}]
    return districts+[g]


def person(kind, direction, step=0):
    c=Canvas(16,16,4)
    # A two-pixel dark outline keeps small characters legible against the snow.
    c.rect(5,1,7,3,0);c.rect(4,3,9,3,0);c.rect(5,3,7,3,2)
    c.rect(5,6,7,5,0);c.rect(4,8,9,3,0);c.rect(5,7,7,4,2)
    c.rect(6,11,5,2,0)
    c.rect(5 if step==0 else 4,13,3,2,0);c.rect(10 if step==0 else 11,13,3,2,0)
    if direction=="down":
        c.rect(5,5,7,3,3);c.pixel(6,6,0);c.pixel(10,6,0)
        c.rect(5,9,7,1,3)
    elif direction=="up":
        c.rect(5,5,7,3,0);c.rect(6,8,5,3,3)
    else:
        c.rect(8,5,5,3,3);c.pixel(11,6,0);c.rect(4,8,4,4,3)
    if kind in ("pip","moxie"):
        c.rect(4,2,8,2,2);c.rect(5,0,5,2,2);c.pixel(10,0,3)
        if kind=="moxie":c.rect(2,9,3,4,3)
    if kind=="rivet":
        c.rect(3,2,11,3,2);c.rect(4,1,9,2,3);c.rect(3,5,11,1,0)
        c.rect(3,10,3,4,2)
    if kind=="nib":
        c.rect(5,0,7,4,0);c.rect(3,3,11,2,0);c.pixel(6,9,3);c.pixel(10,9,3)
    if kind=="dot":
        c.rect(4,2,9,2,3)
        if direction=="down":
            c.rect(5,6,3,2,0);c.rect(9,6,3,2,0);c.pixel(6,6,3);c.pixel(10,6,3)
    return c


def create_sprites():
    meta=[]
    for name in ["player","pip","rivet","moxie","nib","dot"]:
        frames=[person(name,d,s) for d in ["down","up","right"] for s in ([0,1] if name=="player" else [0])]
        sheet=Canvas(16*len(frames),16,4)
        for i,frame in enumerate(frames):
            for y in range(16):
                for x in range(16):sheet.pixel(i*16+x,y,frame.p[y*16+x])
        sheet.save(SPRITES/(name+".png"),True)
        meta.append({"id":name,"filename":name+".png","profile":"directional_animated" if name=="player" else "directional","width":sheet.width,"height":16})
    for name in ["board","property_sign","parcel","crate","book","door_marker"]:
        c=Canvas(16,16,4)
        if name in ("board","property_sign"):
            c.rect(2,1,12,10,0);c.rect(3,2,10,8,3);c.rect(4,4,8,1,2);c.rect(4,6,6,1,0);c.rect(4,8,8,1,2)
            c.rect(4,11,2,4,0);c.rect(10,11,2,4,0)
            if name=="property_sign":c.rect(7,3,2,6,0);c.rect(5,5,6,2,0)
        elif name in ("parcel","crate"):
            c.rect(1,3,14,12,0);c.rect(2,4,12,10,2)
            c.rect(7,4,2,10,3);c.rect(2,8,12,2,3)
            if name=="crate":
                c.line(2,4,13,13,0);c.line(13,4,2,13,0)
        elif name=="book":
            c.rect(2,2,12,12,0);c.rect(3,3,10,10,3);c.rect(4,3,2,10,2);c.rect(7,5,5,1,0);c.rect(7,8,4,1,0)
        else:
            c.rect(4,4,8,2,3);c.rect(6,2,4,2,3);c.rect(6,6,4,4,3)
        c.save(SPRITES/(name+".png"),True)
        meta.append({"id":name,"filename":name+".png","profile":"static","width":16,"height":16})
    return meta


def validate(world):
    ids={s["id"] for s in world["scenes"]}
    by_id={s["id"]:s for s in world["scenes"]}
    for scene in world["scenes"]:
        w,h=scene["width"]//8,scene["height"]//8
        assert len(scene["collisions"])==w*h
        assert len(scene["paletteIndices"])==w*h
        assert all(0<=p<=6 for p in scene["paletteIndices"]), "UI palette must stay reserved"
        for e in scene["exits"]:
            assert e["destScene"] in ids
        def passable(x,y):
            return 0<=x<w-1 and 0<=y<h-1 and all(not scene["collisions"][(y+dy)*w+x+dx] for dy in (0,1) for dx in (0,1))
        start=(scene["spawn"]["x"],scene["spawn"]["y"])
        assert passable(*start)
        seen={start}; queue=deque([start])
        while queue:
            x,y=queue.popleft()
            for point in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if point not in seen and passable(*point):
                    seen.add(point); queue.append(point)
        for site in scene["sites"]:
            assert (site["x"],site["y"]) in seen,(scene["id"],site["id"],"unreachable site")
        for e in scene["exits"]:
            dest=by_id[e["destScene"]]; dw=dest["width"]//8
            assert all(not dest["collisions"][(e["destY"]+dy)*dw+e["destX"]+dx] for dy in (0,1) for dx in (0,1)),(scene["id"],"blocked destination")
    assert all(set(c.p)<=set(range(4)) for c in WORLD_CANVASES)


if __name__=="__main__":
    districts=make_world()
    WORLD_CANVASES=[d.c for d in districts]
    world={"version":1,"tileSize":8,"coordinateNotes":"All scene positions, sites, collision cells, and exit rectangles use 8-pixel tiles. Actors need a 2x2-tile clear footprint.",
           "palettes":PALETTES,"scenes":[d.finish() for d in districts],"sprites":create_sprites()}
    validate(world)
    (ROOT/"world-layout.json").write_text(json.dumps(world,indent=2)+"\n")
    print(json.dumps({"scenes":[{"id":s["id"],"uniqueTiles":s["uniqueTiles"],"sites":len(s["sites"])} for s in world["scenes"]],"sprites":len(world["sprites"])}))
