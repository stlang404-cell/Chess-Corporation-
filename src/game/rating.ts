/**
 * Glicko-2 (Glickman 2012) applied per game ("rating period" = one game).
 * Displayed as a familiar Elo-style number. Bots are rated opponents with a
 * fixed, calibrated rating and a small RD reflecting calibration uncertainty.
 */
export interface Rating {
  r: number; // display rating
  rd: number; // rating deviation
  vol: number; // volatility
}

export const START_RATING: Rating = { r: 1000, rd: 300, vol: 0.06 };
export const MIN_RD = 45; // keeps the rating responsive over thousands of games
export const PROVISIONAL_RD = 110; // above this the rating is shown as provisional
export const RATING_FLOOR = 100;
const TAU = 0.5;
const SCALE = 173.7178;

export const isProvisional = (r: Rating) => r.rd > PROVISIONAL_RD;

/** Standard Elo expectation (also what Glicko-2 reduces to at small RD). */
export function expectedScore(ra: number, rb: number, rdB = 0): number {
  const phi = rdB / SCALE;
  const g = 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  return 1 / (1 + Math.exp((-g * (ra - rb)) / SCALE));
}

export function updateRating(player: Rating, oppR: number, oppRd: number, score: number): Rating {
  const mu = (player.r - 1500) / SCALE;
  const phi = player.rd / SCALE;
  const muJ = (oppR - 1500) / SCALE;
  const phiJ = oppRd / SCALE;
  const g = 1 / Math.sqrt(1 + (3 * phiJ * phiJ) / (Math.PI * Math.PI));
  const E = 1 / (1 + Math.exp(-g * (mu - muJ)));
  const v = 1 / (g * g * E * (1 - E));
  const delta = v * g * (score - E);
  // volatility iteration (Illinois algorithm)
  const a = Math.log(player.vol * player.vol);
  const f = (x: number) => {
    const ex = Math.exp(x);
    return (ex * (delta * delta - phi * phi - v - ex)) / (2 * (phi * phi + v + ex) ** 2) - (x - a) / (TAU * TAU);
  };
  let A = a;
  let B: number;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else {
    let k = 1;
    while (f(a - k * TAU) < 0) k++;
    B = a - k * TAU;
  }
  let fA = f(A);
  let fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > 1e-6; i++) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else fA /= 2;
    B = C;
    fB = fC;
  }
  const vol = Math.exp(A / 2);
  const phiStar = Math.sqrt(phi * phi + vol * vol);
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muNew = mu + phiNew * phiNew * g * (score - E);
  return {
    r: Math.max(RATING_FLOOR, muNew * SCALE + 1500),
    rd: Math.max(MIN_RD, Math.min(350, phiNew * SCALE)),
    vol: Math.min(0.12, vol),
  };
}

/** Inactivity: RD grows back toward uncertainty (per idle day). */
export function decayRd(rt: Rating, idleDays: number): Rating {
  if (idleDays <= 0) return rt;
  const c = 12; // rd points per sqrt(day)
  return { ...rt, rd: Math.min(350, Math.sqrt(rt.rd * rt.rd + c * c * idleDays)) };
}

/** Performance rating of a set of results (for tournaments / analysis). */
export function performanceRating(games: { opp: number; score: number }[]): number {
  if (!games.length) return 0;
  // solve sum(E) = sum(score) by bisection
  const total = games.reduce((a, g) => a + g.score, 0);
  const clamped = Math.min(games.length - 0.25, Math.max(0.25, total));
  let lo = -1000;
  let hi = 5000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const e = games.reduce((a, g) => a + expectedScore(mid, g.opp), 0);
    if (e < clamped) lo = mid;
    else hi = mid;
  }
  return Math.round((lo + hi) / 2);
}
