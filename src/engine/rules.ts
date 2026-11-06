/**
 * Rulesets. Candidates are kept so the research scripts can be re-run;
 * only OFFICIAL is used for rated play and it is locked by version id.
 */
export interface Ruleset {
  id: string;
  name: string;
  /** White's back rank, files a→g. Black mirrors on rank 7 (same files). */
  backRank: string;
  pawnDouble: boolean;
  /** Castling target files (0 = a … 6 = g); null disables castling. */
  castling: null | { shortKing: number; shortRook: number; longKing: number; longRook: number };
  /** Result when the side to move has no legal move and is not in check. */
  stalemate: 'draw' | 'loss';
  /** Automatic draw after this many consecutive plies without capture or pawn move. */
  quietPlyLimit: number;
}

export const startFen = (r: Ruleset) => {
  const w = r.backRank;
  const castle = r.castling ? 'KQkq' : '-';
  return `${w.toLowerCase()}/ppppppp/7/7/7/PPPPPPP/${w} w ${castle} - 0 1`;
};

/** Candidate rulesets evaluated in docs/RESEARCH.md. */
export const CANDIDATES: Ruleset[] = [
  {
    id: 'C1-RNBQKNR',
    name: 'Two knights, one bishop',
    backRank: 'RNBQKNR',
    pawnDouble: false,
    castling: { shortKing: 6, shortRook: 5, longKing: 2, longRook: 3 },
    stalemate: 'draw',
    quietPlyLimit: 80,
  },
  {
    id: 'C2-RNBQKBR',
    name: 'One knight, two bishops',
    backRank: 'RNBQKBR',
    pawnDouble: false,
    castling: { shortKing: 6, shortRook: 5, longKing: 2, longRook: 3 },
    stalemate: 'draw',
    quietPlyLimit: 80,
  },
  {
    id: 'C3-RNBKBNR',
    name: 'Queenless, central king',
    backRank: 'RNBKBNR',
    pawnDouble: false,
    castling: { shortKing: 5, shortRook: 4, longKing: 1, longRook: 2 },
    stalemate: 'draw',
    quietPlyLimit: 80,
  },
  {
    id: 'C4-RNBQKBR-double',
    name: 'One knight, two bishops, double step',
    backRank: 'RNBQKBR',
    pawnDouble: true,
    castling: { shortKing: 6, shortRook: 5, longKing: 2, longRook: 3 },
    stalemate: 'draw',
    quietPlyLimit: 80,
  },
  {
    id: 'C5-RNBQKBR-nocastle',
    name: 'One knight, two bishops, no castling',
    backRank: 'RNBQKBR',
    pawnDouble: false,
    castling: null,
    stalemate: 'draw',
    quietPlyLimit: 80,
  },
];

export let OFFICIAL: Ruleset = CANDIDATES[1];
/** For research scripts only. Never call from game code. */
export function _setOfficialForResearch(r: Ruleset) {
  OFFICIAL = r;
}
