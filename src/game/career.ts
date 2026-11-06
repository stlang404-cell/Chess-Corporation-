/**
 * The corporate ladder: authored titles × grades, then a deterministic,
 * unbounded procedural continuation. A rank is identified by a single integer
 * index n ≥ 0 and everything about it (name, arena, requirements, salary) is a
 * pure function of n, so ranks have stable identities forever.
 */

export interface TitleDef {
  name: string;
  grades: number;
  /** promotion INTO this title requires a promotion series */
  major?: boolean;
}

export const TITLES: TitleDef[] = [
  { name: 'Intern', grades: 3 },
  { name: 'Trainee', grades: 3 },
  { name: 'Clerk', grades: 3 },
  { name: 'Senior Clerk', grades: 3 },
  { name: 'Assistant', grades: 3 },
  { name: 'Junior Associate', grades: 3 },
  { name: 'Associate', grades: 3 },
  { name: 'Senior Associate', grades: 3 },
  { name: 'Analyst', grades: 3 },
  { name: 'Senior Analyst', grades: 3 },
  { name: 'Specialist', grades: 4 },
  { name: 'Senior Specialist', grades: 4 },
  { name: 'Team Lead', grades: 4 },
  { name: 'Supervisor', grades: 4, major: true },
  { name: 'Senior Supervisor', grades: 4 },
  { name: 'Assistant Manager', grades: 4 },
  { name: 'Manager', grades: 4, major: true },
  { name: 'Senior Manager', grades: 4 },
  { name: 'Principal', grades: 4 },
  { name: 'Group Manager', grades: 4 },
  { name: 'Associate Director', grades: 4 },
  { name: 'Director', grades: 4, major: true },
  { name: 'Senior Director', grades: 4 },
  { name: 'Executive Director', grades: 4 },
  { name: 'Managing Director', grades: 4, major: true },
  { name: 'Assistant Vice President', grades: 5 },
  { name: 'Vice President', grades: 5, major: true },
  { name: 'Senior Vice President', grades: 5 },
  { name: 'Executive Vice President', grades: 5, major: true },
  { name: 'Group Vice President', grades: 5 },
  { name: 'Chief of Staff', grades: 5 },
  { name: 'Chief Strategy Officer', grades: 5, major: true },
  { name: 'Chief Operating Officer', grades: 5, major: true },
  { name: 'Deputy President', grades: 5 },
  { name: 'President', grades: 5, major: true },
  { name: 'Chief Executive Officer', grades: 5, major: true },
  { name: 'Vice Chairman', grades: 5, major: true },
  { name: 'Chairman', grades: 5, major: true },
  { name: 'Executive Chairman', grades: 5, major: true },
  { name: 'Group Chairman', grades: 5, major: true },
  { name: 'Board Trustee', grades: 5, major: true },
  { name: 'Senior Trustee', grades: 5, major: true },
  { name: 'Governor', grades: 5, major: true },
  { name: 'Senior Governor', grades: 5, major: true },
  { name: 'Chancellor', grades: 5, major: true },
  { name: 'Grand Chancellor', grades: 5, major: true },
  { name: 'Regent', grades: 5, major: true },
  { name: 'High Regent', grades: 5, major: true },
  { name: "Founder's Council", grades: 5, major: true },
  { name: 'Elder of the House', grades: 5, major: true },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export function roman(n: number): string {
  const v = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const s = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let out = '';
  for (let i = 0; i < v.length; i++) while (n >= v[i]) {
    out += s[i];
    n -= v[i];
  }
  return out;
}

// rank index → (title, grade) for the authored section
const AUTHORED: { title: number; grade: number }[] = [];
TITLES.forEach((t, ti) => {
  for (let g = 0; g < t.grades; g++) AUTHORED.push({ title: ti, grade: g });
});
export const AUTHORED_RANKS = AUTHORED.length;

// ---------- procedural continuation ----------
// Beyond the authored ladder: Offices within Jurisdictions within prestige Orders.
// Each procedural "title" has 5 grades; the title sequence is a mixed-radix count
// so names never repeat, and every 5th (*seal*) cycle adds a roman Seal number.
export const OFFICES = ['Steward', 'Trustee', 'Governor', 'Chancellor', 'Regent', 'Elder'];
export const JURISDICTIONS = [
  'Kyoto', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Sendai', 'Kobe', 'Nara', 'Kanazawa', 'Hiroshima',
  'Singapore', 'Seoul', 'Mumbai', 'Lagos', 'Nairobi', 'Cairo', 'Istanbul', 'Vienna', 'Zürich', 'London',
  'Lisbon', 'Madrid', 'Paris', 'Oslo', 'Toronto', 'New York', 'Mexico City', 'São Paulo', 'Buenos Aires', 'Sydney',
];
export const ORDERS = [
  'Pine', 'Bamboo', 'Plum', 'Crane', 'Chrysanthemum', 'Wisteria', 'Paulownia', 'Cedar', 'Heron', 'Moon', 'Mountain', 'Tide',
];
export const PROC_GRADES = 5;

export interface RankInfo {
  index: number;
  title: string;
  grade: number; // 0-based
  gradeLabel: string;
  full: string;
  /** index of the title in the global title sequence (authored then procedural) */
  titleIndex: number;
  /** first grade of a major title */
  majorEntry: boolean;
  procedural: boolean;
}

export function titleCount() {
  return TITLES.length;
}

export function procTitleName(k: number): string {
  // k = 0,1,2,... procedural title number
  const o = k % OFFICES.length;
  const j = Math.floor(k / OFFICES.length) % JURISDICTIONS.length;
  const ord = Math.floor(k / (OFFICES.length * JURISDICTIONS.length)) % ORDERS.length;
  const seal = Math.floor(k / (OFFICES.length * JURISDICTIONS.length * ORDERS.length));
  return `${OFFICES[o]} of ${JURISDICTIONS[j]}, Order of the ${ORDERS[ord]}${seal ? ` · Seal ${roman(seal + 1)}` : ''}`;
}

export function rankInfo(n: number): RankInfo {
  if (n < AUTHORED_RANKS) {
    const a = AUTHORED[n];
    const t = TITLES[a.title];
    const gl = ROMAN[a.grade];
    return {
      index: n,
      title: t.name,
      grade: a.grade,
      gradeLabel: gl,
      full: `${t.name} ${gl}`,
      titleIndex: a.title,
      majorEntry: a.grade === 0 && !!t.major,
      procedural: false,
    };
  }
  const k = n - AUTHORED_RANKS;
  const pt = Math.floor(k / PROC_GRADES);
  const g = k % PROC_GRADES;
  const title = procTitleName(pt);
  return {
    index: n,
    title,
    grade: g,
    gradeLabel: ROMAN[g],
    full: `${title} — ${ROMAN[g]}`,
    titleIndex: TITLES.length + pt,
    majorEntry: g === 0,
    procedural: true,
  };
}

// ---------- requirements ----------
/** Merit needed to complete rank n (and become eligible for n+1). */
export function meritNeeded(n: number): number {
  return Math.round(50 + 6 * Math.pow(n, 0.8));
}

/**
 * Minimum rating required to be promoted INTO rank n. Defined per title so all
 * grades of one title share the gate (grades are pure merit/tenure progress).
 * The curve tops out at MASTERY_GATE, a level only the strongest calibrated
 * tiers reach; beyond it, procedural ranks keep the mastery gate plus series.
 */
export const MASTERY_GATE = 1950;
export function ratingGate(n: number): number {
  const ti = rankInfo(n).titleIndex;
  if (ti <= 5) return 0;
  if (ti >= TITLES.length) return MASTERY_GATE;
  // smooth curve from 450 (title 6) to MASTERY_GATE (last authored title)
  const x = (ti - 6) / (TITLES.length - 1 - 6);
  return Math.round(450 + (MASTERY_GATE - 450) * Math.pow(x, 1.15));
}

/** Promotion series length (best of N) required to enter rank n, 0 if none. */
export function seriesLength(n: number): number {
  const r = rankInfo(n);
  if (!r.majorEntry) return 0;
  return r.titleIndex >= 34 ? 5 : 3;
}

/** Base match salary for a player at rank n (sublinear growth to avoid inflation). */
export function salary(n: number): number {
  return Math.round(100 * Math.sqrt(1 + n));
}

// ---------- arenas ----------
export const MOTIFS = ['plain', 'seigaiha', 'asanoha', 'kikko', 'shippo', 'ichimatsu', 'uroko', 'yagasuri'] as const;
export type Motif = (typeof MOTIFS)[number];

export interface ArenaDef {
  index: number;
  name: string;
  kanji: string;
  /** first and last title indices covered (inclusive) */
  firstTitle: number;
  lastTitle: number;
  accent: string;
  motif: Motif;
  procedural: boolean;
}

const AUTHORED_ARENAS: Omit<ArenaDef, 'index' | 'procedural'>[] = [
  { name: 'Mailroom Annex', kanji: '始', firstTitle: 0, lastTitle: 2, accent: '#8a8478', motif: 'plain' },
  { name: 'Copy Floor', kanji: '写', firstTitle: 3, lastTitle: 5, accent: '#6f7d74', motif: 'ichimatsu' },
  { name: 'Ginza Branch', kanji: '銀', firstTitle: 6, lastTitle: 8, accent: '#5b7083', motif: 'seigaiha' },
  { name: "Analysts' Gallery", kanji: '析', firstTitle: 9, lastTitle: 11, accent: '#7a6a55', motif: 'shippo' },
  { name: 'Marunouchi Tower', kanji: '塔', firstTitle: 12, lastTitle: 14, accent: '#4f5d6b', motif: 'kikko' },
  { name: "Managers' Garden", kanji: '庭', firstTitle: 15, lastTitle: 17, accent: '#5f7259', motif: 'asanoha' },
  { name: 'Shinjuku Exchange', kanji: '市', firstTitle: 18, lastTitle: 20, accent: '#6b5b73', motif: 'uroko' },
  { name: "Directors' Pavilion", kanji: '館', firstTitle: 21, lastTitle: 23, accent: '#8c6a3c', motif: 'yagasuri' },
  { name: 'Nihonbashi Hall', kanji: '橋', firstTitle: 24, lastTitle: 26, accent: '#3f5a5a', motif: 'seigaiha' },
  { name: 'Vermilion Boardroom', kanji: '朱', firstTitle: 27, lastTitle: 29, accent: '#a8412e', motif: 'kikko' },
  { name: "Chiefs' Teahouse", kanji: '茶', firstTitle: 30, lastTitle: 32, accent: '#5d6b3f', motif: 'asanoha' },
  { name: 'Presidential Suite', kanji: '社', firstTitle: 33, lastTitle: 34, accent: '#2f3b4c', motif: 'shippo' },
  { name: 'Imperial Summit', kanji: '峰', firstTitle: 35, lastTitle: 36, accent: '#8a6d2f', motif: 'uroko' },
  { name: "Chairman's Court", kanji: '会', firstTitle: 37, lastTitle: 39, accent: '#9b3b2a', motif: 'yagasuri' },
  { name: "Trustees' Archive", kanji: '蔵', firstTitle: 40, lastTitle: 42, accent: '#4b4f56', motif: 'ichimatsu' },
  { name: 'Moon Hall of Governors', kanji: '月', firstTitle: 43, lastTitle: 44, accent: '#6d6a8a', motif: 'seigaiha' },
  { name: 'Chancery of Pines', kanji: '松', firstTitle: 45, lastTitle: 47, accent: '#35553f', motif: 'asanoha' },
  { name: 'House of Elders', kanji: '院', firstTitle: 48, lastTitle: 49, accent: '#b08d3c', motif: 'kikko' },
];
export const AUTHORED_ARENA_COUNT = AUTHORED_ARENAS.length;
/** procedural arenas each cover this many procedural titles */
const PROC_ARENA_TITLES = 3;
const PROC_VENUES = ['Hall', 'Pavilion', 'Tower', 'Court', 'Garden', 'Exchange', 'Archive', 'Observatory'];
const PROC_KANJI = ['雲', '風', '雪', '花', '海', '山', '星', '光', '竹', '鶴', '波', '石'];

function hash32(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}

export function arenaInfo(i: number): ArenaDef {
  if (i < AUTHORED_ARENAS.length) return { ...AUTHORED_ARENAS[i], index: i, procedural: false };
  const k = i - AUTHORED_ARENAS.length;
  const firstTitle = TITLES.length + k * PROC_ARENA_TITLES;
  const h = hash32(i * 7919 + 17);
  const j = JURISDICTIONS[k % JURISDICTIONS.length];
  const venue = PROC_VENUES[Math.floor(k / JURISDICTIONS.length) % PROC_VENUES.length];
  const cycle = Math.floor(k / (JURISDICTIONS.length * PROC_VENUES.length));
  const hue = h % 360;
  // muted, ink-compatible accent: low saturation, mid-low lightness
  const accent = `hsl(${hue} ${18 + (h >> 9) % 14}% ${32 + (h >> 13) % 12}%)`;
  return {
    index: i,
    name: `${j} ${venue}${cycle ? ' ' + roman(cycle + 1) : ''}`,
    kanji: PROC_KANJI[k % PROC_KANJI.length],
    firstTitle,
    lastTitle: firstTitle + PROC_ARENA_TITLES - 1,
    accent,
    motif: MOTIFS[1 + ((h >> 5) % (MOTIFS.length - 1))],
    procedural: true,
  };
}

export function arenaForRank(n: number): ArenaDef {
  const ti = rankInfo(n).titleIndex;
  if (ti < TITLES.length) {
    const i = AUTHORED_ARENAS.findIndex((a) => ti >= a.firstTitle && ti <= a.lastTitle);
    return arenaInfo(i);
  }
  return arenaInfo(AUTHORED_ARENAS.length + Math.floor((ti - TITLES.length) / PROC_ARENA_TITLES));
}

/** First rank index whose title index is ti. */
export function firstRankOfTitle(ti: number): number {
  if (ti < TITLES.length) return AUTHORED.findIndex((a) => a.title === ti);
  return AUTHORED_RANKS + (ti - TITLES.length) * PROC_GRADES;
}

// ---------- merit ----------
/** Merit change for a rated result given expected score E (0..1). */
export function meritDelta(score: number, E: number): number {
  if (score === 1) return Math.round(24 + 16 * (1 - E));
  if (score === 0.5) return Math.round(6 + 12 * (0.5 - E) + 6);
  return -Math.round(6 + 12 * E);
}
