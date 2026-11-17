#!/usr/bin/env python3
"""Build pipeline for THE FORGER OF VERITY.
Produces: complete Markdown, print PDF (6x9), mobile PDF, EPUB 3, DOCX.
Usage: python3 build.py [--chapters N]   (N limits chapters, for testing)
"""
import os, re, subprocess, sys, json, shutil, html, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CH = os.path.join(ROOT, "manuscript", "chapters")
ART = os.path.join(ROOT, "artwork")
BUILD = os.path.join(ROOT, "production", "build")
REL = os.path.join(ROOT, "release")
os.makedirs(BUILD, exist_ok=True); os.makedirs(REL, exist_ok=True)

TITLE = "The Forger of Verity"; SERIES = "The Long Survey"; AUTHOR = "Sage Lang"
BASENAME = "THE-FORGER-OF-VERITY"
PARTS = [(1, "Part One", "The Walk", "illus-part1-sounder"),
         (8, "Part Two", "The Ranges", "illus-part2-driftwing"),
         (17, "Part Three", "Errata", "illus-part3-moot"),
         (25, "Part Four", "The Long Measure", "illus-part4-ternstack")]
PART_ALT = {
    "illus-part1-sounder": "A sounder, a vast whale-like creature, breaches out of a hillside while three small figures watch; turf and stones slide from its back.",
    "illus-part2-driftwing": "The Drift Wing of the Meridian: a row of tall buildings that lean and shift along a causeway, with students walking below carrying lanterns and a chain.",
    "illus-part3-moot": "The Moot-stone in the Old Court, a dark block on a bed of sand, with its old position drawn faintly beside it and a crowd of students watching.",
    "illus-part4-ternstack": "The Tern Stack, a tall sea-stack with a lit beacon cairn on top; a small figure climbs its face at night while two others wait below.",
}
NUMWORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty", "Twenty-One", "Twenty-Two", "Twenty-Three", "Twenty-Four", "Twenty-Five", "Twenty-Six", "Twenty-Seven", "Twenty-Eight", "Twenty-Nine", "Thirty", "Thirty-One", "Thirty-Two", "Thirty-Three", "Thirty-Four"]

def load_chapters(limit=None):
    files = sorted(f for f in os.listdir(CH) if re.match(r"ch\d\d\.md$", f))
    chapters = []
    for f in files:
        n = int(f[2:4])
        if limit and n > limit: break
        txt = open(os.path.join(CH, f), encoding="utf-8").read().strip()
        m = re.match(r"#\s*Chapter\s+(\d+)\s*\n+##\s*(.+?)\n(.*)", txt, re.S)
        if not m: raise SystemExit(f"Bad heading format in {f}")
        if int(m.group(1)) != n: raise SystemExit(f"Number mismatch in {f}")
        chapters.append({"n": n, "title": m.group(2).strip(), "body": m.group(3).strip()})
    nums = [c["n"] for c in chapters]
    if nums != list(range(1, len(nums) + 1)): raise SystemExit(f"Missing chapters: {nums}")
    return chapters

def part_for(n):
    for start, a, b, img in PARTS:
        if n == start: return (a, b, img)
    return None

def complete_markdown(chapters):
    out = [f"# {TITLE}", f"*{SERIES}, Book One*", f"by {AUTHOR}", ""]
    for c in chapters:
        p = part_for(c["n"])
        if p: out += ["", f"# {p[0]}: {p[1]}", ""]
        out += ["", f"## Chapter {c['n']}: {c['title']}", "", c["body"], ""]
    return "\n".join(out).replace("\n* * *\n", "\n\n* * *\n\n")

def md_to_html(md):
    r = subprocess.run(["pandoc", "-f", "markdown-auto_identifiers+smart", "-t", "html5", "--wrap=none"], input=md, capture_output=True, text=True, check=True)
    h = r.stdout
    h = re.sub(r"<hr\s*/?>", '<p class="scenebreak" aria-label="scene break">* * *</p>', h)
    h = h.replace("<p>* * *</p>", '<p class="scenebreak" aria-label="scene break">* * *</p>')
    return h

def chapter_body_html(c):
    h = md_to_html(c["body"])
    # first paragraph gets class for no-indent & small caps opening
    h = re.sub(r"<p>", '<p class="first">', h, count=1)
    h = re.sub(r'(<p class="scenebreak"[^>]*>\* \* \*</p>\s*)<p>', r'\1<p class="first">', h)
    return h

