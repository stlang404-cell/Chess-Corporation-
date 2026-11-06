# Endgames

The endgame is where SEVEN differs most from chess, and where exact knowledge is easiest to come by. With few pieces on 49 squares, positions can be solved completely. For this guide we wrote a retrograde solver, independent of the playing engine, and solved the basic mates outright. Everything marked *Established* in the first half of this chapter comes from that solver or from engine verification.

## King and queen against king

> **Established:** king and queen against king is a win from every legal position with the queen's side to move. The longest forced mate is **8 moves** (10 on 8×8).

```seven
fen: K4Q1/7/7/7/4k2/7/7 w - - 0 1
caption: One of the hardest KQ-vs-K positions on the 7×7 board: mate in 8 with best play. The kings start far apart and the defending king is in the centre.
highlight: a7 e3
```

The technique is the same as in chess. Restrict the king with the queen, a knight's move away, until it is on the edge, then bring your own king in. Two dangers are greater on the small board:

- **Stalemate.** A king in the corner has only three neighbouring squares. A careless queen move takes all three.
- **Short distances.** Your king is never more than six moves from anywhere, so be patient. The mate is rarely more than a few moves away.

```exercise
id: endgame-kq-mate-in-two-a
level: 3
fen: 5k1/7/7/6K/7/7/4Q2 w - - 0 1
prompt: White to move and mate in two.
solution: Kg5 Kg7 Qe7#
explanation: The quiet king move takes f6 and g6 away from the black king, and the queen already holds the e-file. Black's only move is Kg7, and Qe7# mates along the seventh rank. There is no h-file to escape to.
```

```exercise
id: endgame-kq-mate-in-two-b
level: 3
fen: 7/7/6k/7/4K2/Q6/7 w - - 0 1
prompt: White to move and mate in two.
solution: Qf7 Kg4 Qg6#
explanation: Qf7 takes f5, f6 and g6 away, and the white king on e3 covers f4, so the black king's only square is g4. Then Qg6# follows, with the king on e3 covering f3 and f4.
```

```exercise
id: endgame-kq-avoid-stalemate
level: 3
fen: 7/7/2K4/7/7/3Q3/k6 w - - 1 75
prompt: White to move and mate in three. Careful: it is easy to stalemate the king on a1.
solution: Kd4 Kb1 Kc3 Ka1 Qb2#
explanation: The king walks in while the queen keeps the black king on a1–b1. Kd4 leaves Black only b1, and Kc3 leaves only a1, so there is never a stalemate, and Qb2# finishes.
```

## King and rook against king

> **Established:** king and rook against king is a win from every legal position with the rook's side to move. The longest forced mate is **14 moves** (16 on 8×8).

```seven
fen: R6/7/7/7/3K3/6k/7 w - - 0 1
caption: A 14-move KR-vs-K mate, the longest on the 7×7 board. The defending king is near the corner but White's king and rook are badly placed.
highlight: a7 g2
```

Use the **box method**. The rook cuts the king off along a file or rank, your king approaches, and the box shrinks one line at a time. With the rook on a central line (the d-file or the fourth rank), the first box is no bigger than 3×7 squares, so the whole procedure takes only a few steps.

```exercise
id: endgame-kr-mate-in-three-a
level: 4
fen: 3k3/7/7/4K1R/7/7/7 w - - 0 1
prompt: White to move and mate in three.
solution: Kd5 Kc7 Rb4 Kd7 Rb7#
explanation: Kd5 takes c6, d6 and e6 away, leaving Black's king to shuttle along the seventh rank. After 1...Kc7 the rook cuts off the b-file with 2.Rb4. The king has to return to d7, opposite White's king, and 3.Rb7# mates on the seventh rank.
```

```exercise
id: endgame-kr-mate-in-three-b
level: 4
fen: 7/3R3/7/4K2/7/6k/7 w - - 0 1
prompt: White to move and mate in three.
solution: Ke3 Kf1 Rg6 Ke1 Rg1#
explanation: Ke3 takes f2, f3 and f4 away. If 1...Kg3, 2.Rg6 is mate at once. The best defence, 1...Kf1, is met by the waiting move 2.Rg6, which takes the g-file. After 2...Ke1 forced, 3.Rg1# mates on the back rank.
```

## Bishops and knights

> **Established:** king and two bishops against king, with the bishops on opposite colours, is a forced win from 99.9% of legal positions with White to move. The exceptions are immediate captures and stalemates. The longest forced mate takes **16 moves** (19 on 8×8). Two bishops of the same colour can never mate.

> **Established:** king, **dark-squared** bishop and knight against king is a forced win from 99.3% of legal positions with White to move. The exceptions are immediate captures and stalemates. The longest forced mate takes **21 moves** (33 on 8×8). With the **light-squared** bishop, only 0.1% of positions are wins, all of them mates in one or two where the king is already trapped. As in chess, mate is forced in a corner of the bishop's colour, and **every corner on the 7×7 board is dark**.

> **Established:** king and two knights against king cannot force mate. Our solver found forced wins only in positions that are already mate in one.

The bishop-and-knight result is the most surprising fact in this chapter. In chess, B+N always has a pair of corners to mate in, whatever the bishop's colour. In SEVEN, the same ending is a win with the dark-squared bishop and a draw with the light-squared one.

> **Hypothesis:** this is one more reason to keep the dark-squared bishop. Trading it can turn a won minor-piece ending into a draw.

### The wrong bishop

> **Established:** a rook pawn promotes on a7 or g7 (for Black, a1 or g1), and all four of those squares are dark. The light-squared bishop can never control the queening square of a rook pawn.

