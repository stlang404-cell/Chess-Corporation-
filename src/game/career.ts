/**
 * SEVEN v0.2 career ladder.
 *
 * A player's position is a single safe integer `rank` (0, 1, 2, …). Everything
 * about a rank — its title, grade, scope, employer, arena, requirements and
 * salary — is a pure function of (rank, job family), so ranks have stable
 * identities forever. Layout of the authored path:
 *
 *   ranks 0–55     functional ladder in the chosen job family (14 titles, 56 grades)
 *   ranks 56–75    general management at the home company (4 titles × 5 grades)
 *   ranks 76–535   46 authored institutions, President then CEO of each (× 5 grades)
 *   ranks 536+     procedurally generated institutions, President then CEO, forever
 *
 * Supported range: 0 ≤ rank ≤ Number.MAX_SAFE_INTEGER (tested at the boundary);
 * at ≈ one promotion per match this is ~9 quadrillion matches.
 */
import { CALIBRATION } from '../engine/calibration';
import {
  STEPS,
  FAMILIES,
  GM_TITLES,
  GM_GRADES,
  HOME_COMPANY,
  INSTITUTIONS,
  INSTITUTION_OFFICES,
  OFFICE_GRADES,
  PROC_ROOTS,
  PROC_REGIONS,
  PROC_TYPES,
  PROC_CITIES,
  PROC_HQ,
  STAGE_ARENAS,
  INSTITUTION_KANJI,
  MOTIFS,
  familyById,
  DEFAULT_FAMILY,
  type Scope,
  type Motif,
  type ScaleClass,
} from './careerData';

export { MOTIFS, type Motif };

export const MAX_RANK = Number.MAX_SAFE_INTEGER;
export const clampRank = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(MAX_RANK, Math.floor(n))) : 0);

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

// ---------- authored layout ----------
const FUNCTIONAL: { step: number; grade: number }[] = [];
STEPS.forEach((s, i) => {
  for (let g = 0; g < s.grades; g++) FUNCTIONAL.push({ step: i, grade: g });
});
export const FUNCTIONAL_RANKS = FUNCTIONAL.length; // 56
export const GM_START = FUNCTIONAL_RANKS;
export const GM_RANKS = GM_TITLES.length * GM_GRADES; // 20
export const INST_START = GM_START + GM_RANKS; // 76
export const RANKS_PER_INSTITUTION = INSTITUTION_OFFICES.length * OFFICE_GRADES; // 10
export const AUTHORED_RANKS = INST_START + INSTITUTIONS.length * RANKS_PER_INSTITUTION; // 536

/** Number of distinct authored job titles (across all families + general management). */
export function authoredTitleCount(): number {
  const set = new Set<string>();
  for (const f of FAMILIES) f.titles.forEach((t) => set.add(t));
  GM_TITLES.forEach((t) => set.add(t.title));
  INSTITUTION_OFFICES.forEach((t) => set.add(t));
  return set.size;
}
/** Number of authored career grades supported (all families' ladders + management + institutions). */
export function authoredGradeCount(): number {
  return FAMILIES.length * FUNCTIONAL_RANKS + GM_RANKS + INSTITUTIONS.length * RANKS_PER_INSTITUTION;
}

// ---------- institutions ----------
export interface InstitutionInfo {
  index: number;
  name: string;
  city: string;
  hq: string;
  scale: ScaleClass | 'Global holding network';
  /** enterprise scale number: every institution is larger than the one before */
  scaleLevel: number;
  procedural: boolean;
}

function coprimeStride(n: number, prefer: number) {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  let s = prefer;
  while (gcd(s, n) !== 1) s++;
  return s;
}
const COMBOS = PROC_ROOTS.length * PROC_REGIONS.length * PROC_TYPES.length; // 14,400
const STRIDE = coprimeStride(COMBOS, 7919);

export function institutionInfo(iIn: number): InstitutionInfo {
  const i = clampRank(iIn);
  if (i < INSTITUTIONS.length) {
    const d = INSTITUTIONS[i];
    return { index: i, name: d.name, city: d.city, hq: d.hq, scale: d.scale, scaleLevel: i + 1, procedural: false };
  }
  const k = i - INSTITUTIONS.length;
  const cycle = Math.floor(k / COMBOS);
  // multiply in two steps so the product stays a safe integer for any k
  const x = ((k % COMBOS) * STRIDE) % COMBOS;
  const root = PROC_ROOTS[x % PROC_ROOTS.length];
  const region = PROC_REGIONS[Math.floor(x / PROC_ROOTS.length) % PROC_REGIONS.length];
  const type = PROC_TYPES[Math.floor(x / (PROC_ROOTS.length * PROC_REGIONS.length)) % PROC_TYPES.length];
  const city = PROC_CITIES[((k % 30) + (cycle % 30) * 7) % PROC_CITIES.length];
  const name = `${root} ${region} ${type}` + (cycle ? ` (charter ${(cycle + 1).toLocaleString('en-US')})` : '');
  return { index: i, name, city, hq: `${root} ${PROC_HQ[k % PROC_HQ.length]}`, scale: 'Global holding network', scaleLevel: i + 1, procedural: true };
}

