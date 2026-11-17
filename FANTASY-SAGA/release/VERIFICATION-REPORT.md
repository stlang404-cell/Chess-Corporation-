# VERIFICATION REPORT — *The Forger of Verity* release

Generated from automated checks (`production/verify.py`) and manual proofing in this session. Every result below was observed directly. None is assumed.

## Manuscript
| Check | Result |
|---|---|
| Chapter files present | 32 of 32 (`ch01.md`–`ch32.md`). Contiguous numbering, checked by `build.py`. |
| Heading format | All 32 conform (`# Chapter N` / `## Title`). The build refuses to run on a mismatch. |
| Word count (chapter prose, `wc -w`, including headings) | **123,227** words. 123,747 normalized tokens in the verifier, which splits hyphenated words. Target was 100,000–120,000, so this is about 2.7% over. |
| Chapter lengths | 3,425–3,960 words each. |
| Full prose, no summaries in place of scenes | Checked by four editorial agents and spot reads by the lead editor. |
| Straight quotes in prose | 0 |
| Style-guide banned phrases | 0 remaining |
| Scene breaks | 127 in the source and 127 in the EPUB |

## Cross-format text integrity
For each format, the verifier checks that every chapter's **first eight and last eight words** appear in the extracted text, in chapter order.

| Format | Chapters found, in order | Extracted words | Pages | Size |
|---|---|---|---|---|
| PDF, 6 × 9 in (`THE-FORGER-OF-VERITY.pdf`) | 32 / 32 | ≈126k (includes running heads and front matter) | 296 | 6.9 MB |
| PDF, mobile 4.25 × 7 in | 32 / 32 | ≈126k | 334 | 6.7 MB |
| EPUB 3 | 32 / 32 | ≈124k | n/a | 4.5 MB |
| DOCX | 32 / 32 | ≈124k | 236 when opened in LibreOffice | 0.29 MB |
| Markdown | 32 / 32 | ≈124k | n/a | 0.67 MB |

## EPUB
- **EPUBCheck 5.1.0** (official W3C release, downloaded from GitHub this session), EPUB 3.3 rules: **0 fatals, 0 errors, 0 warnings, 0 infos.** A first build had 32 errors from scene-break markup. These were fixed and re-validated.
- Navigation: 38 entries in the nav document, in order: the Held Reach (maps), Parts One–Four, Chapters 1–32, and A Note on Measures.
- Metadata: title, subtitle, creator (Sage Lang), language en-GB, rights, collection (The Long Survey, position 1), description, and cover image.
- Images: cover, two maps and four part illustrations, all with alt text.
- **Not tested:** rendering in Apple Books or other reading apps. None is available in this Linux container. The EPUB passes the conformance checker those apps' requirements are based on.

## PDF (print layout)
- Page size 432 × 648 pt (6 × 9 in), mirrored margins, running heads (author on verso, title on recto), and page numbers in the outer foot.
- Front matter: cover, half-title, title page, copyright, epigraph, contents, and both maps (rotated to landscape for size).
- Manual proof of rendered pages (front matter, maps, part pages, chapter openers, body, back matter): no clipped text, no overlapping elements, and no blank pages beyond intentional ones.
- Known compromise: running heads also print on chapter-opening pages, a limitation of the Chromium print engine's named-page breaks.
- **Not verified:** any specific printer's bleed, trim, colour-profile or PDF/X requirements. This PDF is **not certified print-ready** for a particular service.

## DOCX
- Opened and converted by LibreOffice 24 (headless): 236 pages, with the text intact from Chapter 1 onward.

## Companion documents
| File | Pages | Notes |
|---|---|---|
| Reader companion | 14 | Searched for spoiler terms (Hallam, lease, Vey nature, "term is spent", Ansel): none found. |
| Series bible | 75 | Full spoilers, marked on the title page |
| Books 2–7 outlines | 20 | Spoilers, marked on the title page |

## ZIP
See the final section, appended after the ZIP was built and tested.

## ZIP (`COMPLETE-FANTASY-SAGA-BOOK-ONE.zip`)
- 179 files, 39.9 MB compressed (45.3 MB uncompressed). It holds the entire `FANTASY-SAGA/` project, with every release deliverable, all sources, the 32 chapter files, the Books 2–7 outlines, the artwork (SVG and PNG), the build scripts and all reports. It excludes only build intermediates.
- `unzip -t`: **No errors detected.**
- Extracted into a clean directory, then SHA-256 compared against the release originals: the print PDF, mobile PDF, EPUB, DOCX, companion, bible and outlines all **match**.
- This report was refreshed inside the ZIP after this section was written (`zip -u`), and the archive was re-tested.

## Acceptance gates
| Gate | Status | Evidence |
|---|---|---|
| Research complete | ✔ | `research/CRAFT-RESEARCH.md` |
| Five concepts evaluated; strongest selected | ✔ | `concepts/` |
| Originality audit; story-selection gate passed | ✔ | `concepts/CONCEPT-EVALUATION.md` |
| Academy, magic, creatures, world bible | ✔ | `world-bible/` |
| Character arcs; seven-book architecture; series mystery solution | ✔ | `characters/`, `planning/SERIES-ARCHITECTURE.md`, `continuity/REVELATION-LEDGER.md` |
| Book One outline | ✔ | `planning/BOOK-ONE-OUTLINE.md` |
| Every chapter in full prose; justified length; central conflict resolves | ✔ | 32 chapters, 123,227 words; Ch 30–31 |
| Chapter reviews; developmental, character, world and magic, mystery and continuity, line, copy and proof passes | ✔ (AI-performed) | `manuscript/notes/`, `editorial/` |
| Original cover; companion; series bible; future outlines | ✔ | `artwork/`, `release/` |
| PDF, EPUB and DOCX generated and checked | ✔ | This report |
| ZIP generated and integrity-checked | ✔ | This section |
| Final files retrievable | ✔ | `release/`, and the git branch `claude/blissful-ptolemy-ooipga` (source; the binaries are in the ZIP) |

## Honest caveats
1. All editorial review was performed by AI agents. No human has read the manuscript.
2. The EPUB hasn't been opened in Apple Books or any other device reader; it passes EPUBCheck.
3. The print PDF isn't verified against any printer's specifications.
4. The artwork is procedural vector art made in code, not painted illustration.
5. The word count is about 2.7% above the 120k target.
