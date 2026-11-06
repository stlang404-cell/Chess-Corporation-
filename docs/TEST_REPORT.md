# Test Report — SEVEN v0.3

## v0.3 results (this release)

- `npm test`: **12 files, 226 tests, all passing**. New in v0.3:
  - `paycheck.test.ts` (11): pay-3 lines, caps and decay, contracts, no double pay.
  - `collections.test.ts` (5): earned-only items can't be bought, collection rewards are granted once, distinction thresholds.
- Browser e2e, local release build (`tests/e2e/run-all.sh`): smoke, resume, **animation**, **review**, offline + responsive, and the `file://` build all pass.
- Browser e2e, **live site**: smoke, offline + 28 responsive checks, review (pay-3 paycheck, review strip, Full review, Retry) and animation all pass.
- `tests/e2e/animation.mjs` (new) checks that the drawn board equals the authoritative position:
  - after tap moves where the AI reply lands mid-animation;
  - after 30 rapid taps;
  - after a slow drag (no snap-back);
  - after a flip (no animation);
  - after a reload/resume (same position, no mount animation);
  - under reduced motion (instant moves).

  It found two real defects: slow drags were ignored, and reduce-motion was not honoured. Both are fixed.
- Visual run: 112 screenshots, no horizontal overflow, no touch target under 32 px, no page errors. Key v0.3 screens are in `docs/screenshots/v03-*.png`.
- Engine:
  - A/B at 30k nodes, 204 games each: IIR −12 [−50, +26], "improving" +10 [−30, +51]. Both rejected.
  - Equal time vs v0.1 (100 ms/move, 200 games): **+47 [+6, +89]**.

The v0.2 report follows unchanged.

# Test Report — SEVEN v0.2

Actual results from this release's test runs. Nothing here is projected; failures and limits are listed explicitly.

## 1. Automated unit / integration tests (vitest)

`npm test` → **10 files, 210 tests, all passing** (≈ 60 s on the build machine under load).

| File | Tests | Covers |
|---|---|---|
| `engine.test.ts` | 19 | perft vs an **independent reference move generator** (all 5 candidate rulesets at depth 4; 150 random positions at depth 3 incl. castling/en passant/promotion); make/unmake + Zobrist integrity along random games; FEN round-trip; checkmate, stalemate, threefold repetition, 80-ply rule, insufficient material, promotion SAN, castling (incl. through check); SAN/UCI round-trips |
| `ai.test.ts` | 13 | mate in 1 / forced mate, material wins, determinism, search leaves position unchanged, colour symmetry; every tier/style returns legal moves; strong tier beats weakest; styles change real move choices; calibration monotone; analysis output; **move-quality labels** (best/excellent/good/inaccuracy/mistake/blunder; great; brilliant only for a genuine sacrifice in an unclear position) |
| `untimed.test.ts` | 11 | untimed default; **no timeout at any elapsed time** (up to `MAX_SAFE_INTEGER` ms); timed games still flag; AI think cap independent of the player clock; untimed game save → reload → resume; untimed settlement for checkmate/resignation/repetition/stalemate; **v0.1 save migration using a fixture produced by the real v0.1 code** (rating, history, dollars, purchases, achievements, timed game in progress preserved; idempotent) |
| `career-v2.test.ts` | 37 | ≥ 300 titles / ≥ 1,000 grades / ≥ 60 arenas; title uniqueness; **semantic validation of every authored title** (seniority vocabulary only at its level, family keyword present, no governance/honorary words in job titles, no inflation words); seniority strictly increasing along every family's path; institutions growing in scale; **100,000 sampled procedural ranks** (grammar, banned words, no repeated words); 28,800 consecutive institutions unique; 60,000 consecutive rank lines unique; boundary at `Number.MAX_SAFE_INTEGER`, NaN/overflow clamping; arenas contiguous with closed-form first ranks (checked at arena 10⁹); stable-name snapshots; v0.1 rank migration monotone |
| `career.test.ts` | 29 | rank/arena generation, Glicko-2 behaviour and convergence, payouts (win > draw > loss, short games unpaid, weak-opponent farming, rematch decay, upset, performance bonus thresholds, losing on purpose never profitable), **duplicate settlement prevention**, early promotion pace, rating gates, promotion series pass/fail, no demotion across titles, casual games change nothing, Arena Cup tokens/rounds/prize, migration defaults, matchmaking distribution and calibrated ratings, identity stability |
| `storage.test.ts` | 5 | IndexedDB round-trip; **recovery from a corrupted main slot via the backup slot**; exactly-once settlement across reload; export/import with garbage rejection; **localStorage fallback with IndexedDB unavailable** |
| `store.test.ts` | 4 | purchases deduct/record/equip, refuse duplicates/debt/locked items, never touch rating or career; arena boards unlock on reaching the arena; catalogue is cosmetic-only; **backup import validation** (damaged checksum, foreign file, invalid JSON, newer schema refused) |
| `longrun.test.ts` | 2 | **5,000 settled matches**: save stays bounded (history ≤ 200, settled ids ≤ 1,000, opponents ≤ 1,500, rating history ≤ 500, < 1.5 MB), consistent and fast; a career at the maximum rank settles without overflow or NaN |
| `guide.test.ts` | 86 | every diagram/exercise FEN legal; highlight/arrow squares valid; every exercise solution and annotated game legal SAN; exercise ids unique; each exercise's first move equals the engine's choice (or forces mate) |
| `puzzles.test.ts` | 4 | ≥ 100 unique puzzles with themes and ratings; every position legal and every accepted move/reply legal; mate puzzles end in checkmate along the line; the engine independently confirms ≥ 90% of a sample at half the generation budget |

