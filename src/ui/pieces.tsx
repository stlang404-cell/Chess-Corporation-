/**
 * Original SVG piece families for SEVEN (viewBox 0 0 100 100). All pieces share
 * one plinth, one stroke weight and one optical baseline so proportions are
 * consistent across the set.
 */
import type { ReactElement } from 'react';

type Ink = { fill: string; stroke: string; detail: string; sw: number };

const SETS: Record<string, { w: Ink; b: Ink }> = {
  'pieces.ink': {
    w: { fill: '#fbf8f1', stroke: '#1b1a17', detail: '#1b1a17', sw: 2.6 },
    b: { fill: '#24221e', stroke: '#0e0e0d', detail: '#ebe4d4', sw: 2.6 },
  },
  'pieces.stone': {
    w: { fill: '#e9e4d9', stroke: '#4a463f', detail: '#4a463f', sw: 2.2 },
    b: { fill: '#5d5952', stroke: '#2b2925', detail: '#e9e4d9', sw: 2.2 },
  },
  'pieces.gold': {
    w: { fill: '#efe0b1', stroke: '#6b5320', detail: '#6b5320', sw: 2.6 },
    b: { fill: '#191816', stroke: '#b08d3c', detail: '#d2b46a', sw: 2.6 },
  },
  'pieces.vermilion': {
    w: { fill: '#fbf8f1', stroke: '#1b1a17', detail: '#1b1a17', sw: 2.6 },
    b: { fill: '#a63a24', stroke: '#4e1a10', detail: '#f7e7dc', sw: 2.6 },
  },
};

const PLINTH = 'M23 88 H77 A3 3 0 0 0 80 85 V83 A4 4 0 0 0 76 79 H24 A4 4 0 0 0 20 83 V85 A3 3 0 0 0 23 88 Z';

function art(t: number, c: Ink): ReactElement {
  const body = { fill: c.fill, stroke: c.stroke, strokeWidth: c.sw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const line = { fill: 'none', stroke: c.detail, strokeWidth: c.sw * 0.75, strokeLinecap: 'round' as const };
  const plinth = <path d={PLINTH} {...body} />;
  switch (t) {
    case 1: // pawn
      return (
        <g>
          <path d="M36 79 C37 67 42 59 45.5 52 H54.5 C58 59 63 67 64 79 Z" {...body} />
          <rect x="40" y="47" width="20" height="6" rx="2.5" {...body} />
          <circle cx="50" cy="35" r="11.5" {...body} />
          {plinth}
        </g>
      );
    case 2: // knight
      return (
        <g>
          <path d="M30 79 C30 70 33.5 63.5 40 58 C34 57 28.5 53.5 27.5 48.5 C26.8 44.6 29.6 41.6 33 40.6 L45.5 33.6 C45.8 28 43.8 23.6 40.6 19.8 C47 19.5 53 22.4 56.4 26.6 C66.5 29.6 72.6 41 72.6 55.5 C72.6 64.6 69.8 72.6 69.8 79 Z" {...body} />
          <path d="M57.5 30.5 C63.5 36.5 66.5 46.5 64 58.5" {...line} />
          <path d="M41 58 C45 57.6 48.6 55.8 51 53" {...line} />
          <circle cx="52.2" cy="36.6" r="2.7" fill={c.detail} />
          <circle cx="31.4" cy="47.2" r="1.6" fill={c.detail} />
          {plinth}
        </g>
      );
    case 3: // bishop
      return (
        <g>
          <path d="M43 66 C42 72 38 76 35.5 79 H64.5 C62 76 58 72 57 66 Z" {...body} />
          <path d="M39.5 60 H60.5 L58.5 66.5 H41.5 Z" {...body} />
          <path d="M50 21.5 C62.5 31.5 66.5 44 61.5 54 C59.5 58 55.5 60.5 50 60.5 C44.5 60.5 40.5 58 38.5 54 C33.5 44 37.5 31.5 50 21.5 Z" {...body} />
          <path d="M46.5 45.5 L57.5 33.5" {...line} />
          <circle cx="50" cy="15.5" r="5" {...body} />
          {plinth}
        </g>
      );
    case 4: // rook
      return (
        <g>
          <path d="M33 79 L36.5 46 H63.5 L67 79 Z" {...body} />
          <path d="M29.5 23.5 H38 V30.5 H45.5 V23.5 H54.5 V30.5 H62 V23.5 H70.5 V39.5 C70.5 42 68.5 44 66 44 H34 C31.5 44 29.5 42 29.5 39.5 Z" {...body} />
          <path d="M37 55 H63" {...line} />
          <path d="M35.5 67 H64.5" {...line} />
          {plinth}
        </g>
      );
    case 5: // queen
      return (
        <g>
          <path d="M26.5 35 L36 58.5 L38.5 28.5 L45 56 L50 24 L55 56 L61.5 28.5 L64 58.5 L73.5 35 L66.5 70 H33.5 Z" {...body} />
          {[
            [26.5, 31.5],
            [38.5, 25],
            [50, 20.5],
            [61.5, 25],
            [73.5, 31.5],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.8" {...body} />
          ))}
          <rect x="32" y="69.5" width="36" height="9.5" rx="3" {...body} />
          <path d="M37 64 H63" {...line} />
          {plinth}
        </g>
      );
    default: // king
      return (
        <g>
          <path d="M31 51 C31 38.5 40.5 30.5 50 30.5 C59.5 30.5 69 38.5 69 51 L65.5 70 H34.5 Z" {...body} />
          <path d="M46.8 7.5 H53.2 V14 H59.5 V20.4 H53.2 V27.5 H46.8 V20.4 H40.5 V14 H46.8 Z" {...body} />
          <rect x="32" y="69.5" width="36" height="9.5" rx="3" {...body} />
          <path d="M35 61 H65" {...line} />
          <path d="M50 37 V54" {...line} />
          {plinth}
        </g>
      );
  }
}

const KANJI = ['', '歩', '桂', '角', '飛', '妃', '王'];

export function PieceSvg({ code, set }: { code: number; set: string }) {
  const t = code & 7;
  const black = code >> 3 === 1;
  if (set === 'pieces.kanji') {
    const fill = black ? '#2a2826' : '#f2e6c9';
    const ink = black ? '#efe6d2' : '#1d1d1b';
    return (
      <svg viewBox="0 0 100 100" className="piece-svg" aria-hidden>
        <path d="M50 9 L77 21 L85 89 L15 89 L23 21 Z" fill={fill} stroke={black ? '#0c0c0b' : '#7a6844'} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M50 15 L72 25 L78.5 83 L21.5 83 L28 25 Z" fill="none" stroke={black ? '#46423c' : '#d9c9a2'} strokeWidth="1.2" />
        <text
          x="50"
          y="67"
          textAnchor="middle"
          fontSize="38"
          fill={t === 6 ? (black ? '#e8a896' : '#b5452f') : ink}
          fontFamily="'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP','MS Mincho',serif"
          fontWeight="600"
        >
          {KANJI[t]}
        </text>
      </svg>
    );
  }
  const s = SETS[set] ?? SETS['pieces.ink'];
  return (
    <svg viewBox="0 0 100 100" className="piece-svg" aria-hidden>
      {art(t, black ? s.b : s.w)}
    </svg>
  );
}

export const PIECE_NAMES = ['', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
