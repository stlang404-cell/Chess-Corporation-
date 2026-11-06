/**
 * Independent, deliberately naive reference move generator for differential
 * testing of the engine. Shares NO code with src/engine/board.ts: plain 2-D
 * arrays of characters, string FEN parsing, legality by "can the king be
 * captured" after each move.
 */
import type { Ruleset } from '../src/engine/rules';

type Grid = string[][]; // [rank][file], '.' empty, 'P'/'p' etc.
interface RState {
  g: Grid;
  white: boolean;
  castle: string;
  ep: [number, number] | null;
}

export function parse(fen: string): RState {
  const [board, side, castle, ep] = fen.split(' ');
  const rows = board.split('/');
  const g: Grid = [];
  for (let i = 0; i < 7; i++) {
    const rank = 6 - i;
    const row: string[] = [];
    for (const ch of rows[i]) {
      if (/\d/.test(ch)) for (let k = 0; k < +ch; k++) row.push('.');
      else row.push(ch);
    }
    g[rank] = row;
  }
  return {
    g,
    white: side === 'w',
    castle: castle === '-' ? '' : castle,
    ep: ep && ep !== '-' ? ['abcdefg'.indexOf(ep[0]), +ep.slice(1) - 1] : null,
  };
}

const inb = (f: number, r: number) => f >= 0 && f < 7 && r >= 0 && r < 7;
const isW = (c: string) => c !== '.' && c === c.toUpperCase();
const own = (c: string, white: boolean) => c !== '.' && isW(c) === white;

