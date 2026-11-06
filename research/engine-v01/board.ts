/*
 * SEVEN — 7×7 chess engine core.
 *
 * Board representation: 9×11 mailbox (one border column each side, two
 * border rows top and bottom) so knight jumps from any board square land
 * either on the board or on a sentinel. Square index = (rank + 2) * 9 + file + 1.
 */
import type { Ruleset } from './rules';

export const FILES = 7;
export const RANKS = 7;
export const MB_W = 9;
export const MB_SIZE = 99;

export const WHITE = 0;
export const BLACK = 1;
export type Color = 0 | 1;

export const EMPTY = 0;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;
export const OFF = 7; // border sentinel

export const FLAG_NONE = 0;
export const FLAG_DOUBLE = 1;
export const FLAG_EP = 2;
export const FLAG_CASTLE = 3;

export const CASTLE_WS = 1; // white short (toward g-file)
export const CASTLE_WL = 2; // white long (toward a-file)
export const CASTLE_BS = 4;
export const CASTLE_BL = 8;

export const sq = (file: number, rank: number) => (rank + 2) * MB_W + file + 1;
export const fileOf = (s: number) => (s % MB_W) - 1;
export const rankOf = (s: number) => ((s / MB_W) | 0) - 2;
export const pieceType = (p: number) => p & 7;
export const pieceColor = (p: number) => (p >> 3) as Color;
export const makePiece = (color: number, type: number) => (color << 3) | type;

export const encodeMove = (from: number, to: number, promo = 0, flag = 0) =>
  from | (to << 7) | (promo << 14) | (flag << 17);
export const mFrom = (m: number) => m & 127;
export const mTo = (m: number) => (m >> 7) & 127;
export const mPromo = (m: number) => (m >> 14) & 7;
export const mFlag = (m: number) => (m >> 17) & 7;

export const KNIGHT_D = [19, 17, 11, 7, -7, -11, -17, -19];
export const KING_D = [10, 9, 8, 1, -1, -8, -9, -10];
export const DIAG_D = [10, 8, -8, -10];
export const ORTH_D = [9, 1, -1, -9];

/** All 49 playable squares, a1..g7 in rank-major order. */
export const SQUARES: number[] = [];
for (let r = 0; r < RANKS; r++) for (let f = 0; f < FILES; f++) SQUARES.push(sq(f, r));

export const squareName = (s: number) => 'abcdefg'[fileOf(s)] + (rankOf(s) + 1);
export const parseSquare = (name: string): number => {
  const f = 'abcdefg'.indexOf(name[0]);
  const r = parseInt(name.slice(1), 10) - 1;
  if (f < 0 || !(r >= 0 && r < RANKS)) return -1;
  return sq(f, r);
};

// ---------- Zobrist ----------
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) | 0;
  };
}
const rnd = mulberry32(0x5e7e7);
export const Z_PIECE_LO = new Int32Array(16 * MB_SIZE);
export const Z_PIECE_HI = new Int32Array(16 * MB_SIZE);
for (let i = 0; i < 16 * MB_SIZE; i++) {
  Z_PIECE_LO[i] = rnd();
  Z_PIECE_HI[i] = rnd();
}
export const Z_SIDE_LO = rnd();
export const Z_SIDE_HI = rnd();
export const Z_CASTLE_LO = new Int32Array(16);
export const Z_CASTLE_HI = new Int32Array(16);
for (let i = 0; i < 16; i++) {
  Z_CASTLE_LO[i] = rnd();
  Z_CASTLE_HI[i] = rnd();
}
export const Z_EP_LO = new Int32Array(MB_SIZE);
export const Z_EP_HI = new Int32Array(MB_SIZE);
for (let i = 0; i < MB_SIZE; i++) {
  Z_EP_LO[i] = rnd();
  Z_EP_HI[i] = rnd();
}

const MAX_HIST = 2048;

export class Position {
  board = new Int8Array(MB_SIZE);
  side: Color = WHITE;
  castle = 0;
  ep = 0;
  halfmove = 0;
  fullmove = 1;
  hashLo = 0;
  hashHi = 0;
  kingSq = [0, 0];
  /** counts[color*8 + type] */
  counts = new Int8Array(16);
  rules: Ruleset;

  // castling geometry, derived from ruleset
  castleMask = new Int8Array(MB_SIZE);
  /** [color*2 + (0 short / 1 long)] */
  cKingFrom = [0, 0];
  cKingTo = [0, 0, 0, 0];
  cRookFrom = [0, 0, 0, 0];
  cRookTo = [0, 0, 0, 0];

