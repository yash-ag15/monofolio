import { useEffect, useState } from 'react';
import { useStore } from './store.jsx';
import { Icon } from '../components/ui.jsx';
import Dashboard from '../views/Dashboard.jsx';
import Profile from '../views/Profile.jsx';
import Studio from '../views/studio/Studio.jsx';
import GitHubSync from '../views/GitHubSync.jsx';
import Resume from '../views/Resume.jsx';
import Ats from '../views/Ats.jsx';
import Tailor from '../views/Tailor.jsx';
import Readme from '../views/Readme.jsx';
import Cover from '../views/Cover.jsx';
import Card from '../views/Card.jsx';
import { useAutoSync } from '../lib/github.js';
import { NAV } from './nav.js';
import { useAccount, useSyncStatus } from '../lib/account.jsx';

const SYNC_TEXT = { saved: 'Saved', saving: 'Saving…', offline: 'Offline', 'too-large': 'Not saved' };
const SYNC_TITLE = { saved: 'All changes are saved to your account', saving: 'Saving your changes…', offline: 'Can’t reach the server — your changes will be saved when you’re back online', 'too-large': 'Your data is too large to save — remove big images or 3D models' };



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
  const { user, signOut } = useAccount();
  const sync = useSyncStatus();
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
    case 'resume':
      page = <Resume go={go} />;
      break;
    case 'ats':
      page = <Ats go={go} />;
      break;
    case 'tailor':
      page = <Tailor go={go} />;
      break;
    case 'readme':
      page = <Readme go={go} />;
      break;
    case 'cover':
      page = <Cover go={go} />;
      break;
    case 'card':
      page = <Card go={go} />;
      break;
    default:
      page = <Dashboard go={go} />;
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
        <div className="side-foot side-user">
          <span className="side-avatar" aria-hidden="true">
            {user?.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : (user?.name || user?.email || '?').trim().charAt(0).toUpperCase()}
          </span>
          <div className="side-who">
            <b title={user?.email}>{user?.name || user?.email}</b>
            <span className={`side-sync ${sync}`} title={SYNC_TITLE[sync]}>
              <i /> {SYNC_TEXT[sync] || SYNC_TEXT.saved}
            </span>
          </div>
          <button className="btn ghost icon" title="Toggle theme" onClick={() => dispatch({ type: 'theme/toggle' })}>
            <Icon name={state.appTheme === 'light' ? 'moon' : 'sun'} />
          </button>
          <button className="btn ghost icon" title="Sign out" onClick={() => confirm('Sign out of Monofolio?') && signOut()}>
            <Icon name="logout" />
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
