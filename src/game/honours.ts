/**
 * Rare distinctions: honours earned by genuine chess achievements, separate from
 * job titles and rating. Each one also unlocks an earned-only cosmetic (see
 * EARNED items in store.ts); none of them can be bought with dollars.
 */
export interface HonourContext {
  brilliants: number;
  defences: number;
  contractsCompleted: number;
  bestStreak: number;
  /** this game: rated win with ≥ 20 player moves and a review at this accuracy (else null) */
  winAccuracy: number | null;
  /** this game: rating gap of a rated win (opponent − player), else null */
  upsetGap: number | null;
}

export interface Distinction {
  id: string;
  name: string;
  desc: string;
  /** earned-only store item granted with the honour */
  item: string;
  test: (c: HonourContext) => boolean;
}

export const DISTINCTIONS: Distinction[] = [
  { id: 'order-seven-pines', name: 'Order of the Seven Pines', desc: 'Seven verified brilliant moves', item: 'crest.pines', test: (c) => c.brilliants >= 7 },
  { id: 'golden-ledger', name: 'Golden Ledger', desc: 'A rated win with 95%+ accuracy (20+ moves)', item: 'frame.ledger', test: (c) => (c.winAccuracy ?? 0) >= 95 },
  { id: 'iron-defence', name: 'Iron Defence', desc: 'Five games saved from clearly worse positions', item: 'board.iron', test: (c) => c.defences >= 5 },
  { id: 'giant-slayer', name: 'Giant Slayer', desc: 'Defeat an opponent rated 300+ above you', item: 'portrait.sword', test: (c) => (c.upsetGap ?? 0) >= 300 },
  { id: 'contractor', name: 'Contractor of Distinction', desc: 'Complete ten performance contracts', item: 'trophy.seal', test: (c) => c.contractsCompleted >= 10 },
  { id: 'perfect-quarter', name: 'Perfect Quarter', desc: 'Ten rated wins in a row', item: 'ceremony.aurora', test: (c) => c.bestStreak >= 10 },
];

export const distinctionById = (id: string) => DISTINCTIONS.find((d) => d.id === id);