  // undo stack
  ply = 0; // number of moves made from the root of the history
  private uMove = new Int32Array(MAX_HIST);
  private uCap = new Int8Array(MAX_HIST);
  private uCastle = new Int8Array(MAX_HIST);
  private uEp = new Int8Array(MAX_HIST);
  private uHalf = new Int16Array(MAX_HIST);
  hLo = new Int32Array(MAX_HIST + 1);
  hHi = new Int32Array(MAX_HIST + 1);

  constructor(rules: Ruleset) {
    this.rules = rules;
    this.setupCastleGeometry();
  }

  private setupCastleGeometry() {
    const r = this.rules;
    this.castleMask.fill(15);
    const kf = r.backRank.indexOf('K');
    for (let c = 0; c < 2; c++) {
      const rank = c === WHITE ? 0 : RANKS - 1;
      this.cKingFrom[c] = sq(kf, rank);
      const shortBit = c === WHITE ? CASTLE_WS : CASTLE_BS;
      const longBit = c === WHITE ? CASTLE_WL : CASTLE_BL;
      this.castleMask[sq(kf, rank)] = 15 & ~(shortBit | longBit);
      if (r.castling) {
        this.cKingTo[c * 2] = sq(r.castling.shortKing, rank);
        this.cRookTo[c * 2] = sq(r.castling.shortRook, rank);
        this.cRookFrom[c * 2] = sq(FILES - 1, rank);
        this.cKingTo[c * 2 + 1] = sq(r.castling.longKing, rank);
        this.cRookTo[c * 2 + 1] = sq(r.castling.longRook, rank);
        this.cRookFrom[c * 2 + 1] = sq(0, rank);
        this.castleMask[sq(FILES - 1, rank)] = 15 & ~shortBit;
        this.castleMask[sq(0, rank)] = 15 & ~longBit;
      }
    }
  }

  clone(): Position {
    const p = new Position(this.rules);
    p.board.set(this.board);
    p.side = this.side;
    p.castle = this.castle;
    p.ep = this.ep;
    p.halfmove = this.halfmove;
    p.fullmove = this.fullmove;
    p.hashLo = this.hashLo;
    p.hashHi = this.hashHi;
    p.kingSq = [...this.kingSq];
    p.counts.set(this.counts);
    p.ply = this.ply;
    p.uMove.set(this.uMove);
    p.uCap.set(this.uCap);
    p.uCastle.set(this.uCastle);
    p.uEp.set(this.uEp);
    p.uHalf.set(this.uHalf);
    p.hLo.set(this.hLo);
    p.hHi.set(this.hHi);
    return p;
  }

  // ---------- FEN ----------
  static fromFen(fen: string, rules: Ruleset): Position {
    const p = new Position(rules);
    p.board.fill(OFF);
    for (const s of SQUARES) p.board[s] = EMPTY;
    const parts = fen.trim().split(/\s+/);
    const rows = parts[0].split('/');
    if (rows.length !== RANKS) throw new Error('bad FEN rank count');
    for (let i = 0; i < RANKS; i++) {
      const rank = RANKS - 1 - i;
      let file = 0;
      for (const ch of rows[i]) {
        if (ch >= '1' && ch <= '9') {
          file += parseInt(ch, 10);
          continue;
        }
        const t = 'pnbrqk'.indexOf(ch.toLowerCase()) + 1;
        if (t === 0) throw new Error('bad FEN piece ' + ch);
        if (file >= FILES) throw new Error('bad FEN file overflow');
        const color = ch === ch.toLowerCase() ? BLACK : WHITE;
        p.board[sq(file, rank)] = makePiece(color, t);
        file++;
      }
      if (file !== FILES) throw new Error('bad FEN row width');
    }
    p.side = parts[1] === 'b' ? BLACK : WHITE;
    p.castle = 0;
    const c = parts[2] ?? '-';
    if (rules.castling) {
      if (c.includes('K')) p.castle |= CASTLE_WS;
      if (c.includes('Q')) p.castle |= CASTLE_WL;
      if (c.includes('k')) p.castle |= CASTLE_BS;
      if (c.includes('q')) p.castle |= CASTLE_BL;
    }
    p.ep = parts[3] && parts[3] !== '-' ? parseSquare(parts[3]) : 0;
    if (p.ep < 0) p.ep = 0;
    p.halfmove = parseInt(parts[4] ?? '0', 10) || 0;
    p.fullmove = parseInt(parts[5] ?? '1', 10) || 1;
    p.recompute();
    return p;
  }

