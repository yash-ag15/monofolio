// Guest mode: no account needed — everything is saved in this browser's localStorage.
// localStorage holds about 5 MB per site; if a save doesn't fit (large photos, many resumes) we say so in the
// sidebar instead of failing silently. Signing in moves this work into the account (see Root.jsx).
import { useEffect, useState } from 'react';

const KEY = 'monofolio:guest';

export function loadGuestState() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

let status = 'saved'; // 'saved' | 'full' (didn't fit) | 'blocked' (storage switched off, e.g. some private windows)
const listeners = new Set();
const setStatus = (s) => {
  if (s === status) return;
  status = s;
  listeners.forEach((fn) => fn(s));
};

export function saveGuestState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    setStatus('saved');
  } catch (e) {
    setStatus(e?.name === 'QuotaExceededError' || /quota/i.test(e?.message || '') ? 'full' : 'blocked');
  }
}

export function clearGuestState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  setStatus('saved');
}

export function useGuestStatus() {
  const [s, setS] = useState(status);
  useEffect(() => {
    listeners.add(setS);
    return () => listeners.delete(setS);
  }, []);
  return s;
}

// "Sign in to sync" (as opposed to a plain sign-in) is the only way guest work moves into an account.
// sessionStorage keeps the request through the Google sign-in redirect, in this tab only.
const SYNC = 'monofolio:sync-guest';
export function requestGuestSync() {
  try {
    sessionStorage.setItem(SYNC, '1');
  } catch {
    /* ignore */
  }
  window.location.hash = '/signin';
}
export function takeGuestSyncRequest() {
  try {
    const asked = sessionStorage.getItem(SYNC) === '1';
    sessionStorage.removeItem(SYNC);
    return asked;
  } catch {
    return false;
  }
}
