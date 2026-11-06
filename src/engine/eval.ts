/**
 * Static evaluation for SEVEN. Tapered middlegame/endgame score, returned from
 * the side-to-move's perspective in centipawns.
 *
 * Every positional term is multiplied by a Personality weight so that playing
 * styles are real differences in what the engine values, not just labels.
 */
import {
  Position,
  SQUARES,
  WHITE,
  BLACK,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  EMPTY,
  OFF,
  KNIGHT_D,
  KING_D,
  DIAG_D,
  ORTH_D,
  fileOf,
  rankOf,
  sq,
  FILES,
  RANKS,
} from './board';

export interface Personality {
  /** multiplies piece-square / centralisation terms */
  centre: number;
  mobility: number;
  /** own king shelter */
  kingSafety: number;
  /** pressure on the enemy king */
  kingAttack: number;
  pawnStructure: number;
  passedPawns: number;
  /** extra endgame technique: king activity, mop-up */
  endgame: number;
  /** centipawns a draw is worth *against* the engine (positive = avoids draws) */
  contempt: number;
  /** root-only preference for captures and checks, in centipawns */
  aggression: number;
  /** multiplier on pawn material (gambit players value pawns less than activity) */
  pawnValue: number;
}

export const NEUTRAL: Personality = {
  centre: 1,
  mobility: 1,
  kingSafety: 1,
  kingAttack: 1,
  pawnStructure: 1,
  passedPawns: 1,
  endgame: 1,
  contempt: 0,
  aggression: 0,
  pawnValue: 1,
};

// Material values (mg, eg). Indexed by piece type.
export const MAT_MG = [0, 88, 315, 320, 470, 900, 0];
export const MAT_EG = [0, 115, 290, 320, 520, 940, 0];
const PHASE_W = [0, 0, 1, 1, 2, 4, 0];
// Starting phase for a 7-piece back rank: 2 minors... computed per position max 16
const PHASE_MAX = 16;

// Piece-square tables generated from geometry, white perspective, indexed by mailbox square.
const PST_MG: Int16Array[] = [];
const PST_EG: Int16Array[] = [];
for (let t = 0; t <= 6; t++) {
  PST_MG.push(new Int16Array(99));
  PST_EG.push(new Int16Array(99));
}
const CENTER = (FILES - 1) / 2;
for (const s of SQUARES) {
  const f = fileOf(s);
  const r = rankOf(s);
  const df = Math.abs(f - CENTER);
  const dr = Math.abs(r - CENTER);
  const cheb = Math.max(df, dr);
  const manh = df + dr;
  // pawns: advancement plus central files
  const pAdv = [0, 0, 6, 14, 28, 50, 0][r];
  const pAdvEg = [0, 0, 8, 22, 45, 80, 0][r];
  PST_MG[PAWN][s] = pAdv + (df < 1 && r >= 2 ? 10 : df < 2 && r >= 2 ? 4 : 0) - (df < 1 && r === 1 ? 4 : 0);
  PST_EG[PAWN][s] = pAdvEg;
  PST_MG[KNIGHT][s] = [18, 10, -4, -22][Math.round(cheb)] - (r === 0 ? 6 : 0);
  PST_EG[KNIGHT][s] = [12, 6, -4, -16][Math.round(cheb)];
  PST_MG[BISHOP][s] = [10, 8, 2, -8][Math.round(cheb)];
  PST_EG[BISHOP][s] = [8, 6, 0, -8][Math.round(cheb)];
  PST_MG[ROOK][s] = (r === RANKS - 2 ? 16 : 0) + (df < 2 ? 4 : 0);
  PST_EG[ROOK][s] = r === RANKS - 2 ? 12 : 0;
  PST_MG[QUEEN][s] = [4, 4, 0, -6][Math.round(cheb)] - (r === 0 ? 0 : 2);
  PST_EG[QUEEN][s] = [10, 6, 0, -8][Math.round(cheb)];
  PST_MG[KING][s] = (r === 0 ? 0 : r === 1 ? -18 : -45) + (df >= 2 ? 12 : df >= 1 ? 4 : -4);
  PST_EG[KING][s] = [24, 14, 0, -20][Math.round(cheb)] - manh;
}
/** mirror a square vertically for black */
const MIRROR = new Int8Array(99);
for (const s of SQUARES) MIRROR[s] = sq(fileOf(s), RANKS - 1 - rankOf(s));

/** NEAR[k*99+s] = 1 when s is within one king step of k */
const NEAR = new Uint8Array(99 * 99);
for (const k of SQUARES)
  for (const t of SQUARES)
    if (Math.abs(fileOf(k) - fileOf(t)) <= 1 && Math.abs(rankOf(k) - rankOf(t)) <= 1) NEAR[k * 99 + t] = 1;

