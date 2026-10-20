import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { COLOR_KEYS, DEFAULT_DESIGN, SECTION_LABELS, isBlankProfile, previewProfile, useStore, withFreshLook } from '../store.jsx';
import { Icon, Seg, Switch, downloadFile, useToast } from '../components/ui.jsx';
import { CURSORS, FONT_PAIRS, SCENES, THEMES, THEME_CATEGORIES, hashString, renderPortfolio, scenePoster, signatureSvg, slugName } from '../portfolio/render.js';
import { fingerprint, uniquenessScore } from '../portfolio/brief.js';
import ColorsPanel from './ColorsPanel.jsx';
import CodePanel from './CodePanel.jsx';
import { replayEdits } from '../lib/ai-builder.js';
import HistoryBar from '../components/HistoryBar.jsx';
import { Pressable, Thumb } from '../components/Thumb.jsx';

const TOOLS = [
  { id: 'themes', label: 'Themes', icon: 'grid' },
  { id: 'layout', label: 'Layout', icon: 'layout' },
  { id: 'colors', label: 'Colours', icon: 'palette' },
  { id: 'style', label: 'Type', icon: 'type' },
  { id: 'motion', label: 'Motion', icon: 'zap' },
  { id: 'three', label: '3D', icon: 'cube' },
  { id: 'code', label: 'AI', icon: 'sparkle' },
  { id: 'publish', label: 'Publish', icon: 'rocket' },
];

const ENTRANCES = [
  ['none', 'None', 'Static hero'],
  ['fade', 'Fade', 'Soft fade-in'],
  ['rise', 'Rise', 'Slides up, staggered'],
  ['blur', 'Blur', 'Focus pulls in'],
  ['scale', 'Scale', 'Pops into place'],
  ['mask', 'Mask wipe', 'Revealed by a wipe'],
  ['split', 'Letters', 'Name animates per letter'],
  ['typewriter', 'Typewriter', 'Name types itself'],
  ['wave', 'Wave', 'Letters bounce in like a wave'],
  ['flip', 'Flip', 'Elements flip up in 3D'],
  ['slide', 'Slide', 'Glide in from the left'],
  ['zoom', 'Zoom out', 'Settle in from a blurry zoom'],
  ['curtain', 'Curtain', 'A panel lifts to reveal the page'],
];
const REVEALS = [
  ['none', 'None'],
  ['fade', 'Fade'],
  ['rise', 'Rise'],
  ['scale', 'Scale'],
  ['blur', 'Blur'],
  ['slide', 'Slide'],
  ['clip', 'Clip wipe'],
  ['flip', '3D flip'],
  ['tilt', 'Tilt'],
  ['zoom', 'Zoom'],
  ['skew', 'Skew'],
];
const BACKGROUNDS = [
  ['none', 'None', 'Plain'],
  ['stars', 'Starfield', 'Warp-speed stars'],
  ['matrix', 'Code rain', 'Falling glyphs'],
  ['gradient', 'Aurora', 'Drifting light blobs'],
  ['grid', 'Retro grid', 'Moving perspective floor'],
  ['dots', 'Reactive dots', 'Dots swell near the cursor'],
  ['waves', 'Waves', 'Flowing line field'],
  ['constellation', 'Constellation', 'Linked stars that reach for your cursor'],
  ['rain', 'Rain', 'Slanted falling streaks'],
  ['bubbles', 'Bubbles', 'Bubbles drifting upwards'],
  ['flow', 'Flow field', 'Particles tracing invisible currents'],
];
const ANIM_PRESETS = [
  { name: 'Still', desc: 'No motion at all', set: { motion: 'none', entrance: 'none', revealStyle: 'none', bgAnim: 'none', titleAnim: 'none', cardHover: 'none', linkStyle: 'underline', parallax: false, counters: false, scramble: false, preloader: false } },
  { name: 'Calm', desc: 'Fades and a sliding underline', set: { motion: 'subtle', entrance: 'fade', revealStyle: 'fade', bgAnim: 'none', titleAnim: 'line', cardHover: 'outline', linkStyle: 'slide', parallax: false } },
  { name: 'Smooth', desc: 'Rising, staggered, parallax', set: { motion: 'subtle', entrance: 'rise', revealStyle: 'rise', bgAnim: 'none', titleAnim: 'none', cardHover: 'lift', linkStyle: 'slide', parallax: true, counters: true } },
  { name: 'Cinematic', desc: 'Mask wipes, blur, grain, intro', set: { motion: 'subtle', entrance: 'mask', revealStyle: 'blur', bgAnim: 'gradient', titleAnim: 'line', cardHover: 'zoom', grain: true, preloader: true, parallax: true } },
  { name: 'Playful', desc: 'Bouncy letters and big hovers', set: { motion: 'subtle', entrance: 'split', revealStyle: 'scale', bgAnim: 'dots', titleAnim: 'letters', cardHover: 'lift', linkStyle: 'highlight', magnetic: true, tilt: true, cursor: 'invert' } },
  { name: 'Hacker', desc: 'Typing, decoding, code rain', set: { motion: 'subtle', entrance: 'typewriter', revealStyle: 'clip', bgAnim: 'matrix', titleAnim: 'scramble', cardHover: 'invert', linkStyle: 'arrow', scramble: true, cursor: 'crosshair' } },
  { name: 'Space', desc: 'Stars, blur and a soft cursor', set: { motion: 'subtle', entrance: 'blur', revealStyle: 'rise', bgAnim: 'stars', titleAnim: 'none', cardHover: 'lift', cursor: 'ring', counters: true } },
  { name: 'Synthwave', desc: 'Retro grid and glitch titles', set: { motion: 'subtle', entrance: 'scale', revealStyle: 'slide', bgAnim: 'grid', titleAnim: 'scramble', cardHover: 'outline', linkStyle: 'highlight', progress: true } },
  { name: 'Dreamy', desc: 'Zoom, blur titles, flowing particles', set: { motion: 'subtle', entrance: 'zoom', revealStyle: 'zoom', bgAnim: 'flow', titleAnim: 'blur', cardHover: 'spotlight', linkStyle: 'slide', cursor: 'spotlight', textFill: true, scrollSkew: false, clickFx: 'ripple' } },
  { name: 'Energetic', desc: 'Wave letters, skew, bursts', set: { motion: 'subtle', entrance: 'wave', revealStyle: 'skew', bgAnim: 'constellation', titleAnim: 'wave', cardHover: 'shine', linkStyle: 'highlight', cursor: 'trail', scrollSkew: true, clickFx: 'burst', counters: true } },
];
const EFFECTS = [
  { key: 'parallax', label: 'Parallax hero', desc: 'Hero drifts and fades as you scroll.' },
  { key: 'counters', label: 'Counting numbers', desc: 'Stats and stars count up when visible.' },
  { key: 'scramble', label: 'Name decode', desc: 'Your name resolves from random glyphs.' },
  { key: 'preloader', label: 'Intro preloader', desc: '000→100 counter that wipes away.' },
  { key: 'progress', label: 'Scroll progress', desc: 'Thin bar tracks reading progress.' },
  { key: 'grain', label: 'Film grain', desc: 'Animated analog noise overlay.' },
  { key: 'textFill', label: 'Text fill on scroll', desc: 'Paragraphs light up word by word as you scroll.' },
  { key: 'scrollSkew', label: 'Scroll skew', desc: 'Content leans with your scroll speed.' },
];
const INTERACTIONS = [
  { key: 'tilt', label: '3D tilt cards', desc: 'Project cards tilt toward the cursor.' },
  { key: 'magnetic', label: 'Magnetic buttons', desc: 'Buttons pull toward the cursor.' },
  { key: 'drag3d', label: 'Drag to rotate 3D', desc: 'Visitors can grab and spin the 3D object (when it sits beside your text).' },
];
const MAX_MODEL_BYTES = 3 * 1024 * 1024;

