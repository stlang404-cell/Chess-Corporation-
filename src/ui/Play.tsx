import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp, updateSave, commit, go, setState, toast, getState } from './appState';
import { Board, sqIndex } from './Board';
import { PieceSvg } from './pieces';
import { Position, SQUARES, sq, fileOf, rankOf, mFrom, mTo, mPromo, mFlag, FLAG_CASTLE, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, WHITE } from '../engine/board';
import { OFFICIAL, startFen } from '../engine/rules';
import { boardOutcome, moveToSan, uciOf, uciToMove, type Termination } from '../engine/game';
import { STYLES } from '../engine/ai';
import { engine, analyst } from './engineClient';
import { settleMatch, type SettlementReport } from '../game/settle';
import { TIME_CONTROLS, type ActiveMatch } from '../game/state';
import { identityOf } from '../game/opponents';
import { rankInfo } from '../game/career';
import { isProvisional } from '../game/rating';
import { boardTheme, CrestBadge, PlayerSeal, fmtClock, money, TERMINATION_LABEL, titleForRating, Bar } from './common';
import { playSound } from './sound';
import { startMatch, pickOpponent, nextKind } from './matchFlow';
import { itemById } from '../game/store';

const toIdx = (s: number) => rankOf(s) * 7 + fileOf(s);
const toSq = (i: number) => sq(i % 7, Math.floor(i / 7));

function buildPosition(moves: string[]) {
  const pos = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const sans: string[] = [];
  for (const u of moves) {
    const m = uciToMove(pos, u);
    if (!m) break;
    sans.push(moveToSan(pos, m));
    pos.make(m);
  }
  return { pos, sans };
}

function cellsOf(pos: Position) {
  return SQUARES.map((s) => pos.board[s]);
}

/** Can `color` still mate with what it has? (FIDE timeout rule) */
function canMate(pos: Position, color: number) {
  const c = pos.counts;
  const o = color << 3;
  if (c[o | PAWN] || c[o | ROOK] || c[o | QUEEN]) return true;
  return c[o | KNIGHT] + c[o | BISHOP] >= 2;
}

export function Play() {
  const { save } = useApp();
  const active = save.active;
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [casualResult, setCasualResult] = useState<{ score: number; term: Termination } | null>(null);
  const lastRef = useRef(active);
  if (active) lastRef.current = active;
  const m = active ?? lastRef.current;
  if (!m || (!active && !report && !casualResult)) return <NoGame />;
  return (
    <MatchView
      key={m.id}
      m={m}
      report={report}
      casualResult={casualResult}
      onReport={setReport}
      onCasual={setCasualResult}
      onClear={() => {
        setReport(null);
        setCasualResult(null);
      }}
    />
  );
}

function NoGame() {
  return (
    <div className="empty-play">
      <p>No game in progress.</p>
      <button className="btn primary" onClick={() => go('home')}>
        Go to MATCH
      </button>
      <button className="btn" onClick={() => setState({ tab: 'academy' })}>
        Practice in the Academy
      </button>
    </div>
  );
}

interface MVProps {
  m: ActiveMatch;
  report: SettlementReport | null;
  casualResult: { score: number; term: Termination } | null;
  onReport: (r: SettlementReport) => void;
  onCasual: (r: { score: number; term: Termination }) => void;
  onClear: () => void;
}

