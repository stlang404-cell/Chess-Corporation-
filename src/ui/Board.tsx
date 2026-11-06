import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE, type KeyboardEvent as RKE } from 'react';
import { PieceSvg } from './pieces';

/** Board squares are indexed 0..48 = rank*7 + file (a1 = 0, g7 = 48). */
export interface BoardProps {
  cells: number[];
  flipped?: boolean;
  legal?: Map<number, number[]>;
  onMove?: (from: number, to: number) => void;
  lastMove?: [number, number] | null;
  checkSq?: number | null;
  highlights?: number[];
  arrows?: [number, number][];
  theme: { light: string; dark: string; line: string };
  pieceSet: string;
  coordinates?: boolean;
  /** ms per move animation; 0 disables */
  animMs?: number;
  showLegal?: boolean;
  small?: boolean;
  label?: string;
  highContrast?: boolean;
}

const FILES = 'abcdefg';
export const sqName = (i: number) => FILES[i % 7] + (Math.floor(i / 7) + 1);
export const sqIndex = (n: string) => FILES.indexOf(n[0]) + (parseInt(n.slice(1), 10) - 1) * 7;
const PIECE_WORD = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

interface Placed {
  key: number;
  code: number;
  sq: number;
}

let keySeq = 1;
function assignKeys(prev: Placed[], cells: number[], lastMove?: [number, number] | null): { placed: Placed[]; gone: Placed[] } {
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
    const cand = prev.find((p) => p.code === c && !used.has(p.key) && cells[p.sq] !== c);
    if (cand) {
      out[i] = { key: cand.key, code: c, sq: i };
      used.add(cand.key);
    } else out[i] = { key: keySeq++, code: c, sq: i };
  });
  const placed = out.filter((x): x is Placed => !!x);
  const gone = prev.filter((p) => !used.has(p.key));
  return { placed, gone };
}

export function Board(props: BoardProps) {
  const { cells, flipped, legal, onMove, lastMove, checkSq, theme, pieceSet, coordinates = true, small } = props;
  const animMs = props.animMs ?? 200;
  const [sel, setSel] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ from: number; x: number; y: number; moved: boolean } | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [ghosts, setGhosts] = useState<Placed[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const placedRef = useRef<Placed[]>([]);
  const pendingGhosts = useRef<Placed[]>([]);
  const placed = useMemo(() => {
    const { placed: next, gone } = assignKeys(placedRef.current, cells, lastMove);
    pendingGhosts.current = gone.length && animMs > 0 && placedRef.current.length ? gone : [];
    placedRef.current = next;
    return next;
  }, [cells, lastMove, animMs]);
  useEffect(() => {
    // captured pieces fade out where they stood
    if (pendingGhosts.current.length) {
      setGhosts(pendingGhosts.current);
      pendingGhosts.current = [];
    }
  }, [placed]);
  useEffect(() => {
    if (!ghosts.length) return;
    const t = setTimeout(() => setGhosts([]), animMs + 260);
    return () => clearTimeout(t);
  }, [ghosts, animMs]);
  useEffect(() => setSel(null), [cells]);

  const pos = (i: number) => {
    const f = i % 7;
    const r = Math.floor(i / 7);
    return { x: flipped ? 6 - f : f, y: flipped ? r : 6 - r };
  };
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
  const tryMove = (from: number, to: number) => {
    if (legal?.get(from)?.includes(to)) {
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
      setSel(i);
      setDrag({ from: i, x: e.clientX, y: e.clientY, moved: false });
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } else setSel(null);
  };
  const onMoveP = (e: RPE) => {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
  };
  const onUp = (e: RPE) => {
    if (!drag) return;
    const i = squareAt(e.clientX, e.clientY);
    const { from, moved } = drag;
    setDrag(null);
    if (moved && i >= 0 && i !== from) tryMove(from, i);
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

  const dragOffset = (() => {
    if (!drag || !drag.moved || !ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const sz = rect.width / 7;
    return { left: drag.x - rect.left - sz / 2, top: drag.y - rect.top - sz * 0.62 };
  })();

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
      if (props.highlights?.includes(i)) cls.push('hl');
      if (cursor === i) cls.push('cursor');
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
        </div>,
      );
    }

  return (
    <div
      className={`board ${small ? 'small' : ''} ${props.highContrast ? 'hc' : ''} ${interactive ? 'interactive' : ''}`}
      ref={ref}
      style={{ ['--line' as string]: theme.line, ['--anim' as string]: `${animMs}ms` }}
      onPointerDown={onDown}
      onPointerMove={onMoveP}
      onPointerUp={onUp}
      onPointerCancel={() => setDrag(null)}
      role="grid"
      aria-label={props.label ?? 'SEVEN board'}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={onKey}
      onBlur={() => setCursor(null)}
    >
      {squares}
      {ghosts.map((g) => {
        const { x, y } = pos(g.sq);
        return (
          <div key={'g' + g.key} className="pc ghost" style={{ transform: `translate(${x * 100}%, ${y * 100}%)` }}>
            <PieceSvg code={g.code} set={pieceSet} />
          </div>
        );
      })}
      {placed.map((p) => {
        const { x, y } = pos(p.sq);
        const dragging = drag && drag.from === p.sq && dragOffset;
        return (
          <div
            key={p.key}
            className={`pc ${dragging ? 'dragging' : ''} ${sel === p.sq ? 'lifted' : ''}`}
            style={dragging ? { left: dragOffset!.left, top: dragOffset!.top, transform: 'none' } : { transform: `translate(${x * 100}%, ${y * 100}%)` }}
          >
            <PieceSvg code={p.code} set={pieceSet} />
          </div>
        );
      })}
      {props.arrows && props.arrows.length > 0 && (
        <svg className="arrows" viewBox="0 0 700 700" aria-hidden>
          <defs>
            <marker id="ah" markerWidth="4" markerHeight="4" refX="2.2" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4 Z" fill="var(--verm)" />
            </marker>
          </defs>
          {props.arrows.map(([a, b], k) => {
            const pa = pos(a);
            const pb = pos(b);
            return <line key={k} x1={pa.x * 100 + 50} y1={pa.y * 100 + 50} x2={pb.x * 100 + 50} y2={pb.y * 100 + 50} stroke="var(--verm)" strokeOpacity="0.72" strokeWidth="13" strokeLinecap="round" markerEnd="url(#ah)" />;
          })}
        </svg>
      )}
    </div>
  );
}
