"""Assemble manuscript and build EPUB3, PDF (6x9 + mobile), DOCX, MD.
Usage: python3 build_book.py [--allow-partial]"""
import os, re, sys, glob, subprocess, html, zipfile, uuid, datetime, shutil
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,".."))
CH=os.environ.get("CHDIR",os.path.join(ROOT,"manuscript","chapters")); ART=os.path.join(ROOT,"art"); OUT=os.environ.get("OUTDIR",os.path.join(ROOT,"release")); TMP=os.path.join(ROOT,"build","tmp")
os.makedirs(OUT,exist_ok=True); os.makedirs(TMP,exist_ok=True)
SERIES="The Halcyon Cycle"; TITLE="What the Salt Keeps"; AUTHOR="[AUTHOR NAME]"; YEAR="2026"
BOOKID="urn:uuid:"+str(uuid.uuid5(uuid.NAMESPACE_URL,"halcyon-cycle-book-one"))
EXPECTED=26
files=sorted(glob.glob(os.path.join(CH,"ch[0-9][0-9].md")))
nums=[int(re.search(r"ch(\d\d)",f).group(1)) for f in files]
if nums!=list(range(1,len(nums)+1)):
    sys.exit(f"Chapter numbering gap/dup: {nums}")
if len(nums)<EXPECTED and "--allow-partial" not in sys.argv:
    sys.exit(f"Only {len(nums)} chapters; expected {EXPECTED}")
chapters=[]
for f in files:
    t=open(f,encoding="utf-8").read().strip()
    m=re.match(r"#\s*Chapter\s+(\d+)\s*\n+##\s*(.+?)\n(.*)",t,re.S)
    if not m: sys.exit("Bad header in "+f)
    n,title,body=int(m.group(1)),m.group(2).strip(),m.group(3).strip()
    if n!=int(re.search(r"ch(\d\d)",f).group(1)): sys.exit("Header number mismatch "+f)
    # split epigraph (leading blockquote)
    lines=body.split("\n"); ep=[]; i=0
    while i<len(lines) and (lines[i].startswith(">") or (lines[i].strip()=="" and i+1<len(lines) and lines[i+1].startswith(">"))):
        ep.append(lines[i]); i+=1
    prose="\n".join(lines[i:]).strip()
    chapters.append(dict(n=n,title=title,epigraph="\n".join(ep).strip(),prose=prose))
# ---------- Markdown master ----------
def words(s): return len(re.findall(r"[A-Za-z0-9'’\-]+",s))
total=sum(words(c["prose"])+words(c["epigraph"]) for c in chapters)
md=[f"% {TITLE}\n% {AUTHOR}\n",f"# {TITLE}\n\n*{SERIES} · Book One*\n\n{AUTHOR}\n\n---\n"]
for c in chapters:
    md.append(f"\n# Chapter {c['n']}: {c['title']}\n\n{c['epigraph']}\n\n{c['prose']}\n")
open(os.path.join(OUT,"BOOK-ONE-COMPLETE.md"),"w",encoding="utf-8").write("\n".join(md))
# ---------- md -> html fragments via pandoc ----------
def to_html(mdtext):
    r=subprocess.run(["pandoc","-f","markdown+smart","-t","html5","--wrap=none"],input=mdtext.encode(),capture_output=True,check=True)
    return r.stdout.decode()
def prose_html(c):
    h=to_html(c["prose"])
    h=re.sub(r"<p>\* \* \*</p>",'<p class="scenebreak" aria-hidden="false"><span>⁂</span></p>',h)
    h=h.replace("<hr />",'<p class="scenebreak"><span>⁂</span></p>')
    # mark first paragraph after heading/scenebreak
    h=re.sub(r'^\s*<p>','<p class="first">',h,count=1)
    h=re.sub(r'(<p class="scenebreak"><span>⁂</span></p>\s*)<p>',r'\1<p class="first">',h)
    return h
for c in chapters:
    c["html"]=prose_html(c)
    c["ephtml"]=to_html(c["epigraph"]) if c["epigraph"] else ""
