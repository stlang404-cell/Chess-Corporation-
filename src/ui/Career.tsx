import { useMemo, useRef, useState } from 'react';
import { useApp, updateSave, commit, toast, setState } from './appState';
import {
  rankInfo,
  rankLine,
  arenaForRank,
  arenaInfo,
  meritNeeded,
  ratingGate,
  seriesLength,
  salary,
  AUTHORED_RANKS,
  AUTHORED_ARENA_COUNT,
  authoredTitleCount,
  FAMILIES,
  MAX_RANK,
} from '../game/career';
import { expectedScore, isProvisional } from '../game/rating';
import { STYLES, STYLE_IDS } from '../engine/ai';
import { STORE, ARENA_BOARDS, EARNED, COLLECTIONS, KIND_LABEL, canBuy, applyPurchase, itemById, floorPrice, floorName, hqValue, type ItemKind } from '../game/store';
import { ACHIEVEMENTS } from '../game/achievements';
import { TIME_CONTROLS, newSave, isRatedKind, UNTIMED, type SaveData } from '../game/state';
import { exportSave, checkImport, wipeSave } from '../game/storage';
import { identityOf } from '../game/opponents';
import { Card, CrestBadge, PlayerSeal, Segmented, money, motifUrl, TERMINATION_LABEL } from './common';
import { Board } from './Board';
import { PieceSvg } from './pieces';
import { Insignia } from './Insignia';
import { Icon } from './icons';
import { CALIBRATION } from '../engine/calibration';
import { DISTINCTIONS, distinctionById } from '../game/honours';

type Sec = 'overview' | 'directory' | 'arenas' | 'stats' | 'finance' | 'store' | 'office' | 'settings';

export function Career() {
  const [sec, setSec] = useState<Sec>('overview');
  return (
    <div className="page">
      <Segmented<Sec>
        value={sec}
        onChange={setSec}
        options={[
          ['overview', 'Overview'],
          ['directory', 'Directory'],
          ['arenas', 'Arenas'],
          ['stats', 'Stats'],
          ['finance', 'Finance'],
          ['store', 'Store'],
          ['office', 'Office'],
          ['settings', 'Settings'],
        ]}
      />
      {sec === 'overview' && <Overview />}
      {sec === 'directory' && <Directory />}
      {sec === 'arenas' && <Arenas />}
      {sec === 'stats' && <Stats />}
      {sec === 'finance' && <Finance />}
      {sec === 'store' && <Store />}
      {sec === 'office' && <Office />}
      {sec === 'settings' && <Settings />}
    </div>
  );
}

