/** Post-game analysis: per-move evaluation and accuracy for one side. */
import { Position } from './board';
import { OFFICIAL, startFen } from './rules';
import { Searcher, MATE, isMateScore } from './search';
import { uciToMove, moveToSan, uciOf } from './game';
import { winPct, moveAccuracy, gameAccuracy } from '../game/economy';

export interface MoveAnalysis {
  ply: number;
  san: string;
  /** evaluation after the move, white perspective (cp, mates clamped to ±2000) */
  evalWhite: number;
  bestSan: string;
  accuracy: number;
  tag: '' | 'inaccuracy' | 'mistake' | 'blunder' | 'best';
}

const clampCp = (s: number) => (isMateScore(s) ? Math.sign(s) * (2000 + (MATE - Math.abs(s))) : Math.max(-2000, Math.min(2000, s)));

export function analyzeGame(moves: string[], forColor: 0 | 1 | null, nodes = 25000, onProgress?: (p: number) => void) {
  const pos = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const s = new Searcher(18);
  const out: MoveAnalysis[] = [];
  let prev = s.search(pos, { nodes });
  for (let i = 0; i < moves.length; i++) {
    const mover = pos.side;
    const m = uciToMove(pos, moves[i]);
    if (!m) break;
    const san = moveToSan(pos, m);
    const bestSan = prev.move ? moveToSan(pos, prev.move) : san;
    const before = clampCp(prev.score); // mover perspective
    pos.make(m);
    const after = pos.hasLegalMove() ? s.search(pos, { nodes }) : { score: pos.inCheck() ? -MATE : 0, move: 0 } as any;
    const afterMover = -clampCp(after.score);
    const acc = moveAccuracy(winPct(before), winPct(afterMover));
    const loss = winPct(before) - winPct(afterMover);
    let tag: MoveAnalysis['tag'] = '';
    if (prev.move && uciOf(prev.move) === moves[i]) tag = 'best';
    else if (loss > 30) tag = 'blunder';
    else if (loss > 15) tag = 'mistake';
    else if (loss > 7) tag = 'inaccuracy';
    out.push({ ply: i, san, evalWhite: mover === 0 ? afterMover : -afterMover, bestSan, accuracy: Math.round(acc), tag });
    prev = after;
    onProgress?.((i + 1) / moves.length);
  }
  const mine = forColor === null ? out : out.filter((a) => a.ply % 2 === forColor);
  return { moves: out, accuracy: gameAccuracy(mine.map((a) => a.accuracy)) };
}
