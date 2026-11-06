# Engine benchmark suite (generated 2026-11-06)

Equal node budgets for both engines. Reproduce with `npx tsx scripts/bench-suite.ts`.

## 1. Tactics: guide exercises (first move found)

| Nodes | v0.1 | v0.2 |
|---|---|---|
| 5,000 | 41/49 (84%) | 45/49 (92%) |
| 20,000 | 43/49 (88%) | 44/49 (90%) |
| 100,000 | 49/49 (100%) | 49/49 (100%) |

## 2. Mate finding (9 mined mate puzzles)

| Nodes | v0.1 | v0.2 |
|---|---|---|
| 2,000 | 8/9 | 9/9 |
| 10,000 | 9/9 | 9/9 |
| 50,000 | 9/9 | 9/9 |

## 3. Draw recognition (eval, side to move, 100k nodes; closer to 0 is better)

| Position | v0.1 | v0.2 |
|---|---|---|
| K+B+N vs K, light-squared bishop (cannot force mate on 7×7) | 738 | 55 |
| K+B vs K+B, opposite colours | -4 | 0 |
| K+R vs K+B (no pawns) | 65 | 64 |
| K+N vs K | 0 | 0 |

Control: K+B+N vs K with the **dark**-squared bishop is a forced win; v0.2 evaluates it as 751 cp.

## 4. Search efficiency (1-second-equivalent node budget, 600k nodes)

| Position | Engine | Depth | Nodes/s |
|---|---|---|---|
| rnbqkbr/ppppppp/7/7/7/… | v0.1 | 10 | 700,491 |
| rnbqkbr/ppppppp/7/7/7/… | v0.2 | 12 | 451,233 |
| r1bqkbr/ppp1ppp/2n4/3p… | v0.1 | 11 | 641,486 |
| r1bqkbr/ppp1ppp/2n4/3p… | v0.2 | 10 | 427,558 |

## 5. Determinism

Two identical 200k-node searches from the start position: identical move and score (g2g4, 23 cp).
