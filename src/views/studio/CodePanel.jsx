import { useEffect, useRef, useState } from 'react';
import { Icon, Switch, downloadFile } from '../../components/ui.jsx';
import CodeEditor from '../../components/CodeEditor.jsx';
import { AiBuildStatus, AiComposer, AiBadge, useBuild, useAiOn } from '../../components/Ai.jsx';

// "Code" tool: edit the full HTML of the current portfolio and watch the preview update live.
export default function CodePanel({ generated, code, designFp, dispatch, toast, profile, blankProfile, full, onFull, themeName, onDownload }) {
  const api = useRef(null);
  const timer = useRef(null);
  const [stats, setStats] = useState({ lines: 0, kb: 0 });
  const started = !!code.html;
  const stale = started && code.fp && code.fp !== 'ai' && code.fp !== designFp;
  const aiOn = useAiOn();
  const [max, setMax] = useState(false); // the code editor alone fills the screen
  useEffect(() => {
    if (!max) return;
    const onKey = (e) => e.key === 'Escape' && setMax(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [max]);
  const build = useBuild();

  // Replace the editor's text from code (not from typing) — e.g. the AI streaming, or the code being
  // rebuilt after a colour/3D/theme change. Such updates must not count as the user editing by hand.
  const programmatic = useRef(false);
  const editorDoc = useRef(code.html);
  const setEditor = (html) => {
    if (!api.current || html === editorDoc.current) return;
    programmatic.current = true;
    api.current.set(html);
    programmatic.current = false;
  };

  // while the AI is writing, show its code in the editor as it arrives
  const lastSet = useRef(0);
  const lastLive = useRef(build.status === 'done' ? build.live : ''); // don't re-apply a finished build over later edits
  useEffect(() => {
    if (build.status !== 'running' && build.status !== 'done') return;
    if (!build.live || build.live === lastLive.current) return;
    const now = Date.now();
    if (build.status === 'running' && now - lastSet.current < 300) return;
    lastSet.current = now;
    lastLive.current = build.live;
    setEditor(build.live);
  }, [build.live, build.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // the code changed somewhere else (settings re-applied, undo, re-sync…) → show it
  useEffect(() => {
    if (build.status === 'running' || !code.html) return;
    clearTimeout(timer.current);
    setEditor(code.html);
  }, [code.html]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (html) => {
    editorDoc.current = html;
    setStats({ lines: html.split('\n').length, kb: Math.round(html.length / 1024) });
    if (programmatic.current) return; // not typed by the user; the store already has it
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // typing by hand detaches an AI-changed theme from the design settings (they can't merge with free edits)
      if (code.base === 'theme') toast('You edited the code by hand — Colours, 3D and other settings won’t update it any more (Re-sync to reconnect).');
      dispatch({ type: 'code/set', patch: { html, ...(code.base === 'theme' ? { base: 'manual', patches: [] } : {}) } });
    }, 450); // live preview after a short pause
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (code.html) setStats({ lines: code.html.split('\n').length, kb: Math.round(code.html.length / 1024) });
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    dispatch({ type: 'code/set', patch: { html: generated, active: true, fp: designFp, base: 'manual', patches: [] } });
    toast('Code copied into the editor — the preview now shows your code');
  };
  const resync = () => {
    if (!confirm('Replace the code with a fresh copy of your current design? Your code and AI changes will be lost.')) return;
    clearTimeout(timer.current);
    setEditor(generated);
    dispatch({ type: 'code/set', patch: { html: generated, active: true, fp: designFp, base: 'manual', patches: [], syncFailed: 0 } });
    toast('Code re-synced from your design');
  };
  const jump = (label, needles) => {
    if (!api.current || !needles.some((n) => api.current.jump(n))) toast(`No ${label} found`);
  };

  if (!started) {
    return (
      <div className="panel-body">
        {aiOn !== null && (
          <div className="ai-hero">
            <div className="ai-hero-head">
              <h3>Create or change your portfolio with AI</h3>
              <AiBadge />
            </div>
            <p className="hint">Ask the AI to change the {themeName || 'current'} theme you picked, or start a brand-new portfolio. Describe it, add an inspiration image (attach, drag in, or Ctrl+V), or both — you watch the code and the live preview update. Then keep asking for changes.</p>
            <AiComposer profile={profile} blankProfile={blankProfile} code={code} dispatch={dispatch} toast={toast} getThemeHtml={() => generated} themeName={themeName} />
            <AiBuildStatus dispatch={dispatch} toast={toast} />
          </div>
        )}
        <div className="card card-pad stack">
          <div className="row" style={{ gap: 12 }}>
            <span className="code-badge">
              <Icon name="code" />
            </span>
            <div>
              <h3 className="h3">{aiOn ? 'Or edit your current theme’s code' : 'Edit your portfolio’s code, live'}</h3>
              <p className="hint" style={{ marginTop: 4 }}>
                Copies the complete HTML of the portfolio you designed with Themes, Colours, Type and Motion into a code editor. Every change you type shows up in the live preview.
              </p>
            </div>
          </div>
          <button className={`btn ${aiOn ? 'secondary' : ''}`} style={{ justifySelf: 'start' }} onClick={start}>
            <Icon name="code" /> Start editing this portfolio’s code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`code-panel ${max ? 'max' : ''}`}>
      <div className="code-bar">
        <Switch checked={code.active} onChange={(v) => dispatch({ type: 'code/set', patch: { active: v } })} label={code.active ? 'Using my code' : 'Using the generated design'} />
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resync} title="Replace with a fresh copy of the current design">
          <Icon name="refresh" /> Re-sync
        </button>
        <button className="btn ghost sm" onClick={() => (onDownload ? onDownload() : downloadFile('index.html', code.html, 'text/html'))} title="Download index.html — exactly what the preview shows">
          <Icon name="download" />
        </button>
        <button className={`btn ${full ? 'secondary' : 'ghost'} sm`} onClick={() => onFull?.(!full)} title={full ? 'Exit full screen (Esc)' : 'Full screen: code and live preview side by side'}>
          <Icon name={full ? 'shrink' : 'expand'} /> {full ? 'Exit full screen' : 'Full screen'}
        </button>
      </div>
      {stale && (
        <div className="code-warn">
          You changed the design after copying the code. Those changes aren’t in your code yet —{' '}
          <button className="linklike" onClick={resync}>
            re-sync
          </button>{' '}
          to bring them in (this replaces your code edits).
        </div>
      )}
      {!code.active && <div className="code-warn">Your code is saved but switched off — the preview shows the generated design. Turn on “Using my code” to see it.</div>}
      {aiOn && (
        <div className="code-ai">
          <AiComposer profile={profile} blankProfile={blankProfile} code={code} dispatch={dispatch} toast={toast} compact />
          <AiBuildStatus dispatch={dispatch} toast={toast} compact />
        </div>
      )}
      <div className="code-jumps">
        <span>Jump to</span>
        <button onClick={() => jump('styles', ['<style>'])}>Styles</button>
        <button onClick={() => jump('content', ['<main', '<body'])}>Content</button>
        <button onClick={() => jump('hero', ['id="top"'])}>Hero</button>
        <button onClick={() => jump('projects', ['id="projects"'])}>Projects</button>
        <button onClick={() => jump('scripts', ['<script'])}>Scripts</button>
        <span className="spacer" />
        <span className="mono">
          {stats.lines} lines · {stats.kb} KB
        </span>
        <button className={`btn ${max ? 'secondary' : 'ghost'} sm`} onClick={() => setMax(!max)} title={max ? 'Back (Esc)' : 'Expand the code editor to the whole screen'}>
          <Icon name={max ? 'shrink' : 'expand'} /> {max ? 'Exit' : 'Expand'}
        </button>
      </div>
      <CodeEditor value={code.html} onChange={onChange} apiRef={api} />
      <div className="code-foot">
        <span className="dot-live" /> {code.active ? 'Live — preview updates as you type' : 'Preview is showing the generated design'}
        <span className="spacer" />
        <span>Ctrl+F search · Ctrl+Z undo · Ctrl+/ comment</span>
      </div>
    </div>
  );
}
