import { useEffect, useMemo, useState } from 'react';
import { Icon, Seg } from '../components/ui.jsx';
import { PALETTES, contrast, ensureContrast, finalize, isHex, parseColorText, schemesFromColor } from '../lib/color.js';

const EXAMPLES = ['deep navy with gold', 'soft pastel', 'dark forest green', 'earthy tones', 'bold coral background', 'black with lime', 'white and cobalt', 'dracula', 'warm cream and rust', 'midnight purple'];

function Swatch({ c, label, active, onClick }) {
  return (
    <button className={`swatch ${active ? 'on' : ''}`} onClick={onClick} title={`${c.bg} · ${c.fg} · ${c.accent}`}>
      <span className="swatch-art" style={{ background: c.bg, color: c.fg }}>
        <b>Aa</b>
        <i style={{ background: c.accent }} />
      </span>
      {label && <span className="swatch-name">{label}</span>}
    </button>
  );
}

function ColorRow({ label, value, onChange }) {
  const [draft, setDraft] = useState(value);
  // keep the text box in sync when the colour changes elsewhere (picker, palette, swap)
  useEffect(() => {
    if (document.activeElement?.dataset?.hexFor !== label) setDraft(value);
  }, [value, label]);
  return (
    <div className="color-row">
      <input type="color" className="color-in" value={isHex(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} aria-label={label} />
      <span className="color-label">{label}</span>
      <input
        className="input mono hex-in"
        data-hex-for={label}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = e.target.value.trim();
          if (isHex(v)) onChange(v.toLowerCase());
        }}
        spellCheck={false}
      />
    </div>
  );
}

