/**
 * Alpha-beta (negamax, PVS) search with iterative deepening, transposition
 * table, null-move pruning, late-move reductions, killer/history ordering,
 * check extension and quiescence search.
 */
import {
  Position,
  WHITE,
  PAWN,
  QUEEN,
  EMPTY,
  mFrom,
  mTo,
  mPromo,
  mFlag,
  FLAG_EP,
  pieceType,
} from './board';
import { evaluate, MAT_MG, NEUTRAL, type Personality } from './eval';

export const MATE = 30000;
export const INF = 32000;
const MAX_PLY = 96;

const TT_EXACT = 1;
const TT_LOWER = 2;
const TT_UPPER = 3;

export interface SearchLimits {
  depth?: number;
  nodes?: number;
  timeMs?: number;
}

export interface SearchResult {
  move: number;
  score: number; // side-to-move perspective
  depth: number;
  nodes: number;
  pv: number[];
  timeMs: number;
  /** filled when rootScores requested: [move, score][] */
  rootScores?: [number, number][];
}

export class TranspositionTable {
  mask: number;
  key: Int32Array;
  move: Int32Array;
  score: Int16Array;
  depth: Int8Array;
  flag: Int8Array;
  constructor(bits = 20) {
    const n = 1 << bits;
    this.mask = n - 1;
    this.key = new Int32Array(n);
    this.move = new Int32Array(n);
    this.score = new Int16Array(n);
    this.depth = new Int8Array(n);
    this.flag = new Int8Array(n);
  }
  clear() {
    this.flag.fill(0);
    this.move.fill(0);
  }
}

/** Late-move-reduction table: round(0.75 + ln(depth)·ln(moveNumber)/2.25). */
const LMR = new Int8Array(64 * 64);
for (let d = 1; d < 64; d++) for (let m = 1; m < 64; m++) LMR[d * 64 + m] = Math.floor(0.75 + (Math.log(d) * Math.log(m)) / 2.25);

