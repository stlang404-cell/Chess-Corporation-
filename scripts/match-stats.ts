/** Summarise engine-match JSONL: score, Elo difference with 95% CI (trinomial). */
import { readFileSync } from 'node:fs';
const files = process.argv.slice(2);
const groups = new Map<string, number[]>();
for (const f of files)
  for (const l of readFileSync(f, 'utf8').split('\n'))
    if (l.trim()) {
      const g = JSON.parse(l);
      const k = `${g.label} @${g.nodes}`;
      (groups.get(k) ?? groups.set(k, []).get(k)!).push(g.scoreNew);
    }
const elo = (p: number) => -400 * Math.log10(1 / p - 1);
for (const [k, v] of groups) {
  const n = v.length;
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const varr = v.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const se = Math.sqrt(varr / n);
  const w = v.filter((x) => x === 1).length, d = v.filter((x) => x === 0.5).length, l = n - w - d;
  const lo = Math.max(0.001, mean - 1.96 * se), hi = Math.min(0.999, mean + 1.96 * se);
  console.log(`${k}: n=${n} +${w} =${d} -${l} score ${(mean * 100).toFixed(1)}% Elo ${elo(Math.min(0.999, Math.max(0.001, mean))).toFixed(0)} [${elo(lo).toFixed(0)}, ${elo(hi).toFixed(0)}]`);
}
