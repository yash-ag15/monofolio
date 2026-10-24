// "Bring your own key": the visitor's own AI key, called straight from their browser — the key is kept in this
// browser only and never sent to our server. Claude goes through Anthropic's SDK; the others all speak the
// OpenAI chat-completions format (each allows calls from web pages).
import Anthropic from '@anthropic-ai/sdk';

export const PROVIDERS = {
  anthropic: { name: 'Claude (Anthropic)', keyHint: 'sk-ant-…', keysUrl: 'https://console.anthropic.com/settings/keys', defaultModel: 'claude-opus-5-5' },
  openai: { name: 'OpenAI', keyHint: 'sk-…', keysUrl: 'https://platform.openai.com/api-keys', base: 'https://api.openai.com/v1', prefer: [/^gpt-5(?!.*(mini|nano|audio|realtime|image))/, /^gpt-4\.1$/, /^gpt-4o$/] },
  gemini: { name: 'Google Gemini', keyHint: 'AIza…', keysUrl: 'https://aistudio.google.com/apikey', base: 'https://generativelanguage.googleapis.com/v1beta/openai', prefer: [/gemini-[\d.]+-pro$/, /gemini-[\d.]+-flash$/] },
  xai: { name: 'Grok (xAI)', keyHint: 'xai-…', keysUrl: 'https://console.x.ai', base: 'https://api.x.ai/v1', prefer: [/^grok-4(?!.*(image|vision))/, /^grok-3$/] },
  groq: { name: 'Groq', keyHint: 'gsk_…', keysUrl: 'https://console.groq.com/keys', base: 'https://api.groq.com/openai/v1', prefer: [/^openai\/gpt-oss-120b$/, /llama-3\.3-70b/] },
  openrouter: { name: 'OpenRouter', keyHint: 'sk-or-…', keysUrl: 'https://openrouter.ai/keys', base: 'https://openrouter.ai/api/v1', defaultModel: 'openrouter/auto' },
};

export function detectProvider(key) {
  const k = String(key || '').trim();
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('sk-or-')) return 'openrouter';
  if (k.startsWith('xai-')) return 'xai';
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('sk-')) return 'openai';
  return '';
}

const claude = (key) => new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true }); // the visitor's own key, in their own browser

// what the provider says → a sentence the visitor can act on
function friendly(status, provider, detail = '') {
  const name = PROVIDERS[provider]?.name || 'the AI provider';
  if (status === 401 || status === 403) return `${name} rejected your API key — check it in AI settings.`;
  if (status === 404) return `${name} doesn’t know that model — pick another one in AI settings.`;
  if (status === 429) return `${name} says you’ve hit your rate limit or run out of credit — wait a minute or check your plan.`;
  if (status === 402) return `${name} says your account is out of credit.`;
  return `${name} returned an error${status ? ` (${status})` : ''}${detail ? `: ${detail}` : ''}.`;
}

/** Models this key can use (also checks the key works). */
export async function listModels({ provider, key }) {
  if (provider === 'anthropic') {
    try {
      const ids = [];
      for await (const m of claude(key).models.list()) ids.push(m.id);
      return ids;
    } catch (e) {
      throw new Error(friendly(e.status, provider));
    }
  }
  const r = await fetch(`${PROVIDERS[provider].base}/models`, { headers: { Authorization: `Bearer ${key}` } }).catch(() => null);
  if (!r) throw new Error(`Couldn’t reach ${PROVIDERS[provider].name} — check your connection.`);
  if (!r.ok) throw new Error(friendly(r.status, provider));
  const data = await r.json().catch(() => ({}));
  return (data.data || data.models || []).map((m) => String(m.id || m.name || '').replace(/^models\//, '')).filter(Boolean);
}

/** The model to use when the visitor hasn't picked one: the provider's default, else the best match in their list. */
export function pickModel(provider, ids = []) {
  const p = PROVIDERS[provider];
  if (p.defaultModel && (!ids.length || ids.includes(p.defaultModel))) return p.defaultModel;
  for (const re of p.prefer || []) {
    const hit = ids.filter((id) => re.test(id)).sort().reverse()[0];
    if (hit) return hit;
  }
  return ids[0] || p.defaultModel || '';
}

const dataUrlParts = (url) => {
  const m = String(url).match(/^data:([^;]+);base64,(.*)$/);
  return m ? { media_type: m[1], data: m[2] } : null;
};

/**
 * One request with the visitor's own key. Calls onText(fullTextSoFar) while streaming; resolves with
 * { text, truncated }.
 * @param {{provider: string, key: string, model: string}} cfg
 */
export async function ownKeyRequest(cfg, { system, user, images = [], temperature, maxTokens, json, onText, signal }) {
  const { provider, key, model } = cfg;
  if (provider === 'anthropic') {
    const content = [
      ...images.map((url) => {
        const img = dataUrlParts(url);
        return img ? { type: 'image', source: { type: 'base64', ...img } } : { type: 'image', source: { type: 'url', url } };
      }),
      { type: 'text', text: user },
    ];
    try {
      const stream = claude(key).beta.messages.stream(
        {
          model,
          max_tokens: json ? 16000 : 64000,
          system: json ? `${system}\n\nReply with the JSON object only.` : system,
          messages: [{ role: 'user', content }],
          output_config: { effort: json ? 'medium' : 'high' },
          // if a safety check declines, the API retries on a suitable fallback model in the same call
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        },
        { signal }
      );
      let text = '';
      stream.on('text', (delta) => {
        text += delta;
        onText?.(text);
      });
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') throw new Error('Claude declined this request — try rephrasing it.');
      return { text, truncated: msg.stop_reason === 'max_tokens' };
    } catch (e) {
      if (e.name === 'AbortError' || signal?.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
      if (e instanceof Anthropic.APIError) throw new Error(friendly(e.status, provider, e.message));
      throw e;
    }
  }

  // OpenAI-style providers
  const content = images.length ? [...images.map((url) => ({ type: 'image_url', image_url: { url } })), { type: 'text', text: user }] : user;
  const body = {
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content }],
    stream: true,
    ...(temperature != null ? { temperature } : {}),
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  };
  const send = (b) => fetch(`${PROVIDERS[provider].base}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(b), signal });
  let r;
  try {
    r = await send(body);
    // not every model accepts JSON mode or a token cap — retry once without them
    if (r.status === 400 && (body.response_format || body.max_tokens)) {
      const { response_format, max_tokens, ...rest } = body; // eslint-disable-line no-unused-vars
      r = await send(rest);
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error(`Couldn’t reach ${PROVIDERS[provider].name} — check your connection.`);
  }
  if (!r.ok || !r.body) {
    const err = await r.json().catch(() => null);
    throw new Error(friendly(r.status, provider, err?.error?.message || ''));
  }
  const reader = r.body.getReader();
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
        continue;
      }
      if (j.error) throw new Error(friendly(0, provider, j.error.message || ''));
      const c = j.choices?.[0];
      if (c?.delta?.content) {
        text += c.delta.content;
        onText?.(text);
      }
      if (c?.finish_reason) finish = c.finish_reason;
    }
  }
  return { text, truncated: finish === 'length' };
}
