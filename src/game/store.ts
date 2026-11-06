/** Cosmetic store. Nothing here affects move quality, opponents, or rating. */
import { arenaInfo, firstRankOfArena, AUTHORED_ARENA_COUNT } from './career';
export type ItemKind = 'board' | 'pieces' | 'crest' | 'frame' | 'office' | 'ceremony' | 'entrance' | 'trophy' | 'amenity';

export interface StoreItem {
  id: string;
  kind: ItemKind;
  name: string;
  price: number;
  /** minimum highest-rank index required to purchase (prestige items) */
  minRank?: number;
  desc: string;
  /** theme data consumed by the UI */
  data?: Record<string, string>;
}

export const KIND_LABEL: Record<ItemKind, string> = {
  board: 'Boards',
  pieces: 'Piece sets',
  crest: 'Crests',
  frame: 'Profile frames',
  office: 'Office',
  ceremony: 'Promotion ceremony',
  entrance: 'Match entrance',
  trophy: 'Trophy cabinet',
  amenity: 'Study amenities',
};

export const STORE: StoreItem[] = [
  { id: 'board.ivory', kind: 'board', name: 'Ivory & Stone', price: 0, desc: 'The house board.', data: { light: '#efe8d8', dark: '#b9ad97', line: '#8f846f' } },
  { id: 'board.washi', kind: 'board', name: 'Washi', price: 3000, desc: 'Paper-white with charcoal squares.', data: { light: '#f6f2ea', dark: '#9b978f', line: '#6e6a63' } },
  { id: 'board.matcha', kind: 'board', name: 'Matcha', price: 6000, desc: 'Muted tea green.', data: { light: '#e9e6d3', dark: '#97a07e', line: '#6f775b' } },
  { id: 'board.indigo', kind: 'board', name: 'Aizome Indigo', price: 9000, desc: 'Indigo-dyed cloth.', data: { light: '#e6e4de', dark: '#6d7a8c', line: '#4b5768' } },
  { id: 'board.sakura', kind: 'board', name: 'Sakura', price: 9000, desc: 'A breath of spring.', data: { light: '#f4ece6', dark: '#cfaea6', line: '#a3847c' } },
  { id: 'board.sumi', kind: 'board', name: 'Sumi Night', price: 16000, minRank: 40, desc: 'Ink-dark board for late meetings.', data: { light: '#5a5751', dark: '#3a3834', line: '#24231f' } },
  { id: 'board.kinpaku', kind: 'board', name: 'Kinpaku Gold Leaf', price: 50000, minRank: 100, desc: 'Reserved for the executive floor.', data: { light: '#efe3c2', dark: '#c3a45f', line: '#8e7339' } },

  { id: 'pieces.ink', kind: 'pieces', name: 'Ink', price: 0, desc: 'Clean brushed silhouettes.' },
  { id: 'pieces.stone', kind: 'pieces', name: 'River Stone', price: 5000, desc: 'Outlined, airy pieces.' },
  { id: 'pieces.kanji', kind: 'pieces', name: 'Kanji Tiles', price: 12000, desc: 'Shogi-style tiles with kanji names.' },
  { id: 'pieces.gold', kind: 'pieces', name: 'Lacquer & Gold', price: 40000, minRank: 80, desc: 'Black lacquer, gold rims.' },

  { id: 'crest.plain', kind: 'crest', name: 'Plain Seal', price: 0, desc: 'A simple circle.', data: { mark: '七' } },
  { id: 'crest.crane', kind: 'crest', name: 'Crane', price: 4000, desc: 'Longevity.', data: { mark: '鶴' } },
  { id: 'crest.wave', kind: 'crest', name: 'Wave', price: 4000, desc: 'Persistence.', data: { mark: '波' } },
  { id: 'crest.pine', kind: 'crest', name: 'Pine', price: 7000, desc: 'Endurance.', data: { mark: '松' } },
  { id: 'crest.sun', kind: 'crest', name: 'Rising Sun', price: 18000, minRank: 60, desc: 'Ascendancy.', data: { mark: '日' } },
  { id: 'crest.dragon', kind: 'crest', name: 'Dragon', price: 60000, minRank: 140, desc: 'For the board itself.', data: { mark: '龍' } },

  { id: 'frame.none', kind: 'frame', name: 'No frame', price: 0, desc: '' },
  { id: 'frame.hairline', kind: 'frame', name: 'Hairline', price: 2000, desc: 'A single ink line.', data: { style: '1px solid #1d1d1b' } },
  { id: 'frame.double', kind: 'frame', name: 'Double Rule', price: 6000, desc: 'Formal double line.', data: { style: '3px double #1d1d1b' } },
  { id: 'frame.vermilion', kind: 'frame', name: 'Vermilion', price: 12000, desc: 'The seal-ink frame.', data: { style: '2px solid #b5452f' } },
  { id: 'frame.gold', kind: 'frame', name: 'Gold Rule', price: 30000, minRank: 90, desc: 'Executive gilt.', data: { style: '2px solid #b08d3c' } },

  { id: 'office.plain', kind: 'office', name: 'Plain Office', price: 0, desc: 'Ivory walls.', data: { motif: 'plain' } },
  { id: 'office.seigaiha', kind: 'office', name: 'Seigaiha Wallpaper', price: 5000, desc: 'Blue-ocean waves.', data: { motif: 'seigaiha' } },
  { id: 'office.asanoha', kind: 'office', name: 'Asanoha Screens', price: 7000, desc: 'Hemp-leaf lattice.', data: { motif: 'asanoha' } },
  { id: 'office.kikko', kind: 'office', name: 'Kikkō Panels', price: 10000, desc: 'Tortoise-shell hexagons.', data: { motif: 'kikko' } },
  { id: 'office.shippo', kind: 'office', name: 'Shippō Rings', price: 14000, minRank: 50, desc: 'Seven treasures.', data: { motif: 'shippo' } },

  { id: 'ceremony.ink', kind: 'ceremony', name: 'Ink Seal', price: 0, desc: 'A seal is stamped.' },
  { id: 'ceremony.gold', kind: 'ceremony', name: 'Gold Leaf', price: 10000, desc: 'Gold flakes drift down.' },
  { id: 'ceremony.petals', kind: 'ceremony', name: 'Cherry Petals', price: 16000, desc: 'Petals fall across the screen.' },

  { id: 'entrance.fade', kind: 'entrance', name: 'Quiet Fade', price: 0, desc: 'The board fades in.' },
  { id: 'entrance.brush', kind: 'entrance', name: 'Brush Stroke', price: 5000, desc: 'An ink stroke reveals the board.' },
  { id: 'entrance.slide', kind: 'entrance', name: 'Shoji Slide', price: 8000, desc: 'Sliding-door reveal.' },

  { id: 'trophy.bonsai', kind: 'trophy', name: 'Desk Bonsai', price: 2400, desc: 'A small pine for your desk.', data: { glyph: '盆' } },
  { id: 'trophy.clock', kind: 'trophy', name: 'Brass Clock', price: 8000, desc: 'Analogue chess clock.', data: { glyph: '時' } },
  { id: 'trophy.koi', kind: 'trophy', name: 'Koi Scroll', price: 18000, desc: 'Koi climbing the waterfall.', data: { glyph: '鯉' } },
  { id: 'trophy.fuji', kind: 'trophy', name: 'Fuji Woodblock', price: 36000, minRank: 70, desc: 'A first-edition print.', data: { glyph: '富' } },
  { id: 'trophy.castle', kind: 'trophy', name: 'Castle Model', price: 120000, minRank: 150, desc: 'A lacquered castle keep.', data: { glyph: '城' } },

  // Study amenities: affect ONLY post-game review and unrated training games.
  { id: 'amenity.desk', kind: 'amenity', name: 'Analysis Desk', price: 8000, desc: 'Post-game review searches 3× deeper.' },
  { id: 'amenity.mentor', kind: 'amenity', name: 'Training Mentor', price: 12000, desc: 'Training-game hints search 3× deeper and show the main line.' },
];

