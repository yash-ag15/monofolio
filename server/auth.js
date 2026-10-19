// Accounts: email + password sign-up / sign-in, Google sign-in (OAuth 2.0), and each user's saved data.
// Used by the Vite dev server (vite.config.js) and by the production server (server.js).
//
//   GET  /api/auth/me              → { user | null, google }
//   POST /api/auth/signup          → { name, email, password }
//   POST /api/auth/signin          → { email, password }
//   POST /api/auth/signout
//   POST /api/auth/demo            → signs in to a fresh, temporary demo account (sample data, kept 24 h)
//   GET  /api/auth/google          → redirects to Google
//   GET  /api/auth/google/callback → back from Google, signs in, redirects to the app
//   GET  /api/data                 → { state, savedAt } for the signed-in user
//   PUT  /api/data                 → { state, savedAt }
//
// Storage: Neon Postgres when DATABASE_URL is set, otherwise JSON files in DATA_DIR — see store.js.
// Sessions: an httpOnly cookie signed with AUTH_SECRET (generated and kept in DATA_DIR if not set).
// Google: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (and APP_URL in production) — see .env.example.
// Demo: on by default (DEMO_ENABLED=false turns it off). The demo login is DEMO_EMAIL / DEMO_PASSWORD.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createStore } from './store.js';

const MAX_AUTH_BODY = 16 * 1024;
const MAX_DATA_BODY = 15 * 1024 * 1024; // portfolio code, photos and 3D models can be large
const SESSION_DAYS = 30;
const COOKIE = 'mf_session';
const STATE_COOKIE = 'mf_oauth';

