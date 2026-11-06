# Combinations, Sacrifices and Defence

A combination is a forcing sequence, usually beginning with a sacrifice, that changes the position by force. The previous chapter catalogued the building blocks. This chapter is about putting them together, and about the other side of the coin: how to defend when your opponent is the one combining.

## Why combinations are short in SEVEN

> **Established:** in the positions mined from engine self-play for this guide, most decisive tactics were one to three moves deep. The longest forced mates we found were four moves.

There are two reasons. Pieces are close together, so a sacrifice quickly reaches its target. And with fewer pieces, there are fewer defenders to bring over. In practice this means you can and should calculate combinations **to the end**. They rarely run deeper than you can see.

## Calculating a forcing line

Use the classical order: **checks, captures, threats**. On a 7×7 board checks are especially powerful, because a checked king has at most a handful of squares to go to, and often only one.

```exercise
id: combo-promotion-mate
level: 4
fen: 5k1/1P3p1/6p/7/r4n1/1K5/3R3 w - - 2 40
prompt: White to move and mate in four.
solution: b7=Q+ Kg6 Qe4+ f5
explanation: The pawn queens with check, and every following move is a check. Qe4+ forces ...f5, and then Rd6+ drives the king to g7, and a queen mates on the seventh rank (for example Qb7#), with the rook on d6 covering g6 and f6.
```

## The decoy and the deflection

A **decoy** lures a piece onto a bad square. A **deflection** lures a defender away from its duty. The Remove-the-Blocker exercise in the Tactics chapter was a deflection: the rook took the knight that would have blocked the queen's check.

> **Hypothesis:** the most common defender to deflect in SEVEN is the **king itself**, which at the start defends both the queen and the f-pawn. A check that drags the king to one of those squares often wins the other.

## Bringing in the last piece

The best combinations use every piece. A move that does not capture or check but brings one more attacker into play can be the strongest. On a small board one extra attacker usually decides. In Game 1 of the Annotated Games chapter, 16.Bg4 (bringing the last minor piece into the attack) took the engine's evaluation to about +1.9.


## Sacrifices on f2 and f6

f2 is defended only by the king at the start, and after short castling it is the pawn that blocks the long diagonal to g1. A sacrifice there, by a bishop or knight, aims to drag the king out or open the a7–g1 diagonal.

> **Hypothesis:** an early piece sacrifice on f2 (or f6) is sound only when the queen can follow up with check on the long diagonal or on the e-file. Without that follow-up, the king is safe enough on f2 and the sacrifice fails. The board is small, but not *that* small.

## Defensive technique

Defending in SEVEN is about four things: **counting**, **simplifying**, **using the draw rules** and **counter-attack**.

### Count the attackers

Before reacting to a threat, count attackers and defenders on the key square. The short board means a piece can usually be brought over to defend in a single move.

### When two pieces are attacked, capture first

If two of your pieces are hanging at once, often the best defence is to take something yourself.

```exercise
id: defence-capture-first
level: 3
fen: 6k/1pp2p1/3q1B1/p2p3/b6/1n3PP/2B1Q1K w - - 2 22
prompt: Black's queen attacks the bishop on f5. Black's knight on b2 is attacked by the bishop on c1, and Black's bishop on a3 defends it. White to move and limit the damage.
solution: Bxb2 Qxf5 Bxa3
explanation: White gives up the f5-bishop but takes both of Black's minor pieces in return. Retreating the f5-bishop leaves White a piece down. The engine scores the alternatives about 3.3 pawns worse.
```

### Trade into endgames you can hold

The queen is the attacking piece. Trading queens kills most attacks, and in SEVEN it is often easy to force: the queens start on the same file, and there are few pieces to get in the way. The d-file exchange that hurts the side whose king must recapture (see Opening Principles) can be a *defensive* resource later, once your king is safe.

### Use the draw rules

SEVEN has three rules a defender should know by heart:

- **Stalemate is a draw.** On a small board the defending king runs out of squares quickly, and so it is easy to *be* stalemated. Look for a sacrifice that leaves you with no legal move.
- **Threefold repetition is automatic.** A perpetual check needs only three repetitions, and nobody has to claim it.
- **80 plies without a capture or pawn move** is a draw. If your opponent cannot make progress, they will run out of time on this count.

```seven
fen: k1K4/7/4R2/6q/1Q5/7/7 b - - 0 1
caption: Black is a rook down. But the black king on a7 has only three neighbouring squares, and White's king already covers two of them.
highlight: a7 a6 b6 b7
```

```exercise
id: defence-stalemate-sacrifice
level: 4
fen: k1K4/7/4R2/6q/1Q5/7/7 b - - 0 1
prompt: Black to move and save the game.
solution: Qc4+ Qxc4
explanation: Black offers the queen with check. If White takes it, Black's king on a7 has no legal move and is not in check: the white king on c7 covers b6 and b7, and the queen on c4 covers a6. Stalemate. Blocking with Rc5 does not help either, and the engine finds no way for White to avoid the draw.
```

### Counter-attack with checks

A rook or queen giving checks from long range is the defender's best friend on an open board. Watch for checks that also *skewer*.

```exercise
id: defence-skewer-swindle
level: 3
fen: 7/QK5/7/7/3r3/5P1/6k b - - 0 1
prompt: Black is a queen down against a pawn. Black to move and draw.
solution: Rd6+ Kb7 Rxa6 Kxa6 Kxf2
explanation: The rook checks along the sixth rank and skewers the king on b6 against the queen on a6. After the king moves, Black takes the queen. The rook is lost, but Black's king then wins White's last pawn: a dead draw.
```

## The mindset

> **Established:** engine self-play under the official rules produced draws in about one game in five. Most of them were threefold repetitions. The rest were dead positions, the 80-ply rule and the occasional stalemate.

> **Hypothesis:** in human play the small board's stalemate tricks, perpetual checks and skewers save more bad positions than in chess. Before resigning, look for all three.

```exercise
id: combo-mate-in-two-pawn-cover
level: 3
fen: B2Q3/5k1/4pP1/7/p3P2/4PK1/7 w - - 1 42
prompt: White to move and mate in two.
solution: Qe6+ Kg5 Qg6#
explanation: After Qe6+ the king can only go to g5 or g7, and Qg6# follows either way, with the queen protected by the f5-pawn. Against Kg5 the e3-pawn covers f4, and the queen covers f6 and g4. There is no h-file to run to.
```
