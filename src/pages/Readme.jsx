import { useMemo, useState } from 'react';
import { marked } from 'marked';
import { useStore } from '../store.jsx';
import { Icon, Seg, Switch, downloadFile, useToast } from '../components/ui.jsx';
import { CARD_THEMES, DEFAULT_OPTS, README_TEMPLATES, SNAKE_WORKFLOW, buildReadme } from '../readme/templates.js';

const TOGGLES = [
  ['stats', 'GitHub stats card'],
  ['langs', 'Top languages'],
  ['streak', 'Contribution streak'],
  ['trophies', 'Trophies'],
  ['activity', 'Activity graph'],
  ['visitors', 'Profile views counter'],
  ['skills', 'Skills / tech stack'],
  ['projects', 'Projects'],
  ['experience', 'Experience'],
  ['socials', 'Social links'],
];

// GitHub-like rendering of the README (light / dark), shown in a sandboxed frame — no scripts run
function previewDoc(md, dark, username) {
  const html = marked.parse(md || '', { gfm: true });
  const c = dark
    ? { bg: '#0d1117', fg: '#f0f6fc', border: '#3d444d', muted: '#9198a1', link: '#4493f8', code: '#151b23', page: '#010409' }
    : { bg: '#ffffff', fg: '#1f2328', border: '#d1d9e0', muted: '#59636e', link: '#0969da', code: '#f6f8fa', page: '#f6f8fa' };
  return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>
*{box-sizing:border-box}html{background:${c.page}}
body{margin:0;padding:24px 16px;color:${c.fg};font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;word-wrap:break-word}
.box{max-width:900px;margin:0 auto;background:${c.bg};border:1px solid ${c.border};border-radius:6px}
.box-head{padding:10px 16px;border-bottom:1px solid ${c.border};font:600 12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:${c.muted}}
.markdown-body{padding:24px 32px 16px}
.markdown-body>*:first-child{margin-top:0!important}
h1,h2,h3,h4,h5,h6{margin:24px 0 16px;font-weight:600;line-height:1.25}
h1{font-size:2em;padding-bottom:.3em;border-bottom:1px solid ${c.border}}
h2{font-size:1.5em;padding-bottom:.3em;border-bottom:1px solid ${c.border}}
h3{font-size:1.25em}h4{font-size:1em}
p,ul,ol,table,pre,blockquote,details{margin:0 0 16px}
ul,ol{padding-left:2em}li+li{margin-top:.25em}
a{color:${c.link};text-decoration:none}a:hover{text-decoration:underline}
code{padding:.2em .4em;font-size:85%;background:${c.code};border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
pre{padding:16px;overflow:auto;font-size:85%;line-height:1.45;background:${c.code};border-radius:6px}pre code{background:none;padding:0;font-size:100%;white-space:pre}
blockquote{padding:0 1em;color:${c.muted};border-left:.25em solid ${c.border}}
table{border-spacing:0;border-collapse:collapse;display:block;width:max-content;max-width:100%;overflow:auto}
th,td{padding:6px 13px;border:1px solid ${c.border}}tr:nth-child(2n){background:${c.code}}
hr{height:.25em;padding:0;margin:24px 0;background:${c.border};border:0}
img{max-width:100%;vertical-align:middle}
details summary{cursor:pointer}
.img-fallback{display:inline-flex;align-items:center;gap:6px;margin:4px;padding:10px 14px;border:1px dashed ${c.border};border-radius:6px;color:${c.muted};font-size:12px;vertical-align:middle}
</style></head><body><div class="box"><div class="box-head">${username ? `${username} / README.md` : 'README.md'}</div><article class="markdown-body">${html}</article></div>
<script>
// Some networks block the card services (e.g. *.vercel.app). GitHub loads them from its own servers,
// so on the real profile they work — here, show a neat placeholder instead of a broken image.
document.querySelectorAll('img').forEach(function (i) {
  function swap() { var s = document.createElement('span'); s.className = 'img-fallback'; s.textContent = (i.alt || 'Image') + ' — shows on GitHub'; i.replaceWith(s); }
  if (i.complete && i.naturalWidth === 0) swap(); else i.addEventListener('error', swap);
});
</script></body></html>`;
}

export default function Readme({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const r = state.readme || { template: 'classic', opts: {}, md: '', edited: false };
  const opts = { ...DEFAULT_OPTS, ...r.opts, show: { ...DEFAULT_OPTS.show, ...(r.opts?.show || {}) } };
  const [dark, setDark] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [vibe, setVibe] = useState('all');
  const set = (patch) => dispatch({ type: 'readme/set', patch });
  const setOpt = (patch) => set({ opts: { ...r.opts, ...patch } });
  const setShow = (k, v) => setOpt({ show: { ...opts.show, [k]: v } });

  const generated = useMemo(() => buildReadme(r.template, state.profile, state.github, opts), [r.template, state.profile, state.github, JSON.stringify(r.opts)]); // eslint-disable-line react-hooks/exhaustive-deps
  const md = r.edited ? r.md : generated;
  const username = (opts.username || state.github?.username || (state.profile.socials || []).find((s) => /github\.com\//i.test(s.url))?.url?.match(/github\.com\/([^/?#]+)/i)?.[1] || '').trim();
  const doc = useMemo(() => previewDoc(md, dark, username), [md, dark, username]);
  const template = README_TEMPLATES.find((t) => t.id === r.template) || README_TEMPLATES[0];

  const pickTemplate = (id) => {
    if (r.edited && !confirm('Switch template? Your hand edits to this README will be replaced.')) return;
    set({ template: id, edited: false, md: '' });
  };
  const regenerate = () => {
    if (!confirm('Rebuild the README from the template and options? Your hand edits will be replaced.')) return;
    set({ edited: false, md: '' });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
      toast('README copied — paste it into README.md in your profile repo');
    } catch {
      toast('Couldn’t copy — use Download instead');
    }
  };

  return (
    <div className="page page-wide">
      <div className="readme-app">
        <aside className="readme-panel">
          <div className="readme-head">
            <h1 className="panel-title">GitHub profile README</h1>
            <p className="hint">The page people see on github.com/{username || 'you'}. Built from your Dev Identity — pick a style, tweak it, download.</p>
          </div>

          <div className="ctl">
            <div className="lbl">
              <span>GitHub username</span>
              {!username && <span className="badge">needed for stats</span>}
            </div>
            <input className="input" value={opts.username || ''} placeholder={username || 'your-github-username'} onChange={(e) => setOpt({ username: e.target.value.replace(/^@/, '').trim() })} />
          </div>

          <div className="ctl">
            <div className="lbl">
              <span>Template</span>
              <span className="muted small">{README_TEMPLATES.length} styles</span>
            </div>
            <Seg value={vibe} onChange={setVibe} options={[{ value: 'all', label: 'All' }, { value: 'clean', label: 'Clean' }, { value: 'bold', label: 'Bold & fun' }]} />
            <div className="readme-templates">
              {README_TEMPLATES.filter((t) => vibe === 'all' || t.vibe === vibe).map((t) => (
                <button key={t.id} className={`rt-card ${t.id === r.template ? 'on' : ''}`} onClick={() => pickTemplate(t.id)}>
                  <b>
                    {t.name}
                    {t.vibe === 'bold' && <i className="rt-tag">bold</i>}
                  </b>
                  <span>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ctl">
            <div className="lbl">Stats card theme</div>
            <div className="chips">
              {CARD_THEMES.map(([k, label]) => (
                <button key={k} className={`chip ${opts.theme === k ? 'on' : ''}`} onClick={() => setOpt({ theme: k })}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="ctl">
            <div className="lbl">Badges</div>
            <Seg value={opts.badges} onChange={(v) => setOpt({ badges: v })} options={[{ value: 'brand', label: 'Brand colours' }, { value: 'mono', label: 'Black & white' }]} />
          </div>
          <div className="ctl">
            <div className="lbl">
              <span>Accent colour</span>
              <span className="muted small">typing text, banner, counter</span>
            </div>
            <input type="color" className="color-in" value={`#${opts.accent}`} onChange={(e) => setOpt({ accent: e.target.value.slice(1).toUpperCase() })} />
          </div>

          <div className="ctl">
            <div className="lbl">Show</div>
            <div className="readme-toggles">
              {TOGGLES.map(([k, label]) => (
                <Switch key={k} checked={!!opts.show[k]} onChange={(v) => setShow(k, v)} label={label} />
              ))}
            </div>
          </div>

          <div className="ctl">
            <div className="lbl">A few personal lines (optional)</div>
            <input className="input" value={opts.currently} onChange={(e) => setOpt({ currently: e.target.value })} placeholder="Currently working on… (default: your top project)" />
            <input className="input" value={opts.learning} onChange={(e) => setOpt({ learning: e.target.value })} placeholder="Currently learning… e.g. Rust, System Design" />
            <input className="input" value={opts.askMe} onChange={(e) => setOpt({ askMe: e.target.value })} placeholder="Ask me about… (default: your top skills)" />
            <input className="input" value={opts.funFact} onChange={(e) => setOpt({ funFact: e.target.value })} placeholder="Fun fact…" />
            <p className="hint">
              Name, headline, about, skills, projects and links come from your{' '}
              <button className="linklike" onClick={() => go('profile')}>
                Dev Identity
              </button>
              .
            </p>
          </div>

          <div className="card card-pad stack-sm readme-guide">
            <button className="link-btn" onClick={() => setShowGuide(!showGuide)}>
              <Icon name="chevron" className={showGuide ? 'rot' : ''} /> How to put it on your GitHub profile
            </button>
            {showGuide && (
              <ol className="guide-steps">
                <li>
                  Create a <b>public</b> repository named exactly <code>{username || 'your-username'}</code>
                  {username && (
                    <>
                      {' '}
                      —{' '}
                      <a href={`https://github.com/new?name=${encodeURIComponent(username)}&visibility=public`} target="_blank" rel="noopener noreferrer">
                        create it now
                      </a>
                    </>
                  )}
                  .
                </li>
                <li>
                  Tick <b>Add a README file</b>, or upload the <code>README.md</code> you download here.
                </li>
                <li>Open README.md → edit (pencil) → paste → Commit. It now shows on your profile.</li>
                <li>Stats cards fill in after GitHub has some public activity; they refresh every few hours.</li>
              </ol>
            )}
          </div>
        </aside>

        <section className="readme-main">
          <div className="preview-bar readme-bar">
            <b className="small">{template.name}</b>
            {r.edited ? (
              <span className="badge">
                edited by hand ·{' '}
                <button className="linklike" onClick={regenerate}>
                  rebuild from template
                </button>
              </span>
            ) : (
              <span className="badge solid">live from your profile</span>
            )}
            <span className="spacer" />
            <Seg value={dark ? 'dark' : 'light'} onChange={(v) => setDark(v === 'dark')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
            <button className="btn ghost sm" onClick={copy}>
              <Icon name="copy" /> Copy
            </button>
            <button className="btn sm" onClick={() => downloadFile('README.md', md, 'text/markdown')}>
              <Icon name="download" /> README.md
            </button>
          </div>
          {r.edited && <div className="code-warn">You’ve edited the Markdown, so template and option changes won’t apply until you rebuild.</div>}
          {template.workflow === 'snake' && (
            <div className="workflow-note">
              <Icon name="zap" />
              <span>
                <b>The snake needs a one-time GitHub Action.</b> In your <code>{username || 'username'}</code> repo, add this file as <code>.github/workflows/snake.yml</code>, then open the <i>Actions</i> tab and run “Generate contribution snake”. The snake appears within a minute and updates twice a day.
              </span>
              <button className="btn secondary sm" onClick={() => downloadFile('snake.yml', SNAKE_WORKFLOW, 'text/yaml')}>
                <Icon name="download" /> snake.yml
              </button>
            </div>
          )}
          <div className="readme-split">
            <div className="readme-editor">
              <div className="pane-label">Markdown — edit freely</div>
              <textarea
                className="md-input"
                spellCheck={false}
                value={md}
                onChange={(e) => set({ md: e.target.value, edited: true })}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const t = e.currentTarget;
                    const { selectionStart: a, selectionEnd: b } = t;
                    const v = t.value.slice(0, a) + '  ' + t.value.slice(b);
                    set({ md: v, edited: true });
                    requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2));
                  }
                }}
              />
            </div>
            <div className="readme-preview">
              <div className="pane-label">Live preview — as it looks on GitHub</div>
              <iframe title="README preview" srcDoc={doc} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
