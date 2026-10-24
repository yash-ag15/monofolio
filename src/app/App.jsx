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
import { requestGuestSync, useGuestStatus } from '../lib/guest.js';
import { setPersonInfo } from '../lib/analytics.js';
import { LogoMark } from '../components/Logo.jsx';

const SYNC_TEXT = { saved: 'Saved', saving: 'Saving…', offline: 'Offline', 'too-large': 'Not saved' };
const SYNC_TITLE = { saved: 'All changes are saved to your account', saving: 'Saving your changes…', offline: 'Can’t reach the server — your changes will be saved when you’re back online', 'too-large': 'Your data is too large to save — remove big images or 3D models' };



const ALL = NAV.flatMap((g) => g.items);

// First visit without an account: say plainly that nothing is needed to start, and what signing in adds.
const INTRO_SEEN = 'monofolio:guest-intro';
function GuestIntro() {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(INTRO_SEEN);
    } catch {
      return true;
    }
  });
  if (!show) return null;
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(INTRO_SEEN, '1');
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="guest-intro" role="status">
      <Icon name="user" size={18} />
      <span>
        <b>You’re using Monofolio as a guest — no account needed.</b> Everything you make is saved in this browser. Choose “Sign in to sync” any time to move it into your account and use it on other devices.
      </span>
      <button className="btn secondary sm" onClick={requestGuestSync}>
        Sign in to sync
      </button>
      <button className="btn ghost icon" aria-label="Dismiss" title="Got it" onClick={close}>
        <Icon name="x" />
      </button>
    </div>
  );
}

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
  const guestSync = useGuestStatus();
  // analytics keep only the person's name and college (see lib/analytics.js); sent once typing settles
  const personName = state.profile.basics.name;
  const college = (state.profile.education || []).find((e) => (e.school || '').trim())?.school;
  useEffect(() => {
    const t = setTimeout(() => setPersonInfo({ name: personName, college }), 2000);
    return () => clearTimeout(t);
  }, [personName, college]);
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
          <LogoMark />
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
            {user?.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : user ? (user.name || user.email || '?').trim().charAt(0).toUpperCase() : <Icon name="user" size={15} />}
          </span>
          <div className="side-who">
            {user ? (
              <>
                <b title={user.email}>{user.name || user.email}</b>
                <span className={`side-sync ${sync}`} title={SYNC_TITLE[sync]}>
                  <i /> {SYNC_TEXT[sync] || SYNC_TEXT.saved}
                </span>
              </>
            ) : (
              <>
                <b>Guest</b>
                {guestSync === 'saved' ? (
                  <span className="side-sync saved" title="Your work is saved in this browser only. Sign in to back it up and use it on other devices.">
                    <i /> Saved in this browser
                  </span>
                ) : (
                  <span className="side-sync too-large" title={guestSync === 'full' ? 'This browser’s storage is full (large photos or many resumes) — sign in to keep saving your work.' : 'This browser isn’t allowing the site to save (private window?) — sign in to keep your work.'}>
                    <i /> Not saved — sign in
                  </span>
                )}
              </>
            )}
          </div>
          <button className="btn ghost icon" title="Toggle theme" onClick={() => dispatch({ type: 'theme/toggle' })}>
            <Icon name={state.appTheme === 'light' ? 'moon' : 'sun'} />
          </button>
          {user ? (
            <button className="btn ghost icon" title="Sign out" onClick={() => confirm('Sign out of Monofolio?') && signOut()}>
              <Icon name="logout" />
            </button>
          ) : (
            <button className="btn secondary sm" title="Move your work into your account, so it's backed up and on every device" onClick={requestGuestSync}>
              Sign in to sync
            </button>
          )}
        </div>
      </aside>
      <div className="main">
        <div className="mobile-bar">
          <button className="btn ghost icon" onClick={() => setMenu(!menu)} aria-label="Menu">
            <Icon name="menu" />
          </button>
          Monofolio
        </div>
        {!user && <GuestIntro />}
        {page}
      </div>
    </div>
  );
}
