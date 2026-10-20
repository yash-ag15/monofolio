import { useCallback, useEffect, useMemo, useState } from 'react';
import App from './App.jsx';
import Auth from './pages/Auth.jsx';
import Landing from './pages/Landing.jsx';
import LandingB from './pages/LandingB.jsx';
import { StoreProvider } from './store.jsx';
import { ToastProvider } from './components/ui.jsx';
import { AccountProvider, fetchMe, loadUserState, saveUserState, signOut } from './lib/account.jsx';

// before the user's settings load, use the theme they had last time (dark by default)
try {
  document.documentElement.dataset.theme = localStorage.getItem('monofolio:theme') || 'dark';
} catch {
  document.documentElement.dataset.theme = 'dark';
}

const AUTH_ROUTE = /^#\/?(signin|signup)/;
// signed out: which page to show — the sign-in form, landing page B (#/b, while comparing), or landing page A
const outPage = () => (AUTH_ROUTE.test(window.location.hash) ? 'auth' : /^#\/?b(\?|$)/.test(window.location.hash) ? 'b' : 'a');

// Signed out → sign in / sign up. Signed in → the app, with that user's own data.
export default function Root() {
  const [session, setSession] = useState({ phase: 'loading' });
  const [out, setOut] = useState(outPage);
  useEffect(() => {
    const on = () => setOut(outPage());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const enter = useCallback(async (user) => {
    try {
      const initial = await loadUserState(user);
      setSession({ phase: 'in', user, initial });
    } catch {
      setSession({ phase: 'out' });
    }
  }, []);

  const boot = useCallback(async () => {
    setSession({ phase: 'loading' });
    try {
      const { user } = await fetchMe();
      if (user) await enter(user);
      else setSession({ phase: 'out' });
    } catch {
      setSession({ phase: 'error' });
    }
  }, [enter]);

  useEffect(() => {
    boot();
  }, [boot]);

  const user = session.user;
  const account = useMemo(
    () => ({
      user,
      signOut: async () => {
        await signOut(user);
        window.location.hash = '/signin';
        setSession({ phase: 'out' });
      },
    }),
    [user]
  );
  const onSave = useMemo(() => (user ? saveUserState(user) : null), [user]);

  if (session.phase === 'loading') return <div className="boot" aria-label="Loading" />;
  if (session.phase === 'error')
    return (
      <div className="boot">
        <div className="boot-msg">
          <b>Can’t reach the server</b>
          <p>Check your connection and try again.</p>
          <button className="btn" onClick={boot}>
            Try again
          </button>
        </div>
      </div>
    );
  if (session.phase === 'out') return out === 'auth' ? <Auth onSignedIn={enter} /> : out === 'b' ? <LandingB /> : <Landing />;
  return (
    <AccountProvider value={account}>
      <StoreProvider key={user.id} initial={session.initial} onSave={onSave}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
    </AccountProvider>
  );
}
