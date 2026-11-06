# Career & Economy Design (v0.2)

Four numbers describe a SEVEN player, and they are deliberately **separate**:

| | Measures | Can go down? | Can be bought? |
|---|---|---|---|
| **Rating** | chess skill (Glicko-2, Elo-style scale) | yes | never |
| **Career rank** | earned seniority and appointments | rarely, within a title only | never |
| **Arena** | competitive career stage (follows the rank) | with the rank | never |
| **Dollars** | fictional wealth | spent on cosmetics | n/a |

**Honours** (cups, honorary board seats, long service, seasonal seals) are a fifth, separate record: distinctions, never job titles.

A promotion never changes the rating; a high rating never grants a title by itself; dollars never buy either.

Code: `src/game/careerData.ts` (authored data), `career.ts` (rank functions), `rating.ts`, `matchmaking.ts`, `economy.ts`, `settle.ts`, `store.ts`, `migrateV1.ts`.

---

## 1. Why the v0.1 ladder was rebuilt

v0.1 used one list of 50 titles that mixed functions, governance offices and honours, e.g. *Chief of Staff → Chief Strategy Officer → Chief Operating Officer*, *CEO → Vice Chairman → Chairman*, *Board Trustee → Governor → Chancellor → Regent*. Its procedural continuation produced strings such as *Steward of Kyoto, Order of the Pine* — not corporate offices at all. v0.2 separates five dimensions:

| Dimension | What it is | Where |
|---|---|---|
| **A. Seniority** | an ordered responsibility level | `STEPS` (14 functional steps), then management, then institutions |
| **B. Job function** | Finance, Legal, Engineering … (23 families) | `FAMILIES` — chosen by the player, cosmetic |
| **C. Organisational scope** | team → department → division → business unit → company → group → enterprise | `STEPS[].scope`, `GM_TITLES[].scope` |
| **D. Formal appointment** | the actual title held, e.g. *Director of Finance* or *Chief Executive Officer, Kitahama Industrial Company* | `rankInfo(rank, family)` |
| **E. Honours** | cups, honorary board seats, long service | `save.honors` |

Board offices (chair, director) are **governance**, not a rung above management, so they appear only as honours (an honorary board seat for every three Arena Cups).

## 2. The ladder

### 2.1 Functional careers (ranks 0–55)
Every family has 14 seniority steps with realistic titles; the player sees the ladder of the family they chose (changeable at any time — titles change wording, seniority does not).

| Step | Scope | Grades | Finance | Engineering | Legal |
|---|---|---|---|---|---|
| 0 Intern | team | 3 | Finance Intern | Engineering Intern | Legal Intern |
| 1 Junior | team | 3 | Junior Financial Analyst | Junior Developer | Paralegal |
| 2 Professional | team | 3 | Financial Analyst | Software Engineer | Legal Counsel |
| 3 Senior | team | 3 | Senior Financial Analyst | Senior Software Engineer | Senior Legal Counsel |
| 4 Lead | team | 4 | Lead Financial Analyst | Staff Engineer | Lead Counsel |
| 5 Team lead | team | 4 | Finance Team Lead | Engineering Team Lead | Legal Team Lead |
| 6 Manager ★ | department | 4 | Finance Manager | Engineering Manager | Legal Manager |
| 7 Senior manager | department | 4 | Senior Finance Manager | Senior Engineering Manager | Senior Legal Manager |
| 8 Director ★ | division | 4 | Director of Finance | Director of Engineering | Director of Legal Affairs |
| 9 Senior director | division | 4 | Senior Director of Finance | Senior Director of Engineering | Senior Director of Legal Affairs |
| 10 Vice president ★ | business unit | 5 | Vice President of Finance | Vice President of Engineering | Vice President of Legal Affairs |
| 11 Senior VP | business unit | 5 | Senior Vice President of Finance | Senior Vice President of Engineering | Senior Vice President of Legal Affairs |
| 12 Executive VP ★ | company | 5 | Executive Vice President of Finance | Executive Vice President of Technology | Executive Vice President and General Counsel |
| 13 Chief officer ★ | company | 5 | Chief Financial Officer | Chief Technology Officer | Chief Legal Officer |

