import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import { PieceSvg } from './pieces';

/** Board squares are indexed 0..48 = rank*7 + file (a1 = 0, g7 = 48). */
export interface BoardProps {
  cells: number[]; // 49 piece codes
  flipped?: boolean;
  legal?: Map<number, number[]>; // from → targets (only for the side the user controls)
  onMove?: (from: number, to: number) => void;
  lastMove?: [number, number] | null;
  checkSq?: number | null;
  highlights?: number[];
  arrows?: [number, number][];
  theme: { light: string; dark: string; line: string };
  pieceSet: string;
  coordinates?: boolean;
  animate?: boolean;
  showLegal?: boolean;
  small?: boolean;
  label?: string;
}

const FILES = 'abcdefg';
export const sqName = (i: number) => FILES[i % 7] + (Math.floor(i / 7) + 1);
export const sqIndex = (n: string) => FILES.indexOf(n[0]) + (parseInt(n.slice(1), 10) - 1) * 7;

interface Placed {
  key: number;
  code: number;
  sq: number;
}

let keySeq = 1;
function assignKeys(prev: Placed[], cells: number[], lastMove?: [number, number] | null): Placed[] {
  const out: (Placed | null)[] = cells.map(() => null);
  const used = new Set<number>();
  const prevAt = new Map(prev.map((p) => [p.sq, p]));
  // 1) unchanged squares keep keys
  cells.forEach((c, i) => {
    const p = prevAt.get(i);
    if (c && p && p.code === c && !(lastMove && lastMove[0] === i)) {
      out[i] = { ...p };
      used.add(p.key);
    }
  });
  // 2) the moved piece
  if (lastMove) {
    const [f, t] = lastMove;
    const p = prevAt.get(f);
    if (p && cells[t] && !out[t] && !used.has(p.key) && (p.code === cells[t] || (p.code & 7) === 1)) {
      out[t] = { key: p.key, code: cells[t], sq: t };
      used.add(p.key);
    }
  }
  // 3) any other appearance: match a vanished piece of the same code (castling rook, ep)
  cells.forEach((c, i) => {
    if (!c || out[i]) return;
    const cand = prev.find((p) => p.code === c && !used.has(p.key) && cells[p.sq] !== c);
    if (cand) {
      out[i] = { key: cand.key, code: c, sq: i };
      used.add(cand.key);
    } else out[i] = { key: keySeq++, code: c, sq: i };
  });
  return out.filter((x): x is Placed => !!x);
}

export function Board(props: BoardProps) {
  const { cells, flipped, legal, onMove, lastMove, checkSq, theme, pieceSet, coordinates = true, animate = true, small } = props;
  const [sel, setSel] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ from: number; x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const placedRef = useRef<Placed[]>([]);
  const placed = useMemo(() => {
    const next = assignKeys(placedRef.current, cells, lastMove);
    placedRef.current = next;
    return next;
  }, [cells, lastMove]);

  useEffect(() => setSel(null), [cells]);

  const pos = (i: number) => {
    const f = i % 7;
    const r = Math.floor(i / 7);
    const x = flipped ? 6 - f : f;
    const y = flipped ? r : 6 - r;
    return { x, y };
  };
  const targets = sel !== null ? legal?.get(sel) ?? [] : [];

  const squareAt = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return -1;
    const rect = el.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * 7);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 7);
    if (x < 0 || x > 6 || y < 0 || y > 6) return -1;
    const f = flipped ? 6 - x : x;
    const r = flipped ? y : 6 - y;
    return r * 7 + f;
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
    if (!legal || !onMove) return;
    const i = squareAt(e.clientX, e.clientY);
    if (i < 0) return;
    if (sel !== null && sel !== i && tryMove(sel, i)) return;
    if (legal.has(i)) {
      setSel(i);
      setDrag({ from: i, x: e.clientX, y: e.clientY });
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } else setSel(null);
  };
  const onMoveP = (e: RPE) => {
    if (drag) setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };
  const onUp = (e: RPE) => {
    if (!drag) return;
    const i = squareAt(e.clientX, e.clientY);
    const from = drag.from;
    setDrag(null);
    if (i >= 0 && i !== from) tryMove(from, i);
  };

  const dragOffset = (() => {
    if (!drag || !ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const sz = rect.width / 7;
    return { left: drag.x - rect.left - sz / 2, top: drag.y - rect.top - sz / 2 };
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
      squares.push(
        <div key={i} className={cls.join(' ')} style={{ background: dark ? theme.dark : theme.light }} data-sq={sqName(i)}>
          {coordinates && !small && x === 0 && <span className="coord rank">{r + 1}</span>}
          {coordinates && !small && y === 6 && <span className="coord file">{FILES[f]}</span>}
          {props.showLegal !== false && targets.includes(i) && <span className={cells[i] ? 'target cap' : 'target'} />}
        </div>,
      );
    }

  return (
    <div
      className={`board ${small ? 'small' : ''} ${animate ? 'anim' : ''}`}
      ref={ref}
      style={{ borderColor: theme.line }}
      onPointerDown={onDown}
      onPointerMove={onMoveP}
      onPointerUp={onUp}
      role="grid"
      aria-label={props.label ?? 'SEVEN board'}
    >
      {squares}
      {placed.map((p) => {
        const { x, y } = pos(p.sq);
        const dragging = drag && drag.from === p.sq && dragOffset;
        return (
          <div
            key={p.key}
            className={`pc ${dragging ? 'dragging' : ''}`}
            style={
              dragging
                ? { left: dragOffset!.left, top: dragOffset!.top, transform: 'none' }
                : { transform: `translate(${x * 100}%, ${y * 100}%)` }
            }
          >
            <PieceSvg code={p.code} set={pieceSet} />
          </div>
        );
      })}
      {props.arrows && props.arrows.length > 0 && (
        <svg className="arrows" viewBox="0 0 700 700">
          <defs>
            <marker id="ah" markerWidth="4" markerHeight="4" refX="2.2" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4 Z" fill="#b5452f" />
            </marker>
          </defs>
          {props.arrows.map(([a, b], k) => {
            const pa = pos(a);
            const pb = pos(b);
            return (
              <line
                key={k}
                x1={pa.x * 100 + 50}
                y1={pa.y * 100 + 50}
                x2={pb.x * 100 + 50}
                y2={pb.y * 100 + 50}
                stroke="#b5452f"
                strokeOpacity="0.75"
                strokeWidth="14"
                strokeLinecap="round"
                markerEnd="url(#ah)"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
