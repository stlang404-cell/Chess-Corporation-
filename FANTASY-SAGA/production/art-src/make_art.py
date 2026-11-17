#!/usr/bin/env python3
"""Procedural original vector artwork for The Forger of Verity.
Generates SVG files; render_art.js rasterizes them with Chromium."""
import math, random, os

OUT = os.path.join(os.path.dirname(__file__), "svg")
os.makedirs(OUT, exist_ok=True)
GOLD = "#d9b56a"; GOLD2 = "#f2d896"; INK = "#0b1622"; TEAL = "#2f6f73"
FONT = "'EB Garamond', 'EB Garamond 12', Cardo, serif"

def noise(x, y, seed=0):
    r = random.Random(seed)
    s = 0.0
    for k in range(6):
        fx, fy = r.uniform(0.5, 3) * (k + 1), r.uniform(0.5, 3) * (k + 1)
        ph = r.uniform(0, 6.28)
        s += math.sin(x * fx * 0.003 + y * fy * 0.002 + ph) / (k + 1)
    return s

def contour_paths(w, h, y0, y1, n, seed, amp=40, step=12):
    paths = []
    for i in range(n):
        base = y0 + (y1 - y0) * i / max(1, n - 1)
        pts = []
        for x in range(-20, w + 40, step):
            y = base + amp * noise(x, base, seed + i % 3) + 8 * math.sin(x * 0.02 + i)
            pts.append((x, y))
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        paths.append(d)
    return paths

def wren_foot(cx, cy, s, color, sw):
    # three lines meeting + spur (Ilse's mark)
    return (f'<g stroke="{color}" stroke-width="{sw}" stroke-linecap="round" fill="none">'
            f'<line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy - s}"/>'
            f'<line x1="{cx}" y1="{cy}" x2="{cx - 0.6*s}" y2="{cy + 0.75*s}"/>'
            f'<line x1="{cx}" y1="{cy}" x2="{cx + 0.6*s}" y2="{cy + 0.75*s}"/>'
            f'<line x1="{cx}" y1="{cy - 0.55*s}" x2="{cx + 0.32*s}" y2="{cy - 0.8*s}"/>'
            f'</g>')

