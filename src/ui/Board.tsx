/**
 * SEVEN board renderer with a dedicated animation system.
 *
 * Authoritative rule: pieces are ALWAYS rendered at their real squares (the game
 * state). Animation is purely visual and applied afterwards (FLIP): in a layout
 * effect, every piece whose square changed is animated from its previous square
 * to its current one with the Web Animations API. Consequences:
 *   - no CSS transitions, so nothing ever animates from stale coordinates;
 *   - a new position cancels any running animation (it simply jumps to the
 *     already-correct end state), so rapid moves and engine replies are safe;
 *   - drag-and-drop moves land instantly where the piece was dropped;
 *   - flipping the board, mounting, or resuming never animates;
 *   - captured pieces are drawn as short-lived "ghosts" that fade as the
 *     attacker arrives, then removed — the real board is never touched.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPE, type KeyboardEvent as RKE } from 'react';
import { PieceSvg } from './pieces';

export interface BoardEffect {
  sq: number;
  kind: 'promotion' | 'brilliant' | 'great' | 'best' | 'mistake' | 'blunder' | 'mate';
}

export interface BoardProps {
  cells: number[];
  flipped?: boolean;
  legal?: Map<number, number[]>;
  onMove?: (from: number, to: number) => void;
  lastMove?: [number, number] | null;
  checkSq?: number | null;
  mateSq?: number | null;
  highlights?: number[];
  arrows?: [number, number][];
  effects?: BoardEffect[];
  theme: { light: string; dark: string; line: string };
  pieceSet: string;
  coordinates?: boolean;
  /** base ms for a one-square move; 0 disables animation */
  animMs?: number;
  showLegal?: boolean;
  small?: boolean;
  label?: string;
  highContrast?: boolean;
  /** allow dragging pieces (tap-to-move always works) */
  drag?: boolean;
}

const FILES = 'abcdefg';
export const sqName = (i: number) => FILES[i % 7] + (Math.floor(i / 7) + 1);
export const sqIndex = (n: string) => FILES.indexOf(n[0]) + (parseInt(n.slice(1), 10) - 1) * 7;
const PIECE_WORD = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const EASE = 'cubic-bezier(0.22, 0.8, 0.24, 1)';

interface Placed {
  key: number;
  code: number;
  sq: number;
}

