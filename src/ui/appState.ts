/** Global app state: the save plus navigation, with atomic persistence. */
import { useSyncExternalStore } from 'react';
import { newSave, type SaveData } from '../game/state';
import { loadSave, writeSave } from '../game/storage';

export type Tab = 'home' | 'play' | 'career' | 'academy';

interface AppState {
  save: SaveData;
  tab: Tab;
  ready: boolean;
  recovered: boolean;
  toast: string | null;
  /** academy deep link (e.g. review a game id) */
  academyIntent: { kind: 'review'; matchId: string } | null;
  autoMatch: boolean;
  /** set when a new app version is installed and waiting */
  updateReady: null | (() => void);
  /** pending promotion ceremony to show over the results */
}

let state: AppState = { save: newSave(), tab: 'home', ready: false, recovered: false, toast: null, academyIntent: null, autoMatch: false, updateReady: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getState() {
  return state;
}
export function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  emit();
}
export function useApp(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

let writeChain: Promise<void> = Promise.resolve();
/** Replace the save and persist it. Writes are serialised in order. */
export function commit(save: SaveData): Promise<void> {
  state = { ...state, save };
  emit();
  writeChain = writeChain.then(() => writeSave(save)).catch((e) => {
    console.error('save failed', e);
    toast('Could not save progress — storage unavailable');
  });
  return writeChain;
}
export function updateSave(fn: (s: SaveData) => void): Promise<void> {
  const next = structuredClone(state.save);
  fn(next);
  return commit(next);
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  setState({ toast: msg });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setState({ toast: null }), 2600);
}

export async function boot() {
  const { save, recovered } = await loadSave();
  setState({ save: save ?? newSave(), ready: true, recovered, tab: save?.active && !save.active.finished ? 'play' : 'home' });
  if (!save) await writeSave(state.save);
}

export const go = (tab: Tab) => setState({ tab });
