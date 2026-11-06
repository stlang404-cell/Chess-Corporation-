/**
 * Builds save fixtures one finished win away from a promotion, for screenshot
 * evidence of the minor and major ceremonies (tests/e2e/ceremony.mjs).
 */
import { writeFileSync } from 'node:fs';
import { newSave, type ActiveMatch, type SaveData } from '../src/game/state';
import { meritNeeded } from '../src/game/career';
import { exportSave } from '../src/game/storage';

function finished(kind: ActiveMatch['kind']): ActiveMatch {
  return {
    id: 'cer-' + kind,
    kind,
    opponent: { id: 4242, tier: 8, style: 'balanced', rating: 1100, rd: 60, name: 'Aoi Hayashi' },
    playerColor: 0,
    moves: ['d2d4', 'e6e4', 'b1c3', 'b7c5', 'c1f4', 'd6d5', 'e2e3', 'c7d6', 'f1d3', 'f6f5', 'g2g4', 'f5g4', 'd1g4', 'c5d3', 'c2d3', 'd7f5', 'g4f5', 'e7d7', 'f5d5', 'd7c7', 'd5f7'],
    clocks: null,
    tc: 'untimed',
    startedAt: 0,
    seed: 1,
    finished: { score: 1, termination: 'checkmate', endedAt: 1, accuracy: 88 },
    drawOffers: 0,
    undos: 0,
  };
}
function base(): SaveData {
  const s = newSave(1_700_000_000_000);
  s.settings.onboarded = true;
  s.career.family = 'finance';
  s.rating = { r: 1180, rd: 70, vol: 0.06 };
  s.stats.rated = { g: 30, w: 16, d: 5, l: 9 };
  s.wallet.balance = 18_450;
  return s;
}
const minor = base();
minor.career.rank = 13;
minor.career.highestRank = 13;
minor.career.merit = meritNeeded(13) - 1;
minor.active = finished('ranked');
writeFileSync('tests/fixtures/save-minor-promo.json', exportSave(minor));

const major = base();
major.career.rank = 19; // Finance Team Lead IV → Finance Manager I (major, best of 3)
major.career.highestRank = 19;
major.career.merit = meritNeeded(19);
major.career.series = { targetRank: 20, length: 3, wins: 1, games: 1 };
major.active = finished('series');
writeFileSync('tests/fixtures/save-major-promo.json', exportSave(major));
console.log('fixtures written');
