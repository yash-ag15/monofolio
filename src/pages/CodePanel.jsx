import { useEffect, useRef, useState } from 'react';
import { Icon, Switch, downloadFile } from '../components/ui.jsx';
import CodeEditor from '../components/CodeEditor.jsx';

// "Code" tool: edit the full HTML of the current portfolio and watch the preview update live.
export default function CodePanel({ generated, code, designFp, dispatch, toast }) {
  const api = useRef(null);
  const timer = useRef(null);
  const [stats, setStats] = useState({ lines: 0, kb: 0 });
  const started = !!code.html;
  const stale = started && code.fp && code.fp !== designFp;

  const save = (html) => dispatch({ type: 'code/set', patch: { html } });
  const onChange = (html) => {
    setStats({ lines: html.split('\n').length, kb: Math.round(html.length / 1024) });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(html), 450); // live preview after a short pause
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (code.html) setStats({ lines: code.html.split('\n').length, kb: Math.round(code.html.length / 1024) });
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    dispatch({ type: 'code/set', patch: { html: generated, active: true, fp: designFp } });
    toast('Code copied into the editor — the preview now shows your code');
  };
  const resync = () => {
    if (!confirm('Replace the code with a fresh copy of your current design? Your manual code edits will be lost.')) return;
    clearTimeout(timer.current);
    if (api.current) api.current.set(generated);
    dispatch({ type: 'code/set', patch: { html: generated, active: true, fp: designFp } });
    toast('Code re-synced from your design');
  };
  const jump = (label, needles) => {
    if (!api.current || !needles.some((n) => api.current.jump(n))) toast(`No ${label} found`);
  };

  if (!started) {
    return (
      <div className="panel-body">
        <div className="card card-pad stack">
          <div className="row" style={{ gap: 12 }}>
            <span className="code-badge">
              <Icon name="code" />
            </span>
            <div>
              <h3 className="h3">Edit your portfolio’s code, live</h3>
              <p className="hint" style={{ marginTop: 4 }}>
                We’ll copy the complete HTML of your current portfolio — this theme, your colours, animations and 3D — into a code editor. Every change you type shows up in the live preview.
              </p>
            </div>
          </div>
          <ul className="notes">
            <li>Full editor: syntax highlighting, line numbers, search (Ctrl+F), auto-closing tags, undo</li>
            <li>While “Use my code” is on, Open and Export use your edited code</li>
            <li>Your edits are saved on this device; you can always re-sync from the design</li>
          </ul>
          <button className="btn" style={{ justifySelf: 'start' }} onClick={start}>
            <Icon name="code" /> Start editing this portfolio’s code
          </button>
        </div>
        <p className="hint">Tip: finish choosing your theme, colours and content first — after that, design changes don’t flow into your edited code unless you re-sync.</p>
      </div>
    );
  }

  return (
    <div className="code-panel">
      <div className="code-bar">
        <Switch checked={code.active} onChange={(v) => dispatch({ type: 'code/set', patch: { active: v } })} label={code.active ? 'Using my code' : 'Using the generated design'} />
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resync} title="Replace with a fresh copy of the current design">
          <Icon name="refresh" /> Re-sync
        </button>
        <button className="btn ghost sm" onClick={() => downloadFile('index.html', code.html, 'text/html')} title="Download your edited code">
          <Icon name="download" />
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