function MatchView({ m, report, casualResult, onReport, onCasual, onClear }: MVProps) {
  const { save } = useApp();
  const { pos, sans } = useMemo(() => buildPosition(m.moves), [m.moves]);
  const cells = useMemo(() => cellsOf(pos), [pos]);
  const playerColor = m.playerColor;
  const finished = !!m.finished;
  const myTurn = !finished && pos.side === playerColor;
  const tc = TIME_CONTROLS.find((t) => t.id === m.tc) ?? TIME_CONTROLS[0];
  const casual = m.kind === 'casual' || m.kind === 'training';
  const [thinking, setThinking] = useState(false);
  const [promo, setPromo] = useState<{ from: number; to: number } | null>(null);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [settling, setSettling] = useState<string | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const turnStart = useRef(performance.now());
  const [, force] = useState(0);
  const reqToken = useRef(0);
  const latest = useRef(m);
  latest.current = m;
  const opp = m.opponent;
  const oppId = identityOf(opp.id);

  // ---- persistence helper ----
  const persist = useCallback((next: ActiveMatch) => {
    latest.current = next;
    return updateSave((s) => {
      s.active = next;
    });
  }, []);

  const finish = useCallback(
    (cur: ActiveMatch, scoreWhite: number, termination: Termination) => {
      const score = (playerColor === WHITE ? scoreWhite : 1 - scoreWhite) as 0 | 0.5 | 1;
      const next: ActiveMatch = { ...cur, finished: { score, termination, endedAt: Date.now() } };
      playSound('end', getState().save.settings.sound);
      return persist(next);
    },
    [persist, playerColor],
  );

  // ---- apply a move (player or bot) ----
  const applyMove = useCallback(
    (uci: string) => {
      const cur = latest.current;
      if (cur.finished) return;
      const { pos: p } = buildPosition(cur.moves);
      const mv = uciToMove(p, uci);
      if (!mv) return;
      const side = p.side;
      const now = performance.now();
      const clocks: [number, number] = [...cur.clocks];
      if (cur.moves.length >= 1) clocks[side] = clocks[side] - (now - turnStart.current) + tc.incMs;
      turnStart.current = now;
      const isCap = p.board[mTo(mv)] !== 0;
      p.make(mv);
      playSound(p.inCheck() ? 'check' : isCap ? 'capture' : 'move', getState().save.settings.sound);
      const next: ActiveMatch = { ...cur, moves: [...cur.moves, uci], clocks };
      setHint(null);
      const out = boardOutcome(p);
      if (out) return finish(next, out.result, out.termination);
      return persist(next);
    },
    [finish, persist, tc.incMs],
  );

  // ---- bot turn ----
  useEffect(() => {
    if (finished || pos.side === playerColor || thinking) return;
    const token = ++reqToken.current;
    setThinking(true);
    const t0 = performance.now();
    engine
      .botMove(
        m.moves,
        // the bot respects its own clock: never spend more than ~1/25 of its remaining time + most of the increment
        { tier: opp.tier, style: opp.style, seed: m.seed, maxMs: Math.max(150, m.clocks[pos.side] / 25 + tc.incMs * 0.7) },
        m.moves.length < 2,
      )
      .then(async (r) => {
        const minDelay = 350 + Math.random() * 350;
        const spent = performance.now() - t0;
        if (spent < minDelay) await new Promise((res) => setTimeout(res, minDelay - spent));
        if (token !== reqToken.current) return;
        setThinking(false);
        applyMove(r.move);
      })
      .catch(() => {
        if (token === reqToken.current) setThinking(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.moves.length, finished, playerColor]);

  useEffect(() => () => void (reqToken.current++), []);

  // ---- clocks ----
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      const cur = latest.current;
      if (cur.finished || cur.moves.length < 1) return force((x) => x + 1);
      const { pos: p } = buildPositionCached(cur.moves);
      const left = cur.clocks[p.side] - (performance.now() - turnStart.current);
      if (left <= 0) {
        const other = p.side ^ 1;
        const scoreWhite = canMate(p, other) ? (p.side === WHITE ? 0 : 1) : 0.5;
        reqToken.current++;
        setThinking(false);
        const clocks: [number, number] = [...cur.clocks];
        clocks[p.side] = 0;
        finish({ ...cur, clocks }, scoreWhite, 'timeout');
      } else force((x) => x + 1);
    }, 100);
    return () => clearInterval(id);
  }, [finished, finish]);

  // ---- settlement ----
  useEffect(() => {
    if (!m.finished || report || casualResult || settling) return;
    if (casual) {
      onCasual({ score: m.finished.score, term: m.finished.termination });
      updateSave((s) => {
        s.active = null;
      });
      return;
    }
    let cancelled = false;
    (async () => {
      setSettling('Reviewing your game…');
      let accuracy: number | undefined = m.finished!.accuracy;
      const pm = playerColor === 0 ? Math.ceil(m.moves.length / 2) : Math.floor(m.moves.length / 2);
      if (accuracy === undefined && pm >= 15) {
        try {
          const res = await Promise.race([
            analyst.analyze(m.moves, playerColor, 9000),
            new Promise<null>((r) => setTimeout(() => r(null), 12000)),
          ]);
          if (res) accuracy = res.accuracy;
          else analyst.reset();
        } catch {
          /* no performance bonus without analysis */
        }
      }
      if (cancelled) return;
      const cur = getState().save;
      const match: ActiveMatch = { ...(cur.active ?? m), finished: { ...m.finished!, accuracy } };
      const { save: next, report: rep, duplicate } = settleMatch(cur, match);
      if (!duplicate) await commit(next);
      setSettling(null);
      if (rep) onReport(rep);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.finished]);

  // ---- user input ----
  const legal = useMemo(() => {
    const map = new Map<number, number[]>();
    if (!myTurn || thinking) return map;
    for (const mv of pos.legalMoves()) {
      const f = toIdx(mFrom(mv));
      const t = toIdx(mTo(mv));
      const arr = map.get(f) ?? [];
      if (!arr.includes(t)) arr.push(t);
      map.set(f, arr);
    }
    return map;
  }, [pos, myTurn, thinking]);

  const onMove = (fromI: number, toI: number) => {
    const from = toSq(fromI);
    const to = toSq(toI);
    const cands = pos.legalMoves().filter((mv) => mFrom(mv) === from && mTo(mv) === to);
    if (!cands.length) return;
    if (cands.length > 1 && cands.some((c) => mPromo(c) && mFlag(c) !== FLAG_CASTLE)) return setPromo({ from, to });
    applyMove(uciOf(cands[0]));
  };

  const resign = () => {
    if (finished) return;
    if (save.settings.confirmResign && !confirmResign) return setConfirmResign(true);
    setConfirmResign(false);
    reqToken.current++;
    setThinking(false);
    finish(latest.current, playerColor === WHITE ? 0 : 1, 'resignation');
  };

  const offerDraw = async () => {
    const cur = latest.current;
    if (cur.finished) return;
    if (!casual && cur.moves.length < 40) return toast('Draw offers open after move 20');
    if (cur.drawOffers >= 3) return toast('No more draw offers this game');
    await persist({ ...cur, drawOffers: cur.drawOffers + 1 });
    try {
      const r = await engine.evaluate(cur.moves, 40000);
      const botScore = r.side === playerColor ? -r.score : r.score;
      const ply = cur.moves.length;
      const style = opp.style;
      const accept = botScore <= -60 || (Math.abs(botScore) <= 20 && ply >= 80) || (style === 'defender' && botScore <= 15 && ply >= 60);
      if (accept && !latest.current.finished) {
        reqToken.current++;
        setThinking(false);
        finish(latest.current, 0.5, 'agreement');
      } else toast(`${oppId.name.split(' ')[0]} declines the draw`);
    } catch {
      toast('Draw offer could not be considered');
    }
  };

  const undo = () => {
    const cur = latest.current;
    if (!casual || cur.finished) return;
    reqToken.current++;
    engine.reset();
    setThinking(false);
    let moves = cur.moves.slice(0, -1);
    if (moves.length % 2 !== playerColor) moves = moves.slice(0, -1);
    if (moves.length % 2 !== playerColor) return;
    persist({ ...cur, moves, undos: cur.undos + 1 });
  };

  const askHint = async () => {
    if (m.kind !== 'training' || !myTurn) return;
    const r = await engine.evaluate(m.moves, 150000);
    setHint([sqIndex(r.move.slice(0, 2)), sqIndex(r.move.slice(2, 4))]);
  };

  // ---- derived display ----
  const now = performance.now();
  const shownClock = (c: number) => {
    if (finished || m.moves.length < 1 || pos.side !== c) return m.clocks[c];
    return Math.max(0, m.clocks[c] - (now - turnStart.current));
  };
  const lastUci = m.moves[m.moves.length - 1];
  const lastMove: [number, number] | null = lastUci ? [sqIndex(lastUci.slice(0, 2)), sqIndex(lastUci.slice(2, 4))] : null;
  const checkSq = pos.inCheck() ? toIdx(pos.kingSq[pos.side]) : null;
  const captured = capturedPieces(pos);
  const theme = boardTheme(save);
  const pieceSet = save.equipped.pieces;
  const entrance = (itemById(save.equipped.entrance)?.id ?? 'entrance.fade').split('.')[1];
  const series = save.career.series;
  const rank = rankInfo(save.career.rank);

  return (
    <div className={`play entrance-${entrance}`}>
      <div className="player-bar opp">
        <CrestBadge crest={oppId.crest} size={38} />
        <div className="pb-id">
          <div className="pb-name">
            {oppId.name} {opp.rival && <span className="rival-chip">rival</span>}
          </div>
          <div className="pb-sub">
            {opp.rating} · {STYLES[opp.style].label} · {titleForRating(opp.rating, opp.id)}
          </div>
        </div>
        <Captured list={captured[playerColor]} set={pieceSet} />
        <div className={`clock ${!finished && pos.side !== playerColor ? 'running' : ''} ${shownClock(1 - playerColor) < 20000 ? 'low' : ''}`}>
          {thinking && <span className="think-dot" />}
          {fmtClock(shownClock(1 - playerColor))}
        </div>
      </div>

      <div className="board-wrap">
        <Board
          cells={cells}
          flipped={playerColor === 1}
          legal={legal}
          onMove={onMove}
          lastMove={lastMove}
          checkSq={checkSq}
          theme={theme}
          pieceSet={pieceSet}
          coordinates={save.settings.coordinates}
          animate={save.settings.animations}
          showLegal={save.settings.showLegal}
          arrows={hint ? [hint] : undefined}
        />
        {promo && (
          <div className="promo-pick" role="dialog" aria-label="Choose promotion">
            {[QUEEN, ROOK, BISHOP, KNIGHT].map((t) => (
              <button
                key={t}
                onClick={() => {
                  const mv = pos.legalMoves().find((x) => mFrom(x) === promo.from && mTo(x) === promo.to && mPromo(x) === t);
                  setPromo(null);
                  if (mv) applyMove(uciOf(mv));
                }}
              >
                <PieceSvg code={(playerColor << 3) | t} set={pieceSet} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="player-bar me">
        <PlayerSeal save={save} size={38} />
        <div className="pb-id">
          <div className="pb-name">{rank.full}</div>
          <div className="pb-sub">
            {Math.round(save.rating.r)}
            {isProvisional(save.rating) ? '?' : ''} · {m.kind === 'series' && series ? `Promotion series ${series.games + 1}/${series.length}` : m.kind === 'ranked' ? 'Rated' : m.kind === 'cup' ? `Arena Cup · round ${(save.cup.active?.round ?? 0) + 1}/3` : m.kind === 'training' ? 'Training' : 'Casual'}
          </div>
        </div>
        <Captured list={captured[1 - playerColor]} set={pieceSet} />
        <div className={`clock ${myTurn ? 'running' : ''} ${shownClock(playerColor) < 20000 ? 'low' : ''}`}>{fmtClock(shownClock(playerColor))}</div>
      </div>

      <div className="controls">
        {casual && (
          <button className="btn" onClick={undo} disabled={finished || m.moves.length < 1}>
            Undo
          </button>
        )}
        {m.kind === 'training' && (
          <button className="btn" onClick={askHint} disabled={!myTurn}>
            Hint
          </button>
        )}
        <button className="btn" onClick={offerDraw} disabled={finished}>
          Offer draw
        </button>
        <button className={`btn ${confirmResign ? 'danger' : ''}`} onClick={resign} disabled={finished}>
          {confirmResign ? 'Confirm resign' : 'Resign'}
        </button>
      </div>

      <MoveList sans={sans} />

      {settling && (
        <div className="overlay settle">
          <div className="settle-box">
            <div className="spinner" />
            {settling}
          </div>
        </div>
      )}
      {report && <Results report={report} onClear={onClear} />}
      {casualResult && (
        <div className="overlay">
          <div className="results">
            <div className="res-head">{casualResult.score === 1 ? 'Victory' : casualResult.score === 0 ? 'Defeat' : 'Draw'}</div>
            <div className="res-sub">{TERMINATION_LABEL[casualResult.term]} · unrated</div>
            <div className="res-actions">
              <button
                className="btn primary"
                onClick={() => {
                  onClear();
                  startMatch(m.kind, m.opponent, (1 - m.playerColor) as 0 | 1, m.tc);
                }}
              >
                Play again
              </button>
              <button
                className="btn"
                onClick={() => {
                  onClear();
                  go('academy');
                }}
              >
                Academy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cache = new Map<string, ReturnType<typeof buildPosition>>();
function buildPositionCached(moves: string[]) {
  const k = moves.join(' ');
  let v = cache.get(k);
  if (!v) {
    cache.clear();
    v = buildPosition(moves);
    cache.set(k, v);
  }
  return v;
}

function capturedPieces(pos: Position): [number[], number[]] {
  // pieces each colour has LOST, by comparing to the starting army (promotions counted as pawns)
  const start = [0, 7, 1, 2, 2, 1, 1];
  const res: [number[], number[]] = [[], []];
  for (let c = 0; c < 2; c++) {
    let extra = 0;
    for (const t of [QUEEN, ROOK, BISHOP, KNIGHT]) extra += Math.max(0, pos.counts[(c << 3) | t] - start[t]);
    for (const t of [QUEEN, ROOK, BISHOP, KNIGHT, PAWN]) {
      let lost = start[t] - pos.counts[(c << 3) | t];
      if (t === PAWN) lost -= extra;
      for (let i = 0; i < lost; i++) res[c].push((c << 3) | t);
    }
  }
  return res;
}

function Captured({ list, set }: { list: number[]; set: string }) {
  return (
    <div className="captured" aria-label="captured pieces">
      {list.map((c, i) => (
        <span key={i} className="cap-pc">
          <PieceSvg code={c} set={set} />
        </span>
      ))}
    </div>
  );
}

function MoveList({ sans }: { sans: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ left: 99999, top: 99999 });
  }, [sans.length]);
  const rows = [];
  for (let i = 0; i < sans.length; i += 2)
    rows.push(
      <span key={i} className="mv">
        <b>{i / 2 + 1}.</b> {sans[i]} {sans[i + 1] ?? ''}
      </span>,
    );
  return (
    <div className="movelist" ref={ref}>
      {rows.length ? rows : <span className="muted">Moves appear here.</span>}
    </div>
  );
}

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      setV(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Results({ report, onClear }: { report: SettlementReport; onClear: () => void }) {
  const { save } = useApp();
  const delta = report.ratingAfter - report.ratingBefore;
  const d = useCountUp(delta);
  const dollars = useCountUp(report.dollars, 1200);
  const head = report.score === 1 ? 'Victory' : report.score === 0 ? 'Defeat' : 'Draw';
  const ceremony = save.equipped.ceremony;
  const last = save.history[0];
  const nextMatch = () => {
    onClear();
    setState({ tab: 'home', autoMatch: true });
  };
  const rematch = () => {
    onClear();
    if (save.career.series) return startMatch(nextKind(), pickOpponent());
    const o = last ? save.opponents[String(last.oppId)] : null;
    if (!last || !o) return nextMatch();
    startMatch('ranked', { id: o.id, tier: o.tier, style: o.style, rating: o.rating, rd: last ? 60 : 60, name: o.name, rival: o.g >= 3 }, (1 - last.color) as 0 | 1);
  };
  return (
    <div className="overlay">
      {report.promoted && <Ceremony kind={ceremony} title={rankInfo(report.rankAfter).full} />}
      <div className={`results res-${head.toLowerCase()}`}>
        <div className="res-head">{head}</div>
        <div className="res-sub">{TERMINATION_LABEL[report.termination] ?? report.termination}</div>
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
        {report.promoted && <div className="banner promo-banner">Promoted to {rankInfo(report.rankAfter).full}</div>}
        {report.cupResult === 'won' && <div className="banner promo-banner">Arena Cup champion — trophy added to your office</div>}
        {report.cupResult === 'advanced' && <div className="banner series">Arena Cup: through to round {(report.cupRound ?? 0) + 1} of 3</div>}
        {report.cupResult === 'eliminated' && <div className="banner warn">Knocked out of the Arena Cup</div>}
        {report.demoted && <div className="banner warn">Moved down to {rankInfo(report.rankAfter).full}</div>}
        {report.seriesStarted && report.series && (
          <div className="banner series">Promotion series unlocked — best of {report.series.length} for {rankInfo(report.series.targetRank).full}</div>
        )}
        {report.seriesResult === 'failed' && <div className="banner warn">Promotion series not passed. Regroup and earn another shot.</div>}
        {report.series && !report.seriesStarted && (
          <div className="banner series">
            Series: {report.series.wins} pts after {report.series.games} of {report.series.length}
          </div>
        )}
        {!report.series && !report.promoted && (
          <div className="res-merit">
            <div className="promo-head">
              <span>Merit {report.meritChange >= 0 ? '+' : ''}{report.meritChange}</span>
              <span>
                {report.meritAfter} / {report.meritNeeded}
              </span>
            </div>
            <Bar value={report.meritAfter} max={report.meritNeeded} />
            {report.gateBlocked && <div className="promo-req warn">Promotion requires rating {report.gateBlocked}</div>}
          </div>
        )}
        {report.pay.length > 0 && (
          <ul className="pay">
            {report.pay.map((l, i) => (
              <li key={i}>
                <span>{l.label}</span>
                <span>{money(l.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        {report.pay.length === 0 && <div className="muted small">No pay: games under 10 moves earn no salary.</div>}
        <div className="res-actions">
          <button className="btn primary" onClick={nextMatch}>
            Next match
          </button>
          <button className="btn" onClick={rematch}>
            {save.career.series ? 'Next series game' : 'Rematch'}
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
  );
}

function Ceremony({ kind, title }: { kind: string; title: string }) {
  const n = kind === 'ceremony.ink' ? 0 : 26;
  return (
    <div className={`ceremony ${kind.replace('.', '-')}`} aria-hidden>
      <div className="stamp">
        <span>昇</span>
      </div>
      <div className="ceremony-title">{title}</div>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="flake" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.18}s` }} />
      ))}
    </div>
  );
}
