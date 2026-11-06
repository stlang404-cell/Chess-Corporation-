# SEVEN — Official Rules, version SEVEN-1.0

*Status: locked for rated play. Any change to these rules will be published under a new version id (SEVEN-1.1, …) with a separate rating pool; rated rules are never changed silently. The machine-readable definition is `OFFICIAL` in `src/engine/rules.ts`.*

SEVEN is chess on a 7×7 board. If you know chess you already know 95% of SEVEN; this document states every rule exactly, including the places where the smaller board required a decision.

## 1. Board and notation

- 7 files **a–g** (left to right from White's side) and 7 ranks **1–7**. 49 squares.
- **a1 is a dark square.** Squares alternate as usual.
- The single centre square is **d4**. The "inner ring" is c3–e3–e5–c5.
- Moves are written in standard algebraic notation (SAN): `Nc3`, `exd4`, `O-O`, `a7=Q+`. Positions use FEN with 7-character ranks.

## 2. Starting position

```
 7  r n b q k b r      Black
 6  p p p p p p p
 5  . . . . . . .
 4  . . . . . . .
 3  . . . . . . .
 2  P P P P P P P
 1  R N B Q K B R      White
    a b c d e f g
```

FEN: `rnbqkbr/ppppppp/7/7/7/PPPPPPP/RNBQKBR w KQkq - 0 1`

```seven
fen: rnbqkbr/ppppppp/7/7/7/PPPPPPP/RNBQKBR w KQkq - 0 1
caption: The SEVEN starting position. Only three empty ranks separate the armies.
highlight: d4
```

Each side has **one king, one queen, two rooks, two bishops, one knight and seven pawns** (14 pieces). Black's pieces stand on the same files as White's (the queens face each other on the d-file, the kings on the e-file). The two bishops start on opposite colours (c1 and c7 dark, f1 and f7 light), so every army begins with the bishop pair. White moves first.

## 3. How the pieces move

Exactly as in chess:

| Piece | Movement |
|---|---|
| King | one square in any direction |
| Queen | any distance along ranks, files and diagonals |
| Rook | any distance along ranks and files |
| Bishop | any distance diagonally |
| Knight | an "L": two squares in one direction and one at right angles; jumps over pieces |
| Pawn | one square forward; captures one square diagonally forward |

Pieces may not move through other pieces (except the knight) and capture by moving onto an enemy piece.

### 3.1 Pawns

- **Double step:** a pawn on its starting rank (White rank 2, Black rank 6) may advance two squares if both squares are empty.
- **En passant:** if a pawn double-steps past a square attacked by an enemy pawn, that enemy pawn may capture it, on the very next move only, as if it had moved one square.
- **Promotion:** a pawn reaching the last rank (White rank 7, Black rank 1) is immediately replaced by a queen, rook, bishop or knight of the same colour, chosen by the player.

Because only three ranks separate the armies, a double step from rank 2 lands a White pawn on rank 4 — already touching the enemy's half of the board.

## 4. Castling

Each side may castle once per game, toward either rook:

| | King | Rook |
|---|---|---|
| **Short (O-O)** | e1 → g1 | g1 → f1 |
| **Long (O-O-O)** | e1 → c1 | a1 → d1 |

(Black identically on rank 7.) Castling is legal only if:

1. neither the king nor that rook has moved;
2. every square between the king and the rook, and every destination square, is empty (apart from the king and rook themselves) — for short castling f1 must be empty, for long castling b1, c1 and d1;
3. the king is not in check, does not pass through an attacked square, and does not land in check.

In the user interface, castle by moving the king to its destination square (g1 or c1).

## 5. Check, checkmate and stalemate

- A king that is attacked is **in check**; a player may never make a move that leaves their own king in check.
- **Checkmate:** the side to move is in check and has no legal move — that side **loses**.
- **Stalemate:** the side to move is not in check and has no legal move — the game is a **draw**.

## 6. Draws

A game is drawn automatically when:

1. **Stalemate** occurs (§5).
2. **Threefold repetition:** the same position (same pieces on the same squares, same side to move, same castling and en-passant rights) occurs for the third time.
3. **The 40-move rule:** 80 consecutive plies (40 moves by each side) are played with no capture and no pawn move.
4. **Dead position:** neither side can possibly checkmate — king vs king; king and one minor piece vs king; or kings and bishops only, all bishops on one square colour.
5. **Agreement:** a draw offer is accepted. In rated games, draw offers are available from move 20 onwards (anti-collusion), at most three per game.

## 7. Time

- **Untimed is the standard for every match type** — rated, promotion series, Arena Cup, casual and training. There is no clock, no countdown and no loss on time: a player may think as long as they like, leave, close the app and resume later.
- The engine's own thinking is bounded separately (by its strength tier's search budget and a per-move time cap), so an opponent never stalls a game.
- *Optional timed play* (advanced setting): 5+3, 3+2 or 10+5 (minutes + seconds increment). In timed games only, a player whose clock reaches zero loses, unless the opponent has no way to checkmate (only a king, or a king and a single minor piece), in which case the game is drawn. A timed game in progress from v0.1 keeps its clocks.

