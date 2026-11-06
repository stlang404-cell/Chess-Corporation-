import { describe, it, expect } from 'vitest';
import {
  rankInfo,
  AUTHORED_RANKS,
  meritNeeded,
  ratingGate,
  salary,
  arenaForRank,
  arenaInfo,
  AUTHORED_ARENA_COUNT,
  seriesLength,
  TITLES,
  meritDelta,
  MASTERY_GATE,
} from '../src/game/career';
import { updateRating, expectedScore, START_RATING, performanceRating } from '../src/game/rating';
import { computePay, opponentFactor, MIN_PLAYER_MOVES, gameAccuracy, moveAccuracy } from '../src/game/economy';
import { settleMatch } from '../src/game/settle';
import { newSave, migrate, type ActiveMatch } from '../src/game/state';
import { findOpponent, nearestTier } from '../src/game/matchmaking';
import { botRating } from '../src/game/bots';
import { identityOf, styleOf, leagueRecord } from '../src/game/opponents';

const rng = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function fakeMatch(id: string, score: 0 | 0.5 | 1, oppRating = 1000, moves = 40, kind: ActiveMatch['kind'] = 'ranked'): ActiveMatch {
  return {
    id,
    kind,
    opponent: { id: 42, tier: 4, style: 'balanced', rating: oppRating, rd: 60, name: 'Test Bot' },
    playerColor: 0,
    moves: Array.from({ length: moves }, () => 'a2a3'),
    clocks: [1, 1],
    tc: '5+3',
    startedAt: 0,
    seed: 1,
    finished: { score, termination: score === 0.5 ? 'agreement' : 'checkmate', endedAt: 1 },
    drawOffers: 0,
    undos: 0,
  };
}

describe('rank generation', () => {
  it('has hundreds of authored ranks with unique names', () => {
    expect(AUTHORED_RANKS).toBeGreaterThanOrEqual(200);
    const names = new Set<string>();
    for (let n = 0; n < AUTHORED_RANKS; n++) names.add(rankInfo(n).full);
    expect(names.size).toBe(AUTHORED_RANKS);
  });
  it('procedural ranks are unique, stable and unbounded', () => {
    const names = new Set<string>();
    for (let n = AUTHORED_RANKS; n < AUTHORED_RANKS + 20000; n++) names.add(rankInfo(n).full);
    expect(names.size).toBe(20000);
    expect(rankInfo(123456).full).toBe(rankInfo(123456).full);
    expect(rankInfo(10_000_000).title.length).toBeGreaterThan(5);
  });
  it('requirements are monotone and finite', () => {
    let prevM = 0;
    let prevG = 0;
    for (let n = 0; n < AUTHORED_RANKS + 500; n++) {
      const m = meritNeeded(n);
      const g = ratingGate(n);
      expect(m).toBeGreaterThanOrEqual(prevM);
      expect(g).toBeGreaterThanOrEqual(prevG);
      expect(Number.isFinite(m) && Number.isFinite(g)).toBe(true);
      prevM = m;
      prevG = g;
    }
    expect(ratingGate(AUTHORED_RANKS + 100)).toBe(MASTERY_GATE);
  });
  it('merit: wins gain, losses cost less than wins gain, draws never cost', () => {
    for (const E of [0.1, 0.5, 0.9]) {
      expect(meritDelta(1, E)).toBeGreaterThan(-meritDelta(0, E));
      expect(meritDelta(0.5, E)).toBeGreaterThan(0);
    }
    expect(meritDelta(1, 0.1)).toBeGreaterThan(meritDelta(1, 0.9));
  });
  it('salary grows sublinearly', () => {
    expect(salary(0)).toBe(60);
    expect(salary(399)).toBe(1200);
    expect(salary(10000) / salary(100)).toBeLessThan(11);
  });
  it('major titles require promotion series', () => {
    const mgr = TITLES.findIndex((t) => t.name === 'Manager');
    let first = 0;
    for (let n = 0; n < AUTHORED_RANKS; n++) if (rankInfo(n).titleIndex === mgr) { first = n; break; }
    expect(seriesLength(first)).toBe(3);
    expect(seriesLength(first + 1)).toBe(0);
    expect(seriesLength(AUTHORED_RANKS)).toBeGreaterThan(0);
  });
});

