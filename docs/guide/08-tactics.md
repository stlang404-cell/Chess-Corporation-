# Tactical Patterns

Tactics are the same in every chess variant: forks, pins, skewers, discovered attacks, overloaded defenders. What changes is *where* they appear and *how often*. On a 7×7 board lines are short, pieces are always close together, and most tactics are just one or two moves deep. This chapter goes through the patterns and shows how SEVEN's geometry shapes each one.

> **Established:** with 49 squares and up to 28 pieces, the starting board is 57% occupied (chess: 50%). Pieces stand closer together, and a single move attacks more targets.

## Forks

### The knight fork

The lone knight is SEVEN's most dangerous forking piece. It barely loses mobility on the small board, and every enemy piece is within a few knight moves. The classic target is king and queen.

```seven
fen: r3k2/pq3pp/7/7/2N4/P4PP/3R2K w - - 0 1
caption: From d5 the knight would attack c7, e7, b6 and f6, hitting the king on e7 and the queen on b6.
highlight: d5 e7 b6
arrows: c3d5
```

```exercise
id: tactics-knight-fork
level: 2
fen: r3k2/pq3pp/7/7/2N4/P4PP/3R2K w - - 0 1
prompt: White to move and win the queen.
solution: Nd5+ Kf7 Nxb6
explanation: Nd5+ forks the king on e7 and the queen on b6. The king must move, and the knight takes the queen.
```

> **Hypothesis:** the square in front of the enemy king's starting square (d5/d3 when the king is on e7/e1) is the critical fork square in SEVEN. A knight landing there attacks four of the king's neighbouring squares at once.

### The pawn fork

On the contact rank, a pawn advancing one square attacks two squares on the next rank. Pieces placed with one empty square between them on that rank are a standing invitation (see the Mirror Fork exercise in the Opening Principles chapter).

### The queen fork

The queen covers so much of a 49-square board that almost any check also attacks something else. Before every queen check, ask what *else* the queen hits from its new square.

## Pins

### Pins on the dark diagonals

Both kings start on e-file dark squares, and the most natural square for a dark-squared bishop is **b4**:

- White's bishop on b4 looks along c5–d6–e7, at Black's king.
- Black's bishop on b4 looks along c3–d2–e1, at White's king.

> **Established:** a dark-squared bishop on b4 pins any piece standing on d6 (for Black) or on d2 or c3 (for White) against the uncastled king. Black's knight often goes to d6 (via b7–d6) and White's to d2 or c3, so these pins come up constantly. Bb4+ (or ...Bb4+) is a common check in the opening.

### Pins on the files

When the d-file or e-file opens with a king still on e1 or e7, a rook or queen can pin a piece to the king. Then a *pawn* attacking the pinned piece usually wins it (see the Pin and Push exercise in the Pawn Structures chapter).

## Skewers

A skewer is a pin the other way round: the more valuable piece is in front. On a seven-file board kings and rooks often share a rank or file, and the long diagonals line up the king with the far corner, so skewers are frequent. You met the long-diagonal skewer in the Geometry chapter.

> **Hypothesis:** in rook endgames, a skewer along the third or fifth rank (king and rook on the same rank) is the most common tactical blunder. The board is too narrow for the king to hide from a rook that changes ranks.

## Discovered attacks

A piece moving off a line can reveal an attack by the piece behind it. On a small board the revealing piece often captures something too.

```exercise
id: tactics-discovered-check
level: 2
fen: r5k/p3p1p/1q5/3N3/7/PB3PP/6K w - - 0 1
prompt: White's bishop on b2 is aimed at the black king, but its own knight is in the way. White to move and win material.
solution: Nxb5+ Kf7 Nxa7
explanation: The knight takes the queen and at the same moment uncovers check from the b2-bishop along the long diagonal. Black has to deal with the check, and the knight escapes with a whole queen, then takes the rook as well.
```

## Captures with check, and in-between moves

