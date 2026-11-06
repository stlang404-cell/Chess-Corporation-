# SEVEN v0.3 — The Prestige Update: release report

**Version:** 0.3.0 (rules SEVEN-1.0 unchanged, save schema 3, review standard rev-3, pay formula pay-3)
**Live:** https://stlang404-cell.github.io/Chess-Corporation-/ (redeployed and re-verified for this release)
**Windows:** `release/windows/Launch SEVEN.bat` + `SEVEN.html`

Status key:
- **Verified**: shown by an automated test, a measurement or a live check in this release.
- **Partially verified**: implemented and checked, but some part could not be tested here.
- **Not completed**: not done in this release.

## 1. Audit: defects found during v0.3, and their fixes

| # | Defect | Severity | Fix | Evidence |
|---|---|---|---|---|
| 1 | The root score list could come back empty when the node cap stopped the scoring loop early. This crashed the post-game review, and the paycheck silently fell back to pay-2. | high | The best move is always the first entry | review e2e; paycheck shows `pay-3` |
| 2 | **Slow drags were ignored.** The 8 px drag threshold was measured from the *previous* pointer event, so a touch drag made of small steps never counted as a drag and the drop did nothing. | high | Threshold measured from the drag origin | `tests/e2e/animation.mjs` drags in ~3 px steps |
| 3 | The OS *reduce motion* setting did not affect move animation (only CSS effects). | medium | `animMsFor` returns 0 under `prefers-reduced-motion` | animation e2e, reduced-motion context |
| 4 | Board selection was cleared on every parent re-render, which broke Retry mode. | medium | Positions memoised by content, not array identity | review e2e (Retry) |
| 5 | Turning points missed thrown-away wins. | low | Use the mover's win-probability loss | unit tests |
| 6 | Contracts could ask for a rival win before any rival existed, or for a promotion-board win with no board ahead. | low | Such kinds are excluded until they are possible | visual check, Home |
| 7 | Calibration: tier 22 swept tiers 20–21 19–0, which made the raw fit jump +1,119 Elo. Tiers 19 and 24 also rated below weaker tiers. | medium | Disclosed corrections: steps capped at +350 (a perfect score is only a lower bound, ≈ +300 at 95%) and a monotone ladder. Raw values kept in the report. | `research/calibration-report.md` |
| 8 | A save write was still in flight when the onboarding sheet closed. A reload within milliseconds could reopen onboarding; this was seen only in the live offline test. | low | `html[data-saving]` marks writes in flight; tests wait for it. The write itself always completed. | live offline test passes |
| 9 | The review e2e failed whenever a random-move game ended before move 10. Such games are, by design, neither paid nor reviewed. | test | The test plays up to four games | live review test passes |

## 2. Acceptance by phase

| Phase | Item | Status | Evidence |
|---|---|---|---|
| 2 | Three new original piece sets (Imperial default, Modern, Executive); legacy sets re-rendered | Verified | `?gallery` page; store previews; screenshots |
| 3 | Moves glide (115/170/240 ms by setting), distance-scaled, never animate on mount, flip or resume | Verified | `tests/e2e/animation.mjs` (14 checks, local and live) |
| 3 | Animation never corrupts game state (drawn board == authoritative position after tap moves with AI replies mid-animation, 30 rapid taps, drag, flip, reload) | Verified | same test: every occupied square holds exactly one drawn piece |
| 3 | Effects for capture, check, mate, promotion, brilliant/great, victory, job promotion | Partially verified | rendered and screenshotted; effects are visual and not asserted frame by frame |
| 4 | Richer palette with meaning (jade = good/accuracy, vermilion = danger/mistakes, gold = money/honours, indigo = records/best) and arena accents | Verified | screenshots, light and dark, 7 widths |
| 5 | Engine review of every rated game (≥ 10 player moves): accuracy, evaluation bar and graph, labels, missed wins, best alternative, turning points, tap to inspect, Retry this move | Verified | `tests/e2e/review.mjs` (local and live); `docs/screenshots/v03-review.png`, `v03-retry.png` |
| 5 | Brilliant moves not manufactured: real sacrifice, undecided position, only good move, re-verified 4× deeper | Verified | `tests/ai.test.ts` labels; `analysis.ts` |
| 5 | No engine assistance in rated play | Verified | analysis starts only after the game is finished; Retry exists only in review |
| 6 | Versioned, review-driven, itemised paycheck, never paid twice | Verified | `tests/paycheck.test.ts` (11); duplicate-settlement tests; `research/pay-sim.md` (20,000 simulated games: pay-3 mean 9% below pay-2 and steeper with accuracy) |
| 7 | Performance contracts (8 kinds, rating-scaled, only for rated reviewed games of 15+ moves) | Verified | unit tests; Home card |
| 7 | Rivals (opponents met ≥ 3 times), records, rare honours | Verified | Home rival line; Career → Overview records/honours; `tests/collections.test.ts` |
| 7 | Promotion boards | Verified (from v0.2) | best-of-3/5 promotion series |
| 7 | Title audit | Verified (unchanged) | v0.2 semantic title tests still pass (326 titles) |
| 8 | Measured AI improvement in v0.3 | **Not completed** | IIR −12 [−50, +26]; "improving" +10 [−30, +51] (204 games each, 30k nodes); neither significant, so **both shipped off and v0.3 plays like v0.2** |
| 8 | Old-vs-new at equal time, with confidence intervals | Verified | **+47 Elo [+6, +89]** vs v0.1, 100 ms/move, 200 games |
| 9 | Store collection goals and rare earned cosmetics (cannot be bought) | Verified | `tests/collections.test.ts`; `v03-store-collections.png` |
| 10 | MATCH → PLAY → REVIEW → PAYCHECK → PROGRESS → NEXT loop | Verified | review e2e (play, review strip, itemised pay, Full review, Retry); smoke e2e reaches NEXT MATCH |
| 10 | Subtle sounds with separate move/effects volumes | Partially verified | synthesized in WebAudio with settings sliders; headless tests cannot listen |
| 11 | Windows build | Partially verified | `file://` single-file build plays with engine replies in Chromium on Linux; not run on a Windows machine |
| 11 | iPhone PWA | Partially verified | manifest, service worker, offline reload and emulated iPhone widths verified; **no physical iPhone available** |
| 11 | Published and verified | Verified | GitHub Pages serves the v0.3 build (asset hash matches the local build); live smoke, offline + 28 responsive checks, review and animation e2e all pass |
| 12 | Tests and screenshots | Verified | 226/226 vitest; all e2e scripts pass locally (`tests/e2e/run-all.sh`) and the four key ones live; 112-screenshot visual run with no overflow or small targets |

## 3. Honest limits

- **Engine strength did not improve in v0.3.** The equal-time result compares v0.2/v0.3 with v0.1. Both v0.3 candidates were measured and rejected.
- In one local run, the review e2e did not reach *Retry this move*: either the selected move had no Retry button or no target square was found. Retry passed in every other run, including the live one.
- The rating scale is internal (bot vs bot), not FIDE. The top three tiers rest on 19 decisive games and a capped step.
- Sound, haptics and the feel of animation on real phones were not verified on hardware.
