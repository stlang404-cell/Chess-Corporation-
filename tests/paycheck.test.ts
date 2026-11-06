import { describe, it, expect } from 'vitest';
import { computePayV3, PAY_FORMULA, type ReviewForPay, type PayInput } from '../src/game/economy';
import { advanceContracts, freshContracts } from '../src/game/contracts';
import { classify } from '../src/engine/analysis';
import { newSave, type ActiveMatch } from '../src/game/state';
import { settleMatch } from '../src/game/settle';
import { compactReview, expandReview, turningPoints } from '../src/game/review';

const base: PayInput = { rank: 20, score: 1, expected: 0.5, playerRating: 1200, oppRating: 1200, playerMoves: 30, rematchCount: 0, rated: true };
const rev = (acc: number, over: Partial<ReviewForPay['counts']> = {}, minWin = 50): ReviewForPay => ({
  standard: 'rev-3',
  accuracy: acc,
  moves: 30,
  counts: { brilliant: 0, great: 0, best: 10, excellent: 8, good: 8, inaccuracy: 2, mistake: 1, blunder: 1, ...over },
  minWin,
});
const total = (l: { amount: number }[]) => l.reduce((a, x) => a + x.amount, 0);

describe('paycheck pay-3', () => {
  it('is versioned and itemised', () => {
    expect(PAY_FORMULA).toBe('pay-3');
    const lines = computePayV3(base, rev(85));
    expect(lines.map((l) => l.key)).toEqual(expect.arrayContaining(['salary', 'accuracy', 'win']));
  });
  it('pays more for more accurate play, monotonically', () => {
    let prev = -1;
    for (const acc of [50, 60, 70, 80, 90, 98]) {
      const t = total(computePayV3(base, rev(acc)));
      expect(t).toBeGreaterThanOrEqual(prev);
      prev = t;
    }
  });
  it('a strong loss is worth something, but less than an ordinary win', () => {
    const strongLoss = total(computePayV3({ ...base, score: 0, oppRating: 1400, expected: 0.24 }, rev(92, { blunder: 0, mistake: 0 })));
    const weakLoss = total(computePayV3({ ...base, score: 0 }, rev(55, { blunder: 3, mistake: 3 })));
    const avgWin = total(computePayV3(base, rev(75)));
    expect(strongLoss).toBeGreaterThan(weakLoss);
    expect(strongLoss).toBeGreaterThan(0);
    expect(strongLoss).toBeLessThan(avgWin);
  });
  it('deductions are proportional, capped, and never make a valid game cost money', () => {
    for (const b of [0, 1, 3, 10, 40]) {
      const lines = computePayV3({ ...base, score: 0 }, rev(40, { blunder: b, mistake: b }));
      expect(total(lines)).toBeGreaterThan(0);
    }
    const one = total(computePayV3(base, rev(80, { blunder: 1 })));
    const three = total(computePayV3(base, rev(80, { blunder: 3 })));
    expect(three).toBeLessThan(one);
  });
  it('quality bonuses are capped (no farming of great/brilliant counts)', () => {
    const a = total(computePayV3(base, rev(85, { great: 3, brilliant: 2 })));
    const b = total(computePayV3(base, rev(85, { great: 30, brilliant: 20 })));
    expect(b).toBe(a);
  });
  it('rewards holding a difficult position and pays nothing for short or unrated games', () => {
    const held = computePayV3({ ...base, score: 0.5 }, rev(80, {}, 15));
    expect(held.some((l) => l.key === 'defence')).toBe(true);
    expect(computePayV3({ ...base, playerMoves: 9 }, rev(99))).toEqual([]);
    expect(computePayV3({ ...base, rated: false }, rev(99))).toEqual([]);
  });
  it('does not depend on game length (no reward for prolonging)', () => {
    const short = total(computePayV3({ ...base, playerMoves: 25 }, rev(80)));
    const long = total(computePayV3({ ...base, playerMoves: 140 }, rev(80)));
    expect(long).toBe(short);
  });
  it('replaying analysis never pays twice (settlement is idempotent with a review)', () => {
    const moves = [{ ply: 0, san: 'd4', uci: 'd2d4', evalWhite: 20, winBefore: 52, winAfter: 52, bestSan: 'd4', bestUci: 'd2d4', accuracy: 100, quality: 'best' as const, tag: 'best' as const, missedWin: false, forced: false, depth: 9, lowConfidence: false }];
    const review = compactReview(new Array(30).fill(0).map((_, i) => ({ ...moves[0], ply: i })), 0);
    const m: ActiveMatch = {
      id: 'pay1',
      kind: 'ranked',
      opponent: { id: 3, tier: 8, style: 'balanced', rating: 1000, rd: 60, name: 'X' },
      playerColor: 0,
      moves: new Array(30).fill('a2a3'),
      clocks: null,
      tc: 'untimed',
      startedAt: 0,
      seed: 1,
      finished: { score: 1, termination: 'checkmate', endedAt: 1, review },
      drawOffers: 0,
      undos: 0,
    };
    const a = settleMatch(newSave(0), m, 1);
    expect(a.report!.pay.some((l) => l.key === 'accuracy')).toBe(true);
    expect(a.save.history[0].payFormula).toBe('pay-3');
    expect(settleMatch(a.save, m, 2).duplicate).toBe(true);
  });
});