Because everything is close together, many exchanges can be **interrupted** by a capture with check. Before automatically recapturing, look for an in-between move (*zwischenzug*).

```exercise
id: tactics-zwischenzug
level: 3
fen: r1b2kr/1pp1bp1/p2P2p/3n2P/P1N1B2/1P3P1/3RKBR w K - 1 15
prompt: Black's knight on d4 is attacked, but so is White's d5-pawn. White to move and win two pieces.
solution: dxe6+ Kxe6
explanation: The pawn takes the bishop on e6 with check, so Black has no time to save the knight. After the king recaptures, the knight on d4 is still hanging, and White collects it next (for example 2.Bc4+ Ke7 3.Bxd4). Two pieces for a pawn.
```

## Forks with the black pieces

The same patterns work for the second player. Here Black's knight jumps into White's position with check.

```exercise
id: tactics-black-knight-fork
level: 2
fen: r4kr/1N2bp1/p5p/3n2P/PP5/3K1P1/3R1BR b - - 0 19
prompt: Black to move. Find the fork.
solution: Nf3+ Ke3 Nxg1
explanation: Nf3+ checks the king on d2 and attacks the rook on g1. After the king moves, the knight takes the rook.
```

## Removing the guard

Sometimes the fork square or the check square is covered by an enemy piece, or an enemy piece could block the check. Take that piece first, even at the cost of material.

```exercise
id: tactics-remove-the-blocker
level: 4
fen: 5Q1/7/6k/4rpp/5n1/7/2K2R1 w - - 6 48
prompt: White to move and win decisive material. Qd5+ would fork king and rook if the knight on f3 could not block on e5.
solution: Rxf3 gxf3 Qd5+ Kg4 Qxe4
explanation: 1.Rxf3! removes the knight. After 1...gxf3 the queen forks along the fifth rank and the e4 diagonal: 2.Qd5+ and 3.Qxe4. White gives a rook for a knight but wins a whole rook back.
```

## Mating nets with checks

When the enemy king is in the open, a sequence of checks often builds a net.

```exercise
id: tactics-mate-in-two
level: 3
fen: 6Q/3R3/5k1/5pp/3n3/2K4/4r2 w - - 16 53
prompt: White to move and mate in two.
solution: Qg6+ Ke5 Qe6#
explanation: Qg6+ forces the king to e5. Then Qe6#, protected by the rook on d6. The queen covers d5, f5, f6 and e4 (through the king's own square), and the rook covers d4 and d5.
```

## Stopping a passed pawn with tempo

On a seven-rank board a pawn on the sixth rank is one step from promotion. The defender often has to stop it with a check first.

```exercise
id: tactics-check-then-capture
level: 3
fen: 7/1P3pk/6p/7/r4n1/7/1K1R3 b - - 1 39
prompt: Black to move. White's b-pawn is one step from queening. Deal with it, and keep your extra material.
solution: Rb3+ Kc2 Rxb6
explanation: The rook reaches the b-file with check, so White has no time to push the pawn. After the king moves, the rook takes the pawn from behind and Black keeps the extra knight. On a seven-rank board a pawn on the sixth must be dealt with immediately.
```

## The hanging-piece scan

Most points in SEVEN are lost, as in chess, by simply leaving pieces unprotected. On this board every piece is inside an enemy piece's range much sooner than you expect.

```exercise
id: tactics-loose-rook
level: 1
fen: 7/3Q1pk/7/6p/3r1n1/1K5/5R1 w - - 4 44
prompt: White to move. Take the free piece with the most forcing move.
solution: Qxd3+
explanation: The rook on d3 is unprotected, and taking it with the queen also gives check along the d3–g6 diagonal.
```

## Summary

- **Knight forks** on the square in front of the enemy king are the signature SEVEN tactic.
- **b4** is the dark bishop's pinning square for both sides.
- Look for **in-between checks** before every recapture.
- A pawn on the sixth rank (third for Black) forces the defender to act **now**, often with a check.
