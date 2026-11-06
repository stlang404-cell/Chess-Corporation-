// A rated game in progress survives a page reload (IndexedDB) and resumes on the Play tab.
// Usage: node tests/e2e/resume.mjs http://localhost:4173/
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const url = process.argv[2] ?? 'http://localhost:4173/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(url);
await p.click('.match-btn');
await p.waitForSelector('.board', { timeout: 10000 });
async function myMove() {
  await p.waitForSelector('.player-bar.me .clock.running', { timeout: 20000 });
  const box = await p.$eval('.board', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width };
  });
  for (let k = 0; k < 49; k++) {
    await p.mouse.click(box.x + ((k % 7) + 0.5) * (box.w / 7), box.y + (Math.floor(k / 7) + 0.5) * (box.w / 7));
    const t = await p.$$('.target');
    if (t.length) {
      const tb = await t[0].boundingBox();
      await p.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
      return;
    }
  }
}
await myMove();
await myMove();
await p.waitForSelector('.player-bar.me .clock.running', { timeout: 20000 });
const before = (await p.textContent('.movelist')).trim();
await p.reload();
await p.waitForSelector('.play .board', { timeout: 10000 });
const after = (await p.textContent('.movelist')).trim();
const tabIsPlay = !!(await p.$('.app.tab-play'));
console.log(JSON.stringify({ before, after, tabIsPlay, errors }));
await b.close();
process.exit(before === after && tabIsPlay && before.length > 5 && !errors.length ? 0 : 1);
