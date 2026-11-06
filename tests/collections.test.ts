import { describe, it, expect } from 'vitest';
import { newSave } from '../src/game/state';
import { applyPurchase, EARNED, COLLECTIONS, itemById, grantEarned } from '../src/game/store';
import { DISTINCTIONS } from '../src/game/honours';
import { PIECE_SETS } from '../src/ui/pieces';

describe('earned cosmetics and collections', () => {
  it('earned-only items can never be bought, whatever the balance', () => {
    const s = newSave(0);
    s.wallet.balance = 1e12;
    s.career.highestRank = 10_000;
    for (const it of EARNED) {
      expect(applyPurchase(s, it.id)).toBe('Earned only');
      expect(s.owned).not.toContain(it.id);
    }
    expect(s.wallet.balance).toBe(1e12);
  });

  it('every distinction and collection maps to a real earned item, and collection items are buyable', () => {
    for (const d of DISTINCTIONS) expect(itemById(d.item)?.earned).toBe(`honour:${d.id}`);
    for (const c of COLLECTIONS) {
      expect(itemById(c.reward)?.earned).toBe(`collection:${c.id}`);
      for (const x of c.items) expect(itemById(x) && !itemById(x)!.earned).toBe(true);
    }
    const ids = new Set(EARNED.map((e) => e.id));
    expect(ids.size).toBe(EARNED.length);
    // piece-set items must have artwork
    for (const it of EARNED.filter((e) => e.kind === 'pieces')) expect(PIECE_SETS).toContain(it.id);
  });

  it('completing a collection by purchase grants its reward exactly once', () => {
    const s = newSave(0);
    s.wallet.balance = 1e9;
    const tea = COLLECTIONS.find((c) => c.id === 'tea')!;
    for (const x of tea.items.slice(0, -1)) applyPurchase(s, x);
    expect(s.owned).not.toContain(tea.reward);
    applyPurchase(s, tea.items[tea.items.length - 1]);
    expect(s.owned.filter((x) => x === tea.reward)).toHaveLength(1);
    expect(grantEarned(s)).toHaveLength(0);
  });

  it('honours grant their cosmetic; no honour, no cosmetic', () => {
    const s = newSave(0);
    expect(grantEarned(s)).toHaveLength(0);
    s.honors.push({ id: 'giant-slayer', name: 'Giant Slayer', at: 0, kind: 'distinction' });
    expect(grantEarned(s).map((i) => i.id)).toEqual(['portrait.sword']);
    expect(grantEarned(s)).toHaveLength(0);
  });

  it('distinction tests use genuine thresholds', () => {
    const base = { brilliants: 0, defences: 0, contractsCompleted: 0, bestStreak: 0, winAccuracy: null, upsetGap: null };
    expect(DISTINCTIONS.filter((d) => d.test(base))).toHaveLength(0);
    const by = (id: string) => DISTINCTIONS.find((d) => d.id === id)!;
    expect(by('golden-ledger').test({ ...base, winAccuracy: 94.9 })).toBe(false);
    expect(by('golden-ledger').test({ ...base, winAccuracy: 95 })).toBe(true);
    expect(by('order-seven-pines').test({ ...base, brilliants: 6 })).toBe(false);
    expect(by('giant-slayer').test({ ...base, upsetGap: 300 })).toBe(true);
  });
});
