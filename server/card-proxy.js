// Loads the GitHub README cards (stats, trophies, activity graph…) for the in-app README preview.
// Some ISPs' DNS can't resolve *.vercel.app, so in the browser those cards never load. GitHub itself
// fetches them from its own servers, so the README's real links stay as they are — this is only for the preview.
//
//   GET /api/card?u=<card image URL>  →  the image
//
// Only the card services in CARD_HOSTS are fetched (no open proxy); their addresses are looked up with public DNS
// first, falling back to the system resolver. Results are cached in memory for a while.
import https from 'node:https';
import dns from 'node:dns';
import { CARD_HOSTS } from '../src/readme/templates.js';

const MAX_BYTES = 2 * 1024 * 1024;
const TTL = 30 * 60 * 1000;
const cache = new Map(); // url → { at, type, body }

const resolver = new dns.promises.Resolver({ timeout: 4000, tries: 1 });
resolver.setServers(['1.1.1.1', '8.8.8.8']);
// http.request's `lookup` hook: public DNS, else whatever the system resolver says
function lookup(host, opts, cb) {
  resolver
    .resolve4(host)
    .then((ips) => (opts.all ? cb(null, ips.map((address) => ({ address, family: 4 }))) : cb(null, ips[0], 4)))
    .catch(() => dns.lookup(host, opts, cb));
}

const allowed = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && CARD_HOSTS.includes(url.hostname) ? url : null;
  } catch {
    return null;
  }
};

function get(url, hops = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { lookup, timeout: 15000, headers: { 'user-agent': 'Mozilla/5.0 (README preview)', accept: 'image/*' } }, (res) => {
      const next = res.headers.location && allowed(new URL(res.headers.location, url).href);
      if (res.statusCode >= 300 && res.statusCode < 400 && next && hops < 3) {
        res.resume();
        return resolve(get(next, hops + 1));
      }
      const type = String(res.headers['content-type'] || '');
      if (res.statusCode !== 200 || !type.startsWith('image/')) {
        res.resume();
        return reject(new Error(`card service answered ${res.statusCode}`));
      }
      const chunks = [];
      let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size > MAX_BYTES) req.destroy(new Error('card too large'));
        else chunks.push(c);
      });
      res.on('end', () => resolve({ type, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('card service timed out')));
    req.on('error', reject);
  });
}

export function createCardHandler() {
  return async function card(req, res, next) {
    if (!req.url.startsWith('/api/card')) return next();
    const url = allowed(new URL(req.url, 'http://x').searchParams.get('u') || '');
    if (req.method !== 'GET' || !url) {
      res.statusCode = 400;
      return res.end('Not a README card URL');
    }
    try {
      let hit = cache.get(url.href);
      if (!hit || Date.now() - hit.at > TTL) {
        hit = { at: Date.now(), ...(await get(url)) };
        cache.set(url.href, hit);
        if (cache.size > 300) cache.delete(cache.keys().next().value);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', hit.type);
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:"); // SVGs can't run scripts
      res.end(hit.body);
    } catch (e) {
      res.statusCode = 502;
      res.end(e.message || 'Card unavailable');
    }
  };
}
