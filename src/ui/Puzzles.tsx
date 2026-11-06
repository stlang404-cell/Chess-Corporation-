/**
 * Puzzle trainer. Puzzles are engine-mined and verified (scripts/mine-puzzles.ts);
 * each step has an ACCEPT set so every equally good move counts as correct.
 * A separate Glicko puzzle rating tracks progress and selects the next puzzle.
 */
import { useMemo, useState } from 'react';
import { useApp, updateSave } from './appState';
import { Board } from './Board';
import { Position, SQUARES, fileOf, rankOf, sq, mFrom, mTo, mPromo } from '../engine/board';
import { OFFICIAL } from '../engine/rules';
import { uciOf, uciToMove, moveToSan } from '../engine/game';
import { updateRating } from '../game/rating';
import { boardTheme, animMsFor, Card } from './common';
import PUZZLES_RAW from '../academy/puzzles.json';

export interface Puzzle {
  id: string;
  fen: string;
  themes: string[];
  rating: number;
  steps: { accept: string[]; reply?: string }[];
}
export const PUZZLES = PUZZLES_RAW as Puzzle[];
export const THEMES = ['mate-in-1', 'mate-in-2', 'mate-in-3+', 'fork', 'pin', 'skewer', 'discovered-attack', 'defence', 'promotion', 'endgame', 'material'];
const THEME_LABEL: Record<string, string> = {
  'mate-in-1': 'Mate in 1',
  'mate-in-2': 'Mate in 2',
  'mate-in-3+': 'Mate in 3+',
  fork: 'Fork',
  pin: 'Pin',
  skewer: 'Skewer',
  'discovered-attack': 'Discovered attack',
  defence: 'Defence',
  promotion: 'Promotion',
  endgame: 'Endgame',
  material: 'Win material',
};

const toIdx = (s: number) => rankOf(s) * 7 + fileOf(s);
const toSq = (i: number) => sq(i % 7, Math.floor(i / 7));

export function pickPuzzle(rating: number, done: Record<string, 0 | 1>, theme: string | null, skip: string | null): Puzzle | null {
  const pool = PUZZLES.filter((p) => !(p.id in done) && p.id !== skip && (!theme || p.themes.includes(theme)));
  if (!pool.length) return null;
  pool.sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating));
  return pool[Math.floor(Math.random() * Math.min(5, pool.length))];
}

export function Puzzles() {
  const { save } = useApp();
  const ps = save.academy.puzzle;
  const [theme, setTheme] = useState<string | null>(null);
  const [current, setCurrent] = useState<Puzzle | null>(() => pickPuzzle(ps.rating, ps.done, null, null));
  const next = (skip?: string) => setCurrent(pickPuzzle(save.academy.puzzle.rating, save.academy.puzzle.done, theme, skip ?? null));
  const counts = useMemo(() => Object.fromEntries(THEMES.map((t) => [t, PUZZLES.filter((p) => p.themes.includes(t)).length])), []);
  return (
    <>
      <div className="puzzle-stats">
        <div className="stat">
          <div className="stat-num">{Math.round(ps.rating)}</div>
          <div className="stat-label">Puzzle rating</div>
        </div>
        <div className="stat">
          <div className="stat-num">
            {ps.solved}/{ps.attempts}
          </div>
          <div className="stat-label">Solved</div>
        </div>
        <div className="stat">
          <div className="stat-num">{ps.streak}</div>
          <div className="stat-label">Streak (best {ps.best})</div>
        </div>
      </div>
      <div className="chips scroll-row" style={{ margin: '12px 0' }}>
        <button className={`chip ${theme === null ? 'on' : ''}`} onClick={() => { setTheme(null); setCurrent(pickPuzzle(ps.rating, ps.done, null, null)); }}>
          All · {PUZZLES.length}
        </button>
        {THEMES.filter((t) => counts[t] > 0).map((t) => (
          <button key={t} className={`chip ${theme === t ? 'on' : ''}`} onClick={() => { setTheme(t); setCurrent(pickPuzzle(ps.rating, ps.done, t, null)); }}>
            {THEME_LABEL[t]} · {counts[t]}
          </button>
        ))}
      </div>
      {current ? (
        <PuzzleBoard key={current.id} p={current} onNext={() => next(current.id)} />
      ) : (
        <Card>
          <p>You have attempted every puzzle{theme ? ' in this theme' : ''}. Choose another theme — more puzzles arrive with updates.</p>
        </Card>
      )}
      <p className="muted small">
        {PUZZLES.length} puzzles mined from engine games and verified at 300,000 nodes: each has one clearly best move (the alternatives lose at least 2.5 pawns or the mate), and every equally good move is accepted. The puzzle rating is separate from your game rating.
      </p>
    </>
  );
}

