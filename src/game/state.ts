import type { Rating } from './rating';
import { START_RATING } from './rating';
import { migrateCareerV1 } from './migrateV1';
import type { StyleId } from '../engine/ai';
import type { Termination } from '../engine/game';
import type { ReviewSummary } from '../engine/analysis';
import type { Contract } from './contracts';

export const SAVE_VERSION = 3;

export type MatchKind = 'ranked' | 'series' | 'cup' | 'casual' | 'training';
export const isRatedKind = (k: MatchKind) => k === 'ranked' || k === 'series' || k === 'cup';
export const CUP_ROUNDS = 3;
export const CUP_EVERY = 15;

export interface OpponentSpec {
  id: number;
  tier: number;
  style: StyleId;
  rating: number;
  rd: number;
  name: string;
  rival?: boolean;
  /** unrated maximum-strength challenge: top tier, larger budget, longer thinks */
  maxStrength?: boolean;
}

export interface TimeControl {
  id: string;
  label: string;
  baseMs: number;
  incMs: number;
}
/** 'untimed' is the default for every match type: no clock, no timeout, ever. */
export const UNTIMED = 'untimed';
export const TIME_CONTROLS: TimeControl[] = [
  { id: UNTIMED, label: 'Untimed', baseMs: 0, incMs: 0 },
  { id: '5+3', label: 'Standard 5+3', baseMs: 5 * 60_000, incMs: 3000 },
  { id: '3+2', label: 'Brisk 3+2', baseMs: 3 * 60_000, incMs: 2000 },
  { id: '10+5', label: 'Classical 10+5', baseMs: 10 * 60_000, incMs: 5000 },
];

/** In-progress game, persisted after every move so a reload resumes it. */
export interface ActiveMatch {
  id: string;
  kind: MatchKind;
  opponent: OpponentSpec;
  playerColor: 0 | 1;
  moves: string[];
  /** ms remaining [white, black]; null = untimed (never interpreted as zero) */
  clocks: [number, number] | null;
  tc: string;
  startedAt: number;
  seed: number;
  /** set when the game is over but not yet settled */
  finished?: { score: 0 | 0.5 | 1; termination: Termination; endedAt: number; accuracy?: number; review?: CompactReview };
  drawOffers: number;
  undos: number;
}

export interface CompactReview {
  standard: string;
  summary: ReviewSummary;
  q: string;
  e: number[];
  b: string[];
  w: number[];
}
export const Q_CODE: Record<string, string> = { brilliant: 'B', great: 'G', best: '*', excellent: 'E', good: 'g', inaccuracy: 'i', mistake: 'm', blunder: 'b' };
export const Q_NAME: Record<string, string> = Object.fromEntries(Object.entries(Q_CODE).map(([k, v]) => [v, k]));

export interface MatchSummary {
  id: string;
  kind: MatchKind;
  at: number;
  oppId: number;
  oppName: string;
  oppRating: number;
  oppStyle: StyleId;
  color: 0 | 1;
  score: 0 | 0.5 | 1;
  termination: Termination;
  ratingAfter: number;
  ratingDelta: number;
  dollars: number;
  arena: number;
  moves: string[];
  accuracy?: number;
  /** compact engine review (standard rev-3): q = quality codes per ply, e = eval (white, cp), b = best SAN, w = [winBefore, winAfter] per ply */
  review?: CompactReview;
  /** payout formula used when this match was settled */
  payFormula?: string;
}

export interface WLD {
  g: number;
  w: number;
  d: number;
  l: number;
}
export const emptyWLD = (): WLD => ({ g: 0, w: 0, d: 0, l: 0 });

export interface SeriesState {
  targetRank: number;
  length: number; // best of N
  wins: number; // points (draw = 0.5)
  games: number;
}

