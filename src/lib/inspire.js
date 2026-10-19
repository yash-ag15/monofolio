// "Inspire from an image" — reads a design screenshot / moodboard / photo in the browser
// (no AI, nothing uploaded) and turns its visual traits into design decisions.

import { THEMES } from '../portfolio/render.js';

export function readImageFile(file, max = 1400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const clamp = (v) => Math.max(0, Math.min(1, v));
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
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

export function analyzeImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const N = 96;
      const c = document.createElement('canvas');
      c.width = N;
      c.height = N;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, N, N);
      const px = ctx.getImageData(0, 0, N, N).data;
      const L = new Float32Array(N * N);
      let sumL = 0, sumR = 0, sumB = 0, sumS = 0;
      const buckets = new Map();
      for (let i = 0; i < N * N; i++) {
        const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        L[i] = lum;
        sumL += lum;
        sumR += r;
        sumB += b;
        const [, s, l] = rgbToHsl(r, g, b);
        const sat = s * (1 - Math.abs(2 * l - 1));
        sumS += sat;
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0, sat: 0 };
        e.n++;
        e.r += r;
        e.g += g;
        e.b += b;
        e.sat += sat;
        buckets.set(key, e);
      }
      const total = N * N;
      const meanL = sumL / total;
      let varL = 0, edges = 0;
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const i = y * N + x;
          varL += (L[i] - meanL) ** 2;
          if (x < N - 1) edges += Math.abs(L[i] - L[i + 1]);
          if (y < N - 1) edges += Math.abs(L[i] - L[i + N]);
        }
      }
      const std = Math.sqrt(varL / total);
      // dominant background tone & how much "empty" space shares it
      const hist = new Array(20).fill(0);
      L.forEach((v) => hist[Math.min(19, Math.floor(v * 20))]++);
      const modeBin = hist.indexOf(Math.max(...hist));
      let flat = 0;
      L.forEach((v) => {
        if (Math.abs(v - (modeBin + 0.5) / 20) < 0.07) flat++;
      });

      const colors = [...buckets.values()]
        .map((e) => ({ r: e.r / e.n, g: e.g / e.n, b: e.b / e.n, n: e.n, sat: e.sat / e.n }))
        .sort((a, b) => b.n - a.n);
      const palette = [];
      for (const col of colors) {
        if (palette.length >= 6) break;
        if (palette.every((p) => Math.hypot(p.r - col.r, p.g - col.g, p.b - col.b) > 48)) palette.push(col);
      }
      const accentCol = colors.filter((x) => x.sat > 0.3 && x.n / total > 0.008).sort((a, b) => b.sat * Math.sqrt(b.n) - a.sat * Math.sqrt(a.n))[0];

      resolve({
        dark: clamp(1 - meanL),
        contrast: clamp(std / 0.38),
        busy: clamp((edges / (total * 2)) * 7),
        warm: clamp(0.5 + ((sumR - sumB) / total / 255) * 2.2),
        color: clamp((sumS / total) * 3),
        space: clamp(flat / total),
        palette: palette.map((p) => hex(p.r, p.g, p.b)),
        accent: accentCol ? hex(accentCol.r, accentCol.g, accentCol.b) : '',
      });
    };
    img.src = src;
  });
}

export function averageTraits(list) {
  if (!list.length) return null;
  const keys = ['dark', 'contrast', 'busy', 'warm', 'color', 'space'];
  const out = {};
  keys.forEach((k) => (out[k] = list.reduce((a, t) => a + t[k], 0) / list.length));
  out.palette = [...new Set(list.flatMap((t) => t.palette))].slice(0, 8);
  out.accent = list.map((t) => t.accent).find(Boolean) || '';
  return out;
}

// Rank every theme against the image's traits using each theme's signature.
export function matchThemes(t, count = 4) {
  const W = [1.6, 1, 1.1, 0.6];
  const v = [t.dark, t.contrast, t.busy, t.warm];
  return Object.entries(THEMES)
    .map(([key, th]) => {
      const sig = th.sig || [0.5, 0.5, 0.5, 0.5];
      const dist = sig.reduce((a, s, i) => a + W[i] * (s - v[i]) ** 2, 0);
      return { key, score: Math.round(100 * Math.max(0, 1 - dist / 0.45)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function describeTraits(t) {
  const notes = [];
  notes.push(t.dark > 0.55 ? `Mostly dark (${Math.round(t.dark * 100)}%) → dark mode` : `Mostly light (${Math.round((1 - t.dark) * 100)}%) → light mode`);
  if (t.contrast > 0.65) notes.push('High contrast → bold, heavy type and hard edges');
  else if (t.contrast < 0.35) notes.push('Soft, low contrast → quiet, airy layouts');
  if (t.busy > 0.55) notes.push('Lots of detail → denser layouts and tighter spacing');
  else if (t.space > 0.5) notes.push('Plenty of empty space → generous whitespace');
  if (t.warm > 0.6) notes.push('Warm tones → warm paper background');
  else if (t.warm < 0.4) notes.push('Cool tones → cool neutral background');
  if (t.color > 0.25 && t.accent) notes.push(`Strong colour detected → single accent ${t.accent}, everything else monochrome`);
  else notes.push('Little colour → strict black & white');
  return notes;
}

export function designFromTraits(t, themeKey) {
  const th = THEMES[themeKey];
  return {
    layout: themeKey,
    ...th.preset,
    mode: t.dark > 0.55 ? 'dark' : 'light',
    paper: t.warm > 0.6 ? 'warm' : t.warm < 0.4 ? 'cool' : 'white',
    density: t.busy > 0.55 ? 'tight' : t.space > 0.5 ? 'airy' : 'normal',
    border: t.contrast > 0.7 ? 'bold' : th.preset.border || 'hairline',
    scale: t.contrast > 0.6 ? 'large' : th.preset.scale || 'regular',
    accent: t.color > 0.25 ? t.accent : '',
    grain: t.busy > 0.45 && t.contrast < 0.5 ? true : th.preset.grain || false,
  };
}
