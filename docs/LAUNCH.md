# Launching SEVEN

**Play online (and install on iPhone):** https://stlang404-cell.github.io/Chess-Corporation-/

SEVEN runs entirely on your device: no account, no server-side code, no ads. After the first visit it works offline. Your career is stored by the browser on that device (IndexedDB, with an automatic backup copy and checksum).

## iPhone / iPad — install as an app

1. Open **https://stlang404-cell.github.io/Chess-Corporation-/** in **Safari** (other iOS browsers cannot install web apps on older iOS versions).
2. Wait a few seconds after the first load so the app can store itself for offline use.
3. Tap **Share** (the square with an arrow) → **Add to Home Screen** → **Add**. The icon is the red 七 seal named *SEVEN*.
4. Open SEVEN from the Home Screen. It runs full-screen, without Safari's address bar, and works in airplane mode.

Notes
- The Home-Screen app keeps its own storage, separate from Safari tabs: play from the icon.
- iOS may clear data of web apps that go unused for several weeks. Use **Career → Settings → Export career** now and then to keep a backup file (e.g. in iCloud Drive).
- When a new version is published, SEVEN shows *"A new version of SEVEN is ready — Reload"*. Your career and any game in progress are kept; nothing updates in the middle of a move.

## Windows — one click, fully offline

1. Download the `release/windows` folder from this repository (`SEVEN.html` and `Launch SEVEN.bat`). Keep the two files together.
2. Double-click **`Launch SEVEN.bat`**. It opens the game in a clean Microsoft Edge window (or your default browser if Edge is missing). Nothing is installed and no security setting is changed; Windows SmartScreen may ask the first time — you can also just double-click `SEVEN.html`.
3. Alternatively open the website above in Edge or Chrome and choose **Install app** from the browser menu.

## Moving a career between Windows and iPhone

Saves do not sync automatically (there is no server). To move a career:

1. On the old device: **Career → Settings → Export career** → a `seven-career-YYYY-MM-DD.seven.json` file is downloaded.
2. Send the file to the other device (AirDrop, email, iCloud Drive, USB…).
3. On the new device: **Career → Settings → Import career** → choose the file. SEVEN validates it (format, checksum, schema version) and shows *both* careers side by side before asking you to confirm replacing the one on this device. Nothing is overwritten without that confirmation.

Backups from v0.1 import into v0.2 and are upgraded automatically.

## Publishing (maintainers)

The site is served by GitHub Pages from the deploy-only `gh-pages` branch:

```bash
npm ci
npm test                     # vitest: rules, engine, AI, career, economy, saves, guide, puzzles
scripts/deploy-pages.sh      # builds the PWA and force-pushes dist/ to gh-pages
```

`.github/workflows/pages.yml` is an alternative Actions-based deployment that runs on pushes to `main` once *Settings → Pages → Source* is set to *GitHub Actions*.

## Building from source

```bash
npm ci
npm run dev              # development server
npm run build            # PWA → dist/ (with service-worker precache list)
npm run build:single     # single-file build → release/windows/SEVEN.html
```

Browser end-to-end checks (Playwright's Chromium):

```bash
tests/e2e/run-all.sh                                               # build + serve + all checks
node tests/e2e/smoke.mjs   https://stlang404-cell.github.io/Chess-Corporation-/   # against the live site
node tests/e2e/visual.mjs  http://localhost:4173/ shots/          # 112 screenshots, 7 widths × 2 themes
```
