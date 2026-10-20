// "Inspire from an image" — reads a design screenshot / Pinterest pin / photo in the browser
// (no AI, nothing uploaded) and builds NEW portfolio designs from what it sees:
// its colours (background, text, accent), its layout structure and its mood.

import { THEMES } from '../portfolio/render.js';
import { cleanBackground, contrast, ensureContrast, finalize, hexToHsl, mix, onColor, rgbToHex } from './color.js';

// ---------- loading ----------

export function readImageFile(file, max = 1400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resizeDataUrl(reader.result, max).then(resolve, reject);
    reader.readAsDataURL(file);
  });
}

function resizeDataUrl(src, max) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('This file is not an image the browser can read.'));
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.84));
    };
    img.src = src;
  });
}

// Images dragged from another tab / pasted links (e.g. i.pinimg.com). Works when the host allows it.
export async function readImageUrl(url, max = 1400) {
  const u = String(url || '').trim();
  if (!/^https?:\/\//i.test(u)) throw new Error('That is not an image link.');
  if (/pinterest\.[a-z.]+\/pin\//i.test(u)) {
    throw new Error('That is a Pinterest page link, not the image. Open the pin, right-click the image → “Copy image”, then press Ctrl+V here.');
  }
  let res;
  try {
    res = await fetch(u, { mode: 'cors' });
  } catch {
    throw new Error('That website blocks loading its images from here. Right-click the image → “Copy image”, then press Ctrl+V here (or save it and upload).');
  }
  if (!res.ok) throw new Error(`Could not load the image (${res.status}).`);
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Error('That link is a web page, not an image. Right-click the image itself → “Copy image address” or “Copy image”.');
  return readImageFile(new File([blob], 'linked-image', { type: blob.type }), max);
}

// ---------- analysis ----------

const clamp = (v) => Math.max(0, Math.min(1, v));

export function analyzeImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => resolve(analyzePixels(img));
    img.src = src;
  });
}