def building(x, ybase, w, h, rot, windows_seed, roof="flat", lit=0.5, fill="#16232f"):
    r = random.Random(windows_seed)
    g = [f'<g transform="rotate({rot:.2f} {x + w/2:.1f} {ybase:.1f})">']
    g.append(f'<rect x="{x:.1f}" y="{ybase - h:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}"/>')
    if roof == "gable":
        g.append(f'<polygon points="{x-3:.1f},{ybase-h:.1f} {x+w/2:.1f},{ybase-h-w*0.45:.1f} {x+w+3:.1f},{ybase-h:.1f}" fill="{fill}"/>')
    elif roof == "dome":
        g.append(f'<path d="M{x:.1f},{ybase-h:.1f} A{w/2:.1f},{w/2:.1f} 0 0 1 {x+w:.1f},{ybase-h:.1f} Z" fill="{fill}"/>')
        g.append(f'<path d="M{x+w*0.15:.1f},{ybase-h-w*0.1:.1f} A{w*0.4:.1f},{w*0.4:.1f} 0 0 1 {x+w*0.85:.1f},{ybase-h-w*0.1:.1f}" stroke="{GOLD}" stroke-opacity="0.5" fill="none" stroke-width="1.5"/>')
    elif roof == "tower":
        g.append(f'<polygon points="{x:.1f},{ybase-h:.1f} {x+w/2:.1f},{ybase-h-w*1.4:.1f} {x+w:.1f},{ybase-h:.1f}" fill="{fill}"/>')
    cols = max(1, int(w // 14)); rows = max(1, int(h // 22))
    for c in range(cols):
        for rr in range(rows):
            if r.random() < lit:
                wx = x + 5 + c * (w - 10) / cols; wy = ybase - h + 8 + rr * (h - 14) / rows
                g.append(f'<rect x="{wx:.1f}" y="{wy:.1f}" width="5" height="8" fill="{GOLD2}" opacity="{r.uniform(0.55,1):.2f}"/>')
    g.append('</g>')
    return "".join(g)

def cover(w=1800, h=2700, fname="cover.svg", ebook=False):
    random.seed(7)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 1800 2700">']
    s.append('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#07111c"/><stop offset="0.38" stop-color="#10283a"/>
 <stop offset="0.56" stop-color="#2d5560"/><stop offset="0.66" stop-color="#b88a52"/>
 <stop offset="0.70" stop-color="#e6c27f"/><stop offset="0.74" stop-color="#2a4048"/>
 <stop offset="1" stop-color="#08121b"/></linearGradient>
<radialGradient id="glow" cx="0.55" cy="0.68" r="0.5"><stop offset="0" stop-color="#ffe3a3" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe3a3" stop-opacity="0"/></radialGradient>
<linearGradient id="land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13242c"/><stop offset="1" stop-color="#050b11"/></linearGradient>
<linearGradient id="whale" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b6a6f"/><stop offset="1" stop-color="#16262b"/></linearGradient>
<radialGradient id="lantern" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff4cf"/><stop offset="0.3" stop-color="#ffd57a" stop-opacity="0.8"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>
</defs>''')
    s.append('<rect width="1800" height="2700" fill="url(#sky)"/>')
    s.append('<rect width="1800" height="2700" fill="url(#glow)"/>')
    # stars
    r = random.Random(3)
    for _ in range(260):
        x, y = r.uniform(0, 1800), r.uniform(0, 1250)
        s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r.uniform(0.6,2.4):.1f}" fill="#f6ecd0" opacity="{r.uniform(0.25,0.9):.2f}"/>')
    # skein: airborne river loop
    s.append('<path d="M1050,1500 C1250,1300 1700,1350 1650,1150 C1610,990 1350,1050 1380,1220 C1410,1380 1650,1450 1800,1380" fill="none" stroke="#9fd2cf" stroke-opacity="0.35" stroke-width="22" stroke-linecap="round"/>')
    s.append('<path d="M1050,1500 C1250,1300 1700,1350 1650,1150 C1610,990 1350,1050 1380,1220 C1410,1380 1650,1450 1800,1380" fill="none" stroke="#e8fbf6" stroke-opacity="0.45" stroke-width="4" stroke-linecap="round"/>')
    for (ex, ey) in [(1300,1360),(1560,1250),(1440,1090),(1700,1400)]:
        s.append(f'<path d="M{ex},{ey} q12,-8 24,0 q12,8 24,0" stroke="#e8fbf6" stroke-opacity="0.6" stroke-width="3" fill="none"/>')
    # graticule
    s.append(f'<g stroke="{GOLD}" stroke-opacity="0.13" stroke-width="1.5" fill="none">')
    for i in range(1, 9):
        s.append(f'<line x1="{i*200}" y1="0" x2="{i*200}" y2="2700"/>')
    for j in range(1, 14):
        s.append(f'<line x1="0" y1="{j*200}" x2="1800" y2="{j*200}"/>')
    s.append('</g>')
    # meridian (brass) line
    s.append(f'<line x1="900" y1="0" x2="900" y2="2700" stroke="{GOLD}" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="2 14"/>')
    # Drift contours (lower)
    s.append(f'<g fill="none" stroke="{GOLD}" stroke-width="2" stroke-opacity="0.22">')
    for d in contour_paths(1800, 2700, 1930, 2650, 26, 11, amp=55, step=14):
        s.append(f'<path d="{d}"/>')
    s.append('</g>')
    # distant drifting hills silhouette
    pts = [(x, 1850 + 40 * noise(x, 1, 5) + 25 * math.sin(x / 90)) for x in range(0, 1810, 10)]
    s.append('<path d="M0,2700 L' + " L".join(f"{x},{y:.1f}" for x, y in pts) + ' L1800,2700 Z" fill="#1a3138" opacity="0.85"/>')
    # headland (left) with Held Side
    s.append('<path d="M0,1900 C120,1860 260,1780 420,1770 C520,1765 600,1790 680,1830 L720,1880 C760,1905 820,1920 900,1925 C1000,1940 1100,1990 1180,2060 C1240,2120 1260,2200 1250,2700 L0,2700 Z" fill="url(#land)"/>')
    # Held Side buildings: square, straight
    bx = 150
    specs = [(70, 120, "gable"), (55, 190, "tower"), (110, 150, "flat"), (80, 230, "dome"), (60, 140, "gable"), (90, 170, "flat")]
    for i, (bw, bh, roof) in enumerate(specs):
        s.append(building(bx, 1785 + (i % 2) * 6, bw, bh, 0, 100 + i, roof, lit=0.55, fill="#121e28"))
        bx += bw + 6
    # Lantern Gate arch
    gx, gy = 705, 1880
    s.append(f'<path d="M{gx},{gy} L{gx},{gy-150} A55,55 0 0 1 {gx+110},{gy-150} L{gx+110},{gy} L{gx+88},{gy} L{gx+88},{gy-145} A33,33 0 0 0 {gx+22},{gy-145} L{gx+22},{gy} Z" fill="#101a23"/>')
    s.append(f'<circle cx="{gx+55}" cy="{gy-215}" r="70" fill="url(#lantern)"/>')
    s.append(f'<rect x="{gx+47}" y="{gy-228}" width="16" height="22" rx="3" fill="#fff1c4"/>')
    # Drift Wing: a chain of buildings trailing right, increasingly displaced/rotated, on a causeway
    cx, cy = 830, 1905
    s.append(f'<path d="M820,1912 C980,1925 1120,1960 1280,1985 C1420,2010 1560,2050 1760,2070" stroke="#0f1a22" stroke-width="16" fill="none"/>')
    for i in range(10):
        t = i / 9
        x = 830 + i * 98 + 18 * math.sin(i * 1.7)
        y = 1915 + 18 * i + 30 * t * t + 14 * math.sin(i * 2.3)
        rot = (i * 1.9) * (1 if i % 2 else -1) * t * 1.4
        bw = 64 - i * 2; bh = 120 - i * 4 + (25 if i in (3, 6) else 0)
        roof = ["gable", "flat", "dome", "gable", "tower", "flat", "gable", "dome", "flat", "gable"][i]
        lift = -10 * t if i > 6 else 0
        s.append(building(x, y + lift, bw, bh, rot, 300 + i, roof, lit=0.7 - 0.03 * i, fill="#111d27"))
        # ghost (motion) outline showing where it was
        if i >= 4:
            s.append(f'<g opacity="0.25">{building(x - 14 - i, y - 6, bw, bh, rot * -0.6, 300 + i, roof, lit=0.0, fill="none")}</g>'.replace('fill="none"/>', f'fill="none" stroke="{GOLD}" stroke-width="1.4"/>', 1))
    # Sounder breaching from a hill, right foreground
    s.append('<defs><linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc0bd"/><stop offset="0.35" stop-color="#4c6f72"/><stop offset="1" stop-color="#14252a"/></linearGradient></defs>')
    body = "M900,2420 C980,2180 1180,2010 1430,2010 C1600,2010 1720,2080 1790,2180 C1800,2200 1800,2240 1790,2260 C1720,2215 1640,2205 1580,2222 C1470,2250 1330,2330 1180,2400 Z"
    s.append(f'<path d="{body}" fill="url(#rim)"/>')
    s.append(f'<path d="{body}" fill="none" stroke="#f2d896" stroke-opacity="0.55" stroke-width="4"/>')
    # pectoral fin
    s.append('<path d="M1360,2250 C1330,2330 1280,2380 1200,2400 C1280,2350 1310,2300 1320,2245 Z" fill="#20363b" stroke="#f2d896" stroke-opacity="0.3" stroke-width="2"/>')
    for k in range(7):
        s.append(f'<path d="M{1000+k*50},{2330 - k*22} C{1150+k*40},{2190-k*14} {1380+k*30},{2140-k*6} {1600+k*20},{2160}" stroke="#cfe2dc" stroke-opacity="0.18" stroke-width="3" fill="none"/>')
    s.append('<circle cx="1660" cy="2120" r="16" fill="#f4e2ab"/><circle cx="1663" cy="2120" r="7" fill="#10191c"/>')
    r2 = random.Random(21)
    for _ in range(110):
        x = r2.uniform(960, 1760); y = 2030 + (x - 1430) ** 2 / 2600 + r2.uniform(-20, 60)
        s.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r2.uniform(4,16):.1f}" ry="{r2.uniform(2,7):.1f}" fill="#33502f" stroke="#0b130e" stroke-width="1" opacity="{r2.uniform(0.7,1):.2f}"/>')
    # falling stones/turf streams
    for _ in range(40):
        x = r2.uniform(1000, 1760); y0 = 2050 + (x - 1430) ** 2 / 2600
        s.append(f'<line x1="{x:.0f}" y1="{y0:.0f}" x2="{x+r2.uniform(-6,6):.0f}" y2="{y0+r2.uniform(40,120):.0f}" stroke="#f2d896" stroke-opacity="0.18" stroke-width="2"/>')
    # foreground hill the sounder rises from
    fpts = [(x, 2420 + 25 * noise(x, 9, 2) + 0.00008 * (x - 1300) ** 2) for x in range(880, 1810, 10)]
    s.append('<path d="M880,2700 L' + " L".join(f"{x},{y:.1f}" for x, y in fpts) + ' L1800,2700 Z" fill="#0a141b"/>')
    # ripples in ground around sounder (land behaving like water)
    s.append(f'<g fill="none" stroke="{GOLD}" stroke-opacity="0.35" stroke-width="2">')
    for k in range(5):
        s.append(f'<ellipse cx="1360" cy="2440" rx="{360 + k*75}" ry="{22 + k*9}"/>')
    s.append('</g>')
    # tiny surveyor figure on near ridge (left foreground) with staff and chain
    fx, fy = 470, 2405
    s.append('<path d="M0,2450 C200,2410 380,2395 560,2410 C720,2430 820,2480 900,2520 L900,2700 L0,2700 Z" fill="#070e14"/>')
    s.append(f'<circle cx="{fx-34}" cy="{fy-40}" r="90" fill="url(#lantern)" opacity="0.8"/>')
    s.append(f'<g fill="#05090d" stroke="#f2d896" stroke-opacity="0.7" stroke-width="2.5"><ellipse cx="{fx}" cy="{fy-88}" rx="14" ry="15"/><path d="M{fx-20},{fy-72} L{fx+20},{fy-72} L{fx+30},{fy} L{fx-30},{fy} Z"/></g>')
    s.append(f'<line x1="{fx-24}" y1="{fy-55}" x2="{fx-34}" y2="{fy-40}" stroke="#05090d" stroke-width="3"/><rect x="{fx-41}" y="{fy-42}" width="14" height="18" rx="3" fill="#fff1c4"/>')
    s.append(f'<line x1="{fx+30}" y1="{fy+2}" x2="{fx+42}" y2="{fy-150}" stroke="#d9b56a" stroke-width="5"/>')
    s.append(f'<path d="M{fx-14},{fy-30} Q{fx-90},{fy+10} {fx-180},{fy+5}" stroke="{GOLD}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="4 5" fill="none"/>')
    # Title block
    s.append(f'<g font-family="{FONT}" text-anchor="middle" fill="{GOLD2}">')
    s.append(f'<text x="900" y="330" font-size="64" letter-spacing="22" opacity="0.85">THE LONG SURVEY · BOOK ONE</text>')
    s.append(f'<line x1="520" y1="390" x2="1280" y2="390" stroke="{GOLD}" stroke-width="2"/>')
    s.append(f'<text x="900" y="560" font-size="170" letter-spacing="14">THE FORGER</text>')
    s.append(f'<text x="900" y="680" font-size="78" letter-spacing="30" font-style="italic">of</text>')
    s.append(f'<text x="900" y="860" font-size="190" letter-spacing="16">VERITY</text>')
    s.append(f'<line x1="520" y1="930" x2="1280" y2="930" stroke="{GOLD}" stroke-width="2"/>')
    s.append('</g>')
    s.append(f'<circle cx="900" cy="1035" r="78" fill="none" stroke="{GOLD}" stroke-width="3" opacity="0.8"/><circle cx="900" cy="1035" r="66" fill="none" stroke="{GOLD}" stroke-width="1.5" opacity="0.6"/>')
    s.append(wren_foot(900, 1045, 48, GOLD2, 5))
    s.append(f'<text x="900" y="2600" font-family="{FONT}" font-size="104" letter-spacing="26" text-anchor="middle" fill="{GOLD2}">SAGE LANG</text>')
    # border
    s.append(f'<rect x="40" y="40" width="1720" height="2620" fill="none" stroke="{GOLD}" stroke-opacity="0.55" stroke-width="3"/>')
    s.append(f'<rect x="58" y="58" width="1684" height="2584" fill="none" stroke="{GOLD}" stroke-opacity="0.3" stroke-width="1.5"/>')
    s.append('</svg>')
    open(os.path.join(OUT, fname), "w").write("\n".join(s))

def world_map():
    W, H = 2400, 1800
    random.seed(5)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append('<defs><radialGradient id="reach" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#efe2c0"/><stop offset="0.85" stop-color="#e5d3a6"/><stop offset="1" stop-color="#d9c08a"/></radialGradient></defs>')
    s.append(f'<rect width="{W}" height="{H}" fill="#e9dcbb"/>')
    # Drift texture: wandering contours everywhere
    s.append('<g fill="none" stroke="#8a7350" stroke-opacity="0.28" stroke-width="1.6">')
    for d in contour_paths(W, H, -50, H + 50, 60, 31, amp=60, step=16):
        s.append(f'<path d="{d}"/>')
    s.append('</g>')
    cx, cy, R = 1300, 900, 560
    # sea to north-west
    s.append(f'<path d="M0,0 L1100,0 C1000,120 820,180 700,330 C620,430 560,560 520,700 C500,760 300,800 0,820 Z" fill="#b9c9c3" opacity="0.75"/>')
    for k in range(10):
        s.append(f'<path d="M0,{60+k*70} C300,{40+k*70} 600,{90+k*55} {950-k*45},{10+k*60}" stroke="#7d9790" stroke-opacity="0.35" fill="none" stroke-width="1.4"/>')
    # Margin band (irregular)
    def blob(r0, jitter, seed):
        pts = []
        for a in range(0, 361, 4):
            t = math.radians(a)
            rr = r0 + jitter * noise(a * 7, r0, seed)
            pts.append((cx + rr * math.cos(t), cy + rr * 0.86 * math.sin(t)))
        return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
    s.append(f'<path d="{blob(R+90, 55, 3)}" fill="#ddc99a" stroke="#8a7350" stroke-width="2" stroke-dasharray="10 8"/>')
    s.append(f'<path d="{blob(R, 25, 4)}" fill="url(#reach)" stroke="#5b4a30" stroke-width="3"/>')
    # Reach graticule (held land is ruled)
    s.append('<g stroke="#7a6440" stroke-opacity="0.25" stroke-width="1">')
    for i in range(-5, 6):
        s.append(f'<line x1="{cx+i*100}" y1="{cy-R*0.9}" x2="{cx+i*100}" y2="{cy+R*0.9}"/>')
        s.append(f'<line x1="{cx-R}" y1="{cy+i*90}" x2="{cx+R}" y2="{cy+i*90}"/>')
    s.append('</g>')
    # Ambry river
    s.append(f'<path d="M{cx+380},{cy-350} C{cx+250},{cy-150} {cx+120},{cy+20} {cx+60},{cy+180} C{cx},{cy+330} {cx-80},{cy+420} {cx-60},{cy+520}" stroke="#6f8f95" stroke-width="7" fill="none"/>')
    # Meridian road from Tessary to Cape Verity (west)
    vx, vy = cx - R - 40, cy - 40
    s.append(f'<path d="M{cx},{cy} C{cx-200},{cy-30} {cx-420},{cy-60} {vx+20},{vy}" stroke="#7a3b2a" stroke-width="4" stroke-dasharray="16 8" fill="none"/>')
    # places
    def place(x, y, name, size=34, style="normal", dot=True, anchor="start", dx=14, dy=10):
        out = ""
        if dot:
            out += f'<circle cx="{x}" cy="{y}" r="8" fill="#3b2a18"/>'
        out += f'<text x="{x+dx}" y="{y+dy}" font-family="{FONT}" font-size="{size}" font-style="{style}" fill="#2d2214" text-anchor="{anchor}">{name}</text>'
        return out
    s.append(f'<circle cx="{cx}" cy="{cy}" r="16" fill="none" stroke="#7a3b2a" stroke-width="4"/>')
    s.append(place(cx, cy, "TESSARY", 40, dy=-18) + place(cx, cy, "the Zero Stone", 26, "italic", False, dx=14, dy=26))
    s.append(place(cx + 360, cy - 40, "THE FALLOWMARCH", 34, dot=False))
    s.append(place(cx + 420, cy + 40, "Hobbet", 28) + place(cx + 440, cy + 85, "Wick Fallow", 26, "italic"))
    s.append(place(cx + 10, cy + 360, "Lisk", 34))
    s.append(place(cx + 40, cy + 280, "the Ambry", 26, "italic", False))
    s.append(place(cx - 330, cy - 420, "THE SALT STEPS", 30, dot=False))
    s.append(place(cx - 30, cy - 470, "THE AMMONITE HILLS", 30, dot=False))
    s.append(place(cx - 300, cy - 70, "the Great Meridian Road", 24, "italic", False))
    s.append(f'<polygon points="{vx},{vy} {vx-26},{vy-22} {vx-40},{vy+8}" fill="#3b2a18"/>')
    s.append(place(vx - 10, vy, "CAPE VERITY", 36, anchor="end", dx=-36, dy=-20))
    s.append(place(vx - 10, vy, "the Meridian", 26, "italic", False, anchor="end", dx=-36, dy=16))
    s.append(place(vx + 40, vy + 70, "Verity Cross", 24, "italic"))
    s.append(place(vx - 60, vy + 190, "Brine End", 24))
    s.append(place(vx - 20, vy + 330, "Corrow", 24))
    s.append(place(cx - 40, cy + 640, "Little Sallow", 24))
    s.append(place(cx + 470, cy + 470, "Thessaly Ford", 24))
    s.append(f'<text x="{cx}" y="{cy+R+150}" font-family="{FONT}" font-size="40" letter-spacing="18" text-anchor="middle" fill="#5b4a30">THE MARGIN</text>')
    s.append(f'<text x="{cx}" y="{cy-R*0.55}" font-family="{FONT}" font-size="64" letter-spacing="26" text-anchor="middle" fill="#3b2a18">THE HELD REACH</text>')
    # Drift labels
    s.append(f'<text x="300" y="1350" font-family="{FONT}" font-size="80" letter-spacing="30" fill="#5b4a30" opacity="0.8" transform="rotate(-8 300 1350)">THE DRIFT</text>')
    s.append(f'<text x="1880" y="330" font-family="{FONT}" font-size="60" letter-spacing="24" fill="#5b4a30" opacity="0.7" transform="rotate(10 1880 330)">THE DRIFT</text>')
    s.append(place(260, 1580, "the Sallow ↓ 30 leagues", 30, "italic", False))
    s.append(f'<path d="M{vx-120},{vy+40} l-30,20" stroke="#3b2a18"/>')
    s.append(place(vx - 330, vy + 90, "Tern Stack", 26, "italic"))
    s.append(place(1950, 1450, "here the land wanders", 30, "italic", False))
    # sounder doodle
    s.append(f'<text x="1950" y="1240" font-family="{FONT}" font-size="26" font-style="italic" fill="#5b4a30">sounders seen, 1201–1203</text>')
    # compass rose with wren foot
    s.append(f'<g transform="translate(2150 1550)"><circle r="110" fill="none" stroke="#5b4a30" stroke-width="2"/><circle r="85" fill="none" stroke="#5b4a30" stroke-width="1"/>'
             f'<polygon points="0,-120 14,0 0,120 -14,0" fill="#5b4a30"/><polygon points="-120,0 0,14 120,0 0,-14" fill="#8a7350"/>'
             f'<text y="-132" font-family="{FONT}" font-size="34" text-anchor="middle" fill="#3b2a18">N</text></g>')
    # cartouche
    s.append(f'<g transform="translate(150 140)"><rect width="760" height="210" fill="#efe4c6" stroke="#5b4a30" stroke-width="3"/><rect x="12" y="12" width="736" height="186" fill="none" stroke="#5b4a30" stroke-width="1.2"/>'
             f'<text x="380" y="92" font-family="{FONT}" font-size="54" letter-spacing="8" text-anchor="middle" fill="#2d2214">THE HELD REACH</text>'
             f'<text x="380" y="150" font-family="{FONT}" font-size="30" font-style="italic" text-anchor="middle" fill="#2d2214">with the Margin and the near Drift · 1203 H. · not to scale</text></g>')
    s.append(f'<text x="{W-60}" y="{H-40}" font-family="{FONT}" font-size="22" font-style="italic" text-anchor="end" fill="#5b4a30">Lands beyond the Margin are shown as last observed and are not to be relied upon.</text>')
    s.append(f'<rect x="20" y="20" width="{W-40}" height="{H-40}" fill="none" stroke="#3b2a18" stroke-width="5"/>')
    s.append('</svg>')
    open(os.path.join(OUT, "map-world.svg"), "w").write("\n".join(s))

def academy_map():
    W, H = 2400, 1800
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append(f'<rect width="{W}" height="{H}" fill="#e9dcbb"/>')
    # sea north
    s.append('<path d="M0,0 L2400,0 L2400,330 C1900,380 1500,300 1100,360 C700,420 400,330 0,380 Z" fill="#b9c9c3" opacity="0.8"/>')
    for k in range(6):
        s.append(f'<path d="M0,{60+k*50} C600,{30+k*50} 1400,{90+k*45} 2400,{40+k*50}" stroke="#7d9790" stroke-opacity="0.35" fill="none" stroke-width="1.4"/>')
    # cape (held, bedrock) left
    s.append('<path d="M0,380 C300,350 600,400 820,470 C900,560 920,780 860,1000 C820,1180 700,1400 0,1500 Z" fill="#e2cf9f" stroke="#5b4a30" stroke-width="3"/>')
    # Margin heath to right with contours
    s.append('<g fill="none" stroke="#8a7350" stroke-opacity="0.3" stroke-width="1.5">')
    for d in contour_paths(W, H, 420, 1750, 40, 44, amp=45, step=16):
        s.append(f'<path d="{d}" transform="translate(0 0)"/>')
    s.append('</g>')
    def bld(x, y, w, h, label, rot=0, size=24, style="normal", fill="#cdb889"):
        return (f'<g transform="rotate({rot} {x+w/2} {y+h/2})"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="#3b2a18" stroke-width="2.5"/></g>'
                f'<text x="{x+w/2}" y="{y+h+30}" font-family="{FONT}" font-size="{size}" font-style="{style}" text-anchor="middle" fill="#2d2214">{label}</text>')
    # Old Court quadrangle
    s.append('<rect x="200" y="620" width="420" height="380" fill="#d6c191" stroke="#3b2a18" stroke-width="4"/>')
    s.append('<rect x="270" y="690" width="280" height="240" fill="#e9dcbb" stroke="#3b2a18" stroke-width="2"/>')
    s.append(f'<text x="410" y="815" font-family="{FONT}" font-size="30" text-anchor="middle" fill="#2d2214">OLD COURT</text>')
    s.append(f'<text x="410" y="850" font-family="{FONT}" font-size="20" font-style="italic" text-anchor="middle" fill="#2d2214">Moot-stone ·</text>')
    s.append(bld(220, 470, 150, 90, "Hall of Instruments"))
    s.append(bld(420, 470, 180, 90, "Library of Record"))
    s.append(bld(120, 1060, 160, 100, "Mess (Refectory)"))
    s.append(bld(330, 1060, 130, 100, "Chapel &amp; Crypt"))
    s.append(bld(510, 1060, 120, 100, "Infirmary"))
    s.append(bld(80, 760, 90, 120, "Provost's House", size=20))
    s.append(f'<circle cx="680" cy="560" r="26" fill="#cdb889" stroke="#3b2a18" stroke-width="2.5"/><text x="680" y="520" font-family="{FONT}" font-size="22" text-anchor="middle" fill="#2d2214">Crow-loft</text>')
    # Register (dashed, below ground)
    s.append('<rect x="640" y="820" width="140" height="140" fill="none" stroke="#7a3b2a" stroke-width="3" stroke-dasharray="10 6"/>')
    s.append(f'<text x="710" y="990" font-family="{FONT}" font-size="22" text-anchor="middle" fill="#7a3b2a">REGISTER</text><text x="710" y="1016" font-family="{FONT}" font-size="18" font-style="italic" text-anchor="middle" fill="#7a3b2a">(seven levels below)</text>')
    # meridian line
    s.append('<line x1="0" y1="800" x2="880" y2="800" stroke="#a8823e" stroke-width="3" stroke-dasharray="3 9"/>')
    s.append(f'<text x="40" y="788" font-family="{FONT}" font-size="20" font-style="italic" fill="#7a5a26">the Meridian line</text>')
    # Lantern Gate
    s.append('<path d="M860,760 L860,690 A40,40 0 0 1 940,690 L940,760 L918,760 L918,695 A18,18 0 0 0 882,695 L882,760 Z" fill="#3b2a18"/>')
    s.append(f'<circle cx="900" cy="650" r="12" fill="#e3a83b"/><text x="900" y="620" font-family="{FONT}" font-size="28" text-anchor="middle" fill="#2d2214">LANTERN GATE</text>')
    # Drift Wing ranges - rotated, wobbling
    s.append('<path d="M940,740 C1150,760 1350,820 1550,900 C1750,980 1950,1080 2200,1180" stroke="#8a7350" stroke-width="14" fill="none" opacity="0.6"/>')
    s.append(f'<text x="1250" y="700" font-family="{FONT}" font-size="40" letter-spacing="10" fill="#2d2214">THE DRIFT WING</text>')
    s.append(bld(980, 650, 120, 80, "Lecture Halls", -3))
    s.append(bld(1000, 820, 110, 60, "Fieldwork Shed", 4, 22))
    s.append(f'<text x="1050" y="940" font-family="{FONT}" font-size="22" font-style="italic" text-anchor="middle" fill="#5b4a30">FIRST RANGE</text>')
    s.append(bld(1260, 780, 90, 130, "Wren Stair", -7, 24, "italic", "#d8c08a"))
    s.append(bld(1380, 820, 220, 60, "Long Gallery", 6, 22))
    s.append(bld(1290, 980, 160, 70, "the Ranges", 3, 22))
    s.append(f'<text x="1420" y="1110" font-family="{FONT}" font-size="22" font-style="italic" text-anchor="middle" fill="#5b4a30">SECOND RANGE</text>')
    s.append(f'<circle cx="1760" cy="960" r="60" fill="#d8c8a0" stroke="#3b2a18" stroke-width="2.5"/><text x="1760" y="1050" font-family="{FONT}" font-size="22" text-anchor="middle" fill="#2d2214">Observatory of the Tern</text>')
    s.append(bld(1640, 1110, 150, 70, "Workshops · the Ladder", -9, 22))
    s.append(f'<text x="1700" y="1250" font-family="{FONT}" font-size="22" font-style="italic" text-anchor="middle" fill="#5b4a30">THIRD RANGE</text>')
    # Far Range / Unheld Stacks - ghosted multiple positions
    for k, (dx, dy, rot) in enumerate([(0, 0, 8), (-60, 40, -12), (50, -50, 20)]):
        op = 0.9 if k == 0 else 0.3
        s.append(f'<g opacity="{op}"><rect x="{2040+dx}" y="{1200+dy}" width="150" height="90" fill="#cdb889" stroke="#3b2a18" stroke-width="2.5" transform="rotate({rot} {2115+dx} {1245+dy})"/></g>')
    s.append(f'<text x="2110" y="1380" font-family="{FONT}" font-size="24" text-anchor="middle" fill="#2d2214">The Unheld Stacks</text><text x="2110" y="1410" font-family="{FONT}" font-size="20" font-style="italic" text-anchor="middle" fill="#2d2214">(position uncertain)</text>')
    s.append(f'<text x="1440" y="1600" font-family="{FONT}" font-size="34" letter-spacing="6" fill="#5b4a30">THE MARGIN ↘ to the Tern Stack, 3 leagues</text>')
    s.append(f'<text x="300" y="1350" font-family="{FONT}" font-size="34" letter-spacing="8" fill="#5b4a30">CAPE VERITY</text><text x="300" y="1390" font-family="{FONT}" font-size="22" font-style="italic" fill="#5b4a30">bedrock · within the First Atlas</text>')
    s.append(f'<g transform="translate(150 140)"><rect width="900" height="150" fill="#efe4c6" stroke="#5b4a30" stroke-width="3"/>'
             f'<text x="450" y="70" font-family="{FONT}" font-size="46" letter-spacing="6" text-anchor="middle" fill="#2d2214">THE MERIDIAN AT CAPE VERITY</text>'
             f'<text x="450" y="115" font-family="{FONT}" font-size="26" font-style="italic" text-anchor="middle" fill="#2d2214">as surveyed at First Bell; the Drift Wing is subject to change</text></g>')
    s.append(f'<rect x="20" y="20" width="{W-40}" height="{H-40}" fill="none" stroke="#3b2a18" stroke-width="5"/>')
    s.append('</svg>')
    open(os.path.join(OUT, "map-academy.svg"), "w").write("\n".join(s))

def ornament():
    s = ['<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" viewBox="0 0 600 120">']
    s.append('<g stroke="#6b5530" stroke-width="2" fill="none" stroke-linecap="round">')
    s.append('<line x1="40" y1="60" x2="250" y2="60"/><line x1="350" y1="60" x2="560" y2="60"/>')
    for x in range(60, 250, 19):
        s.append(f'<line x1="{x}" y1="54" x2="{x}" y2="66"/>')
    for x in range(369, 560, 19):
        s.append(f'<line x1="{x}" y1="54" x2="{x}" y2="66"/>')
    s.append('<circle cx="300" cy="60" r="34"/></g>')
    s.append(wren_foot(300, 62, 24, "#6b5530", 3))
    s.append('</svg>')
    open(os.path.join(OUT, "ornament.svg"), "w").write("\n".join(s))

def illustration(name, kind):
    W, H = 1600, 1100
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    s.append(f'<rect width="{W}" height="{H}" fill="#f1e7cf"/>')
    ink = "#2b2116"
    hatch = lambda y0, y1, gap, op: "".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}" stroke="{ink}" stroke-opacity="{op}" stroke-width="1"/>' for y in range(y0, y1, gap))
    if kind == "sounder":
        s.append(hatch(40, 560, 14, 0.10))
        s.append(f'<g fill="none" stroke="{ink}" stroke-width="2" stroke-opacity="0.5">' + "".join(f'<path d="{d}"/>' for d in contour_paths(W, H, 760, 1080, 14, 9, amp=26, step=12)) + '</g>')
        # distant flukes rising from a far hill
        s.append(f'<path d="M180,640 C200,560 230,520 260,500 C250,540 255,580 270,600 C300,560 340,540 380,540 C340,575 300,620 290,660 Z" fill="#bfb293" stroke="{ink}" stroke-width="3"/>')
        s.append(f'<path d="M120,670 C220,640 330,650 420,672" stroke="{ink}" stroke-width="2.5" fill="none"/>')
        body = "M420,800 C500,560 760,400 1060,400 C1260,400 1400,470 1480,590 C1490,610 1490,650 1480,670 C1400,625 1310,615 1240,632 C1110,662 940,740 760,800 Z"
        s.append(f'<path d="{body}" fill="#d3c7a6" stroke="{ink}" stroke-width="4.5"/>')
        # belly shading hatch
        for k in range(22):
            x = 560 + k * 38
            s.append(f'<line x1="{x}" y1="{760 - k*6}" x2="{x+30}" y2="{700 - k*5}" stroke="{ink}" stroke-opacity="0.35" stroke-width="2"/>')
        for k in range(8):
            s.append(f'<path d="M{520+k*55},{730 - k*28} C{700+k*45},{560-k*16} {980+k*30},{500-k*6} {1250+k*20},{540}" stroke="{ink}" stroke-opacity="0.32" stroke-width="2.5" fill="none"/>')
        s.append(f'<path d="M1010,640 C980,720 930,770 850,800 C930,740 960,690 975,630 Z" fill="#b7aa88" stroke="{ink}" stroke-width="3"/>')
        s.append(f'<circle cx="1330" cy="535" r="17" fill="#f1e7cf" stroke="{ink}" stroke-width="4"/><circle cx="1333" cy="535" r="8" fill="{ink}"/>')
        s.append(f'<path d="M1300,600 C1360,610 1420,628 1470,650" stroke="{ink}" stroke-width="3" fill="none"/>')
        r = random.Random(4)
        for _ in range(110):
            x = r.uniform(460, 1460); y = 400 + (x - 1060) ** 2 / 2400 + r.uniform(-10, 60)
            s.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r.uniform(4,15):.0f}" ry="{r.uniform(2,6):.0f}" fill="{ink}" opacity="{r.uniform(0.35,0.85):.2f}"/>')
        for _ in range(45):
            x = r.uniform(480, 1460); y0 = 420 + (x - 1060) ** 2 / 2400
            s.append(f'<line x1="{x:.0f}" y1="{y0+20:.0f}" x2="{x+r.uniform(-5,5):.0f}" y2="{y0+r.uniform(70,160):.0f}" stroke="{ink}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="3 6"/>')
        s.append(f'<path d="M0,820 C300,790 520,810 800,800 C1100,790 1300,810 1600,790 L1600,1100 L0,1100 Z" fill="#e4d8b8" stroke="{ink}" stroke-width="3"/>')
        for k in range(4):
            s.append(f'<ellipse cx="900" cy="808" rx="{540+k*110}" ry="{22+k*10}" fill="none" stroke="{ink}" stroke-opacity="0.45" stroke-width="2"/>')
        for i, x in enumerate((300, 345, 400)):
            s.append(f'<g fill="{ink}"><ellipse cx="{x}" cy="{930-i*4}" rx="9" ry="10"/><path d="M{x-12},{940-i*4} L{x+12},{940-i*4} L{x+17},{990-i*4} L{x-17},{990-i*4} Z"/></g>')
    elif kind == "driftwing":
        s.append(hatch(20, 600, 12, 0.08))
        s.append(f'<circle cx="1200" cy="260" r="90" fill="none" stroke="{ink}" stroke-opacity="0.4" stroke-width="2"/>')
        for i in range(12):
            x = 80 + i * 125; y = 780 + i * 6; rot = (i - 3) * 2.2 if i > 3 else 0
            h = 260 - i * 6 + (60 if i % 4 == 1 else 0)
            s.append(f'<g transform="rotate({rot} {x+50} {y})"><rect x="{x}" y="{y-h}" width="100" height="{h}" fill="#e2d6b6" stroke="{ink}" stroke-width="3"/>'
                     + "".join(f'<rect x="{x+15+c*28}" y="{y-h+20+r*40}" width="14" height="22" fill="none" stroke="{ink}" stroke-width="1.6"/>' for c in range(3) for r in range(int(h//45)))
                     + f'<polygon points="{x-6},{y-h} {x+50},{y-h-55} {x+106},{y-h}" fill="#d6c8a4" stroke="{ink}" stroke-width="3"/></g>')
            if i >= 5:
                s.append(f'<g opacity="0.25" transform="rotate({-rot} {x+30} {y})"><rect x="{x-20}" y="{y-h-10}" width="100" height="{h}" fill="none" stroke="{ink}" stroke-width="2" stroke-dasharray="6 6"/></g>')
        s.append(f'<path d="M0,790 C400,800 900,830 1600,860 L1600,1100 L0,1100 Z" fill="#e4d8b8" stroke="{ink}" stroke-width="3"/>')
        s.append(f'<g fill="none" stroke="{ink}" stroke-width="1.6" stroke-opacity="0.45">' + "".join(f'<path d="{d}"/>' for d in contour_paths(W, H, 880, 1080, 9, 3, amp=20, step=12)) + '</g>')
        for i, x in enumerate((300, 520, 760, 1010)):
            s.append(f'<g fill="{ink}"><ellipse cx="{x}" cy="{915}" rx="8" ry="9"/><path d="M{x-10},{924} L{x+10},{924} L{x+14},{966} L{x-14},{966} Z"/></g><circle cx="{x+20}" cy="930" r="9" fill="#f6c45a" stroke="{ink}"/>')
        s.append(f'<path d="M300,950 Q410,990 520,950 Q640,990 760,950 Q890,990 1010,950" stroke="{ink}" stroke-width="2" stroke-dasharray="5 5" fill="none"/>')
    elif kind == "moot":
        s.append(hatch(20, 1080, 18, 0.06))
        for i in range(-4, 6):
            s.append(f'<line x1="{800+i*160}" y1="300" x2="{800+i*360}" y2="1100" stroke="{ink}" stroke-opacity="0.35" stroke-width="2"/>')
        for j, y in enumerate((380, 480, 620, 820, 1080)):
            s.append(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}" stroke="{ink}" stroke-opacity="0.35" stroke-width="2"/>')
        s.append(f'<ellipse cx="800" cy="720" rx="330" ry="90" fill="#e0d2ad" stroke="{ink}" stroke-width="3"/>')
        s.append(f'<polygon points="700,700 900,690 930,610 880,560 720,565 680,620" fill="#5a5148" stroke="{ink}" stroke-width="4"/>')
        s.append(f'<polygon points="640,715 840,705 870,625 820,575 660,580 620,635" fill="none" stroke="{ink}" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/>')
        s.append(f'<path d="M560,780 L600,760 M1030,780 L990,760" stroke="{ink}" stroke-width="3"/>')
        s.append(wren_foot(470, 830, 40, ink, 4))
        s.append(f'<text x="1140" y="840" font-family="{FONT}" font-size="64" font-style="italic" fill="{ink}">K.R.</text>')
        for k in range(30):
            x = 200 + k * 42
            s.append(f'<g fill="{ink}" opacity="0.8"><ellipse cx="{x}" cy="{330 + (k%3)*10}" rx="12" ry="13"/><rect x="{x-14}" y="{343 + (k%3)*10}" width="28" height="40"/></g>')
    elif kind == "ternstack":
        s.append(hatch(20, 640, 10, 0.1))
        r = random.Random(8)
        for _ in range(120):
            s.append(f'<circle cx="{r.uniform(0,W):.0f}" cy="{r.uniform(0,520):.0f}" r="{r.uniform(1,3):.1f}" fill="{ink}" opacity="0.6"/>')
        s.append(f'<path d="M640,980 L680,460 C690,400 720,330 760,300 L860,300 C890,330 910,420 920,470 L980,980 Z" fill="#cfc3a4" stroke="{ink}" stroke-width="4"/>')
        for k in range(14):
            y = 340 + k * 45
            s.append(f'<path d="M{690 + (k%2)*10},{y} L{930 - (k%3)*8},{y+12}" stroke="{ink}" stroke-opacity="0.4" stroke-width="2"/>')
        s.append(f'<polygon points="780,300 810,250 840,300" fill="{ink}"/><circle cx="810" cy="240" r="60" fill="#f6c45a" opacity="0.35"/>')
        s.append(f'<g fill="{ink}"><ellipse cx="760" cy="560" rx="10" ry="11"/><path d="M748,570 L772,572 L780,612 L750,612 Z"/></g>')
        s.append(f'<path d="M766,600 C730,700 700,820 690,990" stroke="{ink}" stroke-width="2" stroke-dasharray="5 5" fill="none"/>')
        s.append(f'<path d="M0,980 C300,960 600,1000 800,985 C1100,965 1300,1000 1600,975 L1600,1100 L0,1100 Z" fill="#9fb3ae" stroke="{ink}" stroke-width="3"/>')
        for k in range(6):
            s.append(f'<path d="M0,{1010+k*16} C400,{995+k*16} 1000,{1025+k*16} 1600,{1000+k*16}" stroke="{ink}" stroke-opacity="0.35" fill="none"/>')
        for i, x in enumerate((560, 600)):
            s.append(f'<g fill="{ink}"><ellipse cx="{x}" cy="{955}" rx="8" ry="9"/><path d="M{x-10},{964} L{x+10},{964} L{x+13},{1000} L{x-13},{1000} Z"/></g>')
    s.append(f'<rect x="14" y="14" width="{W-28}" height="{H-28}" fill="none" stroke="{ink}" stroke-width="4"/>')
    s.append('</svg>')
    open(os.path.join(OUT, f"{name}.svg"), "w").write("\n".join(s))

def series_covers():
    titles = ["The Sounding Sea", "The Palimpsest Court", "The Wending Road", "The Still City", "The Rent of Ages", "The Last Atlas"]
    hues = ["#12323f", "#2b1d33", "#1f3326", "#2c2f36", "#3a1f1c", "#2a2412"]
    for i, (t, hue) in enumerate(zip(titles, hues), start=2):
        s = ['<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1350" viewBox="0 0 900 1350">']
        s.append(f'<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d13"/><stop offset="0.6" stop-color="{hue}"/><stop offset="1" stop-color="#070d13"/></linearGradient></defs>')
        s.append('<rect width="900" height="1350" fill="url(#g)"/>')
        s.append(f'<g fill="none" stroke="{GOLD}" stroke-opacity="0.2" stroke-width="1.5">' + "".join(f'<path d="{d}"/>' for d in contour_paths(900, 1350, 700, 1300, 18, 50 + i, amp=35, step=12)) + '</g>')
        s.append(f'<line x1="450" y1="0" x2="450" y2="1350" stroke="{GOLD}" stroke-opacity="0.3" stroke-width="2" stroke-dasharray="2 10"/>')
        s.append(f'<g font-family="{FONT}" text-anchor="middle" fill="{GOLD2}"><text x="450" y="170" font-size="30" letter-spacing="10">THE LONG SURVEY · BOOK {["","","TWO","THREE","FOUR","FIVE","SIX","SEVEN"][i]}</text>')
        words = t.upper().split(" ", 1)
        s.append(f'<text x="450" y="330" font-size="64" letter-spacing="8">{words[0]}</text><text x="450" y="430" font-size="76" letter-spacing="8">{words[1]}</text></g>')
        s.append(f'<text x="450" y="1260" font-family="{FONT}" font-size="44" letter-spacing="14" text-anchor="middle" fill="{GOLD2}">SAGE LANG</text>')
        s.append(f'<text x="450" y="1310" font-family="{FONT}" font-size="22" font-style="italic" text-anchor="middle" fill="{GOLD}" opacity="0.7">provisional cover concept</text>')
        s.append(wren_foot(450, 560, 40, GOLD2, 3))
        s.append(f'<rect x="22" y="22" width="856" height="1306" fill="none" stroke="{GOLD}" stroke-opacity="0.5" stroke-width="2"/>')
        s.append('</svg>')
        open(os.path.join(OUT, f"concept-book{i}.svg"), "w").write("\n".join(s))

if __name__ == "__main__":
    cover()
    world_map(); academy_map(); ornament()
    for n, k in [("illus-part1-sounder", "sounder"), ("illus-part2-driftwing", "driftwing"), ("illus-part3-moot", "moot"), ("illus-part4-ternstack", "ternstack")]:
        illustration(n, k)
    series_covers()
    print("svgs:", sorted(os.listdir(OUT)))
