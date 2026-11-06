/** Collects research/puzzles-*.jsonl into src/academy/puzzles.json (deduplicated, stable ids, legality-checked). */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { Position } from '../src/engine/board';
import { OFFICIAL } from '../src/engine/rules';
import { uciToMove, boardOutcome } from '../src/engine/game';

const seen = new Set<string>();
const out: unknown[] = [];
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
};
for (const f of readdirSync('research').filter((x) => /^puzzles-.*\.jsonl$/.test(x)).sort()) {
  for (const line of readFileSync('research/' + f, 'utf8').split('\n')) {
    if (!line.startsWith('{')) continue;
    const p = JSON.parse(line);
    const key = p.fen.split(' ').slice(0, 2).join(' ');
    if (seen.has(key)) continue;
    // legality: every accept move and reply must be legal along the line
    const pos = Position.fromFen(p.fen, OFFICIAL);
    let ok = true;
    for (const st of p.steps) {
      if (!st.accept.length || !st.accept.every((u: string) => uciToMove(pos, u))) ok = false;
      if (!ok) break;
      pos.make(uciToMove(pos, st.accept[0]));
      if (st.reply) {
        const r = uciToMove(pos, st.reply);
        if (!r) {
          ok = false;
          break;
        }
        pos.make(r);
      }
    }
    if (!ok) continue;
    // mate puzzles must end in checkmate along the stored line (long mates are truncated → drop)
    if (p.themes.some((t: string) => t.startsWith('mate-in')) && boardOutcome(pos)?.termination !== 'checkmate') continue;
    seen.add(key);
    out.push({ id: 'pz-' + hash(key), fen: p.fen, themes: p.themes, rating: p.rating, steps: p.steps });
  }
}
out.sort((a: any, b: any) => a.rating - b.rating || a.id.localeCompare(b.id));
writeFileSync('src/academy/puzzles.json', JSON.stringify(out));
const themes: Record<string, number> = {};
for (const p of out as any[]) for (const t of p.themes) themes[t] = (themes[t] ?? 0) + 1;
console.log(`${out.length} puzzles`, themes);