function analyzePixels(img) {
  const W = 120;
  const H = Math.max(40, Math.min(260, Math.round((W * img.height) / img.width)));
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;
  const N = W * H;
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N), L = new Float32Array(N), S = new Float32Array(N);
  const buckets = new Map();
  const add = (map, key, r, g, b) => {
    const e = map.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    map.set(key, e);
  };
  let sumL = 0, sumS = 0, sumR = 0, sumB = 0;
  for (let i = 0; i < N; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    R[i] = r;
    G[i] = g;
    B[i] = b;
    L[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    S[i] = mx === 0 ? 0 : (mx - mn) / 255;
    sumL += L[i];
    sumS += S[i];
    sumR += r;
    sumB += b;
    add(buckets, ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4), r, g, b);
  }
  const avg = (e) => [e.r / e.n, e.g / e.n, e.b / e.n];

  // Background = the most common colour along the image border (where page backgrounds live).
  const border = new Map();
  for (let x = 0; x < W; x++)
    for (const y of [0, 1, H - 2, H - 1]) {
      const i = y * W + x;
      add(border, ((R[i] >> 4) << 8) | ((G[i] >> 4) << 4) | (B[i] >> 4), R[i], G[i], B[i]);
    }
  for (let y = 0; y < H; y++)
    for (const x of [0, 1, W - 2, W - 1]) {
      const i = y * W + x;
      add(border, ((R[i] >> 4) << 8) | ((G[i] >> 4) << 4) | (B[i] >> 4), R[i], G[i], B[i]);
    }
  const borderTop = [...border.values()].sort((a, b) => b.n - a.n)[0];
  const borderTotal = [...border.values()].reduce((a, e) => a + e.n, 0);
  const allTop = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  const bgRGB = borderTop.n / borderTotal > 0.25 ? avg(borderTop) : avg(allTop);
  const bgColor = rgbToHex(...bgRGB);
  const bgL = (0.2126 * bgRGB[0] + 0.7152 * bgRGB[1] + 0.0722 * bgRGB[2]) / 255;

  // Content mask: anything clearly different from the background.
  const content = new Uint8Array(N);
  let contentCount = 0;
  for (let i = 0; i < N; i++) {
    const d = Math.hypot(R[i] - bgRGB[0], G[i] - bgRGB[1], B[i] - bgRGB[2]);
    if (d > 40) {
      content[i] = 1;
      contentCount++;
    }
  }

  // Coarse layout grid (12 columns like a web grid).
  const cols = 12;
  const rows = Math.max(8, Math.min(28, Math.round((cols * H) / W)));
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor((c * W) / cols), x1 = Math.floor(((c + 1) * W) / cols);
      const y0 = Math.floor((r * H) / rows), y1 = Math.floor(((r + 1) * H) / rows);
      let n = 0, t = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          n += content[y * W + x];
          t++;
        }
      row.push(n / Math.max(1, t));
    }
    grid.push(row);
  }
  const occ = grid.map((row) => row.map((v) => v > 0.08));

  // --- layout features ---
  let massX = 0, mass = 0;
  grid.forEach((row) =>
    row.forEach((v, c) => {
      massX += v * (c + 0.5);
      mass += v;
    })
  );
  massX = mass ? massX / mass / cols : 0.5;
  let sym = 0;
  grid.forEach((row) => row.forEach((v, c) => (sym += Math.abs(v - row[cols - 1 - c]))));
  const symmetry = clamp(1 - sym / (rows * cols * 0.5));
  const colOcc = Array.from({ length: cols }, (_, c) => occ.filter((row) => row[c]).length / rows);
  const edgeEmpty = colOcc[0] + colOcc[1] + colOcc[cols - 1] + colOcc[cols - 2] < 0.6;
  const centered = Math.abs(massX - 0.5) < 0.07 && symmetry > 0.78 && edgeEmpty;

  const halfL = (x0, x1) => {
    let s = 0, n = 0;
    for (let y = 0; y < H; y++)
      for (let x = x0; x < x1; x++) {
        s += L[y * W + x];
        n++;
      }
    return s / n;
  };
  let split = Math.abs(halfL(0, W / 2) - halfL(W / 2, W)) > 0.33;

  const leftL = halfL(0, Math.floor(W * 0.28)), restL = halfL(Math.floor(W * 0.32), W);
  const gapCol = colOcc.slice(2, 5).some((v) => v < 0.15);
  let sidebar = !split && ((colOcc[0] + colOcc[1] > 1.1 && gapCol) || Math.abs(leftL - restL) > 0.14) && massX < 0.55;

  // Separate blocks (cards / tiles) = connected components on the occupancy grid.
  const seen = occ.map((row) => row.map(() => false));
  const comps = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (!occ[r][c] || seen[r][c]) continue;
      let size = 0;
      const stack = [[r, c]];
      seen[r][c] = true;
      while (stack.length) {
        const [y, x] = stack.pop();
        size++;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dy, dx]) => {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && occ[ny][nx] && !seen[ny][nx]) {
            seen[ny][nx] = true;
            stack.push([ny, nx]);
          }
        });
      }
      comps.push(size);
    }
  let blocks = comps.filter((s) => s >= 2).length;

  // Finer pass for surfaces: cards, sidebars and half-screen panels are solid rectangles that differ
  // (even slightly) from the background. Text and icons don't fill their bounding box, so they're ignored.
  const boxes = findBoxes(img, bgRGB);
  const sidebarBox = boxes.some((b) => b.x0 < 0.03 && b.h > 0.7 && b.w > 0.12 && b.w < 0.45);
  const splitBox = boxes.some((b) => (b.x0 < 0.03 || b.x1 > 0.97) && b.h > 0.85 && b.w > 0.38 && b.w < 0.62);
  const cardCount = boxes.filter((b) => b.area < 0.35).length;
  blocks = Math.max(blocks, cardCount);

  if (splitBox) split = true;
  if (sidebarBox && !split) sidebar = true;

  // A second large flat colour that isn't the background = card/panel surfaces.
  const flat = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  const panel = flat.find((e) => e.n / N > 0.08 && Math.hypot(...avg(e).map((v, k) => v - bgRGB[k])) > 18);

  // Text columns: empty columns sitting between occupied columns in the middle band.
  let columns = 1;
  for (let c = 1; c < cols - 1; c++) if (colOcc[c] < 0.12 && colOcc[c - 1] > 0.4 && colOcc[c + 1] > 0.4) columns++;

  // Photograph vs flat graphic: UI/graphic designs are dominated by a few flat colours;
  // photos spread across many shades with no dominant ones.
  const distinct = [...buckets.values()].filter((e) => e.n / N > 0.002).length;
  const top5Share = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 5).reduce((a, e) => a + e.n, 0) / N;
  let edges = 0;
  for (let y = 0; y < H - 1; y++)
    for (let x = 0; x < W - 1; x++) {
      const i = y * W + x;
      edges += Math.abs(L[i] - L[i + 1]) + Math.abs(L[i] - L[i + W]);
    }
  const busy = clamp((edges / (N * 2)) * 7);
  // Soft gradients (small but non-zero steps between neighbours) are typical of photos; UI is flat + sharp edges.
  let soft = 0;
  for (let y = 0; y < H - 1; y++)
    for (let x = 0; x < W - 1; x++) {
      const d = Math.abs(L[y * W + x] - L[y * W + x + 1]);
      if (d > 0.006 && d < 0.08) soft++;
    }
  const softShare = soft / ((W - 1) * (H - 1));
  const photo = softShare > 0.3 || (top5Share < 0.42 && distinct > 35);

  // Big type: a tall run of rows with lots of real "ink" (strong lightness contrast with the
  // background) in the top 45% of a graphic. Never on photos, where hills and skies fool it.
  let run = 0, best = 0;
  for (let y = 0; y < Math.floor(H * 0.45) && !photo; y++) {
    let ink = 0;
    for (let x = 0; x < W; x++) ink += Math.abs(L[y * W + x] - bgL) > 0.35 ? 1 : 0;
    if (ink / W > 0.18) {
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }
  const bigType = best / H > 0.1;

  // --- colours ---
  const meanL = sumL / N;
  let varL = 0;
  for (let i = 0; i < N; i++) varL += (L[i] - meanL) ** 2;
  const std = Math.sqrt(varL / N);
  const colorsList = [...buckets.values()].map((e) => ({ hex: rgbToHex(...avg(e)), n: e.n, sat: (() => { const [, s, l] = hexToHsl(rgbToHex(...avg(e))); return s * (1 - Math.abs(2 * l - 1)); })() })).sort((a, b) => b.n - a.n);
  const palette = [];
  for (const c of colorsList) {
    if (palette.length >= 6) break;
    const [r1, g1, b1] = [parseInt(c.hex.slice(1, 3), 16), parseInt(c.hex.slice(3, 5), 16), parseInt(c.hex.slice(5, 7), 16)];
    if (palette.every((p) => Math.hypot(r1 - parseInt(p.slice(1, 3), 16), g1 - parseInt(p.slice(3, 5), 16), b1 - parseInt(p.slice(5, 7), 16)) > 48)) palette.push(c.hex);
  }
  // text colour = the most frequent colour that contrasts strongly with the background
  const textCand = colorsList.filter((c) => c.n / N > 0.004 && contrast(c.hex, bgColor) > 4.5).sort((a, b) => b.n - a.n)[0];
  const fgColor = ensureContrast(textCand ? textCand.hex : onColor(bgColor), bgColor, 7);
  // Accents are usually small (a button, a label) — so allow tiny areas, but require real saturation.
  const accentCand = colorsList.filter((c) => c.sat > 0.22 && c.n >= Math.max(4, N * 0.0005) && contrast(c.hex, bgColor) > 1.6).sort((a, b) => b.sat * Math.sqrt(b.n) - a.sat * Math.sqrt(a.n))[0];
  const color = clamp((sumS / N) * 2.2);
  const accentColor = accentCand ? ensureContrast(accentCand.hex, bgColor, 3) : fgColor;

  return {
    dark: clamp(1 - bgL * 0.7 - meanL * 0.3),
    contrast: clamp(std / 0.38),
    busy,
    warm: clamp(0.5 + ((sumR - sumB) / N / 255) * 2.2),
    color,
    space: clamp(1 - contentCount / N),
    palette,
    accent: accentCand ? accentColor : '',
    bgColor,
    fgColor,
    accentColor,
    panelColor: panel ? rgbToHex(...avg(panel)) : '',
    layout: { centered, split, sidebar, blocks, columns, bigType, photo, panel: !!panel, massX, symmetry, softShare, top5Share, distinct },
    grid,
    aspect: H / W,
  };
}

