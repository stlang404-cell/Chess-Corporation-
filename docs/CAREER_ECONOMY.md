# Career & Economy Design

Three numbers describe a SEVEN career and they are deliberately kept **separate**:

| | What it measures | Can go down? | Can be bought? |
|---|---|---|---|
| **Rating** | playing strength (Glicko-2, Elo-style scale) | yes | never |
| **Title / rank** | earned career standing | rarely (within a title only) | never |
| **Dollars** | fictional compensation | spent on cosmetics | n/a |

Code: `src/game/career.ts`, `rating.ts`, `matchmaking.ts`, `economy.ts`, `settle.ts`, `store.ts`.

## 1. Rating — Glicko-2

Why Glicko-2 rather than plain Elo: a new player's rating needs to move fast (high uncertainty) and settle as evidence accumulates; Glicko-2's rating deviation (RD) does exactly that and also handles opponents of known reliability (bots carry the RD of their calibration). The number shown is the Glicko rating on a familiar Elo-like scale.

- Start: 1000, RD 300 → shown with a "?" while RD > 110 (provisional).
- One game = one rating period. τ = 0.5. RD floor 45 so the rating stays responsive over thousands of games; volatility capped at 0.12.
- Opponent rating/RD = the bot's **measured** rating and calibration uncertainty (`src/engine/calibration.ts`).
- The SEVEN scale is anchored at tier-0 bot = 400. It is not a FIDE rating and the game never claims otherwise.

## 2. The ladder

### Authored section
50 titles × 3–5 grades = **215 authored ranks**, from *Intern I* to *Elder of the House V*: clerical (Intern → Senior Analyst, 3 grades), professional (Specialist → Managing Director, 4 grades), executive (AVP → Chairman, 5 grades) and the board (Executive Chairman → Elder of the House, 5 grades).

### Procedural continuation (unbounded)
Rank *n* ≥ 215 maps to a procedural title *k* = ⌊(n−215)/5⌋ with grade (n−215) mod 5. Title *k* is a mixed-radix count over **6 offices × 30 jurisdictions × 12 prestige orders**, with a *Seal* numeral every full cycle:

> *Steward of Kyoto, Order of the Pine — I* → … → *Elder of Sydney, Order of the Tide — V* → *Steward of Kyoto, Order of the Pine · Seal II — I* …

Names never repeat (tested over 20,000 ranks) and are a pure function of *n*, so every rank has a stable identity forever. This avoids the "Supreme Ultra Mega CEO" problem: higher ranks are *places and orders*, not adjectives.

### Arenas
18 authored arenas (Mailroom Annex 始 → House of Elders 院), each covering 2–3 titles, with its own kanji, accent colour and traditional pattern (seigaiha, asanoha, kikkō, shippō, ichimatsu, uroko, yagasuri). Beyond them, procedural arenas each cover 3 procedural titles: *{Jurisdiction} {Hall/Pavilion/Tower/…}* with a deterministic muted colour and pattern.

### Requirements for promotion from rank *n* to *n + 1*

1. **Merit** ≥ `meritNeeded(n) = round(50 + 6·n^0.8)` (50 at Intern I; ~290 around rank 100; ~490 at the end of the authored ladder).
2. **Rating gate** `ratingGate(n+1)`: 0 for the first six titles, then a smooth curve to the **mastery gate** for the last authored title; procedural ranks keep the mastery gate. All grades of a title share its gate.
3. **Promotion series** when entering a *major* title (Supervisor, Manager, Director, Managing Director, VP, EVP, CSO, COO, President, CEO, Vice Chairman, Chairman and every board title, and the first grade of every procedural title): best-of-3, or best-of-5 from President upwards, against opponents rated at the gate being tested. Pass → promoted with a large bonus. Fail → merit drops to 60% of the requirement and the player earns another shot.

### Merit per rated game (E = expected score)
- win: 24 + 16·(1−E); draw: 12 + 12·(0.5−E) (never negative); loss: −(6 + 12·E).
- **Fast-track:** positive merit is multiplied by `clamp(1 + (rating − gate(next) − 100)/250, 1, 3)`. A player whose rating is well above the next gate climbs up to 3× faster, until the gates catch up.

### Setbacks
Merit can fall to zero. Three further losses at zero merit drop the player **one grade**, never below grade I of the current title — titles, once earned, are permanent.

### Why this works over 10,000 matches
- Merit is what any persistent player earns; **gates are what skill earns**. A player at their plateau keeps collecting grades until the next gate, then keeps a reason to improve.
- Above the mastery gate, progress continues forever but stays expensive (merit requirements keep growing sublinearly; every procedural title begins with a series).
- Long-term, non-rating goals continue at any level: achievements (27), Arena Cups, seasonal honours (monthly peak-rating seals), rivals, the store and the headquarters tower.