describe('arena generation', () => {
  it('every rank maps to an arena; arenas are contiguous and unbounded', () => {
    let prev = 0;
    for (let n = 0; n < AUTHORED_RANKS + 3000; n++) {
      const a = arenaForRank(n);
      expect(a.index === prev || a.index === prev + 1).toBe(true);
      prev = a.index;
    }
    expect(prev).toBeGreaterThan(AUTHORED_ARENA_COUNT);
    const names = new Set<string>();
    for (let i = 0; i < 300; i++) names.add(arenaInfo(i).name);
    expect(names.size).toBe(300);
  });
});

describe('rating', () => {
  it('expected score is symmetric and Elo-shaped', () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
    expect(expectedScore(1900, 1500)).toBeCloseTo(10 / 11, 2);
    expect(expectedScore(1500, 1700) + expectedScore(1700, 1500)).toBeCloseTo(1);
  });
  it('Glicko-2 matches the published worked example', () => {
    // Glickman (2012) example: r=1500, RD=200, σ=0.06 vs three opponents in one period.
    // Single-game updates differ from a batched period, so check direction & rough magnitude.
    const a = updateRating({ r: 1500, rd: 200, vol: 0.06 }, 1400, 30, 1);
    expect(a.r).toBeGreaterThan(1500);
    expect(a.rd).toBeLessThan(200);
    const b = updateRating({ r: 1500, rd: 200, vol: 0.06 }, 1400, 30, 0);
    expect(b.r).toBeLessThan(1500);
    expect(a.r - 1500).toBeLessThan(1500 - b.r);
  });
  it('a player converges toward true strength', () => {
    const rand = rng(1);
    let r = { ...START_RATING };
    for (let i = 0; i < 400; i++) {
      const opp = r.r + (rand() - 0.5) * 200;
      const s = rand() < expectedScore(1600, opp) ? 1 : 0;
      r = updateRating(r, opp, 50, s);
    }
    expect(Math.abs(r.r - 1600)).toBeLessThan(120);
  });
  it('performance rating solves expected = actual', () => {
    expect(performanceRating([{ opp: 1500, score: 0.5 }, { opp: 1500, score: 0.5 }])).toBeCloseTo(1500, -1);
  });
});

