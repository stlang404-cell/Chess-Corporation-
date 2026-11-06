// Academy screenshots: puzzles, guide chapter, exercises, practice (phone size).
// Usage: node tests/e2e/academy.mjs <url> <outDir>
import { createRequire } from 'node:module';
import { finishOnboarding } from './helpers.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/', out = '.'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(url);
await finishOnboarding(p);
await p.click('.nav button:has-text("Academy")');
await p.click('.segmented button:has-text("Puzzles")');
await p.waitForSelector('.exercise .board');
await p.screenshot({ path: `${out}/academy-puzzles.png` });
await p.click('.segmented button:has-text("Guide")');
const toc = await p.$$('.toc li');
await toc[5].click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/academy-guide.png` });
await p.click('.segmented button:has-text("Practice")');
await p.screenshot({ path: `${out}/academy-practice.png` });
console.log(JSON.stringify({ errors }));
await b.close();
process.exit(errors.length ? 1 : 0);
