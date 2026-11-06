# Annotated Games

The four games in this chapter were played by the SEVEN engine against itself under the official rules. Each side searched about 100,000 nodes per move, which is strong club level for this variant. The first few moves were fixed to reach the opening system under study. After that the engine was on its own.

The notes were written afterwards with the help of a deeper search (300,000 nodes) of the critical positions. Evaluations are in pawns from White's point of view. Where the deeper search disagreed with the moves played, we say so. These are engine games, with engine mistakes, and the point is to show SEVEN's themes at work, not to present flawless play.

## Game 1: The Cross with a Hook

White plays the main line of the Cross. Black combines it with a Hook-style g-pawn advance, and White answers by giving up the exchange for the dark squares.

```game
title: Game 1 — The Cross with a Hook (1-0)
moves: 1. d4 c5 2. e3 g5 3. Nd2 g4 4. Be2 e5 5. O-O Be6 6. c3 Qc6 7. a4 g3 8. Qe1 cxd4 9. cxd4 Bd5 10. fxg3 Bxg2 11. Rf5 Bd5 12. Qf2 Rf7 13. b4 Be6 14. Bb2 Bxf5 15. Qxf5 d5 16. Bg4 Nc5 17. bxc5 Rg7 18. dxe5 Bxe5 19. Bxe5 Rxg4 20. Qxg4 Kf7 21. cxb6 Rb7 22. Rf1 Rxb6 23. Bxf6 Qxf6 24. Rxf6+ Rxf6 25. Qd7+ Kg6 26. Nf3 Rb6 27. Qg4+ Kf7 28. Ne5+ Ke7 29. Ng6+ Rxg6 30. Qxg6 a5 31. Qc6 Kf7 32. Qxd5+ Kf6 33. Qb5 Ke6 34. Qxa5 Kf6 35. Qd5 Kg7 36. a5 Kf6 37. a6 Kg6 38. a7=Q Kf6 39. Qaf7#
notes: 2:The main line of the Cross. White supports d4 with a pawn and frees the f1-bishop. | 2b:Black adds a kingside space grab to the Cross. | 5:White castles on move five, straight into the path of Black's g-pawn. | 7b:The Hook lever. The pawn reaches g3 and attacks f2, which is now defended by the king and the f1-rook. | 10:With the king castled and a rook on f1, White is happy to open the f-file. Compare the Hook chapter, where fxg3 is wrong with the king still on e1. | 10b:Black grabs the g2-pawn. The bishop is protected by the queen on c6 along the c6–g2 diagonal. | 11:The rook swings up the newly opened f-file, attacking e5 and preparing to sit on the light squares. | 14:The dark-squared bishop goes to the long diagonal, aiming at f6 and at Black's king. | 14b:Black takes the exchange. Engine: about +0.3 for White even so. White's queen dominates the light squares, and the b2-bishop waits on the long diagonal for the d4-pawn to move. | 15b:The 100k search thought this was a mistake. The deeper search rates it as playable, but Black's position is getting difficult. | 16:Bringing the last minor piece into the attack. The evaluation jumps to about +1.9. | 16b:A blunder. The knight is simply taken by the b-pawn. The deeper search preferred 16...exd4 (+2.2). After the text move it is +4.6. | 19b:Black returns the exchange to get rid of the g4-bishop, but White's dark-squared bishop is still on e5. | 23:The long-diagonal bishop cashes in on f6, and the f-file opens towards Black's king. | 25:Good enough, but the deeper search found 25.Nf3! (+13) stronger than the check (+8.5). | 28:The lone knight joins the attack with check. | 29:A deflection. The knight is given up to drag the rook to g6, where the queen takes it. | 30b:White has a queen against a few pawns. The rest is technique, and the outside a-pawn decides. | 38:The outside passed pawn queens on a7, a dark corner square. | 39:Two queens mate.
```