export interface SaveData {
  version: number;
  createdAt: number;
  profile: { name: string };
  rating: Rating;
  peakRating: number;
  career: {
    rank: number;
    merit: number;
    probation: number;
    highestRank: number;
    series: SeriesState | null;
    /** promotions with the title text recorded at the time — never renamed */
    promotions: { rank: number; at: number; game: number; title?: string }[];
    seriesFailures: number;
    /** job family (cosmetic identity choice; never affects play) */
    family: string;
    /** v0.1 position at migration time, kept verbatim */
    legacy?: { rank: number; title: string; highest: string };
  };
  /** honours: distinctions separate from job titles (cups, board seats, seals) */
  honors: { id: string; name: string; at: number; kind: 'cup' | 'board' | 'service' | 'season' | 'distinction' }[];
  contracts: { active: Contract[]; issued: number; completed: number };
  records: {
    bestAccuracy: RecordEntry | null;
    biggestUpset: RecordEntry | null;
    largestPaycheck: RecordEntry | null;
    fastestMate: RecordEntry | null;
    bestGame: RecordEntry | null;
  };
  finance: { matchEarnings: number; promotionBonuses: number; prizes: number; achievementRewards: number; bestMatch: number; purchases: number };
  wallet: { balance: number; lifetime: number; spent: number };
  stats: {
    games: number;
    rated: WLD;
    streak: number; // +n wins / -n losses (draws reset)
    bestStreak: number;
    byArena: Record<string, WLD>;
    byStyle: Record<string, WLD>;
    ratingHistory: number[];
    upsets: number;
    checkmates: number;
    bestWinRating: number;
    accuracySum: number;
    accuracyN: number;
    seasons: Record<string, { peak: number; games: number; wins: number }>;
    brilliants: number;
    greats: number;
    defences: number;
    reviewed: number;
  };
  history: MatchSummary[];
  opponents: Record<string, { id: number; tier: number; style: StyleId; name: string; rating: number } & WLD & { last: number }>;
  achievements: Record<string, number>;
  owned: string[];
  equipped: Record<string, string>;
  settings: {
    coordinates: boolean;
    showLegal: boolean;
    animations: boolean;
    sound: boolean;
    tc: string;
    confirmResign: boolean;
    /** AI thinking budget cap: standard ≈4 s, strong ≈10 s per move (strength stays node-calibrated) */
    aiThink: 'standard' | 'strong';
    theme: 'light' | 'dark' | 'auto';
    animSpeed: 'slow' | 'normal' | 'fast' | 'off';
    highContrast: boolean;
    flipBoard: boolean;
    onboarded: boolean;
    /** sound volumes 0–1, adjustable independently */
    moveVolume: number;
    effectsVolume: number;
    dragPieces: boolean;
  };
  settled: string[];
  active: ActiveMatch | null;
  rematch: { oppId: number; count: number } | null;
  lastPlayedAt: number;
  academy: {
    solved: Record<string, number>;
    readChapters: Record<string, number>;
    /** puzzle ladder: a separate rating that never touches the game rating */
    puzzle: { rating: number; rd: number; vol: number; attempts: number; solved: number; streak: number; best: number; done: Record<string, 0 | 1> };
  };
  /** cosmetic headquarters: an unlimited dollar sink, one floor at a time */
  hq: { floors: number };
  /** Arena Cup: a 3-round rated gauntlet; one entry token per CUP_EVERY rated games (max 3) */
  cup: { tokens: number; active: { arena: number; round: number } | null; trophies: { arena: number; at: number }[] };
}

export interface RecordEntry {
  value: number;
  label: string;
  matchId: string;
  at: number;
}

