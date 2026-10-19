import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_DESIGN, SECTION_LABELS, useStore } from '../store.jsx';
import { Icon, Seg, Switch, downloadFile, useToast } from '../components/ui.jsx';
import { CURSORS, FONT_PAIRS, SCENES, THEMES, THEME_CATEGORIES, renderPortfolio, scenePoster, signatureSvg, slugName } from '../portfolio/render.js';
import { BRIEF_EXAMPLES, fingerprint, generateVariation, interpretBrief, uniquenessScore } from '../portfolio/brief.js';
import ColorsPanel from './ColorsPanel.jsx';
import { analyzeImage, averageTraits, describeTraits, designFromTraits, matchThemes, readImageFile } from '../lib/inspire.js';

const TOOLS = [
  { id: 'themes', label: 'Themes', icon: 'grid' },
  { id: 'inspire', label: 'Inspire', icon: 'image' },
  { id: 'brief', label: 'Brief', icon: 'wand' },
  { id: 'colors', label: 'Colours', icon: 'palette' },
  { id: 'style', label: 'Type', icon: 'type' },
  { id: 'motion', label: 'Motion', icon: 'zap' },
  { id: 'three', label: '3D', icon: 'cube' },
  { id: 'layout', label: 'Layout', icon: 'layout' },
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
];
const REVEALS = [
  ['none', 'None'],
  ['fade', 'Fade'],
  ['rise', 'Rise'],
  ['scale', 'Scale'],
  ['blur', 'Blur'],
  ['slide', 'Slide'],
  ['clip', 'Clip wipe'],
];
const BACKGROUNDS = [
  ['none', 'None', 'Plain'],
  ['stars', 'Starfield', 'Warp-speed stars'],
  ['matrix', 'Code rain', 'Falling glyphs'],
  ['gradient', 'Aurora', 'Drifting light blobs'],
  ['grid', 'Retro grid', 'Moving perspective floor'],
  ['dots', 'Reactive dots', 'Dots swell near the cursor'],
  ['waves', 'Waves', 'Flowing line field'],
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
];
const EFFECTS = [
  { key: 'parallax', label: 'Parallax hero', desc: 'Hero drifts and fades as you scroll.' },
  { key: 'counters', label: 'Counting numbers', desc: 'Stats and stars count up when visible.' },
  { key: 'scramble', label: 'Name decode', desc: 'Your name resolves from random glyphs.' },
  { key: 'preloader', label: 'Intro preloader', desc: '000→100 counter that wipes away.' },
  { key: 'progress', label: 'Scroll progress', desc: 'Thin bar tracks reading progress.' },
  { key: 'grain', label: 'Film grain', desc: 'Animated analog noise overlay.' },
];
const INTERACTIONS = [
  { key: 'tilt', label: '3D tilt cards', desc: 'Project cards tilt toward the cursor.' },
  { key: 'magnetic', label: 'Magnetic buttons', desc: 'Buttons pull toward the cursor.' },
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

// Thumbnails mount one after another (not all at once) so the browser loads them smoothly.
let nextSlot = 0;
function scheduleMount(cb) {
  const now = performance.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + 110;
  return setTimeout(cb, at - now);
}

// Live mini-render of a full page, mounted only when scrolled into view.
function Thumb({ html, scale, height, width = 1280, eager = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(eager);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) {
        setVisible(true);
        io.disconnect();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible || show) return;
    const t = scheduleMount(() => setShow(true));
    return () => clearTimeout(t);
  }, [visible, show]);
  return (
    <div className="vthumb" style={{ height }} ref={ref}>
      {show ? <iframe title="Preview" srcDoc={html} tabIndex={-1} sandbox="allow-scripts" style={{ width, height: height / scale, transform: `scale(${scale})` }} /> : <div className="thumb-skel" />}
    </div>
  );
}

