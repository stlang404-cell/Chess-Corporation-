import { CALIBRATION } from '../engine/calibration';
import { TIERS, type StyleId } from '../engine/ai';

export function botRating(tier: number, style: StyleId): number {
  return Math.round(CALIBRATION.tierRatings[tier] + (CALIBRATION.styleOffsets[style] ?? 0));
}
export function botRd(tier: number): number {
  return CALIBRATION.tierRd[tier] ?? 80;
}
export const MAX_TIER = TIERS.length - 1;
