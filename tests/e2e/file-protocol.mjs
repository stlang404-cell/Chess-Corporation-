// Verifies the single-file build (Windows launcher target) works from file://:
// boots, starts a match, makes one move, and sees the engine reply.
// Usage: node tests/e2e/file-protocol.mjs /abs/path/to/SEVEN.html
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const file = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('file://' + file);
await p.waitForSelector('.match-btn', { timeout: 10000 });
await p.click('.match-btn');
await p.waitForSelector('.board', { timeout: 10000 });
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
    break;
  }
}
await p.waitForSelector('.player-bar.me .clock.running', { timeout: 20000 });
const ml = (await p.textContent('.movelist')).trim();
const plies = ml.split(/\s+/).filter((t) => !/^\d+\.$/.test(t)).length;
console.log(JSON.stringify({ movelist: ml, plies, errors: errs }));
await p.screenshot({ path: process.argv[3] ?? 'file-protocol.png' });
await b.close();
process.exit(errs.length || plies < 2 ? 1 : 0);