describe('review helpers', () => {
  it('compact review round-trips and finds turning points', () => {
    const mk = (i: number, wb: number, wa: number, q: any) => ({ ply: i, san: 'x', uci: 'a2a3', evalWhite: 0, winBefore: wb, winAfter: wa, bestSan: 'y', bestUci: 'a2a3', accuracy: 90, quality: q, tag: '' as const, missedWin: wb >= 80 && wa < 60, forced: false, depth: 9, lowConfidence: false });
    const ms = [mk(0, 50, 50, 'best'), mk(1, 50, 50, 'best'), mk(2, 85, 40, 'blunder'), mk(3, 60, 60, 'best')];
    const r = compactReview(ms, 0);
    const back = expandReview(r);
    expect(back[2].quality).toBe('blunder');
    expect(back[2].missedWin).toBe(true);
    expect(r.summary.missedWins).toBe(1);
    expect(turningPoints(back)).toContain(2);
  });
  it('brilliant requires a sacrifice in an unclear position; forced moves earn nothing extra', () => {
    expect(classify({ played: 1, best: 1, bestScore: 50, playedScore: 50, secondScore: -300, see: -200 })).toBe('brilliant');
    expect(classify({ played: 1, best: 1, bestScore: 50, playedScore: 50, secondScore: -300, see: 0 })).toBe('great');
  });
});

describe('performance contracts', () => {
  it('advance only on genuine rated achievements', () => {
    const list = freshContracts(0, 1200, 20);
    expect(list.length).toBe(3);
    expect(new Set(list.map((c) => c.kind)).size).toBe(3);
    const review = { standard: 'rev-3', accuracy: 95, moves: 30, counts: { brilliant: 1, great: 2, best: 10, excellent: 5, good: 5, inaccuracy: 0, mistake: 0, blunder: 0 }, missedWins: 0, minWin: 10, maxWin: 90 };
    // aborted/short or unreviewed games never count
    expect(advanceContracts(list, { rated: true, playerMoves: 10, review, score: 1, color: 1, ratingGap: 500, rival: true, seriesGame: true })).toEqual([]);
    expect(advanceContracts(list, { rated: true, playerMoves: 40, review: null, score: 1, color: 1, ratingGap: 500, rival: true, seriesGame: true })).toEqual([]);
    expect(advanceContracts(list, { rated: false, playerMoves: 40, review, score: 1, color: 1, ratingGap: 500, rival: true, seriesGame: true })).toEqual([]);
    const done = advanceContracts(list, { rated: true, playerMoves: 40, review, score: 1, color: 1, ratingGap: 500, rival: true, seriesGame: true });
    expect(done.length).toBeGreaterThan(0);
  });
});