const PASSED_MG = [0, 4, 10, 20, 36, 60, 0];
const PASSED_EG = [0, 12, 24, 44, 80, 130, 0];

/** Feature switches for A/B testing evaluation terms (research only; all on in play). */
export const EVAL_OPTS = { outposts: true, attackerWeight: true, rookBehind: true, squareRule: true, drawScaling: true };

const ATTACKER_WEIGHT = [0, 25, 60, 85, 100, 110, 115, 120];
const passedSq = [new Int32Array(8), new Int32Array(8)];
const nPassed = [0, 0];
const pawnFiles = [new Int8Array(FILES + 2), new Int8Array(FILES + 2)];
const pawnMinRank = [new Int8Array(FILES + 2), new Int8Array(FILES + 2)];
const pawnMaxRank = [new Int8Array(FILES + 2), new Int8Array(FILES + 2)];

export function evaluate(pos: Position, pers: Personality = NEUTRAL): number {
  const b = pos.board;
  let mg = 0;
  let eg = 0;
  let phase = 0;
  let mob = 0;
  let mobEg = 0;
  const bishops = [0, 0];

  nPassed[0] = nPassed[1] = 0;
  // pawn file maps (files shifted by +1 for sentinel neighbours)
  for (let c = 0; c < 2; c++) {
    pawnFiles[c].fill(0);
    pawnMinRank[c].fill(99);
    pawnMaxRank[c].fill(-1);
  }
  for (const s of SQUARES) {
    const pc = b[s];
    if ((pc & 7) !== PAWN) continue;
    const c = pc >> 3;
    const f = fileOf(s) + 1;
    const r = rankOf(s);
    pawnFiles[c][f]++;
    if (r < pawnMinRank[c][f]) pawnMinRank[c][f] = r;
    if (r > pawnMaxRank[c][f]) pawnMaxRank[c][f] = r;
  }

  let pst = 0;
  let pstEg = 0;
  let pawnsMg = 0;
  let pawnsEg = 0;
  let passMg = 0;
  let passEg = 0;
  const attackUnits = [0, 0];
  const attackers = [0, 0];
  const bishopColors = [0, 0]; // bit 1 = dark-square bishop, bit 2 = light
  const rooksBehind = [0, 0];
  const kz = [pos.kingSq[WHITE], pos.kingSq[BLACK]];

  for (let i = 0; i < SQUARES.length; i++) {
    const s = SQUARES[i];
    const pc = b[s];
    if (pc === EMPTY) continue;
    const t = pc & 7;
    const c = pc >> 3;
    const sign = c === WHITE ? 1 : -1;
    const ps = c === WHITE ? s : MIRROR[s];
    const pv = t === PAWN ? pers.pawnValue : 1;
    mg += sign * MAT_MG[t] * pv;
    eg += sign * MAT_EG[t] * pv;
    phase += PHASE_W[t];
    pst += sign * PST_MG[t][ps];
    pstEg += sign * PST_EG[t][ps];
    const enemyK = kz[c ^ 1];
    if (t === PAWN) {
      const f = fileOf(s) + 1;
      const r = rankOf(s);
      const rel = c === WHITE ? r : RANKS - 1 - r;
      if (pawnFiles[c][f] > 1) {
        pawnsMg -= sign * 10;
        pawnsEg -= sign * 16;
      }
      if (pawnFiles[c][f - 1] === 0 && pawnFiles[c][f + 1] === 0) {
        pawnsMg -= sign * 10;
        pawnsEg -= sign * 12;
      }
      // passed?
      const e = c ^ 1;
      let passed = true;
      for (let ff = f - 1; ff <= f + 1 && passed; ff++) {
        if (pawnFiles[e][ff] === 0) continue;
        if (c === WHITE ? pawnMaxRank[e][ff] > r : pawnMinRank[e][ff] < r) passed = false;
      }
      if (passed) {
        // rook behind its own passed pawn
        const back = c === WHITE ? -9 : 9;
        for (let t2 = s + back; b[t2] !== OFF; t2 += back) {
          if (b[t2] === EMPTY) continue;
          if (b[t2] === ((c << 3) | ROOK)) rooksBehind[c]++;
          break;
        }
        passedSq[c][nPassed[c]++] = s;
        let bm = PASSED_MG[rel];
        let be = PASSED_EG[rel];
        const stop = s + (c === WHITE ? 9 : -9);
        if (b[stop] !== EMPTY) {
          bm >>= 1;
          be >>= 1;
        }
        // king proximity in endgames
        const ownK = kz[c];
        const dOwn = Math.max(Math.abs(fileOf(ownK) - fileOf(stop)), Math.abs(rankOf(ownK) - rankOf(stop)));
        const dEnemy = Math.max(Math.abs(fileOf(enemyK) - fileOf(stop)), Math.abs(rankOf(enemyK) - rankOf(stop)));
        be += (dEnemy * 5 - dOwn * 3) * rel * 0.5 * pers.endgame;
        passMg += sign * bm;
        passEg += sign * be;
      }
      continue;
    }
    if (t === KING) continue;
    // mobility & king attack for pieces
    let m = 0;
    let att = 0;
    const zone = enemyK * 99;
    if (t === KNIGHT) {
      for (let j = 0; j < 8; j++) {
        const to = s + KNIGHT_D[j];
        const tp = b[to];
        if (tp === OFF) continue;
        if (tp === EMPTY || tp >> 3 !== c) m++;
        att += NEAR[zone + to];
      }
      mob += sign * (m - 4) * 4;
      mobEg += sign * (m - 4) * 4;
      // outpost: advanced, pawn-supported, cannot be chased by enemy pawns
      const rel = c === WHITE ? rankOf(s) : RANKS - 1 - rankOf(s);
      if (EVAL_OPTS.outposts && rel >= 3 && rel <= 5) {
        const back = c === WHITE ? -9 : 9;
        const own = (c << 3) | PAWN;
        if (b[s + back - 1] === own || b[s + back + 1] === own) {
          const f = fileOf(s) + 1;
          const e = c ^ 1;
          let chased = false;
          for (const ff of [f - 1, f + 1]) {
            if (!pawnFiles[e][ff]) continue;
            if (c === WHITE ? pawnMaxRank[e][ff] > rankOf(s) : pawnMinRank[e][ff] < rankOf(s)) chased = true;
          }
          if (!chased) mob += sign * 18;
        }
      }
    } else {
      const D = t === BISHOP ? DIAG_D : t === ROOK ? ORTH_D : KING_D;
      for (let j = 0; j < D.length; j++) {
        const d = D[j];
        let to = s + d;
        while (true) {
          const tp = b[to];
          if (tp === OFF) break;
          if (tp === EMPTY || tp >> 3 !== c) m++;
          att += NEAR[zone + to];
          if (tp !== EMPTY) break;
          to += d;
        }
      }
      if (t === BISHOP) {
        bishops[c]++;
        bishopColors[c] |= (fileOf(s) + rankOf(s)) % 2 === 0 ? 1 : 2;
        mob += sign * (m - 5) * 4;
        mobEg += sign * (m - 5) * 4;
      } else if (t === ROOK) {
        mob += sign * (m - 6) * 2;
        mobEg += sign * (m - 6) * 4;
        const f = fileOf(s) + 1;
        if (pawnFiles[c][f] === 0) mob += sign * (pawnFiles[c ^ 1][f] === 0 ? 18 : 9);
      } else {
        mob += sign * (m - 10) * 1;
        mobEg += sign * (m - 10) * 2;
      }
    }
    attackUnits[c] += att * (t === QUEEN ? 4 : t === ROOK ? 3 : 2);
    if (att) attackers[c]++;
  }

  if (bishops[WHITE] >= 2) {
    mg += 25;
    eg += 40;
  }
  if (bishops[BLACK] >= 2) {
    mg -= 25;
    eg -= 40;
  }

  // king shelter (middlegame)
  let shelter = 0;
  for (let c = 0; c < 2; c++) {
    const k = kz[c];
    const sign = c === WHITE ? 1 : -1;
    const fwd = c === WHITE ? 9 : -9;
    const own = (c << 3) | PAWN;
    let sh = 0;
    for (const d of [fwd - 1, fwd, fwd + 1]) {
      if (b[k + d] === own) sh += 12;
      else if (b[k + d + fwd] === own) sh += 5;
      else if (b[k + d] !== OFF) sh -= 6;
    }
    // open file next to king
    const f = fileOf(k) + 1;
    if (pawnFiles[c][f] === 0) sh -= 15;
    shelter += sign * sh;
  }
  const atkW = attackUnits[WHITE];
  const atkB = attackUnits[BLACK];
  // attacks only become dangerous with several attackers (one piece alone rarely mates)
  const kingAtk = EVAL_OPTS.attackerWeight
    ? (((atkW * atkW) >> 2) * ATTACKER_WEIGHT[Math.min(7, attackers[WHITE])]) / 100 -
      (((atkB * atkB) >> 2) * ATTACKER_WEIGHT[Math.min(7, attackers[BLACK])]) / 100
    : ((atkW * atkW) >> 2) - ((atkB * atkB) >> 2);
  const rookPass = EVAL_OPTS.rookBehind ? (rooksBehind[WHITE] - rooksBehind[BLACK]) * 20 : 0;

  if (phase > PHASE_MAX) phase = PHASE_MAX;
  const ph = phase; // PHASE_MAX = opening, 0 = bare endgame

  let mgScore =
    mg +
    pst * pers.centre +
    mob * pers.mobility +
    pawnsMg * pers.pawnStructure +
    passMg * pers.passedPawns +
    shelter * pers.kingSafety +
    kingAtk * pers.kingAttack;
  let egScore = eg + rookPass + pstEg * pers.centre * (0.5 + 0.5 * pers.endgame) + mobEg * pers.mobility + pawnsEg * pers.pawnStructure + passEg * pers.passedPawns;

  // mop-up: drive the lone enemy king to the edge when far ahead
  const matDiff = eg;
  if (Math.abs(matDiff) > 400 && ph <= 6) {
    const strong = matDiff > 0 ? WHITE : BLACK;
    const wk = kz[strong];
    const lk = kz[strong ^ 1];
    const edge = Math.max(Math.abs(fileOf(lk) - CENTER), Math.abs(rankOf(lk) - CENTER));
    const dist = Math.max(Math.abs(fileOf(wk) - fileOf(lk)), Math.abs(rankOf(wk) - rankOf(lk)));
    const mop = (edge * 14 + (6 - dist) * 6) * pers.endgame;
    egScore += strong === WHITE ? mop : -mop;
  }

  // pawn endings: a passed pawn the enemy king cannot catch (rule of the square)
  const cnt = pos.counts;
  const pieces = (col: number) => cnt[(col << 3) | KNIGHT] + cnt[(col << 3) | BISHOP] + cnt[(col << 3) | ROOK] + cnt[(col << 3) | QUEEN];
  for (let col = 0; col < 2; col++) {
    if (!EVAL_OPTS.squareRule || pieces(col ^ 1) !== 0) continue;
    for (let i = 0; i < nPassed[col]; i++) {
      const sq0 = passedSq[col][i];
      const promoRank = col === WHITE ? RANKS - 1 : 0;
      let dist = Math.abs(promoRank - rankOf(sq0));
      if (rankOf(sq0) === (col === WHITE ? 1 : RANKS - 2) && pos.rules.pawnDouble) dist--;
      const ek = kz[col ^ 1];
      const kd = Math.max(Math.abs(fileOf(ek) - fileOf(sq0)), Math.abs(promoRank - rankOf(ek)));
      if (kd - (pos.side === col ? 0 : 1) > dist) {
        egScore += col === WHITE ? 400 : -400;
        break;
      }
    }
  }

  let score = (mgScore * ph + egScore * (PHASE_MAX - ph)) / PHASE_MAX;
  // opposite-coloured bishops with no other pieces: very drawish
  if (
    EVAL_OPTS.drawScaling &&
    cnt[KNIGHT] + cnt[ROOK] + cnt[QUEEN] + cnt[8 | KNIGHT] + cnt[8 | ROOK] + cnt[8 | QUEEN] === 0 &&
    cnt[BISHOP] === 1 &&
    cnt[8 | BISHOP] === 1 &&
    bishopColors[WHITE] !== bishopColors[BLACK]
  )
    score *= 0.5;
  // K+B+N vs K with a light-squared bishop cannot force mate: every 7×7 corner is dark
  for (let col = 0; col < 2; col++) {
    const o = col << 3;
    if (
      cnt[o | BISHOP] === 1 && cnt[o | KNIGHT] === 1 && cnt[o | PAWN] + cnt[o | ROOK] + cnt[o | QUEEN] === 0 &&
      pieces(col ^ 1) + cnt[((col ^ 1) << 3) | PAWN] === 0 && bishopColors[col] === 2
    )
      score /= 16;
  }
  // drawish material: no pawns and small advantage
  const c = cnt;
  if (score > 0 && c[PAWN] === 0 && MAT_EG[ROOK] > matDiff) score /= 4;
  if (score < 0 && c[8 | PAWN] === 0 && -MAT_EG[ROOK] < matDiff) score /= 4;
  score = score | 0;
  // side-to-move perspective plus a small tempo bonus
  return (pos.side === WHITE ? score : -score) + 10;
}

export function evaluateWhite(pos: Position, pers: Personality = NEUTRAL): number {
  const s = evaluate(pos, pers);
  return pos.side === WHITE ? s : -s;
}
