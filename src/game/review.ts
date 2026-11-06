/** Compact storage of an engine review (both sides) for history, paychecks and the review screen. */
import { summarize, REVIEW_STANDARD, type MoveAnalysis } from '../engine/analysis';
import { Q_CODE, Q_NAME, type CompactReview } from './state';

export function compactReview(moves: MoveAnalysis[], playerColor: 0 | 1): CompactReview {
  return {
    standard: REVIEW_STANDARD,
    summary: summarize(moves, playerColor),
    q: moves.map((m) => Q_CODE[m.quality] ?? 'g').join(''),
    e: moves.map((m) => Math.round(m.evalWhite)),
    b: moves.map((m) => m.bestSan),
    w: moves.flatMap((m) => [Math.round(m.winBefore), Math.round(m.winAfter)]),
  };
}

export interface ExpandedMove {
  ply: number;
  quality: string;
  evalWhite: number;
  bestSan: string;
  winBefore: number;
  winAfter: number;
  missedWin: boolean;
}
export function expandReview(r: CompactReview): ExpandedMove[] {
  return [...r.q].map((c, i) => ({
    ply: i,
    quality: Q_NAME[c] ?? 'good',
    evalWhite: r.e[i],
    bestSan: r.b[i],
    winBefore: r.w[i * 2],
    winAfter: r.w[i * 2 + 1],
    missedWin: r.w[i * 2] >= 80 && r.w[i * 2 + 1] < 60,
  }));
}

/** Biggest swings in White's win probability: the game's critical moments. */
export function turningPoints(moves: ExpandedMove[], n = 3): number[] {
  const wWhite = (m: ExpandedMove) => (m.ply % 2 === 0 ? m.winAfter : 100 - m.winAfter);
  const swings = moves.map((m, i) => ({ ply: i, d: Math.abs(wWhite(m) - (i ? wWhite(moves[i - 1]) : 50)) }));
  return swings
    .filter((s) => s.d >= 12)
    .sort((a, b) => b.d - a.d)
    .slice(0, n)
    .map((s) => s.ply)
    .sort((a, b) => a - b);
}
