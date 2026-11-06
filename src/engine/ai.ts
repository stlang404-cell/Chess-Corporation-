/**
 * AI players: strength tiers × playing styles.
 *
 * Strength is controlled by a NODE budget (hardware independent, so calibrated
 * ratings stay valid on any device), deterministic evaluation noise, and a
 * soft-max choice among root moves. Style is controlled by evaluation weights
 * (see Personality) plus a root preference for forcing moves, so a style is a
 * real difference in move selection.
 */
import { Position, EMPTY, mTo, mFlag, mPromo, FLAG_EP } from './board';
import { NEUTRAL, type Personality } from './eval';
import { Searcher, isMateScore } from './search';
import BOOK from './book.json';
import { uciToMove } from './game';

const OPENING_BOOK = BOOK as Record<string, [string, number][]>;
/** Book move for strong tiers (variant-specific book, scripts/make-book.ts), chosen by seed. */
export function bookMove(pos: Position, seed: number): number {
  const k = pos.toFen().split(' ').slice(0, 2).join(' ');
  const entries = OPENING_BOOK[k];
  if (!entries || !entries.length) return 0;
  const pick = entries[(seed >>> 0) % entries.length];
  return uciToMove(pos, pick[0]);
}

export type StyleId = 'balanced' | 'attacker' | 'strategist' | 'defender' | 'tactician' | 'endgame' | 'wildcard' | 'gambiteer' | 'technician';

export interface StyleDef {
  id: StyleId;
  label: string;
  blurb: string;
  pers: Personality;
  /** extra softmax temperature multiplier */
  tempMul: number;
}

export const STYLES: Record<StyleId, StyleDef> = {
  balanced: { id: 'balanced', label: 'Balanced', blurb: 'Even-handed, few weaknesses.', pers: NEUTRAL, tempMul: 1 },
  attacker: {
    id: 'attacker',
    label: 'Attacker',
    blurb: 'Throws pieces at your king; pays for initiative.',
    pers: { ...NEUTRAL, kingAttack: 2.2, mobility: 1.3, kingSafety: 0.6, pawnStructure: 0.6, contempt: 25, aggression: 30 },
    tempMul: 1,
  },
  strategist: {
    id: 'strategist',
    label: 'Strategist',
    blurb: 'Pawn structure and squares before tactics.',
    pers: { ...NEUTRAL, pawnStructure: 1.8, passedPawns: 1.3, centre: 1.4, mobility: 1.1, kingAttack: 0.7, aggression: -10 },
    tempMul: 0.8,
  },
  defender: {
    id: 'defender',
    label: 'Defender',
    blurb: 'Solid shelter, trades down, content with a draw.',
    pers: { ...NEUTRAL, kingSafety: 2.0, kingAttack: 0.6, mobility: 0.8, contempt: -30, aggression: -20 },
    tempMul: 0.8,
  },
  tactician: {
    id: 'tactician',
    label: 'Tactician',
    blurb: 'Hunts captures and checks; opportunistic.',
    pers: { ...NEUTRAL, mobility: 1.5, kingAttack: 1.4, pawnStructure: 0.7, contempt: 10, aggression: 45 },
    tempMul: 1.1,
  },
  endgame: {
    id: 'endgame',
    label: 'Endgame Specialist',
    blurb: 'Simplifies into technical endings it knows well.',
    pers: { ...NEUTRAL, endgame: 1.8, passedPawns: 1.6, pawnStructure: 1.2, kingAttack: 0.8, contempt: 5, aggression: -15 },
    tempMul: 0.9,
  },
  gambiteer: {
    id: 'gambiteer',
    label: 'Gambiteer',
    blurb: 'Gives pawns for time and open lines.',
    pers: { ...NEUTRAL, pawnValue: 0.72, mobility: 1.6, kingAttack: 1.5, centre: 1.2, pawnStructure: 0.6, contempt: 20, aggression: 25 },
    tempMul: 1,
  },
  technician: {
    id: 'technician',
    label: 'Solid Technician',
    blurb: 'Safe, tidy, low-risk chess; punishes loose play.',
    pers: { ...NEUTRAL, pawnStructure: 1.5, kingSafety: 1.4, passedPawns: 1.2, kingAttack: 0.8, aggression: -25, contempt: 0 },
    tempMul: 0.55,
  },
  wildcard: {
    id: 'wildcard',
    label: 'Wildcard',
    blurb: 'Unpredictable but legal; picks offbeat moves.',
    pers: { ...NEUTRAL, centre: 0.7, mobility: 1.2, kingAttack: 1.3, contempt: 20, aggression: 10 },
    tempMul: 2.2,
  },
};
export const STYLE_IDS = Object.keys(STYLES) as StyleId[];

export interface TierDef {
  tier: number;
  nodes: number;
  /** evaluation noise amplitude (cp) */
  noise: number;
  /** softmax temperature (cp); 0 = always best */
  temp: number;
  /** only moves within this many cp of best are candidates */
  margin: number;
}

/** Strength tiers. Calibrated ratings live in calibration.ts (measured, not assumed). */
/**
 * Anchor parameter sets ("old tiers"); the 25 public tiers interpolate between
 * consecutive anchors (log-linear in nodes, linear in noise/temperature/margin),
 * giving finer strength steps for matchmaking. Even tiers equal the anchors.
 */
