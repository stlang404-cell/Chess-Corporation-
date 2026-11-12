# Research Notes — Craft, Conventions, Production

Purpose: record what was learned, from where, and how it changes the project. Researched principles are marked **[R]**; my own artistic choices drawn from them are marked **[A]**.

Research was kept focused and short on purpose. Most craft principles below are long established in published craft writing. Web sources consulted this session are listed at the end.

---

## 1. Magical-academy and dark-academia fiction

**[R] What the genre runs on.** Criticism of the recent academic-fantasy boom (Post45's dark academia cluster; Nguyen, *Nostalgia in Dark Academia*, 2022; Book Riot's survey of dark academia tropes) names the same core things: a *longing to be transformed* by study; a closed community; knowledge as obsession; murder or death; class division the hero has to cross; an institution that seduces and corrupts. *The Secret History* is the usual origin point named for the adult strand.

**[R] The most cited weakness.** Reactor's essay "Beyond Dark Academia" argues that magic-school stories drift toward *external monsters* and skip the reasons the school itself is frightening. Its summary: "the murderer isn't just calling from inside the house — it is the house." The institution is the horror.

**[R] Overused shapes to avoid:** the sorting ceremony; houses and points; an orphan with a secret destiny; a dark lord's return; a teenage cohort; a headmaster who is a guardian figure; Eurocentric pastoral nostalgia as the default backdrop.

**[R] Recent overlap risks found while checking originality:**
- Lorraine Wilson, *The Salt Oracle* (2025): a floating college; a researcher's mentor dies; she investigates a possible murder; the choice is between saving one being and saving the college.
- Natasha Pulley, *The Salt King* (2026): a priest is healed and then turned to salt; a Dead Sea dig.
Neither shares our mechanism, world or cast. But the *structure* "mentor dies → protagonist investigates → save the one or save the college" and the image "a person turned to salt" are close enough that we must design away from them (see ORIGINALITY_AUDIT.md).

**[A] How this shapes us:**
- The academy *is* the source of the danger. It works as regulator, monopoly and economic engine. Its founding act is the saga's buried crime. That makes "it is the house" structural, not decorative.
- The students are adults with debts, children, jobs and pasts. The protagonist is 33.
- There are no houses and no sorting. Students attach to a *Bench*, a working research group under one Reader, and status is earned at the Assay, a public exam.
- The class crossing is concrete. Hester comes from the brine-boiling district and works for the customs house. She enters through a sponsor's privilege, not through a bloodline.

## 2. Magic-system design

**[R] Sanderson's Second Law** (brandonsanderson.com; Coppermind summary): limitations, costs and weaknesses are more interesting than powers. Depth beats breadth: a few powers, considered fully.
**[R] Sanderson's First Law:** an author's ability to solve conflict with magic is directly proportional to how well the reader understands that magic.

