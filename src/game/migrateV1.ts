/**
 * v0.1 → v0.2 career migration. v0.1 used a single 50-title list; v0.2 separates
 * seniority, job family and institutions. The current position maps to the
 * equivalent seniority (monotonic, never a demotion of seniority step), and all
 * titles earned under v0.1 are kept verbatim in the promotion history.
 */
import { rankInfo as v01RankInfo } from './legacy/career-v01';
import { firstRankOfTitle, meritNeeded, STEPS, GM_TITLES } from './career';
import type { SaveData } from './state';

/** v0.1 title index → v0.2 title index (seniority step / management / institution). */
export const V01_TITLE_MAP: number[] = [
  0, 1, 1, 2, 2, 2, 3, 3, 3, 4, // Intern … Senior Analyst
  4, 4, 5, 5, 5, 5, 6, 7, 7, 7, // Specialist … Group Manager
  8, 8, 9, 9, 9, 10, 10, 11, 12, 12, // Associate Director … Group VP
  12, 13, 13, 14, 16, 17, // Chief of Staff, CSO, COO, Deputy President, President, CEO
];

const V01_AUTHORED = 215;
let TABLE: number[] | null = null;
/** Precomputed map for the v0.1 authored ranks: grades spread across each merged title. */
function table(): number[] {
  if (TABLE) return TABLE;
  const tis: number[] = [];
  for (let r = 0; r < V01_AUTHORED; r++) tis.push(V01_TITLE_MAP[v01RankInfo(r).titleIndex] ?? newTiForOld(v01RankInfo(r).titleIndex));
  TABLE = new Array(V01_AUTHORED);
  let i = 0;
  while (i < V01_AUTHORED) {
    let j = i;
    while (j < V01_AUTHORED && tis[j] === tis[i]) j++;
    const ti = tis[i];
    const first = firstRankOfTitle(ti);
    const grades = ti < STEPS.length ? STEPS[ti].grades : 5;
    for (let k = i; k < j; k++) TABLE[k] = first + Math.min(grades - 1, Math.floor(((k - i) * grades) / (j - i)));
    i = j;
  }
  return TABLE;
}
function newTiForOld(oldTi: number) {
  return STEPS.length + GM_TITLES.length + (oldTi - V01_TITLE_MAP.length) * 2;
}

export function mapV01Rank(oldRank: number): number {
  if (oldRank < V01_AUTHORED) return table()[Math.max(0, Math.floor(oldRank))];
  const o = v01RankInfo(oldRank); // v0.1 procedural ranks: 5 grades each → institution offices 1:1
  return firstRankOfTitle(newTiForOld(o.titleIndex)) + Math.min(4, o.grade);
}

export function migrateCareerV1(s: SaveData) {
  const c = s.career as SaveData['career'] & { family?: string };
  const oldRank = c.rank ?? 0;
  const oldNeed = 50 + 6 * Math.pow(oldRank, 0.8);
  const frac = Math.max(0, Math.min(1, (c.merit ?? 0) / oldNeed));
  c.legacy = { rank: oldRank, title: v01RankInfo(oldRank).full, highest: v01RankInfo(c.highestRank ?? oldRank).full };
  c.promotions = (c.promotions ?? []).map((p) => ({ ...p, title: p.title ?? v01RankInfo(p.rank).full, rank: mapV01Rank(p.rank) }));
  c.rank = mapV01Rank(oldRank);
  c.highestRank = Math.max(c.rank, mapV01Rank(c.highestRank ?? oldRank));
  c.merit = Math.round(frac * meritNeeded(c.rank));
  if (c.series) c.series = { ...c.series, targetRank: Math.max(c.rank + 1, mapV01Rank(c.series.targetRank)) };
  if (!c.family) c.family = 'strategy';
}