PRINT_CSS = """
@font-face { font-family: 'Book'; src: local('EB Garamond 12'), local('EB Garamond'); }
@page { size: 6in 9in; margin: 0.8in 0.62in 0.85in 0.62in; }
@page :left { margin-left: 0.62in; margin-right: 0.8in; @bottom-left { content: counter(page); font: 9.5pt 'EB Garamond'; color:#333; } @top-left { content: "SAGE LANG"; font: 7.5pt 'EB Garamond'; letter-spacing: 0.22em; color:#555; } }
@page :right { margin-left: 0.8in; margin-right: 0.62in; @bottom-right { content: counter(page); font: 9.5pt 'EB Garamond'; color:#333; } @top-right { content: "THE FORGER OF VERITY"; font: 7.5pt 'EB Garamond'; letter-spacing: 0.22em; color:#555; } }
@page front { @bottom-left { content: none } @bottom-right { content: none } @top-left { content: none } @top-right { content: none } }
@page opener { @top-left { content: none } @top-right { content: none } }
@page full { margin: 0; @bottom-left { content: none } @bottom-right { content: none } @top-left { content: none } @top-right { content: none } }
html { font-family: 'EB Garamond', 'EB Garamond 12', Cardo, serif; font-size: 11pt; line-height: 1.42; color: #111; hyphens: auto; -webkit-hyphens: auto; text-rendering: optimizeLegibility; font-variant-ligatures: common-ligatures; }
body { margin: 0; }
p { margin: 0; text-indent: 1.4em; text-align: justify; orphans: 2; widows: 2; }
p.first { text-indent: 0; }
p.first::first-line { font-variant: small-caps; letter-spacing: 0.03em; }
p.scenebreak { text-align: center; text-indent: 0; margin: 0.9em 0; letter-spacing: 0.5em; color: #6b5530; break-after: avoid; }
em { font-style: italic; }
.front { page: front; break-after: page; text-align: center; }
.cover { page: full; break-after: page; height: 9in; }
.cover img { width: 6in; height: 9in; display: block; }
.halftitle { padding-top: 2.6in; font-size: 18pt; letter-spacing: 0.18em; text-transform: uppercase; }
.titlepage { padding-top: 1.6in; }
.titlepage .t1 { font-size: 30pt; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1.1; }
.titlepage .of { font-style: italic; font-size: 16pt; margin: 0.2em 0; }
.titlepage .series { font-size: 10pt; letter-spacing: 0.3em; text-transform: uppercase; margin-top: 1.2em; color:#6b5530; }
.titlepage .author { font-size: 15pt; letter-spacing: 0.3em; text-transform: uppercase; margin-top: 2.6in; }
.titlepage img, .orn { width: 2.2in; margin: 0.25in auto; display: block; }
.copyright { text-align: left; font-size: 8.5pt; line-height: 1.45; padding-top: 4.2in; }
.copyright p { text-indent: 0; text-align: left; margin-bottom: 0.6em; }
.epigraph { padding-top: 2.4in; }
.epigraph p { text-indent: 0; text-align: center; }
.epigraph .q { font-size: 13pt; letter-spacing: 0.12em; }
.epigraph .src { font-style: italic; font-size: 9.5pt; margin-bottom: 1.6em; margin-top: 0.3em; }
.toc { text-align: left; padding-top: 0.6in; }
.toc h2 { text-align: center; font-weight: normal; letter-spacing: 0.25em; font-size: 13pt; margin-bottom: 1.2em; }
.toc p { text-indent: 0; text-align: left; font-size: 10pt; line-height: 1.55; }
.toc p.tp { margin-top: 0.7em; font-variant: small-caps; letter-spacing: 0.1em; color: #6b5530; }
.toc .num { display: inline-block; width: 2.2em; color: #6b5530; }
.mappage { page: front; break-after: page; display: flex; flex-direction: column; justify-content: center; height: 7.3in; }
.mappage img { width: 100%; } .mappage img.rot { width: auto; height: 6.9in; margin: 0 auto; display:block; }
.mappage p { text-align: center; text-indent: 0; font-style: italic; font-size: 9pt; margin-top: 0.6em; }
.part { page: front; break-before: page; break-after: page; text-align: center; padding-top: 1.0in; }
.part .pn { font-size: 11pt; letter-spacing: 0.35em; text-transform: uppercase; color: #6b5530; }
.part .pt { font-size: 26pt; letter-spacing: 0.08em; margin-top: 0.2em; text-transform: uppercase; }
.part img { width: 100%; margin-top: 0.5in; }
.chapter { break-before: page; }
.chapter header.opener { }
.chapter header { text-align: center; padding-top: 1.1in; margin-bottom: 0.5in; }
.chapter .cn { font-size: 10pt; letter-spacing: 0.35em; text-transform: uppercase; color: #6b5530; }
.chapter .ct { font-size: 19pt; margin-top: 0.25em; font-style: italic; }
.chapter header img { width: 1.5in; margin: 0.18in auto 0; display: block; }
.backmatter { break-before: page; page: front; }
.backmatter h2 { text-align: center; font-weight: normal; letter-spacing: 0.25em; font-size: 13pt; padding-top: 0.8in; }
.backmatter p { text-indent: 0; margin-bottom: 0.6em; }
"""
MOBILE_CSS = PRINT_CSS.replace("size: 6in 9in; margin: 0.8in 0.62in 0.85in 0.62in;", "size: 4.25in 7in; margin: 0.45in 0.35in 0.5in 0.35in;") \
    .replace("margin-left: 0.62in; margin-right: 0.8in;", "margin-left: 0.35in; margin-right: 0.35in;") \
    .replace("margin-left: 0.8in; margin-right: 0.62in;", "margin-left: 0.35in; margin-right: 0.35in;") \
    .replace("font-size: 11pt; line-height: 1.42", "font-size: 12pt; line-height: 1.45") \
    .replace("height: 9in;", "height: 7in;").replace("width: 6in; height: 9in;", "width: 4.25in; height: 7in;") \
    .replace("padding-top: 4.2in", "padding-top: 1.2in").replace("margin-top: 2.6in", "margin-top: 1.2in") \
    .replace("padding-top: 2.6in", "padding-top: 1.6in").replace("height: 7.3in", "height: 5.9in").replace("height: 6.9in", "height: 5.5in") \
    .replace("text-align: justify", "text-align: left").replace("padding-top: 1.1in; margin-bottom: 0.5in", "padding-top: 0.5in; margin-bottom: 0.3in")

