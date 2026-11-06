/**
 * Match settlement: a PURE function from (save, finished match) to a new save
 * plus a report. Idempotent by match id — settling the same match twice
 * returns the unchanged save and `duplicate: true`. The caller persists the
 * returned save in a single write, so rating, merit, rank and dollars are
 * always committed together.
 */
import { expectedScore, updateRating } from './rating';
import { meritDelta, meritNeeded, ratingGate, seriesLength, rankInfo, rankLine, arenaForRank, fastTrack, MAX_RANK } from './career';
import { computePay, computePayV3, PAY_FORMULA, promotionBonus, type PayLine } from './economy';
import { freshContracts, advanceContracts, makeContract, unavailableKinds } from './contracts';
import { salary } from './career';
import { newAchievements } from './achievements';
import { DISTINCTIONS, type HonourContext } from './honours';
import { grantEarned } from './store';
import { emptyWLD, seasonKey, type CompactReview, isRatedKind, CUP_ROUNDS, CUP_EVERY, type ActiveMatch, type MatchSummary, type SaveData } from './state';

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
  cupResult: 'advanced' | 'won' | 'eliminated' | null;
  contracts: string[];
  /** honours earned in this game, and earned-only cosmetics they unlocked */
  honours: string[];
  unlocked: string[];
  review: CompactReview | null;
  cupRound: number | null;
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
  const rated = isRatedKind(match.kind);
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
  let cupResult: SettlementReport['cupResult'] = null;
  const completedContracts: string[] = [];
  const newHonours: string[] = [];
  const unlockedItems: string[] = [];
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
      const info = rankInfo(n, c.family);
      c.promotions[c.promotions.length - 1].title = rankLine(n, c.family);
      if (c.promotions.length > 2000) c.promotions.splice(0, c.promotions.length - 2000);
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
        if (c.probation >= 3 && rankInfo(c.rank, c.family).grade > 0) {
          c.rank--;
          c.merit = Math.round(meritNeeded(c.rank) * 0.5);
          c.probation = 0;
          demoted = true;
        }
      }
      while (c.merit >= meritNeeded(c.rank) && c.rank < MAX_RANK) {
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
    // ----- arena cup -----
    if (match.kind === 'cup' && s.cup.active) {
      if (score === 1) {
        s.cup.active.round++;
        if (s.cup.active.round >= CUP_ROUNDS) {
          s.cup.trophies.push({ arena: s.cup.active.arena, at: now });
          const cupName = `${arenaForRank(rankBefore).name} Cup`;
          s.honors.push({ id: `cup-${now}`, name: `Arena Cup champion — ${cupName}`, at: now, kind: 'cup' });
          if (s.cup.trophies.length % 3 === 0)
            s.honors.push({ id: `board-${now}`, name: `Independent Director, ${arenaForRank(rankBefore).institution ?? 'Seven Meridian Corporation'} (honorary board seat)`, at: now, kind: 'board' });
          pay.push({ key: 'cup', label: 'Arena Cup champion', amount: salary(rankBefore) * 25 });
          cupResult = 'won';
          s.cup.active = null;
        } else cupResult = 'advanced';
      } else {
        s.cup.active = null;
        cupResult = 'eliminated';
      }
    }
    if (s.stats.rated.g % CUP_EVERY === 0) s.cup.tokens = Math.min(3, s.cup.tokens + 1);
    const rematchCount = s.rematch && s.rematch.oppId === opp.id ? s.rematch.count : 0;
    const payInput = { rank: rankBefore, score, expected: E, playerRating: R0, oppRating: opp.rating, playerMoves: pmoves, accuracy: fin.accuracy, rematchCount, rated };
    const review = fin.review?.summary ?? null;
    pay.unshift(...(review ? computePayV3(payInput, review) : computePay(payInput)));

    // ----- review-driven stats, contracts, records, honours -----
    if (review && pmoves >= 15) {
      s.stats.reviewed++;
      s.stats.brilliants += review.counts.brilliant;
      s.stats.greats += review.counts.great;
      if (score >= 0.5 && review.minWin <= 25) s.stats.defences++;
    }
    if (!s.contracts.active.length) {
      s.contracts.active = freshContracts(s.contracts.issued, R0, rankBefore, unavailableKinds(save.opponents, !!save.career.series || seriesLength(rankBefore + 1) > 0));
      s.contracts.issued += 3;
    }
    const isRival = (s.opponents[String(opp.id)]?.g ?? 0) >= 3;
    const done = advanceContracts(s.contracts.active, {
      rated,
      playerMoves: pmoves,
      review,
      score,
      color: match.playerColor,
      ratingGap: opp.rating - R0,
      rival: isRival,
      seriesGame: match.kind === 'series',
    });
    for (const c of done) {
      pay.push({ key: 'contract', label: `Contract fulfilled: ${c.label}`, amount: c.reward });
      completedContracts.push(c.label);
      s.contracts.completed++;
      const kinds = [...unavailableKinds(s.opponents, !!s.career.series || seriesLength(s.career.rank + 1) > 0), ...s.contracts.active.filter((x) => x !== c).map((x) => x.kind)];
      s.contracts.active[s.contracts.active.indexOf(c)] = makeContract(s.contracts.issued++, s.rating.r, s.career.rank, kinds);
    }
    const rec = s.records;
    const label = `vs ${opp.name} (${opp.rating})`;
    if (review && pmoves >= 15 && (!rec.bestAccuracy || review.accuracy > rec.bestAccuracy.value))
      rec.bestAccuracy = { value: Math.round(review.accuracy * 10) / 10, label, matchId: match.id, at: now };
    if (score === 1 && opp.rating - R0 > (rec.biggestUpset?.value ?? 0)) rec.biggestUpset = { value: Math.round(opp.rating - R0), label, matchId: match.id, at: now };
    if (score === 1 && fin.termination === 'checkmate' && (!rec.fastestMate || pmoves < rec.fastestMate.value)) rec.fastestMate = { value: pmoves, label, matchId: match.id, at: now };
    if (review && score === 1 && pmoves >= 15) {
      const quality = review.accuracy + 10 * review.counts.brilliant + 3 * review.counts.great + Math.max(0, opp.rating - R0) / 20;
      if (!rec.bestGame || quality > rec.bestGame.value) rec.bestGame = { value: Math.round(quality), label, matchId: match.id, at: now };
    }
    // rare distinctions (honours, separate from titles and rating) + their earned cosmetics
    const hctx: HonourContext = {
      brilliants: s.stats.brilliants,
      defences: s.stats.defences,
      contractsCompleted: s.contracts.completed,
      bestStreak: s.stats.bestStreak,
      winAccuracy: review && score === 1 && pmoves >= 20 ? review.accuracy : null,
      upsetGap: score === 1 ? opp.rating - R0 : null,
    };
    for (const d of DISTINCTIONS) {
      if (!s.honors.some((h) => h.id === d.id) && d.test(hctx)) {
        s.honors.push({ id: d.id, name: `${d.name} — ${d.desc.charAt(0).toLowerCase()}${d.desc.slice(1)}`, at: now, kind: 'distinction' });
        newHonours.push(d.name);
      }
    }
    for (const it of grantEarned(s)) unlockedItems.push(it.name);
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
    accuracy: fin.review?.summary.accuracy ?? fin.accuracy,
    review: fin.review,
    payFormula: rated ? (fin.review ? PAY_FORMULA : 'pay-2') : undefined,
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
  for (const l of pay) {
    if (l.key === 'promotion') s.finance.promotionBonuses += l.amount;
    else if (l.key === 'cup') s.finance.prizes += l.amount;
    else if (l.key === 'achievement') s.finance.achievementRewards += l.amount;
    else s.finance.matchEarnings += l.amount;
  }
  s.finance.bestMatch = Math.max(s.finance.bestMatch, dollars);
  if (rated && dollars > (s.records.largestPaycheck?.value ?? 0)) s.records.largestPaycheck = { value: dollars, label: `vs ${opp.name}`, matchId: match.id, at: now };
  if (rated && s.stats.rated.g % 250 === 0)
    s.honors.push({ id: `service-${s.stats.rated.g}`, name: `Long Service Award — ${s.stats.rated.g.toLocaleString('en-US')} rated matches`, at: now, kind: 'service' });
  summary.dollars = dollars;
  // second pass for wealth-based achievements
  if (rated)
    for (const a of newAchievements(s, summary)) {
      s.achievements[a.id] = now;
      pay.push({ key: 'achievement', label: `Achievement: ${a.name}`, amount: a.reward });
      s.wallet.balance += a.reward;
      s.wallet.lifetime += a.reward;
      s.finance.achievementRewards += a.reward;
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
  // bound storage: keep rivals and recent opponents, forget one-off encounters beyond 1,500 entries
  const keys = Object.keys(s.opponents);
  if (keys.length > 1500) {
    const drop = keys
      .map((k) => s.opponents[k])
      .filter((x) => x.g < 3)
      .sort((a, b) => a.last - b.last)
      .slice(0, keys.length - 1500);
    for (const x of drop) delete s.opponents[String(x.id)];
  }
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
      contracts: completedContracts,
      honours: newHonours,
      unlocked: unlockedItems,
      review: fin.review ?? null,
      cupResult,
      cupRound: s.cup.active ? s.cup.active.round : null,
    },
  };
}
