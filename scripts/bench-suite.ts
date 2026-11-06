/**
 * Reproducible engine benchmark suite: v0.1 (research/engine-v01) vs current.
 *   1. Tactics: the 49 engine-validated guide exercises — % first moves found
 *      at several node budgets (equal nodes for both engines).
 *   2. Mate finding: mate-in-N positions — % solved and nodes to find.
 *   3. Draw recognition: known dead/drawish positions should evaluate near 0.
 *   4. Search efficiency: nodes/s and depth reached in 1 s from fixed positions.
 *   5. Stability: identical results on repeated searches (determinism).
 * Output: research/engine-bench.md
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { parseMarkdown } from '../src/ui/markdown';
import { Position } from '../src/engine/board';
import { OFFICIAL } from '../src/engine/rules';
import { Searcher } from '../src/engine/search';
import { sanToMove, uciOf } from '../src/engine/game';
import * as OldB from '../research/engine-v01/board';
import { Searcher as OldSearcher } from '../research/engine-v01/search';
import { uciOf as oldUci } from '../research/engine-v01/game';

type Eng = { name: string; best: (fen: string, nodes: number) => { uci: string; score: number; depth: number; nodes: number; ms: number } };
const NEW: Eng = {
  name: 'v0.2',
  best: (fen, nodes) => {
    const s = new Searcher(18);
    const t = performance.now();
    const r = s.search(Position.fromFen(fen, OFFICIAL), { nodes });
    return { uci: uciOf(r.move), score: r.score, depth: r.depth, nodes: r.nodes, ms: performance.now() - t };
  },
};
const OLD: Eng = {
  name: 'v0.1',
  best: (fen, nodes) => {
    const s = new OldSearcher(18);
    const t = performance.now();
    const r = s.search(OldB.Position.fromFen(fen, OFFICIAL as any), { nodes });
    return { uci: oldUci(r.move), score: r.score, depth: r.depth, nodes: r.nodes, ms: performance.now() - t };
  },
};

// 1. tactics from the guide
const ex: { fen: string; first: string }[] = [];
for (const f of readdirSync('docs/guide').filter((x) => x.endsWith('.md')).sort()) {
  for (const b of parseMarkdown(readFileSync('docs/guide/' + f, 'utf8'))) {
    if (b.t !== 'exercise') continue;
    const p = Position.fromFen(b.fields.fen, OFFICIAL);
    const san = b.fields.solution.split(/\s+/).filter((x) => x && !/^\d+\.+$/.test(x))[0];
    const m = sanToMove(p, san);
    if (m) ex.push({ fen: b.fields.fen, first: uciOf(m) });
  }
}
const budgets = [5000, 20000, 100000];
const lines: string[] = [`# Engine benchmark suite (generated ${new Date().toISOString().slice(0, 10)})`, '', 'Equal node budgets for both engines. Reproduce with `npx tsx scripts/bench-suite.ts`.', ''];
lines.push('## 1. Tactics: guide exercises (first move found)', '', `| Nodes | v0.1 | v0.2 |`, '|---|---|---|');
for (const n of budgets) {
  const o = ex.filter((e) => OLD.best(e.fen, n).uci === e.first).length;
  const w = ex.filter((e) => NEW.best(e.fen, n).uci === e.first).length;
  lines.push(`| ${n.toLocaleString('en-US')} | ${o}/${ex.length} (${Math.round((o / ex.length) * 100)}%) | ${w}/${ex.length} (${Math.round((w / ex.length) * 100)}%) |`);
}

// 2. mates (from mined puzzles if present, else guide mates)
let mates: { fen: string; first: string[] }[] = [];
try {
  const pz = JSON.parse(readFileSync('src/academy/puzzles.json', 'utf8')) as { fen: string; themes: string[]; steps: { accept: string[] }[] }[];
  mates = pz.filter((p) => p.themes.some((t) => t.startsWith('mate'))).map((p) => ({ fen: p.fen, first: p.steps[0].accept }));
} catch {
  /* none */
}
if (mates.length) {
  lines.push('', `## 2. Mate finding (${mates.length} mined mate puzzles)`, '', '| Nodes | v0.1 | v0.2 |', '|---|---|---|');
  for (const n of [2000, 10000, 50000]) {
    const o = mates.filter((e) => e.first.includes(OLD.best(e.fen, n).uci)).length;
    const w = mates.filter((e) => e.first.includes(NEW.best(e.fen, n).uci)).length;
    lines.push(`| ${n.toLocaleString('en-US')} | ${o}/${mates.length} | ${w}/${mates.length} |`);
  }
}

// 3. draw recognition
const draws: [string, string][] = [
  ['K+B+N vs K, light-squared bishop (cannot force mate on 7×7)', '3k3/7/7/3K3/7/7/2N2B1 w - - 0 1'],
  ['K+B vs K+B, opposite colours', '3k3/2b4/7/3K3/7/3B3/7 w - - 0 1'],
  ['K+R vs K+B (no pawns)', '3k3/2b4/7/3K3/7/7/R6 w - - 0 1'],
  ['K+N vs K', '3k3/7/7/3K3/7/7/2N4 w - - 0 1'],
];
lines.push('', '## 3. Draw recognition (eval, side to move, 100k nodes; closer to 0 is better)', '', '| Position | v0.1 | v0.2 |', '|---|---|---|');
for (const [name, fen] of draws) lines.push(`| ${name} | ${OLD.best(fen, 100000).score} | ${NEW.best(fen, 100000).score} |`);
lines.push('', 'Control: K+B+N vs K with the **dark**-squared bishop is a forced win; v0.2 evaluates it as ' + NEW.best('3k3/7/7/3K3/7/7/1N3B1 w - - 0 1'.replace('1N3B1', '2N1B2'), 100000).score + ' cp.');

// 4. efficiency
const fens = ['rnbqkbr/ppppppp/7/7/7/PPPPPPP/RNBQKBR w KQkq - 0 1', 'r1bqkbr/ppp1ppp/2n4/3p3/3P3/2N1P2/R1BQKBR w Kk - 0 4'];
lines.push('', '## 4. Search efficiency (1-second-equivalent node budget, 600k nodes)', '', '| Position | Engine | Depth | Nodes/s |', '|---|---|---|---|');
for (const f of fens) {
  try {
    for (const e of [OLD, NEW]) {
      const r = e.best(f, 600000);
      lines.push(`| ${f.split(' ')[0].slice(0, 22)}… | ${e.name} | ${r.depth} | ${Math.round((r.nodes / r.ms) * 1000).toLocaleString('en-US')} |`);
    }
  } catch {
    /* skip invalid */
  }
}

// 5. stability
const a = NEW.best(fens[0], 200000);
const b = NEW.best(fens[0], 200000);
lines.push('', `## 5. Determinism`, '', `Two identical 200k-node searches from the start position: ${a.uci === b.uci && a.score === b.score ? 'identical move and score' : 'DIFFERENT'} (${a.uci}, ${a.score} cp).`, '');
writeFileSync('research/engine-bench.md', lines.join('\n'));
console.log(lines.join('\n'));
