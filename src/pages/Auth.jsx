import { useEffect, useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { signIn, signUp, tryDemo } from '../lib/account.jsx';

const FEATURES = [
  { icon: 'layout', title: 'A portfolio site, built for you', text: 'Pick a theme or describe the look — AI writes the code.' },
  { icon: 'file', title: 'Resumes that pass ATS', text: 'Clean templates, an ATS score and job-specific tailoring.' },
  { icon: 'mail', title: 'Cover letters, README & dev card', text: 'Everything else you need to apply, from one profile.' },
];

const GOOGLE_ERRORS = {
  google: 'Google sign-in didn’t work. Please try again, or use your email.',
  'google-off': 'Google sign-in isn’t available yet — please use your email for now.',
};

const modeFromHash = () => (/^#\/?signup/.test(window.location.hash) ? 'signup' : 'signin');

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Auth({ onSignedIn, demo }) {
  const [mode, setMode] = useState(modeFromHash);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() => GOOGLE_ERRORS[new URLSearchParams(window.location.hash.split('?')[1] || '').get('error')] || '');
  const signup = mode === 'signup';

  useEffect(() => {
    const on = () => setMode(modeFromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const switchMode = () => {
    setError('');
    window.location.hash = signup ? '/signin' : '/signup';
  };

  const startDemo = async () => {
    setError('');
    setBusy(true);
    try {
      const { user } = await tryDemo();
      window.location.hash = '/dashboard';
      onSignedIn(user);
    } catch (err) {
      setError(err.message || 'The demo isn’t available right now.');
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (signup && !name.trim()) return setError('Please enter your name.');
    if (signup && password.length < 8) return setError('Use at least 8 characters for your password.');
    setBusy(true);
    try {
      const { user } = signup ? await signUp(name.trim(), email.trim(), password) : await signIn(email.trim(), password);
      window.location.hash = '/dashboard';
      onSignedIn(user);
    } catch (err) {
      setError(err.message || 'Something went wrong — please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-side">
        <div className="logo">
          <div className="logo-mark" aria-hidden="true">
            <i />
            <i />
          </div>
          Monofolio
        </div>
        <div className="auth-pitch">
          <span className="auth-eyebrow">For college developers</span>
          <h2>Get job-ready, all in one place.</h2>
          <p>Fill in your details once. Turn them into a portfolio, resume, cover letters and more.</p>
          <ul className="auth-features">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span className="auth-feature-icon">
                  <Icon name={f.icon} />
                </span>
                <div>
                  <b>{f.title}</b>
                  <span>{f.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-foot">Free to use · Your data stays private to your account</div>
      </aside>

      <main className="auth-main">
        <div className="auth-card" key={mode}>
          <div className="logo auth-mobile-logo">
            <div className="logo-mark" aria-hidden="true">
              <i />
              <i />
            </div>
            Monofolio
          </div>
          <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="auth-sub">{signup ? 'Free, and it takes less than a minute.' : 'Sign in to continue where you left off.'}</p>

          <a className="auth-google" href="/api/auth/google">
            <GoogleLogo /> Continue with Google
          </a>
          <div className="auth-or">
            <span>or {signup ? 'sign up' : 'sign in'} with email</span>
          </div>

          <form onSubmit={submit} className="auth-form" noValidate>
            {signup && (
              <label className="field">
                <span>Your name</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" autoComplete="name" autoFocus />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email" autoFocus={!signup} required />
            </label>
            <label className="field">
              <span>Password</span>
              <div className="auth-pass">
                <input className="input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? 'At least 8 characters' : 'Your password'} autoComplete={signup ? 'new-password' : 'current-password'} required />
                <button type="button" className="auth-eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            {error && (
              <div className="auth-error" role="alert">
                <Icon name="alert" size={15} /> {error}
              </div>
            )}
            <button className="btn auth-submit" disabled={busy}>
              {busy ? (signup ? 'Creating your account…' : 'Signing in…') : signup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {demo && (
            <div className="auth-demo">
              <div>
                <b>Just looking?</b>
                <span>
                  Explore with sample data — no sign-up. Or sign in with <code>{demo.email}</code> / <code>{demo.password}</code>
                </span>
              </div>
              <button type="button" className="btn secondary sm" onClick={startDemo} disabled={busy}>
                <Icon name="sparkle" /> Try the demo
              </button>
            </div>
          )}

          <p className="auth-switch">
            {signup ? 'Already have an account?' : 'New to Monofolio?'}{' '}
            <button type="button" className="linklike" onClick={switchMode}>
              {signup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
