#!/usr/bin/env python3
"""Verify release deliverables against the source manuscript.
Checks every chapter's opening and closing words appear (in order) in each format,
compares word counts, validates EPUB with EPUBCheck, inspects DOCX and ZIP integrity."""
import os, re, glob, subprocess, zipfile, json, sys, html
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REL = os.path.join(ROOT, "release"); CH = os.path.join(ROOT, "manuscript", "chapters")
EPUBCHECK = sys.argv[1] if len(sys.argv) > 1 else None
B = "THE-FORGER-OF-VERITY"

def norm(t):
    t = html.unescape(t)
    t = t.replace("­", "").replace("‐", "-").replace("‐", "-")
    t = re.sub(r"[*_#>`]", " ", t)
    t = re.sub(r"[^\w’']+", " ", t.lower())
    return re.sub(r"\s+", " ", t).strip()

def chapters():
    out = []
    for f in sorted(glob.glob(os.path.join(CH, "ch*.md"))):
        txt = open(f, encoding="utf-8").read()
        body = txt.split("\n", 2)[2]
        words = norm(body).split()
        out.append({"file": os.path.basename(f), "words": len(words), "head": " ".join(words[:8]), "tail": " ".join(words[-8:])})
    return out

def text_pdf(p):
    t = subprocess.run(["pdftotext", p, "-"], capture_output=True, text=True).stdout
    lines = [l for l in t.split("\n") if l.strip() not in ("SAGE LANG", "THE FORGER OF VERITY") and not re.fullmatch(r"\s*[0-9ivxlc]+\s*", l) and "\f" not in l or l.strip("\f").strip() not in ("", "SAGE LANG", "THE FORGER OF VERITY")]
    t = "\n".join(l.replace("\f", "") for l in lines)
    t = re.sub(r"[-\u2010]\n\s*", "", t)  # undo hyphenation at line ends
    return norm(t)

def text_epub(p):
    z = zipfile.ZipFile(p)
    names = sorted(n for n in z.namelist() if n.endswith(".xhtml") and "/text/" in n)
    return norm(" ".join(re.sub(r"<[^>]+>", " ", z.read(n).decode("utf-8")) for n in names))

def text_docx(p):
    z = zipfile.ZipFile(p)
    x = z.read("word/document.xml").decode("utf-8")
    x = re.sub(r"</w:p>", "\n", x)
    return norm(re.sub(r"<[^>]+>", "", x))

def text_md(p):
    return norm(open(p, encoding="utf-8").read())

def check_order(full, chs):
    pos, missing = 0, []
    for c in chs:
        i = full.find(c["head"], pos)
        j = full.find(c["tail"], max(i, 0))
        if i < 0 or j < 0:
            missing.append(c["file"]); continue
        pos = j
    return missing

def main():
    chs = chapters()
    report = {"source_chapters": len(chs), "source_words": sum(c["words"] for c in chs), "formats": {}}
    for label, path, fn in [("PDF (6x9)", f"{B}.pdf", text_pdf), ("PDF (mobile)", f"{B}-MOBILE.pdf", text_pdf),
                            ("EPUB", f"{B}.epub", text_epub), ("DOCX", f"{B}.docx", text_docx), ("Markdown", f"{B}.md", text_md)]:
        p = os.path.join(REL, path)
        if not os.path.exists(p):
            report["formats"][label] = {"exists": False}; continue
        full = fn(p)
        missing = check_order(full, chs)
        report["formats"][label] = {"exists": True, "bytes": os.path.getsize(p), "words_extracted": len(full.split()),
                                    "chapters_found_in_order": len(chs) - len(missing), "missing_or_out_of_order": missing}
        if path.endswith(".pdf"):
            info = subprocess.run(["pdfinfo", p], capture_output=True, text=True).stdout
            report["formats"][label]["pages"] = int(re.search(r"Pages:\s+(\d+)", info).group(1))
            report["formats"][label]["page_size"] = re.search(r"Page size:\s+(.+)", info).group(1).strip()
    if EPUBCHECK:
        r = subprocess.run(["java", "-jar", EPUBCHECK, os.path.join(REL, f"{B}.epub")], capture_output=True, text=True)
        m = re.search(r"Messages: (.+)", r.stdout + r.stderr)
        report["epubcheck"] = m.group(1) if m else (r.stdout + r.stderr)[-300:]
    z = os.path.join(REL, "COMPLETE-FANTASY-SAGA-BOOK-ONE.zip")
    if os.path.exists(z):
        with zipfile.ZipFile(z) as zz:
            bad = zz.testzip()
            report["zip"] = {"files": len(zz.namelist()), "testzip": "OK" if bad is None else f"CORRUPT: {bad}", "bytes": os.path.getsize(z)}
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
