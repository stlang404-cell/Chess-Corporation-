"""Generate original vector cover art for Book One (SVG -> PNG via cairosvg)."""
import math, random, cairosvg, os
random.seed(903)
W,H=1800,2700
HZ=1240  # horizon
out=[]
a=out.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
a('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#0b1626"/><stop offset="0.55" stop-color="#1d3550"/>
 <stop offset="0.86" stop-color="#6f7f98"/><stop offset="1" stop-color="#e8c9bd"/></linearGradient>
<linearGradient id="deep" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#eef3f6"/><stop offset="0.12" stop-color="#c9d8e3"/>
 <stop offset="0.45" stop-color="#7d9bb3"/><stop offset="0.75" stop-color="#2f4b66"/>
 <stop offset="1" stop-color="#0c1a2b"/></linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
 <stop offset="0" stop-color="#ffe2a0" stop-opacity="0.95"/><stop offset="0.35" stop-color="#f4b860" stop-opacity="0.45"/>
 <stop offset="1" stop-color="#f4b860" stop-opacity="0"/></radialGradient>
<radialGradient id="cube" cx="0.5" cy="0.45" r="0.6">
 <stop offset="0" stop-color="#dfeaf2" stop-opacity="0.55"/><stop offset="1" stop-color="#9fb8cc" stop-opacity="0.08"/></radialGradient>
<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#ffe2a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient>
</defs>''')
a(f'<rect width="{W}" height="{HZ}" fill="url(#sky)"/>')
# stars
for i in range(260):
    x=random.uniform(0,W); y=random.uniform(0,HZ*0.8)
    r=random.choice([0.8,1,1.2,1.6,2.2]) if random.random()>0.06 else 3
    op=random.uniform(0.35,0.95)*(1-y/HZ)
    a(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#f3f1ea" opacity="{op:.2f}"/>')
# cross-section below horizon
a(f'<rect y="{HZ}" width="{W}" height="{H-HZ}" fill="url(#deep)"/>')
# fathom strata lines with slight waviness
for k,yy in enumerate([1290,1400,1520,1650,1790,1940,2100]):
    pts=[]
    for x in range(0,W+1,30):
        pts.append(f'{x},{yy+6*math.sin(x/160+k)+3*math.sin(x/47+k*2):.1f}')
    op=0.18+0.05*k
    a(f'<polyline points="{" ".join(pts)}" fill="none" stroke="#ffffff" stroke-opacity="{min(op,0.5):.2f}" stroke-width="2"/>')
# crystal facets scattered in deep
for i in range(140):
    cx=random.uniform(0,W); cy=random.uniform(HZ+60,H-80); s=random.uniform(6,26)
    op=random.uniform(0.04,0.16)
    ang=random.uniform(0,90)
    a(f'<rect x="{cx-s/2:.1f}" y="{cy-s/2:.1f}" width="{s:.1f}" height="{s:.1f}" transform="rotate({ang:.0f} {cx:.1f} {cy:.1f})" fill="none" stroke="#ffffff" stroke-opacity="{op:.2f}" stroke-width="1.5"/>')
# The dome (salt knoll) as cut section with Fathom galleries
dx=W/2
a(f'<path d="M {dx-520} {HZ} Q {dx} {HZ-210} {dx+520} {HZ} Z" fill="#f4f6f7"/>')
a(f'<path d="M {dx-520} {HZ} Q {dx} {HZ-210} {dx+520} {HZ}" fill="none" stroke="#ffffff" stroke-width="3"/>')
# shaft (Lantern Well) down through section
a(f'<rect x="{dx-7}" y="{HZ-150}" width="14" height="{1880-HZ+150}" fill="url(#beam)"/>')
# galleries: lit amber windows at five fathoms
levels=[(1310,300),(1420,360),(1540,410),(1660,450),(1790,480)]
for (yy,half) in levels:
    a(f'<path d="M {dx-half} {yy} L {dx+half} {yy}" stroke="#f4b860" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="2 10"/>')
    n=int(half/34)
    for j in range(-n,n+1):
        if random.random()<0.55:
            x=dx+j*34+random.uniform(-6,6)
            a(f'<rect x="{x-4:.1f}" y="{yy-12}" width="8" height="12" rx="2" fill="#ffd27a" opacity="{random.uniform(0.45,0.95):.2f}"/>')
# spiral stair
pts=[]
for t in range(0,600):
    yy=HZ-20+t*1.0; xx=dx+60*math.sin(t/14)
    if yy>1780: break
    pts.append(f'{xx:.1f},{yy:.1f}')
a(f'<polyline points="{" ".join(pts)}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>')
# Hush door / sealed lattice
a(f'<rect x="{dx-70}" y="1860" width="140" height="44" fill="none" stroke="#e8eef3" stroke-opacity="0.45" stroke-width="2"/>')
for j in range(1,7):
    a(f'<line x1="{dx-70+j*20}" y1="1860" x2="{dx-70+j*20}" y2="1904" stroke="#e8eef3" stroke-opacity="0.35" stroke-width="1.5"/>')
# held sea: frozen wave lines at depth
for k in range(5):
    yy=2050+k*48
    pts=[]
    for x in range(0,W+1,20):
        pts.append(f'{x},{yy+18*math.sin(x/95+k*0.9)+7*math.sin(x/31+k):.1f}')
    a(f'<polyline points="{" ".join(pts)}" fill="none" stroke="#bcd3e4" stroke-opacity="{0.22+0.06*k:.2f}" stroke-width="2.5"/>')
# kept gull inside a crystal cube
cx,cy,s=dx,2330,190
a(f'<g transform="rotate(-8 {cx} {cy})">')
a(f'<rect x="{cx-s/2}" y="{cy-s/2}" width="{s}" height="{s}" fill="url(#cube)" stroke="#eaf2f8" stroke-opacity="0.8" stroke-width="2.5"/>')
a(f'<path d="M {cx-s/2} {cy-s/2} L {cx-s/2+34} {cy-s/2-26} L {cx+s/2+34} {cy-s/2-26} L {cx+s/2} {cy-s/2} Z" fill="#eaf2f8" fill-opacity="0.12" stroke="#eaf2f8" stroke-opacity="0.55" stroke-width="2"/>')
a(f'<path d="M {cx+s/2} {cy-s/2} L {cx+s/2+34} {cy-s/2-26} L {cx+s/2+34} {cy+s/2-26} L {cx+s/2} {cy+s/2} Z" fill="#eaf2f8" fill-opacity="0.07" stroke="#eaf2f8" stroke-opacity="0.45" stroke-width="2"/>')
a('</g>')
# gull silhouette (wings raised), hand-built path
g=f'''<path transform="translate({cx-78} {cy-40}) scale(1.55)" d="M 2 34 C 18 18 34 12 48 26 C 52 30 54 32 56 33 C 58 32 60 30 64 26 C 78 12 94 18 102 30 C 92 26 80 26 70 34 C 64 39 60 42 57 46 C 55 46 54 46 53 46 C 50 42 46 39 40 34 C 30 27 16 26 2 34 Z" fill="#f7fafc" opacity="0.92"/>'''
a(g)
# horizon glow at Lantern head
lx,ly=dx,HZ-340
a(f'<rect x="{dx-11}" y="{ly}" width="22" height="{HZ-160-ly}" fill="#e9edf0"/>')
a(f'<rect x="{dx-4}" y="{ly+40}" width="8" height="{HZ-200-ly}" fill="#c6cfd6"/>')
for j in range(8):
    yy=ly+60+j*38
    a(f'<line x1="{dx-11}" y1="{yy}" x2="{dx+11}" y2="{yy}" stroke="#aeb9c2" stroke-width="2"/>')
a(f'<polygon points="{dx-30},{ly} {dx+30},{ly} {dx+18},{ly-46} {dx-18},{ly-46}" fill="#ffe7b0"/>')
a(f'<circle cx="{lx}" cy="{ly-22}" r="210" fill="url(#glow)"/>')
for ang in (-62,-35,-12,12,35,62):
    r=math.radians(ang)
    x2=lx+900*math.sin(r); y2=ly-22-900*math.cos(r)*0.35
    a(f'<line x1="{lx}" y1="{ly-22}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="#ffe2a0" stroke-opacity="0.13" stroke-width="10"/>')
# salt plain surface sliver with tiles (perspective) right at horizon, both sides of dome
for side in (-1,1):
    for k in range(14):
        x0=dx+side*(540+k*90)
        a(f'<line x1="{x0}" y1="{HZ}" x2="{x0+side*60}" y2="{HZ+22}" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.5"/>')
a(f'<rect y="{HZ-3}" width="{W}" height="6" fill="#f6f2ee" opacity="0.9"/>')
# Typography
def text(y,s,size,weight="normal",ls=0,fill="#f6f1e7",family="EB Garamond",style="normal",op=1):
    a(f'<text x="{W/2}" y="{y}" text-anchor="middle" font-family="{family}" font-size="{size}" font-weight="{weight}" font-style="{style}" letter-spacing="{ls}" fill="{fill}" opacity="{op}">{s}</text>')
text(250,"THE HALCYON CYCLE · BOOK ONE",44,ls=10,op=0.85)
a(f'<line x1="{W/2-260}" y1="300" x2="{W/2+260}" y2="300" stroke="#f6f1e7" stroke-opacity="0.5" stroke-width="2"/>')
text(470,"WHAT THE",150,ls=18)
text(650,"SALT KEEPS",170,ls=16)
text(760,"a novel",52,style="italic",op=0.85)
text(2600,"[AUTHOR NAME]",64,ls=12,fill="#f6f1e7",op=0.95)
a('</svg>')
svg="\n".join(out)
here=os.path.dirname(os.path.abspath(__file__))
art=os.path.join(here,"..","art")
open(os.path.join(art,"cover.svg"),"w").write(svg)
cairosvg.svg2png(bytestring=svg.encode(),write_to=os.path.join(art,"BOOK-ONE-COVER.png"),output_width=1800,output_height=2700)
cairosvg.svg2png(bytestring=svg.encode(),write_to=os.path.join(art,"cover-ebook.jpg.png"),output_width=1600,output_height=2400)
print("ok")
