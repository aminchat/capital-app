#!/usr/bin/env python3
"""Generate PWA icons: red crescent on white, no dependencies.

Usage: python3 tools/gen_icons.py [iconsDir]
"""
import struct, zlib, os, sys

RED = (216, 30, 40)
WHITE = (255, 255, 255)


def write_png(path, size, rows):
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        c += struct.pack('>I', zlib.crc32(typ + data) & 0xFFFFFFFF)
        return c

    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def render(size, scale):
    aa = max(1.0, size / 256.0)
    r1 = 0.40 * scale
    r2 = 0.36 * scale
    dx = 0.14 * scale
    c1 = (size / 2, size / 2)
    c2 = (size / 2 + dx * size, size / 2)
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            d1 = ((x + .5 - c1[0]) ** 2 + (y + .5 - c1[1]) ** 2) ** 0.5
            d2 = ((x + .5 - c2[0]) ** 2 + (y + .5 - c2[1]) ** 2) ** 0.5
            t1 = max(0.0, min(1.0, (r1 * size - d1) / aa + .5))
            t2 = max(0.0, min(1.0, (r2 * size - d2) / aa + .5))
            cres = t1 * (1.0 - t2)  # inside big circle, outside cutter
            r = int(WHITE[0] * (1 - cres) + RED[0] * cres)
            g = int(WHITE[1] * (1 - cres) + RED[1] * cres)
            b = int(WHITE[2] * (1 - cres) + RED[2] * cres)
            row += bytes((r, g, b, 255))
        rows.append(bytes(row))
    return rows


if __name__ == '__main__':
    base = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'icons')
    os.makedirs(base, exist_ok=True)
    write_png(os.path.join(base, 'icon-512.png'), 512, render(512, 0.80))
    write_png(os.path.join(base, 'icon-192.png'), 192, render(192, 0.80))
    write_png(os.path.join(base, 'icon-maskable-512.png'), 512, render(512, 0.60))
    write_png(os.path.join(base, 'icon-maskable-192.png'), 192, render(192, 0.60))
    print('icons done')
