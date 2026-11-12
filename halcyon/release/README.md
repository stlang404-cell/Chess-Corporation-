# THE HALCYON CYCLE — Book One: *What the Salt Keeps*

An original adult fantasy novel (26 chapters, about 112,800 words). It is Book One of a planned seven-book saga set at the Halcyon, a university carved into the salt of a sea that vanished nine hundred years ago, whose salt can hold any moment still.

**Author name:** none was supplied, so every edition and the cover use the placeholder **[AUTHOR NAME]**. Search and replace it in `source/build/build_book.py` (the `AUTHOR` constant), in `make_cover.py` and in `make_series_covers.py`, then rebuild.

## Contents of this package
| File | What it is |
|---|---|
| `BOOK-ONE-COMPLETE.pdf` | Print-style reading edition, 6 × 9 in, 314 pages. Includes cover, title, copyright, contents, two maps, running heads and page numbers. |
| `BOOK-ONE-MOBILE.pdf` | Phone-friendly PDF, 110 × 190 mm, 471 pages. |
| `BOOK-ONE-COMPLETE.epub` | Reflowable EPUB 3 with nav, NCX, landmarks, alt text and accessibility metadata. Passes EPUBCheck 5.x with 0 errors and 0 warnings. |
| `BOOK-ONE-COMPLETE.docx` | Editable Word manuscript (EB Garamond, 6 × 9). |
| `BOOK-ONE-COMPLETE.md` | Complete Markdown manuscript. |
| `BOOK-ONE-COVER.png` | Front cover, 1800 × 2700 px (original vector art). |
| `BOOK-ONE-READER-COMPANION.pdf` | Spoiler-safe illustrated companion encyclopedia, 36 pages. |
| `SEVEN-BOOK-SERIES-BIBLE.pdf` | Author's series bible, 105 pages. **Full saga spoilers.** |
| `BOOKS-2-THROUGH-7-OUTLINES.pdf` | Detailed outlines of the six sequels, about 15,000 words. **Spoilers.** |
| `EDITORIAL-REPORT.md` | Editorial passes, review findings and revisions. |
| `CONTINUITY-REPORT.md` | Canon system and continuity audits. |
| `VERIFICATION-REPORT.md` | Automated and manual production checks. |
| `art/` | Cover (SVG and PNG), ebook cover, chapter ornament, world map, academy cross-section, seven-book provisional cover system, visual style guide. |
| `source/` | Individual chapter files, the bible, outlines, research, editorial records, and the build scripts. |

## Reading order
Start with the PDF, the EPUB (best for iPhone Books) or the DOCX. The companion is safe to read alongside the novel. Do not open the series bible or the outlines unless you want the whole saga spoiled.

## Rebuilding
You need Python 3 with `weasyprint`, `cairosvg`, `pypdfium2`, `python-docx` and `epubcheck`, plus `pandoc` and the EB Garamond font. Then run:

    python3 source/build/build_book.py      # EPUB, PDFs, DOCX, MD
    python3 source/build/build_docs.py      # companion, bible, outlines PDFs
    python3 source/build/verify.py          # manuscript checks

The build scripts expect the original project layout (`halcyon/…`), which mirrors `source/`.

## Notes
- The artwork is original vector and typographic work, generated in code. No AI image-generation tool was used or available.
- No commercial print-readiness is claimed. The PDF has not been checked against any particular printer's bleed and trim specifications.