/** Search feature switches for A/B experiments (research); defaults are what ships. */
export const SEARCH_OPTS = { lmp: true, qsTT: true, countermove: true };

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class Searcher {
  tt: TranspositionTable;
  pers: Personality = NEUTRAL;
  nodes = 0;
  private stopped = false;
  private deadline = Infinity;
  private nodeLimit = Infinity;
  private killers = new Int32Array(MAX_PLY * 2);
  private history = new Int32Array(16 * 99);
  private moveBuf = new Int32Array(MAX_PLY * 256);
  private scoreBuf = new Int32Array(MAX_PLY * 256);
  private pvTable = new Int32Array(MAX_PLY * MAX_PLY);
  private pvLen = new Int32Array(MAX_PLY);
  private quietTried = new Int32Array(MAX_PLY * 64);
  /** countermove table: best quiet reply indexed by the previous move's from/to */
  private counterMove = new Int32Array(1 << 14);
  private rootSide = WHITE;
  /** optional deterministic eval noise amplitude (cp) for weaker tiers */
  noise = 0;
  noiseSeed = 0;

  constructor(ttBits = 20) {
    this.tt = new TranspositionTable(ttBits);
  }

  private evalPos(pos: Position): number {
    let e = evaluate(pos, this.pers);
    if (this.noise) {
      // hash-derived pseudo-random noise: stable for a position within one game
      let h = (pos.hashLo ^ this.noiseSeed) | 0;
      h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
      h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
      h ^= h >>> 16;
      e += (((h & 0xffff) / 0xffff) * 2 - 1) * this.noise;
    }
    return e | 0;
  }

  private drawScore(pos: Position): number {
    // contempt: the engine dislikes draws by `contempt` centipawns
    return pos.side === this.rootSide ? -this.pers.contempt : this.pers.contempt;
  }

  search(pos: Position, limits: SearchLimits, opts: { rootScores?: boolean; rootMargin?: number } = {}): SearchResult {
    const t0 = now();
    this.nodes = 0;
    this.stopped = false;
    this.deadline = limits.timeMs ? t0 + limits.timeMs : Infinity;
    this.nodeLimit = limits.nodes ?? Infinity;
    this.killers.fill(0);
    for (let i = 0; i < this.history.length; i++) this.history[i] >>= 2;
    this.rootSide = pos.side;
    const maxDepth = Math.min(limits.depth ?? 64, MAX_PLY - 8);

    const legal = pos.legalMoves();
    if (legal.length === 0) return { move: 0, score: 0, depth: 0, nodes: 0, pv: [], timeMs: 0 };
    let best: SearchResult = { move: legal[0], score: 0, depth: 0, nodes: 0, pv: [legal[0]], timeMs: 0 };
    if (legal.length === 1 && !opts.rootScores) {
      best.score = this.evalPos(pos);
      return best;
    }
    let prevScore = 0;
    let iterStart = 0;
    for (let d = 1; d <= maxDepth; d++) {
      iterStart = this.nodes;
      let score: number;
      if (d >= 4 && Math.abs(prevScore) < MATE - 200) {
        // aspiration window
        let a = prevScore - 40;
        let bta = prevScore + 40;
        while (true) {
          score = this.negamax(pos, d, a, bta, 0, true);
          if (this.stopped) break;
          if (score <= a) a = Math.max(-INF, a - 160);
          else if (score >= bta) bta = Math.min(INF, bta + 160);
          else break;
          if (a <= -INF + 1 && bta >= INF - 1) {
            score = this.negamax(pos, d, -INF, INF, 0, true);
            break;
          }
        }
      } else score = this.negamax(pos, d, -INF, INF, 0, true);
      if (this.stopped && d > 1) break;
      prevScore = score;
      const pv: number[] = [];
      for (let i = 0; i < this.pvLen[0]; i++) pv.push(this.pvTable[i]);
      if (pv.length && pv[0]) {
        best = { move: pv[0], score, depth: d, nodes: this.nodes, pv, timeMs: now() - t0 };
      }
      if (this.stopped) break;
      if (Math.abs(score) > MATE - 100 && d > 2) break; // found a mate
      // soft time control: don't start an iteration we likely can't finish
      if (limits.timeMs && now() - t0 > limits.timeMs * 0.45) break;
      // node budget: only start the next iteration if it is predicted to finish
      // (iteration cost grows ~2.5x per ply); partial iterations are wasted work.
      const iterNodes = this.nodes - iterStart;
      if (limits.nodes && this.nodes + iterNodes * 2.5 > this.nodeLimit) break;
    }
    if (opts.rootScores) {
      // Score root moves at the completed depth inside a window [best-margin, best+64]:
      // exact values are only needed for moves that could be chosen. Moves that fail
      // low keep their (upper-bound) score and are filtered by the caller's margin.
      const d = Math.max(1, best.depth);
      const margin = opts.rootMargin ?? 300;
      const lo = best.score - margin - 1;
      const hi = best.score + 64;
      this.stopped = false;
      this.deadline = Infinity;
      this.nodeLimit = this.nodes + Math.max(2000, (limits.nodes ?? 100000) * 2);
      const rs: [number, number][] = [];
      for (const m of legal) {
        if (m === best.move) {
          rs.push([m, best.score]);
          continue;
        }
        pos.make(m);
        const sc = -this.negamax(pos, d - 1, -hi, -lo, 1, true);
        pos.unmake();
        if (this.stopped) break;
        // never let a re-searched alternative outrank the main search's choice
        // (search instability would otherwise promote arbitrary moves)
        rs.push([m, Math.min(sc, best.score - 1)]);
      }
      this.stopped = false;
      rs.sort((a, b) => b[1] - a[1]);
      best.rootScores = rs;
    }
    best.nodes = this.nodes;
    best.timeMs = now() - t0;
    return best;
  }

  private checkStop() {
    if (this.nodes >= this.nodeLimit || now() >= this.deadline) this.stopped = true;
  }

  private orderMoves(pos: Position, base: number, n: number, ttMove: number, ply: number) {
    const b = pos.board;
    const k1 = this.killers[ply * 2];
    const k2 = this.killers[ply * 2 + 1];
    for (let i = base; i < n; i++) {
      const m = this.moveBuf[i];
      let sc: number;
      if (m === ttMove) sc = 10_000_000;
      else {
        const victim = mFlag(m) === FLAG_EP ? PAWN : pieceType(b[mTo(m)]);
        const promo = mPromo(m);
        if (victim) {
          const mvv = MAT_MG[victim] * 10 - MAT_MG[pieceType(b[mFrom(m)])] / 10;
          // winning/equal captures first; losing captures (SEE < 0) after quiet moves
          sc = MAT_MG[pieceType(b[mFrom(m)])] <= MAT_MG[victim] || pos.see(m) >= 0 ? 1_000_000 + mvv : -200_000 + mvv;
        }
        else if (promo === QUEEN) sc = 900_000;
        else if (m === k1) sc = 800_000;
        else if (m === k2) sc = 700_000;
        else if (SEARCH_OPTS.countermove && m === this.counterMove[(pos.lastMove() & 0x3fff)]) sc = 600_000;
        else if (promo) sc = -100_000;
        else sc = this.history[b[mFrom(m)] * 99 + mTo(m)];
      }
      this.scoreBuf[i] = sc;
    }
  }

  private pickNext(i: number, n: number) {
    let bi = i;
    let bs = this.scoreBuf[i];
    for (let j = i + 1; j < n; j++) {
      if (this.scoreBuf[j] > bs) {
        bs = this.scoreBuf[j];
        bi = j;
      }
    }
    if (bi !== i) {
      const tm = this.moveBuf[i];
      this.moveBuf[i] = this.moveBuf[bi];
      this.moveBuf[bi] = tm;
      const ts = this.scoreBuf[i];
      this.scoreBuf[i] = this.scoreBuf[bi];
      this.scoreBuf[bi] = ts;
    }
  }

  private hasNonPawn(pos: Position): boolean {
    const c = pos.side << 3;
    const k = pos.counts;
    return k[c | 2] + k[c | 3] + k[c | 4] + k[c | 5] > 0;
  }

  negamax(pos: Position, depth: number, alpha: number, beta: number, ply: number, allowNull: boolean): number {
    this.pvLen[ply] = ply;
    if ((++this.nodes & 1023) === 0) this.checkStop();
    if (this.stopped) return 0;
    const isPv = beta - alpha > 1;

    if (ply > 0) {
      if (pos.halfmove >= pos.rules.quietPlyLimit) return this.drawScore(pos);
      if (pos.repetitions() > 0) return this.drawScore(pos);
      if (pos.insufficientMaterial()) return this.drawScore(pos);
      // mate distance pruning
      const ma = Math.max(alpha, -MATE + ply);
      const mb = Math.min(beta, MATE - ply - 1);
      if (ma >= mb) return ma;
      if (ply >= MAX_PLY - 4) return this.evalPos(pos);
    }

    const inCheck = pos.inCheck();
    if (inCheck) depth++;
    if (depth <= 0) return this.qsearch(pos, alpha, beta, ply, 0);

    // TT probe
    const tt = this.tt;
    const idx = pos.hashLo & tt.mask;
    let ttMove = 0;
    if (tt.flag[idx] && tt.key[idx] === pos.hashHi) {
      ttMove = tt.move[idx];
      if (tt.depth[idx] >= depth && ply > 0) {
        let s = tt.score[idx];
        if (s > MATE - 200) s -= ply;
        else if (s < -MATE + 200) s += ply;
        const f = tt.flag[idx];
        if (!isPv && (f === TT_EXACT || (f === TT_LOWER && s >= beta) || (f === TT_UPPER && s <= alpha))) return s;
      }
    }

    let staticEval = 0;
    if (!inCheck) {
      staticEval = this.evalPos(pos);
      // reverse futility pruning
      if (!isPv && depth <= 3 && staticEval - 100 * depth >= beta && Math.abs(beta) < MATE - 200) return staticEval;
      // null move pruning
      if (allowNull && !isPv && depth >= 3 && staticEval >= beta && this.hasNonPawn(pos)) {
        const R = 2 + (depth >> 2);
        pos.makeNull();
        const s = -this.negamax(pos, depth - 1 - R, -beta, -beta + 1, ply + 1, false);
        pos.unmakeNull();
        if (this.stopped) return 0;
        if (s >= beta) return s >= MATE - 200 ? beta : s;
      }
    }

    const base = ply * 256;
    const n = pos.generate(this.moveBuf, base, false);
    this.orderMoves(pos, base, n, ttMove, ply);
    let legal = 0;
    let bestScore = -INF;
    let bestMove = 0;
    const origAlpha = alpha;
    const b = pos.board;
    let nQuiet = 0;
    for (let i = base; i < n; i++) {
      this.pickNext(i, n);
      const m = this.moveBuf[i];
      const isCapture = b[mTo(m)] !== EMPTY || mFlag(m) === FLAG_EP;
      const isQuiet = !isCapture && !mPromo(m);
      if (!pos.make(m)) continue;
      legal++;
      const givesCheck = pos.inCheck();
      // futility pruning of quiet moves at frontier nodes, and late-move pruning
      if (
        !isPv && !inCheck && isQuiet && !givesCheck && legal > 1 &&
        ((depth <= 2 && staticEval + 120 * depth <= alpha) || (SEARCH_OPTS.lmp && depth <= 3 && legal > 4 + depth * depth * 2 && Math.abs(alpha) < MATE - 200))
      ) {
        pos.unmake();
        continue;
      }
      let s: number;
      if (isQuiet && nQuiet < 64) this.quietTried[ply * 64 + nQuiet++] = m;
      if (legal === 1) s = -this.negamax(pos, depth - 1, -beta, -alpha, ply + 1, true);
      else {
        let red = 0;
        if (depth >= 3 && isQuiet && !inCheck && !givesCheck && legal > 3) {
          red = LMR[Math.min(depth, 63) * 64 + Math.min(legal, 63)];
          if (isPv) red--;
          if (m === this.killers[ply * 2] || m === this.killers[ply * 2 + 1]) red--;
          if (this.history[b[mFrom(m)] * 99 + mTo(m)] > 4000) red--;
          if (red > depth - 2) red = depth - 2;
          if (red < 0) red = 0;
        }
        s = -this.negamax(pos, depth - 1 - red, -alpha - 1, -alpha, ply + 1, true);
        if (s > alpha && red > 0) s = -this.negamax(pos, depth - 1, -alpha - 1, -alpha, ply + 1, true);
        if (s > alpha && s < beta) s = -this.negamax(pos, depth - 1, -beta, -alpha, ply + 1, true);
      }
      pos.unmake();
      if (this.stopped) return 0;
      if (s > bestScore) {
        bestScore = s;
        bestMove = m;
        if (s > alpha) {
          alpha = s;
          // update PV
          this.pvTable[ply * MAX_PLY + ply] = m;
          for (let j = ply + 1; j < this.pvLen[ply + 1]; j++) this.pvTable[ply * MAX_PLY + j] = this.pvTable[(ply + 1) * MAX_PLY + j];
          this.pvLen[ply] = Math.max(this.pvLen[ply + 1], ply + 1);
          if (s >= beta) {
            if (isQuiet) {
              if (SEARCH_OPTS.countermove) this.counterMove[pos.lastMove() & 0x3fff] = m;
              if (this.killers[ply * 2] !== m) {
                this.killers[ply * 2 + 1] = this.killers[ply * 2];
                this.killers[ply * 2] = m;
              }
              const hi = b[mFrom(m)] * 99 + mTo(m);
              this.history[hi] += depth * depth;
              if (this.history[hi] > 500_000) for (let k = 0; k < this.history.length; k++) this.history[k] >>= 1;
              // history malus for the quiet moves tried before the cutoff move
              for (let q = 0; q < nQuiet - 1; q++) {
                const qm = this.quietTried[ply * 64 + q];
                this.history[b[mFrom(qm)] * 99 + mTo(qm)] -= depth * depth;
              }
            }
            break;
          }
        }
      }
    }
    if (legal === 0) {
      if (inCheck) return -MATE + ply;
      return pos.rules.stalemate === 'loss' ? -MATE + ply : this.drawScore(pos);
    }
    // store
    const flag = bestScore >= beta ? TT_LOWER : bestScore > origAlpha ? TT_EXACT : TT_UPPER;
    if (tt.depth[idx] <= depth || tt.key[idx] !== pos.hashHi || flag === TT_EXACT) {
      let st = bestScore;
      if (st > MATE - 200) st += ply;
      else if (st < -MATE + 200) st -= ply;
      tt.key[idx] = pos.hashHi;
      tt.move[idx] = bestMove;
      tt.score[idx] = st;
      tt.depth[idx] = depth;
      tt.flag[idx] = flag;
    }
    return bestScore;
  }

  qsearch(pos: Position, alpha: number, beta: number, ply: number, qd: number): number {
    this.pvLen[ply] = ply;
    if ((++this.nodes & 1023) === 0) this.checkStop();
    if (this.stopped) return 0;
    if (ply >= MAX_PLY - 2) return this.evalPos(pos);
    const inCheck = qd < 4 && pos.inCheck();
    const tt = this.tt;
    const tidx = pos.hashLo & tt.mask;
    if (SEARCH_OPTS.qsTT && tt.flag[tidx] && tt.key[tidx] === pos.hashHi) {
      let s = tt.score[tidx];
      if (s > MATE - 200) s -= ply;
      else if (s < -MATE + 200) s += ply;
      const f = tt.flag[tidx];
      if (f === TT_EXACT || (f === TT_LOWER && s >= beta) || (f === TT_UPPER && s <= alpha)) return s;
    }
    let best = -INF;
    if (!inCheck) {
      const stand = this.evalPos(pos);
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      best = stand;
    }
    const base = ply * 256;
    const n = pos.generate(this.moveBuf, base, !inCheck);
    this.orderMoves(pos, base, n, 0, ply);
    const b = pos.board;
    let legal = 0;
    for (let i = base; i < n; i++) {
      this.pickNext(i, n);
      const m = this.moveBuf[i];
      if (!inCheck) {
        // delta pruning
        const victim = mFlag(m) === FLAG_EP ? PAWN : pieceType(b[mTo(m)]);
        const gain = MAT_MG[victim] + (mPromo(m) ? MAT_MG[QUEEN] - MAT_MG[PAWN] : 0);
        if (best + gain + 200 < alpha && !mPromo(m)) continue;
        // skip captures that lose material by static exchange
        const attacker = pieceType(b[mFrom(m)]);
        if (MAT_MG[attacker] > MAT_MG[victim] && !mPromo(m) && pos.see(m) < 0) continue;
      }
      if (!pos.make(m)) continue;
      legal++;
      const s = -this.qsearch(pos, -beta, -alpha, ply + 1, qd + 1);
      pos.unmake();
      if (this.stopped) return 0;
      if (s > best) {
        best = s;
        if (s > alpha) {
          alpha = s;
          if (s >= beta) break;
        }
      }
    }
    if (inCheck && legal === 0) return -MATE + ply;
    return best;
  }
}

export function isMateScore(s: number) {
  return Math.abs(s) > MATE - 200;
}
export function mateIn(s: number) {
  // moves (not plies) to mate, signed
  const plies = MATE - Math.abs(s);
  return Math.sign(s) * Math.ceil(plies / 2);
}