```seven
fen: rnb1kr1/ppq2p1/3ppQ1/PP1P3/4P1P/1B1NB2/R5K w q - 0 16
caption: Game 1 after 15...d5. White is an exchange down but has the light squares, the long diagonal and the more active queen. 16.Bg4 brings the last piece in.
highlight: f5 b2 e2 g4
arrows: e2g4 b2f6
```

**Lessons.**

- After short castling, **opening the f-file is good for the side that owns it**. Here that was White, with a rook on f1 and a queen behind it.
- The **exchange sacrifice for the dark squares** is a typical SEVEN idea: a bishop on the long diagonal plus a queen on the light squares can be worth more than a rook.
- The **outside passed pawn** (the a-pawn) converted the queen ending at once.

## Game 2: The Duel

The most balanced opening in our tests, in its natural course. Both sides push Hook-style g-pawns. Everything is traded, and the game ends in a dead draw.

```game
title: Game 2 — The Duel (½-½)
moves: 1. e4 d5 2. exd5 cxd5 3. d4 Nd6 4. a4 g4 5. Bd3 b5 6. axb5 Nxb5 7. c3 g3 8. O-O Bg6 9. b4 Bxd3 10. Qxd3 Qc6 11. Bb2 gxf2+ 12. Rxf2 Rg3 13. Qf1 e4 14. dxe5 Bxe5 15. Ra5 Qb6 16. Qd1 Rg5 17. Qe2 Rf5 18. Kf1 Rxf2+ 19. Qxf2 Qxf2+ 20. Kxf2 f4 21. Na3 Nxc3 22. Nb5 Nxb5 23. Bxe5 Kf7 24. Bxf4 d4 25. g4 Nc3 26. Kf3 Nb5 27. Ra1 Kg6 28. Ke4 Re7+ 29. Kd5 Nc3+ 30. Kc4 Re6 31. Be5 Kg5 32. Kxd4 Rc6 33. Kd3 Nd5 34. Ke4 Nxb4 35. Bf4+ Kg6 36. Ra5 Re6+ 37. Kd4 Nc2+ 38. Kd5 Kf6 39. Ra4 Rb6 40. g5+ Kf5 41. Bd2 Kg6 42. Ra5 Rb5+ 43. Rxb5 axb5 44. Bc1 b4 45. Kc4 Ne1 46. Be3 Nf3 47. Kxb4 Nxg5 48. Kc4 Nf3 49. Bc5 Nd4 50. Kxd4
notes: 2b:The only good recapture. The c-pawn comes to the centre. | 3b:The knight goes to its natural square, d6, from where it eyes b5, c4, e4 and f5. | 4b:A Hook in the Duel. The g-pawn is on its way to g3. | 6b:The knight recaptures and stands actively on b5, eyeing c3 and d4. | 7b:The lever arrives, against a king that is about to castle into it. | 9b:Black gives up the light-squared bishop for White's, keeping the dark-squared one. | 11b:Black opens the f-file. White recaptures with the rook and the king stays safe. | 13b:A double step next to White's d4-pawn, and White takes en passant at once. | 18b:Black forces the exchange of rooks and then queens on f2. The engine rates the ending as level. | 21b:Black's knight grabs the c3-pawn. | 23:White wins back the material. Bishop and rook against knight and rook, with pawns on both wings. | 28:White's king walks into the centre. In the endgame it is White's best piece. Engine: about +0.9. | 32:White wins the d-pawn, but Black's pieces are active enough to win back the b-pawn. | 43:The rooks come off. Bishop against knight, with only the g-pawn and b-pawn left. | 47b:The last pawns disappear. | 50:King and bishop against king: a dead position, drawn automatically.
```

**Lessons.**

- In the Duel, **both sides can launch the Hook**. The ...g4–g3 lever is a weapon for either colour.
- **En passant comes up naturally**: 13...e4 14.dxe5 e.p.
- With **symmetrical, simplified pawn structures**, even a king walk to d5 is not enough to win. The board is too small for a single extra pawn to make a passed pawn safely.

## Game 3: The Hook, with 6.f3

