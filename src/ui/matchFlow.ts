import { getState, updateSave, go } from './appState';
import { TIME_CONTROLS, type ActiveMatch, type MatchKind, type OpponentSpec } from '../game/state';
import { findOpponent } from '../game/matchmaking';

export function newMatchId() {
  const r = crypto.getRandomValues(new Uint32Array(2));
  return `${Date.now().toString(36)}-${r[0].toString(36)}${r[1].toString(36)}`;
}

export function pickOpponent(): OpponentSpec {
  const rnd = new Uint32Array(1);
  const rand = () => (crypto.getRandomValues(rnd)[0] / 4294967296);
  return findOpponent(getState().save, rand);
}

export async function startMatch(kind: MatchKind, opponent: OpponentSpec, color?: 0 | 1, tcId?: string) {
  const save = getState().save;
  const last = save.history[0];
  const c: 0 | 1 = color ?? (last ? ((1 - last.color) as 0 | 1) : Math.random() < 0.5 ? 0 : 1);
  const tc = TIME_CONTROLS.find((t) => t.id === (tcId ?? save.settings.tc)) ?? TIME_CONTROLS[0];
  const active: ActiveMatch = {
    id: newMatchId(),
    kind,
    opponent,
    playerColor: c,
    moves: [],
    clocks: [tc.baseMs, tc.baseMs],
    tc: tc.id,
    startedAt: Date.now(),
    seed: crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff,
    drawOffers: 0,
    undos: 0,
  };
  await updateSave((s) => {
    s.active = active;
  });
  go('play');
}

/** The kind of the next MATCH press: a promotion series game if one is pending. */
export function nextKind(): MatchKind {
  const s = getState().save;
  return s.career.series ? 'series' : s.cup.active ? 'cup' : 'ranked';
}
