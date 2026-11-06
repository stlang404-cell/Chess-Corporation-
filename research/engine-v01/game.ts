/** Game-level helpers: SAN notation, outcome detection, move lookup. */
import {
  Position,
  WHITE,
  PAWN,

  EMPTY,
  mFrom,
  mTo,
  mPromo,
  mFlag,
  FLAG_CASTLE,
  FLAG_EP,
  pieceType,
  squareName,
  fileOf,
  rankOf,
  parseSquare,
  type Color,
} from './board';
import { type Ruleset, startFen } from './rules';

export type Termination =
  | 'checkmate'
  | 'stalemate'
  | 'repetition'
  | 'quiet-limit'
  | 'insufficient'
  | 'resignation'
  | 'timeout'
  | 'agreement'
  | 'abandoned';

export interface Outcome {
  /** 1 = white wins, 0 = black wins, 0.5 = draw */
  result: 1 | 0 | 0.5;
  termination: Termination;
}

const LETTER = ' PNBRQK';

export function moveToSan(pos: Position, m: number, legal?: number[]): string {
  const from = mFrom(m);
  const to = mTo(m);
  const flag = mFlag(m);
  const pc = pos.board[from];
  const t = pieceType(pc);
  let san: string;
  if (flag === FLAG_CASTLE) san = mPromo(m) === 1 ? 'O-O' : 'O-O-O';
  else {
    const cap = pos.board[to] !== EMPTY || flag === FLAG_EP;
    if (t === PAWN) {
      san = (cap ? 'abcdefg'[fileOf(from)] + 'x' : '') + squareName(to);
      if (mPromo(m)) san += '=' + LETTER[mPromo(m)];
    } else {
      san = LETTER[t];
      const lm = legal ?? pos.legalMoves();
      const others = lm.filter(
        (o) => o !== m && mTo(o) === to && pieceType(pos.board[mFrom(o)]) === t && mFlag(o) !== FLAG_CASTLE,
      );
      if (others.length) {
        const sameFile = others.some((o) => fileOf(mFrom(o)) === fileOf(from));
        const sameRank = others.some((o) => rankOf(mFrom(o)) === rankOf(from));
        if (!sameFile) san += 'abcdefg'[fileOf(from)];
        else if (!sameRank) san += rankOf(from) + 1;
        else san += squareName(from);
      }
      if (cap) san += 'x';
      san += squareName(to);
    }
  }
  pos.make(m);
  if (pos.inCheck()) san += pos.hasLegalMove() ? '+' : '#';
  pos.unmake();
  return san;
}

export function sanToMove(pos: Position, san: string): number {
  const clean = san.replace(/[+#!?]/g, '');
  const legal = pos.legalMoves();
  for (const m of legal) if (moveToSan(pos, m, legal).replace(/[+#]/g, '') === clean) return m;
  return 0;
}

export function uciOf(m: number): string {
  return squareName(mFrom(m)) + squareName(mTo(m)) + (mPromo(m) && mFlag(m) !== FLAG_CASTLE ? ' nbrq'[mPromo(m) - 1] : '');
}

export function findMove(pos: Position, from: number, to: number, promo = 0): number {
  for (const m of pos.legalMoves()) {
    if (mFrom(m) !== from || mTo(m) !== to) continue;
    if (mFlag(m) === FLAG_CASTLE) return m;
    if (mPromo(m) === promo || (!promo && !mPromo(m))) return m;
  }
  return 0;
}

export function uciToMove(pos: Position, uci: string): number {
  const from = parseSquare(uci.slice(0, 2));
  const to = parseSquare(uci.slice(2, 4));
  const p = uci[4] ? 'nbrq'.indexOf(uci[4]) + 2 : 0;
  return findMove(pos, from, to, p);
}

/** Outcome determined by the board alone (no clocks / resignations). */
export function boardOutcome(pos: Position): Outcome | null {
  if (!pos.hasLegalMove()) {
    if (pos.inCheck()) return { result: pos.side === WHITE ? 0 : 1, termination: 'checkmate' };
    if (pos.rules.stalemate === 'loss') return { result: pos.side === WHITE ? 0 : 1, termination: 'stalemate' };
    return { result: 0.5, termination: 'stalemate' };
  }
  if (pos.insufficientMaterial()) return { result: 0.5, termination: 'insufficient' };
  if (pos.repetitions() >= 2) return { result: 0.5, termination: 'repetition' };
  if (pos.halfmove >= pos.rules.quietPlyLimit) return { result: 0.5, termination: 'quiet-limit' };
  return null;
}

/** A recorded game: start FEN plus UCI move list; fully replayable. */
export interface GameRecord {
  rules: string;
  startFen: string;
  moves: string[];
}

export function replay(rules: Ruleset, rec: { startFen?: string; moves: string[] }): Position {
  const pos = Position.fromFen(rec.startFen ?? startFen(rules), rules);
  for (const u of rec.moves) {
    const m = uciToMove(pos, u);
    if (!m) throw new Error('illegal move in record: ' + u);
    pos.make(m);
  }
  return pos;
}

export function sideName(c: Color) {
  return c === WHITE ? 'White' : 'Black';
}