// Solid rectangles (cards, panels, sidebars) found on a 240px-wide copy of the image.
function findBoxes(img, bgRGB) {
  const W = 240;
  const H = Math.max(60, Math.min(480, Math.round((W * img.height) / img.width)));
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;
  const N = W * H;
  const mask = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (Math.hypot(px[i * 4] - bgRGB[0], px[i * 4 + 1] - bgRGB[1], px[i * 4 + 2] - bgRGB[2]) > 8) mask[i] = 1;
  }
  // Thin full-width bars (nav bars, status bars) would glue every panel together — drop them.
  const full = [];
  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let x = 0; x < W; x++) n += mask[y * W + x];
    full.push(n / W > 0.92);
  }
  for (let y = 0; y < H; ) {
    if (!full[y]) {
      y++;
      continue;
    }
    let e = y;
    while (e < H && full[e]) e++;
    if ((e - y) / H < 0.08) for (let yy = y; yy < e; yy++) mask.fill(0, yy * W, yy * W + W);
    y = e;
  }
  const seen = new Uint8Array(N);
  const boxes = [];
  const stack = new Int32Array(N);
  for (let start = 0; start < N; start++) {
    if (!mask[start] || seen[start]) continue;
    let sp = 0, count = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    stack[sp++] = start;
    seen[start] = 1;
    while (sp) {
      const i = stack[--sp];
      const x = i % W, y = (i / W) | 0;
      count++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && mask[i - 1] && !seen[i - 1]) (seen[i - 1] = 1), (stack[sp++] = i - 1);
      if (x < W - 1 && mask[i + 1] && !seen[i + 1]) (seen[i + 1] = 1), (stack[sp++] = i + 1);
      if (y > 0 && mask[i - W] && !seen[i - W]) (seen[i - W] = 1), (stack[sp++] = i - W);
      if (y < H - 1 && mask[i + W] && !seen[i + W]) (seen[i + W] = 1), (stack[sp++] = i + W);
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const area = (bw * bh) / N;
    if (area > 0.01 && area < 0.9 && count / (bw * bh) > 0.72) {
      boxes.push({ x0: x0 / W, x1: (x1 + 1) / W, w: bw / W, h: bh / H, area });
    }
  }
  return boxes;
}