## 2. Browser end-to-end tests (Playwright + Chromium)

| Script | Result | What it proves |
|---|---|---|
| `tests/e2e/smoke.mjs` (local build **and live site**) | **pass** | onboarding → MATCH → untimed rated game to completion with random legal moves → settlement → results sheet with payout breakdown → NEXT MATCH reaches the next opponent; no clock rendered; no page errors |
| `tests/e2e/resume.mjs` | **pass** | 4-second "think" in an untimed rated game, page reload → same moves, still the player's turn, no clock |
| `tests/e2e/offline-responsive.mjs` (local **and live site**) | **pass** | after one online visit: offline reload works, a rated game starts, **the engine replies offline**, the game survives another offline reload; 28 layout checks (7 widths × 4 tabs) with no horizontal overflow and the board ≥ 260 px and on-screen |
| `tests/e2e/visual.mjs` | **pass** | 112 screenshots (7 widths: 320/375/390/430/768/1024/1440 × light/dark × 8 screens); no overflow, no page errors, no interactive control smaller than 32 px |
| `tests/e2e/ceremony.mjs` | **pass** | minor and major promotion ceremonies (light + dark) and results sheets render from fixture saves one win from promotion |
| `tests/e2e/file-protocol.mjs` | **pass** | Windows single-file build (`release/windows/SEVEN.html`) runs from `file://`: onboarding, match, move, engine reply |

One intermittent failure was seen: under heavy CPU load (four calibration processes), a click raced the onboarding sheet's entrance animation; it passed on rerun and in all later runs.

## 3. Engine measurements

See `docs/AI_ENGINE.md` and `research/engine-bench.md`:
- v0.2 vs v0.1, equal nodes: **+119 Elo [+61, +185]** at 30k nodes (100 games); **+159 [+84, +252]** at 100k nodes (56 games).
- Component A/B tests: search I +74 [+33, +118]; evaluation +7 [−34, +48] (neutral); search II +69 [+28, +112].
- Benchmarks: guide tactics at 5k nodes 92% (v0.1 84%); all 9 mate puzzles at 2k nodes (v0.1 8/9); light-bishop K+B+N vs K scored 55 cp (v0.1: 738 — a false win); deterministic.
- v0.2 searches ~35% fewer nodes per second than v0.1 (SEE and extra ordering work), so at equal *time* its advantage is smaller than at equal nodes. Bot strength is node-based, so calibrated ratings are unaffected.

## 4. Production builds and deployment

| Item | Result |
|---|---|
| `tsc --noEmit` | clean |
| `npm run build` (PWA) | pass; service-worker precache list generated |
| `npm run build:single` (Windows) | pass; `release/windows/SEVEN.html` ≈ 617 kB |
| GitHub Pages | **published**: https://stlang404-cell.github.io/Chess-Corporation-/ (HTTP 200 for page, `sw.js`, manifest; live smoke and offline tests pass) |

## 5. Not tested / limitations

- **Real iPhone hardware was not available.** Mobile layouts were tested in Chromium at iPhone sizes (320–430 px); Safari-specific behaviour (Add to Home Screen, storage eviction, standalone display) is configured per Apple's PWA requirements but not verified on a device.
- Windows was tested via the single-file build in Chromium on Linux, not on Windows itself; the `.bat` launcher was not executed.
- Service-worker *update* flow (banner → reload) is implemented and exercised by code review and the first-install path; a two-version update was not run end-to-end.
- Long-horizon pacing comes from simulation (`research/career-sim.md`), not real players.
