# Bot calibration report (generated 2026-11-06)

Games: 865 (588 tier-vs-tier, 277 style-vs-balanced).

## Fitted tier ratings (anchor: tier 0 = 400)

| Tier | Raw fit | Applied | ± (1 s.e.) |
|---|---|---|---|
| 0 | 400 | 400 | anchor |
| 1 | 500 | 500 | 60 |
| 2 | 682 | 682 | 47 |
| 3 | 778 | 778 | 61 |
| 4 | 1004 | 1004 | 49 |
| 5 | 1203 | 1203 | 60 |
| 6 | 1262 | 1262 | 47 |
| 7 | 1464 | 1464 | 61 |
| 8 | 1581 | 1581 | 47 |
| 9 | 1654 | 1654 | 64 |
| 10 | 1958 | 1958 | 51 |
| 11 | 2078 | 2078 | 60 |
| 12 | 2239 | 2239 | 48 |
| 13 | 2402 | 2402 | 62 |
| 14 | 2587 | 2587 | 48 |
| 15 | 2731 | 2731 | 71 |
| 16 | 2861 | 2861 | 58 |
| 17 | 2953 | 2953 | 73 |
| 18 | 3045 | 3012 | 57 |
| 19 | 2978 | 3012 | 90 |
| 20 | 3089 | 3089 | 66 |
| 21 | 3169 | 3169 | 118 |
| 22 | 4288 | 3519 | 78 |
| 23 | 4325 | 3531 | 71 |
| 24 | 4275 | 3531 | 78 |

Applied = raw fit with each single-tier step capped at +350 (a perfect score gives only a lower bound) and made monotone by pooling adjacent violators. Capped: 21→22: raw +1119 capped at +350.

## Pairwise results (score of the first-named tier)

| Pairing | Games | Score | Predicted by fit |
|---|---|---|---|
| 0 vs 1 | 20 | 37.5% | 36.0% |
| 0 vs 2 | 20 | 15.0% | 16.5% |
| 1 vs 2 | 20 | 27.5% | 26.0% |
| 10 vs 11 | 20 | 27.5% | 33.4% |
| 10 vs 12 | 20 | 22.5% | 16.6% |
| 11 vs 12 | 20 | 22.5% | 28.4% |
| 12 vs 13 | 20 | 22.5% | 28.1% |
| 12 vs 14 | 20 | 17.5% | 11.9% |
| 13 vs 14 | 20 | 20.0% | 25.6% |
| 14 vs 15 | 20 | 32.5% | 30.4% |
| 14 vs 16 | 20 | 15.0% | 17.1% |
| 15 vs 16 | 8 | 37.5% | 32.1% |
| 16 vs 17 | 12 | 29.2% | 37.1% |
| 16 vs 18 | 8 | 37.5% | 25.7% |
| 17 vs 18 | 12 | 29.2% | 37.1% |
| 18 vs 19 | 8 | 75.0% | 59.5% |
| 18 vs 20 | 12 | 33.3% | 43.7% |
| 19 vs 20 | 8 | 50.0% | 34.5% |
| 2 vs 3 | 20 | 42.5% | 36.5% |
| 2 vs 4 | 20 | 7.5% | 13.5% |
| 20 vs 21 | 9 | 38.9% | 38.7% |
| 20 vs 22 | 9 | 0.0% | 0.1% |
| 21 vs 22 | 10 | 0.0% | 0.2% |
| 22 vs 23 | 12 | 45.8% | 44.7% |
| 22 vs 24 | 8 | 50.0% | 51.9% |
| 23 vs 24 | 12 | 58.3% | 57.1% |
| 3 vs 4 | 20 | 27.5% | 21.4% |
| 4 vs 5 | 20 | 25.0% | 24.1% |
| 4 vs 6 | 20 | 17.5% | 18.5% |
| 5 vs 6 | 20 | 42.5% | 41.6% |
| 6 vs 7 | 20 | 10.0% | 23.8% |
| 6 vs 8 | 20 | 27.5% | 13.7% |
| 7 vs 8 | 20 | 20.0% | 33.8% |
| 8 vs 10 | 20 | 12.5% | 10.2% |
| 8 vs 9 | 20 | 37.5% | 39.6% |
| 9 vs 10 | 20 | 12.5% | 14.8% |

## Style offsets (style vs balanced at the same tier)

| Style | Tier | Games | Score | Elo offset |
|---|---|---|---|---|
| attacker | 16 | 16 | 40.6% | -66 |
| defender | 16 | 13 | 46.2% | -27 |
| endgame | 16 | 12 | 58.3% | +58 |
| gambiteer | 16 | 12 | 70.8% | +154 |
| strategist | 16 | 16 | 53.1% | +22 |
| tactician | 16 | 16 | 15.6% | -293 |
| technician | 16 | 16 | 43.8% | -44 |
| wildcard | 16 | 16 | 62.5% | +89 |
| attacker | 8 | 20 | 42.5% | -53 |
| defender | 8 | 20 | 72.5% | +168 |
| endgame | 8 | 20 | 55.0% | +35 |
| gambiteer | 8 | 20 | 47.5% | -17 |
| strategist | 8 | 20 | 45.0% | -35 |
| tactician | 8 | 20 | 50.0% | +0 |
| technician | 8 | 20 | 75.0% | +191 |
| wildcard | 8 | 20 | 5.0% | -512 |

Applied offsets (mean over tiers): {"balanced":0,"attacker":-59,"defender":71,"endgame":47,"gambiteer":68,"strategist":-7,"tactician":-146,"technician":74,"wildcard":-211}
