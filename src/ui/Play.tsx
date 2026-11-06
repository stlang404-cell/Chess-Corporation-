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
import { type ActiveMatch } from '../game/state';
import { isUntimed, clocksAfterMove, hasFlagged, botThinkCapMs } from '../game/clock';
import { identityOf, opponentCareer } from '../game/opponents';
import { rankInfo } from '../game/career';
import { isProvisional } from '../game/rating';
import { boardTheme, CrestBadge, fmtClock, TERMINATION_LABEL, animMsFor } from './common';
import { Insignia } from './Insignia';
import { playSound } from './sound';
import { startMatch } from './matchFlow';
import { itemById } from '../game/store';
import { toPgn } from '../game/pgn';
import { Icon } from './icons';
import { Results } from './Results';

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
const cellsOf = (pos: Position) => SQUARES.map((s) => pos.board[s]);

/** Can `color` still mate with what it has? (timed games only: FIDE timeout rule) */
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
    <div className="empty-state">
      <div className="empty-seal">盤</div>
      <h2 className="display">No game in progress</h2>
      <p className="muted">Press MATCH on Home for a rated game, or practise in the Academy.</p>
      <div className="btn-row center">
        <button className="btn primary" onClick={() => go('home')}>
          Go to MATCH
        </button>
        <button className="btn" onClick={() => setState({ tab: 'academy' })}>
          Practice
        </button>
      </div>
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
  const untimed = isUntimed(m);
  const casual = m.kind === 'casual' || m.kind === 'training';
  const [thinking, setThinking] = useState(false);
  const [promo, setPromo] = useState<{ from: number; to: number } | null>(null);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [settling, setSettling] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'resign' | 'draw'>(null);
  const [flipped, setFlipped] = useState(playerColor === 1);
  const [menu, setMenu] = useState(false);
  const turnStart = useRef(performance.now());
  const [, force] = useState(0);
  const reqToken = useRef(0);
  const latest = useRef(m);
  latest.current = m;
  const opp = m.opponent;
  const oppId = identityOf(opp.id);
  const oppCareer = opponentCareer(opp.id, opp.rating);

  const persist = useCallback((next: ActiveMatch) => {
    latest.current = next;
    return updateSave((s) => {
      s.active = next;
    });
  }, []);

  const finish = useCallback(
    (cur: ActiveMatch, scoreWhite: number, termination: Termination) => {
      const score = (playerColor === WHITE ? scoreWhite : 1 - scoreWhite) as 0 | 0.5 | 1;
      playSound('end', getState().save.settings.sound);
      return persist({ ...cur, finished: { score, termination, endedAt: Date.now() } });
    },
    [persist, playerColor],
  );

  const applyMove = useCallback(
    (uci: string) => {
      const cur = latest.current;
      if (cur.finished) return;
      const { pos: p } = buildPosition(cur.moves);
      const mv = uciToMove(p, uci);
      if (!mv) return;
      const side = p.side;
      const now = performance.now();
      const clocks = clocksAfterMove(cur, side, now - turnStart.current);
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
    [finish, persist],
  );

  // ---- engine turn (runs in a Web Worker; the UI stays responsive) ----
  useEffect(() => {
    if (finished || pos.side === playerColor || thinking) return;
    const token = ++reqToken.current;
    setThinking(true);
    const t0 = performance.now();
    engine
      .botMove(m.moves, { tier: opp.tier, style: opp.style, seed: m.seed, maxMs: botThinkCapMs(m, pos.side, getState().save.settings.aiThink) }, m.moves.length < 2)
      .then(async (r) => {
        const minDelay = 260 + Math.random() * 240;
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
  useEffect(() => () => void reqToken.current++, []);

  // ---- clocks: timed games only ----
  useEffect(() => {
    if (finished || untimed) return;
    const id = setInterval(() => {
      const cur = latest.current;
      if (cur.finished || cur.moves.length < 1) return force((x) => x + 1);
      const { pos: p } = buildPosition(cur.moves);
      if (hasFlagged(cur, p.side, performance.now() - turnStart.current)) {
        const scoreWhite = canMate(p, p.side ^ 1) ? (p.side === WHITE ? 0 : 1) : 0.5;
        reqToken.current++;
        setThinking(false);
        const clocks: [number, number] = [...cur.clocks!];
        clocks[p.side] = 0;
        finish({ ...cur, clocks }, scoreWhite, 'timeout');
      } else force((x) => x + 1);
    }, 200);
    return () => clearInterval(id);
  }, [finished, finish, untimed]);

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
          const res = await Promise.race([analyst.analyze(m.moves, playerColor, 9000), new Promise<null>((r) => setTimeout(() => r(null), 12000))]);
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

  // ---- input ----
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
    if (save.settings.confirmResign && confirm !== 'resign') return setConfirm('resign');
    setConfirm(null);
    reqToken.current++;
    setThinking(false);
    finish(latest.current, playerColor === WHITE ? 0 : 1, 'resignation');
  };

  const offerDraw = async () => {
    const cur = latest.current;
    setConfirm(null);
    if (cur.finished) return;
    if (!casual && cur.moves.length < 40) return toast('Draw offers open after move 20 in rated games.');
    if (cur.drawOffers >= 3) return toast('No more draw offers this game.');
    await persist({ ...cur, drawOffers: cur.drawOffers + 1 });
    try {
      const r = await engine.evaluate(cur.moves, 40000);
      const botScore = r.side === playerColor ? -r.score : r.score;
      const ply = cur.moves.length;
      const accept = botScore <= -60 || (Math.abs(botScore) <= 20 && ply >= 80) || (opp.style === 'defender' && botScore <= 15 && ply >= 60);
      if (accept && !latest.current.finished) {
        reqToken.current++;
        setThinking(false);
        finish(latest.current, 0.5, 'agreement');
      } else toast(`${oppId.name.split(' ')[0]} declines the draw.`);
    } catch {
      toast('The draw offer could not be considered.');
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
    const mentor = save.owned.includes('amenity.mentor');
    const r = await engine.evaluate(m.moves, mentor ? 450000 : 150000);
    setHint([sqIndex(r.move.slice(0, 2)), sqIndex(r.move.slice(2, 4))]);
    if (mentor && r.pv.length) toast('Mentor: ' + r.pv.join(' '));
  };

  const exportGame = async () => {
    setMenu(false);
    const pgn = toPgn({ moves: m.moves, color: m.playerColor, score: m.finished?.score ?? 0.5, oppName: oppId.name, oppRating: opp.rating, at: m.startedAt, termination: m.finished?.termination ?? 'abandoned', kind: m.kind, playerName: save.profile.name });
    try {
      await navigator.clipboard.writeText(pgn);
      toast('Game copied as SEVEN-PGN.');
    } catch {
      toast('Copy unavailable on this device.');
    }
  };

  // ---- display ----
  const now = performance.now();
  const shownClock = (c: number) => {
    if (!m.clocks) return 0;
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
  const rank = rankInfo(save.career.rank, save.career.family);
  const material = materialBalance(pos) * (playerColor === 0 ? 1 : -1);
  const kindLabel =
    m.kind === 'series' && series
      ? `Promotion series · game ${series.games + 1} of ${series.length}`
      : m.kind === 'cup'
        ? `Arena Cup · round ${(save.cup.active?.round ?? 0) + 1} of 3`
        : m.kind === 'ranked'
          ? 'Rated'
          : m.kind === 'training'
            ? 'Training · unrated'
            : 'Casual · unrated';
  const status = finished
    ? 'Game over'
    : thinking
      ? `${oppId.name.split(' ')[0]} is thinking`
      : myTurn
        ? pos.inCheck()
          ? 'Your move — you are in check'
          : 'Your move'
        : 'Waiting…';

  return (
    <div className={`play entrance-${entrance}`}>
      <div className="match-head">
        <span className="kind-chip">{kindLabel}</span>
        <span className="muted small">{untimed ? 'Untimed — take your time' : 'Timed'}</span>
      </div>
      <div className="play-grid">
        <div className="board-col">
          <PlayerBar
            side="opp"
            name={oppId.name}
            sub={`${opp.rating} · ${STYLES[opp.style].label}`}
            title={oppCareer.line}
            avatar={<CrestBadge crest={oppId.crest} size={40} />}
            captured={captured[playerColor]}
            advantage={material < 0 ? -material : 0}
            pieceSet={pieceSet}
            active={!finished && !myTurn}
            thinking={thinking}
            clock={untimed ? null : fmtClock(shownClock(1 - playerColor))}
            low={!untimed && shownClock(1 - playerColor) < 20000}
            rival={opp.rival}
          />
          <div className="board-wrap">
            <Board
              cells={cells}
              flipped={flipped}
              legal={legal}
              onMove={onMove}
              lastMove={lastMove}
              checkSq={checkSq}
              theme={theme}
              pieceSet={pieceSet}
              coordinates={save.settings.coordinates}
              animMs={animMsFor(save.settings.animSpeed)}
              showLegal={save.settings.showLegal}
              highContrast={save.settings.highContrast}
              arrows={hint ? [hint] : undefined}
            />
            {promo && (
              <div className="promo-pick" role="dialog" aria-label="Choose a promotion piece">
                <div className="promo-title">Promote to</div>
                <div className="promo-row">
                  {[QUEEN, ROOK, BISHOP, KNIGHT].map((t) => (
                    <button
                      key={t}
                      aria-label={['', '', 'Knight', 'Bishop', 'Rook', 'Queen'][t]}
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
                <button className="btn ghost small" onClick={() => setPromo(null)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
          <PlayerBar
            side="me"
            name={save.profile.name && save.profile.name !== 'You' ? save.profile.name : rank.title}
            sub={`${Math.round(save.rating.r)}${isProvisional(save.rating) ? '?' : ''} · ${rank.full}`}
            avatar={<Insignia rank={save.career.rank} family={save.career.family} size={40} />}
            captured={captured[1 - playerColor]}
            advantage={material > 0 ? material : 0}
            pieceSet={pieceSet}
            active={myTurn}
            clock={untimed ? null : fmtClock(shownClock(playerColor))}
            low={!untimed && shownClock(playerColor) < 20000}
          />
        </div>

        <aside className="side-col">
          <div className={`turn ${myTurn ? 'mine' : ''}`} aria-live="polite">
            {thinking && <span className="dots" aria-hidden><i /><i /><i /></span>}
            {status}
          </div>
          <div className="controls" role="toolbar" aria-label="Game controls">
            <button className="ctl" onClick={() => setFlipped(!flipped)} title="Flip board">
              <Icon name="flip" />
              <span>Flip</span>
            </button>
            {casual && (
              <button className="ctl" onClick={undo} disabled={finished || m.moves.length < 1}>
                <Icon name="undo" />
                <span>Undo</span>
              </button>
            )}
            {m.kind === 'training' && (
              <button className="ctl" onClick={askHint} disabled={!myTurn}>
                <Icon name="bulb" />
                <span>Hint</span>
              </button>
            )}
            <button className="ctl" onClick={() => setConfirm(confirm === 'draw' ? null : 'draw')} disabled={finished}>
              <Icon name="draw" />
              <span>Draw</span>
            </button>
            <button className={`ctl ${confirm === 'resign' ? 'danger' : ''}`} onClick={resign} disabled={finished}>
              <Icon name="flag" />
              <span>{confirm === 'resign' ? 'Confirm' : 'Resign'}</span>
            </button>
            <button className="ctl" onClick={() => setMenu(!menu)} aria-expanded={menu}>
              <Icon name="more" />
              <span>More</span>
            </button>
          </div>
          {confirm === 'draw' && (
            <div className="confirm-row">
              <span>Offer a draw to {oppId.name.split(' ')[0]}?</span>
              <button className="btn small primary" onClick={offerDraw}>
                Offer
              </button>
              <button className="btn small ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
            </div>
          )}
          {confirm === 'resign' && (
            <div className="confirm-row warn">
              <span>Resign this game? It counts as a loss.</span>
              <button className="btn small ghost" onClick={() => setConfirm(null)}>
                Keep playing
              </button>
            </div>
          )}
          {menu && (
            <div className="menu-pop">
              <button onClick={exportGame}>
                <Icon name="copy" size={16} /> Copy game (SEVEN-PGN)
              </button>
              <button
                onClick={() =>
                  updateSave((s) => {
                    s.settings.sound = !s.settings.sound;
                  })
                }
              >
                <Icon name="sound" size={16} /> Sound {save.settings.sound ? 'on' : 'off'}
              </button>
              <button
                onClick={() =>
                  updateSave((s) => {
                    s.settings.coordinates = !s.settings.coordinates;
                  })
                }
              >
                <Icon name="board" size={16} /> Coordinates {save.settings.coordinates ? 'on' : 'off'}
              </button>
            </div>
          )}
          <MoveList sans={sans} />
        </aside>
      </div>

      {settling && (
        <div className="overlay settle" role="status">
          <div className="settle-box">
            <div className="spinner" />
            {settling}
          </div>
        </div>
      )}
      {report && <Results report={report} onClear={onClear} />}
      {casualResult && (
        <div className="overlay">
          <div className="results sheet">
            <div className={`res-head ${casualResult.score === 1 ? 'win' : ''}`}>{casualResult.score === 1 ? 'Victory' : casualResult.score === 0 ? 'Defeat' : 'Draw'}</div>
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

function PlayerBar(p: {
  side: 'me' | 'opp';
  name: string;
  sub: string;
  title?: string;
  avatar: React.ReactNode;
  captured: number[];
  advantage: number;
  pieceSet: string;
  active: boolean;
  thinking?: boolean;
  clock: string | null;
  low: boolean;
  rival?: boolean;
}) {
  return (
    <div className={`player-bar ${p.side} ${p.active ? 'active' : ''}`}>
      <div className="pb-avatar">{p.avatar}</div>
      <div className="pb-id">
        <div className="pb-name">
          {p.name} {p.rival && <span className="rival-chip">rival</span>}
        </div>
        <div className="pb-sub">{p.sub}</div>
        {p.title && <div className="pb-title">{p.title}</div>}
      </div>
      <div className="captured" aria-label="captured pieces">
        {p.captured.map((c, i) => (
          <span key={i} className="cap-pc">
            <PieceSvg code={c} set={p.pieceSet} />
          </span>
        ))}
        {p.advantage > 0 && <span className="adv">+{p.advantage}</span>}
      </div>
      {p.clock !== null && <div className={`clock ${p.active ? 'running' : ''} ${p.low ? 'low' : ''}`}>{p.clock}</div>}
      {p.clock === null && p.active && <span className="turn-dot" aria-label={p.thinking ? 'thinking' : 'to move'} />}
    </div>
  );
}

function capturedPieces(pos: Position): [number[], number[]] {
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
function materialBalance(pos: Position) {
  const v = [0, 1, 3, 3, 5, 9, 0];
  let s = 0;
  for (let t = 1; t <= 5; t++) s += v[t] * (pos.counts[t] - pos.counts[8 | t]);
  return s;
}

function MoveList({ sans }: { sans: string[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sans.length]);
  const rows = [];
  for (let i = 0; i < sans.length; i += 2)
    rows.push(
      <li key={i}>
        <span className="mv-n">{i / 2 + 1}</span>
        <span className={`mv ${i === sans.length - 1 ? 'cur' : ''}`}>{sans[i]}</span>
        <span className={`mv ${i + 1 === sans.length - 1 ? 'cur' : ''}`}>{sans[i + 1] ?? ''}</span>
      </li>,
    );
  return (
    <details className="moves-panel" open>
      <summary>Moves {sans.length ? `· ${Math.ceil(sans.length / 2)}` : ''}</summary>
      <ol className="movelist" ref={ref}>
        {rows.length ? rows : <li className="muted empty">Moves appear here.</li>}
      </ol>
    </details>
  );
}
