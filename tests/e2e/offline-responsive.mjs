// 1) Offline: after one online visit the PWA reloads with the network cut, a
//    rated untimed game starts and the engine (Web Worker) replies offline.
// 2) Responsive: every tab at 7 widths has no horizontal overflow and the board fits.
// Usage: node tests/e2e/offline-responsive.mjs http://localhost:4173/
import { createRequire } from 'node:module';
import { finishOnboarding, startRated, playAnyMove, MY_TURN } from './helpers.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const url = process.argv[2] ?? 'http://localhost:4173/';
const b = await chromium.launch();
const results = { offline: null, responsive: [] };

{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto(url);
  await finishOnboarding(p);
  await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await p.reload();
  await p.waitForSelector('.match-btn');
  await ctx.setOffline(true);
  await p.reload();
  const ok = await p.waitForSelector('.match-btn', { timeout: 8000 }).then(() => true).catch(() => false);
  let engineReplied = false;
  let savedOffline = false;
  if (ok) {
    await startRated(p);
    // make sure at least one engine move happens: play once if it is our turn, then wait for our turn again
    await p.waitForSelector(MY_TURN, { timeout: 20000 });
    const before = (await p.textContent('.movelist')).replace(/\s+/g, ' ');
    await playAnyMove(p);
    engineReplied = !!(await p.waitForSelector(MY_TURN, { timeout: 20000 }).catch(() => null));
    const after = (await p.textContent('.movelist')).replace(/\s+/g, ' ');
    engineReplied = engineReplied && after !== before;
    await p.reload();
    savedOffline = !!(await p.waitForSelector('.play .board', { timeout: 8000 }).catch(() => null));
  }
  results.offline = { reloadedOffline: ok, engineRepliedOffline: engineReplied, gameSurvivedOfflineReload: savedOffline };
  await ctx.close();
}

const sizes = [320, 375, 390, 430, 768, 1024, 1440];
for (const w of sizes) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 760 : 900 } });
  const p = await ctx.newPage();
  await p.goto(url);
  try {
    await finishOnboarding(p);
    await startRated(p);
  } catch (e) {
    await p.screenshot({ path: `fail-${w}.png` });
    throw new Error(`width ${w}: ${String(e).slice(0, 200)}`);
  }
  for (const tab of ['Home', 'Career', 'Academy', 'Play']) {
    await p.click(`.nav button:has-text("${tab}")`);
    await p.waitForTimeout(150);
    const m = await p.evaluate(() => {
      const board = document.querySelector('.play .board');
      const r = board?.getBoundingClientRect();
      return {
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        boardFits: r ? r.width <= window.innerWidth && r.right <= window.innerWidth + 1 && r.width >= 260 : null,
      };
    });
    results.responsive.push({ width: w, tab, ...m });
  }
  await ctx.close();
}
await b.close();
const bad = results.responsive.filter((r) => r.overflowX || r.boardFits === false);
console.log(JSON.stringify({ offline: results.offline, responsiveChecks: results.responsive.length, failures: bad }, null, 1));
const o = results.offline;
process.exit(!o.reloadedOffline || !o.engineRepliedOffline || !o.gameSurvivedOfflineReload || bad.length ? 1 : 0);
