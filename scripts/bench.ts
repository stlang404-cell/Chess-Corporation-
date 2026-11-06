import { Position } from '../src/engine/board';
import { CANDIDATES, startFen } from '../src/engine/rules';
import { Searcher } from '../src/engine/search';
import { moveToSan } from '../src/engine/game';
for (const r of CANDIDATES) {
  const p = Position.fromFen(startFen(r), r);
  const t = Date.now();
  const counts = [1,2,3,4,5].map(d => p.perft(d));
  console.log(r.id, counts.join(' '), (Date.now()-t)+'ms');
}
const r = CANDIDATES[1];
const p = Position.fromFen(startFen(r), r);
const s = new Searcher(20);
const res = s.search(p, { timeMs: 3000 });
console.log('depth', res.depth, 'nodes', res.nodes, 'nps', Math.round(res.nodes/res.timeMs*1000), 'score', res.score, moveToSan(p, res.move));
