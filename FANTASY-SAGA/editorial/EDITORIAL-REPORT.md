# EDITORIAL REPORT — *The Forger of Verity*

**Scope:** the complete Book One manuscript. 32 chapters, 123,227 words of chapter prose (wc -w, including chapter headings).

**What this report is and is not.** Every review below was done by AI editors (Claude agents briefed as editors) and by the lead editor (the coordinating Claude session). **No independent human editor or reader has reviewed this manuscript.** The "adversarial reviews" are simulated personas, as the brief requested, not real third-party feedback. Literary quality is a judgment, not a measurement, and no numerical quality scores are given.

## 1. Process

| Stage | Who | Output |
|---|---|---|
| Voice calibration | Lead editor wrote Ch 1 | `manuscript/chapters/ch01.md` |
| Drafting | 7 drafting agents in parallel, from a shared outline, canon lock, style guide and voice guide | `manuscript/chapters/`, `manuscript/notes/` (per-chapter summaries, end states, inventions, deviations) |
| Per-chapter quality review | Each drafter self-reviewed against the style guide and canon | Recorded in the notes files |
| Automated checks | Lead editor | Headings, chapter order, straight quotes, banned-phrase counts, cross-chapter repeated 4- and 5-grams, tic-word counts |
| Developmental, character, world and magic, mystery, line and copy edit | 4 editing agents, 8 chapters each, all reading every notes file plus the neighboring chapters | `editorial/REVIEW-ch01-ch08.md`, `-ch09-ch16`, `-ch17-ch24`, `-ch25-ch32` |
| Adversarial review (developmental editor, skeptical adult reader, continuity and mystery specialist) | The same 4 editors, each for their range | "Adversarial notes" sections of the four review files |
| Cross-range reconciliation | Lead editor | `editorial/LEAD-EDITOR-ISSUES.md` (19 items, all resolved or dispositioned) |
| Proof of formatted editions | Lead editor | Rendered page sheets of the PDF; EPUB nav and structure inspection; DOCX opened in LibreOffice |

## 2. Main developmental findings and actions

1. **The Ch 29/30 join** (found by the Ch 25–32 editor): the Drift Wing was attested open at 5:20 a.m., which would have prevented Hallam's folio taking at all. **Fixed.** The Wing sheet stays unsigned until the ceremony, and Ilse attests it alone at the Gate, knowingly breaking custom, which also strengthens her agency.
2. **"Why not sign the Wing early and skip the ceremony?"** (skeptical-reader persona). **Fixed** with a paragraph in Ch 30: the Conduit only leaves Hallam's study while he stands under the arch, and three hundred people must *see* the folio fail.
3. **A clue leak in Ch 8:** Hallam's gloves lay on the tablecloth, showing his bare grey hands in Gleaning, which would have spent the Ch 30 payoff early. **Fixed.**
4. **The red herring in Ch 23** pointed at Hallam too early (his signature on the paper order). **Fixed:** his approval now stands under every routine entry, and the suspicion is redirected to Steyne and Coyle.
5. **Hallam's guilt is guessable from Ch 19 for genre-savvy readers** (all four editors agree). **Disposition: accepted.** The book plays it as dramatic irony, and the warmth of the Ch 24 tea scene is what makes it pay off. Ch 3 now has Ilse briefly link the grey gloves to the Hobbet gossip and dismiss it, which is truer to her observant character than never noticing.
6. **The Moot's logic** (Ch 20): Ilse's win over a flawless "standing claim" is now grounded in three sentences on the Law of Fidelity (truth to the land, not to the last sheet).
7. **The open-charter deduction** (Ch 29) was strengthened: a ghost must register both under the drawing and with the fixed Zero lines, and an open charter's lines mark only where the ground cannot go.
8. **Repeated beats:** the "kindness was real" beat is now one explicit instance (Ch 25) plus earned echoes. A repeated "lightness of her own mark" beat was cut in Ch 7. Hen's flat food-joke pattern is noted; one instance remains in Ch 23, judged acceptable.
9. **Kasimir's grey knuckles** from his torn charters were left unresolved. **Fixed** in Ch 32 (they will fade by Highsun), which keeps a small thread about his fear of stilling.

## 3. Character edit
- Voices were checked against `characters/VOICE-GUIDE.md`: Brask's biting imperatives, Teo's apologetic run-ons (the "sorry" count was trimmed in Ch 3–4), Cass's Margin cadence, Kasimir's uncontracted formality, and Hallam's "my dear."
- Ilse's agency was reinforced at the climax (the custom-breaking attestation).
- **Known residual risk:** Kasimir may read as fair-minded too early (Part One). Noted, not changed.

## 4. Line edit and copyedit: measurable results (whole book, before → after)

| Phrase | Draft | Final |
|---|---|---|
| "something" | 174 | 116 |
| "exactly" | 61 | 20 |
| "slowly" | 58 | 20 |
| "the way a" (simile habit) | 60 | 38 |
| "for a long moment" | 15 | 7 |
| "half-moon spectacles" | 10 | 4 |
| Banned list (style guide) | "color" ×1, "Somewhere a root snapped" ×1 | 0 |
| Straight quotes | 0 | 0 |
| Rhetorical "Not X. Not Y." | 1 (Ch 32) | 0 (the remaining matches are ordinary dialogue) |

Other fixes: British spellings (colour, centre); unspaced em dashes throughout; one stray "God" changed to the in-world "Ninefold"; the currency made consistent (no shillings); and the arithmetic corrected (the Long Field shortfall, forgery counts, survey lengths, Hen's second count in the Ladder).

## 5. Proofreading
Proofing was done on the rendered PDF (page sheets of the front matter, maps, part pages, chapter openers, body pages and back matter) and on the extracted text of every format. See `VERIFICATION-REPORT.md` for the automated cross-format text check.

## 6. Known limitations (honest list)
- All editing is AI-performed. A human developmental editor and proofreader should review before any commercial release.
- At 123k words the manuscript is about 2.7% over the 120k upper target. This is judged acceptable, because cutting would mostly fall on set pieces.
- The interior and cover art is procedurally generated vector art, simple in style (see `artwork/STYLE-GUIDE.md`).
- The 6 × 9 PDF has not been checked against any specific printer's bleed, margin or color specification.
