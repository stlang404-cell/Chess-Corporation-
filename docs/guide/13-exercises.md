# Exercises

This chapter collects further exercises from every part of the book, roughly in order of difficulty. Most of them come from engine self-play games. Each was checked by the SEVEN engine (at least 300,000 nodes), and the first move of every solution is the engine's choice and clearly better than any alternative, or it forces mate.

Work through them on the board before looking at the solution. For every exercise, run through the calculation routine from the previous chapter: checks, captures and threats for both sides, then the king's flight squares, then candidate moves.

## Level 1: one move

```exercise
id: final-back-rank-file
level: 1
fen: rb4k/1p3p1/p6/P1p3p/2P3P/1PB2P1/4R1K w - - 4 22
prompt: White to move and mate in one.
solution: Re7#
explanation: The rook runs up the open e-file to Black's back rank. The f6-pawn blocks the king, and the c2-bishop covers g6.
```

```exercise
id: final-boxed-king
level: 1
fen: 6Q/3R3/4nk1/4rpp/7/2K4/7 w - - 16 53
prompt: White to move and mate in one.
solution: Rf6#
explanation: The rook checks on f6, protected by the queen. Black's own knight, rook and pawns occupy e5, e4, f4 and g4, and the queen and rook cover the rest.
```

```exercise
id: final-queen-for-free
level: 1
fen: 6r/2B1bk1/1p2pp1/1q4p/rP1PP1P/Q6/2R2RK b - - 2 22
prompt: Black to move. White's queen has been left en prise.
solution: Rxa2
explanation: The rook on a3 takes the queen on a2. Always check what your opponent's last move left undefended.
```

```exercise
id: final-knight-takes-rook
level: 1
fen: 2q1k1r/rp2bpp/p2pp2/P1pP3/4PB1/1PPnQPP/R4RK b k - 1 11
prompt: Black to move and win material.
solution: Nxf1 Qxf1
explanation: The knight on d2 takes the rook on f1. White recaptures, but Black has won the exchange.
```

## Level 2: two-step tactics

```exercise
id: final-b4-check
level: 2
fen: r2qkbr/2p4/2b1pp1/pBPp2p/3P2P/PP2PPB/R2QK1R b KQkq - 0 11
prompt: Black to move. Use the dark-squared bishop's favourite square.
solution: Bxb4+ Kf1
explanation: The c5-bishop takes White's bishop on b4 with check along the b4–e1 diagonal. White's king has to move, and Black is a piece up.
```

```exercise
id: final-open-c-file
level: 2
fen: r2qkb1/6r/1pb1pp1/p2p2p/3P2P/PP1BPPB/2RQK1R w Kq - 2 13
prompt: White to move and win a piece.
solution: Rxc5 Bxa2 Rxe5+
explanation: The c-file is open, and the rook takes the bishop on c5. If Black grabs the a2-pawn, the rook takes on e5 with check as well.
```

```exercise
id: final-rook-check-and-guard
level: 2
fen: 7/3R1pk/1P4p/r6/P4n1/7/K6 b - - 1 38
prompt: Black to move. Win a pawn and stop the b-pawn.
solution: Rxa3+ Kb2 Ra7
explanation: The rook takes the a3-pawn with check, then drops to the seventh rank, where it watches b7, the b-pawn's promotion square.
```

## Level 3: calculation

```exercise
id: final-pawn-takes-bishop
level: 3
fen: 2r3r/3qbk1/1pb1pp1/p2p2p/3PB1P/PP2PPB/1QR2RK b - - 9 16
prompt: Black to move and win material.
solution: dxe3
explanation: The d4-pawn takes the bishop on e3. White cannot recapture with the f-pawn, because 2.fxe3? opens the c5–g1 diagonal and lets Black's bishop take on e3 with check.
```

```exercise
id: final-checks-before-queening
level: 3
fen: 2q3k/5p1/1Q5/5P1/p5P/1p5/5K1 b - - 2 41
prompt: Black to move. The b-pawn is one step from queening, but 1...b1=Q? is met by Qxb1. What should Black do first?
solution: Qc1+ Ke2 Qc2+
explanation: Black drives White's king and queen away with checks before promoting. On a short board the promotion square is in range of the enemy queen almost everywhere, so gain time with checks first.
```

## Level 4: technique

```exercise
id: final-queen-fence
level: 4
fen: 4Q2/7/k6/7/7/7/1K5 w - - 0 1
prompt: White to move. Find the only move that mates in four.
solution: Qb7
explanation: The queen fences the black king onto the a-file, where it can only shuttle up and down. White's king then walks up the board, avoiding stalemate. Exhaustive analysis confirms that every other move mates at least two moves later.
```

## Level 5: deep moves

```exercise
id: final-rook-switch
level: 5
fen: 7/3R1Q1/4n2/4k1p/5p1/2K4/4r2 w - - 2 54
prompt: White to move. Black threatens ...Re2+ and ...f2. Find the move that wins.
solution: Rb6
explanation: The rook leaves the d-file to work along the sixth rank. The engine's main line is 1.Rb6 Re2+ 2.Kd1 Nc4 3.Re6+! Kd5 4.Rxe2 fxe2+ 5.Kxe2. The rook switches to the e-file with check and wins Black's rook, leaving White with queen against knight.
```

```exercise
id: final-king-walk
level: 5
fen: 7/7/7/k6/3K3/2R4/7 w - - 0 1
prompt: White to move. The rook already cuts the black king off on the a- and b-files. Find the only move that mates in five.
solution: Kc4
explanation: The king steps up to c4, two files from the black king on the same rank, so that the next rook move can take another line away. Exhaustive analysis confirms that every alternative mates at least two moves later.
```