## 8. Resignation and abandonment

A player may resign at any time (with confirmation); the game is lost. A game in progress is saved after every move and resumes when the app is reopened.

## 9. Fair-play rules for rated games

- No take-backs (undo exists only in casual and training games).
- No engine hints or analysis during a rated game (engine review is available afterwards).
- Rated results are committed atomically and exactly once.

## 10. Illustrated examples

**Short castling.** From `r3k1r/ppppppp/7/7/7/PPPPPPP/R3K1R w KQkq - 0 1`, `O-O` leaves White's back rank as `R4RK` (rook a1, rook f1, king g1).

```seven
fen: r3k1r/ppppppp/7/7/7/PPPPPPP/R3K1R w KQkq - 0 1
caption: Both castling moves are available: O-O (king to g1) and O-O-O (king to c1).
arrows: e1g1 e1c1
```

**Castling through check is illegal.** In `r3k1r/ppppp1p/7/7/2b4/PPP1PPP/R3K1R w KQkq - 0 1` the bishop on c3 attacks e1 (c3–d2–e1), so White is in check and may not castle either way.

**Back-rank mate.** `6k/5pp/7/7/7/7/R3K2 w - - 0 1`: `Ra7#` — the king on g7 is boxed in by its own f6 and g6 pawns.

```seven
fen: 6k/5pp/7/7/7/7/R3K2 w - - 0 1
caption: Ra7 is checkmate.
arrows: a1a7
```

**Stalemate.** `6k/7/5QK/7/7/7/7 b - - 0 1`: Black to move has no legal move and is not in check — draw.

**Promotion.** `3k3/P6/7/7/7/7/3K3 w - - 0 1`: `a7=Q+` (or `=R+`, `=B`, `=N`).

These examples are executed by the engine test-suite (`tests/engine.test.ts`), so the rulebook and the engine cannot drift apart.

## 11. Move-generation reference counts (perft)

From the starting position: 16, 249, 4,506, 79,417, 1,606,599, 31,757,845 positions at depths 1–6. Depths 1–4 are cross-checked against an independent reference move generator in the test-suite.

## 12. Why these rules

The setup was chosen by automated self-play among five candidate rulesets; see `docs/RESEARCH.md`. In short: dropping one knight (rather than the queen or a bishop) kept the game decisive and the first-move advantage close to orthodox chess, the double step keeps openings fast on a board with only three empty ranks, and castling materially reduced draws compared with the same setup without castling.

## 13. Game records (SEVEN-PGN)

Games export as standard PGN with three variant tags so any reader knows the board is 7×7:

```
[Variant "SEVEN-1.0"]
[SetUp "1"]
[FEN "rnbqkbr/ppppppp/7/7/7/PPPPPPP/RNBQKBR w KQkq - 0 1"]
```

Moves are standard SAN on files a–g and ranks 1–7 (`O-O` = king to g1, `O-O-O` = king to c1). The FEN uses 7-character ranks. Implementation: `src/game/pgn.ts`.

## 14. Version history

| Version | Status | Changes |
|---|---|---|
| SEVEN-1.0 | current, rated | Initial ruleset (selected by self-play, v0.1). v0.2 changed only *time controls* (untimed default); the chess rules are unchanged and the rating pool continues. |
