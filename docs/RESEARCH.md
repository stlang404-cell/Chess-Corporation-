# Research notes

This document records what was **measured**, what was **assumed**, and what remains **open**. Raw data lives in `research/`; every number below can be regenerated with the scripts named next to it.

## 1. Which 7×7 setup? (ruleset study)

**Method.** Five candidate rulesets (`CANDIDATES` in `src/engine/rules.ts`) were each played 120 times by the engine against itself (`scripts/selfplay-rules.ts`, 12,000 nodes per move, 4 chunks × 30 games with different seeds). To avoid 120 identical games, each side's first two moves were chosen at random among moves within 40 cp of the best. Games were capped at 300 plies. Raw output: `research/rules-selfplay.jsonl`.

All candidates keep 7 pawns and a 7-piece back rank; they differ in which orthodox piece is dropped and in pawn/castling rules.

| Candidate | Back rank | Double step | Castling | White score (95% CI) | Draws | Avg. plies | Mates |
|---|---|---|---|---|---|---|---|
| C1 | R N B Q K N R (2N, 1B) | no | yes | 45.8% ± 8.9 | 23% | 118 | 92 |
| C2 | R N B Q K B R (1N, 2B) | no | yes | 52.1% ± 8.9 | 33% | 116 | 81 |
| C3 | R N B K B N R (no queen) | no | yes | 61.3% ± 8.7 | 31% | 120 | 83 |
| **C4** | **R N B Q K B R** | **yes** | **yes** | **53.7% ± 8.9** | **21%** | **102** | **95** |
| C5 | R N B Q K B R | no | **no** | 52.9% ± 8.9 | 38% | 116 | 75 |

**Decision: C4 became SEVEN-1.0.**

- *Balance:* C4's White score (53.7%) is in the same range as orthodox chess between engines (~53–56%). C2 and C5 were equally balanced within the confidence interval; C1's apparent Black edge and C3's large White edge are the only results that stand out from 50% by more than one interval half-width.
- *Decisiveness:* C4 had the lowest draw rate (21%) and the most checkmates — a competitive rating ladder benefits from decisive games.
- *Tempo:* the double step shortens games by ~14 plies and raises opening branching (perft(1) = 16 vs 9), giving more opening diversity on a board with only three empty ranks.
- *Castling matters:* removing castling from the same setup (C5 vs C2) raised draws from 33% to 38% — the 7×7 king otherwise stays exposed in the centre and both sides play safe.
- *Material:* dropping the queen (C3) made the game slower and more drawish; dropping a bishop (C1) left both sides with a same-coloured lone bishop.

**Limitations.** 120 games per candidate gives ±9 points of uncertainty on the White score; the CIs overlap for C2/C4/C5, so the choice among them rests on draw rate, game length and design judgement as much as on balance. Self-play at 12k nodes approximates club-level play; strong-play balance could differ. These are *hypotheses* to re-test with stronger engines and human data (see Roadmap).

## 2. How does removing a file change chess?

Established by geometry (and reflected in the engine's evaluation):

- The centre is a single square (d4) plus a ring; central control is decided earlier and pawn tension appears from move 1 (a double-stepped pawn on rank 4 is adjacent to the enemy's pawn-attack zone).
- With only one knight, the bishop pair is the default state; trading a bishop concedes a colour complex for the rest of the game.
- Queens face each other on the d-file at move 0, so d-file openings carry immediate queen-trade decisions.
- Short castling moves the king two files to g1, onto the edge; there is no "h-file" buffer, so the f- and g-pawns are the entire shelter.

Variant-specific strategy is developed in the Academy guide (`docs/guide/`), which labels each claim as *Established* or *Hypothesis*.

## 3. What AI architecture gives strong play on ordinary hardware?

Measured: the TypeScript engine runs ≈ 600–700 k nodes/s on one core of the build machine (Node 22, x86-64) and reaches depth ~11–13 from the opening in 3 s. Small boards suit classic alpha-beta: the branching factor is ~16 in the opening and the mailbox move generator is cheap. Full details and calibration results: `docs/AI_ENGINE.md`.

## 4. How should opponent ratings be calibrated?

Measured with engine tournaments between tiers (and between styles), fitted by maximum likelihood. See `docs/AI_ENGINE.md` and `research/calibration-report.md`.

An important finding during calibration: an early version of the node-budgeted search **wasted partial iterations**, so tiers 9–11 were not ordered by strength (tier 9 scored 72% against tier 10 in a 16-game sample). The search now only starts an iteration that is predicted to finish, and the top tiers vary their early moves slightly so calibration games are not near-duplicates. The first, flawed data set is kept in `research/calib-v0/` for transparency and is not used.

## 5–7. Promotion pacing, meaningful infinite ranks, exploit-resistant pay

Measured with `scripts/career-sim.ts`, which drives the real matchmaking, rating, career and economy code with sampled game results. Findings and the changes they triggered (e.g. the fast-track merit multiplier, the unlimited headquarters money sink) are in `docs/CAREER_ECONOMY.md`, with the table in `research/career-sim.md`.

## 8. Do procedural personalities stay diverse?

Measured: at tier 7, the attacker, defender and wildcard styles choose a different move from the balanced style in at least 2 of 12 random middlegame positions (`tests/ai.test.ts`), and style strength offsets are measured in the calibration tournament. Diversity of *identity* (names, crests) is checked in `tests/career.test.ts` (more than 1,200 distinct names in 2,000 opponents).

## 9–10. Immediate matchmaking; replayability without bloat

Design decisions, not measurements: matchmaking is instantaneous (opponents are generated locally); the 0.9–1.4 s search animation and ~2 s opponent card are theatre, kept short. Replayability comes from four loops — rating, title, dollars/cosmetics and Academy mastery — plus Arena Cups and rivals, instead of more screens. Measuring player enjoyment needs real players (see Roadmap).
