/**
 * Game review — SEVEN's signature post-match feature. Uses the review stored at
 * settlement (standard rev-3) when present, or analyses on demand. Never
 * available during a game in progress.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp, setState, toast, updateSave } from './appState';
import { Board, sqIndex, type BoardEffect } from './Board';
import { Position, SQUARES, fileOf, rankOf, mFrom, mTo, mPromo } from '../engine/board';
import { OFFICIAL, startFen } from '../engine/rules';
import { moveToSan, sanToMove, uciOf, uciToMove } from '../engine/game';
import { analyst } from './engineClient';
import { boardTheme, animMsFor } from './common';
import { compactReview, expandReview, turningPoints, type ExpandedMove } from '../game/review';
import { winPct } from '../game/economy';
import type { CompactReview } from '../game/state';

const Q_LABEL: Record<string, string> = { brilliant: 'Brilliant', great: 'Great', best: 'Best', excellent: 'Excellent', good: 'Good', inaccuracy: 'Inaccuracy', mistake: 'Mistake', blunder: 'Blunder' };
const Q_ORDER = ['brilliant', 'great', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'];
const toIdx = (s: number) => rankOf(s) * 7 + fileOf(s);
const fmtEval = (cp: number) => (Math.abs(cp) >= 2000 ? `${cp > 0 ? '+' : '−'}mate` : `${cp >= 0 ? '+' : '−'}${(Math.abs(cp) / 100).toFixed(1)}`);

function positionAt(moves: string[], ply: number) {
  const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  let last = 0;
  for (let i = 0; i < ply; i++) {
    const m = uciToMove(p, moves[i]);
    if (!m) break;
    p.make(m);
    last = m;
  }
  return { pos: p, last };
}

export function Review() {
  const { save, academyIntent } = useApp();
  const [id, setId] = useState<string | null>(academyIntent?.kind === 'review' ? academyIntent.matchId : save.history[0]?.id ?? null);
  const game = save.history.find((h) => h.id === id);
  const [ply, setPly] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const [local, setLocal] = useState<CompactReview | null>(null);
  const [retry, setRetry] = useState<{ ply: number; result: string | null } | null>(null);
  useEffect(() => {
    if (academyIntent) setState({ academyIntent: null });
    setLocal(null);
    setRetry(null);
    setPly(game?.moves.length ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const review = game?.review ?? local;
  const moves = useMemo(() => (review ? expandReview(review) : []), [review]);
  const sans = useMemo(() => {
    if (!game) return [];
    const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
    const out: string[] = [];
    for (const u of game.moves) {
      const m = uciToMove(p, u);
      if (!m) break;
      out.push(moveToSan(p, m));
      p.make(m);
    }
    return out;
  }, [game]);
  const turning = useMemo(() => turningPoints(moves), [moves]);
  if (!game)
    return (
      <div className="empty-state">
        <div className="empty-seal">検</div>
        <h2 className="display">No games to review yet</h2>
        <p className="muted">Every finished match is reviewed by the engine. Play one and come back.</p>
      </div>
    );

  const analyse = async () => {
    setProgress(0);
    try {
      const r = await analyst.analyze(game.moves, game.color, save.owned.includes('amenity.desk') ? 40000 : 15000, setProgress);
      const c = compactReview(r.moves, game.color);
      setLocal(c);
      // store for next time (review data only — compensation is never recomputed)
      updateSave((s) => {
        const h = s.history.find((x) => x.id === game.id);
        if (h && !h.review) h.review = c;
      });
    } catch {
      toast('Analysis interrupted');
    }
    setProgress(null);
  };

  const viewPly = retry ? retry.ply : ply;
  const { pos, last } = positionAt(game.moves, viewPly);
  const cur: ExpandedMove | undefined = !retry ? moves[ply - 1] : undefined;
  const effects: BoardEffect[] = [];
  if (cur && last && ['brilliant', 'great', 'best', 'mistake', 'blunder'].includes(cur.quality)) effects.push({ sq: toIdx(mTo(last)), kind: cur.quality as BoardEffect['kind'] });
  let arrows: [number, number][] | undefined;
  if (cur && !['best', 'great', 'brilliant'].includes(cur.quality)) {
    const before = positionAt(game.moves, ply - 1).pos;
    const bm = sanToMove(before, cur.bestSan);
    if (bm) arrows = [[toIdx(mFrom(bm)), toIdx(mTo(bm))]];
  }
  const evalNow = viewPly === 0 ? 0 : moves[viewPly - 1]?.evalWhite ?? 0;
  const mine = (q: string) => moves.filter((m) => m.ply % 2 === game.color && m.quality === q).length;
  const theirs = (q: string) => moves.filter((m) => m.ply % 2 !== game.color && m.quality === q).length;
  const accOf = (c: number) => {
    const ms = moves.filter((m) => m.ply % 2 === c);
    return ms.length ? Math.round(ms.reduce((a, m) => a + Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * Math.max(0, m.winBefore - m.winAfter)) - 3.1669)), 0) / ms.length) : 0;
  };
  const canRetry = cur && cur.ply % 2 === game.color && (['inaccuracy', 'mistake', 'blunder'].includes(cur.quality) || cur.missedWin);

  // retry: legal moves in the position before the mistake
  const legal = new Map<number, number[]>();
  if (retry && !retry.result)
    for (const m of pos.legalMoves()) {
      const a = toIdx(mFrom(m));
      legal.set(a, [...(legal.get(a) ?? []), toIdx(mTo(m))]);
    }
  const onRetryMove = async (a: number, b: number) => {
    if (!retry) return;
    const cands = pos.legalMoves().filter((m) => toIdx(mFrom(m)) === a && toIdx(mTo(m)) === b);
    const m = cands.find((c) => !mPromo(c) || mPromo(c) === 5) ?? cands[0];
    if (!m) return;
    const tried = moveToSan(pos, m);
    const target = moves[retry.ply];
    if (tried.replace(/[+#]/g, '') === target.bestSan.replace(/[+#]/g, '')) return setRetry({ ...retry, result: `✓ ${tried} — the engine's choice.` });
    setRetry({ ...retry, result: 'Checking…' });
    try {
      const r = await analyst.evaluate([...game.moves.slice(0, retry.ply), uciOf(m)], 60000);
      const triedWin = 100 - winPct(Math.max(-2000, Math.min(2000, r.score))); // r.score is from the opponent's view
      const diff = target.winBefore - triedWin;
      setRetry({
        ...retry,
        result: diff < 3 ? `✓ ${tried} — just as good as ${target.bestSan}.` : diff < 10 ? `≈ ${tried} is fine (−${Math.round(diff)}% win chance). Best was ${target.bestSan}.` : `✗ ${tried} loses ${Math.round(diff)}% win chance. Best was ${target.bestSan}.`,
      });
    } catch {
      setRetry({ ...retry, result: `Best was ${target.bestSan}.` });
    }
  };

  return (
    <div className="review">
      <select className="select game-pick" value={id ?? ''} onChange={(e) => setId(e.target.value)} aria-label="Choose a game">
        {save.history.map((h) => (
          <option key={h.id} value={h.id}>
            {new Date(h.at).toLocaleDateString()} · {h.score === 1 ? 'Win' : h.score === 0 ? 'Loss' : 'Draw'} vs {h.oppName} ({h.oppRating}){h.review ? '' : ' · not reviewed'}
          </option>
        ))}
      </select>
      <div className="review-grid">
        <div className="rv-board">
          <EvalBar cp={evalNow} flipped={game.color === 1} />
          <Board
            cells={SQUARES.map((s) => pos.board[s])}
            theme={boardTheme(save)}
            pieceSet={save.equipped.pieces}
            flipped={game.color === 1}
            lastMove={!retry && last ? [toIdx(mFrom(last)), toIdx(mTo(last))] : null}
            coordinates={save.settings.coordinates}
            animMs={animMsFor(save.settings.animSpeed)}
            arrows={arrows}
            effects={effects}
            legal={retry && !retry.result ? legal : undefined}
            onMove={retry ? onRetryMove : undefined}
            drag={save.settings.dragPieces}
          />
        </div>
        <div className="rv-side">
          {!review ? (
            <div className="card center">
              <p className="muted">This game was not reviewed when it was played.</p>
              <button className="btn primary" onClick={analyse} disabled={progress !== null}>
                {progress !== null ? `Analysing ${Math.round(progress * 100)}%` : 'Analyse with the engine'}
              </button>
            </div>
          ) : (
            <>
              <div className="rv-acc">
                <div>
                  <span className="rv-num">{accOf(game.color)}%</span>
                  <span className="muted small">You</span>
                </div>
                <div>
                  <span className="rv-num muted">{accOf(1 - game.color)}%</span>
                  <span className="muted small">{game.oppName.split(' ')[0]}</span>
                </div>
              </div>
              <table className="qtable">
                <tbody>
                  {Q_ORDER.map((q) => (
                    <tr key={q} className={`q-${q}`}>
                      <td>{Q_LABEL[q]}</td>
                      <td>{mine(q)}</td>
                      <td className="muted">{theirs(q)}</td>
                    </tr>
                  ))}
                  <tr className="q-miss">
                    <td>Missed wins</td>
                    <td>{moves.filter((m) => m.ply % 2 === game.color && m.missedWin).length}</td>
                    <td className="muted">{moves.filter((m) => m.ply % 2 !== game.color && m.missedWin).length}</td>
                  </tr>
                </tbody>
              </table>
              <EvalGraph moves={moves} ply={ply} turning={turning} onPick={(p) => { setRetry(null); setPly(p); }} />
              {turning.length > 0 && (
                <div className="turning">
                  <span className="muted small">Critical moments</span>
                  {turning.map((t) => (
                    <button key={t} className="chip" onClick={() => { setRetry(null); setPly(t + 1); }}>
                      {Math.floor(t / 2) + 1}
                      {t % 2 ? '…' : '.'} {sans[t]}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="btn-row center nav-row">
            <button className="btn small" onClick={() => { setRetry(null); setPly(0); }} aria-label="Start">⏮</button>
            <button className="btn small" onClick={() => { setRetry(null); setPly(Math.max(0, ply - 1)); }} aria-label="Previous">◀</button>
            <button className="btn small" onClick={() => { setRetry(null); setPly(Math.min(game.moves.length, ply + 1)); }} aria-label="Next">▶</button>
            <button className="btn small" onClick={() => { setRetry(null); setPly(game.moves.length); }} aria-label="End">⏭</button>
          </div>
          {retry ? (
            <div className="move-card retry">
              <b>Retry: find a better move for move {Math.floor(retry.ply / 2) + 1}</b>
              <div className="muted small">{retry.result ?? 'Make your move on the board.'}</div>
              <div className="btn-row">
                {retry.result && (
                  <button className="btn small" onClick={() => setRetry({ ...retry, result: null })}>
                    Try again
                  </button>
                )}
                <button className="btn small ghost" onClick={() => setRetry(null)}>
                  Back to review
                </button>
              </div>
            </div>
          ) : (
            cur && (
              <div className={`move-card q-border-${cur.quality}`}>
                <div>
                  <b>
                    {Math.floor(cur.ply / 2) + 1}
                    {cur.ply % 2 ? '…' : '.'} {sans[cur.ply]}
                  </b>{' '}
                  <span className={`qual q-${cur.quality}`}>{Q_LABEL[cur.quality]}</span>
                  {cur.missedWin && <span className="qual q-miss">Missed win</span>}
                </div>
                <div className="small">
                  Eval {fmtEval(cur.evalWhite)} · win chance {cur.winBefore}% → {cur.winAfter}%
                </div>
                {!['best', 'great', 'brilliant'].includes(cur.quality) && <div className="small">Best was <b>{cur.bestSan}</b> (arrow).</div>}
                {canRetry && (
                  <button className="btn small primary" onClick={() => setRetry({ ply: cur.ply, result: null })}>
                    Retry this move
                  </button>
                )}
              </div>
            )
          )}
          <div className="movelist wrap">
            {sans.map((s, i) => (
              <span key={i} className={`mv ${i === ply - 1 ? 'cur' : ''} ${moves[i] ? 'q-' + moves[i].quality : ''}`} onClick={() => { setRetry(null); setPly(i + 1); }}>
                {i % 2 === 0 && <b>{i / 2 + 1}.</b>} {s}
              </span>
            ))}
          </div>
          <p className="muted small">
            Review standard {review?.standard ?? 'rev-3'}: every move searched at a fixed budget; "Brilliant" requires a real sacrifice in an unclear position and is re-verified 4× deeper. Engine help is never available during a game.
          </p>
        </div>
      </div>
    </div>
  );
}

function EvalBar({ cp, flipped }: { cp: number; flipped: boolean }) {
  const w = winPct(Math.max(-2000, Math.min(2000, cp)));
  return (
    <div className={`evalbar ${flipped ? 'flip' : ''}`} aria-label={`Evaluation ${fmtEval(cp)}`}>
      <div className="eb-white" style={{ height: `${w}%` }} />
      <span className="eb-label">{fmtEval(cp)}</span>
    </div>
  );
}

function EvalGraph({ moves, ply, turning, onPick }: { moves: ExpandedMove[]; ply: number; turning: number[]; onPick: (p: number) => void }) {
  const w = 320;
  const h = 76;
  if (!moves.length) return null;
  const y = (cp: number) => h - (winPct(Math.max(-2000, Math.min(2000, cp))) / 100) * h;
  const x = (i: number) => ((i + 1) / moves.length) * w;
  const pts = moves.map((m, i) => `${x(i)},${y(m.evalWhite)}`).join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="evalgraph"
      preserveAspectRatio="none"
      role="img"
      aria-label="Evaluation history"
      onClick={(e) => {
        const r = (e.currentTarget as SVGElement).getBoundingClientRect();
        onPick(Math.max(0, Math.min(moves.length, Math.round(((e.clientX - r.left) / r.width) * moves.length))));
      }}
    >
      <rect width={w} height={h} className="eg-bot" />
      <polygon points={`0,${h} 0,${h / 2} ${pts} ${w},${h}`} className="eg-white" />
      <line x1="0" x2={w} y1={h / 2} y2={h / 2} className="eg-mid" vectorEffect="non-scaling-stroke" />
      {moves.map((m, i) =>
        ['blunder', 'mistake', 'brilliant', 'great'].includes(m.quality) ? <circle key={i} cx={x(i)} cy={y(m.evalWhite)} r="2.6" className={`dot-q q-${m.quality}`} /> : null,
      )}
      {turning.map((t) => (
        <line key={'t' + t} x1={x(t)} x2={x(t)} y1="0" y2={h} className="eg-turn" vectorEffect="non-scaling-stroke" />
      ))}
      <line x1={(ply / moves.length) * w} x2={(ply / moves.length) * w} y1="0" y2={h} className="eg-cursor" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export { sqIndex };