def front_html(chapters, mobile=False):
    year = datetime.date.today().year
    parts = []
    parts.append(f'<section class="cover"><img src="{ART}/cover.png" alt="Cover of The Forger of Verity by Sage Lang"/></section>')
    parts.append(f'<section class="front halftitle">{TITLE}</section>')
    parts.append(f'''<section class="front titlepage"><div class="t1">The Forger</div><div class="of">of</div><div class="t1">Verity</div>
<img src="{ART}/ornament.png" alt=""/><div class="series">Book One of The Long Survey</div><div class="author">{AUTHOR}</div></section>''')
    parts.append(f'''<section class="front copyright">
<p><i>The Forger of Verity</i><br/>Book One of <i>The Long Survey</i></p>
<p>Copyright © {year} Sage Lang. All rights reserved.</p>
<p>This is a work of fiction. Names, characters, places, institutions and incidents are products of the author’s imagination. Any resemblance to actual persons, living or dead, or to actual events is coincidental.</p>
<p>Cover art, maps, chapter ornaments and interior illustrations are original vector artwork created for this edition.</p>
<p>Edition 1.0 · {"Mobile reading edition" if mobile else "Print-layout edition, 6 × 9 in"}</p>
<p>Set in EB Garamond.</p></section>''')
    parts.append('''<section class="front epigraph"><p class="q">WE RECORD WHAT IS.</p><p class="src">— carved over the Lantern Gate, the Meridian, Cape Verity</p>
<p class="q">Don’t sign what you can’t carry.</p><p class="src">— saying of the Margin-folk</p></section>''')
    toc = ['<section class="front toc"><h2>CONTENTS</h2>']
    toc.append('<p class="tp">Maps</p>')
    for c in chapters:
        p = part_for(c["n"])
        if p: toc.append(f'<p class="tp">{p[0]} · {p[1]}</p>')
        toc.append(f'<p><span class="num">{c["n"]}</span>{html.escape(c["title"])}</p>')
    toc.append('<p class="tp">A Note on Measures</p></section>')
    parts.append("".join(toc))
    parts.append(f'<section class="mappage"><img class="rot" src="{ART}/map-world-rot.png" alt="Map of the Held Reach, showing Tessary and the Zero Stone at the center, the Fallowmarch to the east, Cape Verity and the Meridian on the western rim, the surrounding band of the Margin, and the Drift beyond."/><p>The Held Reach, with the Margin and the near Drift</p></section>')
    parts.append(f'<section class="mappage"><img class="rot" src="{ART}/map-academy-rot.png" alt="Plan of the Meridian at Cape Verity: the Old Court and Register on the bedrock cape, the Lantern Gate, and the Drift Wing trailing out across the Margin through the First, Second and Third Ranges to the Unheld Stacks."/><p>The Meridian at Cape Verity</p></section>')
    return "\n".join(parts)

