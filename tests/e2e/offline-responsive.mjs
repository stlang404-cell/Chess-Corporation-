// 1) Offline: after one online visit the PWA reloads and plays with the network cut.
// 2) Responsive: every tab at phone / tablet / desktop sizes has no horizontal
//    overflow and the board fits on screen.
// Usage: node tests/e2e/offline-responsive.mjs http://localhost:4173/ [shotDir]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const url = process.argv[2] ?? 'http://localhost:4173/';
const shots = process.argv[3];
const b = await chromium.launch();
const results = { offline: null, responsive: [] };

{
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto(url);
  await p.waitForSelector('.match-btn');
  await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await p.reload(); // let the SW control the page
  await p.waitForSelector('.match-btn');
  await ctx.setOffline(true);
  await p.reload();
  const ok = await p.waitForSelector('.match-btn', { timeout: 8000 }).then(() => true).catch(() => false);
  let botMoved = false;
  if (ok) {
    await p.click('.match-btn');
    await p.waitForSelector('.board', { timeout: 10000 });
    // whoever moves first, within a few seconds at least one ply or our clock must be live
    await p.waitForTimeout(3000);
    botMoved = !!(await p.$('.player-bar.me .clock.running'));
  }
  results.offline = { reloadedOffline: ok, engineWorksOffline: botMoved };
  await ctx.close();
}

const sizes = [
  [320, 568, 'iPhone SE (1st)'],
  [390, 844, 'iPhone 14'],
  [430, 932, 'iPhone Pro Max'],
  [768, 1024, 'iPad'],
  [1366, 768, 'laptop'],
  [1920, 1080, 'desktop'],
];
for (const [w, h, name] of sizes) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto(url);
  await p.waitForSelector('.nav');
  for (const tab of ['Home', 'Career', 'Academy', 'Play']) {
    await p.click(`.nav button:has-text("${tab}")`);
    await p.waitForTimeout(150);
    const m = await p.evaluate(() => {
      const board = document.querySelector('.play .board');
      const r = board?.getBoundingClientRect();
      return {
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        boardFits: r ? r.width <= window.innerWidth && r.right <= window.innerWidth + 1 : null,
      };
    });
    results.responsive.push({ size: name, tab, ...m });
    if (shots && tab === 'Home') await p.screenshot({ path: `${shots}/home-${w}x${h}.png` });
  }
  await ctx.close();
}
await b.close();
const bad = results.responsive.filter((r) => r.overflowX || r.boardFits === false);
console.log(JSON.stringify({ offline: results.offline, responsiveChecks: results.responsive.length, failures: bad }, null, 1));
process.exit(!results.offline.reloadedOffline || !results.offline.engineWorksOffline || bad.length ? 1 : 0);
