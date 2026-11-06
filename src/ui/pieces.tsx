/**
 * SEVEN piece families (original vector artwork, viewBox 0 0 100 100).
 *
 *   pieces.imperial   refined traditional silhouettes, ivory/ebony, gold detailing (default)
 *   pieces.modern     clean geometric forms, flat two-tone
 *   pieces.executive  corporate silhouettes (towers, spires, obelisks), pearl / navy lacquer
 *   pieces.ink · stone · gold · vermilion · kanji   earlier sets, still owned/equippable
 *
 * Every family shares one optical baseline (y≈88) and a consistent visual weight.
 */
import type { ReactElement } from 'react';

type Paint = { fill: string; stroke: string; detail: string; accent: string; sw: number; grad?: [string, string] };

// ---------------------------------------------------------------- shared
const g = (id: string, [a, b]: [string, string]) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  </defs>
);

// ---------------------------------------------------------------- Imperial
const IMPERIAL: { w: Paint; b: Paint } = {
  w: { fill: 'url(#imp-w)', stroke: '#3a3226', detail: '#3a3226', accent: '#c49a3c', sw: 2.2, grad: ['#fffdf7', '#e6dcc4'] },
  b: { fill: 'url(#imp-b)', stroke: '#050505', detail: '#d9cfb8', accent: '#d4ad55', sw: 2.2, grad: ['#4a4850', '#121214'] },
};
function imperial(t: number, c: Paint, id: string): ReactElement {
  const body = { fill: c.fill, stroke: c.stroke, strokeWidth: c.sw, strokeLinejoin: 'round' as const };
  const gold = { fill: c.accent, stroke: c.stroke, strokeWidth: c.sw * 0.7, strokeLinejoin: 'round' as const };
  const line = { fill: 'none', stroke: c.detail, strokeWidth: c.sw * 0.7, strokeLinecap: 'round' as const };
  const base = (
    <>
      <path d="M21 90 H79 Q81 90 81 88 V85 Q81 81.5 77.5 81 H22.5 Q19 81.5 19 85 V88 Q19 90 21 90 Z" {...body} />
      <path d="M28 81 Q28 76.5 32 76 H68 Q72 76.5 72 81 Z" {...gold} />
    </>
  );
  const parts: Record<number, ReactElement> = {
    1: (
      <>
        <path d="M38 76 C39 66 43 60 46 57 H54 C57 60 61 66 62 76 Z" {...body} />
        <ellipse cx="50" cy="55.5" rx="10.5" ry="3.4" {...gold} />
        <circle cx="50" cy="41" r="12" {...body} />
      </>
    ),
    2: (
      <>
        <path d="M30 76 C30 67 34 61 41 56 C35 55 28 51 27 46 C26 42 29 39 33 38 L45 31 C45 26 43 22 39 18 C46 17 53 20 57 25 C68 28 73 40 73 55 C73 64 70 71 70 76 Z" {...body} />
        <path d="M58 29 C64 35 67 45 65 57" fill="none" stroke={c.accent} strokeWidth={c.sw * 1.1} strokeLinecap="round" />
        <path d="M41 56 C45 55.5 48.5 54 51 51" {...line} />
        <circle cx="51.5" cy="36" r="2.6" fill={c.detail} />
        <circle cx="31" cy="46.5" r="1.5" fill={c.detail} />
      </>
    ),
    3: (
      <>
        <path d="M42 66 C41 71 37 74 35 76 H65 C63 74 59 71 58 66 Z" {...body} />
        <path d="M39 60.5 H61 L59 66.5 H41 Z" {...gold} />
        <path d="M50 20 C63 30 67 44 62 55 C60 59 56 61 50 61 C44 61 40 59 38 55 C33 44 37 30 50 20 Z" {...body} />
        <path d="M46 46 L57 34" fill="none" stroke={c.accent} strokeWidth={c.sw * 1.2} strokeLinecap="round" />
        <circle cx="50" cy="15" r="4.6" {...gold} />
      </>
    ),
    4: (
      <>
        <path d="M34 76 L37 47 H63 L66 76 Z" {...body} />
        <path d="M31 24 H39 V31 H46 V24 H54 V31 H61 V24 H69 V40 Q69 44 65 44 H35 Q31 44 31 40 Z" {...body} />
        <rect x="35" y="43.5" width="30" height="4.5" rx="1.5" {...gold} />
        <path d="M38 62 H62" {...line} />
      </>
    ),
    5: (
      <>
        <path d="M27 34 L36 58 L39 28 L45 55 L50 23 L55 55 L61 28 L64 58 L73 34 L66 68 H34 Z" {...body} />
        {[
          [27, 31],
          [39, 25],
          [50, 19.5],
          [61, 25],
          [73, 31],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.7" {...gold} />
        ))}
        <rect x="32" y="67" width="36" height="9" rx="3" {...gold} />
      </>
    ),
    6: (
      <>
        <path d="M31 51 C31 38 40 30 50 30 C60 30 69 38 69 51 L66 68 H34 Z" {...body} />
        <path d="M47 6 H53 V13 H60 V19 H53 V28 H47 V19 H40 V13 H47 Z" {...gold} />
        <rect x="32" y="67" width="36" height="9" rx="3" {...gold} />
        <path d="M50 37 V56" {...line} />
        <path d="M38 47 Q50 42 62 47" {...line} />
      </>
    ),
  };
  return (
    <g>
      {c.grad && g(id, c.grad)}
      {parts[t]}
      {base}
    </g>
  );
}