export function averageTraits(list) {
  if (!list.length) return null;
  return list[0];
}

// ---------- reading out what we saw ----------

export function describeTraits(t) {
  const L = t.layout || {};
  const notes = [];
  notes.push(`Background ${t.bgColor}, text ${t.fgColor}${t.accent ? `, accent ${t.accentColor}` : ''} — taken straight from your image`);
  if (cleanBackground(t.bgColor) !== t.bgColor) notes.push(`Its grey background (${t.bgColor}) would look muddy as a page, so designs use a cleaner ${cleanBackground(t.bgColor)} of the same tone`);
  if (L.split) notes.push('Two contrasting halves → split-screen layout');
  if (L.sidebar) notes.push('A strong left column → sidebar layout');
  if (L.blocks >= 4) notes.push(`${L.blocks} separate blocks${L.panel ? ' on card surfaces' : ''} → tiled / card layout`);
  if (L.columns >= 3) notes.push(`${L.columns} text columns → editorial columns`);
  if (L.bigType) notes.push('Very large headline type at the top → oversized type');
  if (L.centered) notes.push('Centred, symmetrical composition → centred layout');
  if (L.photo) notes.push('This is a photo, not a page layout → designs are built around the photo itself as your hero');
  notes.push(t.space > 0.6 ? 'Lots of empty space → airy spacing' : t.busy > 0.55 ? 'Dense and detailed → tighter spacing' : 'Balanced spacing');
  notes.push(t.contrast > 0.65 ? 'High contrast → bold weights, sharp edges' : t.contrast < 0.35 ? 'Soft, low contrast → light weights, rounded corners' : 'Medium contrast');
  return notes;
}

