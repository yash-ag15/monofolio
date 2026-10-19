import { useEffect, useMemo, useState } from 'react';
import { Icon, Seg } from '../components/ui.jsx';
import { Pressable, Thumb } from '../components/Thumb.jsx';
import { THEMES, renderPortfolio } from '../portfolio/render.js';
import { PROMPT_EXAMPLES, analyzeImage, describeTraits, designFromPrompt, designFromTraits, designsFromImage, matchThemes, readImageFile, readImageUrl } from '../lib/inspire.js';
import { interpretBrief } from '../portfolio/brief.js';
import { withFreshLook } from '../store.jsx';

const uid = () => Math.random().toString(36).slice(2, 9);

// Draws the layout grid we detected on top of the image, so people can see what was "read".
function LayoutMap({ src, traits, show }) {
  const grid = traits?.grid || [];
  return (
    <div className="insp-main">
      <img src={src} alt="Inspiration" />
      {show && grid.length > 0 && (
        <div className="layout-map" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`, gridTemplateRows: `repeat(${grid.length}, 1fr)` }} aria-hidden="true">
          {grid.flatMap((row, r) => row.map((v, c) => <i key={`${r}-${c}`} style={{ opacity: v > 0.08 ? Math.min(0.75, 0.2 + v) : 0 }} />))}
        </div>
      )}
    </div>
  );
}

export default function InspirePanel({ profile, design, set, snapshot, toast, dispatch, insp }) {
  const [selId, setSelId] = useState(insp[0]?.id);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(true);
  const [showSimilar, setShowSimilar] = useState(false);
  const current = insp.find((i) => i.id === selId) || insp[0];

  // Images analysed by an older version lack layout data — re-read them once.
  useEffect(() => {
    if (!insp.some((i) => !i.traits?.layout)) return;
    let off = false;
    Promise.all(insp.map(async (i) => (i.traits?.layout ? i : { ...i, traits: await analyzeImage(i.src) }))).then((items) => {
      if (!off) dispatch({ type: 'inspiration/set', items });
    });
    return () => {
      off = true;
    };
  }, [insp, dispatch]);

  const addSources = async (loaders) => {
    const room = 4 - insp.length;
    if (room <= 0) return toast('Up to 4 images — remove one first');
    setBusy(true);
    setError('');
    try {
      const added = [];
      for (const [name, load] of loaders.slice(0, room)) {
        const src = await load();
        added.push({ id: uid(), name, src, traits: await analyzeImage(src) });
      }
      dispatch({ type: 'inspiration/set', items: [...insp, ...added] });
      setSelId(added[added.length - 1].id);
      toast('Image read — your designs are ready below');
    } catch (e) {
      setError(e.message || 'Could not read that image.');
    } finally {
      setBusy(false);
    }
  };
  const addFiles = (files) => {
    const list = [...files].filter((f) => f && f.type.startsWith('image/'));
    if (!list.length) return setError('That was not an image file. Try PNG, JPG or WebP.');
    addSources(list.map((f) => [f.name || 'pasted image', () => readImageFile(f)]));
  };
  const addUrl = (u) => addSources([['linked image', () => readImageUrl(u)]]);

  // Ctrl+V: pasted image (e.g. Pinterest “Copy image”) or an image link.
  useEffect(() => {
    const onPaste = (e) => {
      const items = [...(e.clipboardData?.items || [])];
      const img = items.find((i) => i.type.startsWith('image/'));
      if (img) {
        e.preventDefault();
        addFiles([img.getAsFile()]);
        return;
      }
      const text = (e.clipboardData?.getData('text') || '').trim();
      if (/^https?:\/\//i.test(text) && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        addUrl(text);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) return addFiles(e.dataTransfer.files);
    // dragged straight from another browser tab (e.g. Pinterest): we get a link, not a file
    const html = e.dataTransfer.getData('text/html');
    const fromHtml = html && html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const link = fromHtml || e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (link) addUrl(link.split('\n')[0]);
    else setError('Nothing to read in that drop. Try copying the image and pressing Ctrl+V.');
  };

  const t = current?.traits;
  const ready = !!t?.layout;
  const designs = useMemo(() => (ready ? designsFromImage(t, current.src) : []), [ready, t, current?.src]);
  const similar = useMemo(() => (ready ? matchThemes(t, 4) : []), [ready, t]);

  // Whole designs start from a clean look so they never blend with whatever was there before;
  // partial requests ("only the colours") are layered on top of the current design on purpose.
  const preview = (patch, partial = false) => (partial ? { ...design, ...patch } : withFreshLook(design, patch));
  const applyDesign = (patch, title, partial = false) => {
    snapshot();
    dispatch({ type: 'design/replace', design: preview(patch, partial), label: `Inspire: ${title}` });
    toast(`${title} applied — tweak it in Colours, Type and Motion`);
  };

  // "What do you want from this image?"
  const [ask, setAsk] = useState('');
  const [request, setRequest] = useState(null);
  const runRequest = (text = ask) => {
    if (!text.trim() || !ready) return;
    setRequest({ text, ...designFromPrompt(t, current.src, text, design, interpretBrief) });
  };
  // When an image becomes ready (or another one is selected), build the typed request automatically.
  useEffect(() => {
    if (ready && ask.trim()) runRequest();
    else setRequest(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, ready]);

  return (
    <div className="panel-body">
      <label className={`dropzone ${busy ? 'busy' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
        <Icon name="image" size={24} />
        <b>{busy ? 'Reading your image…' : 'Add a design you love'}</b>
        <span>
          Upload, drag in, or <b>paste with Ctrl+V</b>. From Pinterest: right-click the image → <i>Copy image</i> → Ctrl+V here. We build new portfolio designs from its colours and layout — on your device.
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
      <form
        className="url-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) addUrl(url.trim());
          setUrl('');
        }}
      >
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image link (https://i.pinimg.com/…)" />
        <button className="btn secondary sm" type="submit" disabled={!url.trim() || busy}>
          Add
        </button>
      </form>
      {error && <div className="contrast bad">{error}</div>}

      {/* Always visible: people can say what they want before or after adding an image */}
      <div className="ctl ask-box">
        <div className="lbl">
          <span>What do you want from the image?</span>
          <span className="badge">optional</span>
        </div>
        <div className="brief-box">
          <textarea
            className="textarea"
            style={{ minHeight: 76 }}
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                runRequest();
              }
            }}
            placeholder="e.g. Only take the colours · Same layout but dark and animated · Use the photo as a blurred background · Turn it into a terminal"
          />
          <div className="brief-foot">
            <span className="hint">{ready ? 'Enter to build' : busy ? 'Reading your image…' : 'Add an image above — this will be built as soon as it’s read'}</span>
            <span className="spacer" />
            <button className="btn sm" onClick={() => runRequest()} disabled={!ask.trim() || !ready}>
              <Icon name="wand" /> Build it
            </button>
          </div>
        </div>
        <div className="chips">
          {PROMPT_EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="chip"
              onClick={() => {
                setAsk(ex);
                runRequest(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
        {request && (
          <Pressable className="gen-card request" label="Apply your request" onActivate={() => applyDesign(request.patch, 'Your request', request.partial)}>
            <Thumb key={JSON.stringify(request.patch).length + request.text} html={renderPortfolio(profile, preview(request.patch, request.partial), { thumb: true })} scale={0.28} height={190} eager />
            <div className="gen-meta">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b>Your request</b>
                <span className="badge solid">{request.partial ? 'Changes your current design' : `${THEMES[preview(request.patch).layout].name} layout`}</span>
              </div>
              <span className="hint">“{request.text}”</span>
              <ul>
                {request.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <span className="btn sm gen-apply">Use this design</span>
            </div>
          </Pressable>
        )}
      </div>

      {current && (
        <>
          <div className="insp-row">
            {insp.map((im) => (
              <div key={im.id} className={`insp ${im.id === current.id ? 'used' : ''}`}>
                <button className="insp-pick" onClick={() => setSelId(im.id)} aria-label={`Use ${im.name}`}>
                  <img src={im.src} alt={im.name} />
                </button>
                <button
                  className="insp-x"
                  aria-label="Remove image"
                  onClick={() => {
                    const items = insp.filter((x) => x.id !== im.id);
                    dispatch({ type: 'inspiration/set', items });
                    if (im.id === current.id) setSelId(items[0]?.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="ctl">
            <div className="lbl">
              <span>What we read from this image</span>
              <button className="btn ghost sm" onClick={() => setShowMap(!showMap)}>
                {showMap ? 'Hide' : 'Show'} layout map
              </button>
            </div>
            <LayoutMap src={current.src} traits={t} show={showMap} />
            {ready ? (
              <>
                <div className="extracted">
                  {[
                    ['Background', t.bgColor],
                    ['Text', t.fgColor],
                    ['Accent', t.accentColor],
                    ...(t.panelColor ? [['Cards', t.panelColor]] : []),
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ background: v }} />
                      <b>{k}</b>
                      <em className="mono">{v}</em>
                    </div>
                  ))}
                </div>
                <ul className="notes">
                  {describeTraits(t).map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="hint">Reading…</p>
            )}
          </div>

          {ready && (
            <div className="ctl">
              <div className="lbl">Designs built from your image</div>
              <div className="gen-list">
                {designs.map((g) => {
                  const d = preview(g.design);
                  return (
                    <Pressable key={g.id} className="gen-card" label={`Apply ${g.title}`} onActivate={() => applyDesign(g.design, g.title)}>
                      <Thumb html={renderPortfolio(profile, d, { thumb: true })} scale={0.28} height={190} eager />
                      <div className="gen-meta">
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                          <b>{g.title}</b>
                          <span className="badge">{THEMES[g.design.layout].name} layout</span>
                        </div>
                        <ul>
                          {g.why.map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                        <span className="btn sm gen-apply">Use this design</span>
                      </div>
                    </Pressable>
                  );
                })}
              </div>
            </div>
          )}

          {ready && (
            <div className="ctl">
              <div className="lbl">Put this image in your hero</div>
              <Seg
                value={design.heroImage === current.src ? design.heroImageMode : 'none'}
                onChange={(v) => set(v === 'none' ? { heroImageMode: 'none' } : { heroImage: current.src, heroImageMode: v })}
                options={[
                  { value: 'none', label: 'Off' },
                  { value: 'subtle', label: 'Subtle B&W' },
                  { value: 'strong', label: 'Strong B&W' },
                  { value: 'color', label: 'Full colour' },
                ]}
              />
              <Seg
                value={design.heroImageBlur ? 'blur' : 'sharp'}
                onChange={(v) => set({ heroImageBlur: v === 'blur' })}
                options={[
                  { value: 'sharp', label: 'Sharp' },
                  { value: 'blur', label: 'Blurred (best for screenshots with text)' },
                ]}
              />
            </div>
          )}

          {ready && (
            <div className="ctl">
              <button className="btn ghost sm" style={{ justifySelf: 'start' }} onClick={() => setShowSimilar(!showSimilar)}>
                <Icon name={showSimilar ? 'up' : 'down'} /> Similar existing themes, in your image’s colours
              </button>
              {showSimilar && (
                <div className="theme-grid">
                  {similar.map((m) => {
                    const dd = preview(designFromTraits(t, m.key));
                    return (
                      <Pressable key={m.key} className="theme-card" label={`Apply ${THEMES[m.key].name}`} onActivate={() => applyDesign(designFromTraits(t, m.key), THEMES[m.key].name)}>
                        <Thumb html={renderPortfolio(profile, dd, { thumb: true })} scale={0.135} height={118} eager />
                        <div className="theme-meta">
                          <b>{THEMES[m.key].name}</b>
                          <span>{THEMES[m.key].desc}</span>
                        </div>
                      </Pressable>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
