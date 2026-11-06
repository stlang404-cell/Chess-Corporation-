import { describe, it, expect } from 'vitest';
import { newSave } from '../src/game/state';
import { applyPurchase, STORE, ARENA_BOARDS, itemById, floorPrice } from '../src/game/store';
import { exportSave, checkImport } from '../src/game/storage';

describe('store purchases', () => {
  it('buys, deducts, records and equips; refuses duplicates, debt and locked items', () => {
    const s = newSave(0);
    s.wallet.balance = 5000;
    const before = JSON.stringify({ rating: s.rating, career: { ...s.career, highestRank: 0 } });
    expect(applyPurchase(s, 'board.washi')).toBeNull();
    expect(s.wallet.balance).toBe(5000 - itemById('board.washi')!.price);
    expect(s.finance.purchases).toBe(itemById('board.washi')!.price);
    expect(s.equipped.board).toBe('board.washi');
    expect(applyPurchase(s, 'board.washi')).toBe('Owned');
    expect(applyPurchase(s, 'trophy.castle')).toBe('Locked');
    s.wallet.balance = 10;
    expect(applyPurchase(s, 'board.indigo')).toBe('Insufficient funds');
    expect(s.wallet.balance).toBe(10);
    // purchases never touch rating or career
    expect(JSON.stringify({ rating: s.rating, career: { ...s.career, highestRank: 0 } })).toBe(before);
  });
  it('arena boards are free once the arena is reached', () => {
    const s = newSave(0);
    expect(applyPurchase(s, ARENA_BOARDS[0].id)).toBeNull();
    expect(applyPurchase(s, ARENA_BOARDS[5].id)).toBe('Locked');
    s.career.highestRank = ARENA_BOARDS[5].minRank!;
    expect(applyPurchase(s, ARENA_BOARDS[5].id)).toBeNull();
  });
  it('catalogue sells cosmetics/amenities only, and the HQ sink grows geometrically', () => {
    const kinds = new Set(STORE.map((i) => i.kind));
    for (const k of kinds) expect(['board', 'pieces', 'portrait', 'crest', 'frame', 'office', 'ceremony', 'entrance', 'trophy', 'amenity']).toContain(k);
    expect(floorPrice(10)).toBeGreaterThan(floorPrice(9) * 1.1);
  });
});

describe('career backup import validation', () => {
  it('accepts a valid export and rejects damaged, foreign or newer files', () => {
    const s = newSave(1);
    s.wallet.balance = 777;
    const text = exportSave(s);
    const ok = checkImport(text);
    expect(ok.ok).toBe(true);
    expect(ok.save!.wallet.balance).toBe(777);
    const damaged = JSON.parse(text);
    damaged.json = damaged.json.replace('777', '778');
    expect(checkImport(JSON.stringify(damaged)).ok).toBe(false);
    expect(checkImport('{"hello":1}').ok).toBe(false);
    expect(checkImport('not json').ok).toBe(false);
    const future = { ...s, version: 99 };
    const fJson = JSON.stringify(future);
    let h = 2166136261;
    for (let i = 0; i < fJson.length; i++) {
      h ^= fJson.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const res = checkImport(JSON.stringify({ json: fJson, sum: h >>> 0 }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/newer version/);
  });
});
