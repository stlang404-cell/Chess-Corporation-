import { useEffect, useMemo, useState } from 'react';
import { useApp, updateSave, setState, toast } from './appState';
import { Board, sqIndex } from './Board';
import { Position, SQUARES, fileOf, rankOf, mFrom, mTo, mPromo, sq } from '../engine/board';
import { OFFICIAL, startFen } from '../engine/rules';
import { moveToSan, sanToMove, uciOf, uciToMove } from '../engine/game';
import { STYLES, STYLE_IDS, TIERS, type StyleId } from '../engine/ai';
import { analyst } from './engineClient';
import type { MoveAnalysis } from '../engine/analysis';
import { boardTheme, Card, Segmented } from './common';
import { parseMarkdown, Inline, blockText, type Block } from './markdown';
import { botRating, botRd } from '../game/bots';
import { identityOf } from '../game/opponents';
import { startMatch } from './matchFlow';
import { TIME_CONTROLS } from '../game/state';

const RAW = import.meta.glob('../../docs/guide/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export interface Chapter {
  file: string;
  title: string;
  blocks: Block[];
}
import RULES_MD from '../../docs/RULES.md?raw';
export const CHAPTERS: Chapter[] = ['__rules__', ...Object.keys(RAW).sort()]
  .map((file) => {
    if (file === '__rules__') {
      const blocks = parseMarkdown(RULES_MD);
      return { file: 'RULES.md', title: 'Official Rules (SEVEN-1.0)', blocks };
    }
    const blocks = parseMarkdown(RAW[file]);
    const h = blocks.find((b) => b.t === 'h') as { text: string } | undefined;
    return { file: file.split('/').pop()!, title: h?.text ?? file, blocks };
  });
const EXERCISES = CHAPTERS.flatMap((c) =>
  c.blocks
    .filter((b) => b.t === 'exercise')
    .map((b) => ({ ...(b as { fields: Record<string, string> }).fields, chapter: c.title }) as Record<string, string>),
);

type Sec = 'guide' | 'exercises' | 'review' | 'practice';

const toIdx = (s: number) => rankOf(s) * 7 + fileOf(s);
const toSq = (i: number) => sq(i % 7, Math.floor(i / 7));
const cellsOf = (p: Position) => SQUARES.map((s) => p.board[s]);

export function Academy() {
  const { academyIntent } = useApp();
  const [sec, setSec] = useState<Sec>(academyIntent?.kind === 'review' ? 'review' : 'guide');
  useEffect(() => {
    if (academyIntent?.kind === 'review') setSec('review');
  }, [academyIntent]);
  return (
    <div className="page">
      <Segmented<Sec>
        value={sec}
        onChange={setSec}
        options={[
          ['guide', 'Guide'],
          ['exercises', 'Exercises'],
          ['review', 'Review'],
          ['practice', 'Practice'],
        ]}
      />
      {sec === 'guide' && <Guide />}
      {sec === 'exercises' && <ExerciseList />}
      {sec === 'review' && <Review />}
      {sec === 'practice' && <Practice />}
    </div>
  );
}