describe('economy', () => {
  const base = { rank: 10, expected: 0.5, playerRating: 1000, oppRating: 1000, playerMoves: 30, rematchCount: 0, rated: true };
  const total = (l: { amount: number }[]) => l.reduce((a, x) => a + x.amount, 0);
  it('wins pay more than draws, draws more than losses', () => {
    const w = total(computePay({ ...base, score: 1 }));
    const d = total(computePay({ ...base, score: 0.5 }));
    const l = total(computePay({ ...base, score: 0 }));
    expect(w).toBeGreaterThan(d);
    expect(d).toBeGreaterThan(l);
    expect(l).toBeGreaterThan(0);
  });
  it('short games pay nothing', () => {
    expect(computePay({ ...base, score: 1, playerMoves: MIN_PLAYER_MOVES - 1 })).toEqual([]);
  });
  it('farming weak opponents pays less than fair games', () => {
    const fair = total(computePay({ ...base, score: 1 }));
    const farm = total(computePay({ ...base, score: 1, oppRating: 500, expected: 0.95 }));
    expect(farm).toBeLessThan(fair * 0.75);
    expect(opponentFactor(1000, 400)).toBe(0.35);
  });
  it('rematch chains decay', () => {
    const a = total(computePay({ ...base, score: 1 }));
    const b = total(computePay({ ...base, score: 1, rematchCount: 3 }));
    expect(b).toBeLessThan(a * 0.6);
  });
  it('upsets pay a bonus', () => {
    const lines = computePay({ ...base, score: 1, oppRating: 1300, expected: 0.15 });
    expect(lines.some((l) => l.key === 'upset')).toBe(true);
  });
  it('performance bonus needs accuracy and length; losing a game on purpose is never profitable', () => {
    expect(computePay({ ...base, score: 1, accuracy: 95 }).some((l) => l.key === 'perf')).toBe(true);
    expect(computePay({ ...base, score: 1, accuracy: 55 }).some((l) => l.key === 'perf')).toBe(false);
    expect(computePay({ ...base, score: 1, accuracy: 99, playerMoves: 12 }).some((l) => l.key === 'perf')).toBe(false);
    const bestLoss = total(computePay({ ...base, score: 0, accuracy: 100 }));
    const plainWin = total(computePay({ ...base, score: 1 }));
    expect(bestLoss).toBeLessThan(plainWin / 2);
  });
  it('accuracy model behaves', () => {
    expect(moveAccuracy(50, 50)).toBeCloseTo(100, 0);
    expect(moveAccuracy(80, 20)).toBeLessThan(10);
    expect(gameAccuracy([100, 100, 10])).toBeLessThan(60);
  });
});

describe('settlement', () => {
  it('is idempotent: duplicate settlement changes nothing', () => {
    const s0 = newSave(0);
    const m = fakeMatch('m1', 1);
    const a = settleMatch(s0, m, 10);
    expect(a.duplicate).toBe(false);
    const b = settleMatch(a.save, m, 20);
    expect(b.duplicate).toBe(true);
    expect(b.save).toBe(a.save);
    expect(a.save.wallet.balance).toBeGreaterThan(0);
    expect(s0.wallet.balance).toBe(0); // input untouched
  });
  it('early career promotes quickly; rating, merit and dollars move together', () => {
    let s = newSave(0);
    for (let i = 0; i < 6; i++) s = settleMatch(s, fakeMatch('w' + i, 1, s.rating.r), i).save;
    expect(s.career.rank).toBeGreaterThanOrEqual(3);
    expect(s.rating.r).toBeGreaterThan(1000);
    expect(s.stats.rated.w).toBe(6);
    expect(s.history.length).toBe(6);
  });
  it('rating gates block promotion until earned', () => {
    let s = newSave(0);
    s.career.rank = 30;
    s.rating = { r: 300, rd: 60, vol: 0.06 };
    s.career.merit = meritNeeded(30) - 1;
    s = settleMatch(s, fakeMatch('g', 1, 250), 1).save;
    expect(s.career.rank).toBe(30);
  });
  it('major titles trigger a series which can pass or fail', () => {
    let s = newSave(0);
    const mgr = TITLES.findIndex((t) => t.name === 'Manager');
    let first = 0;
    for (let n = 0; ; n++) if (rankInfo(n).titleIndex === mgr) { first = n; break; }
    s.career.rank = first - 1;
    s.rating = { r: 2000, rd: 60, vol: 0.06 };
    s.career.merit = meritNeeded(first - 1) - 1;
    const r1 = settleMatch(s, fakeMatch('a', 1, 2000), 1);
    expect(r1.report!.seriesStarted).toBe(true);
    s = r1.save;
    s = settleMatch(s, fakeMatch('b', 1, 2000, 40, 'series'), 2).save;
    const r3 = settleMatch(s, fakeMatch('c', 1, 2000, 40, 'series'), 3);
    expect(r3.report!.seriesResult).toBe('passed');
    expect(r3.save.career.rank).toBe(first);
    // failing path
    let f = r1.save;
    f = settleMatch(f, fakeMatch('d', 0, 2000, 40, 'series'), 2).save;
    const r4 = settleMatch(f, fakeMatch('e', 0, 2000, 40, 'series'), 3);
    expect(r4.report!.seriesResult).toBe('failed');
    expect(r4.save.career.rank).toBe(first - 1);
  });
  it('losses never demote across a title boundary', () => {
    let s = newSave(0);
    s.career.rank = 3; // first grade of a title
    for (let i = 0; i < 20; i++) s = settleMatch(s, fakeMatch('l' + i, 0, s.rating.r), i).save;
    expect(s.career.rank).toBe(3);
  });
  it('arena cup: tokens accrue, three wins take the cup, a loss eliminates', () => {
    let s = newSave(0);
    for (let i = 0; i < 15; i++) s = settleMatch(s, fakeMatch('t' + i, 0.5, s.rating.r), i).save;
    expect(s.cup.tokens).toBe(1);
    s.cup.active = { arena: 0, round: 0 };
    let r = settleMatch(s, fakeMatch('c1', 1, 1000, 40, 'cup'), 100);
    expect(r.report!.cupResult).toBe('advanced');
    r = settleMatch(r.save, fakeMatch('c2', 1, 1000, 40, 'cup'), 101);
    const before = r.save.wallet.balance;
    r = settleMatch(r.save, fakeMatch('c3', 1, 1000, 40, 'cup'), 102);
    expect(r.report!.cupResult).toBe('won');
    expect(r.save.cup.trophies.length).toBe(1);
    expect(r.save.wallet.balance - before).toBeGreaterThan(1000);
    const e = settleMatch({ ...r.save, cup: { ...r.save.cup, active: { arena: 0, round: 1 } } }, fakeMatch('c4', 0, 1000, 40, 'cup'), 103);
    expect(e.report!.cupResult).toBe('eliminated');
    expect(e.save.cup.active).toBeNull();
  });
  it('casual games do not touch rating, rank or wallet', () => {
    const s0 = newSave(0);
    const s = settleMatch(s0, fakeMatch('c', 1, 1000, 40, 'casual'), 1).save;
    expect(s.rating).toEqual(s0.rating);
    expect(s.wallet).toEqual(s0.wallet);
    expect(s.career).toEqual(s0.career);
  });
});