export function newSave(now = Date.now()): SaveData {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    profile: { name: 'You' },
    rating: { ...START_RATING },
    peakRating: START_RATING.r,
    career: { rank: 0, merit: 0, probation: 0, highestRank: 0, series: null, promotions: [], seriesFailures: 0, family: 'strategy' },
    honors: [],
    finance: { matchEarnings: 0, promotionBonuses: 0, prizes: 0, achievementRewards: 0, bestMatch: 0, purchases: 0 },
    wallet: { balance: 0, lifetime: 0, spent: 0 },
    stats: {
      games: 0,
      rated: emptyWLD(),
      streak: 0,
      bestStreak: 0,
      byArena: {},
      byStyle: {},
      ratingHistory: [START_RATING.r],
      upsets: 0,
      checkmates: 0,
      bestWinRating: 0,
      accuracySum: 0,
      accuracyN: 0,
      seasons: {},
      brilliants: 0,
      greats: 0,
      defences: 0,
      reviewed: 0,
    },
    history: [],
    opponents: {},
    achievements: {},
    owned: ['board.ivory', 'pieces.imperial', 'pieces.modern', 'pieces.executive', 'pieces.ink', 'portrait.ink', 'crest.plain', 'frame.none', 'office.plain', 'ceremony.ink', 'entrance.fade'],
    equipped: {
      board: 'board.ivory',
      pieces: 'pieces.imperial',
      portrait: 'portrait.ink',
      crest: 'crest.plain',
      frame: 'frame.none',
      office: 'office.plain',
      ceremony: 'ceremony.ink',
      entrance: 'entrance.fade',
    },
    settings: {
      coordinates: true,
      showLegal: true,
      animations: true,
      sound: false,
      tc: UNTIMED,
      confirmResign: true,
      aiThink: 'standard',
      theme: 'auto',
      animSpeed: 'normal',
      highContrast: false,
      flipBoard: false,
      onboarded: false,
      moveVolume: 0.6,
      effectsVolume: 0.5,
      dragPieces: true,
    },
    settled: [],
    active: null,
    rematch: null,
    lastPlayedAt: 0,
    academy: { solved: {}, readChapters: {}, puzzle: { rating: 1000, rd: 250, vol: 0.06, attempts: 0, solved: 0, streak: 0, best: 0, done: {} } },
    hq: { floors: 0 },
    contracts: { active: [], issued: 0, completed: 0 },
    records: { bestAccuracy: null, biggestUpset: null, largestPaycheck: null, fastestMate: null, bestGame: null },
    cup: { tokens: 0, active: null, trophies: [] },
  };
}

/** Upgrade older saves in place-safe fashion (returns a new object). */
export function migrate(raw: unknown): SaveData {
  const base = newSave();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<SaveData>;
  const fromVersion = typeof s.version === 'number' ? s.version : 1;
  // version 1 is current; fill any missing fields from defaults (forward-compatible)
  const merged: SaveData = {
    ...base,
    ...s,
    career: { ...base.career, ...(s.career ?? {}) },
    wallet: { ...base.wallet, ...(s.wallet ?? {}) },
    stats: { ...base.stats, ...(s.stats ?? {}) },
    settings: { ...base.settings, ...(s.settings ?? {}) },
    equipped: { ...base.equipped, ...(s.equipped ?? {}) },
    academy: { ...base.academy, ...(s.academy ?? {}), puzzle: { ...base.academy.puzzle, ...((s.academy as any)?.puzzle ?? {}) } },
    hq: { ...base.hq, ...(s.hq ?? {}) },
    cup: { ...base.cup, ...(s.cup ?? {}) },
    finance: { ...base.finance, ...(s.finance ?? {}) },
    contracts: { ...base.contracts, ...(s.contracts ?? {}) },
    records: { ...base.records, ...(s.records ?? {}) },
    version: SAVE_VERSION,
  } as SaveData;
  if (!Array.isArray(merged.owned)) merged.owned = base.owned;
  for (const o of base.owned) if (!merged.owned.includes(o)) merged.owned.push(o);
  if (!Array.isArray(merged.settled)) merged.settled = [];
  if (!Array.isArray(merged.history)) merged.history = [];
  if (!Array.isArray(merged.honors)) merged.honors = [];
  if (fromVersion < 3) {
    // v0.3: the Imperial set replaces Ink as the default look (Ink stays owned)
    if (merged.equipped.pieces === 'pieces.ink') merged.equipped.pieces = 'pieces.imperial';
  }
  if (fromVersion < 2) {
    migrateCareerV1(merged);
    // v0.1 → v0.2: untimed becomes the default; a timed game in progress keeps its clocks.
    merged.settings.tc = UNTIMED;
    merged.settings.onboarded = true; // existing players skip the first-run tour
  }
  if (merged.active && merged.active.clocks === undefined) merged.active.clocks = null;
  return merged;
}

export function seasonKey(t: number): string {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
