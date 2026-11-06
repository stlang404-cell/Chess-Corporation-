# Roadmap — v0.3 priorities

Ordered by impact on the core loop (open → MATCH → meaningful untimed game → visible progress).

## P0 — Verify on real devices
1. **iPhone hardware pass**: Add to Home Screen, standalone launch, offline cold start, storage persistence across weeks, update banner flow, touch drag precision on the smallest phones. (v0.2 was tested in Chromium at iPhone sizes only.)
2. **Windows pass**: run `Launch SEVEN.bat` on Windows 10/11 (Edge app mode, SmartScreen behaviour, file:// IndexedDB persistence).
3. **Two-version service-worker update** test in CI.

## P1 — Engine and calibration
4. **Evaluation tuning**: Texel-style tuning on self-play positions (v0.2's hand-added evaluation terms measured neutral). Target +100 Elo at equal nodes.
5. **Speed**: recover the ~35% nodes/s lost to SEE (incremental attack maps, cheaper SEE gating) so equal-time strength matches equal-node strength.
6. **Bigger calibration**: more games for the top tiers and every style at every tier; publish confidence intervals in-game.
7. **Endgame tablebases** for ≤ 4 pieces on 7×7 (the retrograde solver behind the guide is a starting point).

## P2 — Academy
8. Grow the puzzle library from ~125 to 1,000+ (longer mining runs; mate-in-2/3 focus), with puzzle streaks and daily puzzles.
9. Guided lessons with interactive steps (currently chapters + exercises), and opening trainer from the variant book.
10. Review: "retry this position" from any mistake.

## P3 — Career and economy
11. Real-player pacing data (opt-in, local export) to tune merit and gates.
12. Seasonal standings (monthly), without ever resetting earned titles.
13. Richer rival stories: rival-specific openings, grudge matches.

## P4 — Platform
14. Optional native wrappers (Tauri for Windows/macOS, Capacitor for iOS) for store distribution; the web build stays primary.
15. Optional encrypted cloud backup of the career file to a user-chosen location (still no account).
