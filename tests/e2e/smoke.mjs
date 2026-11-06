// Browser smoke test: boots the built app, presses MATCH, plays random legal
// moves until the game ends (or a move cap), and checks the results screen.
// Usage: node tests/e2e/smoke.mjs <url> [outDir]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const url = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? '.';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await page.waitForSelector('.match-btn');
await page.screenshot({ path: `${out}/home.png` });
await page.click('.match-btn');
await page.waitForSelector('.mm-card', { timeout: 5000 });
await page.screenshot({ path: `${out}/matchmaking.png` });
await page.waitForSelector('.board', { timeout: 8000 });
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
let moves = 0;
for (let i = 0; i < 80; i++) {
  if (await page.$('.results, .settle')) break;
  try {
    await page.waitForSelector('.player-bar.me .clock.running', { timeout: 15000 });
  } catch {
    break;
  }
  if (await page.$('.results, .settle')) break;
  const box = await page.$eval('.board', (b) => {
    const r = b.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width };
  });
  let moved = false;
  for (const k of shuffle([...Array(49).keys()])) {
    const cx = box.x + ((k % 7) + 0.5) * (box.w / 7);
    const cy = box.y + (Math.floor(k / 7) + 0.5) * (box.w / 7);
    await page.mouse.click(cx, cy);
    const t = await page.$$('.target');
    if (t.length) {
      const tb = await t[Math.floor(Math.random() * t.length)].boundingBox();
      await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
      if (await page.$('.promo-pick')) await page.click('.promo-pick button');
      moved = true;
      moves++;
      break;
    }
  }
  if (!moved) break;
  if (moves === 3) await page.screenshot({ path: `${out}/play.png` });
}
await page.waitForSelector('.results', { timeout: 30000 }).catch(() => {});
const resultText = (await page.$('.results')) ? await page.textContent('.results') : '(no result yet)';
await page.screenshot({ path: `${out}/result.png` });
console.log(JSON.stringify({ moves, resultText: resultText.slice(0, 300), errors }, null, 1));
await browser.close();
process.exit(errors.length ? 1 : 0);
