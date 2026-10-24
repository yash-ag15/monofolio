import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import App from './App.jsx';
import Auth from '../views/Auth.jsx';
import Landing from '../views/Landing.jsx';
import { StoreProvider, isBlankProfile } from './store.jsx';
import { NAV } from './nav.js';
import { ToastProvider } from '../components/ui.jsx';
import { AccountProvider, fetchMe, loadUserState, saveUserState, signOut } from '../lib/account.jsx';
import { clearGuestState, loadGuestState, saveGuestState, takeGuestSyncRequest } from '../lib/guest.js';
import { setAiSignedIn } from '../lib/ai.js';
import { identify, resetAnalytics, track } from '../lib/analytics.js';
import { isBlankResume } from '../resume/model.js';

// before the user's settings load, use the theme they had last time (dark by default)
try {
  document.documentElement.dataset.theme = localStorage.getItem('monofolio:theme') || 'dark';
} catch {
  document.documentElement.dataset.theme = 'dark';
}

const AUTH_ROUTE = /^#\/?(signin|signup)/;
const APP_ROUTE = new RegExp(`^#/?(${NAV.flatMap((g) => g.items.map((i) => i.id)).join('|')})\\b`);
// signed out: the sign-in form for #/signin and #/signup, the app (as a guest) for its pages, the landing page otherwise
const outPage = () => (AUTH_ROUTE.test(window.location.hash) ? 'auth' : APP_ROUTE.test(window.location.hash) ? 'app' : 'landing');

// anything a guest would be sorry to lose
const hasWork = (s) => !!s && (!isBlankProfile(s.profile) || (s.resumes || []).some((r) => !isBlankResume(r.data)) || !!s.code?.html || (s.coverLetters || []).some((l) => (l.text || '').trim()));

// No account needed: signed out, the app runs as a guest with its data in this browser (lib/guest.js).
// Signed in → that user's own data, saved to their account; work done as a guest moves into it.
export default function Root() {
  const [session, setSession] = useState({ phase: 'loading' });
  const [out, setOut] = useState(outPage);
  useEffect(() => {
    const on = () => {
      const page = outPage();
      if (page !== 'auth') takeGuestSyncRequest(); // left the sign-in page without signing in — a later plain sign-in won't sync
      setOut(page);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const latestGuest = useRef(null); // the guest's newest state, so leaving for the sign-in page and coming back keeps it
  const asGuest = useCallback(async () => {
    latestGuest.current = await loadGuestState();
    setSession({ phase: 'out' });
  }, []);

  const enter = useCallback(
    async (user) => {
      try {
        let initial = await loadUserState(user);
        // guest work stays in the browser, apart from the account, unless they chose "Sign in to sync"
        const guest = takeGuestSyncRequest() ? loadGuestState() : null;
        let conflict = null;
        if (hasWork(guest)) {
          if (hasWork(initial)) conflict = guest; // the account has work too — let them pick (SyncChoice)
          else {
            initial = guest;
            saveUserState(user)(guest);
            clearGuestState();
          }
        }
        identify(user);
        setSession({ phase: 'in', user, initial, conflict, rev: 0 });
        if (outPage() !== 'app') window.location.hash = '/dashboard';
      } catch {
        await asGuest();
      }
    },
    [asGuest]
  );

  const boot = useCallback(async () => {
    setSession({ phase: 'loading' });
    try {
      const { user } = await fetchMe();
      if (user) await enter(user);
      else await asGuest();
    } catch {
      setSession({ phase: 'error' });
    }
  }, [enter, asGuest]);

  useEffect(() => {
    boot();
  }, [boot]);

  const user = session.user;
  useEffect(() => setAiSignedIn(!!user), [user]);
  const account = useMemo(
    () => ({
      user: user || null,
      signOut: async () => {
        await signOut(user);
        resetAnalytics();
        window.location.hash = '/';
        await asGuest();
      },
    }),
    [user, asGuest]
  );
  const onSave = useMemo(
    () =>
      user
        ? saveUserState(user)
        : (state) => {
            latestGuest.current = state;
            saveGuestState(state);
          },
    [user]
  );

  if (session.phase === 'loading') return <div className="boot" aria-label="Loading" />;
  if (session.phase === 'error')
    return (
      <div className="boot">
        <div className="boot-msg">
          <b>Can’t reach the server</b>
          <p>Check your connection and try again — or keep working without an account; it’s saved in this browser.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={boot}>
              Try again
            </button>
            <button className="btn secondary" onClick={() => ((window.location.hash = '/dashboard'), asGuest())}>
              Continue without an account
            </button>
          </div>
        </div>
      </div>
    );
  // "Sign in to sync" into an account that already has work: the guest's work replaces it, or stays in the browser
  const resolveSync = (useGuest) => {
    if (useGuest) {
      saveUserState(user)(session.conflict);
      clearGuestState();
      setSession((s) => ({ ...s, initial: s.conflict, conflict: null, rev: s.rev + 1 }));
    } else setSession((s) => ({ ...s, conflict: null }));
  };

  if (session.phase === 'out' && out === 'auth') return <Auth onSignedIn={enter} />;
  if (session.phase === 'out' && out === 'landing') return <Landing onStart={() => (track('started_building'), (window.location.hash = '/dashboard'))} />;
  return (
    <AccountProvider value={account}>
      <StoreProvider key={user ? `${user.id}:${session.rev}` : 'guest'} initial={user ? session.initial : latestGuest.current} onSave={onSave}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
      {user && session.conflict && <SyncChoice onChoose={resolveSync} />}
    </AccountProvider>
  );
}

function SyncChoice({ onChoose }) {
  return (
    <div className="ai-dialog" role="dialog" aria-modal="true" aria-label="Sync your guest work">
      <div className="ai-dialog-card card card-pad stack">
        <b>Your account already has work in it</b>
        <p className="hint">You also have work from guest mode in this browser. Which one do you want in your account?</p>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => onChoose(true)}>
            Use this browser’s work
          </button>
          <button className="btn secondary" onClick={() => onChoose(false)}>
            Keep my account’s work
          </button>
        </div>
        <p className="hint">“Use this browser’s work” replaces what’s in your account. “Keep my account’s work” leaves your guest work in this browser — you’ll see it again if you sign out.</p>
      </div>
    </div>
  );
}
