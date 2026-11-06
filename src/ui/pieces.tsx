/** Original minimalist piece sets drawn from simple geometry (viewBox 0 0 100 100). */
import type { ReactElement } from 'react';

type Colors = { fill: string; stroke: string; detail: string };

const SETS: Record<string, { w: Colors; b: Colors; sw: number }> = {
  'pieces.ink': { w: { fill: '#faf7f0', stroke: '#1d1d1b', detail: '#1d1d1b' }, b: { fill: '#22211f', stroke: '#1d1d1b', detail: '#f3eee3' }, sw: 3.2 },
  'pieces.stone': { w: { fill: 'rgba(255,255,255,0.55)', stroke: '#3a3833', detail: '#3a3833' }, b: { fill: '#6c6860', stroke: '#2a2925', detail: '#ece6d8' }, sw: 2.4 },
  'pieces.gold': { w: { fill: '#e9d9a6', stroke: '#6b5320', detail: '#6b5320' }, b: { fill: '#1b1a18', stroke: '#b08d3c', detail: '#c9a659' }, sw: 3 },
};

function shapes(t: number, c: Colors, sw: number): ReactElement {
  const common = { fill: c.fill, stroke: c.stroke, strokeWidth: sw, strokeLinejoin: 'round' as const };
  const base = <rect x="24" y="79" width="52" height="9" rx="3" {...common} />;
  switch (t) {
    case 1: // pawn
      return (
        <g>
          <path d="M38 79 L42 56 Q50 52 58 56 L62 79 Z" {...common} />
          <circle cx="50" cy="42" r="12" {...common} />
          {base}
        </g>
      );
    case 2: // knight
      return (
        <g>
          <path
            d="M33 79 L35 64 Q28 58 30 50 L44 30 L44 18 L52 26 Q70 30 72 52 L70 79 Z"
            {...common}
          />
          <path d="M44 30 Q50 36 46 44" fill="none" stroke={c.detail} strokeWidth={sw * 0.7} strokeLinecap="round" />
          <circle cx="53" cy="38" r="3" fill={c.detail} />
          <path d="M30 50 Q38 54 44 50" fill="none" stroke={c.detail} strokeWidth={sw * 0.6} strokeLinecap="round" />
          {base}
        </g>
      );
    case 3: // bishop
      return (
        <g>
          <path d="M40 79 L44 62 L56 62 L60 79 Z" {...common} />
          <path d="M50 20 Q66 34 62 52 Q58 62 50 62 Q42 62 38 52 Q34 34 50 20 Z" {...common} />
          <path d="M45 46 L58 32" stroke={c.detail} strokeWidth={sw * 0.9} strokeLinecap="round" />
          <circle cx="50" cy="15" r="5" {...common} />
          {base}
        </g>
      );
    case 4: // rook
      return (
        <g>
          <path d="M36 79 L38 42 L62 42 L64 79 Z" {...common} />
          <path d="M31 22 H39 V29 H46 V22 H54 V29 H61 V22 H69 V42 H31 Z" {...common} />
          <path d="M38 52 H62" stroke={c.detail} strokeWidth={sw * 0.6} />
          {base}
        </g>
      );
    case 5: // queen
      return (
        <g>
          <path d="M28 34 L37 62 L43 28 L50 58 L57 28 L63 62 L72 34 L66 72 L34 72 Z" {...common} />
          {[28, 43, 57, 72].map((x, i) => (
            <circle key={i} cx={x} cy={x === 28 || x === 72 ? 31 : 25} r="4.5" {...common} />
          ))}
          <circle cx="50" cy="20" r="5" {...common} />
          <rect x="31" y="70" width="38" height="10" rx="3" {...common} />
          {base}
        </g>
      );
    default: // king
      return (
        <g>
          <path d="M32 79 Q30 50 50 42 Q70 50 68 79 Z" {...common} />
          <path d="M47 10 H53 V18 H60 V24 H53 V40 H47 V24 H40 V18 H47 Z" {...common} />
          <path d="M36 64 H64" stroke={c.detail} strokeWidth={sw * 0.6} />
          {base}
        </g>
      );
  }
}

const KANJI = ['', '歩', '桂', '角', '飛', '妃', '王'];

export function PieceSvg({ code, set }: { code: number; set: string }) {
  const t = code & 7;
  const black = code >> 3 === 1;
  if (set === 'pieces.kanji') {
    const fill = black ? '#2a2826' : '#f4ead2';
    const ink = black ? '#efe6d2' : '#1d1d1b';
    return (
      <svg viewBox="0 0 100 100" className="piece-svg" aria-hidden>
        <path d="M50 10 L76 22 L84 88 L16 88 L24 22 Z" fill={fill} stroke={black ? '#111' : '#6d5f45'} strokeWidth="3" strokeLinejoin="round" />
        <text x="50" y="68" textAnchor="middle" fontSize="40" fill={t === 6 ? (black ? '#e7b9a9' : '#b5452f') : ink} fontFamily="'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP','MS Mincho',serif" fontWeight="600">
          {KANJI[t]}
        </text>
      </svg>
    );
  }
  const s = SETS[set] ?? SETS['pieces.ink'];
  return (
    <svg viewBox="0 0 100 100" className="piece-svg" aria-hidden>
      {shapes(t, black ? s.b : s.w, s.sw)}
    </svg>
  );
}

export const PIECE_NAMES = ['', 'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
