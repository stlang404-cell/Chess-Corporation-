// Verifies the single-file build (Windows launcher target) works from file://:
// boots, starts a match, makes one move, and sees the engine reply.
// Usage: node tests/e2e/file-protocol.mjs /abs/path/to/SEVEN.html [screenshot.png]
import { createRequire } from 'node:module';
import { finishOnboarding, startRated, playAnyMove, MY_TURN } from './helpers.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const file = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('file://' + file);
await finishOnboarding(p);
await startRated(p);
await p.waitForSelector(MY_TURN, { timeout: 20000 });
await playAnyMove(p);
await p.waitForSelector(MY_TURN, { timeout: 20000 });
const ml = (await p.textContent('.movelist')).replace(/\s+/g, ' ').trim();
const plies = await p.$$eval('.movelist .mv', (els) => els.filter((e) => e.textContent.trim()).length);
console.log(JSON.stringify({ movelist: ml, plies, errors: errs }));
await p.screenshot({ path: process.argv[3] ?? 'file-protocol.png' });
await b.close();
process.exit(errs.length || plies < 2 ? 1 : 0);
