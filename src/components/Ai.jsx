import { useEffect, useRef, useState } from 'react';
import { Icon, Seg } from './ui.jsx';
import { aiStatus, getOwnKey, loadAiStatus, onAiStatus, setOwnKey } from '../lib/ai.js';
import { PROVIDERS, detectProvider, listModels, pickModel } from '../lib/ai-providers.js';
import { cancelBuild, clearBuild, getBuild, startBuild, subscribeBuild } from '../lib/ai-builder.js';
import { aiReview } from '../resume/ai-review.js';
import { analyzeImage, readImageFile, readImageUrl } from '../lib/image-traits.js';

// null while checking, then the status from lib/ai.js: { enabled, source: 'own' | 'server' | null, provider, model, … }
export function useAiStatus() {
  const [s, setS] = useState(() => aiStatus());
  useEffect(() => {
    loadAiStatus().then(setS);
    return onAiStatus(setS);
  }, []);
  return s;
}
export const useAiOn = () => useAiStatus()?.enabled ?? null;

// Said next to every key field, so nobody wonders whether we keep their key.
function KeyPrivacy() {
  return (
    <p className="ai-key-privacy">
      <Icon name="check" size={14} />
      <span>
        <b>We don’t store your key.</b> It never reaches our servers — it stays only in this browser on your device, and AI requests go directly from your browser to the provider. Only you can access it, and <i>Remove key</i> deletes it.
      </span>
    </p>
  );
}