// ---------------- Overview ----------------
function Overview() {
  const { save } = useApp();
  const c = save.career;
  const r = rankInfo(c.rank, c.family);
  const arena = arenaForRank(c.rank);
  const next = c.rank + 1;
  return (
    <>
      <Card className="career-hero" style={{ ['--accent' as string]: arena.accent, backgroundImage: motifUrl(arena.motif, arena.accent, 0.14) }}>
        <Insignia rank={c.rank} family={c.family} size={96} />
        <div className="ch-text">
          <div className="eyebrow">{r.stage === 'functional' ? `${FAMILIES.find((f) => f.id === c.family)?.name} · ${r.scope}` : r.stage === 'management' ? `General management · ${r.scope}` : 'Enterprise leadership'}</div>
          <h2 className="display">{r.full}</h2>
          <div className="muted">{r.appointment}</div>
          <div className="ch-meta">
            <span>Salary {money(salary(c.rank))}</span>
            <span>Arena {arena.index + 1}: {arena.name}</span>
            <span className="mono">{r.id}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3>Next appointment</h3>
        {c.series ? (
          <p>
            Promotion series for <b>{rankLine(c.series.targetRank, c.family)}</b>: {c.series.wins} of {Math.floor(c.series.length / 2) + 1} points after {c.series.games} of {c.series.length} games.
          </p>
        ) : (
          <>
            <div className="row-between tight">
              <b>{rankLine(next, c.family)}</b>
              <span className="muted">
                {c.merit} / {meritNeeded(c.rank)} merit
              </span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${Math.min(100, (c.merit / meritNeeded(c.rank)) * 100)}%` }} />
            </div>
            <ul className="req-list">
              <li className="ok">Merit: earned by playing rated games (wins most, draws some, losses cost a little).</li>
              {ratingGate(next) > 0 ? (
                <li className={save.rating.r >= ratingGate(next) ? 'ok' : 'warn'}>
                  Rating ≥ {ratingGate(next).toLocaleString('en-US')} {save.rating.r >= ratingGate(next) ? '— met' : `— you are ${Math.round(save.rating.r)}`}
                </li>
              ) : (
                <li className="ok">No rating requirement at this level.</li>
              )}
              {seriesLength(next) > 0 && <li>Best-of-{seriesLength(next)} promotion series against opponents at the gate.</li>}
            </ul>
          </>
        )}
      </Card>

      <Records />

      <Card>
        <h3>Department</h3>
        <p className="muted small">Your job family shapes title wording only. Seniority, rating and pay are unaffected.</p>
        <select
          className="select"
          value={c.family}
          onChange={(e) =>
            updateSave((s) => {
              s.career.family = e.target.value;
            })
          }
        >
          {FAMILIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <h3>Career history</h3>
        <ol className="timeline">
          {[...c.promotions].reverse().slice(0, 60).map((p, i) => (
            <li key={i}>
              <span className="tl-dot" />
              <span className="tl-title">{p.title ?? rankLine(p.rank, c.family)}</span>
              <span className="muted small">
                match {p.game} · {new Date(p.at).toLocaleDateString()}
              </span>
            </li>
          ))}
          {c.legacy && (
            <li className="legacy">
              <span className="tl-dot" />
              <span className="tl-title">{c.legacy.title}</span>
              <span className="muted small">title held in SEVEN v0.1 (highest: {c.legacy.highest})</span>
            </li>
          )}
          <li>
            <span className="tl-dot" />
            <span className="tl-title">Joined {rankInfo(0, c.family).employer}</span>
            <span className="muted small">{new Date(save.createdAt).toLocaleDateString()}</span>
          </li>
        </ol>
      </Card>
    </>
  );
}

function Records() {
  const { save } = useApp();
  const r = save.records;
  const rows: [string, typeof r.bestAccuracy, (v: number) => string][] = [
    ['Best accuracy', r.bestAccuracy, (v) => `${v}%`],
    ['Biggest upset', r.biggestUpset, (v) => `+${v}`],
    ['Largest paycheck', r.largestPaycheck, (v) => money(v)],
    ['Fastest mate', r.fastestMate, (v) => `${v} moves`],
    ['Best game', r.bestGame, (v) => `${v} pts`],
  ];
  const held = new Set(save.honors.map((h) => h.id));
  const other = save.honors.filter((h) => !DISTINCTIONS.some((d) => d.id === h.id));
  return (
    <>
      <Card>
        <h3>Career records</h3>
        <div className="records-grid">
          {rows.map(([label, e, fmt]) => (
            <div key={label} className="record">
              <div className="rl">{label}</div>
              <div className="rv">{e ? fmt(e.value) : '—'}</div>
              <div className="rd muted">{e ? `${e.label} · ${new Date(e.at).toLocaleDateString()}` : 'not yet set'}</div>
            </div>
          ))}
        </div>
        <p className="muted small">
          Contracts fulfilled: {save.contracts.completed} · Reviewed games: {save.stats.reviewed ?? 0} · Brilliant {save.stats.brilliants ?? 0} · Great {save.stats.greats ?? 0}
        </p>
      </Card>
      <Card>
        <h3>Honours</h3>
        <div className="honour-list">
          {DISTINCTIONS.map((d) => (
            <span key={d.id} className={`honour ${held.has(d.id) ? '' : 'locked'}`} title={d.desc}>
              {held.has(d.id) ? '◆ ' : '◇ '}
              {d.name}
            </span>
          ))}
        </div>
        <p className="muted small">Each distinction also unlocks an earned-only cosmetic in the Store.</p>
        {other.length > 0 && (
          <ul className="req-list">
            {[...other].reverse().slice(0, 20).map((h) => (
              <li key={h.id} className="ok">
                {h.name} <span className="muted small">{new Date(h.at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

// ---------------- Directory ----------------
function Directory() {
  const { save } = useApp();
  const fam = save.career.family;
  const [q, setQ] = useState('');
  const [from, setFrom] = useState(Math.max(0, save.career.rank - 2));
  const PAGE = 40;
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return null;
    const out: number[] = [];
    // search the authored path and the next 5,000 procedural ranks
    for (let n = 0; n < AUTHORED_RANKS + 5000 && out.length < 80; n++) {
      if (rankInfo(n, fam).grade !== 0) continue;
      if (rankLine(n, fam).toLowerCase().includes(needle)) out.push(n);
    }
    return out;
  }, [q, fam]);
  const rows = results ?? Array.from({ length: PAGE }, (_, k) => from + k).filter((n) => n <= MAX_RANK);
  return (
    <>
      <div className="search-wrap">
        <Icon name="search" size={18} />
        <input className="search" placeholder="Search titles and institutions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the career directory" />
      </div>
      <p className="muted small">
        {authoredTitleCount()} authored titles across {FAMILIES.length} job families · {AUTHORED_RANKS} grades on your authored path · then an endless sequence of institutions.
      </p>
      <ol className="directory">
        {rows.map((n) => {
          const r = rankInfo(n, fam);
          const g = ratingGate(n);
          const sl = seriesLength(n);
          const here = n === save.career.rank;
          const done = n <= save.career.highestRank;
          return (
            <li key={n} className={`${here ? 'here' : ''} ${done ? 'done' : ''} ${r.majorEntry ? 'major' : ''}`}>
              <span className="dir-n mono">{n.toLocaleString('en-US')}</span>
              <span className="dir-title">
                {r.full}
                <span className="dir-org">{r.stage === 'institution' ? r.employer : r.appointment.split(' · ')[0]}</span>
              </span>
              <span className="dir-req">
                {g > 0 && <span className={save.rating.r >= g ? 'ok' : ''}>≥{g.toLocaleString('en-US')}</span>}
                {sl > 0 && <span className="series-chip">Bo{sl}</span>}
                <span className="muted">{money(salary(n))}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {!results && (
        <div className="btn-row center">
          <button className="btn small" disabled={from === 0} onClick={() => setFrom(Math.max(0, from - PAGE))}>
            Earlier
          </button>
          <button className="btn small" onClick={() => setFrom(Math.max(0, save.career.rank - 2))}>
            My rank
          </button>
          <button className="btn small" onClick={() => setFrom(from + PAGE)}>
            Later
          </button>
          <button className="btn small" onClick={() => setFrom(AUTHORED_RANKS - 5)}>
            Beyond the authored path
          </button>
        </div>
      )}
    </>
  );
}

// ---------------- Arenas ----------------
function Arenas() {
  const { save } = useApp();
  const cur = arenaForRank(save.career.rank).index;
  const best = arenaForRank(save.career.highestRank).index;
  const [n, setN] = useState(Math.max(AUTHORED_ARENA_COUNT, cur + 8));
  return (
    <>
      <p className="muted small">
        {AUTHORED_ARENA_COUNT} authored arenas — the floors of Seven Meridian and the headquarters of 46 institutions — followed by an unbounded sequence of procedurally founded institutions.
      </p>
      <div className="arena-grid">
        {Array.from({ length: n }, (_, i) => arenaInfo(i)).map((a) => {
          const unlocked = a.index <= best;
          return (
            <div key={a.index} className={`arena-tile ${unlocked ? '' : 'locked'} ${a.index === cur ? 'here' : ''}`} style={{ ['--accent' as string]: a.accent, backgroundImage: motifUrl(a.motif, a.accent, 0.18) }}>
              <span className="at-kanji">{a.kanji}</span>
              <span className="at-name">{a.name}</span>
              <span className="at-sub">
                {a.institution ?? 'Seven Meridian Corporation'} · from rating {ratingGate(a.firstRank).toLocaleString('en-US') || 'any'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="btn-row center">
        <button className="btn small" onClick={() => setN(n + 24)}>
          Show more arenas
        </button>
      </div>
    </>
  );
}

// ---------------- Stats ----------------
function RatingChart({ data, peak }: { data: number[]; peak: number }) {
  if (data.length < 2) return <div className="muted small">Play rated games to draw your rating line.</div>;
  const w = 340;
  const h = 110;
  const min = Math.min(...data) - 15;
  const max = Math.max(...data, peak) + 15;
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => h - ((v - min) / (max - min)) * h;
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" preserveAspectRatio="none" role="img" aria-label={`Rating history, from ${data[0]} to ${data[data.length - 1]}, peak ${Math.round(peak)}`}>
      <line x1="0" x2={w} y1={y(peak)} y2={y(peak)} className="chart-peak" vectorEffect="non-scaling-stroke" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} className="chart-area" />
      <polyline points={pts} className="chart-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Stats() {
  const { save } = useApp();
  const st = save.stats;
  const pct = (w: { g: number; w: number; d: number }) => (w.g ? Math.round(((w.w + w.d / 2) / w.g) * 100) + '%' : '—');
  // performance by opponent strength relative to the player at the time of play
  const brackets = [
    ['Much stronger (+150)', 150, 9999],
    ['Stronger (+50 to +150)', 50, 150],
    ['Even (±50)', -50, 50],
    ['Weaker (−50 to −150)', -150, -50],
    ['Much weaker (−150)', -9999, -150],
  ] as const;
  const rated = save.history.filter((h) => isRatedKind(h.kind));
  const bucket = brackets.map(([label, lo, hi]) => {
    const gs = rated.filter((h) => {
      const d = h.oppRating - (h.ratingAfter - h.ratingDelta);
      return d >= lo && d < hi;
    });
    const score = gs.reduce((a, h) => a + h.score, 0);
    const exp = gs.reduce((a, h) => a + expectedScore(h.ratingAfter - h.ratingDelta, h.oppRating), 0);
    return { label, n: gs.length, score, exp };
  });
  return (
    <>
      <Card>
        <div className="stat-row compact">
          <div className="stat">
            <div className="stat-num">
              {Math.round(save.rating.r)}
              {isProvisional(save.rating) ? '?' : ''}
            </div>
            <div className="stat-label">Rating ±{Math.round(save.rating.rd * 2)}</div>
          </div>
          <div className="stat">
            <div className="stat-num">{Math.round(save.peakRating)}</div>
            <div className="stat-label">Peak</div>
          </div>
          <div className="stat">
            <div className="stat-num">{st.accuracyN ? Math.round(st.accuracySum / st.accuracyN) + '%' : '—'}</div>
            <div className="stat-label">Avg accuracy</div>
          </div>
        </div>
        <RatingChart data={st.ratingHistory} peak={save.peakRating} />
      </Card>
      <Card>
        <h3>Record</h3>
        <div className="kv">
          <span>Rated</span>
          <span>
            {st.rated.w}–{st.rated.d}–{st.rated.l} ({pct(st.rated)})
          </span>
          <span>Best streak</span>
          <span>{st.bestStreak}</span>
          <span>Upsets (+200)</span>
          <span>{st.upsets}</span>
          <span>Checkmates delivered</span>
          <span>{st.checkmates}</span>
          <span>Best win</span>
          <span>{st.bestWinRating || '—'}</span>
        </div>
      </Card>
      <Card>
        <h3>Against opponent strength</h3>
        <table className="tbl">
          <thead>
            <tr>
              <th>Opponent</th>
              <th>Games</th>
              <th>Score</th>
              <th>Expected</th>
            </tr>
          </thead>
          <tbody>
            {bucket.map((b) => (
              <tr key={b.label}>
                <td>{b.label}</td>
                <td>{b.n}</td>
                <td>{b.n ? b.score : '—'}</td>
                <td>{b.n ? b.exp.toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Expected = sum of Elo win probabilities at the time of each game (last {rated.length} rated games).</p>
      </Card>
      <Card>
        <h3>By playing style</h3>
        <table className="tbl">
          <tbody>
            {STYLE_IDS.map((s) => {
              const w = st.byStyle[s];
              return (
                <tr key={s}>
                  <td>{STYLES[s].label}</td>
                  <td>{w ? `${w.w}–${w.d}–${w.l}` : '—'}</td>
                  <td>{w ? pct(w) : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <Card>
        <h3>Rivals</h3>
        <table className="tbl">
          <tbody>
            {Object.values(save.opponents)
              .filter((o) => o.g >= 2)
              .sort((a, b) => b.g - a.g)
              .slice(0, 12)
              .map((o) => (
                <tr key={o.id}>
                  <td>
                    <CrestBadge crest={identityOf(o.id).crest} size={20} /> {o.name}
                  </td>
                  <td>{o.rating}</td>
                  <td>{`${o.w}–${o.d}–${o.l}`}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
      <History />
      <p className="muted small">
        Ratings use Glicko-2 on the SEVEN scale (weakest bot tier = 400). Bot ratings come from engine tournaments ({CALIBRATION.games.toLocaleString('en-US')} games, {CALIBRATION.generated}). This is not a FIDE rating.
      </p>
    </>
  );
}

function History() {
  const { save } = useApp();
  if (!save.history.length) return null;
  return (
    <Card>
      <h3>Match history</h3>
      <ul className="history">
        {save.history.slice(0, 50).map((h) => (
          <li key={h.id} onClick={() => setState({ tab: 'academy', academyIntent: { kind: 'review', matchId: h.id } })} tabIndex={0}>
            <span className={`dot r${h.score * 2}`} />
            <span className="h-main">
              <b>{h.oppName}</b> <span className="muted small">{h.oppRating} · {STYLES[h.oppStyle]?.label} · {h.color === 0 ? 'White' : 'Black'} · {TERMINATION_LABEL[h.termination]}</span>
            </span>
            <span className={`h-delta ${h.ratingDelta >= 0 ? 'up' : 'down'}`}>{isRatedKind(h.kind) ? (h.ratingDelta >= 0 ? '+' : '') + h.ratingDelta : h.kind}</span>
            <span className="h-money">{h.dollars ? money(h.dollars) : ''}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------------- Finance ----------------
function Finance() {
  const { save } = useApp();
  const f = save.finance;
  const items = save.owned.map((id) => itemById(id)).filter(Boolean);
  const netWorth = save.wallet.balance + hqValue(save.hq.floors) + items.reduce((a, i) => a + (i?.price ?? 0), 0);
  return (
    <>
      <Card>
        <div className="stat-row compact">
          <div className="stat">
            <div className="stat-num gold">{money(save.wallet.balance)}</div>
            <div className="stat-label">Balance</div>
          </div>
          <div className="stat">
            <div className="stat-num">{money(save.wallet.lifetime)}</div>
            <div className="stat-label">Lifetime earnings</div>
          </div>
          <div className="stat">
            <div className="stat-num">{money(netWorth)}</div>
            <div className="stat-label">Net worth</div>
          </div>
        </div>
      </Card>
      <Card>
        <h3>Records</h3>
        <div className="kv">
          <span>Match earnings</span>
          <span>{money(f.matchEarnings)}</span>
          <span>Promotion bonuses</span>
          <span>{money(f.promotionBonuses)}</span>
          <span>Tournament prizes</span>
          <span>{money(f.prizes)}</span>
          <span>Achievement rewards</span>
          <span>{money(f.achievementRewards)}</span>
          <span>Highest single-match payout</span>
          <span>{money(f.bestMatch)}</span>
          <span>Current salary (per match)</span>
          <span>{money(salary(save.career.rank))}</span>
          <span>Total purchases</span>
          <span>{money(save.wallet.spent)}</span>
        </div>
        <p className="muted small">Dollars are fictional and buy only cosmetics. Records before v0.2 count toward lifetime earnings only.</p>
      </Card>
    </>
  );
}

// ---------------- Store ----------------
const PREVIEW_CELLS = (() => {
  const c = new Array(49).fill(0);
  [4, 2, 3, 5, 6, 3, 4].forEach((t, f) => {
    c[f] = t;
    c[42 + f] = 8 | t;
  });
  for (let f = 0; f < 7; f++) {
    c[7 + f] = 1;
    c[35 + f] = 9;
  }
  return c;
})();

function Store() {
  const { save } = useApp();
  const [kind, setKind] = useState<ItemKind>('board');
  const items = [...STORE, ...ARENA_BOARDS, ...EARNED].filter((i) => i.kind === kind);
  const buy = (id: string) => {
    const it = itemById(id)!;
    const why = canBuy(it, save.wallet.balance, save.career.highestRank, save.owned);
    if (why) return toast(why === 'Locked' ? `Unlocks at ${rankLine(it.minRank!, save.career.family)}` : why);
    const before = new Set(save.owned);
    updateSave((s) => {
      applyPurchase(s, id);
    }).then(() => {
      const bonus = EARNED.filter((e) => !before.has(e.id) && e.earned?.startsWith('collection:') && COLLECTIONS.find((c) => `collection:${c.id}` === e.earned)!.items.every((x) => x === id || before.has(x)));
      toast(bonus.length ? `Collection complete — ${bonus.map((b) => b.name).join(', ')} unlocked` : it.price ? `Purchased ${it.name}` : `Claimed ${it.name}`);
    });
  };
  const equip = (id: string) =>
    updateSave((s) => {
      s.equipped[itemById(id)!.kind] = id;
    });
  return (
    <>
      <div className="row-between">
        <div className="chips" role="tablist">
          {(Object.keys(KIND_LABEL) as ItemKind[]).map((k) => (
            <button key={k} className={`chip ${k === kind ? 'on' : ''}`} onClick={() => setKind(k)}>
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="balance">{money(save.wallet.balance)}</div>
      </div>
      <div className="store-grid">
        {items.map((it) => {
          const owned = save.owned.includes(it.id);
          const equipped = save.equipped[it.kind] === it.id;
          const locked = (it.minRank !== undefined && save.career.highestRank < it.minRank) || (!!it.earned && !owned);
          return (
            <div key={it.id} className={`store-item ${equipped ? 'equipped' : ''} ${locked ? 'locked' : ''} ${it.earned ? 'earned' : ''}`}>
              <div className="preview">
                {it.kind === 'board' && <Board cells={PREVIEW_CELLS} theme={it.data as any} pieceSet={save.equipped.pieces} small coordinates={false} />}
                {it.kind === 'pieces' && (
                  <div className="pc-preview">
                    {[6, 5, 4, 3, 2, 1].map((t) => (
                      <PieceSvg key={t} code={t} set={it.id} />
                    ))}
                    {[14, 13, 12, 11, 10, 9].map((t) => (
                      <PieceSvg key={t} code={t} set={it.id} />
                    ))}
                  </div>
                )}
                {(it.kind === 'crest' || it.kind === 'trophy') && <div className="glyph-preview">{it.data?.mark ?? it.data?.glyph}</div>}
                {it.kind === 'portrait' && <div className="glyph-preview portrait">{it.data?.glyph}</div>}
                {it.kind === 'frame' && (
                  <div className="frame-preview" style={{ border: it.data?.style ?? '1px dashed var(--line)' }}>
                    <PlayerSeal save={save} size={44} />
                  </div>
                )}
                {it.kind === 'office' && <div className="office-preview" style={{ backgroundImage: motifUrl(it.data?.motif ?? 'plain', 'currentColor', 0.3) }} />}
                {(it.kind === 'ceremony' || it.kind === 'entrance' || it.kind === 'amenity') && (
                  <div className="glyph-preview">{it.kind === 'ceremony' ? '昇' : it.kind === 'entrance' ? '入' : it.id === 'amenity.desk' ? '机' : '師'}</div>
                )}
              </div>
              <div className="si-name">{it.name}</div>
              <div className="muted small si-desc">{it.desc}</div>
              {owned ? (
                it.kind === 'trophy' || it.kind === 'amenity' ? (
                  <span className="muted small">{it.kind === 'trophy' ? 'In your office' : 'Active'}</span>
                ) : (
                  <button className="btn small" disabled={equipped} onClick={() => equip(it.id)}>
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                )
              ) : (
                <>
                  {it.earned ? (
                    <span className="small lock-note earned-note">{earnedHow(it.earned)}</span>
                  ) : (
                    locked && <span className="small warn lock-note">Requires {rankInfo(it.minRank!, save.career.family).title}</span>
                  )}
                  {!it.earned && (
                    <button className="btn small primary" onClick={() => buy(it.id)} disabled={locked}>
                      {locked ? 'Locked' : it.price === 0 ? 'Claim' : money(it.price)}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <h3 className="sub-head">Collections</h3>
      <div className="collections">
        {COLLECTIONS.map((c) => {
          const have = c.items.filter((x) => save.owned.includes(x)).length;
          const done = save.owned.includes(c.reward);
          return (
            <div key={c.id} className={`collection ${done ? 'done' : ''}`}>
              <div className="row-between tight">
                <b>{c.name}</b>
                <span className="muted small">
                  {have}/{c.items.length}
                </span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${(have / c.items.length) * 100}%` }} />
              </div>
              <div className="small muted">
                {c.items.map((x) => itemById(x)?.name).join(' · ')}
              </div>
              <div className="small">
                Reward: <b>{itemById(c.reward)?.name}</b> {done ? '✓' : '(earned only)'}
              </div>
            </div>
          );
        })}
      </div>
      <p className="muted small">Cosmetics only. Dollars can never buy rating, rank or engine help in rated games. Earned items cannot be bought.</p>
    </>
  );
}

