# The Rules of SEVEN

SEVEN is chess compressed onto a 7×7 board. Every piece moves exactly as in orthodox chess, but there are fewer of them, the armies start closer together, and some familiar habits stop working. This chapter covers the official ruleset, **SEVEN-1.0**, which is the only one used for rated play. Each later chapter builds on it, so read it once even if you already play chess.

## How to use this guide

The guide has three kinds of interactive block. **Diagrams** show a position, sometimes with highlighted squares and arrows. **Exercises** ask you to find a move on the board; the Academy checks your answer and tracks which ones you have solved. **Games** are complete engine games you can step through, with notes at the critical moments.

Every claim in this book is tagged with how sure we are of it. The two tags look like this:

> **Established:** follows from the rules or board geometry, or has been checked by exhaustive analysis or by the SEVEN engine.

> **Hypothesis:** a plausible principle that has not been tested enough to trust blindly. Treat it as advice, not law.

SEVEN is a young game. Most of what top players "know" about it is still hypothesis, and we would rather say so than pass off guesses as theory.

## The board and the armies

The board has seven files, **a** to **g**, and seven ranks, **1** to **7**. White's back rank reads, from a1 to g1:

**R N B Q K B R** — rook, knight, bishop, queen, king, bishop, rook.

White's pawns stand on a2–g2. Black's pieces mirror White's on the same files: rook a7, knight b7, bishop c7, queen d7, king e7, bishop f7, rook g7, with pawns on a6–g6. Note what is missing compared with chess: **one knight per side**. Each army has a rook pair, a bishop pair, a single knight, a queen and seven pawns.

```seven
fen: rnbqkbr/ppppppp/7/7/7/PPPPPPP/RNBQKBR w KQkq - 0 1
caption: The starting position. Only three empty ranks separate the armies.
highlight: d1 d7
```

Notice three things straight away:

- The queens face each other down the **d-file**, with only two pawns between them.
- Only ranks 3, 4 and 5 are empty. A pawn that double-steps lands on the middle rank and is in contact with the enemy at once.
- The kings start on e1 and e7, next to the f-bishops. The b-knight is the only piece that can move before a pawn does.

## Moves and captures

Kings, queens, rooks, bishops and knights move and capture as in chess. Pawns move one square forward, capture one square diagonally forward, and:

- **Double step.** A pawn on its starting rank (rank 2 for White, rank 6 for Black) may advance two squares if both squares are empty. A White double step goes from rank 2 to rank 4. A Black double step goes from rank 6 to rank 4, so **both sides' double steps land on the same rank**.
- **En passant.** If a pawn double-steps and lands beside an enemy pawn, that enemy pawn may capture it as though it had moved only one square, but only on the very next move.
- **Promotion.** A pawn reaching the last rank (rank 7 for White, rank 1 for Black) must promote to a queen, rook, bishop or knight.

```seven
fen: rnbqkbr/pp1pppp/7/2pP3/7/PPP1PPP/RNBQKBR w KQkq c5 0 2
caption: After 1.d4 c4 White may capture en passant with 2.dxc5.
highlight: c5 c4
arrows: d4c5
```

> **Established:** a pawn of either colour standing on rank 4 can capture en passant any enemy double step that lands on a neighbouring file. Every double step in SEVEN lands on rank 4, so en passant comes up far more often than in chess.

## Castling

Each side may castle once per game, under the usual conditions. Neither the king nor that rook may have moved. The king may not be in check, and may not pass through or land on an attacked square. The squares between the king and the rook must be empty.

- **Short castling (O-O):** king e1→g1, rook g1→f1. Only f1 needs to be empty.
- **Long castling (O-O-O):** king e1→c1, rook a1→d1. b1, c1 and d1 must be empty.

Black castles in the same way on rank 7 (king to g7 or c7).

```seven
fen: rnbq1rk/ppppbpp/4p2/7/4P2/PPPPBPP/RNBQ1RK w - - 4 4
caption: Both sides have castled short after 1.e3 e5 2.Be2 Be6 3.O-O O-O.
highlight: g1 f1 g7 f7
```

> **Established:** short castling only needs the f-bishop to move, so it can be played as early as move 3 (for example 1.e3, 2.Be2, 3.O-O). Long castling needs the knight, the c-bishop and the queen to move first, so it cannot happen before move 4.

```seven
fen: 2kr1br/pppqppp/2npb2/7/2NPB2/PPPQPPP/2KR1BR w - - 6 6
caption: Both sides have castled long. Each rook now stands on the d-file.
highlight: c1 d1 c7 d7
```

## How games end

- **Checkmate** wins.
- **Stalemate** is a **draw**.
- **Threefold repetition** of a position is drawn automatically. No claim is needed.
- **80 plies** (40 moves by each side) without a capture or a pawn move is an automatic draw.
- **Dead positions** are drawn: king against king, king and minor piece against king, and similar positions where no mate is possible.

## Notation

SEVEN uses standard algebraic notation on the smaller board. Files run a–g and ranks 1–7, so there is no h-file and no eighth rank. Positions are written in a 7-wide FEN. The start position is:

`rnbqkbr/ppppppp/7/7/7/PPPPPPP/RNBQKBR w KQkq - 0 1`

## What the statistics say

The official ruleset was chosen from five candidates by engine self-play (see the project's research notes). Under SEVEN-1.0, White scored **53.7%** (±8.9 at 95% confidence, 120 games at club-level search depth), with **21% draws**, the lowest draw rate of all the candidates.

> **Established:** decisive games are the norm. In the rules study about four games in five had a winner, and most of those ended in checkmate.

> **Hypothesis:** White has a small first-move advantage, comparable to chess. The measured 53.7% fits this, but the confidence interval still includes 50%. Contact comes so quickly in SEVEN that, as Black, your first job is to neutralise White's initiative.

## Exercise: first contact

```exercise
id: rules-ep-discovery
level: 2
fen: 3k2r/pq3pp/7/2pP3/7/P4PP/3R2K w - c5 0 1
prompt: Black has just played ...c6-c4. White to move and win the queen.
solution: dxc5+ Kc6 cxb6
explanation: The en passant capture opens the d-file, giving a discovered check from the rook. The new pawn on c5 also attacks the queen on b6, so after the king steps aside White takes the queen.
```
