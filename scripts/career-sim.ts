/**
 * Career & economy simulation through the REAL game logic (matchmaking,
 * Glicko-2, merit, promotions, series, payouts, achievements). Only the chess
 * result is abstracted: P(win/draw/loss) from the Elo expectation between the
 * simulated player's true strength and the opponent's calibrated rating, with
 * a draw rate taken from bot self-play (~20%, lower in lopsided games).
 *
 * Usage: tsx scripts/career-sim.ts [games=3000] [players per strength=8]
 */
import { newSave, type ActiveMatch, type SaveData } from '../src/game/state';
import { settleMatch } from '../src/game/settle';
import { findOpponent } from '../src/game/matchmaking';
import { expectedScore } from '../src/game/rating';
import { rankInfo, rankLine, AUTHORED_RANKS, authoredTitleCount } from '../src/game/career';
import { STORE } from '../src/game/store';
import { writeFileSync } from 'node:fs';
import { CALIBRATION } from '../src/engine/calibration';

const GAMES = +(process.argv[2] ?? 3000);
const PER = +(process.argv[3] ?? 8);
let seed = 12345;
const rand = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff);

function outcome(trueR: number, oppR: number, behaviour: 'normal' | 'resign10'): { score: 0 | 0.5 | 1; plies: number } {
  if (behaviour === 'resign10') return { score: 0, plies: 20 };
  const E = expectedScore(trueR, oppR);
  const pd = 0.22 * (1 - Math.abs(2 * E - 1));
  const pw = E - pd / 2;
  const u = rand();
  const plies = 40 + Math.floor(rand() * 90);
  if (u < pw) return { score: 1, plies };
  if (u < pw + pd) return { score: 0.5, plies };
  return { score: 0, plies };
}

const MILESTONE_TI: [string, number][] = [
  ['Team lead', 5], ['Manager', 6], ['Director', 8], ['Vice president', 10], ['Chief officer', 13],
  ['CEO (home company)', 17], ['First institution', 18], ['Multinational CEO', 18 + 34 * 2 + 1], ['World Holdings CEO', 18 + 45 * 2 + 1],
];
const MILESTONES = MILESTONE_TI.map((m) => m[0]);

interface Run {
  strength: number;
  finalRating: number;
  finalRank: number;
  finalTitle: string;
  milestones: Record<string, number>;
  lifetime: number;
  promotions: number;
  seriesFails: number;
  rankAt: Record<number, number>;
  dollarsAt: Record<number, number>;
}

function simulate(strength: number, behaviour: 'normal' | 'resign10' = 'normal', games = GAMES): Run {
  let s: SaveData = newSave(0);
  const milestones: Record<string, number> = {};
  const rankAt: Record<number, number> = {};
  const dollarsAt: Record<number, number> = {};
  for (let g = 1; g <= games; g++) {
    const opp = findOpponent(s, rand);
    const { score, plies } = outcome(strength, opp.rating, behaviour);
    const kind = s.career.series ? 'series' : 'ranked';
    const color = (g % 2) as 0 | 1;
    const acc = Math.max(20, Math.min(99, 55 + (strength - 400) / 50 + (rand() - 0.5) * 20));
    const m: ActiveMatch = {
      id: 'g' + g,
      kind,
      opponent: opp,
      playerColor: color,
      moves: new Array(plies).fill('a2a3'),
      clocks: [0, 0],
      tc: '5+3',
      startedAt: g,
      seed: 1,
      finished: { score, termination: score === 0.5 ? 'repetition' : behaviour === 'resign10' ? 'resignation' : 'checkmate', endedAt: g, accuracy: acc },
      drawOffers: 0,
      undos: 0,
    };
    s = settleMatch(s, m, g * 600_000).save;
    // keep the save small during long sims
    s.history.length = Math.min(s.history.length, 3);
    const hti = rankInfo(s.career.highestRank).titleIndex;
    for (const [name, ti] of MILESTONE_TI) if (hti >= ti && !(name in milestones)) milestones[name] = g;
    if ([50, 100, 250, 500, 1000, 2000, 3000, 5000, 10000].includes(g)) {
      rankAt[g] = s.career.rank;
      dollarsAt[g] = s.wallet.lifetime;
    }
  }
  return {
    strength,
    finalRating: Math.round(s.rating.r),
    finalRank: s.career.rank,
    finalTitle: rankLine(s.career.rank),
    milestones,
    lifetime: s.wallet.lifetime,
    promotions: s.career.promotions.length,
    seriesFails: s.career.seriesFailures,
    rankAt,
    dollarsAt,
  };
}