FRONT_COPY=f"""<p>{html.escape(TITLE)}</p><p>{SERIES} · Book One</p>
<p>Copyright © {YEAR} {AUTHOR}. All rights reserved.</p>
<p>This is a work of fiction. Names, characters, places, institutions and events are the products of the author’s imagination. Any resemblance to actual persons, living or dead, or to actual events is entirely coincidental.</p>
<p>Cover art, maps and ornaments: original vector artwork created for this edition.</p>
<p>Set in EB Garamond.</p>
<p>First edition.</p>"""
CSS_COMMON="""
.scenebreak{text-align:center;text-indent:0;margin:1.1em 0;letter-spacing:.5em}
.epigraph{margin:0 2.2em 2.2em;font-size:.92em;font-style:italic}
.epigraph blockquote{margin:0;padding:0}
.epigraph p{text-indent:0;margin:.15em 0}
.epigraph p:last-child{text-align:right;font-style:normal;margin-top:.5em}
.epigraph em{font-style:normal}
"""
# ---------- EPUB ----------
def build_epub():
    d=os.path.join(TMP,"epub"); shutil.rmtree(d,ignore_errors=True); os.makedirs(os.path.join(d,"META-INF")); os.makedirs(os.path.join(d,"OEBPS","images")); os.makedirs(os.path.join(d,"OEBPS","text"))
    open(os.path.join(d,"mimetype"),"w").write("application/epub+zip")
    open(os.path.join(d,"META-INF","container.xml"),"w").write('<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
    for src,dst in [("cover-ebook.jpg","cover.jpg"),("map_rim.png","map_rim.png"),("halcyon_section.png","halcyon_section.png"),("ornament.png","ornament.png")]:
        shutil.copy(os.path.join(ART,src),os.path.join(d,"OEBPS","images",dst))
    css="""body{font-family:serif;line-height:1.5;margin:0 4%}
p{margin:0;text-indent:1.3em;text-align:justify;hyphens:auto;-webkit-hyphens:auto}
p.first{text-indent:0}
h1{font-weight:normal;text-align:center;margin:2.5em 0 0;font-size:1em;letter-spacing:.25em;text-transform:uppercase}
h2{font-weight:normal;font-style:italic;text-align:center;font-size:1.5em;margin:.4em 0 1.2em}
.orn{text-align:center;margin:0 0 1.2em}.orn img{width:7em}
.center{text-align:center;text-indent:0}
.titlepage{text-align:center;margin-top:20%}
.titlepage .t{font-size:2em;letter-spacing:.08em;text-indent:0;text-align:center;margin:.5em 0}
.titlepage p{text-indent:0;text-align:center}
.copyright p{text-indent:0;font-size:.85em;margin:.5em 0;text-align:left}
figure{margin:1em 0;text-align:center}figure img{max-width:100%}figcaption{font-size:.85em;font-style:italic}
nav ol{list-style:none;padding-left:0}nav li{margin:.3em 0}
"""+CSS_COMMON
    open(os.path.join(d,"OEBPS","style.css"),"w").write(css)
    def xhtml(title,body,etype=""):
        return f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head><meta charset="UTF-8"/><title>{html.escape(title)}</title><link rel="stylesheet" type="text/css" href="../style.css"/></head>
<body{(' epub:type="'+etype+'"') if etype else ''}>
{body}
</body></html>'''
    items=[]; spine=[]
    def add(fid,fname,title,body,etype="",props=None):
        open(os.path.join(d,"OEBPS","text",fname),"w",encoding="utf-8").write(xhtml(title,body,etype))
        items.append((fid,"text/"+fname,"application/xhtml+xml",props)); spine.append(fid)
    add("cover","cover.xhtml","Cover",f'<section epub:type="cover" class="center"><img role="doc-cover" src="../images/cover.jpg" alt="Cover of {TITLE}: a salt-glass tower lit at its summit stands on a white dome above a frozen cross-section of a vanished sea, in which a gull is held inside a crystal of salt." style="max-width:100%;max-height:100%"/></section>')
    add("title","title.xhtml","Title Page",f'<section epub:type="titlepage" class="titlepage"><p>{SERIES.upper()} · BOOK ONE</p><h1 class="t" style="text-transform:none;font-size:2em;letter-spacing:.08em">{TITLE}</h1><p class="orn"><img src="../images/ornament.png" alt=""/></p><p><em>a novel</em></p><p style="margin-top:3em">{AUTHOR}</p></section>',"frontmatter")
    add("copyright","copyright.xhtml","Copyright",f'<section epub:type="copyright-page" class="copyright">{FRONT_COPY}</section>',"frontmatter")
    add("maps","maps.xhtml","Maps",f'<section epub:type="frontmatter"><h2>Maps</h2><figure><img src="../images/map_rim.png" alt="Map of the Rim: an oval salt plain called the Hollow Sea, with the free city of Ambry and the Halcyon on its western shore, Quell on the east, Harl and the Mardens to the south, the Scald desert beyond them, the Varrow Range and Ostmere to the north, and the marsh called the Weeps north-west of Ambry."/><figcaption>The Rim and the Hollow Sea</figcaption></figure><figure><img src="../images/halcyon_section.png" alt="Cross-section of the Halcyon: the Lantern tower on a salt dome; below the surface, five levels called the First to Fifth Fathoms, linked by a spiral Stair and a central light well; below them the sealed Hush; and a dashed Founders\' Shaft rising from the Hush to an iron Well-Cap on the plain east of the dome."/><figcaption>The Halcyon</figcaption></figure></section>')
    for c in chapters:
        body=f'<section epub:type="chapter" role="doc-chapter" aria-labelledby="h{c["n"]}"><h1 id="h{c["n"]}">Chapter {c["n"]}</h1><h2>{html.escape(c["title"])}</h2><p class="orn"><img src="../images/ornament.png" alt=""/></p>'
        if c["ephtml"]: body+=f'<div class="epigraph" epub:type="epigraph" role="doc-epigraph">{c["ephtml"]}</div>'
        body+=c["html"]+"</section>"
        add(f"ch{c['n']:02d}",f"ch{c['n']:02d}.xhtml",f"Chapter {c['n']}: {c['title']}",body,"bodymatter")
    add("about","about.xhtml","About the Series",f'<section epub:type="backmatter"><h2>The Halcyon Cycle</h2><p class="first"><em>{TITLE}</em> is the first of seven novels of the Halcyon Cycle.</p><p>Book Two: <em>The Lantern Tithe</em>.</p></section>',"backmatter")
    # nav
    toc="".join(f'<li><a href="ch{c["n"]:02d}.xhtml">Chapter {c["n"]}: {html.escape(c["title"])}</a></li>' for c in chapters)
    navbody=f'''<nav epub:type="toc" id="toc" role="doc-toc"><h2>Contents</h2><ol><li><a href="title.xhtml">Title Page</a></li><li><a href="copyright.xhtml">Copyright</a></li><li><a href="maps.xhtml">Maps</a></li>{toc}<li><a href="about.xhtml">The Halcyon Cycle</a></li></ol></nav>
<nav epub:type="landmarks" id="landmarks" hidden="hidden"><h2>Landmarks</h2><ol><li><a epub:type="cover" href="cover.xhtml">Cover</a></li><li><a epub:type="toc" href="nav.xhtml">Contents</a></li><li><a epub:type="bodymatter" href="ch01.xhtml">Begin Reading</a></li></ol></nav>'''
    open(os.path.join(d,"OEBPS","text","nav.xhtml"),"w",encoding="utf-8").write(xhtml("Contents",navbody))
    items.insert(1,("nav","text/nav.xhtml","application/xhtml+xml","nav")); spine.insert(3,"nav")
    # ncx
    ncx_pts="".join(f'<navPoint id="np{i}" playOrder="{i}"><navLabel><text>Chapter {c["n"]}: {html.escape(c["title"])}</text></navLabel><content src="text/ch{c["n"]:02d}.xhtml"/></navPoint>' for i,c in enumerate(chapters,1))
    open(os.path.join(d,"OEBPS","toc.ncx"),"w",encoding="utf-8").write(f'<?xml version="1.0" encoding="UTF-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="{BOOKID}"/></head><docTitle><text>{TITLE}</text></docTitle><navMap>{ncx_pts}</navMap></ncx>')
    now=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    man="".join(f'<item id="{i}" href="{h}" media-type="{m}"{(" properties=\""+p+"\"") if p else ""}/>' for i,h,m,p in items)
    man+='<item id="css" href="style.css" media-type="text/css"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
    man+='<item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/><item id="img-map" href="images/map_rim.png" media-type="image/png"/><item id="img-sec" href="images/halcyon_section.png" media-type="image/png"/><item id="img-orn" href="images/ornament.png" media-type="image/png"/>'
    sp="".join(f'<itemref idref="{s}"/>' for s in spine)
    opf=f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">{BOOKID}</dc:identifier><dc:title>{TITLE}</dc:title><dc:creator>{AUTHOR}</dc:creator><dc:language>en</dc:language>
<dc:subject>Fantasy</dc:subject><dc:description>Book One of The Halcyon Cycle. A customs assayer whose brother has been kept in salt for eleven years enters the Halcyon, a university carved into the salt of a vanished sea, and uncovers what is draining the city's sleepers.</dc:description>
<meta property="belongs-to-collection" id="series">{SERIES}</meta><meta refines="#series" property="collection-type">series</meta><meta refines="#series" property="group-position">1</meta>
<meta property="dcterms:modified">{now}</meta>
<meta property="schema:accessMode">textual</meta><meta property="schema:accessMode">visual</meta>
<meta property="schema:accessModeSufficient">textual</meta>
<meta property="schema:accessibilityFeature">structuralNavigation</meta><meta property="schema:accessibilityFeature">tableOfContents</meta><meta property="schema:accessibilityFeature">alternativeText</meta><meta property="schema:accessibilityFeature">readingOrder</meta>
<meta property="schema:accessibilityHazard">none</meta>
<meta property="schema:accessibilitySummary">Reflowable text with semantic chapter headings, a navigable table of contents, landmarks, and text descriptions for the cover and maps. Decorative ornaments are marked as decorative.</meta>
<meta name="cover" content="cover-image"/>
</metadata>
<manifest>{man}</manifest>
<spine toc="ncx">{sp}</spine>
</package>'''
    open(os.path.join(d,"OEBPS","content.opf"),"w",encoding="utf-8").write(opf)
    out=os.path.join(OUT,"BOOK-ONE-COMPLETE.epub")
    with zipfile.ZipFile(out,"w") as z:
        z.write(os.path.join(d,"mimetype"),"mimetype",compress_type=zipfile.ZIP_STORED)
        for base,_,fs in os.walk(d):
            for f in fs:
                p=os.path.join(base,f); a=os.path.relpath(p,d)
                if a=="mimetype": continue
                z.write(p,a,compress_type=zipfile.ZIP_DEFLATED)
    return out
# ---------- PDF (WeasyPrint) ----------
def build_pdf(mobile=False):
    from weasyprint import HTML
    if mobile:
        page="size:110mm 190mm;margin:12mm 9mm 13mm 9mm"; fs="11.5pt"; lh="1.42"
    else:
        page="size:6in 9in;margin:0.75in 0.6in 0.8in 0.6in"; fs="11pt"; lh="1.38"
    css=f"""
@page{{ {page}; @bottom-center{{content:counter(page);font-family:'EB Garamond';font-size:9pt}}
 @top-center{{content:string(chap);font-family:'EB Garamond';font-size:8.5pt;font-style:italic;letter-spacing:.06em;color:#444}} }}
@page :left{{ @top-center{{content:"{TITLE}";font-family:'EB Garamond';font-size:8.5pt;font-style:italic;letter-spacing:.06em;color:#444}} }}
@page front{{ @bottom-center{{content:none}} @top-center{{content:none}} }}
@page chapteropen{{ @top-center{{content:none}} }}
@page cover{{ margin:0; @bottom-center{{content:none}} @top-center{{content:none}} }}
html{{font-family:'EB Garamond',serif;font-size:{fs};line-height:{lh};hyphens:auto}}
body{{margin:0}}
p{{margin:0;text-indent:1.4em;text-align:justify;orphans:2;widows:2}}
p.first{{text-indent:0}}
p.first::first-line{{font-variant:small-caps;letter-spacing:.03em}}
.cover{{page:cover;page-break-after:always}} .cover img{{width:{'110mm' if mobile else '6in'};height:{'190mm' if mobile else '9in'};object-fit:cover;display:block}}
.front{{page:front;page-break-after:always;text-align:center}}
.titlepage{{padding-top:{'25mm' if mobile else '1.6in'}}}
.titlepage .series{{letter-spacing:.25em;font-size:.8em}}
.titlepage h1{{font-weight:normal;font-size:2.3em;letter-spacing:.06em;margin:.4em 0 .2em}}
.titlepage .author{{margin-top:2.5em;letter-spacing:.2em}}
.copyright{{text-align:left;font-size:.8em;padding-top:{'60mm' if mobile else '4in'}}}
.copyright p{{text-indent:0;margin:.5em 0;text-align:left}}
.toc{{text-align:left}} .toc h2{{text-align:center;font-weight:normal;letter-spacing:.2em;font-size:1em;text-transform:uppercase;margin:1.5em 0}}
.toc ol{{list-style:none;padding:0;margin:0}} .toc li{{margin:.18em 0;font-size:.95em}}
.toc a{{color:black;text-decoration:none}} .toc a::after{{content:leader('. ') target-counter(attr(href),page)}}
.mapp{{page:front;page-break-after:always;text-align:center}} .mapp img{{max-width:100%;max-height:{'160mm' if mobile else '7.2in'}}}
.mapp p{{text-indent:0;text-align:center;font-style:italic;font-size:.9em}}
section.chapter{{page:chapteropen;page-break-before:right}}
section.chapter{{break-before:{'page' if mobile else 'right'}}}
.chapter h1{{font-weight:normal;text-align:center;font-size:.85em;letter-spacing:.3em;text-transform:uppercase;margin:{'14mm' if mobile else '1.1in'} 0 0;}}
.chapter h1 .t{{display:none}}
.chapter h2{{string-set:chap content();font-weight:normal;font-style:italic;text-align:center;font-size:1.6em;margin:.25em 0 .5em}}
.orn{{text-align:center;text-indent:0;margin:0 0 1.2em}} .orn img{{width:{'26mm' if mobile else '1.3in'}}}
.scenebreak{{text-align:center;text-indent:0;margin:.9em 0;page-break-inside:avoid}}
.epigraph{{margin:0 1.6em 1.8em;font-size:.88em;font-style:italic}} .epigraph p{{text-indent:0;text-align:left;margin:.1em 0}}
.epigraph p:last-child{{text-align:right;font-style:normal;margin-top:.4em}} .epigraph em{{font-style:normal}}
.epigraph blockquote{{margin:0}}
.back{{page-break-before:always;text-align:center;padding-top:2in}} .back p{{text-indent:0;text-align:center}}
"""
    parts=[f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{TITLE}</title><style>{css}</style></head><body>']
    parts.append(f'<div class="cover"><img src="file://{ART}/BOOK-ONE-COVER.png" alt="Cover"></div>')
    parts.append(f'<div class="front titlepage"><p class="series" style="text-indent:0;text-align:center">{SERIES.upper()} · BOOK ONE</p><h1>{TITLE}</h1><p class="orn"><img src="file://{ART}/ornament.png" alt=""></p><p style="text-indent:0;text-align:center"><em>a novel</em></p><p class="author" style="text-indent:0;text-align:center">{AUTHOR}</p></div>')
    parts.append(f'<div class="front copyright">{FRONT_COPY}</div>')
    parts.append('<div class="front toc"><h2>Contents</h2><ol>'+"".join(f'<li><a href="#ch{c["n"]}">{c["n"]}. {html.escape(c["title"])}</a></li>' for c in chapters)+'</ol></div>')
    mapimg="map_rim_rot.png" if not mobile else "map_rim.png"
    parts.append(f'<div class="mapp"><img src="file://{ART}/{mapimg}" alt="Map of the Rim"><p>The Rim and the Hollow Sea</p></div>')
    parts.append(f'<div class="mapp"><img src="file://{ART}/halcyon_section.png" alt="Section of the Halcyon"><p>The Halcyon</p></div>')
    for c in chapters:
        parts.append(f'<section class="chapter" id="ch{c["n"]}"><h1>Chapter {c["n"]}</h1><h2>{html.escape(c["title"])}</h2><p class="orn"><img src="file://{ART}/ornament.png" alt=""></p>')
        if c["ephtml"]: parts.append(f'<div class="epigraph">{c["ephtml"]}</div>')
        parts.append(c["html"].replace("<span>⁂</span>","<span>* * *</span>")+"</section>")
    parts.append(f'<div class="back"><p><em>{TITLE}</em> is the first novel of</p><p style="letter-spacing:.25em">{SERIES.upper()}</p><p class="orn"><img src="file://{ART}/ornament.png" alt=""></p><p>Book Two: <em>The Lantern Tithe</em></p></div>')
    parts.append("</body></html>")
    out=os.path.join(OUT,"BOOK-ONE-MOBILE.pdf" if mobile else "BOOK-ONE-COMPLETE.pdf")
    HTML(string="".join(parts),base_url=ROOT).write_pdf(out)
    return out
# ---------- DOCX ----------
def build_docx():
    src=os.path.join(TMP,"docx_src.md")
    body=[f"---\ntitle: \"{TITLE}\"\nsubtitle: \"{SERIES} · Book One\"\nauthor: \"{AUTHOR}\"\nlang: en-GB\n---\n"]
    body.append(f"Copyright © {YEAR} {AUTHOR}. All rights reserved. This is a work of fiction.\n\n![The Rim and the Hollow Sea]({ART}/map_rim.png){{width=6in}}\n\n![The Halcyon]({ART}/halcyon_section.png){{width=4.8in}}\n")
    for c in chapters:
        body.append(f"\n# Chapter {c['n']}: {c['title']}\n\n{c['epigraph']}\n\n{c['prose']}\n")
    open(src,"w",encoding="utf-8").write("\n".join(body))
    ref=os.path.join(HERE,"reference.docx")
    out=os.path.join(OUT,"BOOK-ONE-COMPLETE.docx")
    cmd=["pandoc",src,"-f","markdown+smart","-o",out,"--toc","--toc-depth=1"]
    if os.path.exists(ref): cmd+=["--reference-doc",ref]
    subprocess.run(cmd,check=True)
    return out
if __name__=="__main__":
    print("chapters:",len(chapters),"words:",total)
    print(build_epub()); print(build_docx()); print(build_pdf(False)); print(build_pdf(True))
