# Opening Principles

The chess opening rules "develop knights before bishops, control the centre, castle early" were worked out over centuries on a board with four central squares and two knights a side. Some of them carry over to SEVEN unchanged. Others have to be rewritten. This chapter sets out the principles. The next one turns them into concrete opening systems.

## Principle 1: every pawn move is a commitment

Only three ranks separate the armies, so the first pawn move nearly always produces contact or the threat of it.

- A pawn on **rank 3** (White) controls rank 4, the square where Black's pawns would land after a double step.
- A pawn on **rank 4** controls rank 5, the squares Black's pawns need for a single step.
- A pawn on **rank 5** is already attacking Black's pawns on rank 6.

> **Established:** after 1.d4, Black's c- and e-pawns cannot step to c5 or e5 without being captured. Black's natural freeing moves are a single step *onto contact*, ...c5 or ...e5, offering an exchange, or a double step on a different file.

> **Hypothesis:** SEVEN openings are about **choosing which pawn tension to create**, not about avoiding it. A move that keeps the tension, such as 1.d4 c5 2.e3, is usually better than resolving it early with 2.dxc5.

## Principle 2: develop the knight with purpose, not by reflex

In the start position White's only piece moves are 1.Na3 and 1.Nc3. "Knights first" is therefore automatic, but it is not necessarily good. In the engine's ranking of first moves (300,000 nodes), **1.Nc3 and 1.Na3 came out below every central pawn move**, about half a pawn worse than 1.d4.

> **Established:** the knight is the only minor piece that can develop before a pawn moves, but an early knight move gives the opponent a target. After 1.Nc3 d4, the knight must move again (2.Ne4) and the engine already prefers Black slightly.

> **Hypothesis:** the knight is best developed *after* the central pawn structure is decided. That usually means d2 (supporting e4 or c4) or c3 behind a d4 pawn. Treat the knight as a flexible reserve, not as an opening move.

The knight's long-term job is to reach a strong post in the inner ring, ideally a square the enemy pawns can no longer attack. Since there is only one knight, never exchange it lightly. Your opponent's bishop pair grows stronger the moment it disappears.

## Principle 3: the bishops come out through the pawns

Both bishops are locked in at the start. The c1-bishop needs the b- or d-pawn to move. The f1-bishop needs the e- or g-pawn to move, never the f-pawn, which stands directly in front of it.

> **Established:** the f1-bishop can reach e2 (after an e-pawn move) or g2 (after a g-pawn move). Either square prepares short castling, which needs only f1 to be empty.

> **Established:** the c1-bishop is the **dark-squared** bishop, the one that can use the long diagonals and the centre square d4. Opening the b-pawn (b3, Bb2) or the d-pawn (Bd2, Be3, Bf4) frees it.

> **Hypothesis:** the dark-squared bishop belongs on a long diagonal (b2 or the d4 square itself) or on e3, where it protects f2 and d4. Avoid trading it early, since it is also the bishop that guards the king's colour complex.

## Principle 4: the d-file is a fuse

The two queens face each other down the d-file at the start. The only things between them are the d-pawns. If both d-pawns disappear, the queens can be exchanged with check, and in the starting setup **only the king defends the queen**.

> **Established:** after 1.d4 c5 2.dxc5 dxc5? White plays 3.Qxd7+ Kxd7. Black's king must recapture, gives up castling and stands in the open. The engine rates this +0.47 for White. The correct recapture 2...bxc5 keeps the d-file closed, and the engine then rates the position only +0.18.

```seven
fen: rnbqkbr/pp2ppp/2p4/7/7/PPP1PPP/RNBQKBR w KQkq - 0 3
caption: After 1.d4 c5 2.dxc5 dxc5? the d-file is open. 3.Qxd7+ forces Kxd7, and Black loses castling rights.
highlight: d1 d7
arrows: d1d7
```

Remember this pattern from both sides: **do not be the one who opens the d-file while your king still guards your queen.** It applies equally after an early ...d5/exd5 exchange or any central liquidation.

## Principle 5: castle short, castle soon, but not automatically

Short castling needs only the f-bishop out of the way, and it tucks the king into the g1 corner behind f2 and g2. Long castling takes at least three preparatory piece moves and puts the king on c1 behind a2, b2 and c2, with the rook landing on the d-file facing the enemy queen.

> **Established:** short castling is available from move 3 (1.e3, 2.Be2, 3.O-O), long castling from move 4 at the earliest. In the ten engine games generated for this guide, short castling was played eleven times and long castling never.

> **Hypothesis:** castle short when the f-file and g-file are still closed, and castle long only when the d-file is already open and you want your rook on it at once. Even then, check that the enemy dark-squared bishop cannot reach your king's diagonals.

Castling is not a ritual. In the Quiet Lane (1.e3 e5 2.Be2 Be6) the engine prefers 3.d4 (+0.33) to 3.O-O. The fight for the centre is more urgent than king safety while Black's pieces are still at home.

## Principle 6: count tempi on the double step

The double step gains a tempo, but it lands on rank 4, the rank where the opponent's own double steps land, and where en passant applies.

> **Established:** a double step next to an enemy pawn on rank 4 can be captured en passant. Before you play ...c4 against a pawn on d4, or b4 against a pawn on c4, check whether the en passant capture helps your opponent.

> **Hypothesis:** in practice the en passant capture is often *not* the best reply. After 1.d4 c4 the engine prefers 2.b3 (+0.32) to 2.dxc5 e.p. (+0.18). Undermining the advanced pawn is worth more than taking it.

## Principle 7: watch rank 5 and the pawn fork

Pieces developed to rank 5 (for Black, rank 3) stand exactly where an enemy pawn arriving on rank 4 will hit them. Two pieces on the same rank with one square between them are a pawn fork waiting to happen.

```exercise
id: opening-mirror-fork
level: 2
fen: r3kbr/pppqppp/2npb2/7/2NPB2/PPPQPPP/R3KBR w KQkq - 4 5
prompt: Both sides copied each other's development. White to move and exploit Black's pieces on c5 and e5.
solution: d4
explanation: The pawn steps onto the contact rank and forks the knight on c5 and the bishop on e5. Black cannot save both (engine: +2.1). Pieces on rank 5 are always exposed to a pawn reaching rank 4.
```

## A checklist for the first five moves

1. Which pawn tension am I creating, and do I want it resolved or maintained?
2. Is the d-file about to open? If so, can my queen be exchanged with check?
3. Is my f-bishop free to move, so that I can castle short?
4. Is any of my pieces on the contact rank (rank 5 for Black, rank 3 for White) where a pawn can fork it?
5. Does my opponent have an en passant capture or a pawn lever (a pawn push that attacks an enemy pawn, offering a capture) against f2/f6?

```exercise
id: opening-queen-trap
level: 1
fen: rnbqkbr/p4p1/1p2p1p/2pp2P/1QPP3/PP1BPP1/RN2KBR b KQkq - 1 7
prompt: Black to move. White's queen wandered too far. Win it.
solution: cxb3
explanation: The c4 pawn simply takes the queen on b3. On a 7×7 board the queen has few safe squares in the opening. Every pawn is only a move or two from contact.
```
