# Launching SEVEN

SEVEN is fully local: no account, no server, no network needed to play. Your career is saved by the browser on your device (IndexedDB, with an automatic backup copy and an optional export in **Career → Settings**).

## Windows — one click

1. Download the `release/windows` folder from this repository (it contains `SEVEN.html` and `Launch SEVEN.bat`). Keep the two files together.
2. Double-click **`Launch SEVEN.bat`**. It opens the game in a clean Microsoft Edge "app" window (no tabs or address bar). If Edge isn't installed it opens `SEVEN.html` in your default browser.
3. Optional: right-click `Launch SEVEN.bat` → *Send to → Desktop (create shortcut)*.

Notes
- Nothing is installed, no admin rights are needed, and the launcher does not change any Windows security setting. Windows may show a SmartScreen notice the first time you run a downloaded `.bat`; you can also simply double-click `SEVEN.html`.
- `SEVEN.html` is completely self-contained (≈380 KB: game, chess engine and guide in one file), so it works offline from any folder or a USB stick.
- Saves belong to the browser profile that opened the file. Use the same launcher/browser each time, and use *Export* to back up or move your career.

## iPhone / iPad — install as an app (PWA)

iOS can only install a web app (and keep it working offline) from an **https** address. Opening a local HTML file from the Files app will not give you a persistent, offline, home-screen app. So SEVEN has to be served once from any static web host; after the first visit it runs entirely offline.

### Option A — GitHub Pages (free, ~5 minutes)

1. In this repository on GitHub: *Settings → Pages → Build and deployment → Source: GitHub Actions*.
2. Push to `main` (or run the *Deploy PWA to GitHub Pages* workflow manually from the *Actions* tab). The workflow in `.github/workflows/pages.yml` runs the tests, builds the PWA and publishes it.
3. On the iPhone, open the Pages URL in **Safari**, wait a few seconds for the first load to finish, then tap **Share → Add to Home Screen**.
4. Launch SEVEN from the home-screen icon. It now works in airplane mode.

### Option B — any static host

Run `npm ci && npm run build` and upload the contents of `dist/` to any https static host (Netlify, Cloudflare Pages, your own server). No server-side code is involved.

### Option C — local network (testing)

`npm run build && npx vite preview --host` serves the PWA on your LAN, but iOS requires https for service workers, so offline install will not work over plain http. Use A or B for a real install.

### iOS caveats

- iOS may evict data for web apps that are not used for many weeks. Export a backup from *Career → Settings* occasionally.
- Home-screen apps on iOS have their own storage, separate from Safari tabs. Install first, then play from the icon.

## Any desktop browser (macOS, Linux, Windows)

Open `release/windows/SEVEN.html` directly, or serve `dist/` and use the browser's *Install app* option.

## Building from source

```bash
npm ci
npm test                 # unit + rules + engine tests (vitest)
npm run build            # PWA → dist/ (with service-worker precache list)
npm run build:single     # single-file build → release/windows/SEVEN.html
npm run dev              # development server
```

Browser end-to-end checks (need Playwright's Chromium):

```bash
npx vite preview --port 4173 &
node tests/e2e/smoke.mjs http://localhost:4173/            # MATCH → play → results
node tests/e2e/offline-responsive.mjs http://localhost:4173/  # offline reload, 6 screen sizes
node tests/e2e/file-protocol.mjs "$PWD/release/windows/SEVEN.html"  # Windows file:// build
```