def back_html():
    return '''<section class="backmatter"><h2>A NOTE ON MEASURES</h2>
<p>Surveyors of the Held Reach measure in the old units. A <b>link</b> is 7.92 inches. Twenty-five links make a <b>rod</b> (16½ feet). Four rods, or one hundred links, make a <b>chain</b> (66 feet), the length of the surveyor’s chain itself. Ten chains make a <b>furlong</b>, eighty chains a <b>mile</b>, and three miles a <b>league</b>.</p>
<p>At the Meridian, first-year students are called <i>links</i>, second-years <i>chains</i>, third-years <i>furlongs</i>, and the most senior <i>leagues</i>.</p>
<p>Years are counted from the Holding, the founding of the First Atlas, and written H. This story begins in the autumn of 1203 H.</p>
<p style="text-align:center;margin-top:2em;font-style:italic">The Long Survey continues in Book Two, <b>The Sounding Sea</b>.</p></section>'''

def book_html(chapters, css, mobile=False):
    body = [front_html(chapters, mobile)]
    for c in chapters:
        p = part_for(c["n"])
        if p:
            body.append(f'<section class="part"><div class="pn">{p[0]}</div><div class="pt">{p[1]}</div><img src="{ART}/{p[2]}.png" alt="{html.escape(PART_ALT[p[2]])}"/></section>')
        body.append(f'<section class="chapter"><header class="opener"><div class="cn">Chapter {NUMWORDS[c["n"]]}</div><div class="ct">{html.escape(c["title"])}</div><img src="{ART}/ornament.png" alt=""/></header>')
        body.append(chapter_body_html(c) + "</section>")
    body.append(back_html())
    return f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{TITLE}</title><style>{css}</style></head><body>{"".join(body)}</body></html>'

def render_pdf(htmlpath, pdfpath, w, h):
    js = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://{htmlpath}', {{ waitUntil: 'networkidle' }});
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({{ path: '{pdfpath}', width: '{w}', height: '{h}', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, tagged: true, outline: true }});
  await b.close();
}})();"""
    jsf = os.path.join(BUILD, "render.js"); open(jsf, "w").write(js)
    subprocess.run(["node", jsf], check=True, cwd=os.path.join(ROOT, "production"))

def build_epub(chapters, mdpath):
    # EPUB-specific markdown: parts as level-1, chapters as level-2
    out = []
    for c in chapters:
        p = part_for(c["n"])
        if p:
            out += [f"# {p[0]}: {p[1]} {{.part}}", "", f"![]({ART}/{p[2]}.png){{alt=\"{PART_ALT[p[2]]}\"}}", ""]
        out += [f"## Chapter {c['n']}: {c['title']} {{.chapter}}", "", c["body"].replace("\n* * *\n", "\n\n<p class=\"scenebreak\">* * *</p>\n\n"), ""]
    out += ["# A Note on Measures {.backmatter}", "",
            "Surveyors of the Held Reach measure in the old units. A **link** is 7.92 inches. Twenty-five links make a **rod** (16½ feet). Four rods, or one hundred links, make a **chain** (66 feet). Ten chains make a **furlong**, eighty chains a **mile**, and three miles a **league**.", "",
            "At the Meridian, first-year students are called *links*, second-years *chains*, third-years *furlongs*, and the most senior *leagues*.", "",
            "Years are counted from the Holding, the founding of the First Atlas, and written H. This story begins in the autumn of 1203 H.", "",
            "*The Long Survey continues in Book Two,* **The Sounding Sea**."]
    front = ["# The Held Reach {.unnumbered .maps}", "",
             f"![The Held Reach]({ART}/map-world.png){{alt=\"Map of the Held Reach, showing Tessary and the Zero Stone at the center, the Fallowmarch to the east, Cape Verity and the Meridian on the western rim, the Margin around it and the Drift beyond.\"}}", "",
             f"![The Meridian at Cape Verity]({ART}/map-academy.png){{alt=\"Plan of the Meridian: the Old Court and Register on the bedrock cape, the Lantern Gate, and the Drift Wing trailing across the Margin to the Unheld Stacks.\"}}", "",
             "<div class=\"epigraph\"><p class=\"q\">WE RECORD WHAT IS.</p><p class=\"src\">— carved over the Lantern Gate, the Meridian, Cape Verity</p><p class=\"q\">Don’t sign what you can’t carry.</p><p class=\"src\">— saying of the Margin-folk</p></div>", ""]
    md = "\n".join(front + out)
    emd = os.path.join(BUILD, "epub-source.md"); open(emd, "w").write(md)
    meta = os.path.join(BUILD, "epub-meta.yaml")
    open(meta, "w").write(f"""---
