/**
 * Match settlement: a PURE function from (save, finished match) to a new save
 * plus a report. Idempotent by match id — settling the same match twice
 * returns the unchanged save and `duplicate: true`. The caller persists the
 * returned save in a single write, so rating, merit, rank and dollars are
 * always committed together.
 */
import { expectedScore, updateRating } from './rating';
import { meritDelta, meritNeeded, ratingGate, seriesLength, rankInfo, arenaForRank, fastTrack } from './career';
import { computePay, promotionBonus, type PayLine } from './economy';
import { newAchievements } from './achievements';
import { emptyWLD, seasonKey, type ActiveMatch, type MatchSummary, type SaveData } from './state';

export interface SettlementReport {
  matchId: string;
  rated: boolean;
  score: 0 | 0.5 | 1;
  termination: string;
  expected: number;
  ratingBefore: number;
  ratingAfter: number;
  provisionalBefore: boolean;
  meritBefore: number;
  meritAfter: number;
  meritNeeded: number;
  meritChange: number;
  rankBefore: number;
  rankAfter: number;
  promoted: boolean;
  demoted: boolean;
  seriesStarted: boolean;
  series: SaveData['career']['series'];
  seriesResult: 'passed' | 'failed' | null;
  gateBlocked: number | null;
  pay: PayLine[];
  dollars: number;
  achievements: { id: string; name: string; reward: number }[];
  accuracy?: number;
}

export function playerMoveCount(m: ActiveMatch): number {
  // white moves at even indices
  return m.playerColor === 0 ? Math.ceil(m.moves.length / 2) : Math.floor(m.moves.length / 2);
}