★ = major appointment (promotion series). Families: Finance, Accounting, Treasury, Operations, Supply Chain, Procurement, Strategy, Research, Legal, Human Resources, Engineering, Information Technology, Data & Analytics, Security, Marketing, Sales, Communications, Risk & Compliance, Customer Experience, Administration, Design, Quality, Sustainability.

### 2.2 General management (ranks 56–75)
A chief officer moves into general management at the home company, **Seven Meridian Corporation**: Business Unit President → Group President → President → Chief Executive Officer (5 grades each).

### 2.3 Institutions (ranks 76–535, authored)
A CEO is appointed to lead successively larger institutions: **President**, then **Chief Executive Officer** (5 grades each) of 46 authored institutions, in five scale classes — 10 regional companies, 12 national groups, 12 international groups, 8 multinational groups and 4 global holding companies (*Kitahama Industrial Company, Osaka* … *Meridian World Holdings, Tokyo*).

### 2.4 Beyond (ranks 536 and up, procedural, unbounded)
A real company does not have infinitely many CEOs, so SEVEN's corporate universe **expands** instead: every further appointment is President and then CEO of a newly founded institution with a higher **enterprise scale** number. Names come from a validated grammar — `root + region + institution type`, e.g. *Aokawa Pacific Holdings*, *Kestrel Nordic Logistics Group* — over 60 × 24 × 10 = 14,400 distinct names visited in a coprime stride, after which a charter number is appended (*… (charter 2)*). No inflation words (*Supreme, Eternal, Imperial, Grand …*) are possible.

### 2.5 Scale (tested)
- **326 distinct authored job titles** and **1,768 authored grades** (23 families × 56 + 20 management + 460 institutional).
- **64 authored arenas**: 14 functional floors (Mailroom Annex → C-Suite Terrace), 4 management floors, and the 46 institutions' headquarters; then one procedural arena per further institution.
- A player's own authored path is 536 grades long; titles they cannot see are other families' equivalents.

### 2.6 Numeric range and identity
A rank is a single integer `0 ≤ rank ≤ Number.MAX_SAFE_INTEGER` (≈ 9 × 10¹⁵); every function is closed-form (no search loops or ceilings) and is tested at the boundary. Each rank has a stable id (`R-` + base 36). At one promotion per match a player would need ~9 quadrillion matches to reach the limit; ranks are clamped there rather than overflowing.

Promotion history stores the **title text at the time** (e.g. *"Finance Manager I"*), so earned titles never change wording later — including titles earned under v0.1, which are kept verbatim.

## 3. Promotion requirements

From rank *n* to *n + 1*:

1. **Merit** ≥ `50 + 6·n^0.8`, earned per rated game: win `24 + 16(1−E)`, draw `12 + 12(0.5−E)` (never negative), loss `−(6 + 12E)`. Positive merit is multiplied by the **fast-track** factor `clamp(1 + (rating − gate − 100)/250, 1, 3)`.
2. **Rating gate** for the title of rank *n + 1*: none for steps 0–4, then a smooth curve from the rating of calibrated tier 3 to the **mastery gate** (top calibrated tier − 200) at the end of the authored path; the mastery gate thereafter. Gates are recomputed from the *measured* bot scale, never assumed.
3. **Promotion series** for major appointments: best of 3 (manager, director, VP, EVP) or best of 5 (chief officer and above, and every institutional appointment) against opponents rated at the gate.

Setbacks: merit can fall to zero; three further losses at zero drop one **grade**, never below grade I of the current title. Earned titles are never lost.

**Plateaued players.** Merit is what persistence earns; gates are what skill earns. A player at a stable rating keeps collecting grades until the next gate, then has non-rating goals: Arena Cups and the honours they bring, achievements, seasonal seals, rivals, puzzle rating, the store and an endlessly tall headquarters tower. Ratings are never inflated to keep progression moving.

## 4. Matchmaking

