/**
 * Post-game analysis: per-move evaluation, accuracy and move-quality labels.
 *
 * Every position is searched once with root scores for all moves (inside a
 * window around the best), so the played move, the best move and the second-best
 * move are compared at the SAME depth. Labels (win-probability points lost, W%):
 *   best        the engine's choice (or within 0.5 W%)
 *   great       best, and every alternative loses ≥ 15 W% (the only good move)
 *   brilliant   great AND a genuine sacrifice (moved piece can be won by
 *               exchange, SEE < 0) AND the position was not already winning
 *               (W% < 85) — deliberately rare
 *   excellent   < 2 W% lost      good        < 10 W% lost
 *   inaccuracy  10–20            mistake     20–30            blunder ≥ 30
 * When the search reached depth < 7 the label is flagged as low confidence.
 */
import { Position } from './board';
import { OFFICIAL, startFen } from './rules';
import { Searcher, MATE, isMateScore } from './search';
import { uciToMove, moveToSan, uciOf } from './game';
import { winPct, moveAccuracy, gameAccuracy } from '../game/economy';

export type Quality = 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface MoveAnalysis {
  ply: number;
  san: string;
  /** evaluation after the move, white perspective (cp; mates clamped beyond ±2000) */
  evalWhite: number;
  bestSan: string;
  accuracy: number;
  quality: Quality;
  /** legacy short tag used by older UI code */
  tag: '' | 'inaccuracy' | 'mistake' | 'blunder' | 'best';
  depth: number;
  lowConfidence: boolean;
}

const clampCp = (s: number) => (isMateScore(s) ? Math.sign(s) * (2000 + (MATE - Math.abs(s))) : Math.max(-2000, Math.min(2000, s)));

export function classify(opts: { played: number; best: number; bestScore: number; playedScore: number; secondScore: number | null; see: number }): Quality {
  const wBest = winPct(clampCp(opts.bestScore));
  const wPlayed = winPct(clampCp(opts.playedScore));
  const loss = Math.max(0, wBest - wPlayed);
  const isBest = opts.played === opts.best || loss < 0.5;
  if (isBest) {
    const wSecond = opts.secondScore === null ? -1 : winPct(clampCp(opts.secondScore));
    const only = opts.secondScore === null || wBest - wSecond >= 15;
    if (only && opts.see < 0 && wBest < 85 && wBest >= 30) return 'brilliant';
    if (only && wBest - Math.max(0, wSecond) >= 15 && opts.secondScore !== null) return 'great';
    return 'best';
  }
  if (loss < 2) return 'excellent';
  if (loss < 10) return 'good';
  if (loss < 20) return 'inaccuracy';
  if (loss < 30) return 'mistake';
  return 'blunder';
}

export function analyzeGame(moves: string[], forColor: 0 | 1 | null, nodes = 25000, onProgress?: (p: number) => void) {
  const pos = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const s = new Searcher(18);
  const out: MoveAnalysis[] = [];
  for (let i = 0; i < moves.length; i++) {
    const mover = pos.side;
    const m = uciToMove(pos, moves[i]);
    if (!m) break;
    const san = moveToSan(pos, m);
    const r = s.search(pos, { nodes }, { rootScores: true, rootMargin: 600 });
    const scores = r.rootScores ?? [[r.move, r.score]];
    const bestScore = scores[0][1];
    const best = scores[0][0];
    const playedEntry = scores.find(([mv]) => mv === m);
    let playedScore: number;
    if (playedEntry) playedScore = playedEntry[1];
    else {
      // not scored before the node cap: search the reply position directly (never assume a blunder)
      pos.make(m);
      playedScore = pos.hasLegalMove() ? -s.search(pos, { nodes }).score : pos.inCheck() ? MATE - 1 : 0;
      pos.unmake();
      playedScore = Math.min(playedScore, bestScore);
    }
    const second = scores.length > 1 ? scores[1][1] : null;
    const see = pos.see(m);
    const quality = classify({ played: m, best, bestScore, playedScore, secondScore: second, see });
    const acc = moveAccuracy(winPct(clampCp(bestScore)), winPct(clampCp(playedScore)));
    const afterMover = clampCp(playedScore);
    const tag: MoveAnalysis['tag'] = quality === 'blunder' || quality === 'mistake' || quality === 'inaccuracy' ? quality : quality === 'best' || quality === 'great' || quality === 'brilliant' ? 'best' : '';
    out.push({
      ply: i,
      san,
      evalWhite: mover === 0 ? afterMover : -afterMover,
      bestSan: moveToSan(pos, best),
      accuracy: Math.round(acc),
      quality,
      tag,
      depth: r.depth,
      lowConfidence: r.depth < 7,
    });
    pos.make(m);
    onProgress?.((i + 1) / moves.length);
  }
  const mine = forColor === null ? out : out.filter((a) => a.ply % 2 === forColor);
  return { moves: out, accuracy: gameAccuracy(mine.map((a) => a.accuracy)) };
}

export { uciOf };
