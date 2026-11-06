// Visual QA: screenshots of every main screen at 7 widths, light + dark, plus a
// geometry audit (horizontal overflow, board size, touch targets, nav overlap).
// Usage: node tests/e2e/visual.mjs <url> <outDir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/', out = '.'] = process.argv.slice(2);
const widths = [320, 375, 390, 430, 768, 1024, 1440];
const heights = { 320: 568, 375: 667, 390: 844, 430: 932, 768: 1024, 1024: 768, 1440: 900 };
const b = await chromium.launch();
const report = [];
const errors = [];
for (const theme of ['light', 'dark']) {
  for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: heights[w] }, deviceScaleFactor: 1, colorScheme: theme });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`${w} ${theme}: ${e}`));
    await p.goto(url);
    await p.waitForSelector('.nav');
    // complete onboarding
    if (await p.$('.onboarding')) {
      await p.click('.onboarding .btn.primary');
      await p.click('.family:nth-child(1)');
      await p.click('.onboarding .btn.primary');
      await p.click('.onboarding .btn.primary');
    }
    const audit = async (name) => {
      await p.waitForTimeout(250);
      const m = await p.evaluate(() => {
        const vw = window.innerWidth;
        const nav = document.querySelector('.nav')?.getBoundingClientRect();
        const small = [...document.querySelectorAll('button, select, input, [role=tab]')]
          .filter((e) => e.offsetParent !== null)
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.width > 0 && (r.height < 32 || r.width < 32)).length;
        const board = document.querySelector('.play .board')?.getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth > vw + 1, boardPx: board ? Math.round(board.width) : null, smallTargets: small, navTop: nav ? Math.round(nav.top) : null };
      });
      report.push({ theme, w, name, ...m });
      await p.screenshot({ path: `${out}/${theme}-${w}-${name}.png` });
    };
    await audit('home');
    await p.click('.match-btn');
    await p.waitForSelector('.opp-card');
    await audit('reveal');
    await p.click('.begin');
    await p.waitForSelector('.play .board');
    await p.waitForTimeout(1500);
    await audit('play');
    for (const [tab, sec] of [['Career', 'Overview'], ['Career', 'Directory'], ['Career', 'Store'], ['Career', 'Settings'], ['Academy', null]]) {
      await p.click(`.nav button:has-text("${tab}")`);
      if (sec) await p.click(`.segmented button:has-text("${sec}")`);
      await audit(`${tab.toLowerCase()}${sec ? '-' + sec.toLowerCase() : ''}`);
    }
    await ctx.close();
  }
}
await b.close();
const bad = report.filter((r) => r.overflow || (r.boardPx !== null && r.boardPx < 260));
console.log(JSON.stringify({ shots: report.length, failures: bad, errors, sample: report.filter((r) => r.name === 'play') }, null, 1));
process.exit(bad.length || errors.length ? 1 : 0);
