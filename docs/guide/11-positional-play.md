# Positional Play and Practical Decision-Making

Tactics decide most SEVEN games, but positional understanding decides which side gets the tactics. This chapter covers the long-term factors that matter on the 7×7 board. It then turns to two practical skills: managing the clock and calculating under pressure.

## Long-term factors

### The dark squares

Everything important in SEVEN is dark: the centre square d4, both long diagonals, every king square (e1, g1, c1 and their Black counterparts), and every promotion corner.

> **Established:** a side that has lost its dark-squared bishop cannot contest d4 with a bishop, cannot use the long diagonals, cannot cover its own castled king's diagonal, and (in the endgame) cannot force mate with bishop and knight.

> **Hypothesis:** the dark-squared bishop is worth about a quarter of a pawn more than the light-squared bishop in most middlegames, and much more in endings with a knight or rook pawns. Treat a trade of dark bishops as a major positional decision, and a trade of your dark bishop for the enemy knight as a real concession.

### Outposts

An **outpost** is a square that no enemy pawn can attack. In SEVEN the best outposts are in the inner ring, on the enemy's half of the board: c5, d5 and e5 for White, and c3, d3 and e3 for Black.

> **Hypothesis:** the knight, the only piece that can sit comfortably on an outpost surrounded by pawns, is SEVEN's natural outpost piece. A knight on d5 or e5 supported by a pawn, with no enemy c- or e-pawn able to challenge it, is usually worth more than either enemy bishop.

### Open files

There are only seven files, so every open file is a large fraction of the board. The rooks start in the corners and need just one move (Rd1, Re1, Rc1, after castling) to reach a central file.

> **Hypothesis:** the first rook to an open central file in SEVEN often decides the middlegame. After short castling, the f1-rook is already on the f-file. If that file opens, the rook is immediately active.

### Space

With three empty ranks at the start, a pawn on rank 4 already takes away squares in the opponent's half. "Space" in SEVEN is measured in single squares. Taking one more rank-5 square from your opponent can leave their pieces with nowhere to go.

### Exchanges

Which pieces to trade?

- **Trade the knight** only with care. You have only one, and the opponent keeps the bishop pair.
- **Keep the dark-squared bishop** unless trading it wins something concrete.
- **Trade queens when you are ahead in material or king safety.** The queen is the attacking piece, and a queen trade turns the game into an endgame where the stronger structure wins.
- **Keep rooks when you have a passed pawn.** A rook behind a passed pawn on this short board is decisive.

## Time management at 5+3

The default clock in SEVEN is **5 minutes plus 3 seconds per move**.

> **Established:** in engine self-play under the official rules, games averaged about 102 plies (51 moves per side). Over 51 moves a player has 300 seconds of base time plus 51 × 3 = 153 seconds of increment, about **9 seconds per move** on average.

Practical guidelines:

1. **Spend on the first contact.** The first pawn tension (usually by move 1–3) shapes the whole game, and the board is so small that a bad structure is hard to repair. Taking 20–30 seconds over your first contact decision is good value.
2. **Spend on transitions.** Trading into an endgame, especially a pawn ending, is irreversible, and pawn endings in SEVEN are calculable to the end. Spend the time to calculate them exactly.
3. **Play quickly in technical positions.** Known mates (KQ vs K, KR vs K) should take no thinking time. The 3-second increment is enough if you know the technique. KR vs K takes at most 14 moves.
4. **Never let your clock drop below 20 seconds in a complex middlegame.** With 3 seconds a move you can survive indefinitely only if each move is simple.
5. **Watch the 80-ply rule in won endings.** A position you cannot convert in 40 moves without a capture or pawn move is a draw. KBN vs K needs up to 21 moves, so you have time, but not time to waste.

> **Hypothesis:** in 5+3 play, most losses in balanced positions come from flagging or blundering in the last minute, not from opening errors. Bank time early by knowing the opening systems in this guide.

## A method for calculation

Calculation on a small board is easier in one way (fewer pieces, shorter lines) and harder in another (every move matters). Use this four-step routine.

### Step 1: scan for checks, captures and threats, for both sides

Start with **your opponent's** checks and captures. That is the blunder check. On 7×7 nearly every piece is within two moves of every other, so look at the whole board, not only "where the action is".

### Step 2: count the king's squares

When a king is involved, count its flight squares. On this board a king rarely has more than four, and on the edge or in a corner it has two or three. If you can take them all away with tempo, look for mate. If your own king has only one or two, look for your opponent's mate first.

### Step 3: list candidates and calculate forcing lines to the end

Write down (mentally) two or three candidate moves. Calculate forcing lines **to the end**. Tactical sequences in SEVEN rarely go beyond three or four moves, so you can usually reach a quiet position and evaluate it.

### Step 4: evaluate with the SEVEN factors

When a line ends in a quiet position, evaluate it with the factors of this book, in this order:

1. **Material**, using 1–3–3–5–9 (and the pawn values of the endgame).
2. **King safety**: shelter pawns, the long diagonal, the back rank.
3. **Passed pawns.** In SEVEN they are worth more than in chess.
4. **The dark squares and the dark-squared bishops.**
5. **Activity**: open files, outposts, the inner ring.

## Concepts special to SEVEN

To finish, here are the ideas that have no direct counterpart in chess, collected in one place:

- **The contact rank.** Rank 4 is where both sides' double steps land, and any pawn there is in contact. Pieces on rank 5 (rank 3 for Black) are exposed to pawn forks.
- **The Meridian fuse.** The queens face each other on the d-file, each defended only by its king. Opening the d-file can cost the other side the right to castle.
- **The dark complex.** Centre, long diagonals, kings and promotion corners are all dark.
- **The lone knight.** It is the only jumper, the only piece that develops before the pawns, and the main forking piece. Only one is available, so trading it gives away the bishop pair.
- **The f-pawn shield.** f2/f6 is defended only by the king at the start, blocks the f-bishop's file and, after short castling, shields the long diagonal to the king.
- **Frequent en passant.** Because all double steps end on rank 4, en passant is a regular part of opening play.
- **Short endgames.** Basic mates take at most 8 (queen), 14 (rook), 16 (two bishops) or 21 (bishop and knight) moves.

```exercise
id: positional-quiet-rook-mate
level: 5
fen: 7/3K1R1/1k5/7/7/7/7 w - - 0 1
prompt: White to move. Only one move mates in five; every other move takes at least two moves longer.
solution: Rf4
explanation: The rook drops to the fourth rank and confines the black king to the top three ranks, while White's king on d6 covers c5, c6 and c7. Checks or king moves let the king out of the box. Exhaustive retrograde analysis confirms that this is the only mate in five.
```

```exercise
id: positional-king-first
level: 5
fen: 7/3R3/7/6K/7/4k2/7 w - - 0 1
prompt: White to move. Find the only move that mates in five.
solution: Kf4
explanation: The rook on d6 already cuts the black king off from the queenside along the d-file. Now White's king must come closer: Kf4 takes e3 and f3 away from Black's king and shrinks the box. Rook moves waste time. Exhaustive analysis shows every alternative mates at least two moves later.
```
