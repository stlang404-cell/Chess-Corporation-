// Animation integrity: animation must never disagree with the authoritative position.
// Invariant (checked once animations settle): every occupied square (per its aria-label,
// which comes straight from the game state) holds exactly one rendered piece whose
// centre lies inside it, and there are no extra pieces.
// Scenarios: tap moves with AI replies landing mid-animation, rapid random taps
// during animations, drag-and-drop without snap-back, board flip without animation,
// reload/resume sync, reduced motion.
// Usage: node tests/e2e/animation.mjs <url>
import { createRequire } from 'node:module';
import { finishOnboarding, startRated, MY_TURN } from './helpers.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/'] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const errors = [];
const results = {};
p.on('pageerror', (e) => errors.push(String(e)));

const settle = () => p.waitForFunction(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.classList?.contains('pc') && !a.effect.target.classList.contains('ghost')).length === 0, null, { timeout: 5000 });
async function check(label) {
  await settle();
  const bad = await p.evaluate(() => {
    const board = document.querySelector('.play .board');
    const squares = [...board.querySelectorAll('.sq')];
    const pcs = [...board.querySelectorAll('.pc:not(.ghost)')].map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, sq: e.dataset.sq };
    });
    const out = [];
    let occupied = 0;
    for (const s of squares) {
      const has = s.getAttribute('aria-label').includes(',');
      const r = s.getBoundingClientRect();
      const inside = pcs.filter((c) => c.x > r.left && c.x < r.right && c.y > r.top && c.y < r.bottom);
      if (has) occupied++;
      if (has && inside.length !== 1) out.push(`${s.dataset.sq}: ${inside.length} pieces drawn, state has 1`);
      if (!has && inside.length) out.push(`${s.dataset.sq}: piece drawn on empty square`);
    }
    if (pcs.length !== occupied) out.push(`${pcs.length} pieces drawn vs ${occupied} in state`);
    return out;
  });
  results[label] = bad.length ? bad : 'ok';
  return bad.length === 0;
}
async function boardBox() {
  await p.$eval('.play .board', (el) => el.scrollIntoView({ block: 'center' }));
  return p.$eval('.play .board', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width };
  });
}
const center = (box, k) => ({ x: box.x + ((k % 7) + 0.5) * (box.w / 7), y: box.y + (Math.floor(k / 7) + 0.5) * (box.w / 7) });
/** find a (from, target) pair by clicking own pieces; returns screen points or null */
async function findMove(box) {
  // clear a leftover selection first, or a probe click could play a move
  const selEl = await p.$('.play .sq.sel');
  if (selEl) {
    const r = await selEl.boundingBox();
    await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  }
  for (let k = 48; k >= 0; k--) {
    const c = center(box, k);
    await p.mouse.click(c.x, c.y);
    const t = await p.$$('.play .target');
    if (t.length) {
      const tb = await t[0].boundingBox();
      const sb = await (await p.$('.play .sq.sel')).boundingBox();
      return { from: { x: sb.x + sb.width / 2, y: sb.y + sb.height / 2 }, to: { x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 } };
    }
  }
  return null;
}
const myTurn = () => p.waitForSelector(`${MY_TURN}, .results, .settle`, { timeout: 25000 });

await p.goto(url);
await finishOnboarding(p);
await startRated(p);

// 1) tap moves; the AI reply often lands while our move is still animating
for (let i = 0; i < 4; i++) {
  await myTurn();
  const box = await boardBox();
  const m = await findMove(box);
  if (!m) break;
  await p.mouse.click(m.to.x, m.to.y);
  await check(`tap-move-${i}`);
}

// 2) rapid taps during animations: a move, then random taps immediately (some may be legal)
await myTurn();
{
  const box = await boardBox();
  const m = await findMove(box);
  if (m) {
    await p.mouse.click(m.to.x, m.to.y);
    for (let k = 0; k < 30; k++) {
      const c = center(box, (k * 17) % 49);
      await p.mouse.click(c.x, c.y, { delay: 0 });
    }
  }
  await p.waitForTimeout(1500);
  await check('rapid-taps');
}

