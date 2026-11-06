# Opening Systems

This chapter names and describes the main opening systems of SEVEN. The names are this guide's own; SEVEN is too young for traditional ones. Every evaluation quoted comes from the SEVEN engine searching 300,000 nodes (roughly depth 9–11), always from **White's point of view**, in pawns.

> **Established:** at this depth, differences under about 0.3 are within the engine's noise. Read every figure below as "roughly equal", "pleasant edge" or "clearly better", not as an exact verdict.

## How White's first moves rank

Searching the start position, the engine prefers **1.d4 (+0.20)**. Next come 1.a4 (+0.04) and 1.a3 (−0.12). The knight moves 1.Na3 (−0.25) and 1.Nc3 (−0.27) are near the bottom, and the f-pawn moves 1.f3 and 1.f4 are worse still. Quiet moves such as 1.e3 and 1.d3 are playable and lead to slower games.

> **Hypothesis:** the d-pawn is White's best first move because it is the only pawn that is defended four times at the start (knight, bishop, queen, king), and on d4 it controls both c5 and e5 at once.

## The Meridian: 1.d4

```seven
fen: rnbqkbr/ppppppp/7/3P3/7/PPP1PPP/RNBQKBR b KQkq - 0 1
caption: The Meridian. The pawn on d4 covers c5 and e5 and gains space on the queen's file.
highlight: d4 c5 e5
```

The pawn on d4 takes away Black's two central single steps and stakes a claim to the only centre square. Black has four serious replies.

### The Cross: 1...c5

Black challenges the pawn at once. The c6-pawn steps onto c5, attacking d4 and itself attacked by it.

- **2.e3!** (+0.18) is the main line. White supports d4 with a pawn, opens the f1-bishop and prepares short castling. After 2...cxd4 3.exd4 d5 (+0.20) the position is open and balanced. The e-file is half open for White and the c-file for Black.
- **2.dxc5** releases the tension. Black must answer **2...bxc5!** (+0.18), recapturing towards the centre with the d-file still closed. 2...dxc5? opens the d-file and runs into 3.Qxd7+ Kxd7 (+0.47). See Principle 4 in the previous chapter.

```seven
fen: rnbqkbr/pp1pppp/2p4/3P3/4P2/PPP2PP/RNBQKBR b KQkq - 0 2
caption: The Cross after 1.d4 c5 2.e3. White holds d4 with a pawn and frees the f1-bishop.
highlight: c5 d4 e3
arrows: e3d4 c5d4
```

```game
title: The Cross, main line
moves: 1. d4 c5 2. e3 cxd4 3. exd4 d5 4. Be2 Nd6 5. O-O
notes: 2:2.e3 keeps the tension and prepares Be2 and O-O. | 3b:Black blockades the d4-pawn and opens the diagonal of the c7-bishop. | 5:White castles on move five with a comfortable, slightly freer game.
```

### The Hook: 1...g4

Black ignores the centre and throws the g-pawn forward two squares. The idea is **...g3**, a lever against f2, White's weakest pawn, which only the king defends.

```seven
fen: rnbqkbr/pppppp1/7/P2P2p/7/1PP1PPP/RNBQKBR b KQkq - 0 2
caption: The Hook after 1.d4 g4 2.a4. Each side has pushed a flank pawn to the contact rank.
highlight: g4 a4 f2
arrows: g4g3
```

- **2.a4** (+0.10) is the engine's choice, a mirror-image flank thrust. It gains space on the queenside and prepares a4–a5 or Ra3.
- After **2...g3**, White must not take the hook. **3.f3!** (+0.14) keeps the kingside closed and leaves the g3-pawn as a long-term target. **3.fxg3?** opens the f-file towards White's own king, and the engine already prefers Black (−0.29 after 3...d5).
- If White develops with 3.Nc3 instead, Black can play ...gxf2+. White recaptures with the king and loses the right to castle. In our engine game (see the Games chapter) White still won, but only after a long, sharp struggle.

```seven
fen: rnbqkbr/pppppp1/7/P2P3/6p/1PP1PPP/RNBQKBR w KQkq - 0 3
caption: The Hook's lever, 2...g3. The right answer is 3.f3, not 3.fxg3.
highlight: g3 f2 f3
arrows: f2f3
```

> **Established:** the engine rates 3.f3 about 0.4 better than 3.fxg3 in this position.

> **Hypothesis:** the Hook is Black's most practical weapon against the Meridian. It creates an imbalance before White's pieces are out, and the g3-pawn becomes either a bone in White's throat or a weakness for Black. Both outcomes lead to decisive games.

### The Passing Shot: 1...c4

Black double-steps the c-pawn *past* White's controlled square c5 and invites the en passant capture.

```seven
fen: rnbqkbr/pp1pppp/7/2pP3/7/PPP1PPP/RNBQKBR w KQkq c5 0 2
caption: The Passing Shot. White may take en passant on c5, but the engine prefers to undermine with 2.b3.
highlight: c4 c5
arrows: b2b3 d4c5
```

- **2.b3** (+0.32) attacks the c4-pawn at once. After 2...b5 3.bxc4 bxc4 Black's structure is loose.
- **2.dxc5 e.p.** (+0.18) is fine too. After 2...bxc5 the position resembles the Cross.