// ---------------- Guide ----------------
function Guide() {
  const [open, setOpen] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const { save } = useApp();
  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const needle = q.toLowerCase();
    const res: { ch: number; text: string }[] = [];
    CHAPTERS.forEach((c, ci) =>
      c.blocks.forEach((b) => {
        const t = blockText(b);
        const k = t.toLowerCase().indexOf(needle);
        if (k >= 0) res.push({ ch: ci, text: t.slice(Math.max(0, k - 50), k + 90) });
      }),
    );
    return res.slice(0, 40);
  }, [q]);
  if (!CHAPTERS.length) return <p className="muted">The guide is being written.</p>;
  if (open !== null) {
    const c = CHAPTERS[open];
    return (
      <div className="chapter">
        <div className="row-between">
          <button className="btn small" onClick={() => setOpen(null)}>
            ← Contents
          </button>
          <span className="muted small">
            Chapter {open + 1} of {CHAPTERS.length}
          </span>
        </div>
        <Blocks blocks={c.blocks} mark={q} />
        <div className="row-between">
          {open > 0 ? (
            <button className="btn small" onClick={() => setOpen(open - 1)}>
              ← {CHAPTERS[open - 1].title}
            </button>
          ) : (
            <span />
          )}
          {open < CHAPTERS.length - 1 && (
            <button
              className="btn small primary"
              onClick={() => {
                updateSave((s) => {
                  s.academy.readChapters[c.file] = Date.now();
                });
                setOpen(open + 1);
                window.scrollTo(0, 0);
              }}
            >
              {CHAPTERS[open + 1].title} →
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <>
      <input className="search" placeholder="Search the official guide…" value={q} onChange={(e) => setQ(e.target.value)} />
      {results.length > 0 ? (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i} onClick={() => setOpen(r.ch)}>
              <b>{CHAPTERS[r.ch].title}</b>
              <div className="muted small">…<Inline text={r.text} mark={q} />…</div>
            </li>
          ))}
        </ul>
      ) : (
        <ol className="toc">
          {CHAPTERS.map((c, i) => (
            <li key={c.file} onClick={() => setOpen(i)} className={save.academy.readChapters[c.file] ? 'read' : ''}>
              <span>{c.title}</span>
              <span className="muted small">{c.blocks.filter((b) => b.t === 'exercise').length || ''}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function Blocks({ blocks, mark }: { blocks: Block[]; mark?: string }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'h': {
            const H = (`h${Math.min(4, b.level + 1)}` as unknown) as 'h2';
            return <H key={i} id={b.id}>{b.text}</H>;
          }
          case 'p':
            return (
              <p key={i}>
                <Inline text={b.text} mark={mark} />
              </p>
            );
          case 'ul':
          case 'ol': {
            const L = b.t;
            return (
              <L key={i}>
                {b.items.map((it, k) => (
                  <li key={k}>
                    <Inline text={it} mark={mark} />
                  </li>
                ))}
              </L>
            );
          }
          case 'quote': {
            const cls = b.text.startsWith('**Hypothesis') ? 'hyp' : b.text.startsWith('**Established') ? 'est' : '';
            return (
              <blockquote key={i} className={cls}>
                <Inline text={b.text} mark={mark} />
              </blockquote>
            );
          }
          case 'code':
            return <pre key={i}>{b.text}</pre>;
          case 'seven':
            return <Diagram key={i} f={b.fields} />;
          case 'exercise':
            return <Exercise key={i} f={b.fields} />;
          case 'game':
            return <GameViewer key={i} f={b.fields} />;
        }
      })}
    </div>
  );
}

function safePos(fen?: string) {
  try {
    return Position.fromFen(fen || startFen(OFFICIAL), OFFICIAL);
  } catch {
    return Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  }
}

function Diagram({ f }: { f: Record<string, string> }) {
  const { save } = useApp();
  const p = safePos(f.fen);
  const hl = (f.highlight ?? '').split(/\s+/).filter(Boolean).map(sqIndex);
  const arrows = (f.arrows ?? '')
    .split(/\s+/)
    .filter((a) => a.length >= 4)
    .map((a) => [sqIndex(a.slice(0, 2)), sqIndex(a.slice(2, 4))] as [number, number]);
  return (
    <figure className="diagram">
      <Board cells={cellsOf(p)} theme={boardTheme(save)} pieceSet={save.equipped.pieces} highlights={hl} arrows={arrows} small />
      <figcaption>
        <Inline text={f.caption ?? ''} /> <span className="muted small">({p.side === 0 ? 'White' : 'Black'} to move)</span>
      </figcaption>
    </figure>
  );
}