// 3) drag-and-drop: the dropped piece must not animate back from its origin (no snap-back)
await myTurn();
{
  const box = await boardBox();
  const m = await findMove(box);
  await p.mouse.move(m.from.x, m.from.y);
  await p.mouse.down();
  // many small steps (≈3 px), like a real touch drag
  const steps = Math.max(8, Math.ceil(Math.hypot(m.to.x - m.from.x, m.to.y - m.from.y) / 3));
  for (let s = 1; s <= steps; s++) await p.mouse.move(m.from.x + ((m.to.x - m.from.x) * s) / steps, m.from.y + ((m.to.y - m.from.y) * s) / steps);
  // sample every frame from the drop: the AI may answer (even capture) within milliseconds
  await p.evaluate((to) => {
    window.__trace = [];
    const t0 = performance.now();
    const tick = () => {
      const el = [...document.querySelectorAll('.play .board .pc:not(.ghost)')].find((e) => {
        const r = e.getBoundingClientRect();
        return to.x > r.left && to.x < r.right && to.y > r.top && to.y < r.bottom;
      });
      window.__trace.push(el ? el.getAnimations().length : -1);
      if (performance.now() - t0 < 120) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, m.to);
  await p.mouse.up();
  await p.waitForTimeout(200);
  const trace = await p.evaluate(() => window.__trace);
  // first frames after the drop: a piece is on the target and it is not animating back
  const snap = trace.slice(0, 4).some((x) => x !== 0) ? JSON.stringify(trace.slice(0, 4)) : 0;
  results['drag-no-snapback'] = snap === 0 ? 'ok' : `dropped piece animations: ${snap}`;
  await check('drag-move');
}

// 4) flip: no piece animates, positions remain consistent
await myTurn();
{
  await p.click('button[title="Flip board"]');
  const running = await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('pc') && !a.effect.target.classList.contains('ghost')).length);
  results['flip-no-animation'] = running === 0 ? 'ok' : `${running} animations on flip`;
  await check('flipped');
  await p.click('button[title="Flip board"]');
  await check('unflipped');
}

// 5) resume: reload restores exactly the same position and nothing animates on mount
{
  const before = await p.$$eval('.play .board .sq', (s) => s.map((e) => e.getAttribute('aria-label')).join('|'));
  await p.reload();
  await p.waitForSelector('.nav');
  if (await p.$('.match-btn')) await p.click('.match-btn'); // RESUME
  await p.waitForSelector('.play .board');
  const mountAnims = await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('pc') && !a.effect.target.classList.contains('ghost')).length);
  const after = await p.$$eval('.play .board .sq', (s) => s.map((e) => e.getAttribute('aria-label')).join('|'));
  results['resume-same-position'] = before === after ? 'ok' : 'position changed on resume';
  results['resume-no-animation'] = mountAnims === 0 ? 'ok' : `${mountAnims} animations on mount`;
  await check('resumed');
}

// 6) reduced motion: moves apply instantly, still consistent
await ctx.close();
{
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const p2 = await c2.newPage();
  p2.on('pageerror', (e) => errors.push(String(e)));
  await p2.goto(url);
  await finishOnboarding(p2);
  await startRated(p2);
  await p2.waitForSelector(MY_TURN, { timeout: 25000 });
  const anim = await p2.$eval('.play .board', (el) => el.dataset.anim);
  results['reduced-motion-anim-ms'] = anim === '0' ? 'ok' : `data-anim=${anim}`;
  await c2.close();
}

const failed = Object.entries(results).filter(([, v]) => v !== 'ok');
console.log(JSON.stringify({ results, errors }, null, 1));
await b.close();
process.exit(failed.length || errors.length ? 1 : 0);
