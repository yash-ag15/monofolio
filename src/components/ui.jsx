import { createContext, useCallback, useContext, useRef, useState } from 'react';

// ---------- icons (stroke, currentColor) ----------
const paths = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  layout: 'M3 4h18v16H3zM3 9h18M9 9v11',
  github: 'M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.3 5.8 2.6 5.8 2.6a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21',
  flame: 'M12 22c4 0 7-2.7 7-7 0-4-3-6-4-9-1.5 2-2 3-2 5-1.5-1-2.5-3-2-6C7 7 5 10.5 5 15c0 4.3 3 7 7 7Z',
  file: 'M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  check: 'M4 12.5 9 17.5 20 6.5',
  card: 'M3 6h18v12H3zM7 10h4M7 14h7',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  chevron: 'M9 6l6 6-6 6',
  download: 'M12 4v12M6 10l6 6 6-6M4 20h16',
  upload: 'M12 20V8M6 14l6-6 6 6M4 4h16',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  wand: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M15 9h.01M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5',
  shuffle: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  tablet: 'M6 2h12v20H6zM11 18h2',
  phone: 'M8 2h8v20H8zM11 18h2',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5-1.3',
  badge: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM8.5 14 7 22l5-3 5 3-1.5-8',
  type: 'M4 7V5h16v2M9 19h6M12 5v14',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01',
  palette: 'M12 3a9 9 0 1 0 0 18c1.2 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.3-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10ZM7.5 11a1 1 0 1 0 0-.01M10 7a1 1 0 1 0 0-.01M14.5 7a1 1 0 1 0 0-.01',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7z',
  cube: 'M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10',
  rocket: 'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 13l2 2M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5zM15 9a1 1 0 1 0 0-.01M9 9l-4 1-2 3 4 1M15 15l-1 4-3 2-1-4',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  shrink: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  x: 'M6 6l12 12M18 6 6 18',
  alert: 'M12 7.5v6M12 16.8v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
};

export function Icon({ name, size, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true" {...rest}>
      <path d={paths[name]} />
    </svg>
  );
}

// ---------- form ----------
export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      {label && <span>{label}</span>}
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Text({ label, hint, value, onChange, className, multiline, rows, ...rest }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {multiline ? (
        <textarea className="textarea" rows={rows || 4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
      ) : (
        <input className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
      )}
    </Field>
  );
}

export function Seg({ value, options, onChange }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return (
          <button key={String(v)} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// ---------- repeatable list editor ----------
export function ListEditor({ items, onChange, blank, title, subtitle, render, addLabel = 'Add item', emptyText }) {
  const [open, setOpen] = useState(() => (items.length === 1 ? 0 : -1));
  const update = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    if (open === i) setOpen(j);
  };
  const remove = (i) => {
    onChange(items.filter((_, j) => j !== i));
    setOpen(-1);
  };
  return (
    <div>
      {items.length === 0 && <div className="empty">{emptyText || 'Nothing here yet.'}</div>}
      {items.map((it, i) => (
        <div key={i} className={`item ${open === i ? 'open' : ''}`}>
          <div className="item-head" onClick={() => setOpen(open === i ? -1 : i)}>
            <Icon name="chevron" className="chev" />
            <div className="title">
              {title(it) || <span className="muted">Untitled</span>}
              {subtitle && subtitle(it) && <span className="sub">{subtitle(it)}</span>}
            </div>
            <div className="row" onClick={(e) => e.stopPropagation()}>
              <button className="btn ghost icon" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                <Icon name="up" />
              </button>
              <button className="btn ghost icon" title="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                <Icon name="down" />
              </button>
              <button className="btn ghost icon" title="Remove" onClick={() => remove(i)}>
                <Icon name="trash" />
              </button>
            </div>
          </div>
          {open === i && <div className="item-body">{render(it, (patch) => update(i, patch))}</div>}
        </div>
      ))}
      <button
        className="btn secondary"
        style={{ marginTop: 12 }}
        onClick={() => {
          onChange([...items, blank()]);
          setOpen(items.length);
        }}
      >
        <Icon name="plus" /> {addLabel}
      </button>
    </div>
  );
}

// ---------- toast ----------
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const timer = useRef();
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2400);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export function downloadFile(name, content, type = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
