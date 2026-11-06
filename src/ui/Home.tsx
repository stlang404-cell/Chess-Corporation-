import { useEffect, useRef, useState } from 'react';
import { useApp, go, updateSave } from './appState';
import { rankInfo, rankLine, arenaForRank, meritNeeded, ratingGate, seriesLength } from '../game/career';
import { isProvisional, expectedScore } from '../game/rating';
import { identityOf, leagueRecord, opponentCareer } from '../game/opponents';
import { STYLES } from '../engine/ai';
import { CrestBadge, money, motifUrl } from './common';
import { Insignia } from './Insignia';
import { pickOpponent, startMatch, nextKind } from './matchFlow';
import type { OpponentSpec } from '../game/state';
import { itemById } from '../game/store';
import { freshContracts, unavailableKinds } from '../game/contracts';
import { isUntimed, timeControlOf } from '../game/clock';

export function Home() {
  const { save } = useApp();
  const [opp, setOpp] = useState<OpponentSpec | null>(null);
  const fam = save.career.family;
  const rank = rankInfo(save.career.rank, fam);
  const arena = arenaForRank(save.career.rank);
  const need = meritNeeded(save.career.rank);
  const next = save.career.rank + 1;
  const nextGate = ratingGate(next);
  const series = save.career.series;
  const active = save.active && !save.active.finished ? save.active : null;
  const office = itemById(save.equipped.office)?.data?.motif ?? 'plain';
  const tcLabel = isUntimed({ clocks: null, tc: save.settings.tc }) ? 'Untimed' : timeControlOf({ tc: save.settings.tc }).label;
  const last = save.history[0];
  const provisional = isProvisional(save.rating);
  const progress = series ? series.wins / (Math.floor(series.length / 2) + 1) : Math.min(1, save.career.merit / need);

  const onMatch = () => {
    if (active) return go('play');
    if (opp) return;
    setOpp(pickOpponent());
  };

  const w = save.stats.rated;
  const reviewed = save.history.filter((h) => h.review).slice(0, 10);
  const recentAcc = reviewed.length ? Math.round(reviewed.reduce((a, h) => a + h.review!.summary.accuracy, 0) / reviewed.length) : null;
  const contracts = save.contracts.active.length ? save.contracts.active : freshContracts(save.contracts.issued, save.rating.r, save.career.rank, unavailableKinds(save.opponents, !!series || seriesLength(next) > 0));
  const rival = Object.values(save.opponents)
    .filter((o) => o.g >= 3)
    .sort((a, b) => b.g - a.g || b.last - a.last)[0];
  return (
    <div className="home" style={{ ['--motif' as string]: motifUrl(office, 'currentColor', 0.05) }}>
      <header className="home-top">
        <div className="brand-inline" aria-hidden>
          <span className="brand-seal sm">七</span> SEVEN
        </div>
        <div className="balance" title="Fictional dollars — cosmetics only">
          {money(save.wallet.balance)}
        </div>
      </header>

      <section className="hero" style={{ ['--accent' as string]: arena.accent }}>
        <Insignia rank={save.career.rank} family={fam} size={92} />
        <h1 className="rank-title">{rank.title}</h1>
        <div className="rank-sub">
          Grade {rank.gradeLabel} · {rank.stage === 'institution' ? rank.employer : rank.appointment.split(' · ')[0]}
        </div>
        <span className="arena-chip" style={{ ['--accent' as string]: arena.accent }}>
          <b>{arena.kanji}</b>
          {arena.name}
        </span>
      </section>

      <section className="stat-row" aria-label="Your standing">
        <div className="stat">
          <div className="stat-num">
            {Math.round(save.rating.r)}
            {provisional && <span className="prov" title="Provisional — settles after a few games">?</span>}
          </div>
          <div className="stat-label">
            Rating
            {last && (last.kind === 'ranked' || last.kind === 'series' || last.kind === 'cup') ? (
              <span className={last.ratingDelta >= 0 ? 'up' : 'down'}>
                {' '}
                {last.ratingDelta >= 0 ? '+' : ''}
                {last.ratingDelta}
              </span>
            ) : null}
          </div>
        </div>
        <button className="stat acc-stat" onClick={() => go('career')} title="Average engine-review accuracy, last 10 reviewed games">
          <div className="stat-num">{recentAcc === null ? '—' : `${recentAcc}%`}</div>
          <div className="stat-label">Accuracy</div>
        </button>
        <div className="stat">
          <div className="stat-num">
            {w.w}
            <span className="wdl">
              –{w.d}–{w.l}
            </span>
          </div>
          <div className="stat-label">Record</div>
        </div>
      </section>

      <div className="match-wrap">
        <button className={`match-btn ${opp ? 'busy' : ''}`} onClick={onMatch} aria-label={active ? 'Resume game' : 'Match'} style={{ ['--accent' as string]: arena.accent }}>
          <svg className="match-ring" viewBox="0 0 120 120" aria-hidden>
            <circle cx="60" cy="60" r="56" className="ring-bg" />
            <circle cx="60" cy="60" r="56" className="ring-fg" style={{ strokeDasharray: `${progress * 351.9} 351.9` }} />
          </svg>
          <span className="match-label">{active ? 'RESUME' : series ? 'SERIES' : save.cup.active ? 'CUP' : 'MATCH'}</span>
          <span className="match-mini">{active ? 'game in progress' : `${tcLabel} · rated`}</span>
        </button>
      </div>

      <section className="next-promo" aria-label="Next promotion">
        {series ? (
          <>
            <div className="np-head">Promotion series</div>
            <div className="np-title">{rankLine(series.targetRank, fam)}</div>
            <div className="series-pips">
              {Array.from({ length: series.length }).map((_, i) => (
                <span key={i} className={i < series.games ? 'pip done' : 'pip'} />
              ))}
            </div>
            <div className="np-req">
              {series.wins} of {Math.floor(series.length / 2) + 1} points · game {series.games + 1} of {series.length}
            </div>
          </>
        ) : (
          <>
            <div className="np-head">Next promotion</div>
            <div className="np-title">{rankLine(next, fam)}</div>
            <div className="np-req">
              <span>
                {save.career.merit} / {need} merit
              </span>
              {nextGate > 0 && (
                <span className={save.rating.r >= nextGate ? 'ok' : 'warn'}>
                  rating {nextGate.toLocaleString('en-US')}
                  {save.rating.r >= nextGate ? ' ✓' : ''}
                </span>
              )}
              {seriesLength(next) > 0 && <span>best-of-{seriesLength(next)} series</span>}
            </div>
          </>
        )}
      </section>

      {!active && !series && !save.cup.active && save.cup.tokens > 0 && !opp && (
        <button
          className="btn small cup-btn"
          onClick={async () => {
            await updateSave((s) => {
              s.cup.tokens--;
              s.cup.active = { arena: arena.index, round: 0 };
            });
            onMatch();
          }}
        >
          Enter the Arena Cup · {save.cup.tokens} invitation{save.cup.tokens > 1 ? 's' : ''}
        </button>
      )}

      {!opp && (
        <section className="contracts-card" aria-label="Performance contracts">
          <div className="np-head">Performance contracts</div>
          <ul>
            {contracts.map((c) => (
              <li key={c.id}>
                <span className="ct-label">{c.label}</span>
                <span className="ct-prog">
                  {c.target > 1 && (
                    <span className="ct-pips">
                      {Array.from({ length: c.target }).map((_, i) => (
                        <i key={i} className={i < c.progress ? 'on' : ''} />
                      ))}
                    </span>
                  )}
                  <b>{money(c.reward)}</b>
                </span>
              </li>
            ))}
          </ul>
          <div className="ct-foot">Rated games of 15+ moves with an engine review count.</div>
          {rival && (
            <div className="rival-line">
              <span className="rival-chip">rival</span> {rival.name} · {rival.w}–{rival.d}–{rival.l} in {rival.g} games
            </div>
          )}
        </section>
      )}

      {save.history.length > 0 && (
        <div className="recent" aria-label="Recent results">
          {save.history.slice(0, 10).map((h) => (
            <span key={h.id} className={`dot r${h.score * 2}`} title={`${h.score === 1 ? 'Win' : h.score === 0 ? 'Loss' : 'Draw'} vs ${h.oppName}`} />
          ))}
          {save.stats.streak >= 2 && <span className="streak">{save.stats.streak} wins in a row</span>}
        </div>
      )}

      {opp && <OpponentReveal opp={opp} onCancel={() => setOpp(null)} onBegin={() => startMatch(nextKind(), opp).then(() => setOpp(null))} />}
    </div>
  );
}

