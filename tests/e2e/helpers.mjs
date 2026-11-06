// Shared helpers for the browser e2e scripts.
export async function finishOnboarding(p) {
  await p.waitForSelector('.nav');
  if (await p.$('.onboarding')) {
    await p.click('.onboarding .btn.primary');
    await p.click('.family:nth-child(1)');
    await p.click('.onboarding .btn.primary');
    await p.click('.onboarding .btn.primary');
    await p.waitForSelector('.onboarding', { state: 'detached' });
  }
  await waitSaved(p);
}

/** Wait until every save write in flight has reached storage. */
export async function waitSaved(p) {
  await p.waitForFunction(() => !document.documentElement.dataset.saving, null, { timeout: 10000 });
}

export async function startRated(p) {
  await p.click('.match-btn');
  await p.waitForSelector('.opp-card');
  await p.click('.begin');
  await p.waitForSelector('.play .board', { timeout: 10000 });
}

/** Our turn: the player's bar is active. */
export const MY_TURN = '.player-bar.me.active';

function shuffled(n) {
  const a = [...Array(n).keys()];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function playAnyMove(p) {
  const box = await p.$eval('.play .board', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width };
  });
  for (const k of shuffled(49)) {
    await p.mouse.click(box.x + ((k % 7) + 0.5) * (box.w / 7), box.y + (Math.floor(k / 7) + 0.5) * (box.w / 7));
    const t = await p.$$('.target');
    if (t.length) {
      const tb = await t[Math.floor(Math.random() * t.length)].boundingBox();
      await p.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
      if (await p.$('.promo-pick')) await p.click('.promo-row button');
      return true;
    }
  }
  return false;
}
