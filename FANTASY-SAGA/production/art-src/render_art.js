// Rasterize SVGs in art-src/svg to PNGs in ../../artwork using Chromium.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const src = path.join(__dirname, 'svg');
  const out = path.join(__dirname, '..', '..', 'artwork');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const f of fs.readdirSync(src).filter(f => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(src, f), 'utf8');
    const m = svg.match(/width="(\d+)" height="(\d+)"/);
    const w = +m[1], h = +m[2];
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, f.replace('.svg', '.png')), clip: { x: 0, y: 0, width: w, height: h }, omitBackground: f.startsWith('ornament') });
    fs.copyFileSync(path.join(src, f), path.join(out, f));
    await page.close();
    console.log('rendered', f, w, h);
  }
  await browser.close();
})();
