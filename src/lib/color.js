// Colour utilities + colour-scheme generation (no AI): palettes, harmonies,
// contrast checking and a plain-English colour parser ("deep navy with gold").

export const isHex = (v) => /^#[0-9a-f]{6}$/i.test(String(v || ''));

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

export function hexToHsl(hex) {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}
export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export const onColor = (hex) => (contrast(hex, '#0a0a0a') >= contrast(hex, '#ffffff') ? '#0a0a0a' : '#ffffff');

// Nudge the text colour toward black/white until it reads well on the background.
export function ensureContrast(fg, bg, min = 4.5) {
  if (contrast(fg, bg) >= min) return fg;
  const target = onColor(bg);
  for (let t = 0.1; t <= 1.001; t += 0.1) {
    const c = mix(fg, target, t);
    if (contrast(c, bg) >= min) return c;
  }
  return target;
}
// Make an accent visible on the background (3:1 is enough for large UI elements).
export const visibleAccent = (accent, bg) => ensureContrast(accent, bg, 3);

export function finalize({ bg, fg, accent }) {
  const f = ensureContrast(fg, bg, 7);
  return { bg, fg: f, accent: visibleAccent(accent || f, bg) };
}

export const PALETTES = [
  { name: 'Ink & Paper', bg: '#f4f0e8', fg: '#1b1916', accent: '#b4532a' },
  { name: 'Midnight', bg: '#0b1120', fg: '#e2e8f0', accent: '#60a5fa' },
  { name: 'Navy & Gold', bg: '#0c1a33', fg: '#f3efe4', accent: '#d4a84b' },
  { name: 'Forest', bg: '#0f1a14', fg: '#e3ede6', accent: '#7fb685' },
  { name: 'Sage', bg: '#eef1ea', fg: '#1f2a22', accent: '#4f7a57' },
  { name: 'Ocean', bg: '#f0f6fa', fg: '#0d2a3a', accent: '#0e7490' },
  { name: 'Terracotta', bg: '#f6ede4', fg: '#2b1d16', accent: '#b9492a' },
  { name: 'Rose', bg: '#fbf1f1', fg: '#2d1a1d', accent: '#b8335f' },
  { name: 'Lavender', bg: '#f3f0fa', fg: '#231d36', accent: '#6d4fc0' },
  { name: 'Coffee', bg: '#f3ebe1', fg: '#2a1f17', accent: '#8b5e3c' },
  { name: 'Mint', bg: '#effaf5', fg: '#12302a', accent: '#0f9f6e' },
  { name: 'Sunset', bg: '#1c1020', fg: '#fbe9e0', accent: '#ff7a59' },
  { name: 'Dracula', bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9' },
  { name: 'Nord', bg: '#2e3440', fg: '#eceff4', accent: '#88c0d0' },
  { name: 'Solarized', bg: '#fdf6e3', fg: '#073642', accent: '#268bd2' },
  { name: 'Gruvbox', bg: '#282828', fg: '#ebdbb2', accent: '#fabd2f' },
  { name: 'Cyber Lime', bg: '#0a0a0a', fg: '#f2f2f2', accent: '#c6ff3d' },
  { name: 'Black & White', bg: '#ffffff', fg: '#0a0a0a', accent: '#0a0a0a' },
];

// Six schemes generated from one colour using colour harmony.
export function schemesFromColor(base) {
  const [h, s] = hexToHsl(base);
  const S = Math.max(s, 0.45);
  return [
    { name: 'Soft light', bg: hslToHex(h, Math.min(s, 0.4), 0.965), fg: hslToHex(h, 0.35, 0.12), accent: base },
    { name: 'Deep dark', bg: hslToHex(h, 0.4, 0.08), fg: hslToHex(h, 0.25, 0.93), accent: hslToHex(h, S, 0.65) },
    { name: 'Bold', bg: base, fg: onColor(base), accent: onColor(base) },
    { name: 'Complementary', bg: hslToHex(h, 0.25, 0.96), fg: hslToHex(h, 0.4, 0.13), accent: hslToHex(h + 180, S, 0.42) },
    { name: 'Analogous', bg: hslToHex(h, 0.35, 0.1), fg: hslToHex(h, 0.2, 0.92), accent: hslToHex(h + 35, 0.75, 0.62) },
    { name: 'Muted', bg: hslToHex(h, 0.12, 0.93), fg: hslToHex(h, 0.15, 0.17), accent: hslToHex(h, 0.35, 0.42) },
  ].map((x) => ({ ...x, ...finalize(x) }));
}

// ---------- plain-English colour parsing ----------
export const COLOR_NAMES = {
  black: '#0a0a0a', white: '#ffffff', grey: '#6b7280', gray: '#6b7280', charcoal: '#2b2d31', slate: '#475569', silver: '#c0c4cc',
  red: '#dc2626', crimson: '#b91c1c', maroon: '#7f1d1d', ruby: '#9b1c31', burgundy: '#6d1a2c', wine: '#5e1b2e',
  orange: '#ea580c', rust: '#b7410e', terracotta: '#c2552f', coral: '#f26b5b', peach: '#f7b89a', amber: '#d97706',
  yellow: '#eab308', gold: '#c9a227', mustard: '#c9a227', cream: '#f5efdc', ivory: '#fbf7ec', beige: '#e9dfcc', sand: '#d9c7a3', tan: '#c8a97e', brown: '#7b4a2b', coffee: '#6f4e37', chocolate: '#4a2c1d',
  lime: '#84cc16', green: '#16a34a', emerald: '#059669', mint: '#5fd3a5', sage: '#8aa68a', olive: '#6b7a2c', forest: '#1f4d33', teal: '#0d9488', turquoise: '#14b8a6',
  cyan: '#06b6d4', sky: '#38bdf8', blue: '#2563eb', cobalt: '#1e4fd8', azure: '#2f80ed', navy: '#14213d', indigo: '#4f46e5',
  purple: '#7c3aed', violet: '#8b5cf6', lavender: '#b9a7e8', lilac: '#c8a2c8', plum: '#6b2d5c', magenta: '#c026d3', pink: '#ec4899', rose: '#e11d48', blush: '#f4c2c2',
};

const MOODS = {
  pastel: { bg: '#fbf6f3', fg: '#2e2a3a', accent: '#b49be0', why: 'Pastel → soft cream background with a lilac accent' },
  earthy: { bg: '#f3ece1', fg: '#2c2117', accent: '#a0522d', why: 'Earthy → sand background, deep brown text, rust accent' },
  luxury: { bg: '#0d0d0d', fg: '#f2ead8', accent: '#c9a227', why: 'Luxury → black with champagne text and gold' },
  ocean: { bg: '#f0f6fa', fg: '#0d2a3a', accent: '#0e7490', why: 'Ocean → pale sea-mist with deep teal' },
  nature: { bg: '#eef1ea', fg: '#1f2a22', accent: '#4f7a57', why: 'Nature → sage background with leaf green' },
  sunset: { bg: '#1c1020', fg: '#fbe9e0', accent: '#ff7a59', why: 'Sunset → dusky plum with a coral glow' },
  candy: { bg: '#fff0f6', fg: '#3a1030', accent: '#e8458b', why: 'Candy → bubblegum pink with hot pink' },
  dracula: { bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9', why: 'Dracula palette' },
  nord: { bg: '#2e3440', fg: '#eceff4', accent: '#88c0d0', why: 'Nord palette' },
  solarized: { bg: '#fdf6e3', fg: '#073642', accent: '#268bd2', why: 'Solarized palette' },
  gruvbox: { bg: '#282828', fg: '#ebdbb2', accent: '#fabd2f', why: 'Gruvbox palette' },
  cyber: { bg: '#0a0a0a', fg: '#f2f2f2', accent: '#c6ff3d', why: 'Cyber → black with acid lime' },
  corporate: { bg: '#f7f9fc', fg: '#0f1b2d', accent: '#1d4ed8', why: 'Corporate → clean white-blue with a trustworthy blue' },
};

const SCHEME_CUES = /\b(theme|background|bg|colou?rs?|colou?r scheme|palette|tones?|shades?|scheme|vibe)\b/;
const has = (text, w) => new RegExp(`(^|[^a-z])(?<!(?:no|not|without)\\s+)${w}([^a-z]|$)`).test(text);

/** Returns { colors, notes } or null when the text asks for no colour scheme. */
export function parseColorText(input, { requireCue = false } = {}) {
  const text = ` ${String(input || '').toLowerCase()} `;
  if (/\b(black and white|monochrome|no colou?rs?|grayscale|greyscale)\b/.test(text)) return { mono: true, notes: ['Strict black & white'] };

  const found = [];
  Object.keys(COLOR_NAMES).forEach((name) => {
    const m = text.match(new RegExp(`(^|[^a-z])${name}([^a-z]|$)`));
    if (m) found.push({ name, at: m.index });
  });
  const hexes = [...text.matchAll(/#[0-9a-f]{6}\b/g)].map((m) => ({ name: m[0], hex: m[0], at: m.index }));
  const colors = [...found.map((f) => ({ ...f, hex: COLOR_NAMES[f.name] })), ...hexes].sort((a, b) => a.at - b.at);
  const mood = Object.keys(MOODS).find((k) => has(text, k));

  if (requireCue && !mood && !(colors.length && SCHEME_CUES.test(text))) return null;
  if (!colors.length && !mood) return null;

  const notes = [];
  const dark = /\b(dark|night|deep|midnight|moody|black background)\b/.test(text);
  const light = /\b(light|bright|airy|white background|soft)\b/.test(text);
  const bold = /\b(bold|vibrant|saturated|solid|full|loud|neon)\b/.test(text);

  if (mood && !colors.length) {
    const m = MOODS[mood];
    notes.push(m.why);
    return { colors: finalize(m), notes };
  }

  // ignore black/white as "base" colours when another colour is present
  const chroma = colors.filter((c) => !['black', 'white', 'grey', 'gray', 'charcoal', 'silver'].includes(c.name));
  const base = (chroma[0] || colors[0]).hex;
  const second = (chroma[1] || null)?.hex;
  const [h, s, l] = hexToHsl(base);
  const name = chroma[0]?.name || colors[0].name;
  let scheme;
  const wantsBlackBg = /\bblack\b/.test(text) && chroma.length;
  const wantsWhiteBg = /\bwhite\b/.test(text) && chroma.length;
  // Naturally dark colours (navy, maroon, forest…) usually mean "make that the background".
  const baseIsDark = l < 0.35 && !light && !wantsWhiteBg;
  // Naturally pale colours (cream, ivory, beige…) are backgrounds by themselves.
  const baseIsPale = l > 0.85 && !dark && !wantsBlackBg;

  if (wantsBlackBg) {
    scheme = { bg: '#0a0a0a', fg: '#f2f2f2', accent: second || base };
    notes.push(`Black background with ${name} as the accent colour`);
  } else if (baseIsDark || (dark && !light)) {
    const bg = baseIsDark ? mix(base, '#000000', 0.35) : hslToHex(h, 0.45, 0.08);
    scheme = { bg, fg: hslToHex(h, 0.25, 0.93), accent: second || hslToHex(h, Math.max(s, 0.6), 0.62) };
    notes.push(`Dark ${name} background with light text`);
  } else if (bold && !wantsWhiteBg) {
    scheme = { bg: base, fg: onColor(base), accent: second || onColor(base) };
    notes.push(`Bold → the whole page in ${name}`);
  } else if (baseIsPale) {
    scheme = { bg: base, fg: hslToHex(h, 0.3, 0.12), accent: second || hslToHex(h, 0.5, 0.35) };
    notes.push(`${name[0].toUpperCase() + name.slice(1)} background with deep, matching text`);
  } else if (wantsWhiteBg) {
    scheme = { bg: '#ffffff', fg: hslToHex(h, 0.4, 0.12), accent: second || base };
    notes.push(`White background with deep ${name} text`);
  } else {
    scheme = { bg: hslToHex(h, 0.35, 0.965), fg: hslToHex(h, 0.4, 0.12), accent: second || base };
    notes.push(`Light ${name}-tinted background with deep ${name} text`);
  }
  if (wantsBlackBg) {
    // accent already described
  } else if (second) notes.push(`${chroma[1].name} used as the accent`);
  else notes.push(`${chroma[0]?.name || colors[0].name} used as the accent`);
  const out = finalize(scheme);
  if (out.fg !== scheme.fg) notes.push('Text colour adjusted for readability (WCAG AA)');
  return { colors: out, notes };
}

// Use an inspiration image's palette as a colour scheme.
export function schemeFromPalette(palette, accentHint) {
  if (!palette?.length) return null;
  const bg = palette[0];
  const fg = palette.slice(1).sort((a, b) => contrast(b, bg) - contrast(a, bg))[0] || onColor(bg);
  const accent =
    accentHint ||
    palette
      .slice(1)
      .filter((c) => c !== fg)
      .sort((a, b) => hexToHsl(b)[1] - hexToHsl(a)[1])[0] ||
    fg;
  return finalize({ bg, fg, accent });
}