export function Exercise({ f }: { f: Record<string, string> }) {
  const { save } = useApp();
  const solution = (f.solution ?? '').split(/\s+/).filter((x) => x && !/^\d+\.+$/.test(x));
  const [step, setStep] = useState(0);
  const [moves, setMoves] = useState<number[]>([]);
  const [status, setStatus] = useState<'' | 'wrong' | 'done' | 'shown'>('');
  const pos = useMemo(() => {
    const p = safePos(f.fen);
    for (const m of moves) p.make(m);
    return p;
  }, [f.fen, moves]);
  const solvedBefore = !!save.academy.solved[f.id];
  const playerSide = safePos(f.fen).side;
  const legal = useMemo(() => {
    const map = new Map<number, number[]>();
    if (status === 'done' || status === 'shown' || pos.side !== playerSide) return map;
    for (const m of pos.legalMoves()) {
      const a = toIdx(mFrom(m));
      map.set(a, [...(map.get(a) ?? []), toIdx(mTo(m))]);
    }
    return map;
  }, [pos, status, playerSide]);
  const norm = (s: string) => s.replace(/[+#!?]/g, '');
  const onMove = (a: number, b: number) => {
    const cands = pos.legalMoves().filter((m) => mFrom(m) === toSq(a) && mTo(m) === toSq(b));
    const m = cands.find((c) => !mPromo(c) || mPromo(c) === 5) ?? cands[0];
    if (!m) return;
    const san = moveToSan(pos, m);
    if (norm(san) !== norm(solution[step])) {
      setStatus('wrong');
      return;
    }
    const next = [...moves, m];
    setStatus('');
    if (step + 1 >= solution.length) {
      setMoves(next);
      setStep(step + 1);
      finish();
      return;
    }
    // opponent reply
    const p2 = safePos(f.fen);
    for (const x of next) p2.make(x);
    const reply = sanToMove(p2, solution[step + 1]);
    setMoves(next);
    setTimeout(() => {
      setMoves([...next, reply]);
      setStep(step + 2);
      if (step + 2 >= solution.length) finish();
    }, 450);
  };
  const finish = () => {
    setStatus('done');
    if (!save.academy.solved[f.id])
      updateSave((s) => {
        s.academy.solved[f.id] = Date.now();
      });
  };
  const show = () => {
    const p = safePos(f.fen);
    const ms: number[] = [];
    for (const s of solution) {
      const m = sanToMove(p, s);
      if (!m) break;
      ms.push(m);
      p.make(m);
    }
    setMoves(ms);
    setStatus('shown');
  };
  const last = moves.length ? moves[moves.length - 1] : 0;
  return (
    <div className="exercise">
      <div className="ex-head">
        <span className="ex-level">{'●'.repeat(+f.level || 1)}</span> <b>{f.prompt}</b> {solvedBefore && <span className="ok small">solved</span>}
      </div>
      <Board
        cells={cellsOf(pos)}
        theme={boardTheme(save)}
        pieceSet={save.equipped.pieces}
        legal={legal}
        onMove={onMove}
        flipped={playerSide === 1}
        lastMove={last ? [toIdx(mFrom(last)), toIdx(mTo(last))] : null}
        coordinates={save.settings.coordinates}
      />
      <div className="ex-foot">
        {status === 'wrong' && <span className="warn">Not the strongest move — try again.</span>}
        {(status === 'done' || status === 'shown') && (
          <span className={status === 'done' ? 'ok' : ''}>
            {status === 'done' ? 'Correct. ' : ''}
            {solution.join(' ')} — <Inline text={f.explanation ?? ''} />
          </span>
        )}
        <span className="btn-row">
          <button
            className="btn small"
            onClick={() => {
              setMoves([]);
              setStep(0);
              setStatus('');
            }}
          >
            Reset
          </button>
          <button className="btn small" onClick={show}>
            Show solution
          </button>
        </span>
      </div>
    </div>
  );
}

function parseGameMoves(text: string): string[] {
  return text
    .replace(/\{[^}]*\}/g, '')
    .split(/\s+/)
    .filter((t) => t && !/^\d+\.+$/.test(t) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t))
    .map((t) => t.replace(/^\d+\.+/, ''))
    .filter(Boolean);
}