function attacked(g: Grid, f: number, r: number, byWhite: boolean): boolean {
  // scan from target square outward
  const P = byWhite ? 'P' : 'p';
  const pr = byWhite ? r - 1 : r + 1;
  for (const df of [-1, 1]) if (inb(f + df, pr) && g[pr][f + df] === P) return true;
  const N = byWhite ? 'N' : 'n';
  for (const [a, b] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
    if (inb(f + a, r + b) && g[r + b][f + a] === N) return true;
  const K = byWhite ? 'K' : 'k';
  for (let a = -1; a <= 1; a++)
    for (let b = -1; b <= 1; b++) if ((a || b) && inb(f + a, r + b) && g[r + b][f + a] === K) return true;
  const lines: [number[][], string][] = [
    [[[1, 1], [1, -1], [-1, 1], [-1, -1]], 'BQ'],
    [[[1, 0], [-1, 0], [0, 1], [0, -1]], 'RQ'],
  ];
  for (const [dirs, kinds] of lines) {
    for (const [a, b] of dirs) {
      let x = f + a, y = r + b;
      while (inb(x, y) && g[y][x] === '.') {
        x += a;
        y += b;
      }
      if (inb(x, y)) {
        const c = g[y][x];
        if (isW(c) === byWhite && kinds.includes(c.toUpperCase())) return true;
      }
    }
  }
  return false;
}

interface RMove {
  f1: number; r1: number; f2: number; r2: number;
  promo?: string; ep?: boolean; castle?: 'K' | 'Q'; dbl?: boolean;
}

function kingPos(g: Grid, white: boolean): [number, number] {
  for (let r = 0; r < 7; r++) for (let f = 0; f < 7; f++) if (g[r][f] === (white ? 'K' : 'k')) return [f, r];
  throw new Error('no king');
}

function apply(s: RState, m: RMove, rules: Ruleset): RState {
  const g = s.g.map((row) => row.slice());
  const pc = g[m.r1][m.f1];
  const rank = s.white ? 0 : 6;
  let castle = s.castle;
  if (m.castle) {
    const c = rules.castling!;
    const rookFrom = m.castle === 'K' ? 6 : 0;
    const kTo = m.castle === 'K' ? c.shortKing : c.longKing;
    const rTo = m.castle === 'K' ? c.shortRook : c.longRook;
    const rook = g[rank][rookFrom];
    g[rank][m.f1] = '.';
    g[rank][rookFrom] = '.';
    g[rank][kTo] = pc;
    g[rank][rTo] = rook;
  } else {
    if (m.ep) g[m.r1][m.f2] = '.';
    g[m.r2][m.f2] = m.promo ? (s.white ? m.promo.toUpperCase() : m.promo) : pc;
    g[m.r1][m.f1] = '.';
  }
  // castling rights
  const kf = rules.backRank.indexOf('K');
  const strip = (chars: string) => (castle = castle.split('').filter((c) => !chars.includes(c)).join(''));
  const touched = (f: number, r: number) => {
    if (r === 0 && f === kf) strip('KQ');
    if (r === 6 && f === kf) strip('kq');
    if (r === 0 && f === 6) strip('K');
    if (r === 0 && f === 0) strip('Q');
    if (r === 6 && f === 6) strip('k');
    if (r === 6 && f === 0) strip('q');
  };
  touched(m.f1, m.r1);
  touched(m.f2, m.r2);
  let ep: [number, number] | null = null;
  if (m.dbl) {
    const er = (m.r1 + m.r2) / 2;
    const enemy = s.white ? 'p' : 'P';
    if ((inb(m.f2 - 1, m.r2) && g[m.r2][m.f2 - 1] === enemy) || (inb(m.f2 + 1, m.r2) && g[m.r2][m.f2 + 1] === enemy))
      ep = [m.f2, er];
  }
  return { g, white: !s.white, castle, ep };
}

export function refMoves(s: RState, rules: Ruleset): RMove[] {
  const out: RMove[] = [];
  const g = s.g;
  const W = s.white;
  for (let r = 0; r < 7; r++)
    for (let f = 0; f < 7; f++) {
      const c = g[r][f];
      if (!own(c, W)) continue;
      const t = c.toUpperCase();
      const push = (f2: number, r2: number, extra: Partial<RMove> = {}) => out.push({ f1: f, r1: r, f2, r2, ...extra });
      if (t === 'P') {
        const dir = W ? 1 : -1;
        const last = W ? 6 : 0;
        const addP = (f2: number, r2: number, extra: Partial<RMove> = {}) => {
          if (r2 === last) for (const p of ['q', 'r', 'b', 'n']) push(f2, r2, { ...extra, promo: p });
          else push(f2, r2, extra);
        };
        if (inb(f, r + dir) && g[r + dir][f] === '.') {
          addP(f, r + dir);
          const start = W ? 1 : 5;
          if (rules.pawnDouble && r === start && g[r + 2 * dir][f] === '.') push(f, r + 2 * dir, { dbl: true });
        }
        for (const df of [-1, 1]) {
          const x = f + df, y = r + dir;
          if (!inb(x, y)) continue;
          if (g[y][x] !== '.' && !own(g[y][x], W)) addP(x, y);
          else if (s.ep && s.ep[0] === x && s.ep[1] === y) push(x, y, { ep: true });
        }
      } else if (t === 'N' || t === 'K') {
        const ds = t === 'N'
          ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
          : [[1, 1], [1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1]];
        for (const [a, b] of ds) if (inb(f + a, r + b) && !own(g[r + b][f + a], W)) push(f + a, r + b);
      } else {
        const dirs: number[][] = [];
        if (t !== 'R') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        if (t !== 'B') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
        for (const [a, b] of dirs) {
          let x = f + a, y = r + b;
          while (inb(x, y)) {
            if (own(g[y][x], W)) break;
            push(x, y);
            if (g[y][x] !== '.') break;
            x += a;
            y += b;
          }
        }
      }
    }
  // castling
  if (rules.castling) {
    const rank = W ? 0 : 6;
    const kf = rules.backRank.indexOf('K');
    for (const side of ['K', 'Q'] as const) {
      const right = W ? side : side.toLowerCase();
      if (!s.castle.includes(right)) continue;
      const rookFrom = side === 'K' ? 6 : 0;
      if (g[rank][kf] !== (W ? 'K' : 'k') || g[rank][rookFrom] !== (W ? 'R' : 'r')) continue;
      const kTo = side === 'K' ? rules.castling.shortKing : rules.castling.longKing;
      const rTo = side === 'K' ? rules.castling.shortRook : rules.castling.longRook;
      const lo = Math.min(kf, kTo, rookFrom, rTo), hi = Math.max(kf, kTo, rookFrom, rTo);
      let ok = true;
      for (let x = lo; x <= hi; x++) if (x !== kf && x !== rookFrom && g[rank][x] !== '.') ok = false;
      const step = kTo > kf ? 1 : -1;
      for (let x = kf; ok; x += step) {
        if (attacked(g, x, rank, !W)) ok = false;
        if (x === kTo) break;
      }
      if (ok) out.push({ f1: kf, r1: rank, f2: kTo, r2: rank, castle: side });
    }
  }
  // legality
  return out.filter((m) => {
    const n = apply(s, m, rules);
    const [kf, kr] = kingPos(n.g, W);
    return !attacked(n.g, kf, kr, !W);
  });
}

export function refPerft(s: RState, depth: number, rules: Ruleset): number {
  if (depth === 0) return 1;
  const ms = refMoves(s, rules);
  if (depth === 1) return ms.length;
  let t = 0;
  for (const m of ms) t += refPerft(apply(s, m, rules), depth - 1, rules);
  return t;
}
