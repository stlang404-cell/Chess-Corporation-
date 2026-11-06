import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { Position, BLACK, WHITE } from '../src/engine/board';
import { OFFICIAL } from '../src/engine/rules';
import { Searcher, isMateScore } from '../src/engine/search';
import { uciToMove, uciOf, boardOutcome } from '../src/engine/game';

interface Puzzle {
  id: string;
  fen: string;
  themes: string[];
  rating: number;
  steps: { accept: string[]; reply?: string }[];
}
const PUZZLES = JSON.parse(readFileSync('src/academy/puzzles.json', 'utf8')) as Puzzle[];

describe('puzzle library', () => {
  it('has a substantial, uniquely identified library with themes and ratings', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    expect(new Set(PUZZLES.map((p) => p.fen.split(' ').slice(0, 2).join(' '))).size).toBe(PUZZLES.length);
    for (const p of PUZZLES) {
      expect(p.themes.length).toBeGreaterThan(0);
      expect(p.rating).toBeGreaterThanOrEqual(500);
      expect(p.rating).toBeLessThanOrEqual(2500);
    }
  });
  it('every position is legal and every accepted move and reply is legal under SEVEN-1.0', () => {
    for (const p of PUZZLES) {
      const pos = Position.fromFen(p.fen, OFFICIAL);
      const kings = [pos.counts[6], pos.counts[14]];
      expect(kings).toEqual([1, 1]);
      expect(pos.isAttacked(pos.kingSq[pos.side ^ 1], pos.side)).toBe(false); // side not to move not in check
      expect(boardOutcome(pos)).toBeNull();
      for (const st of p.steps) {
        expect(st.accept.length).toBeGreaterThan(0);
        for (const u of st.accept) expect([p.id, u, uciToMove(pos, u) !== 0]).toEqual([p.id, u, true]);
        pos.make(uciToMove(pos, st.accept[0]));
        if (st.reply) {
          const r = uciToMove(pos, st.reply);
          expect([p.id, st.reply, r !== 0]).toEqual([p.id, st.reply, true]);
          pos.make(r);
        }
      }
      expect([WHITE, BLACK]).toContain(pos.side);
    }
  });
  it('mate puzzles really end in checkmate along the accepted line', () => {
    for (const p of PUZZLES.filter((x) => x.themes.some((t) => t.startsWith('mate-in')))) {
      const pos = Position.fromFen(p.fen, OFFICIAL);
      for (const st of p.steps) {
        pos.make(uciToMove(pos, st.accept[0]));
        if (st.reply) pos.make(uciToMove(pos, st.reply));
      }
      expect([p.id, boardOutcome(pos)?.termination]).toEqual([p.id, 'checkmate']);
    }
  });
  it('the engine independently confirms the first move of a sample of puzzles', () => {
    const sample = PUZZLES.filter((_, i) => i % Math.max(1, Math.floor(PUZZLES.length / 25)) === 0);
    let agree = 0;
    for (const p of sample) {
      const pos = Position.fromFen(p.fen, OFFICIAL);
      const r = new Searcher(17).search(pos, { nodes: 150000 });
      if (p.steps[0].accept.includes(uciOf(r.move)) || (isMateScore(r.score) && r.score > 0 && p.themes.some((t) => t.startsWith('mate-in')))) agree++;
    }
    // generated at 300k nodes with a ≥ 250 cp margin; at half the budget nearly all must agree
    expect(agree / sample.length).toBeGreaterThanOrEqual(0.9);
  });
});