**[A] Application:** the system has three operations (Keep, Read, Return) and one universal cost (arrears, plus the worker's own lent stillness). Every climax solution must use a principle the reader has already seen. The Book One climax depends on "venting," a technique built only from principles taught in Chapters 6–14.

## 3. Mystery construction

**[R] Fair play** (Knox's Decalogue, 1929; Van Dine's Twenty Rules; CrimeReads's "A Magician's Contract"): the reader gets the same clues as the detective; no supernatural solution the reader could not anticipate; no clue hoarding. A modern test: careful readers *could* solve it even if most do not.
**[R] The supernatural caveat** matters for fantasy. Magic is allowed only once its rules are on the page.

**[A] Application:**
- Every load-bearing clue in Book One appears at least once before the reveal, ideally twice, in different registers (one physical, one in dialogue).
- The culprit appears early, often, sympathetically, and has a visible motive that the reader misreads as virtue.
- Red herrings are innocent of the crime but guilty of something smaller, so suspecting them stays rational.
- Hester narrates in close third person. We never hide what she knows. Where she withholds a conclusion from herself, the narrative shows it as avoidance.

## 4. Character psychology and reader attachment

**[R] Long-established craft consensus:** readers attach to *competence plus vulnerability plus desire*. A character is defined by choices under pressure, and the gap between what a character wants and what they need drives the arc (the want/need distinction). Flaws should be rooted in virtues pushed too far.

**[A] Application:**
- Hester's *want* is to keep her brother alive, unchanged. Her *need* is to learn that keeping is not the same as loving.
- Her virtue is fidelity. Her flaw is the same fidelity turned into control.
- The theme lives at three scales at once: personal (her brother), institutional (the Halcyon), civilisational (the sea).

## 5. Pacing and long-form architecture

**[R] Structure:** a four-movement structure (setup / complication / reversal / resolution) is common in commercial fiction. A midpoint reversal, a dark moment around 75%, and a climax built from earlier setups are standard.
**[R] Series craft:** each book needs its own question answered. Saga questions advance but are not resolved. A cliffhanger does not replace resolution.

**[A] Application:**
- Book One's question, "Why are the keepings weeping, and who killed Corvin Aske?", is fully answered.
- The saga question, "What is the Hollow Sea?", is advanced by one undeniable fact: something in the salt is alive.

## 6. Prose and dialogue

**[R] Standard editorial guidance:** specific nouns over adjectives. Subtext in dialogue. Vary sentence length. Cut throat-clearing. Prefer action-beat attributions sparingly and "said" otherwise. Avoid repeated physical-tic emotion ("her heart hammered").

**[A] Banned-phrase list** for this project, covering generic generated-fiction tics. It is kept in STYLE_GUIDE.md.

## 7. Book production and EPUB accessibility

**[R] W3C EPUB Accessibility 1.1:**
- EPUB content should meet WCAG 2.x AA.
- Accessibility metadata (`schema:accessMode`, `accessibilityFeature`, `accessibilityHazard`, `accessibilitySummary`) is required for discoverability.
- Meaningful images need descriptive alt text. Decorative images take `alt=""`.
- Use a logical reading order, and set language metadata.

**[R] Navigation and validation (DAISY Knowledge Base; IDPF a11y guidelines):**
- The nav document must contain `epub:type="toc"`.
- `landmarks` are recommended.
- Use semantic `epub:type`.
- EPUBCheck validates spec conformance. Ace by DAISY checks accessibility but cannot judge whether alt text is good.

**[A] Application:**
- We build EPUB 3 by hand (XHTML + OPF + nav + NCX for older readers), with full a11y metadata.
- We validate with EPUBCheck 5.x (pip `epubcheck` bundles it).
- PDF: 6×9 in via WeasyPrint with EB Garamond, plus a mobile PDF.

---

## Sources consulted (this session)
- W3C, EPUB Accessibility 1.1 — https://www.w3.org/TR/epub-a11y
- IDPF EPUB 3 Accessibility Guidelines — https://idpf.github.io/a11y-guidelines/content/wcag-aria.html
- DAISY Knowledge Base — https://kb.daisy.org/publishing/docs/topics.html
- BookNet Canada, EPUB accessibility conformance overview — https://booknetcanada.ca/blog/2019/3/15/act-in-3-acts-an-overview-of-epub-accessibility-conformance-testing
- Sanderson's Laws of Magic (Coppermind) — https://coppermind.net/wiki/Sanderson%27s_Laws_of_Magic
- Brandon Sanderson, "Sanderson's Second Law" — https://brandonsanderson.com/sandersons-second-law/
- Post45, Dark Academia cluster introduction — https://post45.org/2022/03/introduction-3/
- Book Riot, Themes, Tropes, and Types of Dark Academia — https://bookriot.com/dark-academia-tropes-and-themes/
- Reactor, "Beyond Dark Academia: The Real Horror in Magic School Is Systemic Inequality" — https://reactormag.com/beyond-dark-academia-the-real-horror-in-magic-school-is-systemic-inequality/
- Nguyen, "Nostalgia in Dark Academia" (2022) — https://strathprints.strath.ac.uk/84509/1/Nguyen_EWCP_2022_Nostalgia_in_dark_academia.pdf
- CrimeReads, "A Magician's Contract Between Reader and Writer" — https://crimereads.com/a-magicians-contract-between-reader-and-writer-rules-for-delivering-a-whodunit/
- No Film School, Knox's Ten Commandments — https://nofilmschool.com/ronald-knox-detective-fiction-commandments
- Overlap checks: *The Salt Oracle* (Simon & Schuster UK listing) — https://www.simonandschuster.co.uk/books/The-Salt-Oracle/Lorraine-Wilson/9781837865741 ; *The Salt King* and other salt-titled fantasy (search summaries).

No source text was copied into the project. These sources informed principles only.