// ---------------------------------------------------------------- Modern
const MODERN: { w: Paint; b: Paint } = {
  w: { fill: '#fbfaf6', stroke: '#272a32', detail: '#272a32', accent: '#2f6f6a', sw: 2.4 },
  b: { fill: '#2a303c', stroke: '#11141a', detail: '#e9e6df', accent: '#7fb3ad', sw: 2.4 },
};
function modern(t: number, c: Paint): ReactElement {
  const body = { fill: c.fill, stroke: c.stroke, strokeWidth: c.sw, strokeLinejoin: 'miter' as const };
  const acc = { fill: c.accent, stroke: 'none' };
  const base = <rect x="27" y="82" width="46" height="7" rx="3.5" {...body} />;
  const parts: Record<number, ReactElement> = {
    1: (
      <>
        <path d="M39 82 L44 55 H56 L61 82 Z" {...body} />
        <circle cx="50" cy="41" r="12" {...body} />
      </>
    ),
    2: (
      <>
        <path d="M33 82 L35 65 L27 55 L29 46 L45 33 L43 17 L58 26 C69 32 73 45 71 61 L69 82 Z" {...body} />
        <rect x="49" y="35" width="5" height="5" fill={c.detail} />
        <path d="M45 33 L56 46" stroke={c.accent} strokeWidth={c.sw * 1.3} />
      </>
    ),
    3: (
      <>
        <path d="M42 62 H58 L63 82 H37 Z" {...body} />
        <path d="M50 18 L63 43 L57 62 H43 L37 43 Z" {...body} />
        <path d="M46 47 L56 35" stroke={c.accent} strokeWidth={c.sw * 1.3} />
        <circle cx="50" cy="13" r="4" {...body} />
      </>
    ),
    4: (
      <>
        <path d="M37 44 H63 L65 82 H35 Z" {...body} />
        <path d="M33 25 H42 V32 H46 V25 H54 V32 H58 V25 H67 V44 H33 Z" {...body} />
        <rect x="37" y="56" width="26" height="4" {...acc} />
      </>
    ),
    5: (
      <>
        <path d="M36 66 H64 L66 82 H34 Z" {...body} />
        <path d="M28 30 L38 52 L44 24 L50 48 L56 24 L62 52 L72 30 L66 66 H34 Z" {...body} />
        <rect x="36" y="60" width="28" height="4" {...acc} />
      </>
    ),
    6: (
      <>
        <path d="M36 64 H64 L66 82 H34 Z" {...body} />
        <path d="M32 36 H68 L64 64 H36 Z" {...body} />
        <path d="M47 9 H53 V15 H59 V21 H53 V36 H47 V21 H41 V15 H47 Z" {...body} />
        <rect x="38" y="47" width="24" height="4" {...acc} />
      </>
    ),
  };
  return (
    <g>
      {parts[t]}
      {base}
    </g>
  );
}

