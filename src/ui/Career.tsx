import { useMemo, useState } from 'react';
import { useApp, updateSave, commit, toast, setState } from './appState';
import { rankInfo, arenaForRank, arenaInfo, meritNeeded, ratingGate, seriesLength, salary, AUTHORED_RANKS } from '../game/career';
import { isProvisional } from '../game/rating';
import { STYLES, STYLE_IDS } from '../engine/ai';
import { STORE, KIND_LABEL, canBuy, itemById, floorPrice, floorName, hqValue, type ItemKind } from '../game/store';
import { ACHIEVEMENTS } from '../game/achievements';
import { TIME_CONTROLS, newSave, isRatedKind } from '../game/state';
import { exportSave, importSave, wipeSave } from '../game/storage';
import { identityOf } from '../game/opponents';
import { Bar, Card, CrestBadge, PlayerSeal, Segmented, money, motifUrl, TERMINATION_LABEL } from './common';
import { Board } from './Board';
import { PieceSvg } from './pieces';
import { CALIBRATION } from '../engine/calibration';

type Sec = 'ladder' | 'stats' | 'history' | 'store' | 'office' | 'settings';

export function Career() {
  const [sec, setSec] = useState<Sec>('ladder');
  return (
    <div className="page">
      <Segmented<Sec>
        value={sec}
        onChange={setSec}
        options={[
          ['ladder', 'Ladder'],
          ['stats', 'Stats'],
          ['history', 'History'],
          ['store', 'Store'],
          ['office', 'Office'],
          ['settings', 'Settings'],
        ]}
      />
      {sec === 'ladder' && <Ladder />}
      {sec === 'stats' && <Stats />}
      {sec === 'history' && <History />}
      {sec === 'store' && <Store />}
      {sec === 'office' && <Office />}
      {sec === 'settings' && <Settings />}
    </div>
  );
}

