// Signed-in user + saving their data to the account (server) with a local copy for speed and offline use.
import { createContext, useContext, useEffect, useState } from 'react';

const cacheKey = (id) => `monofolio:u:${id}`;

async function call(url, { method = 'GET', body } = {}) {
  const r = await fetch(url, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  let data = {};
  try {
    data = await r.json();
  } catch {
    /* empty body */
  }
  if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status})`), { status: r.status });
  return data;
}

export const fetchMe = () => call('/api/auth/me');
export const signIn = (email, password) => call('/api/auth/signin', { method: 'POST', body: { email, password } });
export const signUp = (name, email, password) => call('/api/auth/signup', { method: 'POST', body: { name, email, password } });
export const tryDemo = () => call('/api/auth/demo', { method: 'POST' });
export const signOutRequest = () => call('/api/auth/signout', { method: 'POST' });

const readCache = (id) => {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(id)) || 'null');
  } catch {
    return null;
  }
};
const writeCache = (id, entry) => {
  try {
    localStorage.setItem(cacheKey(id), JSON.stringify(entry));
  } catch {
    /* storage full — the account copy is still saved */
  }
};

// The newest of the account copy and this browser's copy (e.g. after editing offline).
export async function loadUserState(user) {
  const local = readCache(user.id);
  let remote = null;
  try {
    remote = await call('/api/data');
  } catch (e) {
    if (e.status === 401) throw e;
  }
  const pick = (local?.savedAt || 0) > (remote?.savedAt || 0) ? local : remote;
  if (pick === local && local?.state) queueSave(user.id, local.state, local.savedAt);
  return pick?.state || null;
}

// ---------- saving (debounced, retried) ----------
let status = 'saved';
const listeners = new Set();
const setStatus = (s) => {
  status = s;
  listeners.forEach((fn) => fn(s));
};
let pending = null;
let timer = 0;
let inFlight = false;

async function flush() {
  if (!pending || inFlight) return;
  const { id, state, savedAt } = pending;
  pending = null;
  inFlight = true;
  setStatus('saving');
  try {
    await call('/api/data', { method: 'PUT', body: { state, savedAt } });
    setStatus(pending ? 'saving' : 'saved');
  } catch (e) {
    if (e.status === 413) setStatus('too-large');
    else {
      pending = pending || { id, state, savedAt }; // retry later
      setStatus('offline');
      clearTimeout(timer);
      timer = setTimeout(flush, 10000);
    }
  } finally {
    inFlight = false;
    if (pending) {
      clearTimeout(timer);
      timer = setTimeout(flush, 1200);
    }
  }
}

function queueSave(id, state, savedAt = Date.now()) {
  writeCache(id, { state, savedAt });
  pending = { id, state, savedAt };
  setStatus('saving');
  clearTimeout(timer);
  timer = setTimeout(flush, 1200);
}

export const saveUserState = (user) => (state) => queueSave(user.id, state);

// Sign out: send any unsaved changes first, then forget this browser's copy (shared computers).
export async function signOut(user) {
  clearTimeout(timer);
  await flush().catch(() => {});
  await signOutRequest().catch(() => {});
  try {
    if (status === 'saved') localStorage.removeItem(cacheKey(user.id)); // keep it if the last save didn't reach the server
    localStorage.removeItem('monofolio:jd'); // last pasted job description
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  // try to send the last changes when the tab is hidden or closed
  window.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  window.addEventListener('online', () => flush());
}

export function useSyncStatus() {
  const [s, setS] = useState(status);
  useEffect(() => {
    listeners.add(setS);
    return () => listeners.delete(setS);
  }, []);
  return s;
}

// ---------- context ----------
const AccountContext = createContext({ user: null, signOut: () => {} });
export const AccountProvider = AccountContext.Provider;
export const useAccount = () => useContext(AccountContext);
