"""Automated verification of manuscript and release files. Writes editorial/AUTOCHECK.json and prints a report."""
import os, re, glob, json, zipfile, collections, sys
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,".."))
CH=os.path.join(ROOT,"manuscript","chapters"); REL=os.path.join(ROOT,"release")
R={"chapters":{},"issues":[]}
files=sorted(glob.glob(os.path.join(CH,"ch*.md")))
nums=[int(re.search(r"ch(\d+)",f).group(1)) for f in files]
R["chapter_numbers"]=nums
if nums!=list(range(1,27)): R["issues"].append(f"chapter set != 1..26: {nums}")
BANNED=["a testament to","something shifted","the air shifted","didn't know she'd been holding","didn't know she had been holding","tapestry","symphony of","palpable","little did she know","in that moment","time stood still","couldn't help but","ministrations","ghost of a smile","barely above a whisper","a mixture of","deafening silence","orbs","unspoken understanding","somewhere, a dog barked","her breath hitched","washed over her","a dance of"]
TICS={"the way":r"\bthe way\b","very":r"\bvery\b","for a moment":r"\bfor a moment\b","went still":r"\bwent still\b","eyes widened":r"\beyes widened\b","heart hammered":r"\bheart (hammered|pounded)\b","suddenly":r"\bsuddenly\b"}
total=0; alltext=""
for f in files:
    t=open(f,encoding="utf-8").read(); alltext+=t+"\n"
    w=len(re.findall(r"[A-Za-z0-9'’\-]+",t)); total+=w
    head=re.match(r"# Chapter (\d+)\n\n## (.+)\n",t)
    info={"words":w,"title":head.group(2) if head else None,"header_ok":bool(head)}
    if not head: R["issues"].append(f"{os.path.basename(f)} bad header")
    if not re.search(r"^>",t,re.M): R["issues"].append(f"{os.path.basename(f)} no epigraph")
    low=t.lower()
    info["banned"]=[b for b in BANNED if b in low]
    info["tics"]={k:len(re.findall(v,low)) for k,v in TICS.items()}
    for ph in ["TODO","TK","[placeholder","lorem","XXX","[insert"]:
        if ph.lower() in low: R["issues"].append(f"{os.path.basename(f)} placeholder '{ph}'")
    if w<3000: R["issues"].append(f"{os.path.basename(f)} short ({w})")
    R["chapters"][os.path.basename(f)]=info
R["total_words"]=total
titles=[c["title"] for c in R["chapters"].values()]
dups=[t for t,c in collections.Counter(titles).items() if c>1]
if dups: R["issues"].append(f"duplicate titles {dups}")
# naming consistency: common misspellings / variants
VARIANTS={"Orsolya":["Orsolia","Orsoyla"],"Aske":["Askes'"],"Halcyon":["Halycon"],"Brinestacks":["Brine-stacks","Brine Stacks"],"Cold House":["Coldhouse"],"Tessaly":["Tessalie"],"Dunmore":["Dunmor "],"Sorle":["Sorel "],"Ferrers":["Ferrer's"],"Callow":["Calow"],"Agathe":["Agatha"],"Linnow":["Linow"],"Lantern Hour":["lantern hour"],"Well-Cap":["Wellcap","well-cap"],"Founders' Shaft":["Founder's Shaft","founders' shaft"]}
for k,vs in VARIANTS.items():
    for v in vs:
        n=alltext.count(v)
        if n: R["issues"].append(f"variant '{v}' x{n} (canon '{k}')")
if re.search(r"\b\d+ Sere\b|of Sere\b|in Sere\b",alltext): R["issues"].append("month 'Sere' used (should be Fallow)")
if re.search(r"\bgulls?\b",open(files[0]).read() if files else ""): pass
# release files
REQ=["BOOK-ONE-COMPLETE.pdf","BOOK-ONE-MOBILE.pdf","BOOK-ONE-COMPLETE.epub","BOOK-ONE-COMPLETE.docx","BOOK-ONE-COMPLETE.md","BOOK-ONE-COVER.png","BOOK-ONE-READER-COMPANION.pdf","SEVEN-BOOK-SERIES-BIBLE.pdf","BOOKS-2-THROUGH-7-OUTLINES.pdf","EDITORIAL-REPORT.md","CONTINUITY-REPORT.md","VERIFICATION-REPORT.md","README.md"]
R["release_present"]={r:os.path.exists(os.path.join(REL,r)) for r in REQ}
print(json.dumps({k:v for k,v in R.items() if k!="chapters"},indent=1))
for k,v in R["chapters"].items():
    flag=[f"{t}={n}" for t,n in v["tics"].items() if (t=="the way" and n>4) or (t=="very" and n>5) or (t=="for a moment" and n>2) or (t in("eyes widened","heart hammered") and n>0) or (t=="suddenly" and n>2)]
    print(k,v["words"],v["title"],("BANNED:"+",".join(v["banned"])) if v["banned"] else "",("TICS:"+",".join(flag)) if flag else "")
json.dump(R,open(os.path.join(ROOT,"editorial","AUTOCHECK.json"),"w"),indent=1)
