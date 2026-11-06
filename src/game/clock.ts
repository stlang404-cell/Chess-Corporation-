/**
 * Clock rules, kept pure so they can be tested. Untimed games (clocks === null)
 * never lose on time and never show a countdown.
 */
import { TIME_CONTROLS, UNTIMED, type ActiveMatch } from './state';

export const isUntimed = (m: Pick<ActiveMatch, 'clocks' | 'tc'>) => m.clocks === null || m.tc === UNTIMED;

export function timeControlOf(m: Pick<ActiveMatch, 'tc'>) {
  return TIME_CONTROLS.find((t) => t.id === m.tc) ?? TIME_CONTROLS[0];
}

/** Clock state after `side` spends `elapsedMs` on a move (increment added). */
export function clocksAfterMove(m: ActiveMatch, side: 0 | 1, elapsedMs: number): ActiveMatch['clocks'] {
  if (isUntimed(m) || !m.clocks) return null;
  const c: [number, number] = [m.clocks[0], m.clocks[1]];
  if (m.moves.length >= 1) c[side] = c[side] - elapsedMs + timeControlOf(m).incMs;
  return c;
}

/** True only for timed games whose side-to-move has run out. */
export function hasFlagged(m: ActiveMatch, side: 0 | 1, elapsedMs: number): boolean {
  if (isUntimed(m) || !m.clocks || m.moves.length < 1) return false;
  return m.clocks[side] - elapsedMs <= 0;
}

export function initialClocks(tcId: string): ActiveMatch['clocks'] {
  const tc = TIME_CONTROLS.find((t) => t.id === tcId) ?? TIME_CONTROLS[0];
  return tc.id === UNTIMED ? null : [tc.baseMs, tc.baseMs];
}

/** Wall-clock cap for one engine move. Untimed: from the AI-think setting only. */
export function botThinkCapMs(m: ActiveMatch, side: 0 | 1, aiThink: 'standard' | 'strong'): number {
  const base = aiThink === 'strong' ? 10_000 : 4_000;
  if (isUntimed(m) || !m.clocks) return base;
  return Math.min(base, Math.max(150, m.clocks[side] / 25 + timeControlOf(m).incMs * 0.7));
}
