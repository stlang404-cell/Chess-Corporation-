import { useEffect, useState } from 'react';
import { useApp, go } from './appState';
import { rankInfo, arenaForRank, meritNeeded, ratingGate, seriesLength } from '../game/career';
import { isProvisional, expectedScore } from '../game/rating';
import { identityOf } from '../game/opponents';
import { STYLES } from '../engine/ai';
import { Bar, CrestBadge, PlayerSeal, money, motifUrl, titleForRating } from './common';
import { pickOpponent, startMatch, nextKind } from './matchFlow';
import type { OpponentSpec } from '../game/state';
import { TIME_CONTROLS } from '../game/state';
import { itemById } from '../game/store';

export function Home() {
  const { save } = useApp();
  const [phase, setPhase] = useState<'idle' | 'search' | 'found'>('idle');
  const [opp, setOpp] = useState<OpponentSpec | null>(null);
  const rank = rankInfo(save.career.rank);
  const arena = arenaForRank(save.career.rank);
  const need = meritNeeded(save.career.rank);
  const nextGate = ratingGate(save.career.rank + 1);
  const series = save.career.series;
  const active = save.active && !save.active.finished ? save.active : null;
  const office = itemById(save.equipped.office)?.data?.motif ?? 'plain';
  const tc = TIME_CONTROLS.find((t) => t.id === save.settings.tc) ?? TIME_CONTROLS[0];

  const onMatch = () => {
    if (active) return go('play');
    if (phase !== 'idle') return;
    setPhase('search');
    const o = pickOpponent();
    setOpp(o);
    setTimeout(() => setPhase('found'), 900 + Math.random() * 500);
  };
  useEffect(() => {
    if (phase !== 'found' || !opp) return;
    const t = setTimeout(() => {
      startMatch(nextKind(), opp);
      setPhase('idle');
    }, 2200);
    return () => clearTimeout(t);
  }, [phase, opp]);

  const recent = save.history.slice(0, 7);
  const provisional = isProvisional(save.rating);

  return (
    <div className="home" style={{ backgroundImage: motifUrl(office, '#1d1d1b', 0.05) }}>
      <header className="home-top">
        <div className="wordmark">
          <span className="seven-kanji">七</span> SEVEN
        </div>
        <div className="balance" title="Fictional dollars — cosmetics only">
          {money(save.wallet.balance)}
        </div>
      </header>

      <section className="identity">
        <PlayerSeal save={save} size={72} />
        <div className="title-block">
          <div className="eyebrow">Current title</div>
          <h1 className="rank-title">{rank.title}</h1>
          <div className="rank-grade">Grade {rank.gradeLabel}</div>
        </div>
      </section>

      <section className="stat-row">
        <div className="stat">
          <div className="stat-num">
            {Math.round(save.rating.r)}
            {provisional && <span className="prov" title="Provisional rating">?</span>}
          </div>
          <div className="stat-label">Rating</div>
        </div>
        <div className="stat arena-stat" style={{ borderColor: arena.accent }}>
          <div className="stat-num arena-kanji" style={{ color: arena.accent }}>
            {arena.kanji}
          </div>
          <div className="stat-label">{arena.name}</div>
        </div>
        <div className="stat">
          <div className="stat-num">{save.stats.rated.g}</div>
          <div className="stat-label">Matches</div>
        </div>
      </section>

      <section className="promo">
        {series ? (
          <>
            <div className="promo-head">
              <span>Promotion series → {rankInfo(series.targetRank).full}</span>
              <span>
                {series.wins} / {Math.floor(series.length / 2) + 1} pts · game {series.games + 1} of {series.length}
              </span>
            </div>
            <div className="series-pips">
              {Array.from({ length: series.length }).map((_, i) => (
                <span key={i} className={i < series.games ? 'pip done' : 'pip'} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="promo-head">
              <span>Next: {rankInfo(save.career.rank + 1).full}</span>
              <span>
                {save.career.merit} / {need} merit
              </span>
            </div>
            <Bar value={save.career.merit} max={need} accent={arena.accent} />
            <div className="promo-req">
              {nextGate > 0 && <span className={save.rating.r >= nextGate ? 'ok' : 'warn'}>Rating ≥ {nextGate}</span>}
              {seriesLength(save.career.rank + 1) > 0 && <span>Best-of-{seriesLength(save.career.rank + 1)} promotion series</span>}
            </div>
          </>
        )}
      </section>

      <div className="match-wrap">
        <button className={`match-btn ${phase}`} onClick={onMatch} aria-label="Match">
          <span className="match-ring" />
          <span className="match-label">{active ? 'RESUME' : phase === 'idle' ? (series ? 'SERIES' : 'MATCH') : 'FINDING'}</span>
        </button>
        <div className="match-sub">{active ? 'Game in progress' : `${tc.label} · rated`}</div>
      </div>

      <div className="recent" aria-label="Recent results">
        {recent.map((h) => (
          <span key={h.id} className={`dot r${h.score * 2}`} title={`${h.score === 1 ? 'Win' : h.score === 0 ? 'Loss' : 'Draw'} vs ${h.oppName}`} />
        ))}
        {save.stats.streak >= 2 && <span className="streak">{save.stats.streak} win streak</span>}
      </div>

      {phase !== 'idle' && opp && <MatchmakingOverlay phase={phase} opp={opp} playerRating={save.rating.r} h2h={save.opponents[String(opp.id)]} />}
    </div>
  );
}

function MatchmakingOverlay({ phase, opp, playerRating, h2h }: { phase: string; opp: OpponentSpec; playerRating: number; h2h?: { w: number; d: number; l: number } }) {
  const id = identityOf(opp.id);
  const E = expectedScore(playerRating, opp.rating, opp.rd);
  return (
    <div className="overlay mm">
      {phase === 'search' ? (
        <div className="mm-search">
          <div className="ripple" />
          <div className="ripple r2" />
          <div className="mm-text">Finding a worthy opponent…</div>
        </div>
      ) : (
        <div className="mm-card">
          {opp.rival && <div className="rival-tag">Rival</div>}
          <CrestBadge crest={id.crest} size={84} />
          <div className="mm-name">{id.name}</div>
          <div className="mm-title">{titleForRating(opp.rating, opp.id)}</div>
          <div className="mm-meta">
            <span>{opp.rating}</span>
            <span>·</span>
            <span>{STYLES[opp.style].label}</span>
          </div>
          <div className="mm-blurb">{STYLES[opp.style].blurb}</div>
          <div className="mm-odds">
            Expected score {Math.round(E * 100)}%{h2h ? ` · H2H ${h2h.w}–${h2h.d}–${h2h.l}` : ''}
          </div>
        </div>
      )}
    </div>
  );
}