function Ladder() {
  const { save } = useApp();
  const n = save.career.rank;
  const arena = arenaForRank(n);
  const [arenaView, setArenaView] = useState(false);
  const upcoming = Array.from({ length: 10 }, (_, k) => n + 1 + k);
  return (
    <>
      <Card className="arena-card" style={{ backgroundImage: motifUrl(arena.motif, arena.accent, 0.16), borderColor: arena.accent }}>
        <div className="arena-kanji-big" style={{ color: arena.accent }}>
          {arena.kanji}
        </div>
        <div>
          <div className="eyebrow">Arena {arena.index + 1}</div>
          <h2>{arena.name}</h2>
          <div className="muted">
            {rankInfo(n).full} · base salary {money(salary(n))}
          </div>
          <div className="muted small">
            Highest: {rankInfo(save.career.highestRank).full} · {save.career.promotions.length} promotions
          </div>
        </div>
      </Card>
      <div className="row-between">
        <h3>Road ahead</h3>
        <button className="btn small" onClick={() => setArenaView(!arenaView)}>
          {arenaView ? 'Show ranks' : 'Show arenas'}
        </button>
      </div>
      {!arenaView ? (
        <ol className="ladder">
          <li className="current">
            <span className="l-name">{rankInfo(n).full}</span>
            <span className="l-req">
              {save.career.merit}/{meritNeeded(n)} merit
            </span>
          </li>
          {upcoming.map((k) => {
            const r = rankInfo(k);
            const g = ratingGate(k);
            const sl = seriesLength(k);
            return (
              <li key={k} className={r.majorEntry ? 'major' : ''}>
                <span className="l-name">{r.full}</span>
                <span className="l-req">
                  {g > 0 && <span className={save.rating.r >= g ? 'ok' : 'warn'}>≥{g}</span>}
                  {sl > 0 && <span className="series-chip">Bo{sl}</span>}
                  <span>{meritNeeded(k - 1)} merit</span>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="arena-list">
          {Array.from({ length: Math.max(arena.index + 6, 20) }, (_, i) => arenaInfo(i)).map((a) => {
            const unlocked = a.index <= arenaForRank(save.career.highestRank).index;
            return (
              <div key={a.index} className={`arena-row ${unlocked ? '' : 'locked'} ${a.index === arena.index ? 'here' : ''}`} style={{ backgroundImage: motifUrl(a.motif, a.accent, 0.14) }}>
                <span className="arena-kanji" style={{ color: a.accent }}>
                  {a.kanji}
                </span>
                <span className="ar-name">{a.name}</span>
                <span className="ar-gate">from {ratingGate(firstRankOfArena(a.index)) || '—'}</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="muted small">
        Ranks beyond the {AUTHORED_RANKS} authored grades continue forever: offices, jurisdictions and prestige orders, each with its own requirements.
        Promotions need merit (earned by playing), a rating gate (earned by playing well), and for major titles a promotion series.
      </p>
    </>
  );
}

function firstRankOfArena(i: number): number {
  // search: arenas are contiguous in rank order
  let lo = 0;
  let hi = 1_000_000;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arenaForRank(mid).index < i) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="muted small">Play rated games to draw your rating line.</div>;
  const w = 320;
  const h = 90;
  const min = Math.min(...data) - 10;
  const max = Math.max(...data) + 10;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" preserveAspectRatio="none" role="img" aria-label="rating history">
      <polyline points={pts} fill="none" stroke="#1d1d1b" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <text x="2" y="10" fontSize="9" fill="#8a8478">
        {Math.round(max - 10)}
      </text>
      <text x="2" y={h - 2} fontSize="9" fill="#8a8478">
        {Math.round(min + 10)}
      </text>
    </svg>
  );
}

function Stats() {
  const { save } = useApp();
  const st = save.stats;
  const pct = (w: { g: number; w: number; d: number }) => (w.g ? Math.round(((w.w + w.d / 2) / w.g) * 100) + '%' : '—');
  return (
    <>
      <Card>
        <div className="stat-row">
          <div className="stat">
            <div className="stat-num">
              {Math.round(save.rating.r)}
              {isProvisional(save.rating) ? '?' : ''}
            </div>
            <div className="stat-label">Rating (±{Math.round(save.rating.rd * 2)})</div>
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
        <Sparkline data={st.ratingHistory} />
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
          <span>Checkmates</span>
          <span>{st.checkmates}</span>
          <span>Best win</span>
          <span>{st.bestWinRating || '—'}</span>
          <span>Career earnings</span>
          <span>{money(save.wallet.lifetime)}</span>
        </div>
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
        <h3>By arena</h3>
        <table className="tbl">
          <tbody>
            {Object.entries(st.byArena).map(([a, w]) => (
              <tr key={a}>
                <td>{arenaInfo(+a).name}</td>
                <td>{`${w.w}–${w.d}–${w.l}`}</td>
                <td>{pct(w)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <h3>Seasons</h3>
        <table className="tbl">
          <tbody>
            {Object.entries(st.seasons)
              .sort()
              .reverse()
              .map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>peak {v.peak}</td>
                  <td>
                    {v.wins}/{v.games} wins
                  </td>
                  <td>{seasonHonor(v.peak)}</td>
                </tr>
              ))}
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
      <p className="muted small">
        Ratings use Glicko-2 shown on the SEVEN scale (tier-0 bot = 400). Bot ratings come from engine tournaments ({CALIBRATION.games} games, {CALIBRATION.generated}); they are not FIDE ratings.
      </p>
    </>
  );
}

export function seasonHonor(peak: number) {
  if (peak >= 2000) return 'Gold Seal';
  if (peak >= 1600) return 'Silver Seal';
  if (peak >= 1200) return 'Bronze Seal';
  if (peak >= 800) return 'Ink Seal';
  return '';
}

function History() {
  const { save } = useApp();
  if (!save.history.length) return <p className="muted">No games yet. Press MATCH.</p>;
  return (
    <ul className="history">
      {save.history.map((h) => (
        <li key={h.id} onClick={() => setState({ tab: 'academy', academyIntent: { kind: 'review', matchId: h.id } })}>
          <span className={`dot r${h.score * 2}`} />
          <span className="h-main">
            <b>{h.oppName}</b> ({h.oppRating}, {STYLES[h.oppStyle]?.label})
            <span className="muted small">
              {' '}
              · {h.color === 0 ? 'White' : 'Black'} · {TERMINATION_LABEL[h.termination]} · {Math.ceil(h.moves.length / 2)} moves
            </span>
          </span>
          <span className={`h-delta ${h.ratingDelta >= 0 ? 'up' : 'down'}`}>
            {isRatedKind(h.kind) ? (h.ratingDelta >= 0 ? '+' : '') + h.ratingDelta : h.kind}
          </span>
          <span className="h-money">{h.dollars ? money(h.dollars) : ''}</span>
        </li>
      ))}
    </ul>
  );
}

const PREVIEW_CELLS = (() => {
  const c = new Array(49).fill(0);
  c[0] = 4; c[1] = 2; c[2] = 3; c[3] = 5; c[4] = 6; c[5] = 3; c[6] = 4;
  for (let f = 0; f < 7; f++) { c[7 + f] = 1; c[35 + f] = 9; }
  c[42] = 12; c[43] = 10; c[44] = 11; c[45] = 13; c[46] = 14; c[47] = 11; c[48] = 12;
  return c;
})();

function Store() {
  const { save } = useApp();
  const [kind, setKind] = useState<ItemKind>('board');
  const items = STORE.filter((i) => i.kind === kind);
  const buy = (id: string) => {
    const it = itemById(id)!;
    const why = canBuy(it, save.wallet.balance, save.career.highestRank, save.owned);
    if (why) return toast(why === 'Locked' ? `Unlocks at ${rankInfo(it.minRank!).full}` : why);
    updateSave((s) => {
      s.wallet.balance -= it.price;
      s.wallet.spent += it.price;
      s.owned.push(it.id);
      if (it.kind !== 'trophy') s.equipped[it.kind] = it.id;
    });
    toast(`Purchased ${it.name}`);
  };
  const equip = (id: string) =>
    updateSave((s) => {
      const it = itemById(id)!;
      s.equipped[it.kind] = id;
    });
  return (
    <>
      <div className="row-between">
        <div className="chips">
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
          const locked = it.minRank !== undefined && save.career.highestRank < it.minRank;
          return (
            <div key={it.id} className={`store-item ${equipped ? 'equipped' : ''} ${locked ? 'locked' : ''}`}>
              <div className="preview">
                {it.kind === 'board' && (
                  <Board cells={PREVIEW_CELLS} theme={it.data as any} pieceSet={save.equipped.pieces} small coordinates={false} />
                )}
                {it.kind === 'pieces' && (
                  <div className="pc-preview">
                    {[6, 5, 4, 3, 2, 1].map((t) => (
                      <PieceSvg key={t} code={t} set={it.id} />
                    ))}
                    {[14, 13, 10].map((t) => (
                      <PieceSvg key={t} code={t} set={it.id} />
                    ))}
                  </div>
                )}
                {(it.kind === 'crest' || it.kind === 'trophy') && <div className="glyph-preview">{it.data?.mark ?? it.data?.glyph}</div>}
                {it.kind === 'frame' && (
                  <div className="frame-preview" style={{ border: it.data?.style ?? '1px dashed #ccc' }}>
                    <PlayerSeal save={save} size={44} />
                  </div>
                )}
                {it.kind === 'office' && <div className="office-preview" style={{ backgroundImage: motifUrl(it.data?.motif ?? 'plain', '#1d1d1b', 0.25) }} />}
                {(it.kind === 'ceremony' || it.kind === 'entrance') && <div className="glyph-preview">{it.kind === 'ceremony' ? '昇' : '入'}</div>}
              </div>
              <div className="si-name">{it.name}</div>
              <div className="muted small">{it.desc}</div>
              {owned ? (
                it.kind === 'trophy' ? (
                  <span className="muted small">In your office</span>
                ) : (
                  <button className="btn small" disabled={equipped} onClick={() => equip(it.id)}>
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                )
              ) : (
                <button className="btn small primary" onClick={() => buy(it.id)} disabled={locked}>
                  {locked ? `🔒 ${rankInfo(it.minRank!).title}` : money(it.price)}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="muted small">Purchases are cosmetic. Dollars can never buy rating, rank, or engine help in rated games.</p>
    </>
  );
}

function Office() {
  const { save } = useApp();
  const trophies = STORE.filter((i) => i.kind === 'trophy' && save.owned.includes(i.id));
  const office = itemById(save.equipped.office)?.data?.motif ?? 'plain';
  const unlocked = ACHIEVEMENTS.filter((a) => save.achievements[a.id]);
  const majors = save.career.promotions.filter((p) => rankInfo(p.rank).majorEntry);
  return (
    <>
      <Card className="office" style={{ backgroundImage: motifUrl(office, '#1d1d1b', 0.12) }}>
        <PlayerSeal save={save} size={88} />
        <div>
          <h2>{rankInfo(save.career.rank).full}</h2>
          <div className="muted">{arenaForRank(save.career.rank).name}</div>
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
      <h3>Title certificates</h3>
      <ul className="certs">
        {majors.length ? majors.map((p) => (
          <li key={p.at}>
            <span className="cert-seal">昇</span> {rankInfo(p.rank).full} <span className="muted small">· game {p.game}</span>
          </li>
        )) : <li className="muted small">Major titles you earn are framed here.</li>}
      </ul>
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
          {floors} floor{floors === 1 ? '' : 's'} · invested {money(hqValue(floors))} · net worth {money(save.wallet.balance + hqValue(floors))}
        </div>
        <button className="btn small primary" onClick={build} disabled={save.wallet.balance < price}>
          Build {floorName(floors)} — {money(price)}
        </button>
        <div className="muted small">Purely cosmetic. Your tower can rise forever.</div>
      </div>
    </Card>
  );
}

function Settings() {
  const { save } = useApp();
  const [io, setIo] = useState('');
  const set = (k: keyof typeof save.settings, v: boolean | string) =>
    updateSave((s) => {
      (s.settings as Record<string, unknown>)[k] = v;
    });
  const exported = useMemo(() => '', []);
  return (
    <>
      <Card>
        <h3>Play</h3>
        <label className="setting">
          <span>Default time control</span>
          <select value={save.settings.tc} onChange={(e) => set('tc', e.target.value)}>
            {TIME_CONTROLS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ['coordinates', 'Board coordinates'],
            ['showLegal', 'Highlight legal moves'],
            ['animations', 'Animations'],
            ['sound', 'Sound'],
            ['confirmResign', 'Confirm before resigning'],
          ] as const
        ).map(([k, l]) => (
          <label className="setting" key={k}>
            <span>{l}</span>
            <input type="checkbox" checked={save.settings[k] as boolean} onChange={(e) => set(k, e.target.checked)} />
          </label>
        ))}
        <label className="setting">
          <span>Name</span>
          <input
            value={save.profile.name}
            maxLength={24}
            onChange={(e) =>
              updateSave((s) => {
                s.profile.name = e.target.value;
              })
            }
          />
        </label>
      </Card>
      <Card>
        <h3>Save data</h3>
        <p className="muted small">Your career is stored only on this device (IndexedDB, with an automatic backup copy). Export a backup to move it.</p>
        <div className="btn-row">
          <button className="btn" onClick={() => setIo(exportSave(save))}>
            Export
          </button>
          <button
            className="btn"
            onClick={() => {
              const s = importSave(io);
              if (!s) return toast('That backup could not be read');
              commit(s);
              toast('Backup restored');
            }}
          >
            Import
          </button>
          <button
            className="btn danger"
            onClick={async () => {
              if (!confirm('Erase this career permanently?')) return;
              await wipeSave();
              commit(newSave());
              toast('Career reset');
            }}
          >
            Reset career
          </button>
        </div>
        <textarea className="io" value={io || exported} onChange={(e) => setIo(e.target.value)} placeholder="Backup text appears here; paste one to import." rows={4} />
      </Card>
      <p className="muted small">SEVEN v0.1 · rules SEVEN-1.0 · fully offline · no accounts, ads or purchases with real money.</p>
    </>
  );
}

export { Bar };
