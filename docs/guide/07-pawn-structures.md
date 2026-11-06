# Pawn Structures

Seven pawns a side, three empty ranks, and promotion five steps away. SEVEN's pawn structures are simpler than chess's, because there are fewer pawns. They are also more brittle, because every pawn is close to contact. This chapter covers the structures you will meet most often and how to handle them.

## Contact, tension and levers

A **lever** is a pawn move that attacks an enemy pawn and offers an exchange. In SEVEN almost every pawn move to rank 4 (or ...rank 4 for Black) is a lever or prepares one.

> **Established:** two pawns on adjacent files, one on rank 4 and one on rank 5, attack each other. Whoever captures first changes the structure. The other side chooses the recapture.

Rules of thumb for tension:

- **Keep tension** when your opponent's capture would improve your structure, for example by opening a file for your rook or bringing a pawn to the centre.
- **Release tension** when your opponent threatens to capture in a way that gives them the better recapture, or when the capture gains a tempo.
- **Recapture towards the centre.** After 1.d4 c5 2.dxc5, the engine rates 2...bxc5 (bringing a pawn towards the centre) as clearly better than 2...dxc5, which also opens the dangerous d-file.

## The Cross structure

After 1.d4 c5 2.e3 cxd4 3.exd4 d5 the pawns stand:

- **White:** a2, b2, c2, d4, f2, g2. The e-file is half open.
- **Black:** a6, b6, d5, e6, f6, g6. The c-file is half open.

```seven
fen: rnbqkbr/pp2ppp/3p3/3P3/7/PPP2PP/RNBQKBR w KQkq - 0 4
caption: The Cross structure after 1.d4 c5 2.e3 cxd4 3.exd4 d5. Each side has a half-open file pointing at the other's king side or queen side.
highlight: d4 d5 e2 c6
```

> **Hypothesis:** in the Cross structure White's plans are Re1 or Qe2 on the half-open e-file and a knight on e5 via d2–f3 or c3–e2–f4. Black's are ...Rc7 on the half-open c-file and pressure on c2. The blocked d-pawns mean the queens are *not* in danger of an early exchange.

## The isolated pawn

When a pawn has no friendly pawn on either neighbouring file it is **isolated**. In SEVEN an isolated pawn on d4 controls the key squares c5 and e5, and it cannot be supported by another pawn.

> **Hypothesis:** an isolated d-pawn is a middlegame strength (space, outposts on c5 and e5) and an endgame weakness (a fixed target only a few files from both enemy rooks). The short board makes the endgame weakness bite sooner: the enemy king reaches d5 quickly.

## Pawn chains are short

A diagonal chain such as c3–d4 or b2–c3–d4 has at most three links before it hits the enemy's pawns. Its base, the rearmost pawn, is the target.

> **Established:** a chain whose front pawn stands on rank 4 is in contact with the enemy pawns on rank 5 or 6 at once. There is no room for a "long" chain in SEVEN.

> **Hypothesis:** attack the base of the chain, as in chess, but expect the fight to be settled within a few moves. The time between creating a chain and seeing it broken is very short.

## The g3 bone

When Black's Hook pawn reaches g3 and White answers f3 (keeping the f-file closed), a black pawn sits in White's camp, two steps from promotion.

```seven
fen: rnbqkbr/pppppp1/7/P2P3/5Pp/1PP1P1P/RNBQKBR b KQkq - 0 3
caption: The g3 bone after 1.d4 g4 2.a4 g3 3.f3. Black's pawn cramps White's kingside but can also become a target.
highlight: g3 f2 f3
```

> **Hypothesis:** if White can attack the g3-pawn with pieces (Bf4, Qe1, Rg1) it becomes a weakness. If Black can support it with ...Bf4 or ...Rg-file pressure, it becomes a permanent wedge against White's short castling. White often castles long, or leaves the king in the centre, in these lines.

## Passed pawns

A passed pawn is far stronger in SEVEN than in chess:

- From rank 4 it needs three steps to promote (rank 5, 6, 7).
- From rank 5 it needs only two steps.
- From rank 6 it needs one, and the defender often has to give up a piece for it.

> **Established:** a passed pawn that reaches the sixth rank (the third for Black) is one move from promotion. A rook behind it, or a king beside it, usually decides the game.

### The outside passed pawn

On a seven-file board the a- and g-files are the "outside" files. A passed pawn there drags the enemy king to the edge while your king goes the other way.

```exercise
id: pawns-outside-passer
level: 3
fen: 7/5pp/4k2/P6/4KP1/6P/7 w - - 0 1
prompt: White to move. Which move uses the outside passed pawn most effectively?
solution: a5
explanation: The a-pawn runs at once. From a5 it needs only two more steps, and Black's king on e5 cannot get back in time. Calm king moves give Black time to activate the kingside pawns.
```

### Breakthrough

Three pawns against three on adjacent files, with an empty rank between them, can be broken open by a sacrifice. The same geometry works in chess, but in SEVEN the pawns start closer to their goal.

```exercise
id: pawns-breakthrough
level: 4
fen: 7/ppp4/6k/PPP3p/6P/6K/7 w - - 0 1
prompt: White to move and create an unstoppable passed pawn.
solution: b5 axb5 c5 bxc5 a5
explanation: 1.b5 attacks both a6 and c6. After 1...axb5 2.c5! bxc5 3.a5 the a-pawn is two steps from queening, and Black's king on g5 is far too far away. If 1...cxb5, 2.a5 bxa5 3.c5 wins in the same way.
```

## Pawns and pins

Pawns are the cheapest attackers. A pinned piece attacked by a pawn is usually lost.

```exercise
id: pawns-pin-and-push
level: 2
fen: 3k2r/p2n1pp/7/2P4/7/P4PP/3R2K w - - 0 1
prompt: The knight on d6 is pinned against the king by the rook on d1. White to move wins material.
solution: c5
explanation: The pawn attacks the pinned knight. Moving the king off the d-file does not save it, because the knight is still attacked. White wins a piece for a pawn at least.
```

## Summary

- Every pawn move creates contact. Decide whether to keep or release the tension.
- **Recapture towards the centre**, and keep the d-file closed while the queens are protected only by the kings.
- Chains are short. Strike their base early.
- Passed pawns are worth more than in chess. **Outside passers** and **breakthroughs** win endgames.
