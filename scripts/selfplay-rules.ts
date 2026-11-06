/**
 * Ruleset research: engine self-play for each candidate.
 * Usage: tsx scripts/selfplay-rules.ts <rulesetId> <games> <nodesPerMove> <seed>
 * Output: one JSON line summary.
 */
import { Position } from '../src/engine/board';
import { CANDIDATES, startFen } from '../src/engine/rules';
import { Searcher } from '../src/engine/search';
import { boardOutcome } from '../src/engine/game';

const [id, gamesS, nodesS, seedS] = process.argv.slice(2);
const rules = CANDIDATES.find((r) => r.id === id)!;
const games = +gamesS, nodes = +nodesS;
let seed = +seedS;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const stats = { id, games: 0, white: 0, black: 0, draws: 0, plies: 0, term: {} as Record<string, number>, openingEvals: [] as number[] };
const s = new Searcher(18);
for (let g = 0; g < games; g++) {
  const p = Position.fromFen(startFen(rules), rules);
  s.tt.clear();
  s.noiseSeed = Math.floor(rand() * 1e9);
  // diversify: 2 random plies chosen among moves within 40cp of best
  let out = null;
  for (let ply = 0; ply < 300; ply++) {
    out = boardOutcome(p);
    if (out) break;
    let m: number;
    if (ply < 4) {
      const r = s.search(p, { nodes: nodes / 2 }, { rootScores: true });
      const ok = r.rootScores!.filter((x) => x[1] >= r.rootScores![0][1] - 40);
      m = ok[Math.floor(rand() * ok.length)][0];
      if (ply === 3) stats.openingEvals.push(r.rootScores![0][1] * (p.side === 0 ? 1 : -1));
    } else m = s.search(p, { nodes }).move;
    p.make(m);
  }
  if (!out) out = { result: 0.5, termination: 'max-length' } as any;
  stats.games++;
  stats.plies += p.ply;
  if (out!.result === 1) stats.white++;
  else if (out!.result === 0) stats.black++;
  else stats.draws++;
  stats.term[out!.termination] = (stats.term[out!.termination] ?? 0) + 1;
}
const ev = stats.openingEvals;
console.log(JSON.stringify({ ...stats, openingEvals: undefined, avgOpeningEval: ev.reduce((a, b) => a + b, 0) / ev.length }));
