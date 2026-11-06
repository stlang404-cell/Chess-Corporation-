/**
 * Engine tier tournament for rating calibration.
 * Usage: tsx scripts/calibrate.ts <tierA> <tierB> <gamePairs> <seed> [style]
 * Plays colour-reversed game pairs from the standard start (bots diversify via
 * seeded noise / opening variety). Appends JSON lines to stdout.
 */
import { Position } from '../src/engine/board';
import { OFFICIAL, startFen } from '../src/engine/rules';
import { Searcher } from '../src/engine/search';
import { boardOutcome } from '../src/engine/game';
import { chooseBotMove, type StyleId } from '../src/engine/ai';

const [a, b, pairsS, seedS, styleA, styleB] = process.argv.slice(2);
const sA = (styleA ?? 'balanced') as StyleId;
const sB = (styleB ?? styleA ?? 'balanced') as StyleId;
let seed = +seedS;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const sr = new Searcher(18);
function play(white: { tier: number; style: StyleId }, black: { tier: number; style: StyleId }) {
  const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const seeds = [Math.floor(rand() * 2 ** 30), Math.floor(rand() * 2 ** 30)];
  sr.tt.clear();
  for (let ply = 0; ply < 400; ply++) {
    const o = boardOutcome(p);
    if (o) return { result: o.result, term: o.termination, plies: ply };
    const who = p.side === 0 ? white : black;
    const mv = chooseBotMove(p, { tier: who.tier, style: who.style, seed: seeds[p.side] }, sr);
    p.make(mv.move);
  }
  return { result: 0.5, term: 'max-length', plies: 400 };
}
for (let i = 0; i < +pairsS; i++) {
  for (const flip of [false, true]) {
    const A = { tier: +a, style: sA }, B = { tier: +b, style: sB };
    const r = flip ? play(B, A) : play(A, B);
    const scoreA = flip ? 1 - r.result : r.result;
    console.log(JSON.stringify({ a: `${a}:${sA}`, b: `${b}:${sB}`, scoreA, aWhite: !flip, term: r.term, plies: r.plies }));
  }
}
