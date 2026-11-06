/**
 * A/B match of evaluation feature sets with the SAME (current) search, equal nodes.
 * Usage: tsx scripts/ab-match.ts <nodes> <openings> <seed> <label> <offFeature,offFeature...>
 * Side A = all features on; side B = listed features off. Emits engine-match JSON lines (scoreNew = A's score).
 */
import { Position } from '../src/engine/board';
import { OFFICIAL, startFen } from '../src/engine/rules';
import { Searcher } from '../src/engine/search';
import { boardOutcome, uciToMove } from '../src/engine/game';
import { EVAL_OPTS } from '../src/engine/eval';
import { SEARCH_OPTS } from '../src/engine/search';
import * as OldB from '../research/engine-v01/board';
import { Searcher as OldSearcher } from '../research/engine-v01/search';
import { uciOf as oldUci } from '../research/engine-v01/game';

const [nodesS, openS, seedS, label, offS = ''] = process.argv.slice(2);
const nodes = +nodesS;
const off = offS.split(',').filter(Boolean);
let seed = +seedS;
const rand = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff);
const OPTS: Record<string, boolean>[] = [EVAL_OPTS as any, SEARCH_OPTS as any];
const setA = () => { for (const o of OPTS) for (const k of Object.keys(o)) o[k] = true; };
const setB = () => { setA(); for (const k of off) for (const o of OPTS) if (k in o) o[k] = false; };
function makeOpening(): string[] {
  const p = OldB.Position.fromFen(startFen(OFFICIAL), OFFICIAL as any);
  const s = new OldSearcher(16);
  const moves: string[] = [];
  for (let i = 0; i < 4; i++) {
    const r = s.search(p, { nodes: 20000 }, { rootScores: true, rootMargin: 60 });
    const ok = r.rootScores!.filter((x) => x[1] >= r.rootScores![0][1] - 60);
    const m = ok[Math.floor(rand() * ok.length)][0];
    moves.push(oldUci(m));
    p.make(m);
  }
  return moves;
}
for (let o = 0; o < +openS; o++) {
  const op = makeOpening();
  for (const aWhite of [true, false]) {
    const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
    for (const u of op) p.make(uciToMove(p, u));
    const sa = new Searcher(18), sb = new Searcher(18);
    let res = 0.5, term = 'max-length';
    for (let ply = 0; ply < 300; ply++) {
      const out = boardOutcome(p);
      if (out) { res = out.result; term = out.termination; break; }
      const aMove = (p.side === 0) === aWhite;
      if (aMove) setA(); else setB();
      const r = (aMove ? sa : sb).search(p, { nodes });
      p.make(r.move);
    }
    setA();
    console.log(JSON.stringify({ label, nodes, opening: op.join(' '), newWhite: aWhite, scoreNew: aWhite ? res : 1 - res, term, plies: p.ply }));
  }
}
