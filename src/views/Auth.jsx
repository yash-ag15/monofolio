import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { signIn, signUp } from '../lib/account.jsx';
import { HeroStage } from './Landing.jsx';

const GOOGLE_ERRORS = {
  google: 'Google sign-in didn’t work. Please try again, or use your email.',
  'google-off': 'Google sign-in isn’t available yet — please use your email for now.',
};

const modeFromHash = () => (/^#\/?signup/.test(window.location.hash) ? 'signup' : 'signin');

// 0–4: length, letters + numbers, mixed case, symbol
function strength(pw) {
  if (!pw) return 0;
  let s = pw.length >= 8 ? 1 : 0;
  if (s && /[a-z]/i.test(pw) && /\d/.test(pw)) s++;
  if (s && /[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (s && /[^a-z0-9]/i.test(pw)) s++;
  return s;
}
const STRENGTH = ['Too short', 'Okay', 'Good', 'Strong', 'Very strong'];

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

function Field({ icon, label, children, aside }) {
  return (
    <label className="au-field">
      <span className="au-label">
        {label}
        {aside}
      </span>
      <span className="au-input">
        <Icon name={icon} size={16} />
        {children}
      </span>
    </label>
  );
}

export default function Auth({ onSignedIn }) {
  const [mode, setMode] = useState(modeFromHash);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() => GOOGLE_ERRORS[new URLSearchParams(window.location.hash.split('?')[1] || '').get('error')] || '');
  const [shake, setShake] = useState(0);
  const firstRef = useRef(null);
  const signup = mode === 'signup';
  const pw = strength(password);

  useEffect(() => {
    const on = () => setMode(modeFromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    firstRef.current?.focus();
  }, [mode]);

  const switchTo = (m) => {
    if (m === mode) return;
    setError('');
    window.location.hash = m === 'signup' ? '/signup' : '/signin';
  };
  const fail = (msg) => {
    setError(msg);
    setShake((n) => n + 1);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (signup && !name.trim()) return fail('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail('Please enter a valid email address.');
    if (signup && password.length < 8) return fail('Use at least 8 characters for your password.');
    if (!signup && !password) return fail('Please enter your password.');
    setBusy(true);
    try {
      const { user } = signup ? await signUp(name.trim(), email.trim(), password) : await signIn(email.trim(), password);
      window.location.hash = '/dashboard';
      onSignedIn(user);
    } catch (err) {
      fail(err.message || 'Something went wrong — please try again.');
      setBusy(false);
    }
  };
  const capsCheck = (e) => setCaps(!!e.getModifierState?.('CapsLock'));

  return (
    <div className="au">
      <aside className="au-side">
        <a className="logo au-logo" href="#/">
          <div className="logo-mark" aria-hidden="true">
            <i />
            <i />
          </div>
          Monofolio
        </a>
        <div className="au-art">
          <HeroStage />
        </div>
        <div className="au-side-copy">
          <h2>
            One profile.
            <br />
            Your whole job kit.
          </h2>
          <p>Portfolio site, resume, ATS check, cover letters, README and dev card — all from the details you enter once.</p>
        </div>
      </aside>

      <main className="au-main">
        <div className="au-top">
          <a className="logo au-mobile-logo" href="#/">
            <div className="logo-mark" aria-hidden="true">
              <i />
              <i />
            </div>
            Monofolio
          </a>
          <a className="au-back" href="#/">
            <Icon name="chevron" size={13} /> Back to home
          </a>
        </div>

        <div className="au-card">
          <div className="au-switch" role="tablist">
            <span className={`au-switch-pill ${signup ? 'right' : ''}`} aria-hidden="true" />
            <button type="button" role="tab" aria-selected={!signup} className={!signup ? 'on' : ''} onClick={() => switchTo('signin')}>
              Sign in
            </button>
            <button type="button" role="tab" aria-selected={signup} className={signup ? 'on' : ''} onClick={() => switchTo('signup')}>
              Create account
            </button>
          </div>

          <div className="au-head" key={mode}>
            <h1>{signup ? 'Start building your kit' : 'Welcome back'}</h1>
            <p>{signup ? 'Free for students. Takes less than a minute.' : 'Sign in to pick up where you left off.'}</p>
          </div>

          <a className="au-google" href="/api/auth/google">
            <GoogleLogo /> {signup ? 'Sign up with Google' : 'Continue with Google'}
          </a>
          <div className="au-or">
            <span>or with email</span>
          </div>

          <form onSubmit={submit} className={`au-form ${shake ? 'shake' : ''}`} key={`f${shake}`} noValidate>
            {signup && (
              <Field icon="user" label="Your name">
                <input ref={firstRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" autoComplete="name" />
              </Field>
            )}
            <Field icon="mail" label="Email">
              <input ref={signup ? undefined : firstRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="email" />
            </Field>
            <Field icon="lock" label="Password" aside={caps && <em className="au-caps">Caps Lock is on</em>}>
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyUp={capsCheck} onKeyDown={capsCheck} placeholder={signup ? 'At least 8 characters' : 'Your password'} autoComplete={signup ? 'new-password' : 'current-password'} />
              <button type="button" className="au-eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? 'Hide' : 'Show'}
              </button>
            </Field>
            {signup && password && (
              <div className={`au-meter s${pw}`} aria-live="polite">
                <div>
                  {[1, 2, 3, 4].map((n) => (
                    <i key={n} className={pw >= n ? 'on' : ''} />
                  ))}
                </div>
                <span>{STRENGTH[pw]}</span>
              </div>
            )}
            {error && (
              <div className="au-error" role="alert">
                <Icon name="alert" size={15} /> <span>{error}</span>
              </div>
            )}
            <button className="btn au-submit" disabled={busy}>
              {busy && <span className="au-spin" aria-hidden="true" />}
              {busy ? (signup ? 'Creating your account…' : 'Signing in…') : signup ? 'Create account' : 'Sign in'}
              {!busy && <Icon name="chevron" size={14} />}
            </button>
          </form>

          <p className="au-note">Your profile and work are private to your account.</p>
        </div>
      </main>
    </div>
  );
}