  recompute() {
    this.counts.fill(0);
    this.hashLo = 0;
    this.hashHi = 0;
    for (const s of SQUARES) {
      const pc = this.board[s];
      if (pc === EMPTY) continue;
      this.counts[pc]++;
      if (pieceType(pc) === KING) this.kingSq[pieceColor(pc)] = s;
      this.hashLo ^= Z_PIECE_LO[pc * MB_SIZE + s];
      this.hashHi ^= Z_PIECE_HI[pc * MB_SIZE + s];
    }
    // sanitize castling rights against the actual board
    for (let c = 0; c < 2 && this.rules.castling; c++) {
      const k = makePiece(c, KING);
      const rk = makePiece(c, ROOK);
      const sb = c === WHITE ? CASTLE_WS : CASTLE_BS;
      const lb = c === WHITE ? CASTLE_WL : CASTLE_BL;
      if (this.board[this.cKingFrom[c]] !== k) this.castle &= ~(sb | lb);
      if (this.board[this.cRookFrom[c * 2]] !== rk) this.castle &= ~sb;
      if (this.board[this.cRookFrom[c * 2 + 1]] !== rk) this.castle &= ~lb;
    }
    if (this.side === BLACK) {
      this.hashLo ^= Z_SIDE_LO;
      this.hashHi ^= Z_SIDE_HI;
    }
    this.hashLo ^= Z_CASTLE_LO[this.castle];
    this.hashHi ^= Z_CASTLE_HI[this.castle];
    if (this.ep) {
      this.hashLo ^= Z_EP_LO[this.ep];
      this.hashHi ^= Z_EP_HI[this.ep];
    }
    this.ply = 0;
    this.hLo[0] = this.hashLo;
    this.hHi[0] = this.hashHi;
  }

  toFen(): string {
    const rows: string[] = [];
    for (let r = RANKS - 1; r >= 0; r--) {
      let row = '';
      let empty = 0;
      for (let f = 0; f < FILES; f++) {
        const pc = this.board[sq(f, r)];
        if (pc === EMPTY) {
          empty++;
          continue;
        }
        if (empty) row += empty;
        empty = 0;
        const ch = ' pnbrqk'[pieceType(pc)];
        row += pieceColor(pc) === WHITE ? ch.toUpperCase() : ch;
      }
      if (empty) row += empty;
      rows.push(row);
    }
    let c = '';
    if (this.castle & CASTLE_WS) c += 'K';
    if (this.castle & CASTLE_WL) c += 'Q';
    if (this.castle & CASTLE_BS) c += 'k';
    if (this.castle & CASTLE_BL) c += 'q';
    return `${rows.join('/')} ${this.side === WHITE ? 'w' : 'b'} ${c || '-'} ${
      this.ep ? squareName(this.ep) : '-'
    } ${this.halfmove} ${this.fullmove}`;
  }

  // ---------- attacks ----------
  isAttacked(s: number, by: number): boolean {
    const b = this.board;
    if (by === WHITE) {
      if (b[s - 8] === PAWN || b[s - 10] === PAWN) return true;
    } else {
      const bp = 8 | PAWN;
      if (b[s + 8] === bp || b[s + 10] === bp) return true;
    }
    const n = (by << 3) | KNIGHT;
    for (let i = 0; i < 8; i++) if (b[s + KNIGHT_D[i]] === n) return true;
    const k = (by << 3) | KING;
    for (let i = 0; i < 8; i++) if (b[s + KING_D[i]] === k) return true;
    const bq = (by << 3) | QUEEN;
    const bb = (by << 3) | BISHOP;
    const br = (by << 3) | ROOK;
    for (let i = 0; i < 4; i++) {
      const d = DIAG_D[i];
      let t = s + d;
      while (b[t] === EMPTY) t += d;
      if (b[t] === bb || b[t] === bq) return true;
    }
    for (let i = 0; i < 4; i++) {
      const d = ORTH_D[i];
      let t = s + d;
      while (b[t] === EMPTY) t += d;
      if (b[t] === br || b[t] === bq) return true;
    }
    return false;
  }

  inCheck(color: number = this.side): boolean {
    return this.isAttacked(this.kingSq[color], color ^ 1);
  }

