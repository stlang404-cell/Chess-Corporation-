import { describe, it, expect } from 'vitest';
import { Position, mFrom, mTo } from '../src/engine/board';
import { OFFICIAL, startFen } from '../src/engine/rules';
import { Searcher, MATE, isMateScore } from '../src/engine/search';
import { chooseBotMove, STYLE_IDS, TIERS, STYLES } from '../src/engine/ai';
import { boardOutcome, moveToSan, sanToMove } from '../src/engine/game';
import { evaluate } from '../src/engine/eval';
import { analyzeGame } from '../src/engine/analysis';
import { CALIBRATION } from '../src/engine/calibration';

function rng(seed: number) {
  return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

function playGame(tw: number, tb: number, seed: number, maxPly = 160) {
  const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const s = new Searcher(16);
  for (let ply = 0; ply < maxPly; ply++) {
    const o = boardOutcome(p);
    if (o) return o.result;
    const t = p.side === 0 ? tw : tb;
    const mv = chooseBotMove(p, { tier: t, style: 'balanced', seed: seed + p.side }, s);
    expect(p.legalMoves()).toContain(mv.move);
    p.make(mv.move);
  }
  return 0.5;
}

describe('search', () => {
  it('finds mate in one', () => {
    const p = Position.fromFen('6k/5pp/7/7/7/7/R3K2 w - - 0 1', OFFICIAL);
    const r = new Searcher(16).search(p, { depth: 4 });
    expect(moveToSan(p, r.move)).toBe('Ra7#');
    expect(r.score).toBe(MATE - 1);
  });
  it('finds a forced mate in two (K+Q vs K)', () => {
    // White: Kc5? Use a known pattern: queen and king box the king on the edge.
    const p = Position.fromFen('k6/7/1K5/7/7/7/6Q w - - 0 1', OFFICIAL);
    const r = new Searcher(16).search(p, { depth: 6 });
    expect(isMateScore(r.score)).toBe(true);
    expect(r.score).toBeGreaterThan(0);
  });
  it('wins material when a piece hangs', () => {
    const p = Position.fromFen('3k3/7/7/3q3/7/3R3/3K3 w - - 0 1', OFFICIAL);
    const r = new Searcher(16).search(p, { nodes: 50000 });
    expect(moveToSan(p, r.move)).toBe('Rxd4+');
  });
  it('is deterministic for the same input', () => {
    const fen = startFen(OFFICIAL);
    const a = new Searcher(16).search(Position.fromFen(fen, OFFICIAL), { depth: 6 });
    const b = new Searcher(16).search(Position.fromFen(fen, OFFICIAL), { depth: 6 });
    expect(a.move).toBe(b.move);
    expect(a.score).toBe(b.score);
  });
  it('leaves the position unchanged after searching', () => {
    const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
    for (const san of ['d4', 'd5', 'Nc3']) p.make(sanToMove(p, san));
    const before = p.toFen();
    new Searcher(16).search(p, { nodes: 30000 });
    expect(p.toFen()).toBe(before);
  });
  it('evaluation is colour-symmetric at the start', () => {
    const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
    const q = Position.fromFen(startFen(OFFICIAL).replace(' w ', ' b '), OFFICIAL);
    expect(evaluate(p)).toBe(evaluate(q));
  });
});

describe('bots', () => {
  it('every tier and style returns legal moves across random positions', () => {
    const rand = rng(4);
    const s = new Searcher(16);
    for (let g = 0; g < 6; g++) {
      const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
      for (let i = 0; i < 10 + g * 6; i++) {
        const ms = p.legalMoves();
        if (!ms.length || boardOutcome(p)) break;
        p.make(ms[Math.floor(rand() * ms.length)]);
      }
      if (boardOutcome(p)) continue;
      for (const style of STYLE_IDS) {
        const tier = Math.floor(rand() * 8);
        const mv = chooseBotMove(p, { tier, style, seed: g }, s);
        expect(p.legalMoves()).toContain(mv.move);
      }
    }
  });
  it('a strong tier beats the weakest tier convincingly (small sample)', () => {
    let score = 0;
    for (let g = 0; g < 4; g++) {
      score += 1 - playGame(0, 6, 100 + g); // tier 6 as black
      score += playGame(6, 0, 200 + g); // tier 6 as white
    }
    expect(score).toBeGreaterThanOrEqual(7);
  });
  it('styles produce measurably different move choices', () => {
    // From a set of middlegame positions, compare how often each style's top-tier choice differs from balanced.
    const rand = rng(8);
    const positions: string[] = [];
    while (positions.length < 12) {
      const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
      for (let i = 0; i < 14; i++) {
        const ms = p.legalMoves();
        if (!ms.length) break;
        p.make(ms[Math.floor(rand() * ms.length)]);
      }
      if (!boardOutcome(p) && p.legalMoves().length > 5) positions.push(p.toFen());
    }
    const s = new Searcher(16);
    const pick = (fen: string, style: (typeof STYLE_IDS)[number]) =>
      chooseBotMove(Position.fromFen(fen, OFFICIAL), { tier: 7, style, seed: 1 }, s).move;
    const base = positions.map((f) => pick(f, 'balanced'));
    for (const style of ['attacker', 'defender', 'wildcard'] as const) {
      const diff = positions.filter((f, i) => pick(f, style) !== base[i]).length;
      expect(diff, style).toBeGreaterThanOrEqual(2);
    }
    expect(STYLES.attacker.pers.kingAttack).toBeGreaterThan(STYLES.defender.pers.kingAttack);
  });
});

describe('calibration data', () => {
  it('has one rating per tier and fitted ratings increase with tier', () => {
    expect(CALIBRATION.tierRatings.length).toBe(TIERS.length);
    for (let i = 1; i < CALIBRATION.tierRatings.length; i++)
      expect(CALIBRATION.tierRatings[i]).toBeGreaterThanOrEqual(CALIBRATION.tierRatings[i - 1]);
  });
});

describe('analysis', () => {
  it('produces per-move evaluations and an accuracy in [0,100]', () => {
    const moves = ['d2d4', 'e6e4', 'b1c3', 'b7c5'];
    const r = analyzeGame(moves, 0, 3000);
    expect(r.moves.length).toBe(4);
    expect(r.accuracy).toBeGreaterThanOrEqual(0);
    expect(r.accuracy).toBeLessThanOrEqual(100);
    expect(mFrom(0) + mTo(0)).toBe(0);
  });
});