describe('save migration', () => {
  it('fills missing fields and survives garbage', () => {
    expect(migrate(null).version).toBe(1);
    const partial = migrate({ wallet: { balance: 5 } });
    expect(partial.wallet.balance).toBe(5);
    expect(partial.wallet.lifetime).toBe(0);
    expect(partial.owned).toContain('board.ivory');
    const s = newSave(0);
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

describe('matchmaking & opponents', () => {
  it('opponents are near the player and ratings are the calibrated ones', () => {
    const rand = rng(9);
    const s = newSave(0);
    s.rating = { r: 1300, rd: 60, vol: 0.06 };
    const diffs: number[] = [];
    for (let i = 0; i < 300; i++) {
      const o = findOpponent(s, rand);
      expect(o.rating).toBe(botRating(o.tier, o.style));
      expect(styleOf(o.id)).toBe(o.style);
      diffs.push(o.rating - 1300);
    }
    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    expect(Math.abs(mean)).toBeLessThan(80);
    expect(Math.max(...diffs)).toBeGreaterThan(50);
    expect(Math.min(...diffs)).toBeLessThan(-50);
  });
  it('nearest tier is monotone in target', () => {
    let prev = 0;
    for (let t = 0; t < 3000; t += 50) {
      const n = nearestTier(t, 'balanced');
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });
  it('identities are stable and varied', () => {
    expect(identityOf(77)).toEqual(identityOf(77));
    const names = new Set<string>();
    for (let i = 0; i < 2000; i++) names.add(identityOf(i * 7919).name);
    expect(names.size).toBeGreaterThan(1200);
    const lr = leagueRecord(5);
    expect(lr.wins + lr.draws + lr.losses).toBe(lr.games);
  });
});
