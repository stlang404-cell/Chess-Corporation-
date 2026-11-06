# Material: What the Pieces Are Worth

Every chess player carries a price list in their head: pawn 1, knight 3, bishop 3, rook 5, queen 9. Does it survive the move to 7×7? Mostly, yes, with a few corrections that matter in practice. This chapter separates what we have measured from what we still believe.

## The engine's working values

The SEVEN engine scores material in centipawns (hundredths of a pawn). It uses separate values for the middlegame and the endgame and blends them as pieces come off:

- **Pawn:** 88 in the middlegame, 115 in the endgame.
- **Knight:** 315 middlegame, 290 endgame.
- **Bishop:** 320 middlegame, 320 endgame.
- **Rook:** 470 middlegame, 520 endgame.
- **Queen:** 900 middlegame, 940 endgame.

> **Hypothesis:** these values were set by hand and tuned for playing strength, not derived from SEVEN games. They are a sensible starting point, but they were not measured on this board.

To see how the engine's *search* weighs material in a real position, we set up a quiet, symmetrical position (1.e3 e5 2.Be2 Be6 3.O-O O-O, base evaluation +0.30 for White) and removed one Black unit at a time. The engine then searched each position to depth 10 (300,000 nodes):

- Without Black's **knight**: White +3.21, so the knight is worth about 2.9 pawns.
- Without Black's **dark-squared bishop**: +3.51, about 3.2 pawns.
- Without Black's **a-rook**: +5.25, about 4.95 pawns.
- Without Black's **queen**: +9.17, about 8.9 pawns.
- Without Black's **d-pawn**: +0.97. Without the **a-pawn**: +0.99. Without the **g-pawn** next to the castled king: **+1.53**.
- Without **knight and bishop**: +6.36, compared with +5.25 for the rook.

> **Established:** in the engine's judgment the bishop is worth a little more than the knight, two minor pieces are worth clearly more than a rook (about one pawn more), and a pawn of the king's shelter is worth about one and a half ordinary pawns.

> **Hypothesis:** the engine's figures inherit its hand-set values, so they are partly circular. A proper measurement needs many games from material-odds starting positions. Until that has been done, treat the classical 1–3–3–5–9 scale as accurate to within half a pawn for the minor pieces and rooks.

## Knight against bishop

The geometry chapter showed that the knight keeps 93% of its 8×8 mobility on the smaller board, while the bishop keeps only 85%. That argues for the knight. The bishop's other weakness is that the light-squared bishop can never touch the centre square d4. On the other hand, the board is so short that a bishop on a long diagonal covers both wings at once.

> **Established:** in the middlegame the knight is relatively stronger in SEVEN than in chess, because its range is barely reduced while the bishop's is.

> **Hypothesis:** in open positions the **dark-squared bishop** is worth more than the knight, which in turn is worth about as much as the **light-squared bishop**. When you must give up a bishop for the knight, give up the light one.

There is also a practical point. The knight is the only minor piece that can jump over the pawn wall. In the opening, before any pawn has moved, it is the *only* piece besides the pawns with a legal move. That makes it the first piece to develop and often the first to be exchanged.

## The bishop pair is the default

Because each side starts with two bishops and one knight, **the bishop pair is the normal state of affairs**. In chess you "win" the bishop pair. In SEVEN you *lose* it, usually by trading a bishop for the enemy knight.

> **Established:** a side that trades a bishop for the opposing knight is left with bishop and knight against two bishops. The opponent then holds the bishop pair, and with it control of both square colours.

> **Hypothesis:** the bishop pair is worth roughly half a pawn in open middlegames and more in endgames, as in chess. The effect may be smaller in SEVEN because the board is short enough for a knight to cover both wings quickly.

```seven
fen: 6k/p1pnbpp/3p3/3P3/3BP2/PB3PP/6K w - - 0 1
caption: Material is level, but White has the bishop pair. The engine rates White clearly better (+2.8 at depth 11). Black's light-squared bishop is also hemmed in by its own pawns on c6 and d5.
highlight: b2 d3 c6 d5
```

## Mating material

With so little room, which material can still force mate? We checked every position of the basic endings with an exhaustive retrograde solver written independently of the engine.

> **Established:** king and queen against king, and king and rook against king, are wins from every legal position with the stronger side to move. The longest forced mate takes **8 moves** with the queen (10 on 8×8) and **14 moves** with the rook (16 on 8×8).

> **Established:** king and two bishops (on opposite colours) against king is a forced win. The longest forced mate takes **16 moves** (19 on 8×8).

> **Established:** king, bishop and knight against king is a forced win only with the **dark-squared** bishop (99.3% of positions; longest mate 21 moves, against 33 on 8×8). With the light-squared bishop it is a draw except in a handful of positions where the king is already trapped. All four corners of the 7×7 board are dark, and a lone king can only be mated by B+N in a corner of the bishop's colour.

> **Established:** king and knight against king, and king and bishop against king, are dead draws. King and two knights cannot force mate either, except in rare positions where the defending king is already trapped.

So the small board makes bishop and knight against king *much* easier than in chess, at most 21 moves against 33, but only if you kept the right bishop. See the Endgames chapter.

## The exchange and other trades

Rook for minor piece ("the exchange") is worth about a pawn and a half in the engine's view. As in chess, the exchange counts for more as the board empties: with only seven files, an open file is reached in two or three moves and a rook dominates the endgame.

> **Hypothesis:** queen against two rooks favours the rooks slightly in SEVEN, because the queen has lost 15% of its mobility, and the rooks find open files quickly on a seven-file board.

> **Hypothesis:** a rook and two connected passed pawns are usually stronger than two minor pieces in the endgame, because the pawns need only four or five moves to promote.

## Pawns: fewer, closer, faster

Each side has seven pawns, and every one is close to promotion. A pawn on its fifth rank (rank 5 for White) is two steps from queening. A passed pawn in SEVEN is therefore worth more than its nominal 1.0, and the engine raises the pawn value from 88 to 115 as the game goes on for exactly this reason.

## Summary

- Use **1–3–3–5–9**, but expect the dark-squared bishop to beat a knight in open positions and the knight to hold its own in closed ones.
- The **bishop pair is the default**. Avoid giving it away for nothing.
- **King-shelter pawns** count for more than ordinary pawns.
- All the standard mates are forced, and **shorter** than on 8×8.

```exercise
id: material-win-the-exchange
level: 1
fen: 6r/4Npk/4n1p/p5P/P4P1/1P5/K2R3 w - - 4 34
prompt: White to move. Which capture wins material?
solution: Nxg7 Kxg7
explanation: The knight takes the rook on g7. The king recaptures, but White has given a knight (about 3) for a rook (about 5) and wins the exchange.
```