function Pressable({ className, onActivate, children, label }) {
  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
    >
      {children}
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

export default function Studio() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { profile, design } = state;
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.hash.split('?')[1] || '').get('tab');
    return TOOLS.some((x) => x.id === t) ? t : 'themes';
  });
  const [cat, setCat] = useState('All');
  const [device, setDevice] = useState('desktop');
  const [full, setFull] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || '').get('full') === '1');
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [varSeed, setVarSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [dragKey, setDragKey] = useState(null);
  const [replay, setReplay] = useState(0);
  const [busy, setBusy] = useState(false);

  const set = (patch) => dispatch({ type: 'design/set', patch });
  const snapshot = () => setHistory((h) => [...h.slice(-19), design]);
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    dispatch({ type: 'design/replace', design: prev });
    setHistory((h) => h.slice(0, -1));
    toast('Reverted to previous design');
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const deferredProfile = useDeferredValue(profile);
  const deferredDesign = useDeferredValue(design);
  const html = useMemo(() => renderPortfolio(deferredProfile, deferredDesign, { preview: true }), [deferredProfile, deferredDesign]);

  const score = uniquenessScore(design, DEFAULT_DESIGN);
  const fp = fingerprint(profile.basics.name, design);
  const theme = THEMES[design.layout] || THEMES.classic;
  const base = theme.base || design.layout;

  const themeKeys = Object.keys(THEMES).filter((k) => cat === 'All' || THEMES[k].cat === cat);
  const themeThumbs = useMemo(
    () => Object.fromEntries(Object.keys(THEMES).map((k) => [k, renderPortfolio(profile, { ...design, layout: k, ...THEMES[k].preset, accent: design.accent, ...(design.colorScheme === 'custom' ? { mode: design.mode } : {}), heroImage: '' }, { thumb: true })])),
    // regenerate when content changes, not on every style tweak
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, design.accent, design.colorScheme, design.colors, design.accentUse]
  );

  const variations = useMemo(
    () => [0, 1, 2, 3].map((i) => generateVariation(design, varSeed + i * 7919)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [varSeed]
  );

  // ---- inspiration
  const insp = state.inspiration || [];
  const traits = useMemo(() => averageTraits(insp.map((i) => i.traits)), [insp]);
  const matches = useMemo(() => (traits ? matchThemes(traits, 4) : []), [traits]);
  const addInspiration = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 4 - insp.length);
    if (!list.length) return toast(insp.length >= 4 ? 'Up to 4 images — remove one first' : 'Please choose image files');
    setBusy(true);
    try {
      const added = [];
      for (const f of list) {
        const src = await readImageFile(f, 1400);
        added.push({ id: Math.random().toString(36).slice(2, 9), name: f.name, src, traits: await analyzeImage(src) });
      }
      dispatch({ type: 'inspiration/set', items: [...insp, ...added] });
      toast(`Analysed ${added.length} image${added.length > 1 ? 's' : ''}`);
    } catch {
      toast('Could not read that image');
    } finally {
      setBusy(false);
    }
  };

  const applyTheme = (key) => {
    snapshot();
    set({ layout: key, ...THEMES[key].preset });
    toast(`${THEMES[key].name} applied — make it yours with Style, Motion and 3D`);
  };

  const applyVariation = (v) => {
    snapshot();
    dispatch({ type: 'design/replace', design: { ...v, brief: design.brief, customCss: design.customCss, modelUrl: design.modelUrl, modelData: design.modelData, embedUrl: design.embedUrl, heroImage: design.heroImage, heroImageMode: design.heroImageMode } });
    toast('Remix applied');
  };

  const applyBrief = () => {
    const { patch, notes: n } = interpretBrief(design.brief, design);
    if (!n.length) {
      setNotes(['No design keywords recognised yet — try “3D”, “terminal”, “newspaper”, “neon”, “animated”, “letters”, “stars background”, “projects first”, “hide education”…']);
      return;
    }
    snapshot();
    set(patch);
    setNotes(n);
    toast(`Applied ${n.length} design decision${n.length > 1 ? 's' : ''}`);
  };

  const exportHtml = () => {
    downloadFile('index.html', renderPortfolio(profile, design), 'text/html');
    toast('Downloaded index.html');
  };
  const openTab = () => {
    const blob = new Blob([renderPortfolio(profile, design)], { type: 'text/html' });
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
      <div className={`studio ${full ? 'is-full' : ''}`}>
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
            <button className="btn ghost sm" onClick={undo} disabled={!history.length} title="Undo">
              <Icon name="undo" /> Undo
            </button>
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

          {tab === 'themes' && (
            <div className="panel-body">
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

          {tab === 'inspire' && (
            <div className="panel-body">
              <label
                className={`dropzone ${busy ? 'busy' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addInspiration(e.dataTransfer.files);
                }}
              >
                <Icon name="image" size={24} />
                <b>{busy ? 'Reading your image…' : 'Drop a design, screenshot or moodboard'}</b>
                <span>We read its brightness, contrast, detail, warmth and colours — and match a portfolio to it. Up to 4 images, analysed on your device.</span>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { addInspiration(e.target.files); e.target.value = ''; }} />
              </label>

              {insp.length > 0 && (
                <>
                  <div className="insp-row">
                    {insp.map((im) => (
                      <div key={im.id} className={`insp ${design.heroImage === im.src ? 'used' : ''}`}>
                        <img src={im.src} alt={im.name} />
                        <button className="insp-x" aria-label="Remove image" onClick={() => dispatch({ type: 'inspiration/set', items: insp.filter((x) => x.id !== im.id) })}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {traits && (
                    <Ctl label="What we see">
                      <div className="palette">
                        {traits.palette.map((c) => (
                          <span key={c} style={{ background: c }} title={c} />
                        ))}
                      </div>
                      <div className="trait-bars">
                        {[
                          ['Darkness', traits.dark],
                          ['Contrast', traits.contrast],
                          ['Detail', traits.busy],
                          ['Warmth', traits.warm],
                          ['Colour', traits.color],
                        ].map(([k, v]) => (
                          <div key={k} className="trait">
                            <span>{k}</span>
                            <div className="progress">
                              <i style={{ width: `${Math.round(v * 100)}%` }} />
                            </div>
                            <span className="mono">{Math.round(v * 100)}</span>
                          </div>
                        ))}
                      </div>
                      <ul className="notes">
                        {describeTraits(traits).map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    </Ctl>
                  )}

                  <Ctl label="Best-matching portfolios" hint="Each one is generated from your image’s traits applied to that theme.">
                    <div className="theme-grid">
                      {matches.map((m) => {
                        const d = { ...design, ...designFromTraits(traits, m.key) };
                        return (
                          <Pressable
                            key={m.key}
                            className="theme-card"
                            label={`Apply ${THEMES[m.key].name} from inspiration`}
                            onActivate={() => {
                              snapshot();
                              set(designFromTraits(traits, m.key));
                              toast(`Applied ${THEMES[m.key].name}, tuned to your image`);
                            }}
                          >
                            <Thumb html={renderPortfolio(profile, d, { thumb: true })} scale={0.135} height={118} eager />
                            <div className="theme-meta">
                              <b>
                                {THEMES[m.key].name} <span className="match">{m.score}% match</span>
                              </b>
                              <span>{THEMES[m.key].desc}</span>
                            </div>
                          </Pressable>
                        );
                      })}
                    </div>
                  </Ctl>

                  <Ctl label="Use an image in your hero" hint="Shown softly behind your name. Pick an image, then a style.">
                    <div className="insp-row">
                      {insp.map((im) => (
                        <button key={im.id} className={`insp pick ${design.heroImage === im.src ? 'used' : ''}`} onClick={() => set({ heroImage: im.src, heroImageMode: design.heroImageMode === 'none' ? 'subtle' : design.heroImageMode })}>
                          <img src={im.src} alt="" />
                        </button>
                      ))}
                    </div>
                    <Seg value={design.heroImageMode} onChange={(v) => set({ heroImageMode: v })} options={[{ value: 'none', label: 'Off' }, { value: 'subtle', label: 'Subtle B&W' }, { value: 'strong', label: 'Strong B&W' }, { value: 'color', label: 'Colour' }]} />
                  </Ctl>
                </>
              )}
            </div>
          )}

          {tab === 'brief' && (
            <div className="panel-body">
              <Ctl label="Describe the portfolio you want, in your own words">
                <div className="brief-box">
                  <textarea
                    className="textarea"
                    value={design.brief}
                    onChange={(e) => set({ brief: e.target.value })}
                    placeholder="e.g. Neon cyberpunk with animated letters, stars background, projects first, hide certifications, a touch of #ff5500…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) applyBrief();
                    }}
                  />
                  <div className="brief-foot">
                    <span className="small muted">Ctrl + Enter</span>
                    <span className="spacer" />
                    <button className="btn sm" onClick={applyBrief}>
                      <Icon name="wand" /> Apply brief
                    </button>
                  </div>
                </div>
              </Ctl>
              {notes.length > 0 && (
                <Ctl label="What we understood">
                  <ul className="notes">
                    {notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </Ctl>
              )}
              <Ctl label="Start from an example">
                <div className="chips">
                  {BRIEF_EXAMPLES.map((ex) => (
                    <button key={ex} className="chip" onClick={() => set({ brief: ex })} title={ex}>
                      {ex.split(',')[0]}
                    </button>
                  ))}
                </div>
              </Ctl>
              <Ctl
                label="Remix — four random directions"
                aside={
                  <button className="btn ghost sm" onClick={() => setVarSeed(Math.floor(Math.random() * 1e6))}>
                    <Icon name="shuffle" /> Shuffle
                  </button>
                }
              >
                <div className="theme-grid">
                  {variations.map((v, i) => (
                    <Pressable key={`${varSeed}-${i}`} className="theme-card" onActivate={() => applyVariation(v)} label={`Apply ${THEMES[v.layout].name} remix`}>
                      <Thumb html={renderPortfolio(profile, v, { thumb: true })} scale={0.135} height={118} eager />
                      <div className="theme-meta">
                        <b>{THEMES[v.layout].name}</b>
                        <span>
                          {FONT_PAIRS[v.fontPair]?.head} · {v.mode} · {v.entrance}
                          {v.hero3d !== 'none' ? ` · ${SCENES[v.hero3d].name}` : ''}
                        </span>
                      </div>
                    </Pressable>
                  ))}
                </div>
              </Ctl>
            </div>
          )}

          {tab === 'colors' && <ColorsPanel design={design} set={set} snapshot={snapshot} traits={traits} toast={toast} />}

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
                <Seg value={design.revealStyle} onChange={(v) => set({ revealStyle: v, motion: design.motion === 'none' ? 'subtle' : design.motion })} options={REVEALS.map(([value, label]) => ({ value, label }))} />
              </Ctl>
              <Ctl label="Section titles">
                <Seg value={design.titleAnim} onChange={(v) => set({ titleAnim: v })} options={[{ value: 'none', label: 'Static' }, { value: 'letters', label: 'Letters' }, { value: 'line', label: 'Underline draw' }, { value: 'scramble', label: 'Decode' }]} />
              </Ctl>
              <Ctl label="Animated background">
                <Choice items={BACKGROUNDS} value={design.bgAnim} onChange={(v) => set({ bgAnim: v })} />
              </Ctl>
              <Ctl label="Card hover">
                <Seg value={design.cardHover} onChange={(v) => set({ cardHover: v })} options={[{ value: 'none', label: 'None' }, { value: 'lift', label: 'Lift' }, { value: 'zoom', label: 'Zoom image' }, { value: 'outline', label: 'Outline' }, { value: 'invert', label: 'Invert' }]} />
              </Ctl>
              <Ctl label="Link hover">
                <Seg value={design.linkStyle} onChange={(v) => set({ linkStyle: v })} options={[{ value: 'underline', label: 'Underline' }, { value: 'slide', label: 'Slide in' }, { value: 'highlight', label: 'Highlight' }, { value: 'arrow', label: 'Arrow' }]} />
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
                        await navigator.clipboard.writeText(renderPortfolio(profile, design));
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
                          dispatch({ type: 'design/replace', design: JSON.parse(await f.text()) });
                          toast('Design loaded');
                        } catch {
                          toast('That file is not a valid design');
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <button className="btn ghost sm" onClick={() => { snapshot(); dispatch({ type: 'design/replace', design: { ...DEFAULT_DESIGN } }); toast('Design reset'); }}>
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
            </div>
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
          <div className="preview-stage">
            <iframe key={replay} className={`preview-frame ${device}`} title="Portfolio preview" srcDoc={html} sandbox="allow-scripts allow-popups allow-same-origin" />
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
