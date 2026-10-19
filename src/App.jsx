import { useEffect, useState } from 'react';
import { useStore } from './store.jsx';
import { Icon } from './components/ui.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Studio from './pages/Studio.jsx';
import GitHubSync from './pages/GitHubSync.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import { useAutoSync } from './lib/github.js';
import { NAV } from './nav.js';



const ALL = NAV.flatMap((g) => g.items);

function useHashRoute() {
  const read = () => (window.location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0];
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [route, (r) => (window.location.hash = `/${r}`)];
}

export default function App() {
  const { state, dispatch } = useStore();
  const [route, go] = useHashRoute();
  const [menu, setMenu] = useState(false);
  useAutoSync();

  const current = ALL.find((i) => i.id === route) || ALL[0];
  let page;
  switch (current.id) {
    case 'profile':
      page = <Profile go={go} />;
      break;
    case 'studio':
      page = <Studio go={go} />;
      break;
    case 'github':
      page = <GitHubSync go={go} />;
      break;
    case 'dashboard':
      page = <Dashboard go={go} />;
      break;
    default:
      page = <ComingSoon item={current} go={go} />;
  }

  return (
    <div className="app">
      <aside className={`side ${menu ? 'open' : ''}`}>
        <div className="logo">
          <div className="logo-mark" aria-hidden="true">
            <i />
            <i />
          </div>
          Monofolio
        </div>
        {NAV.map((g) => (
          <div className="nav-group" key={g.title}>
            <div className="nav-title">{g.title}</div>
            {g.items.map((it) => (
              <button
                key={it.id}
                className={`nav-item ${current.id === it.id ? 'active' : ''}`}
                onClick={() => {
                  go(it.id);
                  setMenu(false);
                }}
              >
                <Icon name={it.icon} />
                {it.label}
                {it.soon && <span className="soon">next</span>}
              </button>
            ))}
          </div>
        ))}
        <div className="side-foot">
          <span className="live" />
          <span>Saved on this device</span>
          <span className="spacer" />
          <button className="btn ghost icon" title="Toggle theme" onClick={() => dispatch({ type: 'theme/toggle' })}>
            <Icon name={state.appTheme === 'light' ? 'moon' : 'sun'} />
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="mobile-bar">
          <button className="btn ghost icon" onClick={() => setMenu(!menu)} aria-label="Menu">
            <Icon name="menu" />
          </button>
          Monofolio
        </div>
        {page}
      </div>
    </div>
  );
}
