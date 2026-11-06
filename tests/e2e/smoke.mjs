// Browser smoke test (v0.2): onboarding → MATCH → untimed game played to the end
// with random legal moves → settlement → results sheet → NEXT MATCH.
// Usage: node tests/e2e/smoke.mjs <url> [outDir]
import { createRequire } from 'node:module';
import { finishOnboarding, startRated, playAnyMove, MY_TURN } from './helpers.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const url = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? '.';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await finishOnboarding(page);
await page.screenshot({ path: `${out}/smoke-home.png` });
await startRated(page);
const clockShown = !!(await page.$('.clock'));
let moves = 0;
for (let i = 0; i < 120; i++) {
  if (await page.$('.results, .settle')) break;
  try {
    await page.waitForSelector(`${MY_TURN}, .results, .settle`, { timeout: 20000 });
  } catch {
    break;
  }
  if (await page.$('.results, .settle')) break;
  if (!(await playAnyMove(page))) break;
  moves++;
}
await page.waitForSelector('.results', { timeout: 40000 }).catch(() => {});
if (await page.$('.ceremony .skip')) await page.click('.ceremony .skip');
if (await page.$('.ceremony.minor')) await page.click('.ceremony.minor');
const resultText = (await page.$('.results')) ? (await page.textContent('.results')).replace(/\s+/g, ' ') : '(no result)';
await page.screenshot({ path: `${out}/smoke-result.png` });
let nextOk = false;
if (await page.$('.results .btn.big')) {
  await page.click('.results .btn.big');
  nextOk = !!(await page.waitForSelector('.opp-card', { timeout: 5000 }).catch(() => null));
}
console.log(JSON.stringify({ moves, untimedNoClock: !clockShown, resultText: resultText.slice(0, 240), nextMatchWorks: nextOk, errors }, null, 1));
await browser.close();
process.exit(errors.length || clockShown || !resultText.includes('Rating') ? 1 : 0);
