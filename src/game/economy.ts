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

// ---------------------------------------------------------------------------
// Paycheck v3 — pay for how well the player actually played.
// ---------------------------------------------------------------------------
export const PAY_FORMULA = 'pay-3';

export interface ReviewForPay {
  standard: string;
  accuracy: number;
  moves: number;
  counts: { brilliant: number; great: number; best: number; excellent: number; good: number; inaccuracy: number; mistake: number; blunder: number };
  minWin: number;
}

/**
 * Itemised paycheck from a fixed-standard engine review. All match lines are
 * scaled by the rematch decay; quality bonuses are capped and never paid for
 * forced moves (the review already strips them); deductions are proportional
 * but capped at half of the positive performance lines, so one bad game is
 * never ruinous. Nothing depends on game length beyond the 10-move minimum.
 */
export function computePayV3(p: PayInput, r: ReviewForPay): PayLine[] {
  if (!p.rated || p.playerMoves < MIN_PLAYER_MOVES) return [];
  const S = salary(p.rank);
  const f = opponentFactor(p.playerRating, p.oppRating);
  const decay = rematchFactor(p.rematchCount);
  const lines: PayLine[] = [];
  const add = (key: string, label: string, v: number) => {
    const a = Math.round(v * decay);
    if (a !== 0) lines.push({ key, label, amount: a });
  };
  add('salary', 'Base compensation', 0.3 * S);
  const q = Math.pow(Math.max(0, Math.min(1, (r.accuracy - 55) / 40)), 1.3);
  if (r.moves >= PERF_MIN_MOVES) add('accuracy', `Accuracy bonus (${Math.round(r.accuracy)}%)`, 0.7 * S * q);
  const greats = Math.min(3, r.counts.great);
  const brill = Math.min(2, r.counts.brilliant);
  if (greats) add('great', `Great move${greats > 1 ? 's' : ''} ×${greats}`, 0.06 * S * greats);
  if (brill) add('brilliant', `Brilliant move${brill > 1 ? 's' : ''} ×${brill}`, 0.2 * S * brill);
  if (p.score === 1) add('win', 'Victory bonus', 0.8 * S * f);
  if (p.score === 0.5) add('draw', 'Draw bonus', 0.3 * S * f);
  if (p.score >= 0.5 && r.minWin <= 25) add('defence', 'Strong defence', 0.35 * S);
  if (p.score === 1 && p.expected < 0.4) add('upset', 'Upset bonus', 3 * (0.4 - p.expected) * S);
  if (p.score === 0 && r.accuracy >= 80 && p.oppRating - p.playerRating >= 100) add('stood', 'Stood up to a stronger opponent', 0.15 * S);
  const positive = lines.filter((l) => l.key === 'accuracy' || l.key === 'great' || l.key === 'brilliant' || l.key === 'salary').reduce((a, l) => a + l.amount, 0);
  const raw = (0.05 * Math.min(r.counts.blunder, 6) + 0.02 * Math.min(r.counts.mistake, 8)) * S * decay;
  const deduction = Math.round(Math.min(raw, positive * 0.5));
  if (deduction > 0) lines.push({ key: 'deduction', label: `Performance deductions (${r.counts.blunder} blunder${r.counts.blunder === 1 ? '' : 's'}, ${r.counts.mistake} mistake${r.counts.mistake === 1 ? '' : 's'})`, amount: -deduction });
  return lines;
}