// ---------------------------------------------------------------- Executive
const EXECUTIVE: { w: Paint; b: Paint } = {
  w: { fill: 'url(#exe-w)', stroke: '#4a4238', detail: '#8e8473', accent: '#c7a14d', sw: 2, grad: ['#ffffff', '#ddd6c8'] },
  b: { fill: 'url(#exe-b)', stroke: '#06080e', detail: '#8ea2c8', accent: '#d1ad5c', sw: 2, grad: ['#2c3f66', '#0d1426'] },
};
function executive(t: number, c: Paint, id: string): ReactElement {
  const body = { fill: c.fill, stroke: c.stroke, strokeWidth: c.sw, strokeLinejoin: 'round' as const };
  const gold = { fill: c.accent, stroke: c.stroke, strokeWidth: c.sw * 0.6 };
  const win = (x: number, y: number, cols: number, rows: number, w = 4, h = 3.2, gx = 3, gy = 3.4) => {
    const out: ReactElement[] = [];
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) out.push(<rect key={`${r}-${k}`} x={x + k * (w + gx)} y={y + r * (h + gy)} width={w} height={h} rx="0.6" fill={c.detail} opacity="0.75" />);
    return out;
  };
  const base = (
    <>
      <rect x="24" y="81.5" width="52" height="8" rx="2" {...body} />
      <rect x="24" y="81.5" width="52" height="2.4" fill={c.accent} />
    </>
  );
  const parts: Record<number, ReactElement> = {
    1: (
      <>
        <path d="M42 81.5 V56 Q42 53 45 53 H55 Q58 53 58 56 V81.5 Z" {...body} />
        <rect x="40" y="62" width="20" height="3" fill={c.accent} />
        <circle cx="50" cy="41" r="11" {...body} />
      </>
    ),
    2: (
      <>
        <path d="M31 81.5 L33 66 L27 57 L30 46 L45 33 L44 18 L57 25 L67 33 L72 49 L70 81.5 Z" {...body} />
        <path d="M45 33 L52 47 L67 33" fill="none" stroke={c.detail} strokeWidth={c.sw * 0.8} strokeLinejoin="round" />
        <path d="M33 66 L52 47 L70 81.5" fill="none" stroke={c.detail} strokeWidth={c.sw * 0.6} opacity="0.7" />
        <path d="M44 18 L57 25" stroke={c.accent} strokeWidth={c.sw * 1.6} strokeLinecap="round" />
        <circle cx="52" cy="37" r="2.4" fill={c.accent} />
      </>
    ),
    3: (
      <>
        <path d="M41 81.5 V42 L50 13 L59 42 V81.5 Z" {...body} />
        <path d="M44 50 L56 38" stroke={c.accent} strokeWidth={c.sw * 1.4} strokeLinecap="round" />
        {win(45, 56, 2, 3, 4, 3, 2)}
        <rect x="41" y="42" width="18" height="2.4" fill={c.accent} />
      </>
    ),
    4: (
      <>
        <path d="M35 81.5 V35 H65 V81.5 Z" {...body} />
        <path d="M32 35 V25 H40 V30 H46 V25 H54 V30 H60 V25 H68 V35 Z" {...body} />
        <rect x="35" y="35" width="30" height="2.4" fill={c.accent} />
        {win(39.5, 42, 3, 5)}
      </>
    ),
    5: (
      <>
        <path d="M36 81.5 V45 H64 V81.5 Z" {...body} />
        <path d="M36 45 L38 28 L43 40 L47 22 L50 37 L53 22 L57 40 L62 28 L64 45 Z" {...body} />
        {[
          [38, 27],
          [47, 21],
          [53, 21],
          [62, 27],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.6" {...gold} />
        ))}
        <rect x="36" y="45" width="28" height="2.4" fill={c.accent} />
        {win(40.5, 52, 3, 4)}
      </>
    ),
    6: (
      <>
        <path d="M36 81.5 V37 Q36 31 42 31 H58 Q64 31 64 37 V81.5 Z" {...body} />
        <path d="M47.3 6 H52.7 V12.5 H59 V18 H52.7 V31 H47.3 V18 H41 V12.5 H47.3 Z" {...gold} />
        <rect x="36" y="38" width="28" height="2.4" fill={c.accent} />
        {win(40.5, 45, 3, 5)}
      </>
    ),
  };
  return (
    <g>
      {g(id, c.grad!)}
      {parts[t]}
      {base}
    </g>
  );
}

