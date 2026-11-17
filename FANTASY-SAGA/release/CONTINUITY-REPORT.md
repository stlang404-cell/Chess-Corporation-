# CONTINUITY REPORT — *The Forger of Verity*

## Records maintained
| Record | Purpose |
|---|---|
| `continuity/CANON-LOCK.md` | Objective canon: fixed facts, dates, measures and physical details, plus additions accepted during drafting |
| `continuity/REVELATION-LEDGER.md` | Objective truth of the Book One mystery and the series, the suspects and misdirection, and the reveal schedule |
| `continuity/CHARACTER-KNOWLEDGE.md` | Who knows or believes what, by chapter, including false beliefs and the reader's knowledge |
| `continuity/CHRONOLOGY.md` | Deep history and a chapter-by-chapter Book One timeline |
| `planning/MYSTERY-CLUE-MAP.md` | 21 clues, each with the chapter where it's planted, its misdirection and its payoff |
| `manuscript/notes/*.md` | Each drafter's per-chapter end states and inventions |
| `editorial/LEAD-EDITOR-ISSUES.md` | Cross-range issues and their resolutions |

## Cross-range contradictions found and resolved (summary)
1. **Witness-marks** (Ch 6, 15, 16, 24, 25): the two editors had changed them in opposite directions. Unified. Hen has a gull's wing over a line; Teo a looped T like a pothook; Cass a zigzag; Kasimir an R with a level line through it; Quince a crooked Q with its tail hooked through its own ring. A grep finds no stale variants.
2. **The money trail** (Ch 1–3, 9, 14): 44 marks 6, less 38 for the coach, leaves 6 marks 6. Hesta secretly returns it, and after the 2-mark room 4 marks 6 remain. "Sixteen short" was corrected to "not quite sixteen."
3. **Forgery counts** (Ch 5, 6, 17, 29, 31): 34 in nine years, being three made under Quince's mark while he lived and 31 under the wren's foot (the Court found 29).
4. **Morning Survey geometry and paperwork** (Ch 6, 9, 15, 30, 32): the Wren Stair has 41 steps and the Long Gallery is about 1 ch 60 l (open range 1 ch 56 l to 1 ch 65 l); four sheets, each taking two to four marks.
5. **The Ch 29/30 timeline:** the Wing sheet is unsigned until the Equinox, and Ilse attests alone.
6. **Kasimir's letter:** it goes to the parish of Wick, not Hobbet. *Saffery v. the Parish of Wick* (1193) is the Marrows' lost appeal.
7. **The Ch 26 / Ch 25 details:** where Kasimir told Ilse about his father (Brask's shed), the void types (a ditch at Marlow, a gatepost at Fennock), and the source of the warrants (the bursar's daybook and posting-house ledgers).
8. **Clue leaks removed:** Hallam's bare hands (Ch 8), "quicksilver" in Ch 15 ahead of Ch 17, and Brask vouching for the frostbite story (Ch 14).
9. **Smaller fixes:** Brask's Walk count (nineteenth), Kasimir's hair (dark-blond), the Provost's lodging (west end), the Stacks' closure (99 years), and Hallam's Register tenure (from 1189).

## Clue-map compliance
All four editors checked their ranges against `planning/MYSTERY-CLUE-MAP.md`. Every clue is planted, none appears earlier than scheduled, and every Book One clue pays off by Ch 32. Series-level clues (rent, the "term," Sorry's undescribed shapes, Wenna Rook, the Lost Wing) are deliberately left open for Books 2–7.

## Unresolved by design (series threads)
- Why the Zero Sheets are failing (the lease). The Book Three reveal.
- Sorry's nature (a juvenile Vey). Book Three.
- Wenna Rook, the third Sallow survivor. Book Two.
- Yara Penhallow's fate. Book Two.
- Two unreleased forgeries (a ditch at Fennock and a field gate on the Marlow road), for Ilse to release in Book Two.
- Kasimir's greyed knuckles. They fade by Highsun, and his fear of stilling remains.

## Automated checks used
- Heading format and chapter order (`production/build.py` refuses to build on a mismatch).
- Straight-quote detection, the banned-phrase list, and cross-chapter repeated n-grams.
- Cross-format text verification (`production/verify.py`): every chapter's opening and closing eight words are found, in order, in each release format.

These checks find mechanical inconsistencies. They can't prove literary quality.
