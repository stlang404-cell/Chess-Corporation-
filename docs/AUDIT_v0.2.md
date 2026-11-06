# v0.2 Repository Audit (baseline before the Ascension Overhaul)

Baseline: commit after "Snapshot v0.1 engine". 149 vitest tests passing, production + single-file builds passing, browser e2e (smoke, resume, offline, 24 layout checks, file://) passing.

## Implemented and sound (preserve)
- **Rules engine** (`src/engine/board.ts`, `rules.ts`, `game.ts`): SEVEN-1.0, mailbox move generation, verified by an independent reference generator (perft) and hash tests. No correctness defects found. **Rules stay locked.**
- **Search** (`search.ts`): PVS/ID/TT/null-move/LMR/killers/history/quiescence. Works; lacks SEE, countermove ordering, pawn-aware endgame knowledge and an opening book.
- **Glicko-2** (`rating.ts`), **atomic settlement** (`settle.ts`, idempotent by match id), **IndexedDB storage** with checksum + backup slot (`storage.ts`).
- **Strategy guide**: 13 chapters, 29 diagrams, 49 engine-validated exercises (`docs/guide`, `tests/guide.test.ts`).
- **PWA + Windows single-file build**, service worker precache, Pages workflow file.

## Incomplete
- **Clocks are mandatory.** `ActiveMatch.clocks` is always set; `Play.tsx` forfeits on timeout; bot think time derives from its clock. → v0.2 makes **untimed the default** for every match type, with optional timed play.
- **Calibration** of the 25-tier ladder was interrupted (top tiers unmeasured; `calibration.ts` holds placeholders). → recalibrate after the engine upgrade.
- **Exercises** cannot enter underpromotions via a picker; no generated puzzle library; move classification is a 4-level tag.
- **Save import/export** is a textarea; no file export, no overwrite confirmation, no schema-version check on import, no update notification for new service-worker versions.
- **GitHub Pages is not enabled** for the repository (`has_pages: false`) and the workflow only runs on `main`.

## Requires redesign
- **Career hierarchy** (`career.ts`): 50 titles in one list mixes functions, governance and honours (e.g. *Chief of Staff → CSO → COO*, *CEO → Vice Chairman → Chairman*, *Board Trustee → Governor → Chancellor*). Procedural names (*Steward of Kyoto, Order of the Pine*) are not corporate offices. Roman numerals and a fixed binary-search ceiling (`firstRankOfArena`, 10,000,000) limit "infinite" progression. → rebuild as five dimensions: **seniority, job family, organisational scope, formal appointment, honours**, with job-family ladders, a general-management track, and an expanding universe of corporate institutions.
- **Arenas**: 18 authored. → ≥ 60 tied to career stages and institutions.
- **Visual design**: functional but plain; one theme; pieces adequate; results/promotion screens minimal. → full design-system rebuild with light/dark themes, new piece families, ceremonies, career directory.
- **Opponent identity** lacks corporate affiliation, arena and family-consistent titles.
- **Economy display**: no financial records page.

## Save compatibility contract
v0.1 saves (schema 1) must load in v0.2 with Elo, history, dollars, purchases, achievements, promotion progress and any game in progress intact. Earned v0.1 titles are kept **verbatim** in career history; the current position maps to the equivalent seniority in the new structure (documented in `docs/CAREER_ECONOMY.md`).