This game shows the recommended treatment of the Hook: White meets ...g3 with f3, leaving a Black pawn lodged on g3, and finally wins that pawn in a king-and-pawn ending.

```game
title: Game 3 — The Hook (1-0)
moves: 1. d4 g4 2. a4 b4 3. Bd2 c5 4. c3 bxc3 5. Bxc3 g3 6. f3 c4 7. Nd2 d5 8. b3 cxb3 9. Qxb3 f4 10. Bb4+ Bd6 11. e4 fxe3 12. Bxd6+ Nxd6 13. Qxe3 Nf5 14. Qa3+ Qd6 15. Nb3 Bg6 16. Kd2 Rb7 17. Kc3 Rc7+ 18. Kd2 Rc6 19. Qxd6+ Nxd6 20. Nc5 Nf5 21. Nb3 O-O 22. Bd3 Nd6 23. Rgc1 Rb6 24. Nc5 Bxd3 25. Kxd3 Nc4 26. Re1 Rf6 27. Rab1 Rc6 28. Rb7+ Kg6 29. Re7 Nb2+ 30. Kd2 Nc4+ 31. Kc3 e5 32. dxe5 Nxe5 33. Kd4 Nc4 34. R7e6 Rcxe6 35. Rxe6 Rxe6 36. Nxe6 Nb6 37. Nc7 Nxa4 38. Nxa6 Nb6 39. Nc7 Kg5 40. Nxd5 Nxd5 41. Kxd5 Kf5 42. Kc4 Kf4 43. Kd4 Kf5 44. Ke3 Ke5 45. f4+ Kd5 46. Kd3 Kd6 47. Kd4 Ke7 48. Ke4 Ke6 49. f5+ Kf6 50. Kf4 Kf7 51. Kxg3 Ke7 52. Kg4 Kd6 53. f6 Ke6 54. Kg5 Kf7 55. g4 Ke6 56. Kg6 Kd5 57. f7=Q+ Kc5 58. g5 Kd4 59. Kf5 Ke3 60. g6 Ke2 61. Qc4+ Ke1 62. g7=Q Kd1 63. Qg1+ Kd2 64. Qgc1#
notes: 2b:Black answers White's flank thrust with one of its own. | 5b:The Hook lever. | 6:The recommended reply. White keeps the f-file closed and leaves the g3-pawn as a long-term target. | 10:The dark-squared bishop gives the typical b4 check along the diagonal to e7. | 11:A double step next to Black's f4-pawn. | 11b:En passant. The capture opens the position in the centre. | 16:With queens still on, White's king steps off the e-file towards c3. Its own pieces shelter it. | 19:Queens off. The kings can now walk freely. | 24b:The light-squared bishops come off, leaving knight against knight. | 34b:Mass liquidation into a knight ending. White's king is more active. | 39b:A slip. The deeper search preferred 39...Nc4 (+1.8) to the text (+2.5). | 40:White trades knights and enters a winning king-and-pawn ending: f- and g-pawns against the lone g3-pawn. | 45:The f-pawn advances with check, gaining ground. | 51:The g3 "bone" finally falls, more than forty moves after it arrived. | 56:The king steps up beside the f-pawn, and the pawn queens next move. | 64:Two queens finish the job.
```

```seven
fen: rn1qkbr/p2bp2/3p3/PB1PPp1/1Q3Pp/3N2P/R3KBR b KQkq e3 0 11
caption: Game 3 after 11.e4. White's e-pawn has double-stepped past Black's f4-pawn, which can take it en passant. That is what Black did.
highlight: e4 f4 e3
arrows: f4e3
```

```seven
fen: 7/7/3K2k/7/5Pp/6P/7 b - - 0 41
caption: Game 3 after 41.Kxd5. White's two kingside pawns against the g3 bone. The engine rates this as winning (+3.3).
highlight: g3 f3 g2
```

**Lessons.**

