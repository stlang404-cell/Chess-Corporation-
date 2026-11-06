/**
 * Performance contracts: three optional short-term goals built from genuine
 * chess achievements. They advance only in rated games with ≥ 15 player moves
 * and a completed engine review (so they cannot be farmed with aborted games,
 * stalling or a missing analysis). Thresholds scale with the player's rating.
 * Contracts pay dollars only — never rating or merit.
 */
import type { ReviewSummary } from '../engine/analysis';
import { salary } from './career';

export type ContractKind = 'accurate' | 'upset' | 'black' | 'defence' | 'great' | 'clean' | 'rival' | 'series';

export interface Contract {
  id: string;
  kind: ContractKind;
  label: string;
  target: number;
  progress: number;
  /** accuracy threshold for 'accurate' contracts */
  threshold?: number;
  reward: number;
}

export interface ContractEvent {
  rated: boolean;
  playerMoves: number;
  review: ReviewSummary | null;
  score: 0 | 0.5 | 1;
  color: 0 | 1;
  ratingGap: number; // opponent − player
  rival: boolean;
  seriesGame: boolean;
}

function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}

/** Kinds that are impossible right now for this save. */
export function unavailableKinds(opponents: Record<string, { g: number }>, boardAhead: boolean): ContractKind[] {
  const out: ContractKind[] = [];
  if (!Object.values(opponents).some((o) => o.g >= 3)) out.push('rival');
  if (!boardAhead) out.push('series');
  return out;
}

const KINDS: ContractKind[] = ['accurate', 'upset', 'black', 'defence', 'great', 'clean', 'rival', 'series'];

/** Deterministic contract #n for a player of this rating and rank. */
export function makeContract(n: number, rating: number, rank: number, exclude: ContractKind[]): Contract {
  const S = salary(rank);
  const pool = KINDS.filter((k) => !exclude.includes(k));
  const kind = pool[hash(n * 7919 + 13) % pool.length];
  const acc = Math.max(65, Math.min(90, Math.round((62 + (rating - 600) / 70) / 5) * 5));
  switch (kind) {
    case 'accurate':
      return { id: `c${n}`, kind, label: `Play 3 rated games with ≥ ${acc}% accuracy`, target: 3, progress: 0, threshold: acc, reward: Math.round(3 * S) };
    case 'upset':
      return { id: `c${n}`, kind, label: 'Defeat an opponent rated 100+ above you', target: 1, progress: 0, reward: Math.round(4 * S) };
    case 'black':
      return { id: `c${n}`, kind, label: 'Win a rated game with Black', target: 1, progress: 0, reward: Math.round(2 * S) };
    case 'defence':
      return { id: `c${n}`, kind, label: 'Hold a draw or win after being clearly worse', target: 1, progress: 0, reward: Math.round(3 * S) };
    case 'great':
      return { id: `c${n}`, kind, label: 'Find a Great or Brilliant move in a rated game', target: 1, progress: 0, reward: Math.round(2 * S) };
    case 'clean':
      return { id: `c${n}`, kind, label: 'Play 2 rated games in a row without a blunder', target: 2, progress: 0, reward: Math.round(3 * S) };
    case 'rival':
      return { id: `c${n}`, kind, label: 'Defeat one of your rivals', target: 1, progress: 0, reward: Math.round(4 * S) };
    default:
      return { id: `c${n}`, kind: 'series', label: 'Win a promotion-board game', target: 1, progress: 0, reward: Math.round(3 * S) };
  }
}

/** `exclude` removes kinds that cannot currently be met (e.g. 'rival' before any rival exists). */
export function freshContracts(issued: number, rating: number, rank: number, exclude: ContractKind[] = []): Contract[] {
  const out: Contract[] = [];
  for (let i = 0; out.length < 3; i++) out.push(makeContract(issued + i, rating, rank, [...exclude, ...out.map((c) => c.kind)]));
  return out;
}

/** Advance contracts for one finished game. Returns completed contracts. */
export function advanceContracts(list: Contract[], e: ContractEvent): Contract[] {
  const done: Contract[] = [];
  if (!e.rated || e.playerMoves < 15 || !e.review) return done;
  const r = e.review;
  for (const c of list) {
    let hit = false;
    switch (c.kind) {
      case 'accurate':
        hit = r.accuracy >= (c.threshold ?? 80);
        break;
      case 'upset':
        hit = e.score === 1 && e.ratingGap >= 100;
        break;
      case 'black':
        hit = e.score === 1 && e.color === 1;
        break;
      case 'defence':
        hit = e.score >= 0.5 && r.minWin <= 25;
        break;
      case 'great':
        hit = r.counts.great + r.counts.brilliant > 0;
        break;
      case 'clean':
        if (r.counts.blunder === 0) hit = true;
        else c.progress = 0; // must be consecutive
        break;
      case 'rival':
        hit = e.score === 1 && e.rival;
        break;
      case 'series':
        hit = e.score === 1 && e.seriesGame;
        break;
    }
    if (hit) c.progress = Math.min(c.target, c.progress + 1);
    if (c.progress >= c.target) done.push(c);
  }
  return done;
}