// ---------- building designs from the image ----------

function layoutCandidates(t) {
  const L = t.layout || {};
  const dark = luminanceOf(t.bgColor) < 0.25;
  const c = [];
  if (L.split) c.push(['splitscreen', 'Split screen — mirrors the two halves of your image']);
  if (L.sidebar) c.push([dark ? 'ide' : 'sidebar', 'Fixed left column — like the column in your image']);
  if (L.blocks >= 4) c.push([dark ? 'bento' : L.panel ? 'bento' : 'scrapbook', 'Tiles / cards — matches the separate blocks in your image']);
  if (L.columns >= 3) c.push([t.warm > 0.55 ? 'newspaper' : 'editorial', 'Columns — matches the text columns in your image']);
  if (L.bigType) c.push([dark ? 'kinetic' : 'swiss', 'Poster type — matches the giant headline in your image']);
  if (L.centered) c.push([t.space > 0.6 ? 'zen' : 'timeline', 'Centred — matches the symmetry of your image']);
  if (L.photo) c.push(['spatial', 'Full-bleed — your photo becomes the backdrop']);
  if (t.space > 0.6) c.push(['classic', 'Quiet single column with lots of space']);
  c.push(['classic', 'Clean single column']);
  c.push([dark ? 'noir' : 'paper', 'Typographic, content-first']);
  const seen = new Set();
  return c.filter(([k]) => (seen.has(k) ? false : seen.add(k)));
}

function luminanceOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

function moodSettings(t) {
  const L = t.layout || {};
  const soft = t.contrast < 0.4 || (L.photo && t.contrast < 0.55);
  const warm = t.warm > 0.58;
  const dark = luminanceOf(t.bgColor) < 0.25;
  let fontPair = 'inter';
  if (L.bigType && t.contrast > 0.55) fontPair = dark ? 'unbounded' : 'tight';
  else if (warm && soft) fontPair = 'fraunces';
  else if (warm) fontPair = 'serif';
  else if (dark && t.warm < 0.45) fontPair = 'grotesk';
  else if (t.color > 0.35) fontPair = 'bricolage';
  else if (soft) fontPair = 'sora';
  const energetic = t.contrast > 0.65 || t.color > 0.45;
  return {
    fontPair,
    radius: soft ? 14 : t.contrast > 0.75 ? 0 : 6,
    border: t.contrast > 0.75 ? 'bold' : 'hairline',
    density: t.space > 0.62 ? 'airy' : t.busy > 0.55 ? 'tight' : 'normal',
    scale: L.bigType ? 'large' : t.space > 0.62 ? 'regular' : 'regular',
    projectStyle: L.blocks >= 4 ? 'cards' : L.columns >= 3 ? 'numbered' : 'list',
    entrance: energetic ? 'rise' : 'fade',
    revealStyle: energetic ? 'rise' : 'fade',
    cardHover: L.blocks >= 4 ? 'lift' : 'none',
    linkStyle: energetic ? 'highlight' : 'slide',
    accentUse: t.accent && t.accentColor !== t.fgColor ? 'bold' : 'links',
    grain: L.photo && soft,
    motion: 'subtle',
  };
}