export function createAuth(env = process.env) {
  const dir = path.resolve(env.DATA_DIR || 'data');

  const secret = (() => {
    if (env.AUTH_SECRET) return env.AUTH_SECRET;
    const f = path.join(dir, '.secret');
    try {
      return fs.readFileSync(f, 'utf8').trim();
    } catch {
      const s = crypto.randomBytes(32).toString('hex');
      try {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(f, s, { mode: 0o600 });
      } catch {
        // read-only hosting (e.g. Vercel): sign-ins won't survive a restart until AUTH_SECRET is set
        console.warn('[accounts] AUTH_SECRET is not set — set it in your hosting environment variables');
      }
      return s;
    }
  })();
  const googleId = String(env.GOOGLE_CLIENT_ID || '').trim();
  const googleSecret = String(env.GOOGLE_CLIENT_SECRET || '').trim();
  const google = !!(googleId && googleSecret);
  const demoOn = String(env.DEMO_ENABLED || 'true') !== 'false';
  const demoEmail = String(env.DEMO_EMAIL || 'demo@monofolio.app').trim().toLowerCase();
  const demoPassword = String(env.DEMO_PASSWORD || 'demo1234');
  const DEMO_HOURS = 24;

  // ---------- storage ----------
  const db = createStore(env);
  const ready = db.init().then(
    () => console.log(`[accounts] saving accounts in ${db.kind === 'neon' ? 'the Neon database' : `files in ${dir}`}`),
    (e) => console.error('[accounts] could not set up the database:', e.message)
  );
  const publicUser = (u) => u && { id: u.id, name: u.name, email: u.demo ? demoEmail : u.email, avatar: u.avatar || '', google: !!u.googleSub, demo: !!u.demo, created: u.created };
  // signed-in users are looked up on every request; keep them briefly in memory to spare the database
  const cache = new Map();
  const cached = async (id) => {
    const hit = cache.get(id);
    if (hit && Date.now() - hit.at < 60000) return hit.u;
    const u = await db.byId(id);
    cache.set(id, { u, at: Date.now() });
    if (cache.size > 2000) cache.delete(cache.keys().next().value);
    return u;
  };

  // ---------- passwords ----------
  const hash = (password, salt = crypto.randomBytes(16).toString('hex')) => `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
  const verify = (password, stored) => {
    const [salt, h] = String(stored || '').split(':');
    if (!salt || !h) return false;
    const a = Buffer.from(h, 'hex');
    const b = crypto.scryptSync(password, salt, 64);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  };

  // ---------- signed cookies ----------
  const sign = (value) => `${value}.${crypto.createHmac('sha256', secret).update(value).digest('base64url')}`;
  const unsign = (signed) => {
    const i = String(signed || '').lastIndexOf('.');
    if (i < 1) return null;
    const value = signed.slice(0, i);
    const a = Buffer.from(signed.slice(i + 1));
    const b = Buffer.from(sign(value).slice(i + 1));
    return a.length === b.length && crypto.timingSafeEqual(a, b) ? value : null;
  };
  const cookies = (req) =>
    Object.fromEntries(
      String(req.headers.cookie || '')
        .split(';')
        .map((c) => c.trim().split('='))
        .filter((p) => p[0])
        .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
    );
  const secure = (req) => String(req.headers['x-forwarded-proto'] || '').includes('https') || !!req.socket?.encrypted;
  const setCookie = (req, res, name, value, maxAge) => {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
    if (secure(req)) parts.push('Secure');
    const prev = res.getHeader('Set-Cookie');
    res.setHeader('Set-Cookie', [...(Array.isArray(prev) ? prev : prev ? [prev] : []), parts.join('; ')]);
  };
  const startSession = (req, res, user) => {
    const days = user.demo ? DEMO_HOURS / 24 : SESSION_DAYS;
    const payload = Buffer.from(JSON.stringify({ u: user.id, v: user.sv || 0, e: Date.now() + days * 86400000 })).toString('base64url');
    setCookie(req, res, COOKIE, sign(payload), Math.round(days * 86400));
  };
  const userFrom = async (req) => {
    const value = unsign(cookies(req)[COOKIE]);
    if (!value) return null;
    try {
      const s = JSON.parse(Buffer.from(value, 'base64url').toString());
      if (!(s.e > Date.now())) return null;
      await ready;
      const u = await cached(s.u);
      return u && (u.sv || 0) === s.v ? u : null;
    } catch {
      return null;
    }
  };

  // ---------- helpers ----------
  const send = (res, status, obj) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(obj));
  };
  const redirect = (res, to) => {
    res.statusCode = 302;
    res.setHeader('Location', to);
    res.setHeader('Cache-Control', 'no-store');
    res.end();
  };
  const readBody = (req, max) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > max) {
          reject(Object.assign(new Error('too large'), { status: 413 }));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  const json = async (req, max = MAX_AUTH_BODY) => {
    try {
      return JSON.parse((await readBody(req, max)) || '{}');
    } catch (e) {
      if (e.status) throw e;
      throw Object.assign(new Error('Bad request'), { status: 400 });
    }
  };
  // blocks other sites from posting to us with the user's cookie
  const sameOrigin = (req) => {
    const o = req.headers.origin;
    if (!o) return true;
    try {
      return new URL(o).host === req.headers.host;
    } catch {
      return false;
    }
  };
  const appUrl = (req) => (env.APP_URL ? env.APP_URL.replace(/\/$/, '') : `${secure(req) ? 'https' : 'http'}://${req.headers.host}`);
  const ip = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '?').split(',')[0].trim();
  const attempts = new Map(); // ip → timestamps, slows down password guessing
  const tooMany = (req) => {
    const now = Date.now();
    const list = (attempts.get(ip(req)) || []).filter((t) => now - t < 10 * 60000);
    list.push(now);
    attempts.set(ip(req), list);
    if (attempts.size > 5000) attempts.delete(attempts.keys().next().value);
    return list.length > 20;
  };
  const cleanEmail = (e) => String(e || '').trim().toLowerCase();
  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200;
  const newId = () => crypto.randomBytes(12).toString('base64url');

  // ---------- demo ----------
  // old demo accounts (and their saved data) are removed after DEMO_HOURS
  const purgeDemos = () => db.purgeDemos(DEMO_HOURS * 3600000).catch((e) => console.warn('[accounts] demo clean-up failed:', e.message));
  ready.then(purgeDemos);
  const startDemo = async (req, res) => {
    purgeDemos();
    const id = newId();
    const u = { id, email: `demo-${id}@demo.invalid`, name: 'Demo account', demo: true, created: Date.now() };
    await db.insert(u, 'demo');
    await db.recordLogin(id, 'demo');
    startSession(req, res, u);
    return send(res, 200, { user: publicUser(u) });
  };

  // ---------- Google ----------
  const googleStart = (req, res) => {
    if (!google) return redirect(res, '/#/signin?error=google-off');
    const state = crypto.randomBytes(16).toString('base64url');
    setCookie(req, res, STATE_COOKIE, sign(state), 600);
    const q = new URLSearchParams({
      client_id: googleId,
      redirect_uri: `${appUrl(req)}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    redirect(res, `https://accounts.google.com/o/oauth2/v2/auth?${q}`);
  };
  const googleBack = async (req, res, url) => {
    const fail = (why) => {
      console.warn('[auth] Google sign-in failed:', why);
      redirect(res, '/#/signin?error=google');
    };
    const q = url.searchParams;
    const expected = unsign(cookies(req)[STATE_COOKIE]);
    setCookie(req, res, STATE_COOKIE, '', 0);
    if (q.get('error')) return redirect(res, '/#/signin');
    if (!google || !q.get('code') || !expected || expected !== q.get('state')) return fail('state mismatch');
    try {
      const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code: q.get('code'), client_id: googleId, client_secret: googleSecret, redirect_uri: `${appUrl(req)}/api/auth/google/callback`, grant_type: 'authorization_code' }),
      });
      const tok = await r.json();
      if (!r.ok || !tok.id_token) return fail(tok.error_description || tok.error || r.status);
      // the ID token comes straight from Google over TLS, so its claims can be read directly
      const claims = JSON.parse(Buffer.from(tok.id_token.split('.')[1], 'base64url').toString());
      if (claims.aud !== googleId || !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || claims.exp * 1000 < Date.now()) return fail('bad token');
      if (!claims.email || claims.email_verified === false) return fail('email not verified');
      const email = cleanEmail(claims.email);
      await ready;
      let u = (await db.byGoogle(claims.sub)) || (await db.byEmail(email));
      if (u) {
        // an email account signing in with Google for the first time gets linked to it
        const patch = { googleSub: claims.sub, avatar: !u.avatar && claims.picture ? claims.picture : null, name: !u.name && claims.name ? claims.name : null };
        await db.update(u.id, patch);
        cache.delete(u.id);
      } else {
        u = { id: newId(), email, name: claims.name || email.split('@')[0], avatar: claims.picture || '', googleSub: claims.sub, created: Date.now() };
        await db.insert(u, 'google');
      }
      await db.recordLogin(u.id, 'google');
      startSession(req, res, u);
      redirect(res, '/#/dashboard');
    } catch (e) {
      fail(e.message);
    }
  };

  // ---------- handler ----------
  async function handler(req, res, next) {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    if (!p.startsWith('/api/auth/') && p !== '/api/data') return next ? next() : send(res, 404, { error: 'Not found' });
    try {
      if (p === '/api/auth/me' && req.method === 'GET') return send(res, 200, { user: publicUser(await userFrom(req)), google, demo: demoOn ? { email: demoEmail, password: demoPassword } : null });
      if (p === '/api/auth/google' && req.method === 'GET') return googleStart(req, res);
      if (p === '/api/auth/google/callback' && req.method === 'GET') return await googleBack(req, res, url);
      if (req.method !== 'GET' && !sameOrigin(req)) return send(res, 403, { error: 'Cross-site request blocked' });
      await ready;

      if (p === '/api/auth/signup' && req.method === 'POST') {
        if (tooMany(req)) return send(res, 429, { error: 'Too many attempts — please wait a few minutes.' });
        const b = await json(req);
        const email = cleanEmail(b.email);
        const name = String(b.name || '').trim().slice(0, 80);
        const password = String(b.password || '');
        if (!name) return send(res, 400, { error: 'Please enter your name.' });
        if (!validEmail(email)) return send(res, 400, { error: 'Please enter a valid email address.' });
        if (password.length < 8) return send(res, 400, { error: 'Use at least 8 characters for your password.' });
        if (password.length > 200) return send(res, 400, { error: 'That password is too long.' });
        if (demoOn && email === demoEmail) return send(res, 400, { error: 'That email is used for the demo — please use your own email.' });
        const existing = await db.byEmail(email);
        if (existing) return send(res, 409, { error: existing.pass ? 'An account with this email already exists — sign in instead.' : 'This email is linked to Google — use “Continue with Google”.' });
        const u = { id: newId(), email, name, pass: hash(password), created: Date.now() };
        await db.insert(u, 'email');
        await db.recordLogin(u.id, 'email');
        startSession(req, res, u);
        return send(res, 200, { user: publicUser(u) });
      }
      if (p === '/api/auth/signin' && req.method === 'POST') {
        if (tooMany(req)) return send(res, 429, { error: 'Too many attempts — please wait a few minutes.' });
        const b = await json(req);
        if (demoOn && cleanEmail(b.email) === demoEmail && String(b.password || '') === demoPassword) return startDemo(req, res);
        const u = await db.byEmail(cleanEmail(b.email));
        if (u && !u.pass && u.googleSub) return send(res, 400, { error: 'This account uses Google — click “Continue with Google”.' });
        if (!u || !verify(String(b.password || ''), u.pass)) return send(res, 401, { error: 'Email or password is incorrect.' });
        await db.recordLogin(u.id, 'email');
        startSession(req, res, u);
        return send(res, 200, { user: publicUser(u) });
      }
      if (p === '/api/auth/demo' && req.method === 'POST') {
        if (!demoOn) return send(res, 404, { error: 'The demo is turned off.' });
        if (tooMany(req)) return send(res, 429, { error: 'Too many attempts — please wait a few minutes.' });
        return startDemo(req, res);
      }
      if (p === '/api/auth/signout' && req.method === 'POST') {
        setCookie(req, res, COOKIE, '', 0);
        return send(res, 200, { ok: true });
      }

      if (p === '/api/data') {
        const u = await userFrom(req);
        if (!u) return send(res, 401, { error: 'Please sign in.' });
        if (req.method === 'GET') return send(res, 200, (await db.getData(u.id)) || { state: null, savedAt: 0 });
        if (req.method === 'PUT') {
          const b = await json(req, MAX_DATA_BODY);
          if (!b.state || typeof b.state !== 'object') return send(res, 400, { error: 'Nothing to save.' });
          const savedAt = Number(b.savedAt) || Date.now();
          await db.putData(u.id, b.state, savedAt);
          return send(res, 200, { ok: true, savedAt });
        }
      }
      return send(res, 404, { error: 'Not found' });
    } catch (e) {
      if (!e.status) console.error('[accounts]', e.message);
      return send(res, e.status || 500, { error: e.status === 413 ? 'Your data is too large to save (remove big images or 3D models).' : e.status ? e.message : 'Something went wrong — please try again.' });
    }
  }

  return { handler, userFrom };
}
