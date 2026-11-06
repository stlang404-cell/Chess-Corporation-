import { useEffect } from 'react';
import { useApp, go, setState, type Tab } from './appState';
import { Home } from './Home';
import { Play } from './Play';
import { Career } from './Career';
import { Academy } from './Academy';

const TABS: [Tab, string, string][] = [
  ['home', 'Home', '家'],
  ['play', 'Play', '盤'],
  ['career', 'Career', '昇'],
  ['academy', 'Academy', '学'],
];

export function App() {
  const { ready, tab, toast, recovered, save, autoMatch } = useApp();
  useEffect(() => {
    if (recovered) setState({ toast: 'Save restored from backup copy' });
  }, [recovered]);
  useEffect(() => {
    if (autoMatch && tab === 'home') {
      setState({ autoMatch: false });
      setTimeout(() => (document.querySelector('.match-btn') as HTMLButtonElement | null)?.click(), 50);
    }
  }, [autoMatch, tab]);
  if (!ready) return <div className="boot">七</div>;
  const inGame = !!save.active && !save.active.finished;
  return (
    <div className={`app tab-${tab}`}>
      <main className="main">
        {tab === 'home' && <Home />}
        {tab === 'play' && <Play />}
        {tab === 'career' && <Career />}
        {tab === 'academy' && <Academy />}
      </main>
      <nav className="nav" aria-label="Main">
        {TABS.map(([t, label, k]) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => go(t)} aria-current={t === tab}>
            <span className="nav-k">{k}</span>
            <span className="nav-l">
              {label}
              {t === 'play' && inGame && tab !== 'play' ? ' •' : ''}
            </span>
          </button>
        ))}
      </nav>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