## 3. Matchmaking

Target opponent rating = player rating + N(0, 95) (N(0, 140) while provisional), tilted −45 after three straight losses or +35 after three straight wins. The nearest calibrated (tier, style) is chosen; the last two styles faced are avoided; 15% of the time a rival (≥ 3 previous games, still within 180 points) is chosen instead. The opponent's measured rating is shown with your expected score before the game. The tilt only changes *who* you meet — ratings and results are never adjusted.

## 4. Compensation

`S = salary(rank) = round(60·√(1+rank))` — $60 for an Intern, $1,200 at rank 399, $6,000 at rank 9,999: growth is sublinear by design.

| Line | Amount |
|---|---|
| Base salary | 0.4·S |
| Victory bonus | 1.0·S·f |
| Draw bonus | 0.35·S·f |
| Upset bonus (win with E < 0.4) | 3·(0.4−E)·S |
| Performance bonus (≥ 15 moves, accuracy ≥ 60%) | 0.6·S·((acc−60)/40)^1.5 (×0.3 in a loss) |
| Promotion | 4·S(new) (×12 for a major title) |
| Arena Cup champion | 25·S |
| Achievements | fixed $50–$100,000 |

All match lines (not promotions/achievements) are also multiplied by the **rematch decay** (1, 0.85, 0.70, 0.55, then 0.4 for consecutive games against the same opponent).

`f = clamp(1 + (opponent − player)/600, 0.35, 1.3)` scales pay by opponent strength.

**Accuracy** is computed after the game by the engine in a background worker (9,000 nodes per position): per-move win-probability loss converted to an accuracy score (Lichess-style curve), and averaged as the mean of the arithmetic and harmonic means so a single blunder matters. Analysis is only run when the game has ≥ 15 player moves; if it times out (12 s), no performance bonus is paid rather than guessing.

### Anti-exploitation safeguards
| Exploit | Countermeasure |
|---|---|
| Quick resignations to farm salary | Games with < 10 player moves pay nothing. Simulated "resign at move 10 every game": $13k over 300 games vs $198k for honest play, and the rating collapses. |
| Intentional losses / sandbagging | Losses pay only 0.4·S (+ a small accuracy share); matchmaking follows the rating down, and weaker opponents pay less (f). |
| Farming weak opponents | f falls to 0.35 against much weaker bots; matchmaking does not offer them. |
| Rematch farming | Rematch decay to 40%. |
| Prolonging games | Nothing is paid per move or per minute. |
| Unsound "brilliant" sacrifices | The performance bonus uses engine accuracy, which *drops* for unsound moves. |
| Pre-arranged draws | Draw offers are only possible from move 20 in rated games, max 3, and the bot accepts only when its evaluation justifies it. |
| Duplicate rewards | Settlement is a pure function keyed by match id, and the save is written in one IndexedDB transaction (tests: duplicate settlement, reload). |
| Buying rank | Impossible: the store only sells cosmetics. |

## 5. Spending

The store (`src/game/store.ts`) sells boards, piece sets (including shogi-style kanji tiles), crests, profile frames, office wallpapers, promotion-ceremony styles, match-entrance effects and desk trophies; some are prestige-locked behind a highest-rank requirement. The **headquarters tower** is an unlimited sink: floor *k* costs `3000·1.13^k` (rounded), so wealth translates into a visibly taller tower with logarithmic growth. Net worth = balance + tower value. Nothing purchasable affects play.

## 6. Balancing evidence

`scripts/career-sim.ts` runs simulated careers through the real code (matchmaking, Glicko-2, merit, gates, series, pay, achievements), sampling each game from the Elo expectation with a ~22% draw rate. Results: `research/career-sim.md`.

Changes made because of the simulation:
1. **Fast-track merit.** Without it, players of true strength 1100 and 2000 climbed at the *same* speed (merit is earned at ~50% win rates whatever your level). With it, stronger players reach their level much sooner.
2. **Salary down 40%, store prices doubled, headquarters sink added.** The first simulation produced ≈$1.2 M lifetime earnings by game 1,500 against a $276 k catalogue.
3. **Series opponents at the gate**, not above the player — strong players were failing series ~40 times per 1,500 games while fighting opponents stronger than the bar being tested.

Limitations: the simulation assumes a player's strength is fixed and that results follow the Elo model; real players improve, tilt and stop. Pacing should be re-tuned with real play data.
