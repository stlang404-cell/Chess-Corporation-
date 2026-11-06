# King Safety

On a board where the enemy pawns start three ranks away and a queen crosses the board in one move, king safety is never a later problem. This chapter describes where the king is safe in SEVEN, what attacks it, and which mating patterns follow from the board's shape.

## The king in the centre

At e1 the king has three problems:

1. **It is the only defender of f2.** Any attack on f2 is an attack on a pawn defended once.
2. **It is the only defender of the queen.** If the d-file opens, Qxd1+ (or Qxd7+) forces the king to recapture and give up castling.
3. **It stands on the e-file**, which opens as soon as the e-pawns are exchanged. With so few pieces between the rooks and the king, an open e-file means an immediate check.

> **Hypothesis:** leaving the king in the centre past move 8 or so in an open position is usually a serious mistake in SEVEN, more so than in chess, because every line to it is short.

## The short-castled king

After O-O the king sits on g1 behind two pawns, f2 and g2, with the rook on f1. There is no h-pawn. The shelter is half the size of chess's three-pawn shelter.

```seven
fen: rnbq1rk/ppppbpp/4p2/7/4P2/PPPPBPP/RNBQ1RK w - - 4 4
caption: Both kings castled short. Each sits at the end of a long dark diagonal: g1 on a7–g1, g7 on a1–g7.
highlight: a7 b6 c5 d4 e3 f2 g1 a1 b2 c3 e5 f6 g7
```

> **Established:** g1 is the end square of the long diagonal a7–g1, and g7 the end square of a1–g7. A short-castled king always sits on a seven-square dark diagonal. The enemy's dark-squared bishop or queen on that diagonal is aimed straight at it, with only the f2 (or f6) pawn in the way.

> **Established:** the long-castled king on c1 (or c7) is *not* on a long diagonal. Its diagonals run only to a3 and to g5.

> **Hypothesis:** the defender's dark-squared bishop is therefore the most important defensive minor piece after short castling. Keep it, and keep the f-pawn on f2 (f6 for Black) as long as possible, since that pawn blocks the long diagonal.

The engine agrees that shelter pawns count for more. Removing Black's g6-pawn from a castled position was worth +1.53 to White, against +0.97 for the d-pawn (see the Material chapter).

## Luft and the back rank

With only two pawns in front of the king, the classic back-rank mate is everywhere. A rook or queen reaching the first rank (or the seventh, against Black) mates if the king has no flight square.

```exercise
id: king-back-rank
level: 1
fen: 6k/5pp/p6/7/1n5/Pb3PP/3R2K w - - 0 1
prompt: White to move and mate in one.
solution: Rd7#
explanation: Black's king on g7 is boxed in by its own pawns on f6 and g6. Rank 7 is Black's back rank, and nothing can block the check or capture the rook.
```

The cure is the same as in chess: a pawn move that gives the king a flight square ("luft"). In SEVEN there are only two candidates, and both have costs:

- **g3 (or ...g5)** gives the king g2 but loosens the long diagonal, since the f2-pawn then stands alone in front of the king.
- **f3 (or ...f5)** gives the king f2 but opens the a7–g1 diagonal straight to the king.

> **Hypothesis:** the better luft is usually **g3**. It keeps f2 in place as a blocker on the long diagonal, and it can be supported by the f1-rook from behind. Play f3 only when the enemy's dark-squared bishop has gone.

## The pawn storm arrives fast

The enemy g-pawn reaches g3 in two moves: ...g4 (a double step) and ...g3. At that point it attacks f2 (and h2, which does not exist). This is the idea of the Hook opening.

> **Established:** a double step and a single step bring a pawn from its home square to the third rank of the enemy's side. In SEVEN a pawn storm can strike the castled king's shelter by move 2.

The general defensive rule: **do not open the file the storming pawn wants opened.** Meeting ...g3 with f3, keeping the pawn locked on g3, is better than fxg3, which opens the f-file in front of your own king (see the Hook in the Opening Systems chapter).

## Mating patterns of the small board

### The smothered corner

After short castling the black king on g7 has the rook on f7 beside it and pawns on f6 and g6 in front. If those squares stay occupied, a knight check on e6 can be mate, because the king's own pieces fill every flight square.

```exercise
id: king-smothered-corner
level: 2
fen: b4rk/5pp/2N4/q6/7/5PP/3Q2K w - - 0 1
prompt: White to move and mate in one.
solution: Ne6#
explanation: The knight checks from e6. The king's three neighbouring squares, f7, f6 and g6, are filled by its own rook and pawns, so it cannot move, and nothing can capture the knight.
```

### The Arabian corner

A rook on the g-file next to the king, protected by a knight, mates when the knight also covers the last flight square.

```exercise
id: king-arabian-corner
level: 1
fen: 1r4k/R6/4N1p/7/7/PP2q2/2K4 w - - 0 1
prompt: White is under pressure, but it is White's move. Mate in one.
solution: Rg6#
explanation: The rook swings along the sixth rank to g6, protected by the knight on e5. The knight also covers f7, and the rook covers f6, so the king on g7 has nowhere to go.
```

### The long-diagonal fork

Because the castled king sits on a long diagonal, a queen arriving on d4 (or d5 against a king on g1) often gives check *and* attacks something on the other wing. The same line runs from the king through the centre to the far corner.

```exercise
id: king-long-diagonal-fork
level: 2
fen: rb4k/6p/p6/7/7/P4PP/3Q2K w - - 0 1
prompt: White to move and win material.
solution: Qd4+ Kf7 Qxa7
explanation: From d4 the queen checks the king on g7 along the a1–g7 diagonal and attacks the rook on a7 along the a7–g1 diagonal. Both long diagonals cross at d4.
```

## Mating attacks in practice

The patterns combine. Here a queen, rook and bishop finish off a king that has lost its shelter.

```exercise
id: king-mate-in-three
level: 4
fen: 3r3/4k2/1p2pb1/1q2B1p/1r1PP1P/5Q1/2R3K w - - 2 26
prompt: White to move and mate in three.
solution: Qxf5+ Ke7 Qxe5+ Kf7 Rf1#
explanation: The queen first takes the f5-bishop with check, then the e5-pawn with check, driving the king to f7. Then the rook swings to f1. The queen covers e7, f6 and g7, the bishop on e4 covers g6, and nothing can block the f-file.
```

## Summary

- The **f-pawn** blocks the long diagonal in front of the short-castled king. Keep it there.
- The defender's **dark-squared bishop** guards the king's colour complex.
- **Back-rank mates** are very common, because only two pawns shelter the king.
- Meet a pawn storm by keeping files closed, not by capturing.
- Learn the small-board patterns: smothered corner, Arabian corner, long-diagonal fork.