/** Four NEW designs generated from one analysed image (not preset themes). */
export function designsFromImage(t, src) {
  const cands = layoutCandidates(t);
  const mood = moodSettings(t);
  const colors = finalize({ bg: t.bgColor, fg: t.fgColor, accent: t.accentColor });
  const make = (key, extra = {}) => ({ layout: key, ...THEMES[key].preset, ...mood, colorScheme: 'custom', colors, heroImage: '', heroImageMode: 'none', heroImageBlur: false, ...extra });
  const flipped = () =>
    finalize({
      bg: luminanceOf(colors.bg) < 0.4 ? mix(colors.fg, '#ffffff', 0.6) : mix(colors.fg, '#000000', 0.55),
      fg: luminanceOf(colors.bg) < 0.4 ? mix(colors.bg, '#000000', 0.2) : mix(colors.bg, '#ffffff', 0.3),
      accent: colors.accent,
    });

  // Photos (landscapes, moodboard shots…) don't have a "layout" to copy — the photo itself is the design.
  if (t.layout?.photo) {
    const tone = t.color > 0.3 ? 'color' : 'strong';
    const photoBits = { heroImage: src, hero3d: 'none', bgAnim: 'none' };
    return [
      { id: 'match', title: 'Full-bleed photo', why: ['Your photo fills the whole first screen behind your name', 'Page colours sampled from the photo', `${mood.fontPair} type to match its mood`], design: make('spatial', { ...photoBits, heroImageMode: tone, nav: 'floating' }) },
      { id: 'alt', title: 'Magazine cover', why: ['Your photo as the cover image under a magazine masthead', 'Same sampled colours'], design: make('editorial', { ...photoBits, heroImageMode: tone }) },
      { id: 'backdrop', title: 'Soft photo backdrop', why: ['A quiet, faded version of your photo behind a centred intro', 'Lots of whitespace'], design: make(t.space > 0.5 ? 'zen' : 'classic', { ...photoBits, heroImageMode: 'subtle' }) },
      { id: 'flip', title: luminanceOf(colors.bg) < 0.4 ? 'Day version' : 'Night version', why: ['Full-bleed photo with light and dark flipped'], design: make('spatial', { ...photoBits, heroImageMode: tone, colors: flipped(), nav: 'floating' }) },
    ];
  }

  const [first, second] = cands;
  const out = [
    { id: 'match', title: 'Closest match', why: [first[1], 'Same background, text and accent colours as your image', `${mood.fontPair} type, ${mood.density} spacing to match its feel`], design: make(first[0]) },
    { id: 'alt', title: 'Alternative structure', why: [second[1], 'Same colours and mood'], design: make(second[0]) },
    {
      id: 'backdrop',
      title: 'Your image as the backdrop',
      why: ['Your image, softly blurred into a texture behind your name', 'Blurred so its own text and shapes never compete with yours'],
      design: make(first[0], { heroImage: src, heroImageMode: 'color', heroImageBlur: true, hero3d: 'none' }),
    },
  ];
  out.push({ id: 'flip', title: luminanceOf(colors.bg) < 0.4 ? 'Day version' : 'Night version', why: ['Same layout and accent as the closest match', 'Light and dark flipped'], design: make(first[0], { colors: flipped() }) });
  return out;
}