function mix(hex: string, base: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(base);
  return '#' + a.map((v, i) => Math.round(v * t + b[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
}

/** Free board themes unlocked by reaching each authored arena. */
export const ARENA_BOARDS: StoreItem[] = Array.from({ length: AUTHORED_ARENA_COUNT }, (_, i) => {
  const a = arenaInfo(i);
  return {
    id: `board.arena.${i}`,
    kind: 'board' as const,
    name: `${a.name} board`,
    price: 0,
    minRank: firstRankOfArena(i),
    desc: `Unlocked by reaching ${a.name}.`,
    data: { light: '#efe9dc', dark: mix(a.accent, '#efe9dc', 0.55), line: mix(a.accent, '#1d1d1b', 0.6) },
  };
});

export const itemById = (id: string) => STORE.find((i) => i.id === id) ?? ARENA_BOARDS.find((i) => i.id === id);

export function canBuy(item: StoreItem, balance: number, highestRank: number, owned: string[]): string | null {
  if (owned.includes(item.id)) return 'Owned';
  if (item.minRank !== undefined && highestRank < item.minRank) return 'Locked';
  if (balance < item.price) return 'Insufficient funds';
  return null;
}

/** Headquarters floors: cosmetic, unlimited, geometric price (≈13% per floor). */
export function floorPrice(k: number): number {
  return Math.round((3000 * Math.pow(1.13, k)) / 100) * 100;
}
export function hqValue(floors: number): number {
  let t = 0;
  for (let k = 0; k < floors; k++) t += floorPrice(k);
  return t;
}
export const FLOOR_NAMES = ['Lobby', 'Mailroom', 'Archive', 'Trading Floor', 'Library', 'Tea Room', 'Dojo', 'Garden Terrace', 'Boardroom', 'Observatory'];
export function floorName(k: number): string {
  return k < FLOOR_NAMES.length ? FLOOR_NAMES[k] : `Floor ${k + 1}`;
}
