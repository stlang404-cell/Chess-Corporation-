/**
 * Match compensation. All dollars are fictional and can only buy cosmetics.
 *
 * Anti-exploitation principles:
 *  - nothing is paid per move (no incentive to prolong games);
 *  - games with fewer than MIN_PLAYER_MOVES player moves pay no salary;
 *  - opponent strength scales pay, so beating much weaker bots pays little;
 *  - consecutive games vs the same opponent decay;
 *  - a loss always pays far less than a win or draw (no profit from sandbagging);
 *  - the performance bonus is driven by engine-measured move accuracy, so an
 *    unsound sacrifice lowers it rather than raising it.
 */
import { salary } from './career';

export const MIN_PLAYER_MOVES = 10;
export const PERF_MIN_MOVES = 15;

export interface PayLine {
  key: string;
  label: string;
  amount: number;
}

export interface PayInput {
  rank: number;
  score: 0 | 0.5 | 1;
  expected: number; // player's expected score
  playerRating: number;
  oppRating: number;
  playerMoves: number;
  accuracy?: number;
  rematchCount: number; // 0 for a fresh opponent, 1 = first rematch …
  rated: boolean;
}

export function opponentFactor(playerRating: number, oppRating: number): number {
  return Math.max(0.35, Math.min(1.3, 1 + (oppRating - playerRating) / 600));
}

export function rematchFactor(n: number): number {
  return Math.max(0.4, 1 - 0.15 * n);
}

export function computePay(p: PayInput): PayLine[] {
  if (!p.rated) return [];
  const lines: PayLine[] = [];
  if (p.playerMoves < MIN_PLAYER_MOVES) return lines; // aborted / too short: no pay
  const S = salary(p.rank);
  const f = opponentFactor(p.playerRating, p.oppRating);
  const decay = rematchFactor(p.rematchCount);
  const add = (key: string, label: string, v: number) => {
    const a = Math.round(v);
    if (a > 0) lines.push({ key, label, amount: a });
  };
  add('salary', 'Base salary', S * 0.4 * decay);
  if (p.score === 1) add('win', 'Victory bonus', S * f * decay);
  if (p.score === 0.5) add('draw', 'Draw bonus', S * 0.35 * f * decay);
  if (p.score === 1 && p.expected < 0.4) add('upset', 'Upset bonus', S * (0.4 - p.expected) * 3 * decay);
  if (p.accuracy !== undefined && p.playerMoves >= PERF_MIN_MOVES && p.accuracy >= 60) {
    const q = Math.pow((p.accuracy - 60) / 40, 1.5);
    add('perf', 'Performance bonus', S * 0.6 * q * decay * (p.score === 0 ? 0.3 : 1));
  }
  return lines;
}

export function promotionBonus(newRank: number, major: boolean): number {
  return Math.round(salary(newRank) * (major ? 12 : 4));
}

/** Lichess-style per-move accuracy from win-probability drop. */
export function winPct(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}
export function moveAccuracy(winBefore: number, winAfter: number): number {
  const drop = Math.max(0, winBefore - winAfter);
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * drop) - 3.1669));
}
/** Aggregate: harmonic-ish blend that punishes blunders (mean of mean and harmonic mean). */
export function gameAccuracy(per: number[]): number {
  if (!per.length) return 0;
  const mean = per.reduce((a, b) => a + b, 0) / per.length;
  const harm = per.length / per.reduce((a, b) => a + 1 / Math.max(1, b), 0);
  return Math.round(((mean + harm) / 2) * 10) / 10;
}
