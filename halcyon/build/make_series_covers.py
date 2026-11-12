"""Provisional seven-book cover system (spoiler-safe motifs) + contact sheet."""
import math, random, os, cairosvg
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__)); ART=os.path.join(HERE,"..","art","series"); os.makedirs(ART,exist_ok=True)
W,H=1200,1800; HZ=900
BOOKS=[
 (2,"THE LANTERN TITHE",("#1c1206","#4a2c0c","#d99a3e"),"lanterns"),
 (3,"A MAP OF STILL WATER",("#06121f","#1b3a5c","#a9c6dd"),"sail"),
 (4,"THE DROWNED CHOIR",("#120a1e","#3a2a5a","#b9a6d8"),"rings"),
 (5,"THE RED GRAIN",("#160606","#4a1010","#d9604a"),"crystal"),
 (6,"THE EBB REVERSED",("#041618","#0f4a4e","#8fd0c8"),"rising"),
 (7,"WHEN THE SEA REMEMBERS",("#0b1626","#3b5a7a","#f2d6b0"),"birds"),
]
def cover(n,title,pal,motif):
    random.seed(n)
    top,mid,acc=pal
    s=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="0.6" stop-color="{mid}"/><stop offset="1" stop-color="{acc}" stop-opacity="0.9"/></linearGradient>'
       f'<radialGradient id="gl"><stop offset="0" stop-color="{acc}" stop-opacity="0.9"/><stop offset="1" stop-color="{acc}" stop-opacity="0"/></radialGradient></defs>',
       f'<rect width="{W}" height="{H}" fill="url(#g)"/>']
    for i in range(150):
        s.append(f'<circle cx="{random.uniform(0,W):.0f}" cy="{random.uniform(0,HZ*0.7):.0f}" r="{random.choice([0.8,1.2,1.8])}" fill="#fff" opacity="{random.uniform(0.2,0.8):.2f}"/>')
    s.append(f'<rect y="{HZ+200}" width="{W}" height="{H-HZ-200}" fill="#f2f4f5" opacity="0.92"/>')
    s.append(f'<line x1="0" y1="{HZ+200}" x2="{W}" y2="{HZ+200}" stroke="#fff" stroke-width="3"/>')
    cx,cy=W/2,HZ+60
    if motif=="lanterns":
        for i,(x,y,r) in enumerate([(cx-260,cy-60,38),(cx-90,cy-150,52),(cx+110,cy-90,44),(cx+280,cy-170,34),(cx,cy+40,60)]):
            s.append(f'<circle cx="{x}" cy="{y}" r="{r*3}" fill="url(#gl)"/><rect x="{x-r*0.6}" y="{y-r}" width="{r*1.2}" height="{r*1.8}" rx="{r*0.3}" fill="{acc}" stroke="#fff" stroke-opacity="0.7" stroke-width="2"/><line x1="{x}" y1="{y-r}" x2="{x}" y2="{y-r-40}" stroke="#fff" stroke-opacity="0.5"/>')
    elif motif=="sail":
        s.append(f'<path d="M {cx-10} {cy+140} L {cx-10} {cy-260} L {cx+170} {cy+110} Z" fill="#f6f8fa"/><path d="M {cx-22} {cy-210} L {cx-22} {cy+120} L {cx-170} {cy+110} Z" fill="#dfe8ef"/><path d="M {cx-200} {cy+140} L {cx+220} {cy+140} L {cx+190} {cy+165} L {cx-180} {cy+165} Z" fill="#2a3440"/><line x1="{cx-230}" y1="{cy+175}" x2="{cx+240}" y2="{cy+175}" stroke="#2a3440" stroke-width="5"/>')
    elif motif=="rings":
        for k in range(1,9):
            s.append(f'<circle cx="{cx}" cy="{cy+160}" r="{k*55}" fill="none" stroke="{acc}" stroke-opacity="{0.75-k*0.07:.2f}" stroke-width="3"/>')
    elif motif=="crystal":
        for i in range(14):
            x=cx+random.uniform(-260,260); y=cy+random.uniform(-120,180); sz=random.uniform(30,110); a=random.uniform(-30,30)
            s.append(f'<rect x="{x-sz/2:.0f}" y="{y-sz/2:.0f}" width="{sz:.0f}" height="{sz:.0f}" transform="rotate({a:.0f} {x:.0f} {y:.0f})" fill="{acc}" fill-opacity="{random.uniform(0.25,0.8):.2f}" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>')
    elif motif=="rising":
        for k in range(9):
            y=HZ+200-k*45
            pts=" ".join(f"{x},{y+14*math.sin(x/70+k):.0f}" for x in range(0,W+1,20))
            s.append(f'<polyline points="{pts}" fill="none" stroke="{acc}" stroke-opacity="{0.9-k*0.09:.2f}" stroke-width="4"/>')
    elif motif=="birds":
        s.append(f'<rect y="{HZ+200}" width="{W}" height="{H-HZ-200}" fill="#2f5a7a" opacity="0.9"/>')
        for k in range(6):
            y=HZ+230+k*40
            pts=" ".join(f"{x},{y+8*math.sin(x/50+k):.0f}" for x in range(0,W+1,20))
            s.append(f'<polyline points="{pts}" fill="none" stroke="#f2d6b0" stroke-opacity="0.5" stroke-width="3"/>')
        for i in range(9):
            x=cx+random.uniform(-380,380); y=cy+random.uniform(-260,60); sc=random.uniform(0.6,1.4)
            s.append(f'<path transform="translate({x:.0f} {y:.0f}) scale({sc:.2f})" d="M -50 0 C -30 -18 -12 -16 0 0 C 12 -16 30 -18 50 0 C 30 -8 12 -6 0 8 C -12 -6 -30 -8 -50 0 Z" fill="#fff" opacity="0.9"/>')
    def T(y,t,sz,ls=0,st="normal",op=1):
        s.append(f'<text x="{W/2}" y="{y}" text-anchor="middle" font-family="EB Garamond" font-size="{sz}" letter-spacing="{ls}" font-style="{st}" fill="#f6f1e7" opacity="{op}">{t}</text>')
    T(170,f"THE HALCYON CYCLE · BOOK {['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN'][n]}",30,8,op=0.85)
    words=title.split(); half=(len(words)+1)//2
    lines=[" ".join(words[:half])," ".join(words[half:])] if len(title)>14 else [title]
    for i,l in enumerate(lines): T(330+i*120,l,96 if len(l)<14 else 80,10)
    s.append(f'<text x="{W/2}" y="{H-100}" text-anchor="middle" font-family="EB Garamond" font-size="44" letter-spacing="8" fill="{'#f6f1e7' if motif=='birds' else '#2a3440'}">[AUTHOR NAME]</text>')
    s.append(f'<text x="{W/2}" y="{H-50}" text-anchor="middle" font-family="EB Garamond" font-size="24" font-style="italic" fill="{'#f6f1e7' if motif=='birds' else '#2a3440'}">provisional design</text>')
    s.append('</svg>')
    svg="\n".join(s); p=os.path.join(ART,f"book{n}_provisional.png")
    open(p.replace(".png",".svg"),"w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(),write_to=p,output_width=W,output_height=H); return p
paths=[os.path.join(HERE,"..","art","BOOK-ONE-COVER.png")]+[cover(*b) for b in BOOKS]
ims=[Image.open(p).convert("RGB").resize((400,600)) for p in paths]
sheet=Image.new("RGB",(7*420+20,640),"#e9e4da")
for i,im in enumerate(ims): sheet.paste(im,(20+i*420,20))
sheet.save(os.path.join(HERE,"..","art","SEVEN-BOOK-COVER-SYSTEM.png")); print("ok")