function PuzzleBoard({ p, onNext }: { p: Puzzle; onNext: () => void }) {
  const { save } = useApp();
  const [moves, setMoves] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [state, setStateP] = useState<'solving' | 'wrong' | 'solved' | 'shown'>('solving');
  const [failed, setFailed] = useState(false);
  const start = useMemo(() => Position.fromFen(p.fen, OFFICIAL), [p.fen]);
  const side = start.side;
  const pos = useMemo(() => {
    const q = Position.fromFen(p.fen, OFFICIAL);
    for (const m of moves) q.make(m);
    return q;
  }, [p.fen, moves]);
  const legal = useMemo(() => {
    const map = new Map<number, number[]>();
    if (state === 'solved' || state === 'shown' || pos.side !== side) return map;
    for (const m of pos.legalMoves()) {
      const a = toIdx(mFrom(m));
      map.set(a, [...(map.get(a) ?? []), toIdx(mTo(m))]);
    }
    return map;
  }, [pos, state, side]);

  const record = (ok: boolean) =>
    updateSave((s) => {
      const z = s.academy.puzzle;
      if (p.id in z.done) return;
      const r = updateRating({ r: z.rating, rd: z.rd, vol: z.vol }, p.rating, 80, ok ? 1 : 0);
      z.rating = r.r;
      z.rd = r.rd;
      z.vol = r.vol;
      z.attempts++;
      if (ok) {
        z.solved++;
        z.streak++;
        z.best = Math.max(z.best, z.streak);
      } else z.streak = 0;
      z.done[p.id] = ok ? 1 : 0;
    });

  const onMove = (a: number, b: number) => {
    const cands = pos.legalMoves().filter((m) => mFrom(m) === toSq(a) && mTo(m) === toSq(b));
    if (!cands.length) return;
    const accept = p.steps[step].accept;
    const m = cands.find((c) => accept.includes(uciOf(c))) ?? cands.find((c) => !mPromo(c) || mPromo(c) === 5) ?? cands[0];
    if (!accept.includes(uciOf(m))) {
      setStateP('wrong');
      if (!failed) {
        setFailed(true);
        record(false);
      }
      return;
    }
    const nm = [...moves, m];
    setMoves(nm);
    setStateP('solving');
    const st = p.steps[step];
    if (!st.reply || step + 1 >= p.steps.length) {
      setStateP('solved');
      if (!failed) record(true);
      return;
    }
    setTimeout(() => {
      const q = Position.fromFen(p.fen, OFFICIAL);
      for (const x of nm) q.make(x);
      const r = uciToMove(q, st.reply!);
      setMoves([...nm, r]);
      setStep(step + 1);
    }, 420);
  };

  const show = () => {
    const q = Position.fromFen(p.fen, OFFICIAL);
    const ms: number[] = [];
    for (const st of p.steps) {
      const m = uciToMove(q, st.accept[0]);
      ms.push(m);
      q.make(m);
      if (st.reply) {
        const r = uciToMove(q, st.reply);
        ms.push(r);
        q.make(r);
      }
    }
    if (!failed) {
      setFailed(true);
      record(false);
    }
    setMoves(ms);
    setStateP('shown');
  };
  const solutionSan = useMemo(() => {
    const q = Position.fromFen(p.fen, OFFICIAL);
    const out: string[] = [];
    for (const st of p.steps) {
      const m = uciToMove(q, st.accept[0]);
      out.push(moveToSan(q, m));
      q.make(m);
      if (st.reply) {
        const r = uciToMove(q, st.reply);
        out.push(moveToSan(q, r));
        q.make(r);
      }
    }
    return out.join(' ');
  }, [p]);
  const last = moves.length ? moves[moves.length - 1] : 0;
  const done = state === 'solved' || state === 'shown';
  return (
    <div className="exercise">
      <div className="ex-head row-between tight">
        <b>{side === 0 ? 'White' : 'Black'} to move — find the best move</b>
        <span className="muted small">≈{p.rating}</span>
      </div>
      <Board
        cells={SQUARES.map((s) => pos.board[s])}
        theme={boardTheme(save)}
        pieceSet={save.equipped.pieces}
        legal={legal}
        onMove={onMove}
        flipped={side === 1}
        lastMove={last ? [toIdx(mFrom(last)), toIdx(mTo(last))] : null}
        coordinates={save.settings.coordinates}
        animMs={animMsFor(save.settings.animSpeed)}
        highContrast={save.settings.highContrast}
      />
      <div className="ex-foot">
        {state === 'wrong' && <span className="warn">Not the best move. Try again — the puzzle now counts as missed.</span>}
        {state === 'solved' && <span className="ok">{failed ? 'Solved on a second try.' : 'Correct!'} {solutionSan}</span>}
        {state === 'shown' && <span>Solution: {solutionSan}</span>}
        {done && (
          <div>
            {p.themes.map((t) => (
              <span key={t} className="tag">
                {THEME_LABEL[t] ?? t}
              </span>
            ))}
          </div>
        )}
        <div className="btn-row">
          {!done && (
            <button className="btn small" onClick={show}>
              Show solution
            </button>
          )}
          <button className={`btn small ${done ? 'primary' : ''}`} onClick={onNext}>
            {done ? 'Next puzzle' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}
