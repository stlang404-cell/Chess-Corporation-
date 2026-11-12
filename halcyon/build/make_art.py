"""Original vector interior art: ornament, Rim map, Halcyon cross-section."""
import math, random, os, cairosvg
HERE=os.path.dirname(os.path.abspath(__file__)); ART=os.path.join(HERE,"..","art")
INK="#2a3440"; PAPER="#f7f3ea"; SALT="#ffffff"; FONT="EB Garamond"
def save(name,svg,w,h,scale=2):
    open(os.path.join(ART,name+".svg"),"w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(),write_to=os.path.join(ART,name+".png"),output_width=w*scale,output_height=h*scale)
def T(x,y,s,size=16,anchor="middle",style="normal",weight="normal",ls=0,fill=INK,op=1,rot=0):
    tr=f' transform="rotate({rot} {x} {y})"' if rot else ""
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" text-anchor="{anchor}" font-style="{style}" font-weight="{weight}" letter-spacing="{ls}" fill="{fill}" opacity="{op}"{tr}>{s}</text>'
# ---------- ornament: halcyon (kingfisher) on a straight wave ----------
bird='M 30 30 C 36 22 46 18 56 20 C 60 14 68 12 74 16 L 92 14 L 76 21 C 78 26 76 31 70 34 C 62 38 50 38 42 36 L 26 40 L 34 33 Z'
orn=f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60" viewBox="0 0 240 60">
<line x1="10" y1="41" x2="230" y2="41" stroke="{INK}" stroke-width="1.6"/>
<circle cx="10" cy="41" r="2.2" fill="{INK}"/><circle cx="230" cy="41" r="2.2" fill="{INK}"/>
<g transform="translate(72 0)"><path d="{bird}" fill="{INK}"/><circle cx="68" cy="20" r="1.4" fill="{PAPER}"/></g>
</svg>'''
save("ornament",orn,240,60,3)
# ---------- Rim map ----------
random.seed(7); W,H=1400,1000
s=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
   f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
   f'<rect x="20" y="20" width="{W-40}" height="{H-40}" fill="none" stroke="{INK}" stroke-width="2"/>',
   f'<rect x="28" y="28" width="{W-56}" height="{H-56}" fill="none" stroke="{INK}" stroke-width="0.8"/>']
# Hollow Sea outline: irregular ellipse
cx,cy,rx,ry=720,520,520,215
pts=[]
for i in range(140):
    t=2*math.pi*i/140
    r=1+0.06*math.sin(3*t+1)+0.04*math.sin(7*t)+0.025*math.sin(13*t+2)
    pts.append((cx+rx*r*math.cos(t), cy+ry*r*math.sin(t)))
d="M "+" L ".join(f"{x:.1f} {y:.1f}" for x,y in pts)+" Z"
s.append(f'<path d="{d}" fill="{SALT}" stroke="{INK}" stroke-width="2.2"/>')
# shore hatching (old waterline marks)
for x,y in pts[::2]:
    dx,dy=x-cx,y-cy; L=math.hypot(dx,dy)
    s.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x+dx/L*9:.1f}" y2="{y+dy/L*9:.1f}" stroke="{INK}" stroke-width="0.8" opacity="0.6"/>')
# tile cracks inside
for i in range(260):
    x=random.uniform(cx-rx*0.9,cx+rx*0.9); y=random.uniform(cy-ry*0.85,cy+ry*0.85)
    if ((x-cx)/rx)**2+((y-cy)/ry)**2>0.8: continue
    a=random.uniform(0,math.pi); l=random.uniform(6,16)
    s.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x+l*math.cos(a):.1f}" y2="{y+l*math.sin(a):.1f}" stroke="{INK}" stroke-width="0.6" opacity="0.25"/>')
s.append(T(cx,cy-40,"THE HOLLOW SEA",34,ls=12))
s.append(T(cx,cy-6,"(the White)",20,style="italic"))
s.append(T(cx+40,cy+70,"the Deep",22,style="italic",op=0.8))
# Varrow Range: mountains north
for i in range(28):
    x=330+i*30+random.uniform(-6,6); y=200+random.uniform(-25,15)
    h=random.uniform(22,40)
    s.append(f'<path d="M {x-16} {y} L {x} {y-h} L {x+16} {y}" fill="none" stroke="{INK}" stroke-width="1.6"/>')
    s.append(f'<path d="M {x} {y-h} L {x+5} {y-h*0.55}" stroke="{INK}" stroke-width="1"/>')
s.append(T(720,110,"THE VARROW RANGE",22,ls=8))
s.append(T(720,140,"to the kingdom of Hask",16,style="italic"))
# Scald south
for i in range(90):
    x=random.uniform(380,1100); y=random.uniform(860,930)
    s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1" fill="{INK}" opacity="0.5"/>')
s.append(T(740,950,"THE SCALD",20,ls=8))
# Mardens fields (south)
for i in range(6):
    x=520+i*70; y=790
    s.append(f'<path d="M {x} {y} l 40 0 M {x} {y+8} l 40 0 M {x} {y+16} l 40 0" stroke="{INK}" stroke-width="0.8" opacity="0.6"/>')
s.append(T(700,840,"THE MARDENS",18,ls=6))
# Weeps marsh NW
for i in range(30):
    x=random.uniform(150,240); y=random.uniform(300,360)
    s.append(f'<path d="M {x} {y} l 0 -8 M {x-3} {y} l -2 -6 M {x+3} {y} l 2 -6" stroke="{INK}" stroke-width="0.8" opacity="0.7"/>')
s.append(T(195,290,"the Weeps",16,style="italic"))
# River Ambrel
s.append(f'<path d="M 60 220 C 110 260 140 300 190 330" fill="none" stroke="{INK}" stroke-width="1.4"/>')
s.append(T(92,214,"R. Ambrel",14,style="italic",rot=35))
def city(x,y,name,sub=None,big=False,anchor="middle",dy=-14):
    r=7 if big else 5
    out=[f'<circle cx="{x}" cy="{y}" r="{r}" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>', f'<circle cx="{x}" cy="{y}" r="{r-3}" fill="{INK}"/>']
    out.append(T(x,y+dy,name,22 if big else 18,anchor=anchor,weight="bold" if big else "normal"))
    if sub: out.append(T(x,y+dy+20 if dy>0 else y+dy-20,sub,14,anchor=anchor,style="italic"))
    return "".join(out)
s.append(city(185,520,"Ambry","free city",True,dy=-16))
# Halcyon (dome symbol) 2 miles east — exaggerated
s.append(f'<path d="M 228 528 Q 244 506 260 528 Z" fill="{SALT}" stroke="{INK}" stroke-width="1.6"/><line x1="244" y1="517" x2="244" y2="496" stroke="{INK}" stroke-width="1.6"/><circle cx="244" cy="494" r="3" fill="{INK}"/>')
s.append(T(246,555,"the Halcyon",17,style="italic"))
s.append(f'<line x1="192" y1="524" x2="230" y2="526" stroke="{INK}" stroke-width="1.2" stroke-dasharray="3 3"/>')
s.append(city(1265,500,"Quell","the glass city",True,dy=-16))
s.append(city(820,730,"Harl",None,False,dy=-14))
s.append(city(1000,250,"Ostmere",None,False,dy=-14))
s.append(T(880,808,"Tidewater Abbey",13,style="italic"))
# compass
cxp,cyp=1240,830
s.append(f'<circle cx="{cxp}" cy="{cyp}" r="46" fill="none" stroke="{INK}" stroke-width="1.2"/>')
s.append(f'<path d="M {cxp} {cyp-58} L {cxp+9} {cyp} L {cxp} {cyp+58} L {cxp-9} {cyp} Z" fill="{INK}"/>')
s.append(f'<path d="M {cxp-58} {cyp} L {cxp} {cyp+9} L {cxp+58} {cyp} L {cxp} {cyp-9} Z" fill="none" stroke="{INK}" stroke-width="1.2"/>')
s.append(T(cxp,cyp-66,"N",18,weight="bold"))
# scale
s.append(f'<line x1="80" y1="900" x2="253" y2="900" stroke="{INK}" stroke-width="2"/>'+"".join(f'<line x1="{80+i*43.3:.1f}" y1="894" x2="{80+i*43.3:.1f}" y2="906" stroke="{INK}" stroke-width="1.5"/>' for i in range(5)))
s.append(T(166,925,"one hundred miles",15,style="italic"))
s.append(T(W/2,66,"THE RIM AND THE HOLLOW SEA",28,ls=10))
s.append('</svg>')
save("map_rim","\n".join(s),W,H,2)
# ---------- Halcyon cross-section ----------
W,H=1400,1900
s=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
   f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
   f'<rect x="20" y="20" width="{W-40}" height="{H-40}" fill="none" stroke="{INK}" stroke-width="2"/>']
G=640 # surface of White
s.append(f'<rect x="28" y="{G}" width="{W-56}" height="{H-G-28}" fill="#eef1f2"/>')
# dome
s.append(f'<path d="M 420 {G} Q 860 {G-260} 1300 {G} Z" fill="{SALT}" stroke="{INK}" stroke-width="2"/>')
s.append(f'<line x1="28" y1="{G}" x2="{W-28}" y2="{G}" stroke="{INK}" stroke-width="2"/>')
# Causeway to Ambry (left)
s.append(f'<line x1="40" y1="{G-6}" x2="460" y2="{G-6}" stroke="{INK}" stroke-width="3"/>')
for x in range(50,460,30): s.append(f'<line x1="{x}" y1="{G-6}" x2="{x}" y2="{G-20}" stroke="{INK}" stroke-width="1.2"/><circle cx="{x}" cy="{G-22}" r="2.5" fill="#d9a54a"/>')
s.append(T(220,G-36,"the Causeway — to Ambry, two miles",16,style="italic"))
# Lantern
lx=860
s.append(f'<rect x="{lx-12}" y="{G-370}" width="24" height="{260}" fill="{SALT}" stroke="{INK}" stroke-width="1.6"/>')
s.append(f'<polygon points="{lx-30},{G-370} {lx+30},{G-370} {lx+18},{G-410} {lx-18},{G-410}" fill="#f2d48c" stroke="{INK}" stroke-width="1.6"/>')
for ang in (-40,-15,15,40):
    r=math.radians(ang); s.append(f'<line x1="{lx}" y1="{G-392}" x2="{lx+120*math.sin(r):.0f}" y2="{G-392-120*math.cos(r)*0.6:.0f}" stroke="#d9a54a" stroke-width="2" opacity="0.6"/>')
s.append(T(lx+50,G-380,"the Lantern",22,anchor="start",weight="bold"))
# Gatehouse, Rookery, Readers' Close
s.append(f'<rect x="440" y="{G-38}" width="40" height="32" fill="{SALT}" stroke="{INK}" stroke-width="1.4"/>'); s.append(T(460,G-50,"Gatehouse &amp; the Line",15))
for i in range(6):
    x=530+i*36; y=G-40-i*14
    s.append(f'<rect x="{x}" y="{y}" width="14" height="10" fill="#f2d48c" stroke="{INK}" stroke-width="1"/>')
s.append(T(620,G-130,"the Rookery",17,style="italic"))
s.append(f'<rect x="1080" y="{G-70}" width="60" height="30" fill="{SALT}" stroke="{INK}" stroke-width="1.4"/>'); s.append(T(1110,G-82,"Readers' Close",15))
s.append(f'<rect x="1180" y="{G-14}" width="70" height="10" fill="#e9b7b0" stroke="{INK}" stroke-width="1"/>'); s.append(T(1215,G-24,"the Pans",14,style="italic"))
# Well-cap far right
s.append(f'<rect x="1290" y="{G-10}" width="40" height="10" fill="{INK}"/>'); s.append(T(1310,G-20,"the Well-Cap",15,style="italic"))
# Fathom levels
lv=[(780,"FIRST FATHOM","the Benches · the Long Table · the Hall of Assay",240),
    (930,"SECOND FATHOM","the Brinestacks · Readers' studies",280),
    (1080,"THIRD FATHOM","the Cells · kilns · Physic wards",320),
    (1230,"FOURTH FATHOM","the Quiet Rooms · the Choir",350),
    (1380,"FIFTH FATHOM","the Stays (restricted)",380)]
for y,name,sub,half in lv:
    s.append(f'<rect x="{lx-half}" y="{y-46}" width="{2*half}" height="46" fill="{SALT}" stroke="{INK}" stroke-width="1.4"/>')
    for k in range(-half+20,half-10,44):
        s.append(f'<rect x="{lx+k}" y="{y-34}" width="10" height="16" rx="3" fill="#f2d48c" opacity="0.8"/>')
    s.append(f'<line x1="{lx-half-10}" y1="{y-23}" x2="{W-20-1000}" y2="{y-23}" stroke="{INK}" stroke-width="0.8" stroke-dasharray="2 4"/>')
    s.append(T(50,y-30,name,18,anchor="start",weight="bold",ls=3)); s.append(T(84,y-10,sub,15,anchor="start",style="italic"))
# Hush
s.append(f'<rect x="{lx-420}" y="1500" width="840" height="120" fill="#dfe6ea" stroke="{INK}" stroke-width="1.6" stroke-dasharray="6 4"/>')
s.append(T(lx,1570,"THE HUSH",26,ls=10)); s.append(T(lx,1598,"sealed · the founders' working floor",16,style="italic"))
s.append(f'<rect x="{lx-60}" y="1470" width="120" height="30" fill="none" stroke="{INK}" stroke-width="1.6"/>')
for k in range(1,6): s.append(f'<line x1="{lx-60+k*20}" y1="1470" x2="{lx-60+k*20}" y2="1500" stroke="{INK}" stroke-width="1"/>')
s.append(T(lx+70,1492,"lattice door",14,anchor="start",style="italic"))
# Lantern Well (central shaft) & Stair
s.append(f'<rect x="{lx-8}" y="{G-110}" width="16" height="{1230-46-(G-110)}" fill="#f6e6b8" stroke="{INK}" stroke-width="1"/>')
pts=" ".join(f"{lx+50+28*math.sin(t/9):.1f},{G-60+t*1.0:.1f}" for t in range(0,1380-(G-60)))
s.append(f'<polyline points="{pts}" fill="none" stroke="{INK}" stroke-width="1.4"/>')
s.append(T(lx+92,G+60,"the Stair",15,anchor="start",style="italic"))
s.append(T(lx-16,G+60,"the Lantern Well",15,anchor="end",style="italic"))
# Founders' shaft from Hush to Well-Cap
s.append(f'<path d="M 1270 1500 L 1270 {G+60} Q 1270 {G+20} 1300 {G}" fill="none" stroke="{INK}" stroke-width="2.2" stroke-dasharray="10 6"/>')
s.append(T(1282,1100,"the Founders' Shaft",16,anchor="start",style="italic",rot=90))
s.append(T(W/2,80,"THE HALCYON",34,ls=14)); s.append(T(W/2,114,"a section through the Shelf, looking north",18,style="italic"))
s.append(T(W/2,1700,"Depths are reckoned in fathoms below the old waterline, marked in brass across the Gatehouse floor.",16,style="italic"))
s.append(T(W/2,1726,"Not to scale.",14,style="italic"))
s.append('</svg>')
save("halcyon_section","\n".join(s),W,H,2)
print("art ok")