let keySeq = 1;
/** Assign stable identities to pieces so a moved piece keeps its key. */
export function assignKeys(prev: Placed[], cells: number[], lastMove?: [number, number] | null): { placed: Placed[]; gone: Placed[] } {
  const out: (Placed | null)[] = cells.map(() => null);
  const used = new Set<number>();
  const prevAt = new Map(prev.map((p) => [p.sq, p]));
  cells.forEach((c, i) => {
    const p = prevAt.get(i);
    if (c && p && p.code === c && !(lastMove && lastMove[0] === i)) {
      out[i] = { ...p };
      used.add(p.key);
    }
  });
  if (lastMove) {
    const [f, t] = lastMove;
    const p = prevAt.get(f);
    if (p && cells[t] && !out[t] && !used.has(p.key) && (p.code === cells[t] || (p.code & 7) === 1)) {
      out[t] = { key: p.key, code: cells[t], sq: t };
      used.add(p.key);
    }
  }
  cells.forEach((c, i) => {
    if (!c || out[i]) return;
    // nearest vanished piece of the same kind (castling rook, en passant, undo)
    let best: Placed | null = null;
    let bd = 99;
    for (const p of prev) {
      if (p.code !== c || used.has(p.key) || cells[p.sq] === c) continue;
      const d = Math.abs((p.sq % 7) - (i % 7)) + Math.abs(Math.floor(p.sq / 7) - Math.floor(i / 7));
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    if (best) {
      out[i] = { key: best.key, code: c, sq: i };
      used.add(best.key);
    } else out[i] = { key: keySeq++, code: c, sq: i };
  });
  return { placed: out.filter((x): x is Placed => !!x), gone: prev.filter((p) => !used.has(p.key)) };
}

export function Board(props: BoardProps) {
  const { cells, flipped = false, legal, onMove, lastMove, checkSq, theme, pieceSet, coordinates = true, small } = props;
  const animMs = props.animMs ?? 170;
  const dragEnabled = props.drag !== false;
  const [sel, setSel] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ from: number; x: number; y: number; moved: boolean } | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [ghosts, setGhosts] = useState<(Placed & { delay: number })[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const placedRef = useRef<Placed[]>([]);
  const goneRef = useRef<Placed[]>([]);
  const els = useRef(new Map<number, HTMLDivElement>());
  const prevSq = useRef(new Map<number, number>());
  const prevFlipped = useRef(flipped);
  const suppress = useRef<number | null>(null);

  // identity of the position by CONTENT (callers may rebuild identical arrays every render)
  const cellsKey = cells.join(',');
  const lastKey = lastMove ? `${lastMove[0]}-${lastMove[1]}` : '';
  const placed = useMemo(() => {
    const { placed: next, gone } = assignKeys(placedRef.current, cells, lastMove);
    goneRef.current = placedRef.current.length ? gone : [];
    placedRef.current = next;
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellsKey, lastKey]);

  const vis = (i: number) => {
    const f = i % 7;
    const r = Math.floor(i / 7);
    return { x: flipped ? 6 - f : f, y: flipped ? r : 6 - r };
  };
  const tf = (i: number) => {
    const { x, y } = vis(i);
    return `translate(${x * 100}%, ${y * 100}%)`;
  };

  // ---- FLIP animation after every committed position ----
  useLayoutEffect(() => {
    const flippedNow = prevFlipped.current !== flipped;
    prevFlipped.current = flipped;
    const animate = animMs > 0 && !flippedNow;
    let longest = 0;
    for (const p of placed) {
      const el = els.current.get(p.key);
      if (!el) continue;
      for (const a of el.getAnimations()) a.cancel(); // jump to the (already correct) final state
      const from = prevSq.current.get(p.key);
      if (animate && from !== undefined && from !== p.sq && suppress.current !== p.key) {
        const a = vis(from);
        const b = vis(p.sq);
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const dur = Math.min(animMs * 1.5, animMs * (0.7 + 0.3 * Math.sqrt(dist)));
        longest = Math.max(longest, dur);
        el.classList.add('moving');
        const anim = el.animate([{ transform: tf(from) }, { transform: tf(p.sq) }], { duration: dur, easing: EASE });
        anim.onfinish = anim.oncancel = () => el.classList.remove('moving');
      }
    }
    suppress.current = null;
    prevSq.current = new Map(placed.map((p) => [p.key, p.sq]));
    const gone = goneRef.current;
    goneRef.current = [];
    if (animate && gone.length) setGhosts(gone.map((g) => ({ ...g, delay: Math.max(0, longest * 0.55) })));
    else setGhosts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, flipped, animMs]);

  useEffect(() => {
    if (!ghosts.length) return;
    const t = setTimeout(() => setGhosts([]), (ghosts[0]?.delay ?? 0) + 260);
    return () => clearTimeout(t);
  }, [ghosts]);
  useEffect(() => setSel(null), [cellsKey]);

  const targets = sel !== null ? legal?.get(sel) ?? [] : [];
  const interactive = !!legal && !!onMove;

  const squareAt = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return -1;
    const rect = el.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * 7);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 7);
    if (x < 0 || x > 6 || y < 0 || y > 6) return -1;
    return (flipped ? y : 6 - y) * 7 + (flipped ? 6 - x : x);
  };
  const keyAt = (sq: number) => placedRef.current.find((p) => p.sq === sq)?.key ?? null;
  const tryMove = (from: number, to: number, viaDrag = false) => {
    if (legal?.get(from)?.includes(to)) {
      if (viaDrag) suppress.current = keyAt(from); // dropped piece is already where it belongs
      onMove?.(from, to);
      setSel(null);
      return true;
    }
    return false;
  };
  const onDown = (e: RPE) => {
    if (!interactive) return;
    const i = squareAt(e.clientX, e.clientY);
    if (i < 0) return;
    if (sel !== null && sel !== i && tryMove(sel, i)) return;
    if (legal!.has(i)) {
      setSel(i === sel && !drag ? null : i);
      if (dragEnabled) {
        setDrag({ from: i, x: e.clientX, y: e.clientY, moved: false });
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      }
    } else setSel(null);
  };
  const onMoveP = (e: RPE) => {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
  };
  const onUp = (e: RPE) => {
    if (!drag) return;
    const i = squareAt(e.clientX, e.clientY);
    const { from, moved } = drag;
    setDrag(null);
    if (moved && i >= 0 && i !== from && !tryMove(from, i, true)) setSel(from);
  };
  const onKey = (e: RKE) => {
    if (!interactive) return;
    const cur = cursor ?? sel ?? (flipped ? 45 : 3);
    let f = cur % 7;
    let r = Math.floor(cur / 7);
    const up = flipped ? -1 : 1;
    if (e.key === 'ArrowUp') r += up;
    else if (e.key === 'ArrowDown') r -= up;
    else if (e.key === 'ArrowLeft') f -= up;
    else if (e.key === 'ArrowRight') f += up;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (sel !== null && sel !== cur && tryMove(sel, cur)) return;
      setSel(legal!.has(cur) ? cur : null);
      return;
    } else if (e.key === 'Escape') return setSel(null);
    else return;
    e.preventDefault();
    setCursor(Math.max(0, Math.min(6, r)) * 7 + Math.max(0, Math.min(6, f)));
  };

  const dragPx = (() => {
    if (!drag || !drag.moved || !ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const sz = rect.width / 7;
    return { x: drag.x - rect.left - sz / 2, y: drag.y - rect.top - sz * 0.6 };
  })();

  const effectAt = new Map((props.effects ?? []).map((e) => [e.sq, e.kind]));
  const squares = [];
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) {
      const f = flipped ? 6 - x : x;
      const r = flipped ? y : 6 - y;
      const i = r * 7 + f;
      const dark = (f + r) % 2 === 0;
      const cls = ['sq', dark ? 'dark' : 'light'];
      if (lastMove && (lastMove[0] === i || lastMove[1] === i)) cls.push('last');
      if (sel === i) cls.push('sel');
      if (checkSq === i) cls.push('check');
      if (props.mateSq === i) cls.push('mate');
      if (props.highlights?.includes(i)) cls.push('hl');
      if (cursor === i) cls.push('cursor');
      const fx = effectAt.get(i);
      if (fx) cls.push('fx-' + fx);
      const pc = cells[i];
      squares.push(
        <div
          key={i}
          className={cls.join(' ')}
          style={{ background: dark ? theme.dark : theme.light }}
          data-sq={sqName(i)}
          role="gridcell"
          aria-label={`${sqName(i)}${pc ? `, ${pc >> 3 ? 'black' : 'white'} ${PIECE_WORD[pc & 7]}` : ''}`}
        >
          {coordinates && !small && x === 0 && <span className={`coord rank ${dark ? 'on-dark' : ''}`}>{r + 1}</span>}
          {coordinates && !small && y === 6 && <span className={`coord file ${dark ? 'on-dark' : ''}`}>{FILES[f]}</span>}
          {props.showLegal !== false && targets.includes(i) && <span className={pc ? 'target cap' : 'target'} />}
          {fx && <span className={`fx-badge fx-${fx}`} aria-hidden />}
        </div>,
      );
    }

  return (
    <div
      className={`board ${small ? 'small' : ''} ${props.highContrast ? 'hc' : ''} ${interactive ? 'interactive' : ''}`}
      ref={ref}
      style={{ ['--line' as string]: theme.line }}
      onPointerDown={onDown}
      onPointerMove={onMoveP}
      onPointerUp={onUp}
      onPointerCancel={() => setDrag(null)}
      role="grid"
      aria-label={props.label ?? 'SEVEN board'}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={onKey}
      onBlur={() => setCursor(null)}
      data-anim={animMs}
    >
      {squares}
      {ghosts.map((g) => (
        <div key={'g' + g.key} className="pc ghost" style={{ transform: tf(g.sq), animationDelay: `${g.delay}ms` }} aria-hidden>
          <PieceSvg code={g.code} set={pieceSet} />
        </div>
      ))}
      {placed.map((p) => {
        const dragging = drag && drag.from === p.sq && dragPx;
        return (
          <div
            key={p.key}
            data-key={p.key}
            ref={(el) => {
              if (el) els.current.set(p.key, el);
              else els.current.delete(p.key);
            }}
            className={`pc ${dragging ? 'dragging' : ''} ${sel === p.sq ? 'lifted' : ''} ${effectAt.get(p.sq) === 'promotion' ? 'promoted' : ''}`}
            style={{ transform: dragging ? `translate(${dragPx!.x}px, ${dragPx!.y}px)` : tf(p.sq) }}
            data-sq={sqName(p.sq)}
          >
            <PieceSvg code={p.code} set={pieceSet} />
          </div>
        );
      })}
      {props.arrows && props.arrows.length > 0 && (
        <svg className="arrows" viewBox="0 0 700 700" aria-hidden>
          <defs>
            <marker id="ah" markerWidth="4" markerHeight="4" refX="2.2" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4 Z" fill="var(--blue)" />
            </marker>
          </defs>
          {props.arrows.map(([a, b], k) => {
            const pa = vis(a);
            const pb = vis(b);
            return <line key={k} x1={pa.x * 100 + 50} y1={pa.y * 100 + 50} x2={pb.x * 100 + 50} y2={pb.y * 100 + 50} stroke="var(--blue)" strokeOpacity="0.75" strokeWidth="13" strokeLinecap="round" markerEnd="url(#ah)" />;
          })}
        </svg>
      )}
    </div>
  );
}
