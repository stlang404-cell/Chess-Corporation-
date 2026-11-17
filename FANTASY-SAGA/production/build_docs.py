#!/usr/bin/env python3
"""Build the companion, series bible and outlines PDFs (Markdown -> HTML -> Chromium PDF)."""
import os, subprocess, re, html
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ART = os.path.join(ROOT, "artwork"); BUILD = os.path.join(ROOT, "production", "build"); REL = os.path.join(ROOT, "release")
os.makedirs(BUILD, exist_ok=True)

CSS = """
@page { size: 6in 9in; margin: 0.75in 0.65in 0.8in 0.65in; @bottom-center { content: counter(page); font: 9pt 'EB Garamond'; } }
@page cover { margin: 0; @bottom-center { content: none } }
body { margin: 0; }
html { font-family: 'EB Garamond', Cardo, serif; font-size: 10.5pt; line-height: 1.4; color: #151515; hyphens: auto; }
h1 { font-weight: normal; letter-spacing: 0.12em; text-transform: uppercase; font-size: 15pt; color: #3b2a18; border-bottom: 1px solid #b89b62; padding-bottom: 0.2em; margin-top: 1.4em; break-after: avoid; }
h1.major { break-before: page; } section.titleblock + h1.major { break-before: auto; }
h2 { font-weight: normal; font-style: italic; font-size: 13pt; color: #3b2a18; margin-top: 1.1em; break-after: avoid; }
h3 { font-size: 11pt; margin-top: 1em; break-after: avoid; }
p { margin: 0 0 0.55em 0; text-align: justify; }
li { margin-bottom: 0.25em; }
table { border-collapse: collapse; width: 100%; font-size: 8.6pt; margin: 0.6em 0 1em; break-inside: auto; }
th, td { border: 0.5px solid #b89b62; padding: 3px 4px; vertical-align: top; text-align: left; }
th { background: #f1e7cf; }
tr { break-inside: avoid; }
img { max-width: 100%; display: block; margin: 0.6em auto; }
blockquote { margin: 0.5em 1.2em; font-style: italic; color: #333; }
code, pre { font-family: 'EB Garamond', serif; white-space: pre-wrap; }
.titleblock { page: cover; height: 8.95in; overflow: hidden; break-after: page; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #0c1822; color: #f2d896; }
.titleblock .t { font-size: 24pt; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0.5in; line-height: 1.2; }
.titleblock .s { font-size: 11pt; font-style: italic; margin: 1em 0.6in 0; }
.titleblock .a { font-size: 13pt; letter-spacing: 0.3em; margin-top: 1.5in; }
.titleblock .w { font-size: 10pt; letter-spacing: 0.15em; margin-top: 0.4in; color: #ff9f8a; border: 1px solid #ff9f8a; padding: 6px 12px; }
.titleblock img { width: 2.4in; margin-top: 0.4in; }
"""

def md2html(md):
    md = md.replace("ARTDIR", ART)
    return subprocess.run(["pandoc", "-f", "markdown+smart+pipe_tables-yaml_metadata_block", "-t", "html5", "--wrap=none"], input=md, capture_output=True, text=True, check=True).stdout

def strip_yaml(md):
    return re.sub(r"^---\n.*?\n---\n", "", md, flags=re.S)

def demote(md):
    # Each source doc's first-level heading becomes a major section; deeper levels shift by one.
    lines = []
    for line in md.splitlines():
        if line.startswith("#"):
            lines.append("#" + line)
        else:
            lines.append(line)
    return "\n".join(lines)

def make_pdf(name, title, subtitle, warning, body_html, cover_img=None):
    img = f'<img src="{ART}/{cover_img}" alt=""/>' if cover_img else ""
    w = f'<div class="w">{warning}</div>' if warning else ""
    doc = f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{html.escape(title)}</title><style>{CSS}</style></head><body><section class="titleblock"><div class="t">{title}</div><div class="s">{subtitle}</div>{img}{w}<div class="a">SAGE LANG</div></section>{body_html}</body></html>'
    hp = os.path.join(BUILD, name + ".html"); open(hp, "w").write(doc)
    js = os.path.join(BUILD, "render_doc.js")
    open(js, "w").write(f"""const {{ chromium }} = require('playwright');
(async () => {{ const b = await chromium.launch(); const p = await b.newPage();
await p.goto('file://{hp}', {{ waitUntil: 'networkidle' }}); await p.evaluate(() => document.fonts.ready);
await p.pdf({{ path: '{os.path.join(REL, name + ".pdf")}', preferCSSPageSize: true, printBackground: true, outline: true, tagged: true }}); await b.close(); }})();""")
    subprocess.run(["node", js], check=True, cwd=os.path.join(ROOT, "production"))

def section(path, major=True):
    md = strip_yaml(open(os.path.join(ROOT, path), encoding="utf-8").read())
    h = md2html(md)
    if major:
        h = h.replace("<h1", '<h1 class="major"', 1)
    return h

def main():
    # Companion
    comp = strip_yaml(open(os.path.join(ROOT, "production", "companion.md"), encoding="utf-8").read())
    ch = md2html(comp).replace("<h1", '<h1 class="major"')
    make_pdf("THE-FORGER-OF-VERITY-READER-COMPANION", "A Surveyor’s Companion", "An illustrated guide to the Held Reach, the Meridian and the Drift. Spoiler-safe for <i>The Forger of Verity</i>.", None, ch, "cover.png")
    # Series bible
    parts = ["planning/SERIES-ARCHITECTURE.md", "world-bible/MAGIC-SYSTEM.md", "world-bible/ACADEMY.md", "world-bible/WORLD.md",
             "world-bible/CREATURES.md", "characters/CHARACTERS.md", "characters/VOICE-GUIDE.md", "continuity/REVELATION-LEDGER.md",
             "continuity/CANON-LOCK.md", "continuity/CHRONOLOGY.md", "continuity/CHARACTER-KNOWLEDGE.md", "planning/BOOK-ONE-OUTLINE.md", "planning/STYLE-GUIDE.md"]
    body = "".join(section(p) for p in parts if os.path.exists(os.path.join(ROOT, p)))
    make_pdf("SEVEN-BOOK-SERIES-BIBLE", "The Long Survey: Series Bible", "Private author reference. World, magic, characters, chronology, the seven-book architecture, and every hidden truth.", "CONTAINS FULL SERIES SPOILERS", body, "ornament.png")
    # Outlines
    body = "".join(section(f"series/BOOK-0{i}-OUTLINE.md") for i in range(2, 8))
    make_pdf("BOOKS-2-THROUGH-7-OUTLINES", "The Long Survey: Books Two to Seven", "Detailed outlines for the six sequels to <i>The Forger of Verity</i>.", "CONTAINS SPOILERS FOR BOOK ONE AND THE SERIES", body, "ornament.png")
    print("docs built")

if __name__ == "__main__":
    main()
