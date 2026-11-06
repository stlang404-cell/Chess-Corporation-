import { Position } from '../src/engine/board';
import { OFFICIAL, startFen } from '../src/engine/rules';
import { Searcher } from '../src/engine/search';
import { chooseBotMove, TIERS } from '../src/engine/ai';
const s = new Searcher(18);
for (const t of TIERS) {
  const q = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const t0 = Date.now(); let n = 0;
  for (let i = 0; i < 16; i++) { const r = chooseBotMove(q, { tier: t.tier, style: 'balanced', seed: i }, s); q.make(r.move); n += r.nodes; }
  console.log(t.tier, ((Date.now() - t0) / 16).toFixed(0) + 'ms/move', Math.round(n / 16));
}
