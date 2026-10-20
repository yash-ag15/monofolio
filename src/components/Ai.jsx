import { useEffect, useRef, useState } from 'react';
import { Icon, Seg } from './ui.jsx';
import { grokStatus, loadGrokStatus, onGrokStatus } from '../lib/grok.js';
import { cancelBuild, clearBuild, getBuild, startBuild, subscribeBuild } from '../lib/ai-builder.js';
import { grokReview } from '../resume/grok-review.js';
import { analyzeImage, readImageFile, readImageUrl } from '../lib/inspire.js';

// null while checking, then true / false — the server decides (it holds the owner's key)
export function useGrokOn() {
  const [on, setOn] = useState(() => grokStatus()?.enabled ?? null);
  useEffect(() => {
    loadGrokStatus().then((s) => setOn(s.enabled));
    return onGrokStatus((s) => setOn(s.enabled));
  }, []);
  return on;
}

export function GrokBadge() {
  const on = useGrokOn();
  if (on === null) return null;
  return on ? (
    <span className="grok-badge on" title="AI enabled">
      <i /> AI
    </span>
  ) : (
    <span className="grok-badge">AI unavailable</span>
  );
}

// What visitors see when AI is off. The setup steps are shown only to the site owner in dev mode.
export function GrokSetup() {
  return (
    <div className="grok-setup">
      <b>AI features are unavailable right now</b>
      <p>Everything else still works — the offline tools on this page don’t need AI.</p>
      {process.env.NODE_ENV !== 'production' && (
        <p>
          <i>Owner setup (only shown in dev):</i> add <code>XAI_API_KEY=your-key</code> to <code>.env.local</code> and restart <code>npm run dev</code>. For the live site run <code>npm start</code> with the same variable. Users never enter a key.
        </p>
      )}
    </div>
  );
}

// Runs an async Grok call with loading / error / cancel handling.
function useGrok() {
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
  <div className="grok-thinking">
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
  const on = useGrokOn();
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
  if (!on) return <GrokSetup />;
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
export function GrokReviewCard({ text, jd, onCopy }) {
  const on = useGrokOn();
  const [review, setReview] = useState(null);
  const g = useGrok();
  const go = async () => {
    const r = await g.run((signal) => grokReview({ text, jd, signal }));
    if (r) setReview(r);
  };
  return (
    <section className="r-card grok-review" id="r-grok">
      <div className="r-head">
        <div>
          <h3>
            Recruiter review <GrokBadge />
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
        <GrokSetup />
      ) : g.busy ? (
        <Thinking label="Reading your resume like a recruiter…" onCancel={g.cancel} />
      ) : !review ? (
        <button className="btn" style={{ marginTop: 16 }} onClick={go}>
          <Icon name="sparkle" /> Get AI review
        </button>
      ) : null}
      {g.error && <div className="contrast bad" style={{ marginTop: 12 }}>{g.error}</div>}
      {review && (
        <div className="grok-review-body">
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