  // ---------- move generation (pseudo-legal) ----------
  /**
   * Generates pseudo-legal moves into `out` starting at `start`; returns new length.
   * If tacticalOnly, only captures and queen promotions are generated.
   */
  generate(out: Int32Array, start: number, tacticalOnly: boolean): number {
    const b = this.board;
    const us = this.side;
    const them = us ^ 1;
    let n = start;
    const fwd = us === WHITE ? 9 : -9;
    const promoRank = us === WHITE ? RANKS - 1 : 0;
    const startRank = us === WHITE ? 1 : RANKS - 2;
    for (let i = 0; i < SQUARES.length; i++) {
      const s = SQUARES[i];
      const pc = b[s];
      if (pc === EMPTY || pc >> 3 !== us) continue;
      const t = pc & 7;
      if (t === PAWN) {
        const one = s + fwd;
        const promo = rankOf(one) === promoRank;
        if (b[one] === EMPTY) {
          if (promo) {
            out[n++] = encodeMove(s, one, QUEEN);
            if (!tacticalOnly) {
              out[n++] = encodeMove(s, one, ROOK);
              out[n++] = encodeMove(s, one, BISHOP);
              out[n++] = encodeMove(s, one, KNIGHT);
            }
          } else if (!tacticalOnly) {
            out[n++] = encodeMove(s, one);
            if (this.rules.pawnDouble && rankOf(s) === startRank && b[one + fwd] === EMPTY)
              out[n++] = encodeMove(s, one + fwd, 0, FLAG_DOUBLE);
          }
        }
        for (const cd of [fwd - 1, fwd + 1]) {
          const to = s + cd;
          const tp = b[to];
          if (tp !== EMPTY && tp !== OFF && tp >> 3 === them) {
            if (promo) {
              out[n++] = encodeMove(s, to, QUEEN);
              if (!tacticalOnly) {
                out[n++] = encodeMove(s, to, ROOK);
                out[n++] = encodeMove(s, to, BISHOP);
                out[n++] = encodeMove(s, to, KNIGHT);
              }
            } else out[n++] = encodeMove(s, to);
          } else if (to === this.ep && this.ep !== 0) {
            out[n++] = encodeMove(s, to, 0, FLAG_EP);
          }
        }
        continue;
      }
      if (t === KNIGHT || t === KING) {
        const D = t === KNIGHT ? KNIGHT_D : KING_D;
        for (let j = 0; j < 8; j++) {
          const to = s + D[j];
          const tp = b[to];
          if (tp === OFF) continue;
          if (tp === EMPTY) {
            if (!tacticalOnly) out[n++] = encodeMove(s, to);
          } else if (tp >> 3 === them) out[n++] = encodeMove(s, to);
        }
        if (t === KING && !tacticalOnly && this.castle) n = this.genCastles(out, n);
        continue;
      }
      // sliders
      if (t === BISHOP || t === QUEEN) n = this.slide(out, n, s, DIAG_D, them, tacticalOnly);
      if (t === ROOK || t === QUEEN) n = this.slide(out, n, s, ORTH_D, them, tacticalOnly);
    }
    return n;
  }

  private slide(out: Int32Array, n: number, s: number, D: number[], them: number, tac: boolean) {
    const b = this.board;
    for (let j = 0; j < 4; j++) {
      const d = D[j];
      let to = s + d;
      while (b[to] === EMPTY) {
        if (!tac) out[n++] = encodeMove(s, to);
        to += d;
      }
      const tp = b[to];
      if (tp !== OFF && tp >> 3 === them) out[n++] = encodeMove(s, to);
    }
    return n;
  }

