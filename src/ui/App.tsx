import { useEffect, useState } from 'react';
import { useApp, go, setState, updateSave, type Tab } from './appState';
import { Home } from './Home';
import { Play } from './Play';
import { Career } from './Career';
import { Academy } from './Academy';
import { Icon, type IconName } from './icons';
import { FAMILIES } from '../game/careerData';
import { rankInfo } from '../game/career';
import { Insignia } from './Insignia';

const TABS: [Tab, string, IconName][] = [
  ['home', 'Home', 'home'],
  ['play', 'Play', 'board'],
  ['career', 'Career', 'ladder'],
  ['academy', 'Academy', 'book'],
];

function useTheme() {
  const { save } = useApp();
  const pref = save.settings.theme;
  const [sys, setSys] = useState(() => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const fn = () => setSys(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);
  const theme = pref === 'auto' ? sys : pref;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.contrast = save.settings.highContrast ? 'high' : 'normal';
    root.dataset.motion = save.settings.animSpeed === 'off' ? 'reduced' : 'full';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#151513' : '#f4efe4');
  }, [theme, save.settings.highContrast, save.settings.animSpeed]);
}

export function App() {
  const { ready, tab, toast, recovered, save, autoMatch, updateReady } = useApp();
  useTheme();
  useEffect(() => {
    if (recovered) setState({ toast: 'Your save was restored from its backup copy.' });
  }, [recovered]);
  useEffect(() => {
    if (autoMatch && tab === 'home') {
      setState({ autoMatch: false });
      setTimeout(() => (document.querySelector('.match-btn') as HTMLButtonElement | null)?.click(), 30);
    }
  }, [autoMatch, tab]);
  if (!ready)
    return (
      <div className="boot" aria-label="Loading SEVEN">
        <span>七</span>
      </div>
    );
  const inGame = !!save.active && !save.active.finished;
  return (
    <div className={`app tab-${tab}`}>
      <nav className="nav" aria-label="Main">
        <div className="nav-brand" aria-hidden>
          <span className="brand-seal">七</span>
          <span className="brand-word">SEVEN</span>
        </div>
        {TABS.map(([t, label, icon]) => (
          <button key={t} className={t === tab ? 'on' : ''} onClick={() => go(t)} aria-current={t === tab ? 'page' : undefined}>
            <Icon name={icon} size={22} />
            <span className="nav-l">{label}</span>
            {t === 'play' && inGame && tab !== 'play' && <span className="nav-dot" aria-label="game in progress" />}
          </button>
        ))}
      </nav>
      <main className="main">
        {tab === 'home' && <Home />}
        {tab === 'play' && <Play />}
        {tab === 'career' && <Career />}
        {tab === 'academy' && <Academy />}
      </main>
      {updateReady && (
        <div className="update-banner" role="status">
          <span>A new version of SEVEN is ready.</span>
          <button className="btn small primary" onClick={() => updateReady()}>
            Reload
          </button>
          <button className="icon-btn" aria-label="Later" onClick={() => setState({ updateReady: null })}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {!save.settings.onboarded && <Onboarding />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function Onboarding() {
  const { save } = useApp();
  const [step, setStep] = useState(0);
  const [family, setFamily] = useState(save.career.family || 'strategy');
  const done = () =>
    updateSave((s) => {
      s.settings.onboarded = true;
      s.career.family = family;
    });
  return (
    <div className="overlay onboarding" role="dialog" aria-modal="true" aria-label="Welcome to SEVEN">
      <div className="sheet">
        {step === 0 && (
          <>
            <div className="ob-seal">七</div>
            <h1 className="display">Welcome to SEVEN</h1>
            <p className="lede">Chess on a 7×7 board. Press MATCH, play without a clock, and climb a corporate ladder that never ends.</p>
            <ul className="ob-points">
              <li>
                <b>Rating</b> measures your chess.
              </li>
              <li>
                <b>Title</b> measures your career.
              </li>
              <li>
                <b>Dollars</b> buy only cosmetics.
              </li>
            </ul>
            <button className="btn primary wide" onClick={() => setStep(1)}>
              Begin
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="display">Choose your department</h2>
            <p className="muted">Your function shapes your job titles only — never the chess. You can change it later in Career.</p>
            <div className="family-grid">
              {FAMILIES.map((f) => (
                <button key={f.id} className={`family ${f.id === family ? 'on' : ''}`} onClick={() => setFamily(f.id)}>
                  <span className="fam-name">{f.name}</span>
                  <span className="fam-sub">{f.titles[0]}</span>
                </button>
              ))}
            </div>
            <button className="btn primary wide" onClick={() => setStep(2)}>
              Continue
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <Insignia rank={0} family={family} size={84} />
            <h2 className="display">{rankInfo(0, family).full}</h2>
            <p className="muted">{rankInfo(0, family).appointment}</p>
            <ol className="ob-steps">
              <li>Tap a piece, then a highlighted square — or drag.</li>
              <li>Same rules as chess, on seven files: queens face off on the d-file, kings castle to g1 or c1.</li>
              <li>Take as long as you like. Leave any time; your game waits for you.</li>
            </ol>
            <button className="btn primary wide" onClick={done}>
              Start my career
            </button>
            <button className="btn ghost wide" onClick={() => { done(); setState({ tab: 'academy' }); }}>
              Read the rules first
            </button>
          </>
        )}
        <div className="ob-dots" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i === step ? 'on' : ''} />
          ))}
        </div>
      </div>
    </div>
  );
}
