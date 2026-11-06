import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { boot, setState } from './ui/appState';
import './ui/styles.css';

import { Gallery } from './ui/Gallery';

if (new URLSearchParams(location.search).has('gallery')) createRoot(document.getElementById('root')!).render(<Gallery />);
else {
  boot();
  createRoot(document.getElementById('root')!).render(<App />);
}

// Offline support: register the service worker on http(s) production builds.
// A new version waits until the player chooses to reload (update banner), so a
// running game or a save in progress is never interrupted by an update.
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol.startsWith('http')) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      const offer = (w: ServiceWorker | null) => {
        if (w && navigator.serviceWorker.controller) setState({ updateReady: () => w.postMessage({ type: 'SKIP_WAITING' }) });
      };
      offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => w.state === 'installed' && offer(w));
      });
      // Only reload when an existing page is handed to a NEW version (the player
      // pressed Reload). The very first install claiming the page needs no reload.
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading || !hadController) return;
        reloading = true;
        location.reload();
      });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    } catch {
      /* offline support unavailable */
    }
  });
}
