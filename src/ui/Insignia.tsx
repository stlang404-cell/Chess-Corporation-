/**
 * Rank insignia: one coherent visual language for the whole ladder.
 *   functional steps   → round seal; ring weight and colour rise with seniority
 *   general management → hexagonal seal in gold
 *   institutions       → octagonal double seal in gold with the institution's kanji
 * Pips around the seal show the grade (I–V).
 */
import { rankInfo, arenaForRank } from '../game/career';

const STEP_MARK = ['見', '習', '務', '熟', '導', '班', '課', '上', '部', '統', '副', '常', '執', '長'];
const GM_MARK = ['事', '群', '社', '頭'];

export function Insignia({ rank, family, size = 72, label }: { rank: number; family?: string; size?: number; label?: string }) {
  const r = rankInfo(rank, family);
  const arena = arenaForRank(rank);
  const pips = r.grade + 1;
  let shape: 'circle' | 'hex' | 'oct' = 'circle';
  let mark = '';
  let fill = '#1b1a17';
  let ring = '#b5452f';
  let inkOn = '#f4efe4';
  if (r.stage === 'functional') {
    mark = STEP_MARK[r.seniority];
    if (r.seniority < 6) {
      fill = '#3b3934';
      ring = '#8b857a';
    } else if (r.seniority < 10) {
      fill = '#1b1a17';
      ring = '#b5452f';
    } else {
      fill = '#a63a24';
      ring = '#b08d3c';
    }
  } else if (r.stage === 'management') {
    shape = 'hex';
    mark = GM_MARK[r.seniority - 14] ?? '社';
    fill = '#1b1a17';
    ring = '#b08d3c';
  } else {
    shape = 'oct';
    mark = arena.kanji;
    fill = r.title === 'Chief Executive Officer' ? '#a63a24' : '#1b1a17';
    ring = '#c9a659';
  }
  const outline =
    shape === 'circle' ? (
      <circle cx="50" cy="50" r="38" />
    ) : shape === 'hex' ? (
      <path d="M50 11 L84 30.5 V69.5 L50 89 L16 69.5 V30.5 Z" />
    ) : (
      <path d="M35 12 H65 L88 35 V65 L65 88 H35 L12 65 V35 Z" />
    );
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="insignia" role="img" aria-label={label ?? `${r.full} insignia`}>
      <g fill={fill}>{outline}</g>
      <g fill="none" stroke={ring} strokeWidth="2.4" transform="translate(50 50) scale(0.84) translate(-50 -50)">
        {outline}
      </g>
      {shape === 'oct' && (
        <g fill="none" stroke={ring} strokeWidth="1" transform="translate(50 50) scale(0.74) translate(-50 -50)">
          {outline}
        </g>
      )}
      <text x="50" y="62" textAnchor="middle" fontSize="33" fill={inkOn} fontFamily="'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP',serif">
        {mark}
      </text>
      {Array.from({ length: pips }).map((_, i) => {
        const a = Math.PI / 2 + ((i - (pips - 1) / 2) * Math.PI) / 9;
        return <circle key={i} cx={50 + 46 * Math.cos(a)} cy={50 + 46 * Math.sin(a)} r="2.6" fill={ring} />;
      })}
    </svg>
  );
}