function OpponentReveal({ opp, onBegin, onCancel }: { opp: OpponentSpec; onBegin: () => void; onCancel: () => void }) {
  const { save } = useApp();
  const id = identityOf(opp.id);
  const career = opponentCareer(opp.id, opp.rating);
  const E = expectedScore(save.rating.r, opp.rating, opp.rd);
  const h2h = save.opponents[String(opp.id)];
  const lr = leagueRecord(opp.id);
  const started = useRef(false);
  const begin = () => {
    if (started.current) return;
    started.current = true;
    onBegin();
  };
  useEffect(() => {
    const t = setTimeout(begin, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="overlay reveal" role="dialog" aria-modal="true" aria-label="Opponent found">
      <div className="opp-card">
        {opp.rival && <div className="rival-tag">Rival</div>}
        <CrestBadge crest={id.crest} size={76} />
        <div className="opp-name">{id.name}</div>
        <div className="opp-title">{career.title}</div>
        <div className="opp-org">{career.employer}</div>
        <div className="opp-meta">
          <span className="opp-rating">{opp.rating}</span>
          <span className="sep" />
          <span>{STYLES[opp.style].label}</span>
        </div>
        <p className="opp-blurb">{STYLES[opp.style].blurb}</p>
        <div className="opp-odds">
          <div>
            <b>{Math.round(E * 100)}%</b>
            <span>expected score</span>
          </div>
          <div>
            <b>{h2h ? `${h2h.w}–${h2h.d}–${h2h.l}` : '—'}</b>
            <span>head to head</span>
          </div>
          <div>
            <b>
              {lr.wins}–{lr.draws}–{lr.losses}
            </b>
            <span>league record</span>
          </div>
        </div>
        <div className="reveal-actions">
          <button
            className="btn ghost"
            onClick={() => {
              started.current = true;
              onCancel();
            }}
          >
            Not now
          </button>
          <button className="btn primary begin" onClick={begin} autoFocus>
            Begin
            <span className="countdown" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
