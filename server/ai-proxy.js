// Server-side AI gateway (Groq or xAI Grok — chosen from the key). The site owner's key lives here (env AI_API_KEY) and is
// never sent to the browser — visitors only send their prompt / image / resume text.
// Mounted by server/api.js, which the Next.js API route (pages/api/[...path].js) runs for every /api request.
//
//   GET  /api/ai/status → { enabled, model }
//   POST /api/ai/chat   → { messages, temperature?, json?, vision?, stream?, maxTokens? }  →  xAI chat completion
//
// Guards, because every call is billed to the owner: POST only, one fixed endpoint, the model is
// chosen here (not by the browser), capped output tokens, a body-size limit and per-IP rate limits.

const MAX_BODY = 6 * 1024 * 1024; // a downscaled image is ~100–400 KB; 6 MB is plenty
const MAX_TOKENS = 4000; // JSON answers
const MAX_CODE_TOKENS = 20000; // a complete portfolio page

export function createAiHandler(env = process.env) {
  // Works with xAI (Grok, keys "xai-…") or Groq (keys "gsk_…") — both speak the OpenAI chat API.
  const key = String(env.AI_API_KEY || env.GROQ_API_KEY || env.XAI_API_KEY || '')
    .trim()
    .replace(/^=+/, '');
  const groq = key.startsWith('gsk_');
  const base = (env.AI_BASE_URL || env.XAI_BASE_URL || (groq ? 'https://api.groq.com/openai' : 'https://api.x.ai')).replace(/\/$/, '');
  const model = env.AI_MODEL || env.XAI_MODEL || (groq ? 'openai/gpt-oss-120b' : 'grok-4');
  const visionModel = env.AI_VISION_MODEL || env.XAI_VISION_MODEL || (groq ? 'qwen/qwen3.8-27b' : model);
  const perMinute = Number(env.AI_RATE_PER_MINUTE || env.GROK_RATE_PER_MINUTE || 6);
  const perDay = Number(env.AI_RATE_PER_DAY || env.GROK_RATE_PER_DAY || 60);
  const hits = new Map(); // ip → timestamps (ms)

  const send = (res, status, obj) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(obj));
  };
  const limited = (ip) => {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter((t) => now - t < 86400000);
    hits.set(ip, list);
    if (list.filter((t) => now - t < 60000).length >= perMinute) return 'Too many AI requests — please wait a minute.';
    if (list.length >= perDay) return 'Daily AI limit reached — try again tomorrow.';
    list.push(now);
    if (hits.size > 5000) hits.delete(hits.keys().next().value); // keep memory bounded
    return '';
  };
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) {
          reject(Object.assign(new Error('Request too large'), { status: 413 }));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });

  // Call the provider. If it says "rate limited, try again in N seconds" and N is short (free plans
  // allow only a few thousand tokens per minute), wait and retry instead of failing the visitor.
  const MAX_WAIT_MS = 65000; // free plans can ask for ~45s; the visitor sees a countdown meanwhile
  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    });
  const retryAfterMs = async (r) => {
    const h = Number(r.headers.get('retry-after'));
    if (h > 0) return h * 1000;
    const t = await r.clone().text().catch(() => '');
    const m = t.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
    return m ? (Number(m[1] || 0) * 60 + Number(m[2])) * 1000 : 0;
  };
  async function upstream(body, signal, onWait) {
    let shrunk = false;
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(`${base}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(body), signal });
      // "Request too large … Limit 8000, Requested 8415": the reply budget counts toward a per-minute cap,
      // so shrink it by the overshoot and try once more (only matters on small plans)
      if (r.status === 413 || r.status === 429) {
        const t = await r.clone().text().catch(() => '');
        if (/too large/i.test(t)) {
          // waiting won't help — only a smaller request can succeed
          const m = t.match(/Limit (\d+), Requested (\d+)/i);
          const next = m && !shrunk ? body.max_tokens - (Number(m[2]) - Number(m[1])) - 300 : 0;
          if (next >= 500) {
            console.warn(`[ai] request too large for the plan — retrying with max_tokens ${next}`);
            body = { ...body, max_tokens: next };
            shrunk = true;
            continue;
          }
          return r;
        }
      }
      if (r.status !== 429 || attempt >= 3) return r;
      const wait = await retryAfterMs(r);
      if (!wait || wait > MAX_WAIT_MS) return r;
      console.warn(`[ai] rate limited — retrying in ${(wait / 1000).toFixed(1)}s`);
      onWait?.(wait);
      await sleep(wait + 500, signal);
    }
  }

  return async function aiHandler(req, res, next) {
    const url = (req.url || '').split('?')[0];
    if (url === '/api/ai/status') return send(res, 200, { enabled: !!key, model });
    if (url !== '/api/ai/chat') return next ? next() : send(res, 404, { error: 'Not found' });
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
    if (!key) return send(res, 503, { error: 'AI features are not available right now.' });

    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '?').split(',')[0].trim();
    const lim = limited(ip);
    if (lim) return send(res, 429, { error: lim });

    let input;
    try {
      input = JSON.parse(await readBody(req));
    } catch (e) {
      return send(res, e.status || 400, { error: e.status === 413 ? 'That image is too large.' : 'Bad request' });
    }
    const messages = Array.isArray(input.messages) ? input.messages.slice(0, 4) : null;
    if (!messages?.length) return send(res, 400, { error: 'Bad request' });

    const body = {
      model: input.vision ? visionModel : model,
      messages,
      temperature: Math.min(1.2, Math.max(0, Number(input.temperature ?? 0.6))),
      // whole-page code needs more room than a JSON answer, but never more than the cap
      max_tokens: Math.min(MAX_CODE_TOKENS, Math.max(256, Number(input.maxTokens) || MAX_TOKENS)),
      ...(input.json ? { response_format: { type: 'json_object' } } : {}),
    };

    // streaming: pass xAI's server-sent events straight through so code appears as it is written
    if (input.stream) {
      const ctrl = new AbortController();
      res.on('close', () => ctrl.abort());
      const openStream = () => {
        if (res.headersSent) return;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-transform'); // no-transform: Next.js must not compress (= buffer) the stream
        res.setHeader('X-Accel-Buffering', 'no');
      };
      // errors after the stream has started are sent as an event the browser understands
      const fail = (status, error) => {
        if (!res.headersSent) return send(res, status, { error });
        res.write(`data: ${JSON.stringify({ error })}\n\n`);
        res.end();
      };
      try {
        // while we wait for rate-limit capacity, tell the visitor how long
        const onWait = (ms) => {
          openStream();
          res.write(`data: ${JSON.stringify({ wait: Math.ceil(ms / 1000) })}\n\n`);
        };
        const r = await upstream({ ...body, stream: true }, ctrl.signal, onWait);
        if (!r.ok || !r.body) {
          const t = await r.text().catch(() => '');
          console.error(`[ai] ${r.status} ${t.slice(0, 500)}`);
          const tooLarge = /too large/i.test(t);
          return fail(r.status === 429 && !tooLarge ? 429 : 502, tooLarge ? 'This request is too big for the AI plan’s limits — try a shorter request.' : r.status === 429 ? 'The AI is busy right now — try again in a minute.' : 'The AI request failed — try again.');
        }
        openStream();
        for await (const chunk of r.body) res.write(chunk);
        return res.end();
      } catch (e) {
        if (ctrl.signal.aborted) return; // visitor cancelled
        console.error('[ai] stream error', e.message);
        return fail(502, 'Couldn’t reach the AI service — try again.');
      }
    }
    try {
      let r = await upstream(body);
      // some models don't accept response_format — retry once without it
      if (r.status === 400 && body.response_format) {
        const t = await r.text();
        if (/response_format|json/i.test(t)) {
          delete body.response_format;
          r = await upstream(body);
        } else return send(res, 400, { error: 'The AI request was rejected.', detail: t.slice(0, 300) });
      }
      const text = await r.text();
      if (!r.ok) {
        // log the real reason for the owner; give visitors a plain message
        console.error(`[ai] ${r.status} ${text.slice(0, 500)}`);
        const msg = r.status === 429 ? 'The AI is busy right now — try again in a minute.' : r.status === 401 || r.status === 403 ? 'AI features are not available right now.' : 'The AI request failed — try again.';
        return send(res, r.status === 429 ? 429 : 502, { error: msg });
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(text);
    } catch (e) {
      console.error('[ai] upstream error', e.message);
      send(res, 502, { error: 'Couldn’t reach the AI service — try again.' });
    }
  };
}
