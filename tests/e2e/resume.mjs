// An untimed rated game survives a long think and a page reload (IndexedDB),
// and resumes on the Play tab with the same moves and still the player's turn.
// Usage: node tests/e2e/resume.mjs http://localhost:4173/
import { createRequire } from 'node:module';
import { finishOnboarding, startRated, playAnyMove, MY_TURN } from './helpers.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const url = process.argv[2] ?? 'http://localhost:4173/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(url);
await finishOnboarding(p);
await startRated(p);
for (let i = 0; i < 2; i++) {
  await p.waitForSelector(MY_TURN, { timeout: 20000 });
  await playAnyMove(p);
}
await p.waitForSelector(MY_TURN, { timeout: 20000 });
// think for a while: untimed games never flag
await p.waitForTimeout(4000);
const before = (await p.textContent('.movelist')).replace(/\s+/g, ' ').trim();
await p.reload();
await p.waitForSelector('.play .board', { timeout: 10000 });
const after = (await p.textContent('.movelist')).replace(/\s+/g, ' ').trim();
const stillMyTurn = !!(await p.waitForSelector(MY_TURN, { timeout: 10000 }).catch(() => null));
const tabIsPlay = !!(await p.$('.app.tab-play'));
const noClock = !(await p.$('.clock'));
console.log(JSON.stringify({ before, after, tabIsPlay, stillMyTurn, noClock, errors }));
await b.close();
process.exit(before === after && tabIsPlay && stillMyTurn && noClock && before.length > 5 && !errors.length ? 0 : 1);
