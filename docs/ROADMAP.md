# Roadmap

Prioritised by impact on the core loop (press MATCH → meaningful game → visible progress).

## Next release (0.2)

1. **Stronger calibration.** More games per tier pair (especially tiers 9–12), a round-robin rather than adjacent pairings, and style offsets measured at every tier instead of tiers 3 and 7. Publish confidence intervals in-game.
2. **Engine strength.** Static exchange evaluation for move ordering and quiescence pruning, tuned material values (Texel tuning on self-play positions), a small opening book generated from deep self-play, and pawn-hash caching. Target: +150 Elo at equal nodes.
3. **Human-calibrated anchor.** Opt-in, local-only export of anonymised results so the SEVEN scale can be related to human play. The scale is internal today.
4. **Tactics trainer at scale.** Mine thousands of engine-verified puzzles from self-play, with an Elo-rated puzzle ladder separate from the game rating.
5. **Draw offers from bots** in dead-drawn positions, and claimable draws shown in the UI before they become automatic.

## Later (0.3+)

6. Seasonal ladders with a monthly reset of *seasonal* standing only (career titles are never reset).
7. Richer rivalries: rival-specific openings and grudge matches, with a short rivalry history card.
8. Additional time controls including correspondence-style "office hours" games that persist over days.
9. Accessibility: full keyboard play, screen-reader move announcements, high-contrast board.
10. Optional native wrappers (Tauri for Windows/macOS, Capacitor for iOS) for app-store distribution; the web build remains primary.
11. Ruleset research continues on the *casual* side (e.g. an 8th-file "classic" mode or a Fischer-random back rank) without touching the rated SEVEN-1.0 pool.

## Known limitations to address

- The engine's material values and piece-square tables are hand-set, not tuned.
- Clock time does not run while the app is closed during a rated game (resuming is allowed rather than forfeiting).
- Bot clocks: very slow devices make top tiers use their wall-clock cap, so they are slightly weaker on old phones than their calibrated rating (calibration is node-based).
- Opponent "league records" are a statistical abstraction, not simulated games (see `docs/CAREER_ECONOMY.md`).
