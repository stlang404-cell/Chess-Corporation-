# AI Engine Report (v0.2)

All code is TypeScript in `src/engine/`, runs locally in a Web Worker (browser) or Node (research), and uses no network or paid service. The v0.1 engine is frozen in `research/engine-v01/` so every improvement is measured against it.

## 1. What changed in v0.2 — and what each change measured

Every experiment is an equal-node-budget match (30,000 nodes per move for both sides), 102 openings played with both colours (204 games), openings from four random near-best plies with reproducible seeds, 95% confidence intervals from the per-game score variance (`scripts/engine-match.ts`, `scripts/ab-match.ts`, `scripts/match-stats.ts`; raw games in `research/engine/`).

| Step | Change | Result (Elo, 95% CI) | Kept? |
|---|---|---|---|
| A | **Search I**: static exchange evaluation (SEE) for capture ordering — losing captures after quiet moves — and SEE pruning of losing captures in quiescence; logarithmic late-move-reduction table with killer/history adjustments; history malus for quiet moves that failed to cut | **+74 [+33, +118]** vs v0.1 | yes |
| B | **Evaluation**: king attack weighted by number of attackers; knight outposts; rook behind passed pawn; rule of the square in pawn endings; opposite-bishop and K+B+N (light bishop) draw scaling | **+7 [−34, +48]** on vs off (same search) — no measurable effect | kept for endgame correctness, reported as neutral |
| C | **Search II**: late-move pruning at depth ≤ 3, transposition-table cut-offs in quiescence, countermove heuristic | **+69 [+28, +112]** on vs off | yes |
| — | **v0.2 total vs v0.1** (A + B + C) | **+119 [+61, +185]** (100 games, 30k nodes) | — |
| — | v0.2 vs v0.1 at 100k nodes | see `research/engine/final-100k-*.jsonl` (fewer games; wider interval) | — |

The +150 internal-Elo target is **inside the confidence interval but not demonstrated**; the measured point estimate is +119.

Also fixed in v0.2: a root-choice instability where re-searched alternative moves could outrank the main search's best move (weak tiers occasionally played arbitrary moves); node budgets now only start an iteration predicted to finish.

## 2. Architecture

**Board** (`board.ts`): 9×11 mailbox, packed moves, incremental make/unmake, 2×32-bit Zobrist hashing, `see()` with x-ray attacker discovery. Perft from the start: 16 / 249 / 4,506 / 79,417 / 1,606,599 / 31,757,845, cross-checked against an independent reference generator (`tests/refgen.ts`).

**Search** (`search.ts`): negamax PVS with iterative deepening and aspiration windows; transposition table (depth-preferred, ply-adjusted mates) used in the main search and quiescence; null-move pruning; reverse-futility and frontier futility pruning; late-move pruning; log-table LMR; check extension; mate-distance pruning; quiescence with SEE and delta pruning and check evasions; ordering = TT move → winning/equal captures (MVV-LVA, SEE ≥ 0) → queen promotions → killers → countermove → history (with malus) → losing captures. Repetition, 80-ply rule and dead material are scored in-search, with optional contempt.

**Evaluation** (`eval.ts`): tapered material + geometry-generated piece-square tables, mobility, bishop pair, rooks on open files, pawn structure, passed pawns (rank-scaled, king proximity, rook support, rule of the square), knight outposts, king shelter, attacker-count-weighted king attack, mop-up, and draw scaling. Feature switches (`EVAL_OPTS`, `SEARCH_OPTS`) exist only for A/B research; production uses all features on.

**Opening book** (`book.json`, `scripts/make-book.ts`): generated for the 7×7 variant by searching each position 1.2M nodes deep from the start position, breadth-first to 4 plies, keeping moves within 20 cp of the best. No 8×8 theory is imported. Used by tiers ≥ 12 for their first three moves (chosen by the game seed, so games still vary).

**Analysis** (`analysis.ts`): every position is searched once with root scores for all moves inside a ±600 cp window, so played, best and second-best moves are compared at the same depth. Labels by win-probability loss: best/excellent (< 2)/good (< 10)/inaccuracy (10–20)/mistake (20–30)/blunder (≥ 30); **great** = best and every alternative loses ≥ 15 W%; **brilliant** = great *and* a genuine sacrifice (SEE < 0) *and* not already winning (W% between 30 and 85). Depth < 7 is shown as low confidence.

## 3. Strength tiers and styles

25 tiers interpolate between 13 anchor parameter sets (node budget 60 → 1.2M, evaluation noise 220 → 0 cp, soft-max temperature 120 → 0 cp, candidate margin 500 → 0 cp). Bots are limited by **nodes**, not time, so their calibrated strength is the same on any device; a wall-clock cap (≈ 4 s, or 10 s with *Stronger analysis*) only protects slow phones. Top tiers make no artificial mistakes.

Nine-style personalities change what the engine values and, through root scoring, what it plays: Balanced, Attacker, Strategist, Defender, Tactician, Endgame specialist, Wildcard (see `ai.ts`). Each style's strength offset is measured (not assumed) and added to its displayed rating.

**Maximum-strength challenge** (Academy → Practice, unrated): top tier, 8M-node budget, up to 15 s per move, with an explicit warning.

## 4. Calibration

Tier and style ratings are measured by colour-reversed engine tournaments and fitted by maximum likelihood (Bradley–Terry, draws = ½, weak prior on adjacent gaps), anchored at tier 0 = 400: `research/calibration-report.md`, generated by `npm run fit`; values in `src/engine/calibration.ts`. Career rating gates are derived from these measured ratings.

The scale is **internal** (bot-vs-bot). Engine-only scales tend to stretch the gaps between weak, noisy players; human ratings will settle on this scale through play, but it is **not** a FIDE rating, and no claim of master or superhuman strength is made.

## 5. Benchmark suite

`npx tsx scripts/bench-suite.ts` → `research/engine-bench.md`: tactics (the 49 engine-validated guide exercises) at 5k/20k/100k nodes, mate finding on mined mate puzzles, draw recognition (K+B+N with the light bishop, opposite bishops, R vs B, N vs K), search speed and determinism, for v0.1 and v0.2.

## 6. Performance and resources

One worker per role (opponent, analysis) so the UI never blocks; workers are terminated and recreated to cancel work (undo, leaving a game). Transposition tables are 2^19 entries (~6 MB) per worker. Node 22 on the build machine reaches ≈ 600–700 k nodes/s; phones are typically 2–4× slower, which affects only tiers whose node budget exceeds the wall-clock cap.

## 7. Known limitations

- Hand-set evaluation weights (an automated tuning pass is on the roadmap); evaluation additions measured neutral.
- No endgame tablebases (the guide's retrograde analysis of K+Q/K+R/K+B+B/K+B+N on 7×7 is used for teaching, not in search).
- Calibration samples are tens of games per pairing; the top tiers have the widest intervals.
- Style offsets measured at two tiers and assumed constant across tiers.
