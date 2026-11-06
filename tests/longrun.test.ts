import { describe, it, expect } from 'vitest';
import { newSave, type ActiveMatch } from '../src/game/state';
import { settleMatch } from '../src/game/settle';
import { findOpponent } from '../src/game/matchmaking';
import { rankInfo, MAX_RANK } from '../src/game/career';

const rng = (seed: number) => () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff);

describe('long careers', () => {
  it('5,000 settled matches keep the save bounded, consistent and fast', { timeout: 240_000 }, () => {
    const rand = rng(11);
    let s = newSave(0);
    const t0 = Date.now();
    for (let g = 0; g < 5000; g++) {
      const opp = findOpponent(s, rand);
      const u = rand();
      const score = (u < 0.5 ? 1 : u < 0.7 ? 0.5 : 0) as 0 | 0.5 | 1;
      const m: ActiveMatch = {
        id: 'L' + g,
        kind: s.career.series ? 'series' : 'ranked',
        opponent: opp,
        playerColor: (g % 2) as 0 | 1,
        moves: new Array(30 + (g % 50)).fill('a2a3'),
        clocks: null,
        tc: 'untimed',
        startedAt: g,
        seed: g,
        finished: { score, termination: score === 0.5 ? 'repetition' : 'checkmate', endedAt: g, accuracy: 70 },
        drawOffers: 0,
        undos: 0,
      };
      s = settleMatch(s, m, 1_700_000_000_000 + g * 3_600_000).save;
    }
    const ms = Date.now() - t0;
    const bytes = JSON.stringify(s).length;
    expect(s.stats.rated.g).toBe(5000);
    expect(s.history.length).toBeLessThanOrEqual(200);
    expect(s.settled.length).toBeLessThanOrEqual(1000);
    expect(Object.keys(s.opponents).length).toBeLessThanOrEqual(1500);
    expect(s.stats.ratingHistory.length).toBeLessThanOrEqual(500);
    expect(bytes).toBeLessThan(1_500_000);
    expect(s.wallet.balance).toBeGreaterThan(0);
    expect(Number.isFinite(s.rating.r)).toBe(true);
    expect(s.career.rank).toBeGreaterThan(10);
    expect(rankInfo(s.career.rank).title.length).toBeGreaterThan(3);
    expect(ms).toBeLessThan(180_000); // generous: CI machines may be loaded
  });
  it('a career at the maximum rank keeps working (no overflow, no NaN)', () => {
    let s = newSave(0);
    s.career.rank = MAX_RANK - 1;
    s.career.highestRank = MAX_RANK - 1;
    s.career.merit = 1e300;
    s.rating = { r: 5000, rd: 50, vol: 0.06 };
    const m: ActiveMatch = {
      id: 'max',
      kind: 'ranked',
      opponent: { id: 1, tier: 24, style: 'balanced', rating: 5000, rd: 50, name: 'X' },
      playerColor: 0,
      moves: new Array(40).fill('a2a3'),
      clocks: null,
      tc: 'untimed',
      startedAt: 0,
      seed: 1,
      finished: { score: 1, termination: 'checkmate', endedAt: 1 },
      drawOffers: 0,
      undos: 0,
    };
    s = settleMatch(s, m, 5).save;
    expect(s.career.rank).toBeLessThanOrEqual(MAX_RANK);
    expect(Number.isFinite(s.wallet.balance)).toBe(true);
    expect(JSON.parse(JSON.stringify(s)).career.rank).toBe(s.career.rank);
  });
});