Target rating = player rating + N(0, 95) (N(0, 140) while provisional), tilted −45 after three straight losses or +35 after three wins; series opponents sit at the gate being tested; Arena Cup rounds at −60/+60/+170. The nearest calibrated (tier, style) is chosen, avoiding the last two styles; 15% of matches are rivals (≥ 3 games played, still within 180 points). The opponent's measured rating and the player's expected score are shown before the game. Colours alternate. Ratings and results are never adjusted.

Opponents have stable identities generated from an id: name (10 cultural regions), crest, style, job family, a title consistent with their rating, an affiliation with one of the institutions, an arena, a league record (a statistical abstraction: N games at an expected 50% around their rating), and a head-to-head record once met.

## 5. Compensation

`S = salary(rank) = round(60 · √(1 + rank))` — sublinear: $60 for an intern, ≈ $1,390 at the end of the authored path, ≈ $6,000 at rank 10,000.

| Line | Amount |
|---|---|
| Base salary | 0.4 S |
| Victory bonus | 1.0 S · f |
| Draw compensation | 0.35 S · f |
| Upset bonus (win, E < 0.4) | 3 (0.4 − E) S |
| Performance bonus (≥ 15 moves, accuracy ≥ 60%) | 0.6 S ((acc − 60)/40)^1.5 (× 0.3 in a loss) |
| Promotion bonus | 4 S(new) (× 12 for a major appointment) |
| Arena Cup prize | 25 S |
| Achievements | $50 – $100,000 |

All match lines are multiplied by the **rematch decay** (1, 0.85, 0.70, 0.55, then 0.4 for consecutive games against the same opponent). `f = clamp(1 + (opponent − player)/600, 0.35, 1.3)`.

**Accuracy** is the engine's per-move win-probability loss converted to accuracy (Lichess-style curve) and averaged as the mean of the arithmetic and harmonic means, computed after the game in a background worker. If analysis is unavailable, no performance bonus is paid.

### Anti-exploitation
| Exploit | Countermeasure |
|---|---|
| Thinking forever (untimed) | Pay is per game, never per move or per minute; long games earn nothing extra. |
| Quick resignations / abandoning | Under 10 player moves → no pay; the result is still a rated loss. |
| Intentional losses / sandbagging | Losses pay 0.4 S; matchmaking follows the rating down and weaker opponents pay less. |
| Farming weak opponents | f → 0.35; matchmaking does not offer them. |
| Rematch farming | Decay to 40%. |
| Unsound "brilliant" sacrifices | Performance pay uses engine accuracy, which drops for unsound moves. |
| Pre-arranged draws | Draw offers only from move 20 in rated games, max 3, accepted only when the engine's evaluation justifies it. |
| Duplicate rewards | Settlement is a pure function keyed by match id, committed in one IndexedDB transaction (tested across reloads). |
| Buying rank | Impossible: the store sells cosmetics and review/training amenities only. |

## 6. Spending and records

The store sells boards (plus one free board per arena reached), piece sets, portraits, crests, profile frames, office wallpapers, promotion-ceremony styles, match entrances, desk trophies and two study amenities that only affect post-game review and unrated training. The **headquarters tower** is an unlimited sink (floor *k* costs ≈ 3,000 · 1.13^k).

**Finance** shows balance, lifetime earnings, match earnings, promotion bonuses, tournament prizes, achievement rewards, highest single-match payout, current salary, total purchases and net worth (balance + tower + purchases).

## 7. Migration from v0.1

`migrateCareerV1` maps each v0.1 rank to the equivalent seniority (monotone; several v0.1 titles that collapse into one v0.2 title spread their grades across it), keeps the merit *fraction*, keeps every v0.1 title verbatim in the promotion history and in `career.legacy`, and sets the job family to Strategy (changeable). Rating, history, dollars, purchases, achievements, Arena Cup state and any game in progress (with its clocks, if timed) are untouched. Tested with a save produced by the actual v0.1 code (`tests/fixtures/save-v0.1.json`).

## 8. Balancing evidence

`scripts/career-sim.ts` drives the real matchmaking, rating, career, series and economy code with game results sampled from the Elo expectation (≈ 22% draws in even games), for players of fixed true strength spread across the calibrated bot scale. Results, including plateaued players and the exploit checks: `research/career-sim.md` (regenerated after every calibration).
