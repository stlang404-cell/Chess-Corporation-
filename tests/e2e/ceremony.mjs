// Screenshot evidence of the promotion ceremonies (minor + major) and the results
// sheet, using fixture saves one finished win away from a promotion.
// Usage: node tests/e2e/ceremony.mjs <url> <outDir>
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/', out = '.'] = process.argv.slice(2);
const b = await chromium.launch();
const errors = [];
const results = {};
for (const [name, theme] of [['minor', 'light'], ['major', 'light'], ['major', 'dark']]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: theme });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  const env = JSON.parse(readFileSync(`tests/fixtures/save-${name}-promo.json`, 'utf8'));
  await p.addInitScript((v) => localStorage.setItem('seven-save', JSON.stringify({ json: v.json, sum: v.sum, at: 0 })), env);
  await p.goto(url);
  await p.waitForSelector('.nav');
  await p.click('.nav button:has-text("Play")');
  const sel = name === 'major' ? '.ceremony.major' : '.ceremony.minor';
  const shown = await p.waitForSelector(sel, { timeout: 20000 }).then(() => true).catch(() => false);
  await p.waitForTimeout(name === 'major' ? 1400 : 500);
  await p.screenshot({ path: `${out}/ceremony-${name}-${theme}.png` });
  if (name === 'major') await p.click('.ceremony .skip');
  await p.waitForSelector('.results', { timeout: 10000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/results-${name}-${theme}.png` });
  results[`${name}-${theme}`] = { ceremonyShown: shown, text: (await p.textContent('.results')).replace(/\s+/g, ' ').slice(0, 160) };
  await ctx.close();
}
await b.close();
console.log(JSON.stringify({ results, errors }, null, 1));
process.exit(errors.length || Object.values(results).some((r) => !r.ceremonyShown) ? 1 : 0);