  private genCastles(out: Int32Array, n: number): number {
    const us = this.side;
    const them = us ^ 1;
    const kFrom = this.cKingFrom[us];
    if (this.kingSq[us] !== kFrom) return n;
    for (let w = 0; w < 2; w++) {
      const bit = us === WHITE ? (w === 0 ? CASTLE_WS : CASTLE_WL) : w === 0 ? CASTLE_BS : CASTLE_BL;
      if (!(this.castle & bit)) continue;
      const i = us * 2 + w;
      const kTo = this.cKingTo[i];
      const rFrom = this.cRookFrom[i];
      const rTo = this.cRookTo[i];
      if (this.board[rFrom] !== makePiece(us, ROOK)) continue;
      const lo = Math.min(kFrom, kTo, rFrom, rTo);
      const hi = Math.max(kFrom, kTo, rFrom, rTo);
      let ok = true;
      for (let s = lo; s <= hi; s++) {
        if (s === kFrom || s === rFrom) continue;
        if (this.board[s] !== EMPTY) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      const step = kTo > kFrom ? 1 : -1;
      for (let s = kFrom; ; s += step) {
        if (this.isAttacked(s, them)) {
          ok = false;
          break;
        }
        if (s === kTo) break;
      }
      if (!ok) continue;
      out[n++] = encodeMove(kFrom, kTo, w + 1, FLAG_CASTLE);
    }
    return n;
  }

  // ---------- make / unmake ----------
  private put(s: number, pc: number) {
    this.board[s] = pc;
    this.hashLo ^= Z_PIECE_LO[pc * MB_SIZE + s];
    this.hashHi ^= Z_PIECE_HI[pc * MB_SIZE + s];
  }
  private remove(s: number) {
    const pc = this.board[s];
    this.board[s] = EMPTY;
    this.hashLo ^= Z_PIECE_LO[pc * MB_SIZE + s];
    this.hashHi ^= Z_PIECE_HI[pc * MB_SIZE + s];
  }

  /** Makes a pseudo-legal move. Returns false (and undoes it) if it leaves own king in check. */
  make(m: number): boolean {
    const from = mFrom(m);
    const to = mTo(m);
    const flag = mFlag(m);
    const b = this.board;
    const us = this.side;
    const pc = b[from];
    const p = this.ply;
    this.uMove[p] = m;
    this.uCastle[p] = this.castle;
    this.uEp[p] = this.ep;
    this.uHalf[p] = this.halfmove;
    this.hashLo ^= Z_CASTLE_LO[this.castle];
    this.hashHi ^= Z_CASTLE_HI[this.castle];
    if (this.ep) {
      this.hashLo ^= Z_EP_LO[this.ep];
      this.hashHi ^= Z_EP_HI[this.ep];
    }
    this.ep = 0;
    let cap = EMPTY;
    if (flag === FLAG_CASTLE) {
      const i = us * 2 + (mPromo(m) - 1);
      const rFrom = this.cRookFrom[i];
      const rTo = this.cRookTo[i];
      const rook = b[rFrom];
      this.remove(from);
      this.remove(rFrom);
      this.put(to, pc);
      this.put(rTo, rook);
      this.kingSq[us] = to;
      this.halfmove++;
    } else {
      if (flag === FLAG_EP) {
        const capSq = to - (us === WHITE ? 9 : -9);
        cap = b[capSq];
        this.remove(capSq);
      } else {
        cap = b[to];
        if (cap !== EMPTY) this.remove(to);
      }
      if (cap !== EMPTY) this.counts[cap]--;
      this.remove(from);
      const promo = mPromo(m);
      if (promo) {
        const np = makePiece(us, promo);
        this.put(to, np);
        this.counts[pc]--;
        this.counts[np]++;
      } else this.put(to, pc);
      if ((pc & 7) === KING) this.kingSq[us] = to;
      if ((pc & 7) === PAWN || cap !== EMPTY) this.halfmove = 0;
      else this.halfmove++;
      if (flag === FLAG_DOUBLE) {
        const epSq = (from + to) >> 1;
        // only set ep if an enemy pawn can actually capture (keeps hashes canonical)
        const ep = makePiece(us ^ 1, PAWN);
        if (b[to - 1] === ep || b[to + 1] === ep) {
          this.ep = epSq;
          this.hashLo ^= Z_EP_LO[epSq];
          this.hashHi ^= Z_EP_HI[epSq];
        }
      }
    }
    this.uCap[p] = cap;
    this.castle &= this.castleMask[from] & this.castleMask[to];
    this.hashLo ^= Z_CASTLE_LO[this.castle];
    this.hashHi ^= Z_CASTLE_HI[this.castle];
    this.side = (us ^ 1) as Color;
    this.hashLo ^= Z_SIDE_LO;
    this.hashHi ^= Z_SIDE_HI;
    if (us === BLACK) this.fullmove++;
    this.ply = p + 1;
    this.hLo[this.ply] = this.hashLo;
    this.hHi[this.ply] = this.hashHi;
    if (this.isAttacked(this.kingSq[us], us ^ 1)) {
      this.unmake();
      return false;
    }
    return true;
  }

  unmake() {
    const p = --this.ply;
    const m = this.uMove[p];
    const from = mFrom(m);
    const to = mTo(m);
    const flag = mFlag(m);
    const them = this.side;
    const us = (them ^ 1) as Color;
    this.side = us;
    if (us === BLACK) this.fullmove--;
    const b = this.board;
    if (flag === FLAG_CASTLE) {
      const i = us * 2 + (mPromo(m) - 1);
      const k = b[to];
      const rook = b[this.cRookTo[i]];
      b[to] = EMPTY;
      b[this.cRookTo[i]] = EMPTY;
      b[from] = k;
      b[this.cRookFrom[i]] = rook;
      this.kingSq[us] = from;
    } else {
      let pc = b[to];
      const promo = mPromo(m);
      if (promo) {
        this.counts[pc]--;
        pc = makePiece(us, PAWN);
        this.counts[pc]++;
      }
      b[from] = pc;
      b[to] = EMPTY;
      const cap = this.uCap[p];
      if (cap !== EMPTY) {
        this.counts[cap]++;
        if (flag === FLAG_EP) b[to - (us === WHITE ? 9 : -9)] = cap;
        else b[to] = cap;
      }
      if ((pc & 7) === KING) this.kingSq[us] = from;
    }
    this.castle = this.uCastle[p];
    this.ep = this.uEp[p];
    this.halfmove = this.uHalf[p];
    this.hashLo = this.hLo[p];
    this.hashHi = this.hHi[p];
  }

  makeNull() {
    const p = this.ply;
    this.uMove[p] = 0;
    this.uCastle[p] = this.castle;
    this.uEp[p] = this.ep;
    this.uHalf[p] = this.halfmove;
    this.uCap[p] = 0;
    if (this.ep) {
      this.hashLo ^= Z_EP_LO[this.ep];
      this.hashHi ^= Z_EP_HI[this.ep];
    }
    this.ep = 0;
    this.side = (this.side ^ 1) as Color;
    this.hashLo ^= Z_SIDE_LO;
    this.hashHi ^= Z_SIDE_HI;
    this.halfmove++;
    this.ply = p + 1;
    this.hLo[this.ply] = this.hashLo;
    this.hHi[this.ply] = this.hashHi;
  }
  unmakeNull() {
    const p = --this.ply;
    this.side = (this.side ^ 1) as Color;
    this.ep = this.uEp[p];
    this.halfmove = this.uHalf[p];
    this.hashLo = this.hLo[p];
    this.hashHi = this.hHi[p];
  }

  lastMove(): number {
    return this.ply > 0 ? this.uMove[this.ply - 1] : 0;
  }
  lastCapture(): number {
    return this.ply > 0 ? this.uCap[this.ply - 1] : 0;
  }

  /** How many times the current position occurred before (within reversible window). */
  repetitions(): number {
    let count = 0;
    const lo = this.hashLo;
    const hi = this.hashHi;
    const lim = Math.min(this.halfmove, this.ply);
    for (let i = 2; i <= lim; i += 2) {
      const j = this.ply - i;
      if (this.hLo[j] === lo && this.hHi[j] === hi) count++;
    }
    return count;
  }

  legalMoves(): number[] {
    const buf = new Int32Array(256);
    const n = this.generate(buf, 0, false);
    const res: number[] = [];
    for (let i = 0; i < n; i++) {
      if (this.make(buf[i])) {
        res.push(buf[i]);
        this.unmake();
      }
    }
    return res;
  }

  hasLegalMove(): boolean {
    const buf = new Int32Array(256);
    const n = this.generate(buf, 0, false);
    for (let i = 0; i < n; i++) {
      if (this.make(buf[i])) {
        this.unmake();
        return true;
      }
    }
    return false;
  }

  /** Dead-position test (no sequence of legal moves can mate). */
  insufficientMaterial(): boolean {
    const c = this.counts;
    for (const t of [PAWN, ROOK, QUEEN]) if (c[t] || c[8 | t]) return false;
    const wMinor = c[KNIGHT] + c[BISHOP];
    const bMinor = c[8 | KNIGHT] + c[8 | BISHOP];
    if (wMinor + bMinor <= 1) return true;
    // only bishops, all on one square colour
    if (c[KNIGHT] === 0 && c[8 | KNIGHT] === 0) {
      let colors = 0;
      for (const s of SQUARES) {
        const pc = this.board[s];
        if ((pc & 7) === BISHOP) colors |= 1 << ((fileOf(s) + rankOf(s)) & 1);
      }
      if (colors !== 3) return true;
    }
    return false;
  }

  perft(depth: number): number {
    if (depth === 0) return 1;
    const buf = new Int32Array(256);
    const n = this.generate(buf, 0, false);
    let total = 0;
    for (let i = 0; i < n; i++) {
      if (!this.make(buf[i])) continue;
      total += depth === 1 ? 1 : this.perft(depth - 1);
      this.unmake();
    }
    return total;
  }
}
