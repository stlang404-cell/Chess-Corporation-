/**
 * SEVEN game export — PGN with variant tags (documented in docs/RULES.md §13).
 * Standard PGN tag pairs plus [Variant "SEVEN-1.0"], [SetUp "1"] and [FEN] so the
 * 7×7 start position is explicit; moves are standard SAN on files a–g.
 */
import { Position } from '../engine/board';
import { OFFICIAL, startFen } from '../engine/rules';
import { moveToSan, uciToMove } from '../engine/game';
import { identityOf } from './opponents';
import type { MatchSummary } from './state';

const TERMS: Record<string, string> = { timeout: 'time forfeit', abandoned: 'abandoned' };

export function toPgn(g: Pick<MatchSummary, 'moves' | 'color' | 'score' | 'oppName' | 'oppRating' | 'at' | 'termination' | 'kind'> & { playerName?: string; playerRating?: number }): string {
  const pos = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const sans: string[] = [];
  for (const u of g.moves) {
    const m = uciToMove(pos, u);
    if (!m) break;
    sans.push(moveToSan(pos, m));
    pos.make(m);
  }
  const me = g.playerName || 'Player';
  const white = g.color === 0 ? me : g.oppName;
  const black = g.color === 0 ? g.oppName : me;
  const wScore = g.color === 0 ? g.score : 1 - g.score;
  const result = wScore === 1 ? '1-0' : wScore === 0 ? '0-1' : '1/2-1/2';
  const d = new Date(g.at);
  const date = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
  const tags: [string, string][] = [
    ['Event', g.kind === 'ranked' || g.kind === 'series' || g.kind === 'cup' ? 'SEVEN rated match' : 'SEVEN casual game'],
    ['Site', 'SEVEN (offline)'],
    ['Date', date],
    ['White', white],
    ['Black', black],
    ['Result', result],
    ['Variant', OFFICIAL.id],
    ['SetUp', '1'],
    ['FEN', startFen(OFFICIAL)],
    ['Termination', TERMS[g.termination] ?? g.termination],
  ];
  if (g.color === 0) tags.push(['BlackElo', String(g.oppRating)]);
  else tags.push(['WhiteElo', String(g.oppRating)]);
  const body: string[] = [];
  sans.forEach((s, i) => body.push(i % 2 === 0 ? `${i / 2 + 1}. ${s}` : s));
  body.push(result);
  const lines: string[] = [];
  let line = '';
  for (const tok of body) {
    if ((line + ' ' + tok).trim().length > 79) {
      lines.push(line.trim());
      line = '';
    }
    line += ' ' + tok;
  }
  if (line.trim()) lines.push(line.trim());
  return tags.map(([k, v]) => `[${k} "${v.replace(/"/g, "'")}"]`).join('\n') + '\n\n' + lines.join('\n') + '\n';
}

export const opponentDisplayName = (id: number) => identityOf(id).name;
