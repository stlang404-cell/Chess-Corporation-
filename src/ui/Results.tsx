import { useEffect, useState } from 'react';
import { useApp, setState } from './appState';
import { rankInfo, rankLine, salary, arenaForRank, meritNeeded, ratingGate, seriesLength } from '../game/career';
import type { SettlementReport } from '../game/settle';
import { money, TERMINATION_LABEL } from './common';
import { Insignia } from './Insignia';
import { startMatch, pickOpponent, nextKind } from './matchFlow';

function useCountUp(target: number, ms = 900, delay = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay;
    const step = () => {
      const k = Math.max(0, Math.min(1, (performance.now() - t0) / ms));
      setV(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, delay]);
  return v;
}

export function Results({ report, onClear }: { report: SettlementReport; onClear: () => void }) {
  const { save } = useApp();
  const fam = save.career.family;
  const [ceremony, setCeremony] = useState(report.promoted);
  const delta = Math.round(report.ratingAfter - report.ratingBefore);
  const d = useCountUp(delta);
  const dollars = useCountUp(report.dollars, 1100, 150);
  const head = report.score === 1 ? 'Victory' : report.score === 0 ? 'Defeat' : 'Draw';
  const last = save.history[0];
  const arenaBefore = arenaForRank(report.rankBefore);
  const arenaAfter = arenaForRank(report.rankAfter);
  const major = report.promoted && rankInfo(report.rankAfter, fam).majorEntry;

  const nextMatch = () => {
    onClear();
    setState({ tab: 'home', autoMatch: true });
  };
  const rematch = () => {
    onClear();
    if (save.career.series || save.cup.active) return startMatch(nextKind(), pickOpponent());
    const o = last ? save.opponents[String(last.oppId)] : null;
    if (!last || !o) return nextMatch();
    startMatch('ranked', { id: o.id, tier: o.tier, style: o.style, rating: o.rating, rd: 60, name: o.name, rival: o.g >= 3 }, (1 - last.color) as 0 | 1);
  };
  const lines = report.pay;
  const total = lines.reduce((a, l) => a + l.amount, 0);

  return (
    <div className="overlay results-overlay">
      {ceremony && (
        <Ceremony
          major={major}
          style={save.equipped.ceremony}
          rankBefore={report.rankBefore}
          rankAfter={report.rankAfter}
          family={fam}
          bonus={lines.find((l) => l.key === 'promotion')?.amount ?? 0}
          newArena={arenaAfter.index !== arenaBefore.index ? arenaAfter.name : null}
          onDone={() => setCeremony(false)}
        />
      )}
      <div className={`results sheet res-${head.toLowerCase()}`} aria-live="polite">
        <div className="res-head">{head}</div>
        <div className="res-sub">
          {TERMINATION_LABEL[report.termination] ?? report.termination}
          {report.expected < 0.35 && report.score === 1 ? ' · upset' : ''}
        </div>

        <div className="res-grid">
          <div className="res-cell">
            <div className={`res-big ${delta >= 0 ? 'up' : 'down'}`}>
              {delta >= 0 ? '+' : ''}
              {Math.round(d)}
            </div>
            <div className="res-label">Rating → {Math.round(report.ratingAfter)}</div>
          </div>
          <div className="res-cell">
            <div className="res-big gold">{money(dollars)}</div>
            <div className="res-label">Earned</div>
          </div>
          <div className="res-cell">
            <div className="res-big">{report.accuracy !== undefined ? Math.round(report.accuracy) + '%' : '—'}</div>
            <div className="res-label">Accuracy</div>
          </div>
        </div>

        {report.promoted && (
          <button className="banner promo-banner" onClick={() => setCeremony(true)}>
            Promoted to {rankLine(report.rankAfter, fam)}
          </button>
        )}
        {report.demoted && <div className="banner warn">Moved down to {rankLine(report.rankAfter, fam)}</div>}
        {report.seriesStarted && report.series && <div className="banner series">Promotion series unlocked — best of {report.series.length} for {rankLine(report.series.targetRank, fam)}</div>}
        {report.seriesResult === 'failed' && <div className="banner warn">Series not passed. Earn another shot with merit.</div>}
        {report.series && !report.seriesStarted && (
          <div className="banner series">
            Series: {report.series.wins} of {Math.floor(report.series.length / 2) + 1} points after {report.series.games} of {report.series.length}
          </div>
        )}
        {report.cupResult === 'won' && <div className="banner promo-banner">Arena Cup champion — honour recorded</div>}
        {report.cupResult === 'advanced' && <div className="banner series">Arena Cup: through to round {(report.cupRound ?? 0) + 1} of 3</div>}
        {report.cupResult === 'eliminated' && <div className="banner warn">Out of the Arena Cup</div>}

        {!report.series && !report.promoted && (
          <div className="res-merit">
            <div className="row-between tight">
              <span>
                Merit {report.meritChange >= 0 ? '+' : ''}
                {report.meritChange}
              </span>
              <span className="muted">
                {report.meritAfter} / {report.meritNeeded} → {rankLine(report.rankAfter + 1, fam)}
              </span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${Math.min(100, (report.meritAfter / Math.max(1, report.meritNeeded)) * 100)}%` }} />
            </div>
            {report.gateBlocked && <div className="small warn">Requires rating {report.gateBlocked.toLocaleString('en-US')} — merit is banked until then.</div>}
          </div>
        )}

        {lines.length > 0 ? (
          <ul className="pay" aria-label="Payout">
            {lines.map((l, i) => (
              <li key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>
                <span>{l.label}</span>
                <span>{money(l.amount)}</span>
              </li>
            ))}
            <li className="total">
              <span>Total</span>
              <span>{money(total)}</span>
            </li>
          </ul>
        ) : (
          <div className="muted small">No pay: games shorter than 10 moves earn no salary.</div>
        )}
        {report.achievements.length > 0 && (
          <div className="ach-earned">
            {report.achievements.map((a) => (
              <span key={a.id} className="ach-chip">
                ★ {a.name}
              </span>
            ))}
          </div>
        )}

        <div className="res-actions">
          <button className="btn primary big" onClick={nextMatch} autoFocus>
            NEXT MATCH
          </button>
          <div className="btn-row center">
            <button className="btn" onClick={rematch}>
              {save.career.series ? 'Next series game' : save.cup.active ? 'Next cup round' : 'Rematch'}
            </button>
            <button
              className="btn"
              onClick={() => {
                onClear();
                setState({ tab: 'academy', academyIntent: { kind: 'review', matchId: report.matchId } });
              }}
            >
              Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Promotion ceremony. Minor: a quick seal stamp. Major: insignia reveal with the full appointment. */
export function Ceremony(p: { major: boolean; style: string; rankBefore: number; rankAfter: number; family: string; bonus: number; newArena: string | null; onDone: () => void }) {
  const after = rankInfo(p.rankAfter, p.family);
  const salaryUp = salary(p.rankAfter) - salary(p.rankBefore);
  useEffect(() => {
    if (p.major) return;
    const t = setTimeout(p.onDone, 1900);
    return () => clearTimeout(t);
  }, [p.major, p.onDone]);
  const flakes = p.style === 'ceremony.ink' ? 0 : 28;
  if (!p.major)
    return (
      <div className="ceremony minor" role="status" onClick={p.onDone}>
        <div className="stamp">昇</div>
        <div className="cer-title">{after.full}</div>
        <div className="cer-sub">
          +{money(salaryUp)} salary · +{money(p.bonus)} bonus
        </div>
      </div>
    );
  const next = p.rankAfter + 1;
  return (
    <div className={`ceremony major ${p.style.replace('.', '-')}`} role="dialog" aria-modal="true" aria-label="Promotion">
      {Array.from({ length: flakes }).map((_, i) => (
        <span key={i} className="flake" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.21}s` }} />
      ))}
      <div className="cer-card">
        <div className="eyebrow">Appointment</div>
        <div className="cer-insignia">
          <Insignia rank={p.rankAfter} family={p.family} size={132} />
        </div>
        <div className="cer-from">{rankLine(p.rankBefore, p.family)}</div>
        <div className="cer-arrow" aria-hidden>
          ↓
        </div>
        <h2 className="cer-title big">{rankLine(p.rankAfter, p.family)}</h2>
        <div className="cer-sub">{after.appointment}</div>
        <dl className="cer-facts">
          <div>
            <dt>Salary</dt>
            <dd>
              {money(salary(p.rankAfter))} <span className="up">+{money(salaryUp)}</span>
            </dd>
          </div>
          <div>
            <dt>Bonus</dt>
            <dd className="gold">{money(p.bonus)}</dd>
          </div>
          {p.newArena && (
            <div>
              <dt>New arena</dt>
              <dd>{p.newArena}</dd>
            </div>
          )}
          <div>
            <dt>Next</dt>
            <dd>
              {rankLine(next, p.family)} · {meritNeeded(p.rankAfter)} merit
              {ratingGate(next) ? ` · rating ${ratingGate(next).toLocaleString('en-US')}` : ''}
              {seriesLength(next) ? ` · Bo${seriesLength(next)}` : ''}
            </dd>
          </div>
        </dl>
        <button className="btn primary wide" onClick={p.onDone} autoFocus>
          Continue
        </button>
      </div>
      <button className="skip" onClick={p.onDone}>
        Skip
      </button>
    </div>
  );
}
