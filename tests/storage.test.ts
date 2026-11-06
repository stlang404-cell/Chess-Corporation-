import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSave, writeSave, exportSave, importSave, wipeSave } from '../src/game/storage';
import { newSave } from '../src/game/state';
import { settleMatch } from '../src/game/settle';

// minimal localStorage shim for node
const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};

async function corruptMain() {
  await new Promise<void>((resolve) => {
    const req = indexedDB.open('seven-corporate-chess', 1);
    req.onsuccess = () => {
      const tx = req.result.transaction('saves', 'readwrite');
      tx.objectStore('saves').put({ json: '{"broken":', sum: 1, at: 0 }, 'main');
      tx.oncomplete = () => resolve();
    };
  });
}

describe('save & reload', () => {
  beforeEach(async () => {
    await wipeSave();
    mem.clear();
  });
  it('round-trips a save', async () => {
    const s = newSave(1);
    s.wallet.balance = 1234;
    await writeSave(s);
    const { save, recovered } = await loadSave();
    expect(recovered).toBe(false);
    expect(save).toEqual(s);
  });
  it('recovers from a corrupted main slot using the backup', async () => {
    const a = newSave(1);
    a.wallet.balance = 10;
    await writeSave(a);
    const b = structuredClone(a);
    b.wallet.balance = 20;
    await writeSave(b); // backup now holds a
    await corruptMain();
    const { save, recovered } = await loadSave();
    expect(recovered).toBe(true);
    expect(save!.wallet.balance).toBe(10);
  });
  it('a settled match persists exactly once across reloads', async () => {
    const s0 = newSave(1);
    const m = {
      id: 'once',
      kind: 'ranked' as const,
      opponent: { id: 1, tier: 3, style: 'balanced' as const, rating: 1000, rd: 60, name: 'X' },
      playerColor: 0 as const,
      moves: new Array(40).fill('a2a3'),
      clocks: [0, 0] as [number, number],
      tc: '5+3',
      startedAt: 0,
      seed: 1,
      finished: { score: 1 as const, termination: 'checkmate' as const, endedAt: 1 },
      drawOffers: 0,
      undos: 0,
    };
    const first = settleMatch(s0, m, 5).save;
    await writeSave(first);
    const reloaded = (await loadSave()).save!;
    const again = settleMatch(reloaded, m, 6);
    expect(again.duplicate).toBe(true);
    expect(reloaded.wallet.balance).toBe(first.wallet.balance);
    expect(reloaded.stats.rated.g).toBe(1);
  });
  it('export/import round-trips and rejects garbage', () => {
    const s = newSave(3);
    s.career.rank = 7;
    expect(importSave(exportSave(s))).toEqual(s);
    expect(importSave('not json')).toBeNull();
    expect(importSave(JSON.stringify({ json: '{}', sum: 5 }))).toBeNull();
  });
});