- **6.f3** keeps the Hook pawn contained. It cramps White's kingside, but in the end it is a weakness.
- **The king belongs in the centre once queens are off**, even very early (move 19 here).
- **King and pawn endings decide many SEVEN games.** They can be calculated, and White calculated this one correctly.

## Game 4: The queenside avalanche

A game won by Black. White's quiet opening allows Black's flank pawns to gain space. A tactical sequence starting on move 15 sends Black's queenside pawns rolling.

```game
title: Game 4 — The Queenside Avalanche (0-1)
moves: 1. d3 a4 2. Bd2 d4 3. c4 e4 4. Qc2 exd3 5. exd3 Nc5 6. Na3 Be6 7. Be2 O-O 8. O-O Re7 9. Rfe1 Bf5 10. Bf1 Bd6 11. Rxe7+ Qxe7 12. Re1 Qf7 13. Be2 g4 14. Rf1 Re7 15. Qd1 Nxd3 16. Bxg4 Nxb2 17. Qa1 Bxa3 18. Bxf5 Qxc4 19. Re1 Rxe1+ 20. Qxe1 Qxa2 21. Bc1 Qd5 22. Bxb2 Qxf5 23. Bxa3 c4 24. g3 b5 25. Qa5 Kg6 26. Qb6 Qb1+ 27. Kg2 Qe4+ 28. Kg1 Qe5 29. Bb4 c3 30. Qc6 Qf5 31. Bxc3 dxc3 32. Qxc3 Qb1+ 33. Kg2 Qe4+ 34. Kg1 b4 35. Qb2 b3 36. Kf1 Qe5 37. Qc1 b2 38. Qc2+ Kg7 39. Qd3 a3 40. f4 Qc7 41. Qb5 Qc1+ 42. Ke2 Qc2+ 43. Ke3 Kg6 44. g4 Qc1+ 45. Ke2 b1=Q 46. Qxb1+ Qxb1 47. Ke3 a2 48. f5+ Kg5 49. Kd4 a1=Q+ 50. Kc4 Qe4+ 51. Kc5 Qa7+ 52. Kb5 Qea4#
notes: 1b:Black answers the quiet 1.d3 with a flank advance. | 3b:Contact on the contact rank. Black's e-pawn challenges d3 at once. | 7b:Both sides castle short by move 8. | 11:The e-file opens and the rooks come off one pair at a time. | 13b:The Hook pawn arrives, this time in the middlegame. | 15:White was already in trouble. Over the last few moves the evaluation has slid from −0.4 to about −1.1, and the deeper search also chose 15.Qd1, rating it −1.1. | 15b:The knight takes the d3-pawn and forks b2 and f2. A long tactical sequence follows, and the evaluation reaches −1.9. | 18b:When the dust settles, Black has connected passed pawns on the queenside and White has nothing to set against them. | 21b:The deeper search preferred 21...Kf7 (−2.9), but Black stays clearly better. | 23b:The connected passed pawns start rolling. Three pawns on adjacent files, only four or five steps from queening. | 31:White gives back the bishop to slow the pawns, but two remain. | 37b:The b-pawn is one step from queening. | 39:White is lost anyway, but this and 40.f4 speed things up. The deeper search found 40.Kg2 more stubborn. | 45b:Black queens. | 46b:Black trades queens into a won queen-against-pawns ending, then queens the a-pawn. | 52b:Two queens mate.
```

```seven
fen: 4rqk/1ppb1p1/2n2b1/p1Pp2p/N2P3/PP1BBPP/3Q1RK b - - 3 15
caption: Game 4 after 15.Qd1. Black's knight on c5 can take on d3, and the tactics that follow favour Black.
highlight: c5 d3 b2 f2
arrows: c5d3
```

**Lessons.**

- **Connected passed pawns on the wing** are a winning advantage on a seven-rank board. From rank 4 they need only three steps.
- A **queen trade** is the simplest way to convert pawn superiority. Black allowed it at once on move 46.
- Even **quiet openings** create contact within three moves (here 1.d3 a4 2.Bd2 d4 3.c4 e4).