export function settleMatch(
  save: SaveData,
  match: ActiveMatch,
  now = Date.now(),
): { save: SaveData; report: SettlementReport | null; duplicate: boolean } {
  if (!match.finished) throw new Error('match not finished');
  if (save.settled.includes(match.id)) return { save, report: null, duplicate: true };
  const s: SaveData = structuredClone(save);
  const fin = match.finished;
  const score = fin.score;
  const opp = match.opponent;
  const rated = match.kind === 'ranked' || match.kind === 'series';
  const R0 = s.rating.r;
  const E = expectedScore(R0, opp.rating, opp.rd);
  const rankBefore = s.career.rank;
  const meritBefore = s.career.merit;
  const provisionalBefore = s.rating.rd > 110;
  let promoted = false;
  let demoted = false;
  let seriesStarted = false;
  let seriesResult: SettlementReport['seriesResult'] = null;
  let gateBlocked: number | null = null;
  const pay: PayLine[] = [];
  const pmoves = playerMoveCount(match);
  const arena = arenaForRank(rankBefore).index;

  s.stats.games++;
  if (rated) {
    s.rating = updateRating(s.rating, opp.rating, opp.rd, score);
    s.peakRating = Math.max(s.peakRating, s.rating.r);
    s.stats.ratingHistory.push(Math.round(s.rating.r));
    if (s.stats.ratingHistory.length > 500) s.stats.ratingHistory.splice(0, s.stats.ratingHistory.length - 500);
    const bump = (w: typeof s.stats.rated) => {
      w.g++;
      if (score === 1) w.w++;
      else if (score === 0) w.l++;
      else w.d++;
    };
    bump(s.stats.rated);
    bump((s.stats.byArena[arena] ??= emptyWLD()));
    bump((s.stats.byStyle[opp.style] ??= emptyWLD()));
    if (score === 1) s.stats.streak = s.stats.streak > 0 ? s.stats.streak + 1 : 1;
    else if (score === 0) s.stats.streak = s.stats.streak < 0 ? s.stats.streak - 1 : -1;
    else s.stats.streak = 0;
    s.stats.bestStreak = Math.max(s.stats.bestStreak, s.stats.streak);
    if (score === 1 && opp.rating - R0 >= 200) s.stats.upsets++;
    if (score === 1 && fin.termination === 'checkmate') s.stats.checkmates++;
    if (score === 1) s.stats.bestWinRating = Math.max(s.stats.bestWinRating, opp.rating);
    if (fin.accuracy !== undefined && pmoves >= 10) {
      s.stats.accuracySum += fin.accuracy;
      s.stats.accuracyN++;
    }
    const sk = seasonKey(now);
    const season = (s.stats.seasons[sk] ??= { peak: 0, games: 0, wins: 0 });
    season.games++;
    if (score === 1) season.wins++;
    season.peak = Math.max(season.peak, Math.round(s.rating.r));

    // ----- career -----
    const c = s.career;
    const promoteTo = (n: number) => {
      c.rank = n;
      c.highestRank = Math.max(c.highestRank, n);
      c.promotions.push({ rank: n, at: now, game: s.stats.rated.g });
      promoted = true;
      const info = rankInfo(n);
      pay.push({ key: 'promotion', label: `Promotion: ${info.full}`, amount: promotionBonus(n, info.majorEntry) });
    };
    if (c.series && match.kind === 'series') {
      c.series.games++;
      c.series.wins += score;
      const need = Math.floor(c.series.length / 2) + 1;
      const remaining = c.series.length - c.series.games;
      if (c.series.wins >= need) {
        const target = c.series.targetRank;
        c.series = null;
        c.merit = 0;
        promoteTo(target);
        seriesResult = 'passed';
      } else if (c.series.wins + remaining < need) {
        c.series = null;
        c.merit = Math.round(meritNeeded(c.rank) * 0.6);
        c.seriesFailures++;
        seriesResult = 'failed';
      }
    } else {
      const md = meritDelta(score, E);
      c.merit += md > 0 ? Math.round(md * fastTrack(s.rating.r, c.rank)) : md;
      if (score > 0) c.probation = 0;
      if (c.merit < 0) {
        c.merit = 0;
        if (score === 0) c.probation++;
        // demotion only within a title, after three losses at zero merit
        if (c.probation >= 3 && rankInfo(c.rank).grade > 0) {
          c.rank--;
          c.merit = Math.round(meritNeeded(c.rank) * 0.5);
          c.probation = 0;
          demoted = true;
        }
      }
      while (c.merit >= meritNeeded(c.rank)) {
        const next = c.rank + 1;
        const gate = ratingGate(next);
        if (s.rating.r < gate) {
          c.merit = meritNeeded(c.rank);
          gateBlocked = gate;
          break;
        }
        const len = seriesLength(next);
        if (len > 0) {
          c.series = { targetRank: next, length: len, wins: 0, games: 0 };
          c.merit = meritNeeded(c.rank);
          seriesStarted = true;
          break;
        }
        c.merit -= meritNeeded(c.rank);
        promoteTo(next);
      }
    }
    const rematchCount = s.rematch && s.rematch.oppId === opp.id ? s.rematch.count : 0;
    pay.unshift(
      ...computePay({
        rank: rankBefore,
        score,
        expected: E,
        playerRating: R0,
        oppRating: opp.rating,
        playerMoves: pmoves,
        accuracy: fin.accuracy,
        rematchCount,
        rated,
      }),
    );
  }

  const summary: MatchSummary = {
    id: match.id,
    kind: match.kind,
    at: now,
    oppId: opp.id,
    oppName: opp.name,
    oppRating: opp.rating,
    oppStyle: opp.style,
    color: match.playerColor,
    score,
    termination: fin.termination,
    ratingAfter: Math.round(s.rating.r),
    ratingDelta: Math.round(s.rating.r - R0),
    dollars: 0,
    arena,
    moves: match.moves.slice(),
    accuracy: fin.accuracy,
  };

  // achievements (evaluated after stats update)
  const ach = rated ? newAchievements(s, summary) : [];
  for (const a of ach) {
    s.achievements[a.id] = now;
    pay.push({ key: 'achievement', label: `Achievement: ${a.name}`, amount: a.reward });
  }
  const dollars = pay.reduce((a, l) => a + l.amount, 0);
  s.wallet.balance += dollars;
  s.wallet.lifetime += dollars;
  summary.dollars = dollars;
  // second pass for wealth-based achievements
  if (rated)
    for (const a of newAchievements(s, summary)) {
      s.achievements[a.id] = now;
      pay.push({ key: 'achievement', label: `Achievement: ${a.name}`, amount: a.reward });
      s.wallet.balance += a.reward;
      s.wallet.lifetime += a.reward;
      summary.dollars += a.reward;
    }

  s.history.unshift(summary);
  if (s.history.length > 200) s.history.length = 200;
  const key = String(opp.id);
  const o = (s.opponents[key] ??= { id: opp.id, tier: opp.tier, style: opp.style, name: opp.name, rating: opp.rating, ...emptyWLD(), last: 0 });
  o.g++;
  if (score === 1) o.w++;
  else if (score === 0) o.l++;
  else o.d++;
  o.last = now;
  o.tier = opp.tier;
  o.rating = opp.rating;
  s.rematch = s.rematch && s.rematch.oppId === opp.id ? { oppId: opp.id, count: s.rematch.count + 1 } : { oppId: opp.id, count: 1 };
  s.settled.push(match.id);
  if (s.settled.length > 1000) s.settled.splice(0, s.settled.length - 1000);
  if (s.active && s.active.id === match.id) s.active = null;
  s.lastPlayedAt = now;

  return {
    save: s,
    duplicate: false,
    report: {
      matchId: match.id,
      rated,
      score,
      termination: fin.termination,
      expected: E,
      ratingBefore: R0,
      ratingAfter: s.rating.r,
      provisionalBefore,
      meritBefore,
      meritAfter: s.career.merit,
      meritNeeded: meritNeeded(s.career.rank),
      meritChange: s.career.merit - meritBefore,
      rankBefore,
      rankAfter: s.career.rank,
      promoted,
      demoted,
      seriesStarted,
      series: s.career.series,
      seriesResult,
      gateBlocked,
      pay,
      dollars: summary.dollars,
      achievements: ach.map((a) => ({ id: a.id, name: a.name, reward: a.reward })),
      accuracy: fin.accuracy,
    },
  };
}
