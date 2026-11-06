# AI Engine Report

## Architecture

All code is TypeScript in `src/engine/`, runs locally (Web Worker in the browser, Node for research) and uses no network or paid service.

**Board (`board.ts`).** 9×11 mailbox (one sentinel column each side, two sentinel rows top and bottom so knight jumps never wrap). Pieces are 4-bit codes; moves are packed 20-bit integers (from, to, promotion, flag). Incremental make/unmake with an undo stack, 2×32-bit Zobrist hashing (piece-square, side, castling, en-passant — the ep square is only hashed when a capture is actually possible, keeping repetition detection exact), legality by make-and-test.

**Correctness.** Perft from the start position: 16 / 249 / 4,506 / 79,417 / 1,606,599 / 31,757,845. The move generator is checked against an **independent reference generator** (`tests/refgen.ts`: 2-D arrays, string parsing, king-capture legality, no shared code) at perft 4 for all five candidate rulesets and perft 3 over 150 random positions with castling, en passant and promotions; plus incremental-hash vs recomputed-hash checks along random games.

**Search (`search.ts`).** Negamax alpha-beta with principal-variation search; iterative deepening with aspiration windows (±40 cp, widening); transposition table (2^18–2^20 entries, depth-preferred with exact-score override, mate scores ply-adjusted); null-move pruning (R = 2 + depth/4, disabled with only pawns); reverse futility pruning (depth ≤ 3) and frontier futility pruning of quiet moves; late-move reductions (1–3 plies, re-search on fail-high); check extension; mate-distance pruning; quiescence search over captures and queen promotions with delta pruning, a cheap "don't capture a defended pawn with a big piece" filter and check evasions in the first 4 quiescence plies. Move ordering: TT move, MVV-LVA captures, queen promotions, two killers per ply, history heuristic. Draws (repetition, 80-ply rule, dead material) are scored in-search with optional contempt.

**Budgeting.** Bots are limited by **nodes**, not time, so a bot's strength — and therefore its calibrated rating — is the same on any device. The search only starts an iteration that is predicted to fit the node budget (iteration cost ≈ 2.5× the previous), after a calibration run showed partial iterations were wasted. In live games a wall-clock cap derived from the bot's own clock (≈ remaining/25 + 0.7·increment) prevents slow devices from flagging.

**Evaluation (`eval.ts`).** Tapered middlegame/endgame score: material (P 88/115, N 315/290, B 320/320, R 470/520, Q 900/940), geometry-generated piece-square tables for the 7×7 board, mobility, bishop pair (+25/+40), rook on open/semi-open file, pawn structure (doubled, isolated, passed pawns with rank-scaled bonuses and king-proximity in endgames), king shelter and open files near the king, a quadratic king-attack term from pieces bearing on the king zone, endgame mop-up, drawish-material scaling, tempo. Values are hand-set (tuning is on the roadmap).

## Strength tiers (`ai.ts`)

| Tier | Node budget | Eval noise (cp) | Soft-max temperature (cp) | Candidate margin (cp) |
|---|---|---|---|---|
| 0 | 60 | 220 | 120 | 500 |
| 1 | 150 | 160 | 90 | 350 |
| 2 | 400 | 120 | 70 | 260 |
| 3 | 1,000 | 90 | 55 | 200 |
| 4 | 2,500 | 65 | 40 | 150 |
| 5 | 6,000 | 45 | 28 | 110 |
| 6 | 14,000 | 30 | 18 | 75 |
| 7 | 32,000 | 18 | 10 | 45 |
| 8 | 70,000 | 8 | 5 | 25 |
| 9 | 150,000 | 0 | 3 | 10 |
| 10 | 300,000 | 0 | 2 | 8 |
| 11 | 600,000 | 0 | 0 | 0 |
| 12 | 1,200,000 | 0 | 0 | 0 |

Weaker tiers are weaker because they search less **and** because they choose among near-best root moves with a soft-max (scored inside a window around the best move), with deterministic, hash-seeded evaluation noise that is stable within a game (so a bot is consistently "wrong" about a position rather than randomly flickering). A forced mate is never thrown away, and moves walking into a forced mate are excluded when an alternative exists. All tiers vary their first three moves within 15 cp so games differ.

## Playing styles

Styles change what the engine *values* (evaluation weights) and, where root scores are available, add a preference for forcing moves:

| Style | Distinguishing weights |
|---|---|
| Balanced | neutral |
| Attacker | king attack ×2.2, mobility ×1.3, own shelter ×0.6, +30 cp for captures/checks, contempt +25 |
| Strategist | pawn structure ×1.8, centre ×1.4, passed pawns ×1.3, avoids forcing lines (−10 cp) |
| Defender | own king shelter ×2.0, king attack ×0.6, contempt −30 (content to draw) |
| Tactician | mobility ×1.5, king attack ×1.4, +45 cp for captures/checks |
| Endgame specialist | endgame technique ×1.8, passed pawns ×1.6, prefers simplification |
| Wildcard | ×2.2 choice temperature and ×1.3 noise — unpredictable but legal |

`tests/ai.test.ts` verifies that attacker, defender and wildcard choose different moves from balanced in multiple test positions. Each style's strength offset relative to balanced is **measured** (below) and added to its rating, so an opponent's displayed rating already accounts for its style.

## Calibration

See `research/calibration-report.md` (generated by `npm run fit` from `research/calib/*.jsonl`).

Method: colour-reversed game pairs between tiers *t* and *t+1* and *t* and *t+2* (15 pairs per matchup for tiers 0–8, 8 pairs above), plus each style against balanced at tiers 3 and 7 (10 pairs). Ratings are fitted by maximum likelihood (Bradley–Terry with draws as half points), with a weak prior on adjacent-tier gaps so that 100% scores do not diverge; the scale is anchored at tier 0 = 400. RD shown to the rating system = the fit's standard error clamped to 40–150.

CALIBRATION_RESULTS_PLACEHOLDER

## Performance

Measured on the build machine (single core, Node 22): ≈ 650 k nodes/s in middlegames, depth 11–13 from the start position in 3 s. Browser performance in a Web Worker is similar on desktop; phones are typically 2–4× slower, which only affects tiers whose node budget exceeds their clock-derived time cap (tiers 11–12 in fast games).

## Known limitations

- No independent strength reference exists for a new variant: the scale is internal. **No claim of master or superhuman strength is made.** Against humans, the strongest tier is expected to be challenging for experienced chess players, but this is unmeasured.
- Calibration samples are modest (tens of games per pairing); uncertainties are reported, and the largest are at the top tiers.
- Style offsets were measured at two tiers and assumed constant across tiers.
- Hand-set evaluation; no SEE; no opening book; no endgame tablebases.