// Paste your own key (Claude, OpenAI, Gemini, Grok, Groq, OpenRouter): we check it, list its models, keep it in this browser.
export function AiKeyForm({ onDone }) {
  const saved = getOwnKey();
  const [key, setKey] = useState('');
  const [provider, setProvider] = useState('');
  const [models, setModels] = useState(saved ? [saved.model] : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chosen = provider || detectProvider(key);
  const p = PROVIDERS[chosen];

  const save = async () => {
    const k = key.trim();
    if (!chosen) return setError('Couldn’t tell which provider this key is for — choose it from the list.');
    setBusy(true);
    setError('');
    try {
      const ids = await listModels({ provider: chosen, key: k }); // also proves the key works
      const model = pickModel(chosen, ids);
      setModels(ids.length ? ids : [model]);
      setOwnKey({ provider: chosen, key: k, model });
      setKey('');
      setProvider('');
      onDone?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const loadModels = async () => {
    setBusy(true);
    setError('');
    try {
      setModels(await listModels(saved));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (saved)
    return (
      <div className="ai-key">
        <div className="ai-key-row">
          <span className="ai-key-who">
            <Icon name="check" size={15} /> Using your {PROVIDERS[saved.provider].name} key
          </span>
          <button type="button" className="btn ghost sm" onClick={() => (setOwnKey(null), setModels([]))}>
            Remove key
          </button>
        </div>
        <label className="ai-key-field">
          <span>Model</span>
          <select value={saved.model} onChange={(e) => setOwnKey({ ...saved, model: e.target.value })}>
            {[...new Set([saved.model, ...models])].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        {models.length <= 1 && (
          <button type="button" className="btn ghost sm" style={{ justifySelf: 'start' }} disabled={busy} onClick={loadModels}>
            {busy ? 'Loading…' : 'Show all models for this key'}
          </button>
        )}
        {error && <em className="pi-err">{error}</em>}
        <KeyPrivacy />
      </div>
    );

  return (
    <form className="ai-key" onSubmit={(e) => (e.preventDefault(), save())}>
      <div className="ai-key-row">
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={p ? `Paste your ${p.name} key (${p.keyHint})` : 'Paste an API key — Claude, OpenAI, Gemini, Grok, Groq or OpenRouter'}
          value={key}
          onChange={(e) => (setKey(e.target.value), setError(''))}
          aria-label="API key"
        />
        <select value={chosen} onChange={(e) => setProvider(e.target.value)} aria-label="Provider">
          <option value="">Provider…</option>
          {Object.entries(PROVIDERS).map(([id, x]) => (
            <option key={id} value={id}>
              {x.name}
            </option>
          ))}
        </select>
        <button className="btn sm" disabled={busy || !key.trim()}>
          {busy ? 'Checking…' : 'Save key'}
        </button>
      </div>
      {error && <em className="pi-err">{error}</em>}
      <KeyPrivacy />
      <span className="hint">
        Usage is billed to your own account with the provider.
        {p && (
          <>
            {' '}
            <a href={p.keysUrl} target="_blank" rel="noreferrer">
              Get a {p.name} key
            </a>
          </>
        )}
      </span>
    </form>
  );
}

function AiKeyDialog({ onClose }) {
  const s = useAiStatus();
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="ai-dialog" role="dialog" aria-modal="true" aria-label="AI settings" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ai-dialog-card card card-pad stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b>AI settings</b>
          <button className="btn ghost icon" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        {s?.source === 'server' && (
          <p className="hint">
            You’re using Monofolio’s built-in AI, which has a daily limit. Add your own key to use the model you like with no limit from us — you can switch back any time with <i>Remove key</i>.
          </p>
        )}
        {s && !s.enabled && <p className="hint">Add a key to turn on the AI features: portfolio builder, resume review, tailoring and cover letters.</p>}
        <AiKeyForm onDone={onClose} />
      </div>
    </div>
  );
}

// Shows where AI comes from; click to add, change or remove your own key.
export function AiBadge() {
  const s = useAiStatus();
  const [open, setOpen] = useState(false);
  if (!s) return null;
  const label = s.source === 'own' ? `AI · ${PROVIDERS[s.provider].name.replace(/ \(.*\)$/, '')}` : s.enabled ? 'AI · Built-in' : 'Add AI key';
  return (
    <>
      <button type="button" className={`ai-badge ${s.enabled ? 'on' : ''}`} title={s.enabled ? `AI settings — model: ${s.model}` : 'Use AI with your own API key'} onClick={() => setOpen(true)}>
        {s.enabled && <i />} {label}
      </button>
      {s.source === 'server' && (
        <button type="button" className="linklike small ai-own-link" onClick={() => setOpen(true)}>
          Use your own key
        </button>
      )}
      {open && <AiKeyDialog onClose={() => setOpen(false)} />}
    </>
  );
}

// What visitors see when AI is off: add their own key, or sign in to use the site's.
export function AiSetup() {
  const s = useAiStatus();
  return (
    <div className="ai-setup">
      <b>Use AI with your own API key</b>
      <p>Paste a key from Claude, OpenAI, Gemini, Grok, Groq or OpenRouter. Everything else on this page works without AI.</p>
      <AiKeyForm />
      {s?.serverEnabled && !s.signedIn && (
        <p>
          No key? <a href="#/signin">Sign in</a> to use Monofolio’s built-in AI (with a daily limit).
        </p>
      )}
      {process.env.NODE_ENV !== 'production' && !s?.serverEnabled && (
        <p>
          <i>Owner setup (only shown in dev):</i> add <code>AI_API_KEY=your-key</code> to <code>.env.local</code> and restart <code>npm run dev</code> to give signed-in users the site’s own AI.
        </p>
      )}
    </div>
  );
}

// Runs an async AI call with loading / error / cancel handling.
function useAi() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ctrl = useRef(null);
  const run = async (fn) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setBusy(true);
    setError('');
    try {
      return await fn(c.signal);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'The AI request failed.');
      return null;
    } finally {
      if (ctrl.current === c) setBusy(false);
    }
  };
  const cancel = () => {
    ctrl.current?.abort();
    setBusy(false);
  };
  return { busy, error, run, cancel };
}

const Thinking = ({ label, onCancel }) => (
  <div className="ai-thinking">
    <span className="dots">
      <i />
      <i />
      <i />
    </span>
    {label}
    <span className="spacer" />
    <button className="btn ghost sm" onClick={onCancel}>
      Cancel
    </button>
  </div>
);

// ---------- AI portfolio builder (the AI tab in the Studio) ----------
export function useBuild() {
  const [b, setB] = useState(getBuild);
  useEffect(() => subscribeBuild(setB), []);
  return b;
}

const kb = (s) => `${(s.length / 1024).toFixed(1)} KB`;

// Live status of the background build: progress, stop, restore.
export function AiBuildStatus({ dispatch, onViewCode, toast, compact }) {
  const b = useBuild();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (b.status !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [b.status]);
  if (b.status === 'idle' && !b.note) return null;
  const restore = () => {
    dispatch({ type: 'code/set', patch: b.previous ? { html: b.previous, active: true, ...(b.previousMeta || {}) } : { active: false, base: '', patches: [] } });
    toast?.(b.previous ? 'Previous code restored' : 'Back to your theme design');
    clearBuild();
  };
  const what = b.kind === 'edit' ? 'Applying your change' : b.kind === 'image' ? 'Building your portfolio from the image' : 'Building your portfolio';
  return (
    <div className={`ai-status ${b.status}${compact ? ' compact' : ''}`}>
      {b.status === 'running' && (
        <>
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <div className="ai-status-text">
            <b>{what}…</b>
            <span>
              {b.live ? `${kb(b.live)} of code written` : b.progress ? b.progress : b.phase === 'looking' ? 'Studying your image' : b.kind === 'edit' ? 'Working out the change' : 'Thinking about the design'} · {Math.round((now - (b.startedAt || now)) / 1000)}s · the preview updates as it goes
            </span>
          </div>
          {onViewCode && (
            <button className="btn ghost sm" onClick={onViewCode}>
              <Icon name="code" /> Watch code
            </button>
          )}
          <button className="btn secondary sm" onClick={cancelBuild}>
            Stop
          </button>
        </>
      )}
      {b.status === 'done' && (
        <>
          <span className="st st-pass">
            <Icon name="check" />
          </span>
          <div className="ai-status-text">
            <b>{b.kind === 'edit' ? 'Change applied' : 'Your portfolio is ready'}</b>
            <span>{b.note || 'Shown in the preview. Edit the code freely, or describe another change.'}</span>
          </div>
          {onViewCode && (
            <button className="btn ghost sm" onClick={onViewCode}>
              <Icon name="code" /> View code
            </button>
          )}
          <button className="btn ghost sm" onClick={restore} title="Undo this AI build">
            <Icon name="undo" /> Undo
          </button>
        </>
      )}
      {b.status === 'error' && (
        <>
          <span className="st st-fail">
            <Icon name="x" />
          </span>
          <div className="ai-status-text">
            <b>Couldn’t build that</b>
            <span>{b.error}</span>
          </div>
        </>
      )}
      {b.status === 'idle' && b.note && (
        <div className="ai-status-text">
          <span>{b.note}</span>
        </div>
      )}
    </div>
  );
}

// The one AI input: a prompt and/or an inspiration image (attach, drag in, or Ctrl+V paste).
// Creates a new portfolio, or changes the current one.
const EXAMPLES = [
  'Minimal black & white with a 3D wireframe globe and a bento grid for projects',
  'Retro terminal look — green on black, typing animation, commands as navigation',
  'Editorial magazine style with big serif headlines and lots of white space',
  'Playful and colourful with bouncy animations and sticker-like project cards',
];
const CHANGE_EXAMPLES = ['Make it darker with a glowing gradient hero', 'Add a timeline for my experience', 'Bigger project cards with a hover tilt', 'Use a serif font for headings'];

export function AiComposer({ profile, blankProfile, code, dispatch, toast, compact, getThemeHtml, themeName }) {
  const on = useAiOn();
  const b = useBuild();
  const [text, setText] = useState('');
  const [img, setImg] = useState(null); // { src, name, traits }
  const [reading, setReading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const hasCode = !!code?.html && code.active;
  // no code yet → the AI can still change the theme the user picked
  const canTheme = !hasCode && !!getThemeHtml;
  const canEdit = hasCode || canTheme;
  const [mode, setMode] = useState(canEdit ? 'edit' : 'new');
  useEffect(() => {
    setMode(canEdit ? 'edit' : 'new'); // by default, prompts change what the user already has
  }, [canEdit]);
  if (on === null) return null;
  if (!on) return <AiSetup />;
  const busy = b.status === 'running';

  const attach = async (load, name) => {
    setReading(true);
    try {
      const src = await load();
      let traits = null;
      try {
        traits = await analyzeImage(src);
      } catch {
        /* colours are a bonus — the AI still sees the image */
      }
      setImg({ src, name, traits });
    } catch (e) {
      toast?.(e.message || 'Couldn’t read that image');
    } finally {
      setReading(false);
    }
  };
  const attachFile = (file) => file && /^image\//.test(file.type) && attach(() => readImageFile(file), file.name || 'Pasted image');
  const onPaste = (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) {
      e.preventDefault();
      attachFile(item.getAsFile());
      return;
    }
    const t = e.clipboardData?.getData('text') || '';
    if (/^https?:\/\/\S+\.(png|jpe?g|webp|gif|avif)(\?\S*)?$/i.test(t.trim())) {
      e.preventDefault();
      attach(() => readImageUrl(t.trim()), 'Image link');
    }
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = [...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith('image/'));
    if (file) return attachFile(file);
    const html = e.dataTransfer?.getData('text/html') || '';
    const src = (html.match(/<img[^>]+src="([^"]+)"/i) || [])[1] || e.dataTransfer?.getData('text/uri-list');
    if (src && /^https?:/i.test(src)) attach(() => readImageUrl(src.split('\n')[0]), 'Dropped image');
  };

  const canSend = !busy && !reading && (text.trim() || img);
  const send = () => {
    if (!canSend) return;
    if (blankProfile) {
      toast('Add your details in Dev Identity first — AI builds your portfolio from them');
      window.location.hash = '/profile';
      return;
    }
    const edit = mode === 'edit' && canEdit;
    const prompt = text.trim() || (edit ? 'Restyle my portfolio to match the attached image.' : '');
    startBuild({
      dispatch,
      profile,
      prompt,
      image: img?.src,
      traits: img?.traits,
      currentHtml: edit ? (hasCode ? code.html : getThemeHtml()) : '',
      // a theme (or a theme the AI already changed) keeps following the user's settings
      theme: edit && (!hasCode || code.base === 'theme') ? themeName || 'current' : '',
      patches: edit && hasCode && code.base === 'theme' ? code.patches || [] : [],
      previousHtml: hasCode ? code.html : '',
      previousMeta: hasCode ? { base: code.base || 'manual', patches: code.patches || [], syncFailed: code.syncFailed || 0 } : null,
    });
    setText('');
    setImg(null);
  };
  const examples = mode === 'edit' ? CHANGE_EXAMPLES : EXAMPLES;
  const dropProps = {
    onDragOver: (e) => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop,
  };
  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        attachFile(e.target.files[0]);
        e.target.value = '';
      }}
    />
  );

  // slim one-line bar above the code editor, so the editor keeps most of the height
  if (compact) {
    return (
      <div className="ai-bar">
        <div className={`composer slim ${drag ? 'drag' : ''}`} {...dropProps}>
          {(img || reading) && (
            <span className="slim-attach" title={img?.name}>
              {img ? <img src={img.src} alt="" /> : <span className="attach-skel" />}
              {img && (
                <button onClick={() => setImg(null)} aria-label="Remove image">
                  ×
                </button>
              )}
            </span>
          )}
          <textarea
            className="composer-input slim"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={mode === 'edit' && hasCode ? 'Ask AI to change this portfolio… (Ctrl+V an image to restyle)' : 'Describe a new portfolio… (Ctrl+V an image for inspiration)'}
          />
          <button className="btn ghost icon" onClick={() => fileRef.current?.click()} disabled={busy} title="Add an image">
            <Icon name="image" />
          </button>
          <button className="btn sm" onClick={send} disabled={!canSend} title="Enter">
            <Icon name="sparkle" /> {busy ? '…' : mode === 'edit' && hasCode ? 'Apply' : 'Build'}
          </button>
          {fileInput}
        </div>
        {hasCode && (
          <button className="linklike ai-mode" onClick={() => setMode(mode === 'edit' ? 'new' : 'edit')}>
            {mode === 'edit' ? 'Start a new portfolio instead' : '← Change the current one instead'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="ai-box">
      {canEdit && <Seg value={mode} onChange={setMode} options={[{ value: 'edit', label: hasCode ? 'Change this portfolio' : `Change my ${themeName || 'current'} theme` }, { value: 'new', label: 'Start a new one' }]} />}
      <div className={`composer ${drag ? 'drag' : ''}`} {...dropProps}>
        {(img || reading) && (
          <div className="attach">
            {img ? <img src={img.src} alt="" /> : <span className="attach-skel" />}
            <span>
              <b>{reading ? 'Reading image…' : img.name}</b>
              <small>{reading ? '' : mode === 'edit' ? 'Your portfolio will be restyled to match it' : 'Inspiration — the AI copies its style, not its text'}</small>
            </span>
            {img && (
              <button className="btn ghost icon" onClick={() => setImg(null)} aria-label="Remove image">
                <Icon name="x" />
              </button>
            )}
          </div>
        )}
        <textarea
          className="composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={3}
          placeholder={mode === 'edit' ? (hasCode ? 'Describe a change… or attach an image to restyle it' : `What should change in your ${themeName || 'current'} theme? e.g. “dark with a purple accent and a timeline” — or attach an image to restyle it`) : 'Describe the portfolio you want, attach an inspiration image, or both…'}
        />
        <div className="composer-foot">
          <button className="btn ghost sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Icon name="image" /> {img ? 'Change image' : 'Add image'}
          </button>
          <span className="hint">Paste with Ctrl+V or drop it here</span>
          <span className="spacer" />
          <button className="btn sm" onClick={send} disabled={!canSend}>
            <Icon name="sparkle" /> {busy ? 'Building…' : mode === 'edit' && canEdit ? 'Apply change' : 'Build my portfolio'}
          </button>
          {fileInput}
        </div>
      </div>
      {!text && !img && !busy && (
        <div className="chips">
          {examples.map((ex) => (
            <button key={ex} className="chip" onClick={() => setText(ex)}>
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- ATS page ----------
export function AiReviewCard({ text, jd, onCopy }) {
  const on = useAiOn();
  const [review, setReview] = useState(null);
  const g = useAi();
  const go = async () => {
    const r = await g.run((signal) => aiReview({ text, jd, signal }));
    if (r) setReview(r);
  };
  return (
    <section className="r-card ai-review" id="r-ai">
      <div className="r-head">
        <div>
          <h3>
            Recruiter review <AiBadge />
          </h3>
          <p>An AI second opinion: how a recruiter in your field would read this resume{jd ? ' for this job' : ''}, with rewritten bullets. Your resume text{jd ? ' and the job post' : ''} is sent to our AI provider.</p>
        </div>
        {review && (
          <div className="r-score">
            <b>
              {review.score}
              <small>/100</small>
            </b>
            <span className="hint">shortlist chance</span>
          </div>
        )}
      </div>
      {on === null ? null : !on ? (
        <AiSetup />
      ) : g.busy ? (
        <Thinking label="Reading your resume like a recruiter…" onCancel={g.cancel} />
      ) : !review ? (
        <button className="btn" style={{ marginTop: 16 }} onClick={go}>
          <Icon name="sparkle" /> Get AI review
        </button>
      ) : null}
      {g.error && <div className="contrast bad" style={{ marginTop: 12 }}>{g.error}</div>}
      {review && (
        <div className="ai-review-body">
          <p className="verdict">
            “{review.verdict}”{review.field && <span> · {review.field}</span>}
          </p>
          {review.redFlags.length > 0 && (
            <div className="rv-block">
              <h4>Red flags</h4>
              {review.redFlags.map((x) => (
                <div key={x} className="rv-line">
                  <span className="st st-fail">
                    <Icon name="x" />
                  </span>
                  {x}
                </div>
              ))}
            </div>
          )}
          <div className="rv-cols">
            <div className="rv-block">
              <h4>Strengths</h4>
              {review.strengths.map((x) => (
                <div key={x} className="rv-line">
                  <span className="st st-pass">
                    <Icon name="check" />
                  </span>
                  {x}
                </div>
              ))}
            </div>
            <div className="rv-block">
              <h4>Improve</h4>
              {review.improvements.map((x) => (
                <div key={x.issue} className="rv-line">
                  <span className="st st-warn">
                    <Icon name="alert" />
                  </span>
                  <span>
                    <b>{x.issue}</b> {x.fix && <em>— {x.fix}</em>}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {review.rewrites.length > 0 && (
            <div className="rv-block">
              <h4>Bullet rewrites</h4>
              <p className="hint">Placeholders like [X%] are for you to fill with your real numbers.</p>
              {review.rewrites.map((x, i) => (
                <div key={i} className="rewrite">
                  {x.original && <div className="before">{x.original}</div>}
                  <div className="after">
                    <span>{x.improved}</span>
                    <button className="btn ghost sm" onClick={() => onCopy(x.improved)} title="Copy">
                      <Icon name="copy" />
                    </button>
                  </div>
                  {x.why && <small>{x.why}</small>}
                </div>
              ))}
            </div>
          )}
          {review.missingKeywords.length > 0 && (
            <div className="rv-block">
              <h4>Keywords to consider</h4>
              <div className="chips">
                {review.missingKeywords.map((k) => (
                  <span key={k} className="kw miss">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button className="passed-toggle" onClick={go}>
            <Icon name="refresh" /> Ask again
          </button>
        </div>
      )}
    </section>
  );
}