function GameViewer({ f }: { f: Record<string, string> }) {
  const { save } = useApp();
  const sans = parseGameMoves(f.moves ?? '');
  const notes = useMemo(() => {
    const n: Record<number, string> = {};
    for (const part of (f.notes ?? '').split('|')) {
      const m = part.trim().match(/^(\d+)(b?):\s*(.*)$/);
      if (m) n[(+m[1] - 1) * 2 + (m[2] ? 1 : 0)] = m[3];
    }
    return n;
  }, [f.notes]);
  const [ply, setPly] = useState(0);
  const { pos, last } = useMemo(() => {
    const p = safePos(f.fen);
    let last = 0;
    for (let i = 0; i < ply; i++) {
      const m = sanToMove(p, sans[i]);
      if (!m) break;
      p.make(m);
      last = m;
    }
    return { pos: p, last };
  }, [ply, f.fen, f.moves]);
  return (
    <div className="gameviewer">
      <div className="ex-head">
        <b>{f.title}</b>
      </div>
      <Board cells={cellsOf(pos)} theme={boardTheme(save)} pieceSet={save.equipped.pieces} lastMove={last ? [toIdx(mFrom(last)), toIdx(mTo(last))] : null} small />
      <div className="btn-row">
        <button className="btn small" onClick={() => setPly(0)}>
          ⏮
        </button>
        <button className="btn small" onClick={() => setPly(Math.max(0, ply - 1))}>
          ◀
        </button>
        <button className="btn small" onClick={() => setPly(Math.min(sans.length, ply + 1))}>
          ▶
        </button>
        <button className="btn small" onClick={() => setPly(sans.length)}>
          ⏭
        </button>
      </div>
      <div className="movelist wrap">
        {sans.map((s, i) => (
          <span key={i} className={`mv ${i === ply - 1 ? 'cur' : ''}`} onClick={() => setPly(i + 1)}>
            {i % 2 === 0 && <b>{i / 2 + 1}.</b>} {s}
          </span>
        ))}
      </div>
      {ply > 0 && notes[ply - 1] && <p className="note">{notes[ply - 1]}</p>}
    </div>
  );
}