// ---------- "what do you want from this image?" ----------
// Reads a plain-English request and decides WHICH parts of the image to use
// (colours / layout / type / the image itself), then layers any other style words on top
// using the regular design-brief engine. Returns { patch, partial, notes }:
//   partial = true  → apply the patch on top of the current design (e.g. "only the colours")
//   partial = false → a complete design (applied from a clean look, so nothing blends)
export function designFromPrompt(t, src, prompt, current, interpretBrief) {
  const text = ` ${String(prompt || '').toLowerCase()} `;
  const has = (re) => re.test(text);
  const notes = [];
  const options = designsFromImage(t, src);
  const match = options[0].design;
  const flip = options.find((o) => o.id === 'flip')?.design.colors;
  const only = (w) => has(new RegExp(`\\b(only|just)\\b[^.!?]*\\b${w}`));

  const wantColors = only('(colou?rs?|palette|tones?)');
  const wantLayout = only('(layout|structure|arrangement)');
  const wantType = only('(fonts?|typography|type|typeface)');
  const keepMine = has(/\b(keep|same|stay with|don'?t change)\b[^.!?]*\b(my|current|existing)\b[^.!?]*\b(theme|layout|design|portfolio)\b/);

  let patch;
  let partial = false;
  if (wantColors || (keepMine && !wantLayout && !wantType)) {
    patch = { colorScheme: 'custom', colors: match.colors, accentUse: match.accentUse };
    partial = true;
    notes.push('Kept your current design and applied only the colours from the image');
  } else if (wantLayout) {
    patch = { layout: match.layout, ...THEMES[match.layout].preset };
    partial = true;
    notes.push(`Applied only the layout from the image (${THEMES[match.layout].name}) — your colours are unchanged`);
  } else if (wantType) {
    patch = { fontPair: match.fontPair, scale: match.scale, density: match.density, radius: match.radius, border: match.border };
    partial = true;
    notes.push('Applied only the typography, spacing and corners that match the image');
  } else {
    patch = { ...match };
    notes.push(`Started from the closest match to your image (${THEMES[match.layout].name} layout, its colours and mood)`);
  }

  // light / dark — flip the image colours rather than inventing new ones
  const wantsDark = has(/(?<!(?:no|not)\s+)\b(dark|night|darker|black background)\b/);
  const wantsLight = has(/(?<!(?:no|not)\s+)\b(light|lighter|bright|white background)\b/) && !has(/\blight (animation|motion|weight)/);
  if (flip && (wantsDark || wantsLight) && (patch.colors || !partial)) {
    // pick whichever of the image's two versions (original / flipped) has the requested tone
    const dark = [match.colors, flip].find((c) => luminanceOf(c.bg) < 0.4);
    const light = [match.colors, flip].find((c) => luminanceOf(c.bg) >= 0.4);
    const chosen = wantsDark ? dark : light;
    if (chosen) {
      patch.colors = chosen;
      patch.colorScheme = 'custom';
      notes.push(wantsDark ? 'Dark version of the image colours' : 'Light version of the image colours');
    }
  }

  // the image itself
  const aboutImageColours = has(/\b(image|photo|picture|pin)('s)?\s+(colou?rs?|palette|tones?)\b/);
  if (has(/\b(no|without|remove|hide)\b[^.!?]*\b(image|photo|picture|backdrop|background image)\b/)) {
    patch.heroImageMode = 'none';
    notes.push('No image behind your name');
  } else if (!aboutImageColours && has(/\b(use|put|show|add|with|keep)\b[^.!?]*\b(image|photo|picture|pin)\b|\b(backdrop|background image|behind my name|hero image|as (the )?background)\b/)) {
    patch.heroImage = src;
    patch.heroImageMode = has(/\b(full colou?r|in colou?r|colou?red)\b/) ? 'color' : has(/\b(subtle|soft|faded|faint)\b/) ? 'subtle' : t.layout?.photo ? 'color' : 'strong';
    patch.heroImageBlur = has(/\bblur/) || (!t.layout?.photo && !has(/\b(sharp|no blur|not blurred|clear)\b/));
    notes.push(`Your image behind your name${patch.heroImageBlur ? ', softly blurred' : ''}${patch.heroImageMode === 'subtle' ? ', faded' : ''}`);
  }

  // anything else ("playful", "letter animations", "as a terminal", "projects first"…)
  const brief = interpretBrief(prompt, { ...current, ...patch });
  const bp = { ...brief.patch };
  delete bp.mode; // colours come from the image; light/dark is handled above
  if (!/\b(navy|teal|red|blue|green|gold|pink|purple|orange|black|white|#[0-9a-f]{3,6})\b/.test(text)) {
    delete bp.colors;
    delete bp.colorScheme;
  }
  if (bp.layout && partial) partial = false;
  if (bp.layout && bp.layout !== patch.layout && notes[0]?.startsWith('Started from')) notes[0] = 'Took the colours and mood from your image';
  Object.assign(patch, bp);
  brief.notes.filter((n) => !/^Dark mode|^Light mode/.test(n)).forEach((n) => notes.push(n));

  return { patch, partial, notes };
}

export const PROMPT_EXAMPLES = [
  'Only take the colours',
  'Same layout but dark and animated',
  'Use the photo as a blurred background',
  'Keep my current theme, just the palette',
  'Make it playful with letter animations',
  'Turn it into a terminal with these colours',
  'Light version, projects first, hover lift',
];

// Secondary: existing themes whose character is closest to the image.
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

export function designFromTraits(t, themeKey) {
  return { layout: themeKey, ...THEMES[themeKey].preset, ...moodSettings(t), colorScheme: 'custom', colors: finalize({ bg: t.bgColor, fg: t.fgColor, accent: t.accentColor }) };
}
