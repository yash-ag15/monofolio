import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { isBlankProfile, previewProfile, useStore } from '../store.jsx';
import { Icon, Seg, Switch, useToast } from '../components/ui.jsx';
import { CARD_DESIGNS, CARD_SIZES, DevCard, cardData } from '../card/designs.jsx';

const DEFAULTS = { mode: 'dark', accent: '#f5f5f5', photo: true, qr: true, qrLink: '', skills: true, socials: true, watermark: false };
const ACCENTS = ['#f5f5f5', '#111111', '#6366f1', '#22c55e', '#f97316', '#ec4899', '#06b6d4', '#eab308', '#ef4444'];
const onColor = (hex) => {
  const n = parseInt(String(hex).slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150 ? '#0b0b0b' : '#ffffff';
};

// every font the card designs use (Inter 800 is used for the big names)
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;700&family=Caveat:wght@600;700&display=swap';

function useCardFonts() {
  useEffect(() => {
    if (document.getElementById('card-fonts')) return;
    const l = document.createElement('link');
    l.id = 'card-fonts';
    l.rel = 'stylesheet';
    l.href = FONTS_URL;
    document.head.appendChild(l);
  }, []);
}

// The exporter can't read Google's stylesheet itself, so fetch it once and inline the (Latin) font
// files as data URLs — the PNG/PDF then uses the real fonts instead of a fallback.
let fontCssCache = null;
const toDataUrl = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
function embeddedFonts() {
  if (!fontCssCache)
    fontCssCache = (async () => {
      const css = await (await fetch(FONTS_URL)).text();
      const latin = css
        .split(/(?=\/\* [a-z-]+ \*\/)/)
        .filter((b) => /^\/\* latin \*\//.test(b))
        .join('\n');
      let out = latin;
      const urls = [...new Set(latin.match(/https:\/\/fonts\.gstatic\.com\/[^)\s]+/g) || [])];
      const files = await Promise.all(urls.map(async (u) => [u, await toDataUrl(await (await fetch(u)).blob())]));
      files.forEach(([u, d]) => (out = out.split(u).join(d)));
      return out;
    })().catch(() => {
      fontCssCache = null; // offline — try again next time; this export uses fallback fonts
      return '';
    });
  return fontCssCache;
}

export default function Card({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  useCardFonts();
  const saved = state.card || {};
  const design = CARD_DESIGNS.find((d) => d.id === saved.design) || CARD_DESIGNS[0];
  const size = design.sizes.includes(saved.size) ? saved.size : design.sizes[0];
  const opts = { ...DEFAULTS, ...saved.opts };
  const set = (patch) => dispatch({ type: 'card/set', patch });
  const setOpt = (patch) => set({ opts: { ...saved.opts, ...patch } });

  const blankProfile = isBlankProfile(state.profile);
  const data = useMemo(() => cardData(previewProfile(state.profile), state.github), [state.profile, state.github]);
  // the QR code points only to a link the user types in (nothing is filled in for them)
  const qrLink = String(opts.qrLink || '').trim();
  const qrUrl = !qrLink ? '' : /^(https?:|mailto:)/i.test(qrLink) ? qrLink : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(qrLink) ? `mailto:${qrLink}` : `https://${qrLink}`;
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (!qrUrl) return setQr('');
    QRCode.toDataURL(qrUrl, { margin: 1, width: 360, color: { dark: '#000000', light: '#ffffff' } }).then(setQr, () => setQr(''));
  }, [qrUrl]);

  const full = { ...opts, accent: opts.accent };
  const style = { '--on-accent': onColor(opts.accent) };

  // fit the real-size card into the stage
  const stage = useRef(null);
  const node = useRef(null);
  const [box, setBox] = useState({ w: 900, h: 600 });
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth - 56, h: el.clientHeight - 56 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const S = CARD_SIZES[size];
  const scale = Math.min(1, box.w / S.w, box.h / S.h);

  const [busy, setBusy] = useState('');
  const render = async () => {
    const el = node.current;
    if (document.fonts?.ready) await document.fonts.ready;
    // small sizes are exported at 2x so they stay sharp when printed or zoomed
    return toPng(el, { pixelRatio: S.w < 1200 && S.h < 1200 ? 2 : 1, cacheBust: true, fontEmbedCSS: await embeddedFonts(), style: { transform: 'none', boxShadow: 'none' } });
  };
  const fileBase = `${(data.first || 'dev').toLowerCase()}-${design.id}-${size}`;
  // downloads never contain the sample person
  const needProfile = () => {
    if (!blankProfile) return false;
    toast('Add your details in Dev Identity first — this card is only a sample');
    return true;
  };
  const savePng = async () => {
    if (needProfile()) return;
    setBusy('png');
    try {
      const url = await render();
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileBase}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('Card saved as PNG');
      dispatch({ type: 'milestone', key: 'cardMade' });
    } catch (e) {
      toast('Couldn’t export the image — try again');
      console.error(e);
    } finally {
      setBusy('');
    }
  };
  const savePdf = async () => {
    if (needProfile()) return;
    setBusy('pdf');
    try {
      const url = await render();
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: S.w >= S.h ? 'landscape' : 'portrait', unit: 'px', format: [S.w, S.h], hotfixes: ['px_scaling'] });
      pdf.addImage(url, 'PNG', 0, 0, S.w, S.h);
      pdf.save(`${fileBase}.pdf`);
      toast('Card saved as PDF');
      dispatch({ type: 'milestone', key: 'cardMade' });
    } catch (e) {
      toast('Couldn’t export the PDF — try again');
      console.error(e);
    } finally {
      setBusy('');
    }
  };
  const copyImg = async () => {
    if (needProfile()) return;
    setBusy('copy');
    try {
      const blob = await (await fetch(await render())).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('Image copied — paste it into LinkedIn, WhatsApp or anywhere');
      dispatch({ type: 'milestone', key: 'cardMade' });
    } catch {
      toast('Your browser blocked copying images — use PNG instead');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="page page-wide">
      <div className="card-app">
        <aside className="card-panel">
          <div>
            <h1 className="panel-title">Dev profile card</h1>
            <p className="hint">A shareable card for LinkedIn, events, your email signature or printing — built from your Dev Identity.</p>
          </div>

          <div className="ctl">
            <div className="lbl">
              <span>Design</span>
              <span className="muted small">{CARD_DESIGNS.length} styles</span>
            </div>
            <div className="card-designs">
              {CARD_DESIGNS.map((d) => {
                const sz = d.sizes.includes(size) ? size : d.sizes[0];
                const s = CARD_SIZES[sz];
                const k = Math.min(168 / s.w, 92 / s.h);
                return (
                  <button key={d.id} className={`card-thumb ${d.id === design.id ? 'on' : ''}`} onClick={() => set({ design: d.id, size: d.sizes.includes(size) ? size : d.sizes[0] })} title={d.desc}>
                    <div className="mini">
                      <div style={{ transform: `translate(-50%, -50%) scale(${k})`, ...style }}>
                        <DevCard design={d.id} size={sz} data={data} opts={full} qr={qr} />
                      </div>
                    </div>
                    <b>{d.name}</b>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ctl">
            <div className="lbl">Size</div>
            <div className="size-list">
              {Object.entries(CARD_SIZES).map(([k, v]) => (
                <button key={k} className={`size-opt ${k === size ? 'on' : ''}`} disabled={!design.sizes.includes(k)} onClick={() => set({ size: k })} title={design.sizes.includes(k) ? '' : `${design.name} isn’t made for this size`}>
                  {v.label}
                  <span>
                    {v.w}×{v.h}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="ctl">
            <div className="lbl">Colours</div>
            <Seg value={opts.mode} onChange={(v) => setOpt({ mode: v })} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
            <div className="swatches">
              {ACCENTS.map((c) => (
                <button key={c} className={opts.accent === c ? 'on' : ''} style={{ background: c }} onClick={() => setOpt({ accent: c })} aria-label={`Accent ${c}`} />
              ))}
              <input type="color" className="color-in" value={opts.accent} onChange={(e) => setOpt({ accent: e.target.value })} title="Custom accent" />
            </div>
          </div>

          <div className="ctl">
            <div className="lbl">Show</div>
            <Switch checked={opts.photo} onChange={(v) => setOpt({ photo: v })} label={data.avatar ? 'Profile photo' : 'Initials (add a photo in Dev Identity)'} />
            <Switch checked={opts.skills} onChange={(v) => setOpt({ skills: v })} label="Skills" />
            <Switch checked={opts.socials} onChange={(v) => setOpt({ socials: v })} label="GitHub & LinkedIn" />
            <Switch checked={opts.qr} onChange={(v) => setOpt({ qr: v })} label="QR code" />
            {opts.qr && (
              <label className="field">
                <span>Link for the QR code</span>
                <input className="input" value={opts.qrLink || ''} onChange={(e) => setOpt({ qrLink: e.target.value })} placeholder="https://your-portfolio.com" spellCheck={false} />
                <small>{qrUrl ? `Scanning opens ${qrUrl.replace(/^mailto:/, '')}` : 'Paste your portfolio (or any) link — the QR code appears once you add one.'}</small>
              </label>
            )}
            <Switch checked={opts.watermark} onChange={(v) => setOpt({ watermark: v })} label="Small “monofolio” mark" />
          </div>
          <p className="hint">
            Name, role, skills and stats come from your{' '}
            <button className="linklike" onClick={() => go('profile')}>
              Dev Identity
            </button>
            .
          </p>
        </aside>

        <section className="card-main">
          <div className="preview-bar">
            <b className="small">
              {design.name} · {S.label}
            </b>
            <span className="muted small">
              {S.w}×{S.h}px
            </span>
            <span className="spacer" />
            <button className="btn ghost sm" onClick={copyImg} disabled={!!busy}>
              <Icon name="copy" /> {busy === 'copy' ? 'Copying…' : 'Copy image'}
            </button>
            <button className="btn ghost sm" onClick={savePdf} disabled={!!busy}>
              {busy === 'pdf' ? 'Saving…' : 'PDF'}
            </button>
            <button className="btn sm" onClick={savePng} disabled={!!busy}>
              <Icon name="download" /> {busy === 'png' ? 'Saving…' : 'PNG'}
            </button>
          </div>
          {blankProfile && (
            <div className="sample-strip">
              <Icon name="eye" size={14} /> <span>This card shows a <b>sample</b> person until you add your details.</span>
              <button className="btn secondary sm" onClick={() => go('profile')}>
                Add your details
              </button>
            </div>
          )}
          <div className="card-stage" ref={stage}>
            <div className="card-scale" style={{ width: S.w * scale, height: S.h * scale, ...style }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: S.w, height: S.h }}>
                <DevCard design={design.id} size={size} data={data} opts={full} qr={qr} innerRef={node} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
