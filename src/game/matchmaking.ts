/**
 * Matchmaking. Picks an opponent near the player's rating. The spread makes
 * some games harder and some easier; recent form tilts the *target* slightly,
 * but every opponent's displayed rating is its measured rating and the rating
 * update uses it honestly — no result is ever manipulated.
 */
import { STYLE_IDS, type StyleId } from '../engine/ai';
import { botRating, botRd, MAX_TIER } from './bots';
import { identityOf, styleOf } from './opponents';
import { isProvisional } from './rating';
import { ratingGate } from './career';
import type { OpponentSpec, SaveData } from './state';

export type Rand = () => number;

export function gaussian(rand: Rand): number {
  const u = Math.max(1e-9, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function nearestTier(target: number, style: StyleId): number {
  let best = 0;
  let bd = Infinity;
  for (let t = 0; t <= MAX_TIER; t++) {
    const d = Math.abs(botRating(t, style) - target);
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}

/** Find an opponent id whose stable style equals `style` (ids are cheap). */
function idWithStyle(style: StyleId, rand: Rand): number {
  for (let i = 0; i < 200; i++) {
    const id = Math.floor(rand() * 0x7fffffff);
    if (styleOf(id) === style) return id;
  }
  return Math.floor(rand() * 0x7fffffff);
}

export function matchTarget(save: SaveData, rand: Rand): number {
  const R = save.rating.r;
  if (save.career.series) {
    // promotion board: opponents sit at the bar being tested (the gate), so the
    // series checks that the player genuinely meets it
    const gate = ratingGate(save.career.series.targetRank);
    return Math.max(gate + 50, Math.min(R, gate + 150)) + gaussian(rand) * 40;
  }
  if (save.cup.active) return R + [-60, 60, 170][Math.min(2, save.cup.active.round)] + gaussian(rand) * 30;
  const spread = isProvisional(save.rating) ? 140 : 95;
  let tilt = 0;
  if (save.stats.streak <= -3) tilt = -45;
  else if (save.stats.streak >= 3) tilt = 35;
  return R + tilt + gaussian(rand) * spread;
}

export function findOpponent(save: SaveData, rand: Rand): OpponentSpec {
  const R = save.rating.r;
  // rival encounter: someone met ≥3 times, still close in strength
  if (!save.career.series && !save.cup.active && rand() < 0.15) {
    const rivals = Object.values(save.opponents)
      .filter((o) => o.g >= 3 && Math.abs(botRating(o.tier, o.style) - R) < 180)
      .sort((a, b) => b.g - a.g);
    if (rivals.length) {
      const o = rivals[Math.floor(rand() * Math.min(3, rivals.length))];
      return {
        id: o.id,
        tier: o.tier,
        style: o.style,
        rating: botRating(o.tier, o.style),
        rd: botRd(o.tier),
        name: o.name,
        rival: true,
      };
    }
  }
  // style diversity: avoid the last two styles faced
  const recent = save.history.slice(0, 2).map((h) => h.oppStyle);
  const pool = STYLE_IDS.filter((s) => !recent.includes(s));
  const style = pool[Math.floor(rand() * pool.length)] ?? 'balanced';
  const target = matchTarget(save, rand);
  const tier = nearestTier(target, style);
  const id = idWithStyle(style, rand);
  return { id, tier, style, rating: botRating(tier, style), rd: botRd(tier), name: identityOf(id).name };
}

export function rematchOpponent(save: SaveData, last: OpponentSpec): OpponentSpec {
  const o = save.opponents[String(last.id)];
  return { ...last, rival: !!o && o.g >= 3 };
}