> **Hypothesis:** the Passing Shot is slightly dubious. Black spends a move to give White a choice of two comfortable plans.

### The Wall: 1...d5

Black meets the pawn head-on. The d-pawns block each other and the d-file stays closed, so the queens cannot be exchanged. The engine prefers White by about **+0.27** after 2.g4!?, a kingside space grab that is possible precisely because the centre is locked.

> **Hypothesis:** with the centre locked, play moves to the wings, and the side whose pawn storm arrives first decides the game. Seven files are not many. A flank attack reaches the king in two or three moves.

## The Duel: 1.e4 d5

1.e4 is the "open game" of SEVEN. Black hits the pawn immediately with **1...d5**, which the engine rates as the only good reply. After it the engine even prefers Black slightly (−0.16 at depth 9). The alternatives 1...a4 (+0.17), 1...c5 (+0.22) and 1...c4 (+0.65, a pawn left hanging) are all clearly worse for Black.

```seven
fen: rnbqkbr/pp2ppp/3p3/3P3/7/PPP2PP/RNBQKBR b KQkq - 0 3
caption: The Duel after 1.e4 d5 2.exd5 cxd5 3.d4. A symmetrical-looking but tense structure.
highlight: d4 d5
```

- **2.exd5 cxd5** (0.00) is forced. Black must recapture with the c-pawn. The engine rates the other recaptures, ...exd5 and ...Qxd5, at least 0.8 worse for Black.
- **3.d4** stakes out the centre. The engine rates the position as dead equal. Black continues with ...Nd6, ...b5 or the Hook-style ...g4.

> **Established:** the Duel is the most balanced opening in our tests (0.00 at depth 10). In our engine game in this line, every piece was eventually traded and the game ended in a dead draw.

> **Hypothesis:** play the Duel as White when you want a safe game, and as Black when a draw is a good result.

## The Quiet Lane: 1.e3

White opens the f1-bishop and prepares the fastest possible castling. A typical sequence is 1.e3 e5 2.Be2 Be6 3.O-O O-O, with both kings safe by move three.

```seven
fen: rnbq1rk/ppppbpp/4p2/7/4P2/PPPPBPP/RNBQ1RK w - - 4 4
caption: The Quiet Lane after 1.e3 e5 2.Be2 Be6 3.O-O O-O. Now 4.d4 (+0.30) opens the game on White's terms.
highlight: g1 g7 d2
arrows: d2d4
```

> **Established:** after 1.e3 e5 2.Be2 Be6 the engine prefers 3.d4 (+0.33) to 3.O-O (at most −0.10). Even in a quiet system, central tension takes priority over castling.

> **Hypothesis:** the Quiet Lane suits players who want to reach a middlegame with both kings castled and every piece in play. It gives White little advantage, but it is very hard to go wrong in.

A sharper version is **1.e3 d4 2.Qg4!?**, an early queen sortie towards Black's kingside. The queen eyes Black's kingside before Black has castled. The drawback is that Black can harass it with ...f5 and ...g4, gaining time. In our engine game in this line the queens later came off and the game was drawn by repetition.

## The Knight's Leap: 1.Nc3

Developing the knight first is natural in chess and doubtful in SEVEN. After **1...d4** the knight is kicked at once, and after **2.Ne4** the engine already prefers Black (−0.22). Black follows with ...g4 and ...Bg6, and White's knight has no stable post.

> **Established:** 1.Nc3 d4 2.Ne4 is slightly better for Black at depth 11.

## The Long Road: castling queenside

Long castling takes three preparatory moves (Nc3, a bishop move, a queen move) and puts the rook straight onto the d-file, facing the enemy queen. The danger is that the preparation takes time and leaves the pieces in a cluster on ranks 2 and 3.

> **Established:** in the symmetrical set-up 1.Nc3 Nc5 2.d3 d5 3.Be3 Be5 4.Qd2 Qd6, White to move wins material with 5.d4!, forking Black's knight and bishop on the contact rank (+2.1). Mirror-image development is not automatically safe.

> **Hypothesis:** long castling is a weapon for positions where the d-file has *already* opened, so that Rd1 gains a tempo against the enemy queen. As a routine plan it is too slow.

## Summary table

- **Meridian (1.d4):** White's best first move, about +0.2.
  - **Cross (1...c5 2.e3):** main line, about +0.2. Recapture 2...bxc5 if White takes on c5.
  - **Hook (1...g4):** sharp. Meet 2...g3 with f3, not fxg3.
  - **Passing Shot (1...c4):** 2.b3 gives White about +0.3.
  - **Wall (1...d5):** locked centre, play on the wings, about +0.3.
- **Duel (1.e4 d5):** exactly equal and simplifying.
- **Quiet Lane (1.e3):** safe, slow, about +0.3 after 4.d4.
- **Knight's Leap (1.Nc3):** slightly better for Black.

```exercise
id: openings-rook-on-g3
level: 3
fen: rnbqkbr/p1p1pp1/1p4p/3p2P/3P2R/PPPBPP1/RN1QKB1 b Qkq - 1 5
prompt: White's rook has wandered to g3. Black to move wins material.
solution: Bxg3 fxg3
explanation: The dark-squared bishop sweeps down the c7–g3 diagonal and takes the rook. White must recapture with the f-pawn. Black wins the exchange, and White's king is left on e1 with the f-file half open.
```
