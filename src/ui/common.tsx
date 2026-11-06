import type { CSSProperties, ReactNode } from 'react';
import { itemById } from '../game/store';
import type { SaveData } from '../game/state';
import { type Motif } from '../game/career';
import { CREST_MARKS, opponentCareer, type Crest } from '../game/opponents';

export function boardTheme(save: SaveData) {
  const it = itemById(save.equipped.board);
  return (it?.data as { light: string; dark: string; line: string }) ?? { light: '#efe8d8', dark: '#b9ad97', line: '#8f846f' };
}

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

/** Corporate title an opponent of a given strength plausibly holds. */
export function titleForRating(rating: number, id: number): string {
  return opponentCareer(id, rating).line;
}

const ink = '#1d1d1b';
export function motifUrl(m: Motif | string, color = ink, opacity = 0.08): string {
  const c = encodeURIComponent(color);
  const o = opacity;
  let svg = '';
  switch (m) {
    case 'seigaiha':
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'><g fill='none' stroke='${c}' stroke-opacity='${o}' stroke-width='1'><path d='M0 20a20 20 0 0 1 40 0'/><path d='M6 20a14 14 0 0 1 28 0'/><path d='M12 20a8 8 0 0 1 16 0'/><path d='M-20 10a20 20 0 0 1 40 0M20 10a20 20 0 0 1 40 0'/></g></svg>`;
      break;
    case 'asanoha':
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='62' viewBox='0 0 36 62'><g fill='none' stroke='${c}' stroke-opacity='${o}' stroke-width='1'><path d='M18 0v62M0 10l36 21M36 10L0 31M0 31l36 21M36 31L0 52M18 0L0 31l18 31 18-31z'/></g></svg>`;
      break;
    case 'kikko':
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='48' viewBox='0 0 28 48'><g fill='none' stroke='${c}' stroke-opacity='${o}' stroke-width='1'><path d='M14 0l14 8v16l-14 8L0 24V8z'/><path d='M14 32v16'/></g></svg>`;
      break;
    case 'shippo':
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><g fill='none' stroke='${c}' stroke-opacity='${o}' stroke-width='1'><circle cx='16' cy='16' r='16'/><circle cx='0' cy='0' r='16'/><circle cx='32' cy='0' r='16'/><circle cx='0' cy='32' r='16'/><circle cx='32' cy='32' r='16'/></g></svg>`;
      break;
    case 'ichimatsu':
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><g fill='${c}' fill-opacity='${o * 0.7}'><rect width='12' height='12'/><rect x='12' y='12' width='12' height='12'/></g></svg>`;
      break;
    case 'uroko':
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='20'><g fill='${c}' fill-opacity='${o * 0.8}'><path d='M0 20L6 10 12 20zM12 20l6-10 6 10zM6 10L12 0l6 10z'/></g></svg>`;
      break;
    case 'yagasuri':
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='40'><g fill='none' stroke='${c}' stroke-opacity='${o}' stroke-width='1'><path d='M0 0l10 10L20 0M0 20l10 10 10-10M10 10v20'/></g></svg>`;
      break;
    default:
      return 'none';
  }
  return `url("data:image/svg+xml,${svg}")`;
}

export function CrestBadge({ crest, size = 44, label }: { crest: Crest; size?: number; label?: string }) {
  const s = 100;
  const shape = (() => {
    switch (crest.shape) {
      case 'diamond':
        return <path d="M50 4 L96 50 L50 96 L4 50 Z" />;
      case 'hexagon':
        return <path d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" />;
      case 'square':
        return <rect x="10" y="10" width="80" height="80" rx="6" />;
      case 'octagon':
        return <path d="M32 6 H68 L94 32 V68 L68 94 H32 L6 68 V32 Z" />;
      default:
        return <circle cx="50" cy="50" r="45" />;
    }
  })();
  return (
    <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} className="crest" role="img" aria-label={label ?? 'crest'}>
      <g fill={crest.ink} stroke="none">{shape}</g>
      {crest.ring && (
        <g fill="none" stroke="#f3eee3" strokeWidth="3" transform="translate(50 50) scale(0.82) translate(-50 -50)">
          {shape}
        </g>
      )}
      <text x="50" y="64" textAnchor="middle" fontSize="40" fill="#f3eee3" fontFamily="'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP',serif">
        {CREST_MARKS[crest.mark]}
      </text>
    </svg>
  );
}

export function PlayerSeal({ save, size = 64 }: { save: SaveData; size?: number }) {
  const it = itemById(save.equipped.crest);
  const mark = (it?.data?.mark as string) ?? '七';
  const frame = itemById(save.equipped.frame)?.data?.style;
  return (
    <div className="seal" style={{ width: size, height: size, border: frame ?? 'none', padding: frame ? 3 : 0 } as CSSProperties}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="your seal">
        <circle cx="50" cy="50" r="47" fill="#b5452f" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#f3eee3" strokeWidth="2" />
        <text x="50" y="66" textAnchor="middle" fontSize="46" fill="#f3eee3" fontFamily="'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP',serif">
          {mark}
        </text>
      </svg>
    </div>
  );
}

export function Bar({ value, max, accent }: { value: number; max: number; accent?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="bar">
      <div className="bar-fill" style={{ width: pct + '%', background: accent }} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="tablist">
      {options.map(([v, l]) => (
        <button key={v} role="tab" aria-selected={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={'card ' + className} style={style}>
      {children}
    </div>
  );
}

export function fmtClock(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 100) / 10);
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  if (t < 20) return `${m}:${s.toFixed(1).padStart(4, '0')}`;
  return `${m}:${String(Math.floor(s)).padStart(2, '0')}`;
}

export const TERMINATION_LABEL: Record<string, string> = {
  checkmate: 'by checkmate',
  stalemate: 'by stalemate',
  repetition: 'by repetition',
  'quiet-limit': 'by the 40-move rule',
  insufficient: 'by insufficient material',
  resignation: 'by resignation',
  timeout: 'on time',
  agreement: 'by agreement',
  abandoned: 'by abandonment',
};

export function animMsFor(speed: 'slow' | 'normal' | 'fast' | 'off'): number {
  return speed === 'off' ? 0 : speed === 'slow' ? 240 : speed === 'fast' ? 115 : 170;
}
