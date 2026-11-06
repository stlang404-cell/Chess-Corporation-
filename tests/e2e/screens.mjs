// Visual QA: screenshots of each main screen at phone size.
// Usage: node tests/e2e/screens.mjs http://localhost:4173/ outDir
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/', out = '.'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(url);
await p.waitForSelector('.nav');
const shot = async (name) => p.screenshot({ path: `${out}/${name}.png` });
await p.click('.nav button:has-text("Career")');
await shot('career-ladder');
for (const sec of ['Stats', 'Store', 'Office']) {
  await p.click(`.segmented button:has-text("${sec}")`);
  await p.waitForTimeout(150);
  await shot('career-' + sec.toLowerCase());
}
await p.click('.nav button:has-text("Academy")');
await shot('academy-guide');
const toc = await p.$$('.toc li');
if (toc.length > 2) {
  await toc[2].click();
  await p.waitForTimeout(200);
  await shot('academy-chapter');
}
await p.click('.segmented button:has-text("Exercises")');
const ex = await p.$$('.ex-list li');
if (ex.length) {
  await ex[0].click();
  await p.waitForTimeout(150);
  await shot('academy-exercise');
}
await p.click('.segmented button:has-text("Practice")');
await shot('academy-practice');
console.log(JSON.stringify({ errors }));
await b.close();