const ANCHORS = [
  { nodes: 60, noise: 220, temp: 120, margin: 500 },
  { nodes: 150, noise: 160, temp: 90, margin: 350 },
  { nodes: 400, noise: 120, temp: 70, margin: 260 },
  { nodes: 1000, noise: 90, temp: 55, margin: 200 },
  { nodes: 2500, noise: 65, temp: 40, margin: 150 },
  { nodes: 6000, noise: 45, temp: 28, margin: 110 },
  { nodes: 14000, noise: 30, temp: 18, margin: 75 },
  { nodes: 32000, noise: 18, temp: 10, margin: 45 },
  { nodes: 70000, noise: 8, temp: 5, margin: 25 },
  { nodes: 150000, noise: 0, temp: 3, margin: 10 },
  { nodes: 300000, noise: 0, temp: 2, margin: 8 },
  { nodes: 600000, noise: 0, temp: 0, margin: 0 },
  { nodes: 1200000, noise: 0, temp: 0, margin: 0 },
];
export const TIERS: TierDef[] = Array.from({ length: (ANCHORS.length - 1) * 2 + 1 }, (_, t) => {
  const a = ANCHORS[Math.floor(t / 2)];
  if (t % 2 === 0) return { tier: t, ...a };
  const b = ANCHORS[Math.floor(t / 2) + 1];
  return {
    tier: t,
    nodes: Math.round(Math.sqrt(a.nodes * b.nodes)),
    noise: Math.round((a.noise + b.noise) / 2),
    temp: Math.round((a.temp + b.temp) / 2),
    margin: Math.round((a.margin + b.margin) / 2),
  };
});

export interface BotSpec {
  tier: number;
  style: StyleId;
  /** per-game seed: makes the bot's noise stable within a game */
  seed: number;
  /** optional wall-clock cap (ms) derived from the bot's remaining game clock */
  maxMs?: number;
  /** override the tier's node budget (maximum-strength challenge) */
  nodes?: number;
}

export interface BotMoveInfo {
  move: number;
  score: number;
  depth: number;
  nodes: number;
  candidates: number;
}

function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function chooseBotMove(pos: Position, spec: BotSpec, searcher: Searcher): BotMoveInfo {
  const tier = TIERS[Math.max(0, Math.min(TIERS.length - 1, spec.tier))];
  if (tier.tier >= 12 && pos.fullmove <= 3) {
    const bm = bookMove(pos, (spec.seed ^ pos.hashLo) >>> 0);
    if (bm) return { move: bm, score: 0, depth: 0, nodes: 0, candidates: 1 };
  }
  const style = STYLES[spec.style] ?? STYLES.balanced;
  searcher.pers = style.pers;
  searcher.noise = tier.noise * (spec.style === 'wildcard' ? 1.3 : 1);
  searcher.noiseSeed = spec.seed;
  // strong tiers still vary their first few moves slightly (within 15cp) so games differ
  const opening = pos.fullmove <= 3 && tier.temp === 0;
  const wantScores = tier.temp > 0 || style.pers.aggression !== 0 || opening;
  const res = searcher.search(
    pos,
    { nodes: opening ? Math.min(spec.nodes ?? tier.nodes, 60000) : spec.nodes ?? tier.nodes, timeMs: spec.maxMs },
    { rootScores: wantScores, rootMargin: Math.max(opening ? 15 : tier.margin, 60) },
  );
  searcher.noise = 0;
  if (!res.rootScores || res.rootScores.length < 2) {
    return { move: res.move, score: res.score, depth: res.depth, nodes: res.nodes, candidates: 1 };
  }
  // style bias for forcing moves at the root
  const b = pos.board;
  const scored = res.rootScores.map(([m, s]) => {
    let bias = 0;
    if (style.pers.aggression) {
      const cap = b[mTo(m)] !== EMPTY || mFlag(m) === FLAG_EP || mPromo(m) === 5;
      pos.make(m);
      const chk = pos.inCheck();
      pos.unmake();
      if (cap || chk) bias = style.pers.aggression;
    }
    return { m, s, adj: s + bias };
  });
  scored.sort((a, b) => b.adj - a.adj);
  const best = scored[0];
  // never throw away a forced mate, never walk into a mate when avoidable
  if (isMateScore(res.rootScores[0][1]) && res.rootScores[0][1] > 0) {
    return { move: res.rootScores[0][0], score: res.rootScores[0][1], depth: res.depth, nodes: res.nodes, candidates: 1 };
  }
  const T = opening ? 8 : tier.temp * style.tempMul;
  const margin = opening ? 15 : tier.margin * (spec.style === 'wildcard' ? 1.2 : 1);
  const pool = scored.filter((x) => x.adj >= best.adj - margin && !(isMateScore(x.s) && x.s < 0 && !isMateScore(best.s)));
  if (T <= 0 || pool.length === 1) return { move: best.m, score: best.s, depth: res.depth, nodes: res.nodes, candidates: pool.length };
  const rand = mulberry(spec.seed ^ pos.hashLo);
  const w = pool.map((x) => Math.exp((x.adj - best.adj) / T));
  const tot = w.reduce((a, c) => a + c, 0);
  let r = rand() * tot;
  for (let i = 0; i < pool.length; i++) {
    r -= w[i];
    if (r <= 0) return { move: pool[i].m, score: pool[i].s, depth: res.depth, nodes: res.nodes, candidates: pool.length };
  }
  return { move: best.m, score: best.s, depth: res.depth, nodes: res.nodes, candidates: pool.length };
}