// ---------- ranks ----------
export type Stage = 'functional' | 'management' | 'institution';

export interface RankInfo {
  index: number;
  id: string;
  stage: Stage;
  title: string;
  grade: number;
  gradeLabel: string;
  /** title + grade, e.g. "Finance Manager II" */
  full: string;
  employer: string;
  scope: Scope;
  /** unit / organisation of the appointment */
  appointment: string;
  /** ordered responsibility level */
  seniority: number;
  titleIndex: number;
  majorEntry: boolean;
  procedural: boolean;
  family: string;
}

export const rankId = (n: number) => 'R-' + clampRank(n).toString(36).toUpperCase();

export function rankInfo(nIn: number, familyId: string = DEFAULT_FAMILY): RankInfo {
  const n = clampRank(nIn);
  const fam = familyById(familyId);
  if (n < FUNCTIONAL_RANKS) {
    const { step, grade } = FUNCTIONAL[n];
    const title = fam.titles[step];
    const scope = STEPS[step].scope;
    const unit =
      scope === 'Team'
        ? `${fam.name} team`
        : scope === 'Department'
          ? `${fam.name} Department`
          : scope === 'Division'
            ? `${fam.name} Division`
            : scope === 'Business unit'
              ? `${fam.name} business unit`
              : 'Company-wide';
    return {
      index: n,
      id: rankId(n),
      stage: 'functional',
      title,
      grade,
      gradeLabel: ROMAN[grade],
      full: `${title} ${ROMAN[grade]}`,
      employer: HOME_COMPANY.name,
      scope,
      appointment: `${unit} · ${HOME_COMPANY.name}`,
      seniority: step,
      titleIndex: step,
      majorEntry: grade === 0 && !!STEPS[step].major,
      procedural: false,
      family: fam.id,
    };
  }
  if (n < INST_START) {
    const k = n - GM_START;
    const t = Math.floor(k / GM_GRADES);
    const grade = k % GM_GRADES;
    const gm = GM_TITLES[t];
    return {
      index: n,
      id: rankId(n),
      stage: 'management',
      title: gm.title,
      grade,
      gradeLabel: ROMAN[grade],
      full: `${gm.title} ${ROMAN[grade]}`,
      employer: HOME_COMPANY.name,
      scope: gm.scope,
      appointment: HOME_COMPANY.name,
      seniority: STEPS.length + t,
      titleIndex: STEPS.length + t,
      majorEntry: grade === 0,
      procedural: false,
      family: fam.id,
    };
  }
  const k = n - INST_START;
  const inst = Math.floor(k / RANKS_PER_INSTITUTION);
  const within = k % RANKS_PER_INSTITUTION;
  const office = Math.floor(within / OFFICE_GRADES);
  const grade = within % OFFICE_GRADES;
  const info = institutionInfo(inst);
  const title = INSTITUTION_OFFICES[office];
  const ti = STEPS.length + GM_TITLES.length + inst * 2 + office;
  return {
    index: n,
    id: rankId(n),
    stage: 'institution',
    title,
    grade,
    gradeLabel: ROMAN[grade],
    full: `${title} ${ROMAN[grade]}`,
    employer: info.name,
    scope: 'Enterprise',
    appointment: `${info.name} · enterprise scale ${info.scaleLevel.toLocaleString('en-US')}`,
    seniority: ti,
    titleIndex: ti,
    majorEntry: grade === 0,
    procedural: info.procedural,
    family: fam.id,
  };
}

/** One-line title: "Finance Manager II" or "Chief Executive Officer II, Kitahama Industrial Company". */
export function rankLine(n: number, familyId?: string): string {
  const r = rankInfo(n, familyId);
  return r.stage === 'institution' ? `${r.full}, ${r.employer}` : r.full;
}

/** First rank holding title index ti (closed form). */
export function firstRankOfTitle(ti: number): number {
  ti = clampRank(ti);
  if (ti < STEPS.length) return FUNCTIONAL.findIndex((f) => f.step === ti);
  if (ti < STEPS.length + GM_TITLES.length) return GM_START + (ti - STEPS.length) * GM_GRADES;
  const k = ti - STEPS.length - GM_TITLES.length;
  return Math.min(MAX_RANK, INST_START + Math.floor(k / 2) * RANKS_PER_INSTITUTION + (k % 2) * OFFICE_GRADES);
}

// ---------- arenas ----------
export interface ArenaDef {
  index: number;
  name: string;
  kanji: string;
  accent: string;
  motif: Motif;
  procedural: boolean;
  firstRank: number;
  institution?: string;
  city?: string;
}