> **Hypothesis:** as in chess, king + light-squared bishop + rook pawn against a king that reaches the corner is a draw: the defending king sits on the corner square and can only be stalemated, never driven out. The SEVEN engine does not recognise this fortress and still scores such positions as clearly winning, so do not trust its evaluation here.

```seven
fen: k6/7/P6/2K4/3B3/7/7 b - - 0 1
caption: The wrong bishop. White's bishop is light-squared, the queening square a7 is dark, and Black's king has reached it. Expected result: a draw.
highlight: a7 d3
```

## King and pawn against king

Pawn endings on 7×7 follow the chess rules of **opposition** and **key squares**, shifted down one rank because the board is one rank shorter.

> **Hypothesis:** a pawn on rank 2 or 3 (White) has its key squares two ranks ahead. For a pawn on d2 they are c4, d4 and e4; for a pawn on d3, c5, d5 and e5. If White's king reaches a key square, the pawn promotes whatever Black does. These are the chess rules applied to the shorter board. They agreed with the engine in every position we tested, but we have not checked them exhaustively.

```exercise
id: endgame-opposition-win
level: 3
fen: 7/7/3k3/7/4K2/3P3/7 w - - 0 1
prompt: White to move and win. The pawn's key squares are c4, d4 and e4.
solution: Kd3
explanation: Kd3 takes the opposition. Black must give way: ...Kc5 allows Ke4, and ...Ke5 allows Kc4, both key squares. Pushing the pawn first throws the win away: the engine scores 1.d4 as a draw, and 1.d3 as far weaker than 1.Kd3.
```

```exercise
id: endgame-opposition-defend
level: 4
fen: 3k3/7/7/4K2/3P3/7/7 b - - 0 1
prompt: Black to move. Only one move saves the game.
solution: Ke6
explanation: Black must take the opposition at once. Ke6 stops White's king from reaching d5, e5 or f5. Any other move lets the king onto a key square of the d3-pawn (c5, d5 or e5) and White wins.
```

```exercise
id: endgame-shouldering
level: 5
fen: 7/7/5K1/2k4/7/3P3/7 w - - 0 1
prompt: White to move and win. Only one move does it.
solution: Ke4
explanation: The king steps in front of its pawn's path and "shoulders" Black's king away from d4 and d5. After 1...Kc5 2.Ke5 the black king is kept out, and the pawn walks home. The engine scores every other move as a draw, because they let Black's king reach d4 or d5.
```

Two more pawn-ending facts are special to SEVEN:

- **The double step is a tempo weapon.** A pawn still on its starting rank can choose between one step and two. That flexibility often decides who gets the opposition. Before pushing, count which version leaves the *opponent* to move in the critical position.
- **Stalemate comes fast.** With the king defending in front of a pawn on the sixth rank, a single careless king move can stalemate. In the position king g5, pawn f6 against king f7, the "natural" Kf5? is stalemate at once.

```exercise
id: endgame-escort-the-pawn
level: 3
fen: 7/4kP1/6K/6P/7/7/7 w - - 1 56
prompt: White to move. Find the quickest win. The f-pawn is one step from queening.
solution: Kg6
explanation: The king steps up beside its pawn. It covers f7 and g7 and keeps protecting f6. Black's king cannot get in front of the pawn, and the pawn promotes on f7 next move. The engine rates Kg6 more than eight pawns better than any other move.
```

## Bishop endings

With bishops of the **same colour**, the defender's bishop fights for the queening path. The attacker's technique is to **interfere**, putting their own bishop on the line the defending bishop uses.

```exercise
id: endgame-bishop-interference
level: 5
fen: 7/1K5/2P4/5k1/1B5/6b/7 w - - 10 42
prompt: White to move and win. Black's bishop on g2 controls c6, the pawn's next square.
solution: Ba4
explanation: White heads for c6 by way of a4, to block the long light diagonal. After 1.Ba4 Bf3 2.Bc6 Black's bishop is cut off. It has to give up the diagonal, and the pawn advances. The direct 1.Bd5? is met by 1...Bxd5 and the pawn alone cannot win.
```

> **Hypothesis:** with **opposite-coloured** bishops, the drawing tendency is even stronger than in chess. The defending bishop can usually blockade on a square two steps ahead of the pawn, and on a seven-file board there is little room to create a second passed pawn far enough away.

## Rook endings

Rook endings are the most common endings in engine self-play, as in chess. The ideas carry over, adapted to the short board:

> **Hypothesis:** the **Philidor defence** works in SEVEN. With the defending king on the queening square, the defending rook holds the attacker's fifth rank (the sixth rank on 8×8) until the pawn advances, then checks from behind. The board's shortness leaves the attacker even less room to hide from the checks.

> **Hypothesis:** the **Lucena** winning method (building a bridge with the rook to shelter the king from checks) also works, but the bridge must be built on the fourth rank rather than the fourth from the top. Test this in your own analysis before relying on it.

> **Hypothesis:** an extra pawn in a rook ending is a stronger advantage than in chess. With only seven files, the defending rook has fewer squares from which to check the king from a safe distance.

## Summary

- **KQ vs K** (8 moves at most) and **KR vs K** (14 moves at most) are forced wins. Avoid stalemate in the corners.
- **B+N vs K** wins only with the **dark-squared bishop**. **Two knights** cannot force mate.
- The **light-squared bishop** can never help a rook pawn queen.
- **Opposition and key squares** work as in chess, shifted one rank down.
- **Double steps** and **stalemate** are the two tactical surprises of SEVEN pawn endings.
