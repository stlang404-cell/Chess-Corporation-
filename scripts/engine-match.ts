/**
 * Old-vs-new engine match at EQUAL NODE BUDGETS.
 * Usage: tsx scripts/engine-match.ts <nodes|tMS> <openings> <seed> [label]
 * A budget written as t<ms> (e.g. t100) gives both engines EQUAL TIME per move instead.
 * Both engines play every opening with both colours (2 games per opening).
 * Openings: 4 random plies chosen among moves within 60 cp of best (v0.1 engine,
 * 20k nodes), seeded and reproducible. Emits one JSON line per game.
 */
import * as NewB from '../src/engine/board';
import { OFFICIAL, startFen } from '../src/engine/rules';
import { Searcher as NewSearcher } from '../src/engine/search';
import { boardOutcome, uciOf, uciToMove } from '../src/engine/game';
import * as OldB from '../research/engine-v01/board';
import { Searcher as OldSearcher } from '../research/engine-v01/search';
import { uciOf as oldUci, uciToMove as oldUciToMove } from '../research/engine-v01/game';

const [nodesS, openS, seedS, label = 'new-vs-v01'] = process.argv.slice(2);
const timeMs = nodesS.startsWith('t') ? +nodesS.slice(1) : 0;
const nodes: number | string = timeMs ? nodesS : +nodesS;
const lim = timeMs ? { timeMs } : { nodes: nodes as number };
let seed = +seedS;
const rand = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff);

function makeOpening(): string[] {
  const p = OldB.Position.fromFen(startFen(OFFICIAL), OFFICIAL as any);
  const s = new OldSearcher(16);
  const moves: string[] = [];
  for (let i = 0; i < 4; i++) {
    const r = s.search(p, { nodes: 20000 }, { rootScores: true, rootMargin: 60 });
    const ok = r.rootScores!.filter((x) => x[1] >= r.rootScores![0][1] - 60);
    const m = ok.length ? ok[Math.floor(rand() * ok.length)][0] : r.move;
    moves.push(oldUci(m));
    p.make(m);
  }
  return moves;
}

function play(opening: string[], newIsWhite: boolean) {
  const pn = NewB.Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const po = OldB.Position.fromFen(startFen(OFFICIAL), OFFICIAL as any);
  const sn = new NewSearcher(18);
  const so = new OldSearcher(18);
  for (const u of opening) {
    pn.make(uciToMove(pn, u));
    po.make(oldUciToMove(po, u));
  }
  for (let ply = 0; ply < 300; ply++) {
    const out = boardOutcome(pn);
    if (out) return { result: out.result, term: out.termination, plies: pn.ply };
    const newToMove = (pn.side === 0) === newIsWhite;
    let u: string;
    if (newToMove) u = uciOf(sn.search(pn, lim).move);
    else u = oldUci(so.search(po, lim).move);
    pn.make(uciToMove(pn, u));
    po.make(oldUciToMove(po, u));
  }
  return { result: 0.5, term: 'max-length', plies: 300 };
}

for (let o = 0; o < +openS; o++) {
  const op = makeOpening();
  for (const newWhite of [true, false]) {
    const r = play(op, newWhite);
    const scoreNew = newWhite ? r.result : 1 - r.result;
    console.log(JSON.stringify({ label, nodes, opening: op.join(' '), newWhite, scoreNew, term: r.term, plies: r.plies }));
  }
}