export const STAGE_ARENA_COUNT = STAGE_ARENAS.length; // 18
export const AUTHORED_ARENA_COUNT = STAGE_ARENA_COUNT + INSTITUTIONS.length; // 64

function hash32(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}
const ACCENTS = ['#8a8478', '#5b7083', '#7a6a55', '#4f5d6b', '#5f7259', '#6b5b73', '#8c6a3c', '#3f5a5a', '#a8412e', '#5d6b3f', '#2f3b4c', '#8a6d2f', '#9b3b2a', '#4b4f56', '#6d6a8a', '#35553f', '#b08d3c'];

export function arenaInfo(iIn: number): ArenaDef {
  const i = clampRank(iIn);
  if (i < STAGE_ARENA_COUNT) {
    const a = STAGE_ARENAS[i];
    const firstRank = i < STEPS.length ? FUNCTIONAL.findIndex((f) => f.step === i) : GM_START + (i - STEPS.length) * GM_GRADES;
    return { index: i, ...a, procedural: false, firstRank };
  }
  const inst = i - STAGE_ARENA_COUNT;
  const info = institutionInfo(inst);
  const h = hash32(inst % 2147483647);
  return {
    index: i,
    name: info.procedural ? `${info.name}, ${info.city}` : `${info.hq}, ${info.city}`,
    kanji: inst < INSTITUTIONS.length ? INSTITUTION_KANJI[inst % INSTITUTION_KANJI.length] : INSTITUTION_KANJI[h % INSTITUTION_KANJI.length],
    accent: ACCENTS[(inst % 1000003) * 5 % ACCENTS.length],
    motif: MOTIFS[1 + (h % (MOTIFS.length - 1))],
    procedural: info.procedural,
    firstRank: Math.min(MAX_RANK, INST_START + inst * RANKS_PER_INSTITUTION),
    institution: info.name,
    city: info.city,
  };
}

export function arenaForRank(nIn: number): ArenaDef {
  const n = clampRank(nIn);
  if (n < FUNCTIONAL_RANKS) return arenaInfo(FUNCTIONAL[n].step);
  if (n < INST_START) return arenaInfo(STEPS.length + Math.floor((n - GM_START) / GM_GRADES));
  return arenaInfo(STAGE_ARENA_COUNT + Math.floor((n - INST_START) / RANKS_PER_INSTITUTION));
}

/** First rank of arena i — closed form, no search ceiling. */
export function firstRankOfArena(i: number): number {
  return arenaInfo(i).firstRank;
}

// ---------- requirements ----------
/** Merit needed to complete rank n (sublinear growth). */
export function meritNeeded(nIn: number): number {
  return Math.round(50 + 6 * Math.pow(clampRank(nIn), 0.8));
}

// Gates follow the MEASURED bot scale (src/engine/calibration.ts).
const TR = CALIBRATION.tierRatings;
export const GATE_LOW = Math.round((TR[3] ?? 700) / 10) * 10;
export const MASTERY_GATE = Math.round((TR[TR.length - 1] - 200) / 10) * 10;

/**
 * Minimum rating to be promoted INTO rank n, shared by all grades of a title:
 * none for the first five steps, a smooth curve to the mastery gate across the
 * authored path, then the mastery gate.
 */
export function ratingGate(nIn: number): number {
  const n = clampRank(nIn);
  const r = rankInfo(n);
  if (r.stage === 'functional' && r.seniority < 5) return 0;
  if (n >= AUTHORED_RANKS) return MASTERY_GATE;
  const first = firstRankOfTitle(r.titleIndex);
  const lo = firstRankOfTitle(5);
  const x = (first - lo) / (AUTHORED_RANKS - lo);
  return Math.round((GATE_LOW + (MASTERY_GATE - GATE_LOW) * Math.pow(x, 0.9)) / 10) * 10;
}

/** Promotion series length (best of N) to enter rank n, 0 if none. */
export function seriesLength(nIn: number): number {
  const r = rankInfo(clampRank(nIn));
  if (!r.majorEntry) return 0;
  return r.seniority >= 13 ? 5 : 3;
}

/** Base match salary at rank n — sublinear so dollars do not inflate without bound. */
export function salary(nIn: number): number {
  return Math.round(60 * Math.sqrt(1 + clampRank(nIn)));
}

/** Merit change for a rated result given expected score E. */
export function meritDelta(score: number, E: number): number {
  if (score === 1) return Math.round(24 + 16 * (1 - E));
  if (score === 0.5) return Math.round(6 + 12 * (0.5 - E) + 6);
  return -Math.round(6 + 12 * E);
}

/** Fast-track multiplier (1–3×) for players clearly above the next gate. */
export function fastTrack(rating: number, rank: number): number {
  const gate = ratingGate(rank + 1);
  return Math.max(1, Math.min(3, 1 + (rating - gate - 100) / 250));
}

export { FAMILIES, STEPS, GM_TITLES, INSTITUTIONS, HOME_COMPANY, familyById, DEFAULT_FAMILY };
