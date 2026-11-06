# The Geometry of the 7×7 Board

A chess player's intuition is tuned to sixty-four squares. SEVEN has forty-nine, and the missing fifteen take away much more than space. This chapter lists the geometric facts that make SEVEN its own game. Nearly everything here is **established**: it can be checked by counting squares.

## One centre square

On an 8×8 board the centre is four squares. On 7×7 it is exactly one: **d4**. Around it is the **inner ring** of eight squares, c3–e3, c4, e4 and c5–e5. Together they form the 3×3 central block. Everything else is the outer zone.

```seven
fen: 4k2/7/7/7/7/7/4K2 w - - 0 1
caption: The centre (d4) and the inner ring. Nine squares decide most middlegames.
highlight: d4 c3 d3 e3 c4 e4 c5 d5 e5
```

> **Established:** a knight anywhere in the 3×3 central block attacks the full eight squares. One step outside it, a knight attacks six or fewer, and in a corner only two.

> **Established:** d4 is a **dark** square, and so are both long diagonals, a1–g7 and a7–g1. The light-squared bishop can never reach d4 or either long diagonal. Its longest diagonals are six squares long (for example b1–g6).

The second fact matters a great deal. Each side has one dark-squared bishop (White's on c1, Black's on c7) and one light-squared bishop (f1, f7). **The dark-squared bishop is the centre bishop.** It is the only minor piece that can sweep through d4 along a seven-square diagonal.

```seven
fen: 4k2/7/7/7/7/7/2B1K2 w - - 0 1
caption: The two long diagonals cross at d4 and are both dark. White's c1-bishop reaches them in one move.
highlight: a1 b2 c3 d4 e5 f6 g7 a7 b6 c5 e3 f2 g1
arrows: c1b2 c1e3
```

## Kings live on dark squares

Count the colours of the king squares: e1, g1 and c1 for White, e7, g7 and c7 for Black. With a1 dark, a square is dark when its file number plus its rank number is even, and all six of these squares pass that test.

> **Established:** in SEVEN the king starts on a dark square, and it is still on a dark square after castling either way. All four corners are dark too. The board has 25 dark squares and 24 light ones.

So the enemy's dark-squared bishop is the one that can give check on the king's home squares, and pressure on the dark diagonals is usually pressure on the king. Trading your dark-squared bishop leaves a lasting hole around your own king. We come back to this in the chapters on king safety and positional play.

## How strong the pieces are on an empty board

A useful measure of a piece's power is its average number of moves on an empty board. Here are the numbers for 7×7, next to the familiar 8×8 figures:

- **Knight:** 4.90 (8×8: 5.25), so it keeps 93% of its power.
- **Bishop:** 7.43 (8×8: 8.75), 85%.
- **Rook:** 12.00 (8×8: 14.00), 86%.
- **Queen:** 19.43 (8×8: 22.75), 85%.
- **King:** 6.37 (8×8: 6.56), 97%.

> **Established:** the knight and the king lose almost nothing on the smaller board, while the long-range pieces lose about 15% of their scope. Short distances suit short-range pieces.

> **Established:** a rook on an empty 7×7 board always has exactly twelve moves, wherever it stands. On a board this small, a rook in the corner is just as mobile as a rook in the centre.

## Distances are short

- A king crosses the whole board, e1 to e7, in **six** moves. No two squares are more than six king moves apart.
- A pawn on its starting rank needs **five** steps to promote, or **four** if it uses its double step.
- A pawn that reaches rank 6 (White) or rank 2 (Black) is **one step** from promoting. In chess the same pawn would still have two steps to go.
- The b1-knight reaches the inner ring (c3) in one move and e4 in two, but needs **three** moves to reach d4 (b1–d2–f3–d4 or b1–c3–e2–d4). It starts on a light square and d4 is dark, so it can only arrive after an odd number of moves, and one move is not enough.

> **Established:** the familiar "square of the pawn" rule works unchanged. Draw a square from the pawn to its promotion rank. If the defending king can step into it, it catches the pawn. Because the board is shorter, these squares are small and tempo counts decide endgames quickly.

## The pawn wall and the middle rank

At the start, pawns stand on ranks 2 and 6 with three empty ranks between them. This produces the most important structural fact in SEVEN:

> **Established:** a White pawn that reaches rank 4 attacks two squares on rank 5, and those are exactly the squares Black's rank-6 pawns would advance to. Equally, a Black pawn on rank 4 attacks White's rank-3 squares. *One pawn move by either side creates contact.*

So SEVEN openings are about **pawn contact from move one**. In chess you can spend five or six moves on development before a pawn is attacked. In SEVEN, 1.d4 already stops Black's c- and e-pawns from advancing a single square safely.

## The weak pawns: f2 and f6

Look at which pieces defend each White pawn in the start position:

- a2: rook. b2: c1-bishop. c2: queen. d2: knight, bishop, queen and king.
- e2: queen, king and f1-bishop. g2: rook and f1-bishop.
- **f2: only the king.**

> **Established:** f2 (and f6 for Black) is the only starting pawn defended by the king alone. It is the SEVEN counterpart of chess's f2/f7. It is also a dark square, so the enemy dark-squared bishop can hit it (for Black, along c5–d4–e3–f2).

There is a second point about the f-file. The f-bishop stands directly behind the f-pawn, so the f-file is plugged until the bishop leaves. Moving the f-pawn does not develop that bishop either: it needs the e- or g-pawn to move first.

> **Established:** in the engine's ranking of White's first moves (300k nodes, depth 10), 1.f3 and 1.f4 came out among the weakest pawn moves, about 50 centipawns worse than 1.d4.

> **Hypothesis:** the f-file is a *rook's* file, not a pawn's. It opens with the most effect after short castling has put a rook on f1.

## The edge is close

With only seven files, the a- and g-files are one step from the edge of a board that is itself only three steps from the centre. A piece on the b- or f-file is already near the rim. Two consequences:

- **Rook pawns.** The a- and g-pawns are rook pawns. As in chess, a rook pawn is the hardest pawn to promote with a minor piece's help. The board's edge is never far away.
- **Kings run out of room fast.** A king driven to the edge has at most four flight squares, and often fewer. Many SEVEN mating nets need only two pieces.

```seven
fen: 4k2/7/7/3N3/7/7/4K2 w - - 0 1
caption: A knight on d4 attacks eight squares, about one sixth of the board. No other minor piece is this efficient.
highlight: c6 e6 b5 f5 b3 f3 c2 e2
```

## Summary

- The centre is **one square, d4**, plus an eight-square ring.
- Both long diagonals and every king square are **dark**. The dark-squared bishop is the key minor piece.
- Knights and kings keep their strength on the small board. Long-range pieces lose about 15%.
- **Rank 4 is the contact rank.** A single pawn move creates tension.
- **f2/f6** is the weak pawn, guarded only by the king.

## Exercise: the long diagonal

```exercise
id: geometry-long-diagonal-skewer
level: 2
fen: 6r/p1p4/4k2/7/7/5PP/R1B3K w - - 0 1
prompt: White to move and win material using the long diagonal.
solution: Bb2+ Kd5
explanation: The dark-squared bishop checks along the a1–g7 diagonal. When the king steps off the line, the bishop takes the rook on g7 next move: a skewer along the longest line on the board.
```
