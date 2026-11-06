/**
 * Post-game analysis (review standard "rev-3"): per-move evaluation, accuracy,
 * move-quality labels, missed wins and forced-move detection.
 *
 * Every position is searched once with root scores for all moves inside a
 * window around the best, so played, best and second-best moves are compared at
 * the SAME depth. Labels use win-probability points lost (W%):
 *   best        engine's choice (or < 0.5 W% lost)
 *   great       best, and every alternative loses ≥ 15 W% (the only good move)
 *   brilliant   great AND a real sacrifice (SEE < 0) AND the position was not
 *               already decided (30 ≤ W% < 85) — then RE-VERIFIED with a 4×
 *               deeper search; if the deeper search disagrees it is downgraded
 *   excellent < 2 · good < 10 · inaccuracy 10–20 · mistake 20–30 · blunder ≥ 30
 *   missed win  (flag) the side could reach W% ≥ 80 but played a move leaving < 60
 * Forced moves (≤ 2 legal moves) are flagged and never earn quality bonuses.
 */
import { Position } from './board';
import { OFFICIAL, startFen } from './rules';
import { Searcher, MATE, isMateScore } from './search';
import { uciToMove, moveToSan, uciOf } from './game';
import { winPct, moveAccuracy, gameAccuracy } from '../game/economy';

export const REVIEW_STANDARD = 'rev-3';
export type Quality = 'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface MoveAnalysis {
  ply: number;
  san: string;
  uci: string;
  /** evaluation after the move, white perspective (cp; mates beyond ±2000) */
  evalWhite: number;
  /** mover's win probability before (best play) and after the move played */
  winBefore: number;
  winAfter: number;
  bestSan: string;
  bestUci: string;
  accuracy: number;
  quality: Quality;
  /** legacy short tag used by older UI code */
  tag: '' | 'inaccuracy' | 'mistake' | 'blunder' | 'best';
  missedWin: boolean;
  forced: boolean;
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

function scorePosition(s: Searcher, pos: Position, m: number, nodes: number) {
  const r = s.search(pos, { nodes }, { rootScores: true, rootMargin: 350 });
  const scores = r.rootScores ?? [[r.move, r.score]];
  const bestScore = scores[0][1];
  const best = scores[0][0];
  const entry = scores.find(([mv]) => mv === m);
  let playedScore: number;
  if (entry) playedScore = entry[1];
  else {
    // not scored before the node cap: search the reply position directly (never assume a blunder)
    pos.make(m);
    playedScore = pos.hasLegalMove() ? -s.search(pos, { nodes }).score : pos.inCheck() ? MATE - 1 : 0;
    pos.unmake();
    playedScore = Math.min(playedScore, bestScore);
  }
  const second = scores.length > 1 ? scores[1][1] : null;
  return { best, bestScore, playedScore, second, depth: r.depth };
}

export function analyzeGame(moves: string[], forColor: 0 | 1 | null, nodes = 20000, onProgress?: (p: number) => void) {
  const pos = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const s = new Searcher(18);
  const out: MoveAnalysis[] = [];
  for (let i = 0; i < moves.length; i++) {
    const mover = pos.side;
    const m = uciToMove(pos, moves[i]);
    if (!m) break;
    const san = moveToSan(pos, m);
    const legalCount = pos.legalMoves().length;
    let sc = scorePosition(s, pos, m, nodes);
    const see = pos.see(m);
    let quality = classify({ played: m, best: sc.best, bestScore: sc.bestScore, playedScore: sc.playedScore, secondScore: sc.second, see });
    if (quality === 'brilliant') {
      // rare label: confirm with a 4× deeper, fresh search before awarding it
      const deep = scorePosition(new Searcher(18), pos, m, nodes * 4);
      const q2 = classify({ played: m, best: deep.best, bestScore: deep.bestScore, playedScore: deep.playedScore, secondScore: deep.second, see });
      quality = q2 === 'brilliant' ? 'brilliant' : q2 === 'great' ? 'great' : 'best';
      sc = deep;
    }
    if (legalCount <= 2 && (quality === 'great' || quality === 'brilliant')) quality = 'best'; // forced: no credit
    const winBefore = winPct(clampCp(sc.bestScore));
    const winAfter = winPct(clampCp(sc.playedScore));
    const acc = moveAccuracy(winBefore, winAfter);
    const afterMover = clampCp(sc.playedScore);
    const tag: MoveAnalysis['tag'] = quality === 'blunder' || quality === 'mistake' || quality === 'inaccuracy' ? quality : quality === 'best' || quality === 'great' || quality === 'brilliant' ? 'best' : '';
    out.push({
      ply: i,
      san,
      uci: moves[i],
      evalWhite: mover === 0 ? afterMover : -afterMover,
      winBefore: Math.round(winBefore * 10) / 10,
      winAfter: Math.round(winAfter * 10) / 10,
      bestSan: moveToSan(pos, sc.best),
      bestUci: uciOf(sc.best),
      accuracy: Math.round(acc),
      quality,
      tag,
      missedWin: winBefore >= 80 && winAfter < 60,
      forced: legalCount <= 2,
      depth: sc.depth,
      lowConfidence: sc.depth < 7,
    });
    pos.make(m);
    onProgress?.((i + 1) / moves.length);
  }
  const mine = forColor === null ? out : out.filter((a) => a.ply % 2 === forColor);
  return { moves: out, accuracy: gameAccuracy(mine.map((a) => a.accuracy)), standard: REVIEW_STANDARD, nodes };
}

/** Compact per-player summary used by the paycheck, contracts and records. */
export interface ReviewSummary {
  standard: string;
  accuracy: number;
  moves: number;
  counts: Record<Quality, number>;
  missedWins: number;
  /** minimum win probability the player had after move 10 (defence detection) */
  minWin: number;
  maxWin: number;
}

export function summarize(moves: MoveAnalysis[], color: 0 | 1): ReviewSummary {
  const mine = moves.filter((m) => m.ply % 2 === color);
  const counts = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 } as Record<Quality, number>;
  for (const m of mine) counts[m.quality]++;
  const later = mine.filter((m) => m.ply >= 20);
  return {
    standard: REVIEW_STANDARD,
    accuracy: gameAccuracy(mine.map((m) => m.accuracy)),
    moves: mine.length,
    counts,
    missedWins: mine.filter((m) => m.missedWin).length,
    minWin: later.length ? Math.min(...later.map((m) => m.winAfter)) : 50,
    maxWin: later.length ? Math.max(...later.map((m) => m.winAfter)) : 50,
  };
}

export { uciOf };
