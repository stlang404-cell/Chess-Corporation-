# THE LONG SURVEY — Book One: *The Forger of Verity*
**by Sage Lang**

An original adult/crossover epic fantasy. Ilse Marrow forges maps that move the land. To escape the law she takes the deadly open trial of the Meridian, the College whose students hold the world still every dawn. There she finds a crime only a forger could recognize.

## Read the book
| File | What it is |
|---|---|
| `release/THE-FORGER-OF-VERITY.pdf` | Print-layout edition, 6 × 9 in, 296 pages, EB Garamond, with maps and part illustrations |
| `release/THE-FORGER-OF-VERITY-MOBILE.pdf` | Phone-friendly PDF, 4.25 × 7 in, larger type |
| `release/THE-FORGER-OF-VERITY.epub` | EPUB 3 ebook. EPUBCheck 5.1.0 reports 0 errors and 0 warnings. |
| `release/THE-FORGER-OF-VERITY.docx` | Editable manuscript |
| `release/THE-FORGER-OF-VERITY.md` | Complete Markdown manuscript |
| `manuscript/chapters/ch01.md` … `ch32.md` | Individual chapter files |
| `release/THE-FORGER-OF-VERITY-COVER.png` | Cover, 1800 × 2700 |

## Companion material
| File | Spoilers? |
|---|---|
| `release/THE-FORGER-OF-VERITY-READER-COMPANION.pdf` | Spoiler-safe illustrated guide |
| `release/SEVEN-BOOK-SERIES-BIBLE.pdf` | **Full series spoilers** (private author reference) |
| `release/BOOKS-2-THROUGH-7-OUTLINES.pdf` | **Spoilers** (detailed sequel outlines) |
| `release/EDITORIAL-REPORT.md`, `CONTINUITY-REPORT.md`, `VERIFICATION-REPORT.md` | Process and quality reports |

## Project structure
- `research/`: craft research notes, with sources
- `concepts/`: five concepts, evaluation, originality audit, selection gate
- `planning/`: seven-book architecture, Book One outline, style guide, clue map
- `world-bible/`: magic system, academy, world, creatures
- `characters/`: character bible, voice guide
- `continuity/`: canon lock, revelation ledger, chronology, character knowledge
- `manuscript/`: chapters, notes from drafting, complete Markdown
- `editorial/`: four quarter reviews (including adversarial notes), lead-editor issues, reports
- `artwork/`: SVG and PNG art, visual style guide
- `series/`: outlines for Books 2–7
- `production/`: build scripts (`build.py`, `build_docs.py`, `verify.py`, `art-src/`)
- `release/`: final deliverables and the ZIP

## Rebuild
```
cd production
python3 art-src/make_art.py && node art-src/render_art.js   # artwork
python3 build.py                                            # PDF ×2, EPUB, DOCX, MD
python3 build_docs.py                                       # companion, bible, outlines
python3 verify.py /path/to/epubcheck.jar                    # verification
```
Requires pandoc, Node with Playwright and Chromium, poppler-utils, and the EB Garamond fonts.

## Status files
`PROJECT_STATUS.md`, `NEXT_ACTIONS.md`, `DECISIONS.md`, `CANON_LOCK.md`, `MANUSCRIPT_PROGRESS.md`, `EDITORIAL_PROGRESS.md`, `RELEASE_STATUS.md`
