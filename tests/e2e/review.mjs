// Full loop with review: play a rated game to the end → automatic engine review →
// results (review strip + itemised paycheck) → Full review → inspect a move → Retry.
// Usage: node tests/e2e/review.mjs <url> <outDir>
import { createRequire } from 'node:module';
import { finishOnboarding, startRated, playAnyMove, MY_TURN } from './helpers.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/', out = '.'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(url);
await finishOnboarding(p);
await startRated(p);
let moves = 0;
for (let i = 0; i < 150; i++) {
  if (await p.$('.results, .settle')) break;
  try {
    await p.waitForSelector(`${MY_TURN}, .results, .settle`, { timeout: 25000 });
  } catch {
    break;
  }
  if (await p.$('.results, .settle')) break;
  if (!(await playAnyMove(p))) break;
  moves++;
}
await p.waitForSelector('.results', { timeout: 90000 });
if (await p.$('.ceremony .skip')) await p.click('.ceremony .skip');
await p.waitForTimeout(1500);
const strip = !!(await p.$('.review-strip'));
const payText = (await p.textContent('.pay'))?.replace(/\s+/g, ' ') ?? '';
await p.screenshot({ path: `${out}/v03-results.png`, fullPage: true });
await p.click('.results button:has-text("Full review")');
await p.waitForSelector('.review .board');
await p.waitForTimeout(400);
// click the first move that is a mistake/blunder/inaccuracy if any, else the 6th move
const bad = await p.$('.movelist .mv.q-blunder, .movelist .mv.q-mistake, .movelist .mv.q-inaccuracy');
if (bad) await bad.click();
else await (await p.$$('.movelist .mv'))[5].click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/v03-review.png`, fullPage: true });
let retried = false;
if (await p.$('button:has-text("Retry this move")')) {
  await p.click('button:has-text("Retry this move")');
  await p.waitForTimeout(300);
  await p.$eval('.review .board', (el) => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(200);
  const box = await p.$eval('.review .board', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width };
  });
  for (let k = 0; k < 49 && !retried; k++) {
    await p.mouse.click(box.x + ((k % 7) + 0.5) * (box.w / 7), box.y + (Math.floor(k / 7) + 0.5) * (box.w / 7));
    const t = await p.$$('.review .target');
    if (t.length) {
      const tb = await t[0].boundingBox();
      await p.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
      retried = true;
    }
  }
  await p.waitForFunction(() => !document.querySelector('.move-card.retry')?.textContent?.includes('Checking'), null, { timeout: 30000 }).catch(() => {});
  await p.screenshot({ path: `${out}/v03-retry.png` });
}
const retryText = (await p.$('.move-card.retry')) ? (await p.textContent('.move-card.retry')).replace(/\s+/g, ' ') : null;
console.log(JSON.stringify({ moves, reviewStrip: strip, payText: payText.slice(0, 300), retried, retryText, errors }, null, 1));
await b.close();
process.exit(errors.length || !strip ? 1 : 0);
