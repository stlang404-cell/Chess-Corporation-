# SEVEN v0.2 — Release report and acceptance audit

**Version:** 0.2.0 (rules SEVEN-1.0 unchanged, save schema 2)
**Live:** https://stlang404-cell.github.io/Chess-Corporation-/
**Windows:** `release/windows/Launch SEVEN.bat` + `SEVEN.html`

Status key: **Verified** = demonstrated by an automated test, a measurement or a live check in this release · **Partially verified** = implemented and checked, but some part could not be tested here · **Not completed**.

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| Untimed ranked chess works correctly | Verified | `tests/untimed.test.ts` (no flag at any elapsed time; all endings settle); e2e smoke plays a full untimed rated game; no clock rendered |
| Player can leave and resume a match | Verified | `tests/e2e/resume.mjs` (think + reload → same position, still player's turn); untimed save/reload unit test |
| Chessboard visibly redesigned | Verified | new SVG piece families, board frame, capture ghosts, legal/last/check/selection states; `docs/screenshots/` |
| Home, Match, Career, Academy consistently styled | Verified | one design system (`src/ui/styles.css`), light + dark; 112-screenshot visual run |
| Works on phone and desktop | Partially verified | 7 widths (320–1440) in Chromium, no overflow, board ≥ 260 px; **no real iPhone was available** |
| ≥ 300 authored titles | Verified | 326 (`authoredTitleCount`, tested) |
| ≥ 1,000 authored career grades | Verified | 1,768 (tested) |
| ≥ 60 authored arenas | Verified | 64 (tested, unique names) |
| Procedural career progression unbounded | Verified | closed-form ranks to 2⁵³−1, 100,000-rank grammar test, boundary tests |
| AI opponents procedurally expandable | Verified | identities from 31-bit ids, lazy, persistent records bounded (≤ 1,500) |
| Stronger engine with measured benchmarks | Verified | +119 [+61, +185] @30k, +159 [+84, +252] @100k nodes vs v0.1; `research/engine-bench.md` |
| Elo changes calculated consistently | Verified | Glicko-2 tests; idempotent settlement; calibrated opponent ratings |
| Match earnings and bonuses settle correctly | Verified | economy + settlement tests; results sheet itemises every line |
| Promotion ceremonies and rewards function | Verified | `tests/e2e/ceremony.mjs` (minor + major, light + dark) |
| Tactics guide and training systems work | Verified | guide tests (86), puzzle tests, e2e Academy screenshots |
| Existing saves migrate safely | Verified | fixture produced by the real v0.1 code (`tests/fixtures/save-v0.1.json`) |
| Automated tests and production builds pass | Verified | 210/210 vitest; `tsc`, PWA and single-file builds pass |
| Website published and verified | Verified | GitHub Pages; HTTP 200; live smoke + offline tests pass |
| iPhone installable, offline | Partially verified | manifest, icons, standalone display, service worker, offline reload verified in Chromium; Safari *Add to Home Screen* not tested on a device |

## Final audit questions

1. **Do all authored titles make organisational sense?** Every title is validated by rule (seniority vocabulary at its level, function keyword present, no governance or honorary words in job titles) and was reviewed by hand family by family (`docs/CAREER_DIRECTORY.md`). The rules cannot prove taste; they do prevent the v0.1 class of errors.
2. **Are promotions logically ordered?** Yes: seniority strictly increases along every family's path (tested), then general management, then institutions of strictly increasing scale.
3. **Can procedural titles generate contradictions?** Only two offices (President, CEO) combine with institution names from fixed word lists (root, region, type); inflation words are impossible and tested over 100,000 ranks.
4. **Executive, board and honorary positions distinguished?** Yes: board seats and cups are honours (`save.honors`), never job titles.
5. **Coherent after thousands of promotions?** Yes: each promotion leads a larger institution with a higher enterprise-scale number; names stay grammatical up to the integer limit (sampled in the directory).
6. **Sustainable salaries and requirements?** Salary grows with √rank; merit needs grow with rank^0.8; an unlimited sink (headquarters) absorbs wealth; see `research/career-sim.md`.
7. **Engine measurably stronger?** Yes, at equal nodes (above). At equal *time* the gain is smaller: v0.2 searches ~35% fewer nodes per second.
8. **Elo honest?** Bots carry measured ratings from engine tournaments; matchmaking never alters results. The scale is internal (not FIDE).
9. **Untimed fully supported?** Yes, default for every match type.
10. **Substantially better looking?** See `docs/screenshots/`.
11. **iPhone interface works?** In emulated iPhone sizes, yes; not verified on hardware.
12. **Website published?** Yes, verified over HTTPS.
13. **Installed game runs offline?** Offline reload, engine replies and resume verified in Chromium against the live site.
14. **Existing saves survive?** Yes (fixture from v0.1 code).
15. **All tests and builds passing?** Yes.

## Known limitations

- No real-device iPhone or Windows testing in this environment.
- Top calibration tiers have the widest uncertainty (fewest games); see `research/calibration-report.md`.
- Evaluation additions measured neutral; tuning is the top engine item for v0.3.
- Puzzle library is ~125 puzzles (mining is slow); the guide adds 49 exercises.
