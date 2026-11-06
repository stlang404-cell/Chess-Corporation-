/**
 * SEVEN opening book, generated for the 7×7 variant (no 8×8 theory imported).
 * Breadth-first from the start position: every position reached by book moves
 * up to PLIES deep is searched at NODES nodes with root scores; moves within
 * MARGIN cp of the best are book moves (weighted by score). Output:
 * src/engine/book.json — { "<fen pieces+side>": [[uci, score], …] }.
 * Usage: tsx scripts/make-book.ts [plies=4] [nodes=1500000] [margin=20]
 */
import { writeFileSync } from 'node:fs';
import { Position } from '../src/engine/board';
import { OFFICIAL, startFen } from '../src/engine/rules';
import { Searcher } from '../src/engine/search';
import { uciOf } from '../src/engine/game';

const PLIES = +(process.argv[2] ?? 4);
const NODES = +(process.argv[3] ?? 1500000);
const MARGIN = +(process.argv[4] ?? 20);
const key = (p: Position) => p.toFen().split(' ').slice(0, 2).join(' ');
const book: Record<string, [string, number][]> = {};
let frontier: Position[] = [Position.fromFen(startFen(OFFICIAL), OFFICIAL)];
const s = new Searcher(20);
for (let ply = 0; ply < PLIES; ply++) {
  const next: Position[] = [];
  for (const p of frontier) {
    const k = key(p);
    if (book[k]) continue;
    const r = s.search(p, { nodes: NODES }, { rootScores: true, rootMargin: MARGIN + 10 });
    const best = r.rootScores![0][1];
    const moves = r.rootScores!.filter(([, v]) => v >= best - MARGIN).slice(0, 4);
    book[k] = moves.map(([m, v]) => [uciOf(m), v]);
    console.error(`ply ${ply} ${k} → ${book[k].map((x) => x.join(':')).join(' ')}`);
    for (const [m] of moves) {
      const q = p.clone();
      q.make(m);
      next.push(q);
    }
  }
  frontier = next;
}
writeFileSync('src/engine/book.json', JSON.stringify(book));
console.error(`book: ${Object.keys(book).length} positions`);
