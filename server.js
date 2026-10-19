// Production server: serves the built app (dist/) and the Grok gateway with the owner's key.
//   npm run build
//   XAI_API_KEY=... npm start          (PORT defaults to 3000)
// Works on any Node 18+ host (Render, Railway, Fly, a VPS…). No dependencies.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGrokHandler } from './server/grok-proxy.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const env = { ...process.env };
// also read .env.local / .env when present (simple KEY=value lines)
for (const f of ['.env', '.env.local']) {
  try {
    fs.readFileSync(f, 'utf8')
      .split(/\r?\n/)
      .forEach((l) => {
        const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
      });
  } catch {
    /* no file */
  }
}
const grok = createGrokHandler(env);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };

http
  .createServer((req, res) => {
    if (req.url.startsWith('/api/')) return grok(req, res);
    let p = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(root, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(root)) {
      res.statusCode = 403;
      return res.end();
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(env.PORT || 3000), () => console.log(`Monofolio on http://localhost:${env.PORT || 3000}  (AI ${env.AI_API_KEY || env.GROQ_API_KEY || env.XAI_API_KEY ? 'on' : 'off — set XAI_API_KEY'})`));
