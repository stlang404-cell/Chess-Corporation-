"""Build companion PDFs: Reader Companion, Series Bible, Books 2-7 Outlines."""
import os, subprocess, re
from weasyprint import HTML
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,"..")); OUT=os.path.join(ROOT,"release"); ART=os.path.join(ROOT,"art")
CSS="""@page{size:A5;margin:18mm 15mm 18mm 15mm;@bottom-center{content:counter(page);font-family:'EB Garamond';font-size:9pt}
@top-center{content:string(doctitle);font-family:'EB Garamond';font-size:8pt;font-style:italic;color:#555}}
@page:first{@top-center{content:none};@bottom-center{content:none}}
html{font-family:'EB Garamond',serif;font-size:10.5pt;line-height:1.38;hyphens:auto}
h1{font-weight:normal;font-size:1.9em;letter-spacing:.04em;text-align:center;margin:1.2em 0 .6em;page-break-before:always;string-set:doctitle content()}
h1:first-of-type{page-break-before:avoid}
h2{font-weight:normal;font-size:1.35em;border-bottom:1px solid #aaa;margin:1.3em 0 .4em;page-break-after:avoid}
h3{font-size:1.1em;margin:1em 0 .3em;page-break-after:avoid} h4{font-style:italic;font-weight:normal;margin:.8em 0 .2em}
p{margin:.35em 0;text-align:justify} li{margin:.15em 0}
table{border-collapse:collapse;width:100%;font-size:.82em;margin:.6em 0} th,td{border:1px solid #bbb;padding:2px 4px;vertical-align:top;text-align:left} th{background:#efeae0}
blockquote{margin:.5em 1.5em;font-style:italic;color:#333}
img{max-width:100%;display:block;margin:.8em auto} code{font-family:'DejaVu Sans Mono';font-size:.85em}
.titlepage{text-align:center;page-break-after:always;padding-top:40mm}
.titlepage .big{font-size:2.2em;letter-spacing:.05em;margin:.3em 0}
.titlepage .warn{margin-top:20mm;border:1px solid #a33;color:#a33;padding:6px;font-size:.9em}
"""
def md2html(paths):
    txt="\n\n".join(open(p,encoding="utf-8").read() for p in paths)
    # demote: each source file's top '# ' stays h1
    r=subprocess.run(["pandoc","-f","markdown+smart+pipe_tables","-t","html5","--wrap=none"],input=txt.encode(),capture_output=True,check=True)
    return r.stdout.decode()
def build(name,title,subtitle,paths,warn=None,base=ROOT):
    body=md2html(paths)
    body=body.replace('src="../art/','src="file://'+ART+'/')
    tp=f'<div class="titlepage"><p style="letter-spacing:.25em">THE HALCYON CYCLE</p><img src="file://{ART}/ornament.png" style="width:40mm" alt=""><p class="big">{title}</p><p><em>{subtitle}</em></p><p style="margin-top:12mm">[AUTHOR NAME]</p>'+(f'<p class="warn">{warn}</p>' if warn else "")+'</div>'
    doc=f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body>{tp}{body}</body></html>'
    out=os.path.join(OUT,name); HTML(string=doc,base_url=base).write_pdf(out); print(out)
if __name__=="__main__":
    import sys
    B=os.path.join(ROOT,"bible"); A=os.path.join(ROOT,"architecture")
    which=sys.argv[1:] or ["companion","bible","outlines"]
    if "companion" in which:
        build("BOOK-ONE-READER-COMPANION.pdf","A Companion to the Halcyon and the Rim","for readers of What the Salt Keeps",[os.path.join(ROOT,"companion","READER_COMPANION.md")])
    if "bible" in which:
        build("SEVEN-BOOK-SERIES-BIBLE.pdf","The Halcyon Cycle — Series Bible","author's reference · complete",
              [os.path.join(A,"SERIES_ARCHITECTURE.md"),os.path.join(B,"WORLD_BIBLE.md"),os.path.join(B,"MAGIC_SYSTEM.md"),os.path.join(B,"ACADEMY.md"),os.path.join(B,"CHARACTERS.md"),os.path.join(B,"REVELATION_LEDGER.md"),os.path.join(A,"BOOK_ONE_OUTLINE.md"),os.path.join(ROOT,"development","FIVE_CONCEPTS.md"),os.path.join(ROOT,"development","ORIGINALITY_AUDIT.md"),os.path.join(ROOT,"research","RESEARCH_NOTES.md"),os.path.join(ROOT,"STYLE_GUIDE.md"),os.path.join(ART,"VISUAL_STYLE_GUIDE.md")],
              warn="CONTAINS SPOILERS FOR THE ENTIRE SERIES. Author-facing reference.")
    if "outlines" in which:
        build("BOOKS-2-THROUGH-7-OUTLINES.pdf","Books Two through Seven","detailed outlines",[os.path.join(A,"BOOKS_2-7_OUTLINES.md")],warn="CONTAINS SPOILERS FOR THE ENTIRE SERIES.")