// simulated true strengths span the calibrated bot scale
const TRS = CALIBRATION.tierRatings;
const strengths = [2, 6, 10, 14, 18, 22, 24].map((t) => TRS[t]);
const rows: string[] = [];
const median = (a: number[]) => {
  const b = a.slice().sort((x, y) => x - y);
  return b.length ? b[Math.floor(b.length / 2)] : NaN;
};
rows.push(`# Career simulation (generated ${new Date().toISOString().slice(0, 10)})`, '');
rows.push(`${PER} simulated players per true strength, ${GAMES} rated matches each, through the real matchmaking/rating/career/economy code.`);
rows.push('Match results are sampled from the Elo expectation (draw rate ≈22% for even games). Medians shown.', '');
rows.push('| True strength | Final rating | Rank @100 | Rank @500 | Rank @1000 | Rank @' + GAMES + ' | Final title | Promotions | Series fails | Lifetime $ |');
rows.push('|---|---|---|---|---|---|---|---|---|---|');
const msRows: string[] = [];
for (const st of strengths) {
  const runs = Array.from({ length: PER }, () => simulate(st));
  const med = (f: (r: Run) => number) => median(runs.map(f));
  const finalRank = med((r) => r.finalRank);
  rows.push(
    `| ${st} | ${med((r) => r.finalRating)} | ${med((r) => r.rankAt[100] ?? 0)} | ${med((r) => r.rankAt[500] ?? 0)} | ${med((r) => r.rankAt[1000] ?? 0)} | ${finalRank} | ${rankLine(finalRank)} | ${med((r) => r.promotions)} | ${med((r) => r.seriesFails)} | $${med((r) => r.lifetime).toLocaleString('en-US')} |`,
  );
  msRows.push(
    `| ${st} | ${MILESTONES.map((m) => {
      const v = runs.map((r) => r.milestones[m]).filter((x) => x !== undefined);
      return v.length >= PER / 2 ? String(median(v)) : v.length ? `(${v.length}/${PER})` : '—';
    }).join(' | ')} |`,
  );
  console.error('done', st);
}
rows.push('', '## Match number at which each title was first reached (median; "—" = never within the horizon)', '');
rows.push(`| Strength | ${MILESTONES.join(' | ')} |`);
rows.push(`|---|${MILESTONES.map(() => '---').join('|')}|`);
rows.push(...msRows);

// exploit checks
const honest = simulate(TRS[10], 'normal', 300);
const resign = simulate(TRS[10], 'resign10', 300);
rows.push('', '## Exploit checks (300 matches, true strength ' + TRS[10] + ')', '');
rows.push(`- Playing normally: lifetime $${honest.lifetime.toLocaleString('en-US')}, rank ${honest.finalRank}.`);
rows.push(`- Resigning every game at move 10 (salary farming): lifetime $${resign.lifetime.toLocaleString('en-US')}, rank ${resign.finalRank}, rating ${resign.finalRating}.`);
const storeTotal = STORE.reduce((a, i) => a + i.price, 0);
rows.push('', `Store catalogue total: $${storeTotal.toLocaleString('en-US')}. Authored ranks: ${AUTHORED_RANKS}; authored titles: ${authoredTitleCount()}.`);
writeFileSync('research/career-sim.md', rows.join('\n') + '\n');
console.log(rows.join('\n'));