function earnedHow(earned: string) {
  const [kind, id] = earned.split(':');
  if (kind === 'honour') return `Earned: ${distinctionById(id)?.name ?? id}`;
  return `Earned: complete ${COLLECTIONS.find((c) => c.id === id)?.name}`;
}

// ---------------- Office ----------------
function Office() {
  const { save } = useApp();
  const trophies = STORE.filter((i) => i.kind === 'trophy' && save.owned.includes(i.id));
  const office = itemById(save.equipped.office)?.data?.motif ?? 'plain';
  const unlocked = ACHIEVEMENTS.filter((a) => save.achievements[a.id]);
  return (
    <>
      <Card className="office" style={{ backgroundImage: motifUrl(office, 'currentColor', 0.1) }}>
        <Insignia rank={save.career.rank} family={save.career.family} size={88} />
        <div>
          <h2 className="display">{rankLine(save.career.rank, save.career.family)}</h2>
          <div className="trophy-shelf">
            {save.cup.trophies.map((t, i) => (
              <span key={'cup' + i} title={`${arenaInfo(t.arena).name} Cup`} className="trophy cup">
                杯
              </span>
            ))}
            {trophies.map((t) => (
              <span key={t.id} title={t.name} className="trophy">
                {t.data?.glyph}
              </span>
            ))}
            {!trophies.length && !save.cup.trophies.length && <span className="muted small">Your shelf is empty — win an Arena Cup or visit the store.</span>}
          </div>
        </div>
      </Card>
      <Headquarters />
      <Card>
        <h3>Honours</h3>
        <p className="muted small">Honours are distinctions, not job titles: cups, honorary board seats, long service.</p>
        <ul className="honors">
          {save.honors.length ? (
            [...save.honors].reverse().map((h) => (
              <li key={h.id}>
                <span className={`honor-mark ${h.kind}`}>{h.kind === 'cup' ? '杯' : h.kind === 'board' ? '席' : h.kind === 'service' ? '勤' : '賞'}</span>
                <span>{h.name}</span>
                <span className="muted small">{new Date(h.at).toLocaleDateString()}</span>
              </li>
            ))
          ) : (
            <li className="muted small">Win an Arena Cup to earn your first honour.</li>
          )}
        </ul>
      </Card>
      <Card>
        <h3>
          Achievements {unlocked.length}/{ACHIEVEMENTS.length}
        </h3>
        <ul className="ach">
          {ACHIEVEMENTS.map((a) => (
            <li key={a.id} className={save.achievements[a.id] ? 'got' : ''}>
              <span className="ach-name">{a.name}</span>
              <span className="muted small">{a.desc}</span>
              <span className="ach-reward">{money(a.reward)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Headquarters() {
  const { save } = useApp();
  const floors = save.hq.floors;
  const price = floorPrice(floors);
  const build = () => {
    if (save.wallet.balance < price) return toast('Insufficient funds');
    updateSave((s) => {
      s.wallet.balance -= price;
      s.wallet.spent += price;
      s.finance.purchases += price;
      s.hq.floors += 1;
    });
    toast(`${floorName(floors)} completed`);
  };
  const shown = Math.min(floors, 24);
  return (
    <Card className="hq">
      <div className="hq-tower" aria-label={`Headquarters with ${floors} floors`}>
        <div className="hq-spire" />
        {Array.from({ length: shown }).map((_, i) => {
          const k = floors - 1 - i;
          return <div key={k} className={`hq-floor ${(k + 1) % 10 === 0 ? 'accent' : ''}`} title={floorName(k)} />;
        })}
        {floors > shown && <div className="hq-more">+{floors - shown}</div>}
        <div className="hq-base">{floors ? '' : 'empty lot'}</div>
      </div>
      <div className="hq-info">
        <h3>Headquarters</h3>
        <div className="muted small">
          {floors} floor{floors === 1 ? '' : 's'} · invested {money(hqValue(floors))}
        </div>
        <button className="btn small primary" onClick={build} disabled={save.wallet.balance < price}>
          Build {floorName(floors)} — {money(price)}
        </button>
        <div className="muted small">Purely cosmetic. Your tower can rise forever.</div>
      </div>
    </Card>
  );
}

// ---------------- Settings ----------------
function Settings() {
  const { save } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ save: SaveData; schema?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof SaveData['settings']>(k: K, v: SaveData['settings'][K]) =>
    updateSave((s) => {
      s.settings[k] = v;
    });
  const download = () => {
    const blob = new Blob([exportSave(save)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `seven-career-${new Date().toISOString().slice(0, 10)}.seven.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Career exported.');
  };
  const onFile = async (f: File | undefined) => {
    setError(null);
    if (!f) return;
    const c = checkImport(await f.text());
    if (!c.ok) return setError(c.error ?? 'Could not read that file.');
    setPending({ save: c.save!, schema: c.schema });
  };
  const toggle = (k: 'coordinates' | 'showLegal' | 'sound' | 'confirmResign' | 'highContrast', l: string) => (
    <label className="setting" key={k}>
      <span>{l}</span>
      <input type="checkbox" className="switch" checked={save.settings[k] as boolean} onChange={(e) => set(k, e.target.checked)} />
    </label>
  );
  return (
    <>
      <Card>
        <h3>Appearance</h3>
        <label className="setting">
          <span>Theme</span>
          <Segmented value={save.settings.theme} onChange={(v) => set('theme', v)} options={[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]} />
        </label>
        <label className="setting">
          <span>Animation</span>
          <Segmented value={save.settings.animSpeed} onChange={(v) => set('animSpeed', v)} options={[['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['off', 'Off']]} />
        </label>
        {toggle('highContrast', 'High-contrast board')}
        {toggle('coordinates', 'Board coordinates')}
        {toggle('showLegal', 'Show legal moves')}
        {toggle('sound', 'Sounds')}
        {save.settings.sound && (
          <>
            <label className="setting">
              <span>Piece sounds</span>
              <input type="range" className="range" min={0} max={1} step={0.05} value={save.settings.moveVolume} onChange={(e) => set('moveVolume', +e.target.value)} aria-label="Piece sound volume" />
            </label>
            <label className="setting">
              <span>Effects (results, promotions)</span>
              <input type="range" className="range" min={0} max={1} step={0.05} value={save.settings.effectsVolume} onChange={(e) => set('effectsVolume', +e.target.value)} aria-label="Effects volume" />
            </label>
          </>
        )}
        <label className="setting">
          <span>
            Drag pieces
            <span className="muted small block">Tap a piece, then a square, always works.</span>
          </span>
          <input type="checkbox" className="switch" checked={save.settings.dragPieces} onChange={(e) => set('dragPieces', e.target.checked)} />
        </label>
      </Card>
      <Card>
        <h3>Play</h3>
        <label className="setting">
          <span>
            Time control
            <span className="muted small block">Untimed is the default: think as long as you like.</span>
          </span>
          <select className="select" value={save.settings.tc} onChange={(e) => set('tc', e.target.value)}>
            {TIME_CONTROLS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id === UNTIMED ? 'Untimed (recommended)' : `${t.label} (advanced)`}
              </option>
            ))}
          </select>
        </label>
        <label className="setting">
          <span>
            Engine thinking time
            <span className="muted small block">Opponents' strength is set by their tier; this only caps how long a move may take on slow devices.</span>
          </span>
          <Segmented value={save.settings.aiThink} onChange={(v) => set('aiThink', v)} options={[['standard', 'Standard'], ['strong', 'Stronger analysis']]} />
        </label>
        {toggle('confirmResign', 'Confirm before resigning')}
        <label className="setting">
          <span>Display name</span>
          <input
            className="input"
            value={save.profile.name}
            maxLength={24}
            onChange={(e) =>
              updateSave((s) => {
                s.profile.name = e.target.value;
              })
            }
          />
        </label>
        <label className="setting">
          <span>Replay the welcome tour</span>
          <button className="btn small" onClick={() => set('onboarded', false)}>
            Show
          </button>
        </label>
      </Card>
      <Card>
        <h3>Your career file</h3>
        <p className="muted small">
          Your career lives only on this device (IndexedDB with a backup copy). It does not sync between devices. To move it — e.g. Windows ↔ iPhone — export a file here and import it on the other device.
        </p>
        <div className="btn-row">
          <button className="btn" onClick={download}>
            <Icon name="download" size={16} /> Export career
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} /> Import career
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        {error && <div className="banner warn">{error}</div>}
        {pending && (
          <div className="import-confirm" role="alertdialog" aria-label="Confirm import">
            <h4>Replace this career?</h4>
            <div className="compare">
              <div>
                <div className="eyebrow">On this device</div>
                <b>{rankLine(save.career.rank, save.career.family)}</b>
                <div className="muted small">
                  Rating {Math.round(save.rating.r)} · {save.stats.rated.g} rated games · {money(save.wallet.balance)}
                </div>
              </div>
              <div>
                <div className="eyebrow">In the file (schema {pending.schema})</div>
                <b>{rankLine(pending.save.career.rank, pending.save.career.family)}</b>
                <div className="muted small">
                  Rating {Math.round(pending.save.rating.r)} · {pending.save.stats.rated.g} rated games · {money(pending.save.wallet.balance)}
                </div>
              </div>
            </div>
            <p className="small warn">The career on this device will be overwritten. Export it first if you may want it back.</p>
            <div className="btn-row">
              <button
                className="btn danger"
                onClick={async () => {
                  await commit(pending.save);
                  setPending(null);
                  toast('Career imported.');
                }}
              >
                Replace
              </button>
              <button className="btn ghost" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="btn-row">
          <button
            className="btn danger small"
            onClick={async () => {
              if (!confirm('Erase this career permanently? This cannot be undone.')) return;
              await wipeSave();
              commit(newSave());
              toast('Career reset');
            }}
          >
            Reset career
          </button>
        </div>
      </Card>
      <p className="muted small center">SEVEN v0.2 · rules SEVEN-1.0 · offline · no accounts, ads or real money.</p>
    </>
  );
}