function Ctl({ label, aside, hint, children }) {
  return (
    <div className="ctl">
      <div className="lbl">
        <span>{label}</span>
        {aside}
      </div>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

function Choice({ items, value, onChange, cols = 2 }) {
  return (
    <div className="choice" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {items.map(([k, name, desc]) => (
        <button key={k} className={`choice-item ${value === k ? 'on' : ''}`} onClick={() => onChange(k)}>
          <b>{name}</b>
          {desc && <span>{desc}</span>}
        </button>
      ))}
    </div>
  );
}

function Toggles({ items, design, set }) {
  return (
    <div className="effect-list">
      {items.map((e) => (
        <div key={e.key} className="effect">
          <div>
            <b>{e.label}</b>
            <span>{e.desc}</span>
          </div>
          <Switch checked={design[e.key]} onChange={(v) => set({ [e.key]: v })} />
        </div>
      ))}
    </div>
  );
}

export default function Studio({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { design } = state;
  // a new account has no details yet: everything here previews the sample person instead
  const blankProfile = isBlankProfile(state.profile);
  const profile = previewProfile(state.profile);
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.hash.split('?')[1] || '').get('tab');
    if (t === 'inspire' || t === 'brief') return 'code'; // merged into the AI tab
    return TOOLS.some((x) => x.id === t) ? t : 'themes';
  });
  const [cat, setCat] = useState('All');
  const [keepColors, setKeepColors] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [full, setFull] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || '').get('full') === '1');
  const [codeFull, setCodeFull] = useState(false); // code editor + live preview filling the screen
  const [dragKey, setDragKey] = useState(null);
  const [replay, setReplay] = useState(0);

  const set = (patch) => dispatch({ type: 'design/set', patch });
  // Every design change is recorded by the store's undo history; nothing to do here anymore.
  const snapshot = () => {};

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setFull(false);
        setCodeFull(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const deferredProfile = useDeferredValue(profile);
  const deferredDesign = useDeferredValue(design);
  const html = useMemo(() => renderPortfolio(deferredProfile, deferredDesign, { preview: true }), [deferredProfile, deferredDesign]);

  const score = uniquenessScore(design, DEFAULT_DESIGN);
  const fp = fingerprint(profile.basics.name, design);

  // ---- live code editor
  const code = state.code || { html: '', active: false, fp: '' };
  const useCode = code.active && !!code.html;
  // what the edited code was copied from: the design AND the profile content
  const designFp = `${fp}:${hashString(JSON.stringify(profile))}`;
  const generatedFull = useMemo(() => (tab === 'code' ? renderPortfolio(profile, design) : ''), [tab, profile, design]);

  // An AI-changed theme stays connected to the settings: when colours, 3D, fonts, theme or content
  // change, rebuild the theme and re-apply the AI's edits on top — code, preview and export all update.
  const synced = useCode && code.base === 'theme' && (code.patches || []).length > 0;
  useEffect(() => {
    if (!synced) return;
    const t = setTimeout(() => {
      const r = replayEdits(renderPortfolio(profile, design), code.patches);
      if (r.html !== code.html || r.failed !== (code.syncFailed || 0)) dispatch({ type: 'code/set', patch: { html: r.html, syncFailed: r.failed } });
    }, 250);
    return () => clearTimeout(t);
  }, [synced, profile, design, code.patches]); // eslint-disable-line react-hooks/exhaustive-deps
  // the final page that Open / Export / Copy use
  // (an AI-changed theme is rebuilt on the spot, so an export right after a settings change is never stale)
  const finalHtml = () => {
    if (!useCode) return renderPortfolio(profile, design);
    if (code.base === 'theme' && (code.patches || []).length) return replayEdits(renderPortfolio(profile, design), code.patches).html;
    return code.html;
  };
  // in the preview, keep in-page links working and open external links in a new tab
  const PREVIEW_JS = "<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a)return;var h=a.getAttribute('href')||'';e.preventDefault();if(h.charAt(0)==='#'){var t=document.getElementById(h.slice(1));if(t)t.scrollIntoView({behavior:'smooth'})}else if(h)window.open(a.href,'_blank','noopener')});<\/script>";
  const previewHtml = useCode ? (code.html.lastIndexOf('</body>') >= 0 ? code.html.slice(0, code.html.lastIndexOf('</body>')) + PREVIEW_JS + code.html.slice(code.html.lastIndexOf('</body>')) : code.html + PREVIEW_JS) : html;
  const theme = THEMES[design.layout] || THEMES.classic;
  const base = theme.base || design.layout;

  const themeKeys = Object.keys(THEMES).filter((k) => cat === 'All' || THEMES[k].cat === cat);
  // A theme starts from a clean look (so it never blends with the previous design);
  // optionally carrying over the current colours and hero image.
  const themeDesign = (key) => withFreshLook(design, { layout: key, ...THEMES[key].preset }, keepColors ? COLOR_KEYS : []);
  const themeThumbs = useMemo(
    () => Object.fromEntries(Object.keys(THEMES).map((k) => [k, renderPortfolio(profile, { ...themeDesign(k), heroImage: '' }, { thumb: true })])),
    // regenerate when content or the keep-colours choice changes, not on every style tweak
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, keepColors, design.accent, design.colorScheme, design.colors, design.accentUse]
  );


  const applyTheme = (key) => {
    snapshot();
    dispatch({ type: 'design/replace', design: themeDesign(key), label: `Theme: ${THEMES[key].name}` });
    toast(`${THEMES[key].name} applied${keepColors ? ' with your colours' : ''} — make it yours with Colours, Type and Motion`);
  };

  const needProfile = () => {
    if (!blankProfile) return false;
    toast('Add your details in Dev Identity first — this preview is only a sample');
    go('profile');
    return true;
  };
  const exportHtml = () => {
    if (needProfile()) return;
    dispatch({ type: 'milestone', key: 'exported' });
    downloadFile('index.html', finalHtml(), 'text/html');
    toast(useCode ? 'Downloaded index.html (your edited code)' : 'Downloaded index.html');
  };
  const openTab = () => {
    if (needProfile()) return;
    dispatch({ type: 'milestone', key: 'exported' });
    const blob = new Blob([finalHtml()], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
  };

  const moveSection = (key, dir) => {
    const order = [...design.sectionOrder];
    const i = order.indexOf(key);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    set({ sectionOrder: order });
  };
  const dropOn = (target) => {
    if (!dragKey || dragKey === target) return;
    const order = design.sectionOrder.filter((k) => k !== dragKey);
    order.splice(order.indexOf(target), 0, dragKey);
    set({ sectionOrder: order });
  };

  const uploadModel = async (file) => {
    if (!/\.glb$/i.test(file.name)) return toast('Please choose a .glb file (binary glTF)');
    if (file.size > MAX_MODEL_BYTES) return toast('Model is over 3 MB — host it (e.g. on GitHub) and paste the URL instead');
    const data = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    set({ hero3d: 'model', modelData: data, modelUrl: '' });
    toast(`Loaded ${file.name}`);
  };

  const presetActive = (p) => Object.entries(p.set).every(([k, v]) => design[k] === v);
  const current = TOOLS.find((t) => t.id === tab);

  return (
    <div className="page page-wide">
      <div className={`studio ${full ? 'is-full' : ''} ${tab === 'code' ? 'code-mode' : ''} ${tab === 'code' && codeFull ? 'code-full' : ''}`}>
        <nav className="rail" aria-label="Studio tools">
          {TOOLS.map((t) => (
            <button key={t.id} className={`rail-btn ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)} aria-current={tab === t.id}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="studio-panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow-sm">{current.label}</div>
              <h2>
                {theme.name}
                <span className="badge">{theme.cat}</span>
              </h2>
            </div>
            {!full && <HistoryBar />}
          </div>
          <div className="meter-card">
            <div className="meter">
              <b>{score}%</b>
              <div style={{ flex: 1 }}>
                <div className="meter-top">
                  <span>Uniqueness</span>
                  <span className="mono muted">#{fp}</span>
                </div>
                <div className="progress">
                  <i style={{ width: `${Math.max(4, score)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {useCode && tab !== 'code' && tab !== 'publish' && (
            <div className={`sync-note ${synced && !code.syncFailed ? 'ok' : 'warn'}`}>
              <Icon name={synced && !code.syncFailed ? 'check' : 'alert'} />
              {synced ? (
                code.syncFailed ? (
                  <span>
                    <b>{code.syncFailed} AI change{code.syncFailed > 1 ? 's' : ''} didn’t fit this setting</b> (e.g. a very different theme). The rest are kept. Press Ctrl+Z to go back, or ask the AI again.
                  </span>
                ) : (
                  <span>
                    <b>Your AI changes are kept.</b> Anything you change here updates your code, the preview and the exported index.html.
                  </span>
                )
              ) : (
                <span>
                  <b>These settings don’t change your current code.</b> The preview shows your {code.base === 'ai' ? 'AI-written' : 'hand-edited'} page.{' '}
                  <button className="linklike" onClick={() => dispatch({ type: 'code/set', patch: { active: false } })}>
                    Use the theme design instead
                  </button>{' '}
                  (your code stays saved in the AI tab), or ask the AI for the change.
                </span>
              )}
            </div>
          )}
          {tab === 'themes' && (
            <div className="panel-body">
              <button className="ai-theme-cta" onClick={() => setTab('code')}>
                <Icon name="sparkle" />
                <span>
                  <b>Change {THEMES[design.layout]?.name || 'this theme'} with AI</b>
                  <small>Pick a theme below, then describe what to change — colours, layout, sections, animations…</small>
                </span>
                <Icon name="chevron" />
              </button>
              <div className="effect-list">
                <div className="effect">
                  <div>
                    <b>Keep my colours &amp; image</b>
                    <span>Off: each theme comes in its own original look. On: themes use your current colour scheme and hero image.</span>
                  </div>
                  <Switch checked={keepColors} onChange={setKeepColors} />
                </div>
              </div>
              <div className="chips">
                {THEME_CATEGORIES.map((c) => (
                  <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                    {c}
                    <span className="chip-n">{c === 'All' ? Object.keys(THEMES).length : Object.values(THEMES).filter((t) => t.cat === c).length}</span>
                  </button>
                ))}
              </div>
              <div className="theme-grid">
                {themeKeys.map((k, i) => (
                  <Pressable key={k} className={`theme-card ${design.layout === k ? 'on' : ''}`} onActivate={() => applyTheme(k)} label={`Apply ${THEMES[k].name}`}>
                    <Thumb html={themeThumbs[k]} scale={0.135} height={118} eager={i < 6} />
                    <div className="theme-meta">
                      <b>{THEMES[k].name}</b>
                      <span>{THEMES[k].desc}</span>
                    </div>
                    {design.layout === k && <span className="theme-check"><Icon name="check" size={12} strokeWidth={3} /></span>}
                  </Pressable>
                ))}
              </div>
            </div>
          )}

          {tab === 'colors' && <ColorsPanel design={design} set={set} snapshot={snapshot} traits={null} toast={toast} />}

          {tab === 'code' && <CodePanel generated={generatedFull} code={code} designFp={designFp} dispatch={dispatch} toast={toast} profile={profile} blankProfile={blankProfile} full={codeFull} onFull={setCodeFull} themeName={THEMES[design.layout]?.name} onDownload={exportHtml} />}

          {tab === 'style' && (
            <div className="panel-body">
              <Ctl label="Typography" hint={base === 'terminal' ? 'Terminal themes always use monospace.' : undefined}>
                <div className="opt-grid">
                  {Object.entries(FONT_PAIRS).map(([k, f]) => (
                    <button key={k} className={`opt ${design.fontPair === k ? 'on' : ''}`} onClick={() => set({ fontPair: k })} disabled={base === 'terminal' && k !== 'mono'}>
                      <span className="font-sample" style={{ fontFamily: `'${f.head}', serif` }}>
                        Ag
                      </span>
                      <b>{f.label.split(' — ')[0]}</b>
                      <span className="muted">{f.label.split(' — ')[1]}</span>
                    </button>
                  ))}
                </div>
                <FontLoader />
              </Ctl>
              <Ctl label="Headline size">
                <Seg value={design.scale} onChange={(v) => set({ scale: v })} options={[{ value: 'compact', label: 'Compact' }, { value: 'regular', label: 'Regular' }, { value: 'large', label: 'Oversized' }]} />
              </Ctl>
              <Ctl label="Spacing">
                <Seg value={design.density} onChange={(v) => set({ density: v })} options={[{ value: 'tight', label: 'Tight' }, { value: 'normal', label: 'Normal' }, { value: 'airy', label: 'Airy' }]} />
              </Ctl>
              <Ctl label="Corners">
                <Seg value={Number(design.radius)} onChange={(v) => set({ radius: v })} options={[{ value: 0, label: 'Sharp' }, { value: 6, label: 'Subtle' }, { value: 14, label: 'Round' }]} />
              </Ctl>
              <Ctl label="Borders">
                <Seg value={design.border} onChange={(v) => set({ border: v })} options={[{ value: 'none', label: 'None' }, { value: 'hairline', label: 'Hairline' }, { value: 'bold', label: 'Bold' }]} />
              </Ctl>
              <Ctl label="Background texture">
                <Seg value={design.texture} onChange={(v) => set({ texture: v })} options={[{ value: 'none', label: 'Plain' }, { value: 'grid', label: 'Grid' }, { value: 'dots', label: 'Dots' }, { value: 'lines', label: 'Ruled' }]} />
              </Ctl>
              <Ctl label="Heading case">
                <Seg value={design.headingCase} onChange={(v) => set({ headingCase: v })} options={[{ value: 'normal', label: 'Normal' }, { value: 'upper', label: 'UPPER' }, { value: 'lower', label: 'lower' }]} />
              </Ctl>
              <Ctl label="Section labels">
                <Seg
                  value={design.sectionLabel}
                  onChange={(v) => set({ sectionLabel: v })}
                  options={[
                    { value: 'plain', label: 'Projects' },
                    { value: 'numbered', label: '01 Projects' },
                    { value: 'slash', label: '// projects' },
                    { value: 'bracket', label: '[ Projects ]' },
                    { value: 'hash', label: '# projects' },
                    { value: 'fig', label: 'FIG. 01' },
                    { value: 'prompt', label: '~$ cat' },
                  ]}
                />
              </Ctl>
            </div>
          )}

          {tab === 'motion' && (
            <div className="panel-body">
              <Ctl label="Animation presets" aside={<button className="btn ghost sm" onClick={() => setReplay((r) => r + 1)}><Icon name="refresh" /> Replay</button>}>
                <div className="preset-grid">
                  {ANIM_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      className={`choice-item ${presetActive(p) ? 'on' : ''}`}
                      onClick={() => {
                        snapshot();
                        set(p.set);
                        setReplay((r) => r + 1);
                      }}
                    >
                      <b>{p.name}</b>
                      <span>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </Ctl>
              <Ctl label="Hero entrance">
                <Choice items={ENTRANCES} value={design.entrance} onChange={(v) => { set({ entrance: v, motion: design.motion === 'none' ? 'subtle' : design.motion }); setReplay((r) => r + 1); }} />
              </Ctl>
              <Ctl label="Scroll reveal" hint="Sections animate in as they scroll into view; cards and entries stagger.">
                <Choice cols={3} items={REVEALS} value={design.revealStyle} onChange={(v) => set({ revealStyle: v, motion: design.motion === 'none' ? 'subtle' : design.motion })} />
              </Ctl>
              <Ctl label="Section titles">
                <Seg value={design.titleAnim} onChange={(v) => set({ titleAnim: v })} options={[{ value: 'none', label: 'Static' }, { value: 'letters', label: 'Letters' }, { value: 'wave', label: 'Wave' }, { value: 'line', label: 'Underline draw' }, { value: 'highlight', label: 'Marker' }, { value: 'blur', label: 'Blur in' }, { value: 'scramble', label: 'Decode' }]} />
              </Ctl>
              <Ctl label="Animated background">
                <Choice items={BACKGROUNDS} value={design.bgAnim} onChange={(v) => set({ bgAnim: v })} />
              </Ctl>
              <Ctl label="Card hover">
                <Seg value={design.cardHover} onChange={(v) => set({ cardHover: v })} options={[{ value: 'none', label: 'None' }, { value: 'lift', label: 'Lift' }, { value: 'spotlight', label: 'Spotlight' }, { value: 'shine', label: 'Shine' }, { value: 'zoom', label: 'Zoom image' }, { value: 'outline', label: 'Outline' }, { value: 'invert', label: 'Invert' }]} />
              </Ctl>
              <Ctl label="Link hover">
                <Seg value={design.linkStyle} onChange={(v) => set({ linkStyle: v })} options={[{ value: 'underline', label: 'Underline' }, { value: 'slide', label: 'Slide in' }, { value: 'highlight', label: 'Highlight' }, { value: 'arrow', label: 'Arrow' }]} />
              </Ctl>
              <Ctl label="Click effect">
                <Seg value={design.clickFx} onChange={(v) => set({ clickFx: v })} options={[{ value: 'none', label: 'None' }, { value: 'ripple', label: 'Ripple' }, { value: 'burst', label: 'Burst' }]} />
              </Ctl>
              <Ctl label="Extras" hint="The preloader plays on the published site (Open ↗ to see it). Every animation respects the visitor’s “reduce motion” setting.">
                <Toggles items={EFFECTS} design={design} set={set} />
              </Ctl>
              <Ctl label="Master switch">
                <Seg value={design.motion} onChange={(v) => set({ motion: v })} options={[{ value: 'none', label: 'Disable all motion' }, { value: 'subtle', label: 'Enabled' }]} />
              </Ctl>
            </div>
          )}

          {tab === 'three' && (
            <div className="panel-body">
              <Ctl
                label="3D hero object"
                aside={
                  !['none', 'model', 'embed'].includes(design.hero3d) && (
                    <button className="btn ghost sm" onClick={() => set({ seed: Math.floor(Math.random() * 1e6) })}>
                      <Icon name="refresh" /> New variant
                    </button>
                  )
                }
                hint="Built-in scenes are generated from your name + seed — the same scene looks different for every person."
              >
                <div className="scene-grid">
                  {Object.entries(SCENES).map(([k, s]) => (
                    <button key={k} className={`opt scene ${design.hero3d === k ? 'on' : ''}`} onClick={() => set({ hero3d: k })}>
                      <span className="scene-art" dangerouslySetInnerHTML={{ __html: k === 'none' ? '<svg viewBox="0 0 100 100"><path d="M35 35l30 30M65 35L35 65" stroke="currentColor" stroke-width="2"/></svg>' : scenePoster(k) }} />
                      <b>{s.name}</b>
                      <span className="muted">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </Ctl>
              {design.hero3d === 'model' && (
                <div className="card card-pad stack">
                  <b className="small">Your own 3D model</b>
                  <div className="row">
                    <label className="btn secondary sm">
                      <Icon name="upload" /> Upload .glb
                      <input type="file" accept=".glb,model/gltf-binary" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadModel(f); e.target.value = ''; }} />
                    </label>
                    {design.modelData && (
                      <button className="btn ghost sm" onClick={() => set({ modelData: '' })}>
                        Remove upload
                      </button>
                    )}
                  </div>
                  <label className="field">
                    <span>…or a public .glb / .gltf URL</span>
                    <input className="input" value={design.modelUrl} placeholder="https://raw.githubusercontent.com/you/repo/main/me.glb" onChange={(e) => set({ modelUrl: e.target.value, modelData: '' })} />
                  </label>
                  <Switch checked={design.modelMono} onChange={(v) => set({ modelMono: v })} label="Render in monochrome (match the site)" />
                  <span className="hint">Free models: Sketchfab (download as glTF), Poly Pizza, or build your own in Blender. Uploads up to 3 MB are embedded in the export.</span>
                </div>
              )}
              {design.hero3d === 'embed' && (
                <div className="card card-pad stack">
                  <label className="field">
                    <span>Spline / Sketchfab embed URL</span>
                    <input className="input" value={design.embedUrl} placeholder="https://my.spline.design/your-scene-id/" onChange={(e) => set({ embedUrl: e.target.value })} />
                  </label>
                  <span className="hint">
                    In Spline: <b>Export → Public URL</b>, paste it here. Anything you design in Spline’s free editor becomes your hero. Sketchfab: use the model’s <b>Embed</b> link.
                  </span>
                </div>
              )}
              {design.hero3d !== 'none' && !['spatial', 'bento', 'os', 'editorial', 'swiss', 'blueprint'].includes(base) && (
                <Ctl label="3D placement">
                  <Seg value={design.hero3dPlace} onChange={(v) => set({ hero3dPlace: v })} options={[{ value: 'auto', label: 'Auto' }, { value: 'side', label: 'Beside text' }, { value: 'background', label: 'Behind text' }]} />
                </Ctl>
              )}
              <Ctl label="Cursor">
                <div className="opt-grid">
                  {Object.entries(CURSORS).map(([k, label]) => (
                    <button key={k} className={`opt ${design.cursor === k ? 'on' : ''}`} onClick={() => set({ cursor: k })}>
                      <b>{label}</b>
                    </button>
                  ))}
                </div>
              </Ctl>
              {design.hero3d !== 'none' && design.hero3d !== 'embed' && (
                <Ctl label="3D speed">
                  <Seg value={Number(design.threeSpeed)} onChange={(v) => set({ threeSpeed: v })} options={[{ value: 0.4, label: 'Slow' }, { value: 1, label: 'Normal' }, { value: 2, label: 'Fast' }]} />
                </Ctl>
              )}
              <Ctl label="Interactions">
                <Toggles items={INTERACTIONS} design={design} set={set} />
              </Ctl>
            </div>
          )}

          {tab === 'layout' && (
            <div className="panel-body">
              <Ctl label="Hero style" hint="Applies to Minimal-based and Brutalist-based themes; others have a signature hero.">
                <Seg value={design.heroStyle} onChange={(v) => set({ heroStyle: v })} options={[{ value: 'name-big', label: 'Big name' }, { value: 'statement', label: 'Statement' }, { value: 'split', label: 'Split' }, { value: 'minimal', label: 'Minimal' }]} />
              </Ctl>
              <Ctl label="Signature mark" aside={<button className="btn ghost sm" onClick={() => set({ seed: Math.floor(Math.random() * 1e6) })}><Icon name="refresh" /> Regenerate</button>} hint="Generated from your name — nobody else gets the same mark.">
                <div className="opt-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  {['none', 'identicon', 'monogram', 'lines', 'orbit'].map((k) => (
                    <button key={k} className={`opt ${design.mark === k ? 'on' : ''}`} style={{ alignItems: 'center', padding: 8 }} onClick={() => set({ mark: k })} title={k}>
                      {k === 'none' ? <span style={{ height: 34, display: 'grid', placeItems: 'center' }} className="muted">—</span> : <span style={{ height: 34, width: 34 }} dangerouslySetInnerHTML={{ __html: signatureSvg(profile.basics.name, design.seed, k, 34) }} />}
                    </button>
                  ))}
                </div>
              </Ctl>
              <Ctl label="Projects display">
                <Seg value={design.projectStyle} onChange={(v) => set({ projectStyle: v })} options={[{ value: 'cards', label: 'Cards' }, { value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }, { value: 'numbered', label: 'Numbered' }]} />
              </Ctl>
              <Ctl label="Navigation">
                <Seg value={design.nav} onChange={(v) => set({ nav: v })} options={[{ value: 'top', label: 'Top bar' }, { value: 'floating', label: 'Floating pill' }, { value: 'none', label: 'None' }]} />
              </Ctl>
              <Switch checked={design.showAvatar} onChange={(v) => set({ showAvatar: v })} label="Show photo (if uploaded)" />
              <Ctl label="Sections — drag to reorder, eye to hide" hint="Empty sections are skipped automatically.">
                <div className="order-list">
                  {design.sectionOrder.map((k, i) => (
                    <div key={k} className={`order-item ${dragKey === k ? 'dragging' : ''} ${design.hidden[k] ? 'off' : ''}`} draggable onDragStart={() => setDragKey(k)} onDragEnd={() => setDragKey(null)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(k)}>
                      <span className="grip" aria-hidden="true">⋮⋮</span>
                      <span className="name">{SECTION_LABELS[k]}</span>
                      <button className="btn ghost icon" onClick={() => moveSection(k, -1)} disabled={i === 0} aria-label={`Move ${SECTION_LABELS[k]} up`}>
                        <Icon name="up" />
                      </button>
                      <button className="btn ghost icon" onClick={() => moveSection(k, 1)} disabled={i === design.sectionOrder.length - 1} aria-label={`Move ${SECTION_LABELS[k]} down`}>
                        <Icon name="down" />
                      </button>
                      <button className="btn ghost icon" onClick={() => set({ hidden: { ...design.hidden, [k]: !design.hidden[k] } })} aria-label={design.hidden[k] ? 'Show section' : 'Hide section'}>
                        <Icon name={design.hidden[k] ? 'eyeOff' : 'eye'} />
                      </button>
                    </div>
                  ))}
                </div>
              </Ctl>
            </div>
          )}

          {tab === 'publish' && (
            <div className="panel-body">
              <div className="card card-pad stack">
                <div>
                  <h3 className="h3">Export</h3>
                  <p className="hint" style={{ marginTop: 4 }}>
                    One self-contained <span className="mono">index.html</span> — SEO tags, accessible markup, responsive, all animations included.
                  </p>
                </div>
                <div className="row">
                  <button className="btn" onClick={exportHtml}>
                    <Icon name="download" /> Download index.html
                  </button>
                  <button
                    className="btn secondary"
                    onClick={async () => {
                      try {
                        if (needProfile()) return;
                        await navigator.clipboard.writeText(finalHtml());
                        dispatch({ type: 'milestone', key: 'exported' });
                        toast('HTML copied to clipboard');
                      } catch {
                        toast('Clipboard blocked — use Download instead');
                      }
                    }}
                  >
                    <Icon name="copy" /> Copy HTML
                  </button>
                </div>
              </div>
              <div className="card card-pad stack">
                <h3 className="h3">Publish for free</h3>
                <ol className="steps">
                  <li>
                    <b>GitHub Pages:</b> create a repo named <span className="mono">{(state.github.username || 'username').toLowerCase()}.github.io</span>, upload <span className="mono">index.html</span>.
                  </li>
                  <li>
                    <b>Netlify Drop:</b> drag the file onto <span className="mono">app.netlify.com/drop</span>.
                  </li>
                  <li>
                    <b>Vercel / Cloudflare Pages:</b> push to a repo and import it.
                  </li>
                </ol>
              </div>
              <Ctl label="Custom CSS" aside={<span className="hint">full control</span>}>
                <textarea className="textarea code" rows={7} value={design.customCss} onChange={(e) => set({ customCss: e.target.value })} placeholder={`/* Variables: --bg --fg --accent --muted --line --r --pad --font-head */\n.hero h1 { letter-spacing: -0.06em; }`} spellCheck={false} />
              </Ctl>
              <Switch checked={design.liveRepos} onChange={(v) => set({ liveRepos: v })} label="Live GitHub stars on the published site" />
              <div className="card card-pad stack">
                <h3 className="h3">Design file</h3>
                <div className="row">
                  <button className="btn secondary sm" onClick={() => downloadFile(`${slugName(profile.basics.name) || 'my'}-design.json`, JSON.stringify(design, null, 2), 'application/json')}>
                    <Icon name="download" /> Save design
                  </button>
                  <label className="btn secondary sm">
                    <Icon name="upload" /> Load design
                    <input
                      type="file"
                      accept="application/json"
                      hidden
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          snapshot();
                          dispatch({ type: 'design/replace', design: JSON.parse(await f.text()), label: 'Loaded design' });
                          toast('Design loaded');
                        } catch {
                          toast('That file is not a valid design');
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <button className="btn ghost sm" onClick={() => { dispatch({ type: 'design/reset', scope: 'theme' }); toast(`${theme.name} reset to its original look — press Undo to get your changes back`); }}>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="preview-area">
          <div className="preview-bar">
            <Seg value={device} onChange={setDevice} options={[{ value: 'desktop', label: <Icon name="monitor" size={15} /> }, { value: 'tablet', label: <Icon name="tablet" size={15} /> }, { value: 'mobile', label: <Icon name="phone" size={15} /> }]} />
            <div className="url-pill">
              <span className="dot-live" /> {(state.github.username || slugName(profile.basics.name) || 'you').toLowerCase()}.github.io
              {useCode && <span className="badge solid code-on">Your code</span>}
            </div>
            {full && <HistoryBar />}
            <button className="btn ghost icon" title="Replay animations" onClick={() => setReplay((r) => r + 1)}>
              <Icon name="refresh" />
            </button>
            {full ? (
              <button className="btn secondary sm" title="Exit fullscreen (Esc)" onClick={() => setFull(false)}>
                <Icon name="shrink" /> Exit fullscreen
              </button>
            ) : (
              <button className="btn ghost icon" title="Fullscreen preview" onClick={() => setFull(true)}>
                <Icon name="expand" />
              </button>
            )}
            <button className="btn secondary sm" onClick={openTab}>
              <Icon name="external" /> Open
            </button>
            <button className="btn sm" onClick={exportHtml}>
              <Icon name="download" /> Export
            </button>
          </div>
          {blankProfile && (
            <div className="sample-strip">
              <Icon name="eye" size={14} /> <span>You’re seeing a <b>sample</b> person so you can try every theme.</span>
              <button className="btn secondary sm" onClick={() => go('profile')}>
                Add your details
              </button>
            </div>
          )}
          <div className="preview-stage">
            <iframe key={replay} className={`preview-frame ${device}`} title="Portfolio preview" srcDoc={previewHtml} sandbox={useCode ? 'allow-scripts allow-popups' : 'allow-scripts allow-popups allow-same-origin'} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Load every Google Font used by the typography picker so samples render in the real face.
function FontLoader() {
  const loaded = useRef(false);
  if (!loaded.current && typeof document !== 'undefined') {
    loaded.current = true;
    if (!document.querySelector('link[data-font-picker]')) {
      const families = [...new Set(Object.values(FONT_PAIRS).flatMap((f) => f.families))];
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`;
      l.dataset.fontPicker = '1';
      document.head.appendChild(l);
    }
  }
  return null;
}
