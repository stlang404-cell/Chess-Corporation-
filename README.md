# SEVEN · The Infinite Corporate Chess Ladder

*Simple to look at. Deep to master. Endless to climb.*

SEVEN is an offline chess game on a **7×7 board**. Press **MATCH**, play a rated game against an AI opponent with a real identity and playing style, and watch your rating, your fictional salary and your corporate title move — from *Intern I* to *Elder of the House* and beyond, through an unbounded, procedurally generated hierarchy.

- **Original variant, SEVEN-1.0** — R N B Q K B R on seven files, pawn double-step, en passant, castling (king to g1/c1). Chosen by automated self-play among five candidate rulesets. → [`docs/RULES.md`](docs/RULES.md), [`docs/RESEARCH.md`](docs/RESEARCH.md)
- **Real engine** — alpha-beta/PVS with iterative deepening, transposition table, null-move pruning, LMR, killers/history, quiescence; runs in a Web Worker. 13 strength tiers × 7 measurable playing styles, calibrated by engine tournaments. → [`docs/AI_ENGINE.md`](docs/AI_ENGINE.md)
- **Honest competition** — Glicko-2 rating shown on an Elo-style scale, provisional start, bots rated only by measured results, no rigged matchmaking, atomic exactly-once settlement.
- **Unlimited career** — 50 authored titles / 215 authored grades, then offices × jurisdictions × prestige orders forever; 18 authored arenas then procedural ones; merit + rating gates + promotion series; Arena Cups. → [`docs/CAREER_ECONOMY.md`](docs/CAREER_ECONOMY.md)
- **Fictional dollars** — salary, win/draw/upset/performance bonuses (performance = engine-measured accuracy), promotion and achievement bonuses, anti-farming rules; spend only on cosmetics and an endlessly tall headquarters.
- **Academy** — the official rules, a variant-specific strategy & tactics guide with engine-validated diagrams and exercises, post-game engine review, and practice games with undo/hints.
- **Offline-first** — no accounts, servers, ads or real-money anything. Windows one-click launcher (single self-contained HTML file) and an installable iPhone PWA. → [`docs/LAUNCH.md`](docs/LAUNCH.md)

## Quick start

**Windows:** open `release/windows/` and double-click `Launch SEVEN.bat`.
**iPhone:** deploy with the included GitHub Pages workflow, open in Safari, *Share → Add to Home Screen* (details in [`docs/LAUNCH.md`](docs/LAUNCH.md)).
**Developers:**

```bash
npm ci
npm run dev        # play at http://localhost:5173
npm test           # vitest: rules, perft vs independent generator, AI, rating, career, economy, saves, guide
npm run build      # PWA in dist/
```

## Repository map

| Path | What |
|---|---|
| `src/engine/` | board & move generation, rules, evaluation, search, AI tiers/styles, calibration, analysis |
| `src/game/` | rating (Glicko-2), career ladder & arenas, opponents, matchmaking, economy, settlement, saves, store |
| `src/ui/` | React interface (Home · Play · Career · Academy), board, pieces, engine worker client |
| `src/worker/` | engine Web Worker |
| `docs/` | rulebook, guide chapters (`docs/guide/`), research, engine report, career & economy design, test report, roadmap |
| `research/` | raw self-play and calibration data, generated reports |
| `scripts/` | self-play research, calibration, rating fit, career simulation, build helpers |
| `tests/` | unit/integration tests (vitest) and browser end-to-end scripts (`tests/e2e/`) |
| `release/windows/` | prebuilt single-file game + launcher |

## Documentation

- [Official rules](docs/RULES.md)
- [Strategy & tactics guide](docs/guide/) (also in-game: *Academy → Guide*)
- [Research: choosing the rules](docs/RESEARCH.md)
- [AI engine report](docs/AI_ENGINE.md)
- [Career & economy design](docs/CAREER_ECONOMY.md)
- [Test report](docs/TEST_REPORT.md)
- [Launch instructions](docs/LAUNCH.md)
- [Roadmap](docs/ROADMAP.md)