// ---------------------------------------------------------------- legacy (v0.2) sets
type Ink = { fill: string; stroke: string; detail: string; sw: number };
const LEGACY: Record<string, { w: Ink; b: Ink }> = {
  'pieces.ink': { w: { fill: '#fbf8f1', stroke: '#1b1a17', detail: '#1b1a17', sw: 2.6 }, b: { fill: '#24221e', stroke: '#0e0e0d', detail: '#ebe4d4', sw: 2.6 } },
  'pieces.stone': { w: { fill: '#e9e4d9', stroke: '#4a463f', detail: '#4a463f', sw: 2.2 }, b: { fill: '#5d5952', stroke: '#2b2925', detail: '#e9e4d9', sw: 2.2 } },
  'pieces.gold': { w: { fill: '#efe0b1', stroke: '#6b5320', detail: '#6b5320', sw: 2.6 }, b: { fill: '#191816', stroke: '#b08d3c', detail: '#d2b46a', sw: 2.6 } },
  'pieces.vermilion': { w: { fill: '#fbf8f1', stroke: '#1b1a17', detail: '#1b1a17', sw: 2.6 }, b: { fill: '#a63a24', stroke: '#4e1a10', detail: '#f7e7dc', sw: 2.6 } },
};
function legacy(t: number, c: Ink): ReactElement {
  // the v0.2 shapes, re-expressed through the Imperial geometry without gold
  const paint: Paint = { fill: c.fill, stroke: c.stroke, detail: c.detail, accent: c.fill, sw: c.sw };
  return imperial(t, paint, 'none');
}

const KANJI = ['', '歩', '桂', '角', '飛', '妃', '王'];

export const PIECE_SETS = ['pieces.imperial', 'pieces.modern', 'pieces.executive'] as const;

export function PieceSvg({ code, set }: { code: number; set: string }) {
  const t = code & 7;
  const black = code >> 3 === 1;
  let art: ReactElement;
  if (set === 'pieces.kanji') {
    const fill = black ? '#2a2826' : '#f2e6c9';
    const ink = black ? '#efe6d2' : '#1d1d1b';
    art = (
      <>
        <path d="M50 9 L77 21 L85 89 L15 89 L23 21 Z" fill={fill} stroke={black ? '#0c0c0b' : '#7a6844'} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M50 15 L72 25 L78.5 83 L21.5 83 L28 25 Z" fill="none" stroke={black ? '#46423c' : '#d9c9a2'} strokeWidth="1.2" />
        <text x="50" y="67" textAnchor="middle" fontSize="38" fill={t === 6 ? (black ? '#e8a896' : '#b5452f') : ink} fontFamily="'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP','MS Mincho',serif" fontWeight="600">
          {KANJI[t]}
        </text>
      </>
    );
  } else if (set === 'pieces.modern') art = modern(t, black ? MODERN.b : MODERN.w);
  else if (set === 'pieces.executive') art = executive(t, black ? EXECUTIVE.b : EXECUTIVE.w, black ? 'exe-b' : 'exe-w');
  else if (LEGACY[set]) art = legacy(t, black ? LEGACY[set].b : LEGACY[set].w);
  else art = imperial(t, black ? IMPERIAL.b : IMPERIAL.w, black ? 'imp-b' : 'imp-w');
  return (
    <svg viewBox="0 0 100 100" className="piece-svg" aria-hidden shapeRendering="geometricPrecision">
      {art}
    </svg>
  );
}

export const PIECE_NAMES = ['', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
