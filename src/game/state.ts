import type { Rating } from './rating';
import { START_RATING } from './rating';
import type { StyleId } from '../engine/ai';
import type { Termination } from '../engine/game';

export const SAVE_VERSION = 1;

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
}

export interface TimeControl {
  id: string;
  label: string;
  baseMs: number;
  incMs: number;
}
export const TIME_CONTROLS: TimeControl[] = [
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
  clocks: [number, number]; // ms remaining [white, black]
  tc: string;
  startedAt: number;
  seed: number;
  /** set when the game is over but not yet settled */
  finished?: { score: 0 | 0.5 | 1; termination: Termination; endedAt: number; accuracy?: number };
  drawOffers: number;
  undos: number;
}

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
    promotions: { rank: number; at: number; game: number }[];
    seriesFailures: number;
  };
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
  };
  settled: string[];
  active: ActiveMatch | null;
  rematch: { oppId: number; count: number } | null;
  lastPlayedAt: number;
  academy: { solved: Record<string, number>; readChapters: Record<string, number> };
  /** cosmetic headquarters: an unlimited dollar sink, one floor at a time */
  hq: { floors: number };
  /** Arena Cup: a 3-round rated gauntlet; one entry token per CUP_EVERY rated games (max 3) */
  cup: { tokens: number; active: { arena: number; round: number } | null; trophies: { arena: number; at: number }[] };
}

export function newSave(now = Date.now()): SaveData {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    profile: { name: 'You' },
    rating: { ...START_RATING },
    peakRating: START_RATING.r,
    career: { rank: 0, merit: 0, probation: 0, highestRank: 0, series: null, promotions: [], seriesFailures: 0 },
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
    },
    history: [],
    opponents: {},
    achievements: {},
    owned: ['board.ivory', 'pieces.ink', 'crest.plain', 'frame.none', 'office.plain', 'ceremony.ink', 'entrance.fade'],
    equipped: {
      board: 'board.ivory',
      pieces: 'pieces.ink',
      crest: 'crest.plain',
      frame: 'frame.none',
      office: 'office.plain',
      ceremony: 'ceremony.ink',
      entrance: 'entrance.fade',
    },
    settings: { coordinates: true, showLegal: true, animations: true, sound: false, tc: '5+3', confirmResign: true },
    settled: [],
    active: null,
    rematch: null,
    lastPlayedAt: 0,
    academy: { solved: {}, readChapters: {} },
    hq: { floors: 0 },
    cup: { tokens: 0, active: null, trophies: [] },
  };
}

/** Upgrade older saves in place-safe fashion (returns a new object). */
export function migrate(raw: unknown): SaveData {
  const base = newSave();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<SaveData>;
  // version 1 is current; fill any missing fields from defaults (forward-compatible)
  const merged: SaveData = {
    ...base,
    ...s,
    career: { ...base.career, ...(s.career ?? {}) },
    wallet: { ...base.wallet, ...(s.wallet ?? {}) },
    stats: { ...base.stats, ...(s.stats ?? {}) },
    settings: { ...base.settings, ...(s.settings ?? {}) },
    equipped: { ...base.equipped, ...(s.equipped ?? {}) },
    academy: { ...base.academy, ...(s.academy ?? {}) },
    hq: { ...base.hq, ...(s.hq ?? {}) },
    cup: { ...base.cup, ...(s.cup ?? {}) },
    version: SAVE_VERSION,
  } as SaveData;
  if (!Array.isArray(merged.owned)) merged.owned = base.owned;
  for (const o of base.owned) if (!merged.owned.includes(o)) merged.owned.push(o);
  if (!Array.isArray(merged.settled)) merged.settled = [];
  if (!Array.isArray(merged.history)) merged.history = [];
  return merged;
}

export function seasonKey(t: number): string {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