// ---------------- Exercises ----------------
function ExerciseList() {
  const { save } = useApp();
  const [level, setLevel] = useState(0);
  const [idx, setIdx] = useState<number | null>(null);
  const list = EXERCISES.filter((e) => !level || +e.level === level);
  if (!EXERCISES.length) return <p className="muted">Exercises appear once the guide is installed.</p>;
  if (idx !== null && list[idx]) {
    return (
      <>
        <div className="row-between">
          <button className="btn small" onClick={() => setIdx(null)}>
            ← All exercises
          </button>
          <span className="muted small">
            {idx + 1}/{list.length} · {list[idx].chapter}
          </span>
        </div>
        <Exercise key={list[idx].id} f={list[idx]} />
        <div className="row-between">
          <button className="btn small" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            ← Previous
          </button>
          <button className="btn small primary" disabled={idx >= list.length - 1} onClick={() => setIdx(idx + 1)}>
            Next →
          </button>
        </div>
      </>
    );
  }
  const solved = EXERCISES.filter((e) => save.academy.solved[e.id]).length;
  return (
    <>
      <div className="row-between">
        <div className="chips">
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <button key={l} className={`chip ${l === level ? 'on' : ''}`} onClick={() => setLevel(l)}>
              {l ? 'Level ' + l : 'All'}
            </button>
          ))}
        </div>
        <span className="muted small">
          {solved}/{EXERCISES.length} solved
        </span>
      </div>
      <ul className="ex-list">
        {list.map((e, i) => (
          <li key={e.id} onClick={() => setIdx(i)} className={save.academy.solved[e.id] ? 'got' : ''}>
            <span className="ex-level">{'●'.repeat(+e.level || 1)}</span>
            <span>{e.prompt}</span>
            <span className="muted small">{e.chapter}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------------- Review ----------------
function Review() {
  const { save, academyIntent } = useApp();
  const [id, setId] = useState<string | null>(academyIntent?.kind === 'review' ? academyIntent.matchId : save.history[0]?.id ?? null);
  const game = save.history.find((h) => h.id === id);
  const [ply, setPly] = useState(0);
  const [an, setAn] = useState<{ moves: MoveAnalysis[]; accuracy: number } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  useEffect(() => {
    if (academyIntent) setState({ academyIntent: null });
    setAn(null);
    setPly(game?.moves.length ?? 0);
  }, [id]);
  const { pos, last } = useMemo(() => {
    const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
    let last = 0;
    for (let i = 0; i < ply && game; i++) {
      const m = uciToMove(p, game.moves[i]);
      if (!m) break;
      p.make(m);
      last = m;
    }
    return { pos: p, last };
  }, [ply, game]);
  const sans = useMemo(() => {
    if (!game) return [];
    const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
    return game.moves.map((u) => {
      const m = uciToMove(p, u);
      const s = moveToSan(p, m);
      p.make(m);
      return s;
    });
  }, [game]);
  if (!game) return <p className="muted">Finished games appear here for review.</p>;
  const run = async () => {
    setProgress(0);
    try {
      const r = await analyst.analyze(game.moves, null, save.owned.includes('amenity.desk') ? 90000 : 30000, setProgress);
      setAn(r);
    } catch {
      toast('Analysis interrupted');
    }
    setProgress(null);
  };
  const cur = an?.moves[ply - 1];
  return (
    <>
      <select className="game-pick" value={id ?? ''} onChange={(e) => setId(e.target.value)}>
        {save.history.map((h) => (
          <option key={h.id} value={h.id}>
            {new Date(h.at).toLocaleDateString()} · {h.score === 1 ? 'W' : h.score === 0 ? 'L' : 'D'} vs {h.oppName} ({h.oppRating})
          </option>
        ))}
      </select>
      <Board
        cells={cellsOf(pos)}
        theme={boardTheme(save)}
        pieceSet={save.equipped.pieces}
        flipped={game.color === 1}
        lastMove={last ? [toIdx(mFrom(last)), toIdx(mTo(last))] : null}
        coordinates={save.settings.coordinates}
        arrows={cur && cur.tag !== 'best' && cur.bestSan !== cur.san ? arrowForSan(game.moves, ply - 1, cur.bestSan) : undefined}
      />
      <div className="btn-row">
        <button className="btn small" onClick={() => setPly(0)}>⏮</button>
        <button className="btn small" onClick={() => setPly(Math.max(0, ply - 1))}>◀</button>
        <button className="btn small" onClick={() => setPly(Math.min(game.moves.length, ply + 1))}>▶</button>
        <button className="btn small" onClick={() => setPly(game.moves.length)}>⏭</button>
        {!an && (
          <button className="btn small primary" onClick={run} disabled={progress !== null}>
            {progress !== null ? `Analysing ${Math.round(progress * 100)}%` : 'Engine analysis'}
          </button>
        )}
      </div>
      {an && <EvalGraph moves={an.moves} ply={ply} onPick={setPly} />}
      {an && (
        <div className="muted small">
          White accuracy {acc(an.moves, 0)}% · Black accuracy {acc(an.moves, 1)}%{cur ? ` · ${cur.san}: ${cur.tag || 'ok'}${cur.tag && cur.tag !== 'best' ? ` (best ${cur.bestSan})` : ''}` : ''}
        </div>
      )}
      <div className="movelist wrap">
        {sans.map((s, i) => (
          <span key={i} className={`mv ${i === ply - 1 ? 'cur' : ''} ${an?.moves[i]?.tag ?? ''}`} onClick={() => setPly(i + 1)}>
            {i % 2 === 0 && <b>{i / 2 + 1}.</b>} {s}
          </span>
        ))}
      </div>
      <p className="muted small">Analysis is for review only and is never available during rated games.</p>
    </>
  );
}

function acc(ms: MoveAnalysis[], color: number) {
  const mine = ms.filter((m) => m.ply % 2 === color);
  if (!mine.length) return '—';
  return Math.round(mine.reduce((a, m) => a + m.accuracy, 0) / mine.length);
}

function arrowForSan(moves: string[], plyIndex: number, san: string): [number, number][] | undefined {
  const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  for (let i = 0; i < plyIndex; i++) p.make(uciToMove(p, moves[i]));
  const m = sanToMove(p, san);
  if (!m) return undefined;
  const u = uciOf(m);
  return [[sqIndex(u.slice(0, 2)), sqIndex(u.slice(2, 4))]];
}

function EvalGraph({ moves, ply, onPick }: { moves: MoveAnalysis[]; ply: number; onPick: (p: number) => void }) {
  const w = 320;
  const h = 70;
  const y = (cp: number) => h / 2 - (Math.max(-600, Math.min(600, cp)) / 600) * (h / 2);
  const pts = moves.map((m, i) => `${((i + 1) / moves.length) * w},${y(m.evalWhite)}`).join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="evalgraph"
      preserveAspectRatio="none"
      onClick={(e) => {
        const r = (e.currentTarget as SVGElement).getBoundingClientRect();
        onPick(Math.max(0, Math.min(moves.length, Math.round(((e.clientX - r.left) / r.width) * moves.length))));
      }}
    >
      <rect width={w} height={h / 2} fill="#f7f3ea" />
      <rect y={h / 2} width={w} height={h / 2} fill="#d9d2c3" />
      <polyline points={`0,${h / 2} ${pts}`} fill="none" stroke="#1d1d1b" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {moves.map((m, i) =>
        m.tag === 'blunder' || m.tag === 'mistake' ? <circle key={i} cx={((i + 1) / moves.length) * w} cy={y(m.evalWhite)} r="2.5" fill={m.tag === 'blunder' ? '#b5452f' : '#c69a3c'} /> : null,
      )}
      <line x1={(ply / Math.max(1, moves.length)) * w} x2={(ply / Math.max(1, moves.length)) * w} y1="0" y2={h} stroke="#b5452f" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ---------------- Practice ----------------
function Practice() {
  const { save } = useApp();
  const [tier, setTier] = useState(3);
  const [style, setStyle] = useState<StyleId>('balanced');
  const [color, setColor] = useState<'w' | 'b' | 'r'>('r');
  const [mode, setMode] = useState<'training' | 'casual'>('training');
  const [tc, setTc] = useState(save.settings.tc);
  const id = useMemo(() => Math.floor(Math.random() * 0x7fffffff), [tier, style]);
  const begin = () => {
    const c = color === 'w' ? 0 : color === 'b' ? 1 : Math.random() < 0.5 ? 0 : 1;
    startMatch(mode, { id, tier, style, rating: botRating(tier, style), rd: botRd(tier), name: identityOf(id).name }, c as 0 | 1, tc);
  };
  return (
    <Card>
      <h3>Practice game</h3>
      <p className="muted small">Unrated. Training mode allows undo and engine hints. No rating, merit or dollars change.</p>
      <label className="setting">
        <span>Opponent strength</span>
        <select value={tier} onChange={(e) => setTier(+e.target.value)}>
          {TIERS.map((t) => (
            <option key={t.tier} value={t.tier}>
              Tier {t.tier} · ≈{botRating(t.tier, style)}
            </option>
          ))}
        </select>
      </label>
      <label className="setting">
        <span>Style</span>
        <select value={style} onChange={(e) => setStyle(e.target.value as StyleId)}>
          {STYLE_IDS.map((s) => (
            <option key={s} value={s}>
              {STYLES[s].label}
            </option>
          ))}
        </select>
      </label>
      <label className="setting">
        <span>Your colour</span>
        <select value={color} onChange={(e) => setColor(e.target.value as 'w' | 'b' | 'r')}>
          <option value="r">Random</option>
          <option value="w">White</option>
          <option value="b">Black</option>
        </select>
      </label>
      <label className="setting">
        <span>Mode</span>
        <select value={mode} onChange={(e) => setMode(e.target.value as 'training' | 'casual')}>
          <option value="training">Training (undo, hints)</option>
          <option value="casual">Casual (undo)</option>
        </select>
      </label>
      <label className="setting">
        <span>Clock</span>
        <select value={tc} onChange={(e) => setTc(e.target.value)}>
          {TIME_CONTROLS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <button className="btn primary wide" onClick={begin} disabled={!!save.active && !save.active.finished}>
        {save.active && !save.active.finished ? 'Finish your current game first' : 'Start practice game'}
      </button>
    </Card>
  );
}
