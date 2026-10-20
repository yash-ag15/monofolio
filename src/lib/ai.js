// AI client (Groq or xAI Grok, chosen on the server). Calls our own server at /api/ai/*, which holds the site owner's API key
// (see server/ai-proxy.js). Visitors never provide or see a key — they just send a prompt or image.

let status = null; // { enabled, model } once known
let pending = null;
const listeners = new Set();

export function loadAiStatus() {
  if (status) return Promise.resolve(status);
  if (!pending)
    pending = fetch('/api/ai/status')
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .catch(() => ({ enabled: false }))
      .then((s) => {
        status = { enabled: !!s.enabled, model: s.model || '' };
        if (!status.enabled && process.env.NODE_ENV !== 'production') console.info(`[ai] off — ${AI_SETUP_HINT}`);
        listeners.forEach((fn) => fn(status));
        return status;
      });
  return pending;
}
export const aiStatus = () => status;
export const onAiStatus = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// shown to the site owner only (dev builds)
export const AI_SETUP_HINT = 'Add XAI_API_KEY=your-key to .env.local in the project folder and restart npm run dev.';

// Pull the first JSON object out of a reply (models sometimes wrap it in ```json fences).
export function extractJson(text) {
  const t = String(text || '').trim();
  try {
    return JSON.parse(t);
  } catch {
    /* fall through */
  }
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      /* fall through */
    }
  }
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error('The AI replied in an unexpected format — please try again.');
}

/**
 * Ask the AI for a JSON object.
 * @param {{system: string, user: string, images?: string[], temperature?: number, signal?: AbortSignal}} o
 */
export async function aiJSON({ system, user, images = [], temperature = 0.6, maxTokens, signal }) {
  const content = images.length ? [...images.map((url) => ({ type: 'image_url', image_url: { url, detail: 'high' } })), { type: 'text', text: user }] : user;
  let res;
  try {
    res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: system }, { role: 'user', content }], temperature, json: true, vision: images.length > 0, ...(maxTokens ? { maxTokens } : {}) }),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('Couldn’t reach the AI service — check your connection and try again.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'The AI request failed — try again.');
  const text = data?.choices?.[0]?.message?.content;
  return extractJson(Array.isArray(text) ? text.map((p) => p.text || '').join('') : text);
}

/**
 * Stream plain text from the AI; onText(fullTextSoFar) is called as pieces arrive.
 * Resolves with the complete text.
 */
export async function aiStream({ system, user, images = [], temperature = 0.7, maxTokens = 16000, onText, onWait, signal }) {
  const content = images.length ? [...images.map((url) => ({ type: 'image_url', image_url: { url, detail: 'high' } })), { type: 'text', text: user }] : user;
  let res;
  try {
    res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: system }, { role: 'user', content }], temperature, stream: true, maxTokens, vision: images.length > 0 }),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('Couldn’t reach the AI service — check your connection and try again.');
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'The AI request failed — try again.');
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let text = '';
  let finish = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith('data:')) continue;
      const payload = l.slice(5).trim();
      if (payload === '[DONE]') continue;
      let j;
      try {
        j = JSON.parse(payload);
      } catch {
        continue; // partial or keep-alive line
      }
      if (j.error) throw new Error(typeof j.error === 'string' ? j.error : 'The AI request failed — try again.');
      if (j.wait) {
        onWait?.(j.wait); // our server is waiting for rate-limit capacity
        continue;
      }
      {
        const c = j.choices?.[0];
        if (c?.delta?.content) {
          text += c.delta.content;
          onText?.(text);
        }
        if (c?.finish_reason) finish = c.finish_reason;
      }
    }
  }
  return { text, truncated: finish === 'length' };
}

// Shrink an image (data URL or same-origin URL) to a JPEG data URL the AI can read quickly.
export function imageForAi(src, max = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * s));
      c.height = Math.max(1, Math.round(img.naturalHeight * s));
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      try {
        resolve(c.toDataURL('image/jpeg', 0.85));
      } catch {
        reject(new Error('This image can’t be sent to the AI (the site blocks it). Download it and upload the file instead.'));
      }
    };
    img.onerror = () => reject(new Error('Couldn’t load the image.'));
    img.src = src;
  });
}
