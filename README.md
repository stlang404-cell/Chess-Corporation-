# SEVEN · Corporate Chess

*Simple to look at. Deep to master. Endless to climb.*

**Play:** https://stlang404-cell.github.io/Chess-Corporation-/ — on iPhone, open it in Safari and choose *Share → Add to Home Screen*. Works offline after the first visit.

SEVEN is chess on a **7×7 board**. Press **MATCH**, play an **untimed** rated game against an AI opponent with a real identity and style, and watch your rating, your fictional salary and your corporate career move — from *Finance Intern* to *Chief Financial Officer*, *Chief Executive Officer* of Seven Meridian, and then the head of ever-larger institutions in a corporate universe that keeps expanding.

## v0.3 — The Prestige Update

- **Every rated game is reviewed by the engine.** Accuracy, an evaluation bar and graph, turning points, Brilliant/Great/Best…/Blunder labels, missed wins, the best alternative as an arrow, and *Retry this move* on any mistake. Brilliant moves are re-verified by a 4× deeper search before they are awarded. No engine help is ever shown during rated play.
- **A paycheck driven by how you played** (formula pay-3): base pay, an accuracy bonus, Great/Brilliant bonuses, result and upset bonuses, and capped deductions for blunders, itemised on the results sheet and paid exactly once.
- **Smooth, trustworthy animation.** Pieces glide (115–240 ms, or instantly with *reduce motion*), captures fade, and tap and drag both work. A browser test proves the drawn board always matches the real position.
- **Three new piece sets** (Imperial, Modern, Executive) and a richer palette with colours that carry meaning.
- **Career hooks.** Performance contracts, rivals, career records, six rare honours that each unlock an earned-only cosmetic, and four store collections.
- **Engine.** v0.3 plays like v0.2. It now has a measured equal-time result against v0.1: **+47 Elo [+6, +89]** at 100 ms per move. Two new search ideas were tested and left off because neither showed a significant gain.

See [`docs/RELEASE_v0.3.md`](docs/RELEASE_v0.3.md) for what was verified.

## v0.2 — The Ascension Overhaul

- **Untimed chess everywhere.** No clocks, no timeouts; leave mid-game and resume later. (Optional timed play remains in Settings.)
- **Rebuilt interface.** A Japanese-minimalist design system with light and dark themes, new SVG piece families, capture animations, a match screen built around a large board, results sheets with full payout breakdowns, and minor/major promotion ceremonies.
- **Stronger engine, measured.** SEE, a late-move-reduction table, late-move pruning, countermoves, transposition-table use in quiescence and a variant opening book: **+119 Elo [+61, +185] at 30k nodes, +159 [+84, +252] at 100k nodes** against the v0.1 engine at equal node budgets. 25 strength tiers, 9 measurable playing styles, a maximum-strength challenge.
- **A realistic, enormous career.** Five separate dimensions (seniority, job family, scope, appointment, honours); **326 authored titles, 1,768 grades, 64 arenas**, 23 job families, 46 authored institutions, then an unbounded, grammar-validated sequence of institutions. Ranks are safe integers up to 2⁵³−1.
- **Academy.** Official rules, a 13-chapter variant guide with 49 engine-verified exercises, **125 engine-mined puzzles** with a puzzle rating, and post-game review with Brilliant/Great/Best/Excellent/Good/Inaccuracy/Mistake/Blunder labels.
- **Saves you can trust.** v0.1 careers migrate automatically; checksummed IndexedDB with a backup slot; export/import files to move between Windows and iPhone, with confirmation before anything is overwritten.

## Documentation

| | |
|---|---|
| [Launch instructions (iPhone, Windows)](docs/LAUNCH.md) | [Official rules](docs/RULES.md) |
| [AI engine report](docs/AI_ENGINE.md) · [benchmarks](research/engine-bench.md) | [Career & economy design](docs/CAREER_ECONOMY.md) |
| [Career directory](docs/CAREER_DIRECTORY.md) | [Strategy & tactics guide](docs/guide/) |
| [Test report](docs/TEST_REPORT.md) | [v0.2 audit](docs/AUDIT_v0.2.md) · [Roadmap](docs/ROADMAP.md) |
| [Research notes](docs/RESEARCH.md) | [Screenshots](docs/screenshots/) |

## Develop

```bash
npm ci
npm run dev                 # http://localhost:5173
npm test                    # 210 vitest tests
npm run build               # PWA → dist/
npm run build:single        # Windows single file → release/windows/SEVEN.html
scripts/deploy-pages.sh     # publish to GitHub Pages
```

Fully offline and free: no accounts, ads, subscriptions, cloud AI or real money.
