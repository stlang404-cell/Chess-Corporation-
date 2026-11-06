import type { SaveData, MatchSummary } from './state';
import { rankInfo } from './career';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  reward: number;
  test: (s: SaveData, last: MatchSummary | null) => boolean;
}

/** Highest seniority reached (title index), independent of job family. */
const reached = (s: SaveData, titleIndex: number) => rankInfo(s.career.highestRank).titleIndex >= titleIndex;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-game', name: 'First Day', desc: 'Complete your first rated match.', reward: 50, test: (s) => s.stats.rated.g >= 1 },
  { id: 'first-win', name: 'First Signature', desc: 'Win a rated match.', reward: 100, test: (s) => s.stats.rated.w >= 1 },
  { id: 'mate', name: 'Closing the Deal', desc: 'Win by checkmate.', reward: 100, test: (s) => s.stats.checkmates >= 1 },
  { id: 'streak3', name: 'Hot Quarter', desc: 'Win three rated matches in a row.', reward: 200, test: (s) => s.stats.bestStreak >= 3 },
  { id: 'streak7', name: 'Seven Straight', desc: 'Win seven rated matches in a row.', reward: 1200, test: (s) => s.stats.bestStreak >= 7 },
  { id: 'upset', name: 'Giant Killer', desc: 'Defeat an opponent rated 200+ above you.', reward: 400, test: (s) => s.stats.upsets >= 1 },
  { id: 'upset10', name: 'Hostile Takeover', desc: 'Record ten upsets.', reward: 2000, test: (s) => s.stats.upsets >= 10 },
  { id: 'games25', name: 'Probation Passed', desc: 'Play 25 rated matches.', reward: 250, test: (s) => s.stats.rated.g >= 25 },
  { id: 'games100', name: 'Tenured', desc: 'Play 100 rated matches.', reward: 1000, test: (s) => s.stats.rated.g >= 100 },
  { id: 'games500', name: 'Company Veteran', desc: 'Play 500 rated matches.', reward: 5000, test: (s) => s.stats.rated.g >= 500 },
  { id: 'games1000', name: 'Pillar of the Firm', desc: 'Play 1,000 rated matches.', reward: 10000, test: (s) => s.stats.rated.g >= 1000 },
  { id: 'games5000', name: 'Living Legend', desc: 'Play 5,000 rated matches.', reward: 50000, test: (s) => s.stats.rated.g >= 5000 },
  { id: 'acc90', name: 'Precise Ink', desc: 'Win with 90%+ accuracy (15+ moves).', reward: 500, test: (_s, m) => !!m && m.score === 1 && (m.accuracy ?? 0) >= 90 && m.moves.length >= 30 },
  { id: 'black-win', name: 'Second Mover', desc: 'Win a rated match with Black.', reward: 100, test: (s, m) => !!m && m.score === 1 && m.color === 1 && s.stats.rated.w > 0 },
  { id: 'r1200', name: 'Rated 1200', desc: 'Reach a 1200 rating.', reward: 300, test: (s) => s.peakRating >= 1200 },
  { id: 'r1500', name: 'Rated 1500', desc: 'Reach a 1500 rating.', reward: 1000, test: (s) => s.peakRating >= 1500 },
  { id: 'r1800', name: 'Rated 1800', desc: 'Reach a 1800 rating.', reward: 3000, test: (s) => s.peakRating >= 1800 },
  { id: 'r2000', name: 'Rated 2000', desc: 'Reach a 2000 rating.', reward: 8000, test: (s) => s.peakRating >= 2000 },
  { id: 't-manager', name: 'Corner Office', desc: 'Reach manager level.', reward: 1000, test: (s) => reached(s, 6) },
  { id: 't-director', name: 'Name on the Door', desc: 'Reach director level.', reward: 2500, test: (s) => reached(s, 8) },
  { id: 't-vp', name: 'Vice President', desc: 'Reach vice-president level.', reward: 5000, test: (s) => reached(s, 10) },
  { id: 't-chief', name: 'Chief Officer', desc: 'Become a chief officer of your function.', reward: 10000, test: (s) => reached(s, 13) },
  { id: 't-ceo', name: 'The Corner Suite', desc: 'Become Chief Executive Officer of Seven Meridian.', reward: 15000, test: (s) => reached(s, 17) },
  { id: 't-chair', name: 'Called Elsewhere', desc: 'Be appointed President of another institution.', reward: 30000, test: (s) => reached(s, 18) },
  { id: 't-multinational', name: 'Multinational Leader', desc: 'Lead a multinational group.', reward: 60000, test: (s) => reached(s, 18 + 34 * 2 + 1) },
  { id: 't-elder', name: 'World Holdings', desc: 'Become CEO of Meridian World Holdings.', reward: 100000, test: (s) => reached(s, 18 + 45 * 2 + 1) },
  { id: 'styles', name: 'Read the Room', desc: 'Beat all seven playing styles.', reward: 1500, test: (s) => Object.values(s.stats.byStyle).filter((w) => w.w > 0).length >= 7 },
  { id: 'rival', name: 'Old Rivals', desc: 'Play the same opponent ten times.', reward: 600, test: (s) => Object.values(s.opponents).some((o) => o.g >= 10) },
  { id: 'saver', name: 'Rainy Day Fund', desc: 'Hold $25,000 at once.', reward: 1000, test: (s) => s.wallet.balance >= 25000 },
];

export function newAchievements(s: SaveData, last: MatchSummary | null): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.test(s, last));
}