export default function ColorsPanel({ design, set, snapshot, traits, toast }) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState([]);
  const [base, setBase] = useState(design.colors?.accent && isHex(design.colors.accent) ? design.colors.accent : '#2563eb');
  const generated = useMemo(() => schemesFromColor(base), [base]);
  const c = design.colors || {};
  const custom = design.colorScheme === 'custom';
  const ratio = isHex(c.bg) && isHex(c.fg) ? contrast(c.fg, c.bg) : 0;
  const accentRatio = isHex(c.bg) && isHex(c.accent) ? contrast(c.accent, c.bg) : 0;
  const same = (x) => custom && x.bg === c.bg && x.fg === c.fg && x.accent === c.accent;

  const apply = (colors, msg) => {
    snapshot();
    set({ colorScheme: 'custom', colors: { bg: colors.bg, fg: colors.fg, accent: colors.accent } });
    if (msg) toast(msg);
  };
  const describe = (value = text) => {
    const r = parseColorText(value);
    if (!r) {
      setNotes(['No colours recognised — try colour names (navy, coral, sage, gold…), moods (pastel, earthy, luxury) or hex codes like #1e3a8a.']);
      return;
    }
    if (r.mono) {
      snapshot();
      set({ colorScheme: 'mono', accent: '' });
      setNotes(r.notes);
      return;
    }
    apply(r.colors);
    setNotes(r.notes);
  };
  const imageScheme = traits?.bgColor ? finalize({ bg: traits.bgColor, fg: traits.fgColor, accent: traits.accentColor }) : null;

  return (
    <div className="panel-body">
      <div className="ctl">
        <Seg
          value={design.colorScheme}
          onChange={(v) => {
            snapshot();
            set({ colorScheme: v });
          }}
          options={[
            { value: 'mono', label: 'Black & white' },
            { value: 'custom', label: 'Colour scheme' },
          ]}
        />
      </div>

      {!custom && (
        <>
          <div className="ctl">
            <div className="lbl">Monochrome tone</div>
            <Seg value={design.mode} onChange={(v) => set({ mode: v })} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
            <Seg value={design.paper} onChange={(v) => set({ paper: v })} options={[{ value: 'white', label: 'Pure' }, { value: 'warm', label: 'Warm paper' }, { value: 'cool', label: 'Cool' }]} />
          </div>
          <div className="ctl">
            <div className="lbl">
              <span>Single accent (optional)</span>
              {design.accent && (
                <button className="btn ghost sm" onClick={() => set({ accent: '' })}>
                  Clear
                </button>
              )}
            </div>
            <div className="row">
              <input type="color" value={design.accent || '#000000'} onChange={(e) => set({ accent: e.target.value })} className="color-in" aria-label="Accent colour" />
              <span className="hint">{design.accent ? `Links & highlights use ${design.accent}` : 'Pure black & white — no accent'}</span>
            </div>
          </div>
          <p className="hint">Want real colour? Switch to <b>Colour scheme</b> above, or just pick a palette below.</p>
        </>
      )}

      {custom && (
        <div className="scheme-preview" style={{ background: c.bg, color: c.fg }}>
          <div>
            <span className="sp-eyebrow" style={{ color: c.accent }}>
              Your colour scheme
            </span>
            <b>Aa — Portfolio</b>
            <span style={{ opacity: 0.7 }}>Body text looks like this.</span>
          </div>
          <span className="sp-btn" style={{ background: c.accent, color: c.bg }}>
            Button
          </span>
        </div>
      )}

      <div className="ctl">
        <div className="lbl">Describe the colours you want</div>
        <div className="brief-box">
          <input
            className="input"
            style={{ border: 0, background: 'transparent', boxShadow: 'none' }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && describe()}
            placeholder="e.g. deep navy with gold, or soft pastel pink"
          />
          <div className="brief-foot">
            <span className="hint">Names, moods or #hex codes</span>
            <span className="spacer" />
            <button className="btn sm" onClick={() => describe()}>
              <Icon name="wand" /> Make scheme
            </button>
          </div>
        </div>
        <div className="chips">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="chip"
              onClick={() => {
                setText(ex);
                describe(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
        {notes.length > 0 && (
          <ul className="notes">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="ctl">
        <div className="lbl">Palettes</div>
        <div className="swatch-grid">
          {PALETTES.map((p) => (
            <Swatch key={p.name} c={p} label={p.name} active={same(p)} onClick={() => apply(p, `${p.name} applied`)} />
          ))}
        </div>
      </div>

      <div className="ctl">
        <div className="lbl">
          <span>Generate from one colour</span>
          <input type="color" className="color-in" value={base} onChange={(e) => setBase(e.target.value)} aria-label="Base colour" />
        </div>
        <div className="swatch-grid">
          {generated.map((g) => (
            <Swatch key={g.name} c={g} label={g.name} active={same(g)} onClick={() => apply(g, `${g.name} scheme applied`)} />
          ))}
        </div>
      </div>

      {imageScheme && (
        <div className="ctl">
          <div className="lbl">From your inspiration image</div>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <Swatch c={imageScheme} active={same(imageScheme)} onClick={() => apply(imageScheme, 'Colours taken from your image')} />
            <span className="hint">Background, text and accent picked from the palette of the image(s) in Inspire, adjusted to stay readable.</span>
          </div>
        </div>
      )}

      {custom && (
        <>
          <div className="ctl">
            <div className="lbl">
              <span>Fine-tune</span>
              <button className="btn ghost sm" onClick={() => set({ colors: { ...c, bg: c.fg, fg: c.bg } })} title="Swap background and text">
                <Icon name="shuffle" /> Swap
              </button>
            </div>
            <div className="color-rows">
              <ColorRow label="Background" value={c.bg} onChange={(v) => set({ colors: { ...c, bg: v } })} />
              <ColorRow label="Text" value={c.fg} onChange={(v) => set({ colors: { ...c, fg: v } })} />
              <ColorRow label="Accent" value={c.accent} onChange={(v) => set({ colors: { ...c, accent: v } })} />
            </div>
            <div className={`contrast ${ratio >= 4.5 ? 'ok' : 'bad'}`}>
              <span>
                Text contrast <b className="mono">{ratio.toFixed(1)}:1</b> {ratio >= 7 ? '· AAA' : ratio >= 4.5 ? '· AA' : '· too low to read comfortably'}
              </span>
              {ratio < 4.5 && (
                <button className="btn sm" onClick={() => set({ colors: { ...c, fg: ensureContrast(c.fg, c.bg, 7) } })}>
                  Fix
                </button>
              )}
            </div>
            {accentRatio < 3 && (
              <div className="contrast bad">
                <span>
                  Accent is hard to see <b className="mono">{accentRatio.toFixed(1)}:1</b>
                </span>
                <button className="btn sm" onClick={() => set({ colors: { ...c, accent: ensureContrast(c.accent, c.bg, 3) } })}>
                  Fix
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="ctl">
        <div className="lbl">How much accent?</div>
        <Seg value={design.accentUse} onChange={(v) => set({ accentUse: v })} options={[{ value: 'links', label: 'Subtle — links only' }, { value: 'bold', label: 'Bold — buttons, numbers, tags' }]} />
      </div>
    </div>
  );
}
