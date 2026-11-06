import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { boot } from './ui/appState';
import './ui/styles.css';

boot();
createRoot(document.getElementById('root')!).render(<App />);

// Offline support: register the service worker on http(s) production builds.
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
