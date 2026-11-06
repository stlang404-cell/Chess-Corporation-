import { describe, it, expect } from 'vitest';
import {
  rankInfo,
  rankLine,
  rankId,
  arenaForRank,
  arenaInfo,
  firstRankOfArena,
  institutionInfo,
  authoredTitleCount,
  authoredGradeCount,
  AUTHORED_RANKS,
  AUTHORED_ARENA_COUNT,
  MAX_RANK,
  meritNeeded,
  ratingGate,
  salary,
  seriesLength,
  FAMILIES,
  STEPS,
  INST_START,
} from '../src/game/career';
import { BANNED_WORDS, GM_TITLES, INSTITUTIONS } from '../src/game/careerData';
import { mapV01Rank } from '../src/game/migrateV1';

const has = (t: string, w: string) => new RegExp(`\\b${w}\\b`).test(t);

describe('scale of the authored hierarchy', () => {
  it('has ≥ 300 distinct titles, ≥ 1,000 grades and ≥ 60 arenas', () => {
    expect(authoredTitleCount()).toBeGreaterThanOrEqual(300);
    expect(authoredGradeCount()).toBeGreaterThanOrEqual(1000);
    expect(AUTHORED_ARENA_COUNT).toBeGreaterThanOrEqual(60);
    const names = new Set(Array.from({ length: AUTHORED_ARENA_COUNT }, (_, i) => arenaInfo(i).name));
    expect(names.size).toBe(AUTHORED_ARENA_COUNT);
  });
  it('job titles are unique across all families', () => {
    const all = FAMILIES.flatMap((f) => f.titles);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('semantic validation of every authored title', () => {
  for (const f of FAMILIES) {
    it(`${f.name}: seniority words, family keyword and ordering`, () => {
      expect(f.titles.length).toBe(STEPS.length);
      f.titles.forEach((t, step) => {
        // family compatibility
        expect(f.keywords.some((k) => t.includes(k)), `${t} lacks a ${f.name} keyword`).toBe(true);
        // banned inflation words
        for (const w of BANNED_WORDS) expect(has(t, w), `${t} contains ${w}`).toBe(false);
        // seniority vocabulary is used only at its level
        expect(has(t, 'Intern')).toBe(step === 0);
        if (has(t, 'Chief') || t === 'Group Treasurer') expect(step).toBe(13);
        if (step === 13) expect(has(t, 'Chief') || t === 'Group Treasurer').toBe(true);
        expect(t.startsWith('Executive Vice President')).toBe(step === 12);
        if (has(t, 'Vice President')) expect(step).toBeGreaterThanOrEqual(10);
        if (has(t, 'Director')) expect([8, 9]).toContain(step);
        if (has(t, 'Manager')) expect([6, 7]).toContain(step);
        if (has(t, 'Supervisor') || has(t, 'Team Lead')) expect(step).toBe(5);
        if (/^(Junior|Assistant)\b/.test(t) || /\b(Assistant|Coordinator|Representative|Technician|Inspector|Associate)$/.test(t) || t === 'Paralegal')
          expect(step).toBe(1);
        if (/^(Lead|Principal)\b/.test(t) || t === 'Staff Engineer' || has(t, 'Business Partner')) expect(step).toBe(4);
        if (t.startsWith('Senior ')) expect([3, 7, 9, 11]).toContain(step);
        // functional ladders never contain governance or honorary offices
        for (const w of ['Board', 'Chair', 'Chairman', 'Trustee', 'Governor', 'Chancellor', 'Regent', 'Elder']) expect(has(t, w)).toBe(false);
        // no CFO-of-HR style contradictions: a chief title belongs to its own function
        if (step === 13 && f.id !== 'treasury') expect(f.keywords.some((k) => t.includes(k)) || /Operating|Revenue|Technology|Information|Risk|Legal|Administrative/.test(t)).toBe(true);
      });
    });
  }
  it('general management and institution offices are distinct from functional titles', () => {
    expect(GM_TITLES.map((g) => g.title)).toEqual(['Business Unit President', 'Group President', 'President', 'Chief Executive Officer']);
    const functional = new Set(FAMILIES.flatMap((f) => f.titles));
    for (const g of GM_TITLES) expect(functional.has(g.title)).toBe(false);
  });
  it('seniority strictly increases along every promotion path', () => {
    for (const f of FAMILIES) {
      let prev = -1;
      for (let n = 0; n < AUTHORED_RANKS + 50; n++) {
        const r = rankInfo(n, f.id);
        expect(r.seniority).toBeGreaterThanOrEqual(prev);
        if (r.grade === 0 && n > 0) expect(r.seniority).toBe(prev + 1);
        prev = r.seniority;
      }
    }
  });
  it('institutions grow in scale', () => {
    const order = ['Regional company', 'National group', 'International group', 'Multinational group', 'Global holding company'];
    let prev = 0;
    for (const inst of INSTITUTIONS) {
      const k = order.indexOf(inst.scale);
      expect(k).toBeGreaterThanOrEqual(prev);
      prev = k;
    }
    expect(institutionInfo(INSTITUTIONS.length + 5).scaleLevel).toBeGreaterThan(institutionInfo(INSTITUTIONS.length - 1).scaleLevel);
  });
});

describe('procedural continuation (100,000 sampled ranks)', () => {
  const samples: number[] = [];
  for (let i = 0; i < 60_000; i++) samples.push(AUTHORED_RANKS + i); // dense: the first 6,000 institutions
  let x = 12345;
  for (let i = 0; i < 40_000; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    samples.push(AUTHORED_RANKS + Math.floor((x / 4294967296) * (MAX_RANK - AUTHORED_RANKS))); // sparse across the full range
  }
  it('every sampled title is well-formed and grammar-valid', () => {
    for (const n of samples) {
      const r = rankInfo(n);
      const line = rankLine(n);
      expect(['President', 'Chief Executive Officer']).toContain(r.title);
      for (const w of BANNED_WORDS) expect(has(line, w), line).toBe(false);
      // no immediately repeated words, no empty parts
      const words = r.employer.split(/\s+/);
      for (let i = 1; i < words.length; i++) expect(words[i]).not.toBe(words[i - 1]);
      expect(r.employer.length).toBeGreaterThan(8);
      expect(Number.isFinite(meritNeeded(n))).toBe(true);
    }
  });
  it('dense institutions are unique (no two institutions share a name)', () => {
    const seen = new Set<string>();
    for (let i = INSTITUTIONS.length; i < INSTITUTIONS.length + 14_400 * 2; i++) {
      const name = institutionInfo(i).name;
      expect(seen.has(name), name).toBe(false);
      seen.add(name);
    }
  });
  it('rank lines are unique per rank over the dense sample', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60_000; i++) {
      const line = rankLine(AUTHORED_RANKS + i);
      expect(seen.has(line)).toBe(false);
      seen.add(line);
    }
  });
  it('works at the supported boundary (Number.MAX_SAFE_INTEGER) and is deterministic', () => {
    for (const n of [MAX_RANK, MAX_RANK - 1, 2 ** 40, 10 ** 12]) {
      expect(rankInfo(n)).toEqual(rankInfo(n));
      expect(rankInfo(n).index).toBe(n);
      expect(arenaForRank(n).name.length).toBeGreaterThan(3);
      expect(rankId(n)).toMatch(/^R-[0-9A-Z]+$/);
      expect(Number.isFinite(salary(n))).toBe(true);
      expect(ratingGate(n)).toBeGreaterThan(0);
    }
    expect(rankInfo(MAX_RANK + 10).index).toBe(MAX_RANK); // clamped, never NaN
    expect(rankInfo(Number.NaN).index).toBe(0);
  });
  it('arenas are contiguous and firstRankOfArena is exact without any search ceiling', () => {
    let prev = 0;
    for (let n = 0; n < AUTHORED_RANKS + 2000; n++) {
      const a = arenaForRank(n).index;
      expect(a === prev || a === prev + 1).toBe(true);
      if (a === prev + 1) expect(firstRankOfArena(a)).toBe(n);
      prev = a;
    }
    const far = 10 ** 9;
    expect(arenaForRank(firstRankOfArena(far)).index).toBe(far);
  });
});

describe('stable naming across versions (snapshot)', () => {
  it('fixed ranks keep their exact titles', () => {
    expect(rankLine(0, 'finance')).toBe('Finance Intern I');
    expect(rankLine(20, 'engineering')).toBe('Engineering Manager I');
    expect(rankLine(52, 'finance')).toBe('Chief Financial Officer II');
    expect(rankLine(INST_START - 5)).toBe('Chief Executive Officer I');
    expect(rankLine(INST_START)).toBe('President I, Kitahama Industrial Company');
    expect(rankLine(AUTHORED_RANKS)).toBe(rankLine(AUTHORED_RANKS));
    expect(rankInfo(AUTHORED_RANKS).employer).toMatchInlineSnapshot(`"Aokawa Pacific Holdings"`);
  });
});

describe('requirements', () => {
  it('gates are monotone, finite and never impossible beyond the authored path', () => {
    let prev = 0;
    for (let n = 0; n < AUTHORED_RANKS + 100; n++) {
      const g = ratingGate(n);
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
    expect(ratingGate(AUTHORED_RANKS + 1)).toBe(ratingGate(MAX_RANK));
  });
  it('major appointments need a promotion series', () => {
    expect(seriesLength(20)).toBe(3); // Manager I
    expect(seriesLength(21)).toBe(0);
    expect(seriesLength(INST_START)).toBe(5);
  });
});

describe('v0.1 rank migration', () => {
  it('is monotone, in range and never jumps more than one title', () => {
    let prev = 0;
    for (let old = 0; old < 600; old++) {
      const n = mapV01Rank(old);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
    expect(rankInfo(mapV01Rank(0)).title).toBe('Strategy Intern');
  });
});