title:
- type: main
  text: "{TITLE}"
- type: subtitle
  text: "Book One of {SERIES}"
creator:
- role: author
  text: "{AUTHOR}"
lang: en-GB
rights: "Copyright © {datetime.date.today().year} Sage Lang. All rights reserved."
belongs-to-collection: "{SERIES}"
group-position: 1
subject: "Fantasy"
description: "Ilse Marrow forges maps that move the land. To escape the law she enters the Meridian, the college whose students hold the world still. There she finds a crime only a forger could see."
---
""")
    css = os.path.join(BUILD, "epub.css")
    open(css, "w").write("""body { font-family: serif; line-height: 1.45; }
p { margin: 0; text-indent: 1.3em; }
h1 + p, h2 + p, p.scenebreak + p { text-indent: 0; }
p.scenebreak { text-align: center; text-indent: 0; margin: 1em 0; letter-spacing: 0.4em; }
h1 { text-align: center; font-weight: normal; letter-spacing: 0.15em; margin-top: 3em; page-break-before: always; }
h2 { text-align: center; font-weight: normal; font-style: italic; margin: 2.5em 0 1.5em; page-break-before: always; }
img { max-width: 100%; }
div.epigraph { text-align: center; margin-top: 3em; }
div.epigraph p { text-indent: 0; text-align: center; }
div.epigraph p.src { font-style: italic; font-size: 0.9em; margin-bottom: 1.5em; }
nav#toc ol { list-style-type: none; }
""")
    epub = os.path.join(REL, f"{BASENAME}.epub")
    subprocess.run(["pandoc", emd, meta, "-f", "markdown+smart", "-o", epub, "--toc", "--toc-depth=2", "--split-level=2",
                    f"--epub-cover-image={ART}/cover.png", f"--css={css}", "--epub-title-page=true"], check=True)
    return epub

def build_docx(chapters):
    md = complete_markdown(chapters)
    p = os.path.join(BUILD, "docx-source.md"); open(p, "w").write(md)
    out = os.path.join(REL, f"{BASENAME}.docx")
    subprocess.run(["pandoc", p, "-f", "markdown+smart", "-o", out, "--toc", "--toc-depth=2",
                    "--metadata", f"title={TITLE}", "--metadata", f"author={AUTHOR}", "--metadata", f"subtitle=Book One of {SERIES}"], check=True)
    return out

def main():
    limit = int(sys.argv[sys.argv.index("--chapters") + 1]) if "--chapters" in sys.argv else None
    chapters = load_chapters(limit)
    md = complete_markdown(chapters)
    mdout = os.path.join(ROOT, "manuscript", "BOOK-ONE-COMPLETE.md"); open(mdout, "w").write(md)
    shutil.copy(mdout, os.path.join(REL, f"{BASENAME}.md"))
    for mobile, css, name, w, h in [(False, PRINT_CSS, f"{BASENAME}.pdf", "6in", "9in"), (True, MOBILE_CSS, f"{BASENAME}-MOBILE.pdf", "4.25in", "7in")]:
        hp = os.path.join(BUILD, name.replace(".pdf", ".html")); open(hp, "w").write(book_html(chapters, css, mobile))
        render_pdf(hp, os.path.join(REL, name), w, h)
    build_epub(chapters, mdout)
    build_docx(chapters)
    shutil.copy(os.path.join(ART, "cover.png"), os.path.join(REL, f"{BASENAME}-COVER.png"))
    print(json.dumps({"chapters": len(chapters), "words": sum(len(c['body'].split()) for c in chapters)}))

if __name__ == "__main__":
    main()
