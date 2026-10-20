// Builds a complete, self-contained portfolio website from profile + design.
// Used for the live preview, template thumbnails and the exported index.html.

import {
  allLinks,
  esc,
  hashString,
  initials,
  inlineJson,
  isImageSrc,
  linkList,
  profileDigest,
  safeUrl,
  sectionLabel,
  signatureSvg,
  slugify,
  splitList,
  visibleSections,
} from './content.js';
import { FONT_PAIRS, SCENES, THEMES } from './themes.js';
import { desktopRuntime, effectsRuntime, terminalRuntime, threeRuntime } from './runtime.js';
import { animRuntime } from './anim-runtime.js';
import { isHex, luminance, onColor } from '../lib/color.js';

// ---------------------------------------------------------------- colour schemes

function customColors(d) {
  const c = d.colors || {};
  if (d.colorScheme !== 'custom' || !isHex(c.bg) || !isHex(c.fg)) return null;
  return { bg: c.bg, fg: c.fg, accent: isHex(c.accent) ? c.accent : c.fg };
}

// Applied after theme CSS so a chosen colour scheme wins over every theme.
function colorCss(d) {
  const c = customColors(d);
  if (c) return `\n:root{--bg:${c.bg};--fg:${c.fg};--accent:${c.accent};--on-accent:${onColor(c.accent)}}`;
  const a = /^#[0-9a-f]{6}$/i.test(d.accent || '') ? d.accent : '';
  return a ? `\n:root{--on-accent:${onColor(a)}}` : '';
}

// "Bold accents": the accent colour also drives buttons, numbers, tags, marquee and selection.
function accentCss() {
  return `
:root{--on-accent:var(--bg)}
.accent-bold .btn:not(.ghost){background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.accent-bold .sec-label .num,.accent-bold .project-num,.accent-bold .eyebrow,.accent-bold .stars,.accent-bold .sw-k,.accent-bold .t-key,.accent-bold .prompt{color:var(--accent)}
.accent-bold .tags li:hover{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.accent-bold .marquee{background:var(--accent);color:var(--on-accent)}
.accent-bold .nav-floating{background:var(--accent);color:var(--on-accent)}
.accent-bold .projects-cards .project:hover,.accent-bold .projects-grid .project:hover{border-color:var(--accent)}
.accent-bold .menubar,.accent-bold #preloader{background:var(--accent);color:var(--on-accent)}
.accent-bold ::selection{background:var(--accent);color:var(--on-accent)}
.accent-bold .contact .big-link{color:var(--accent)}
`;
}

export { FONT_PAIRS, LAYOUTS, THEMES, SCENES, CURSORS, THEME_CATEGORIES } from './themes.js';
export { esc, safeUrl, hashString, mulberry32, initials, signatureSvg } from './content.js';
export const slugName = (s) => slugify(s);

const THREE_VERSION = '0.160.0';

const PAPERS = {
  light: { white: { bg: '#ffffff', fg: '#0a0a0a' }, warm: { bg: '#f4f0e8', fg: '#1b1916' }, cool: { bg: '#eef1f4', fg: '#0e1116' } },
  dark: { white: { bg: '#0a0a0a', fg: '#f2f2f2' }, warm: { bg: '#15130f', fg: '#efe9df' }, cool: { bg: '#0a0f16', fg: '#e3ebf3' } },
};

const SCALE = {
  compact: { h1: 'clamp(2.2rem, 5vw, 3.4rem)', h2: '1.05rem', statement: 'clamp(1.6rem, 3.5vw, 2.4rem)' },
  regular: { h1: 'clamp(2.8rem, 7.5vw, 5.4rem)', h2: '1.2rem', statement: 'clamp(2rem, 5vw, 3.4rem)' },
  large: { h1: 'clamp(3.2rem, 11vw, 8.5rem)', h2: '1.4rem', statement: 'clamp(2.4rem, 6.5vw, 4.8rem)' },
};
const DENSITY = { tight: '44px', normal: '80px', airy: '128px' };

// ---------------------------------------------------------------- helpers

function sceneKind(d) {
  if (d.hero3d === 'model' && !(isImageSrc(d.modelUrl) || /^https?:\/\//i.test(d.modelUrl || '') || /^data:/.test(d.modelData || ''))) return 'knot';
  if (d.hero3d === 'embed' && !/^https:\/\//i.test(d.embedUrl || '')) return 'none';
  return SCENES[d.hero3d] ? d.hero3d : 'none';
}

// Static stand-in used in small thumbnails (avoids spinning up a dozen WebGL contexts).
export function scenePoster(kind) {
  const c = 'fill="none" stroke="currentColor" stroke-width=".6"';
  const art = {
    particles: `<circle cx="50" cy="50" r="34" ${c} stroke-dasharray="1 2.4"/><circle cx="50" cy="50" r="24" ${c} stroke-dasharray="1 2.4"/><ellipse cx="50" cy="50" rx="34" ry="12" ${c} stroke-dasharray="1 2.4"/>`,
    knot: `<path d="M20 50c0-25 60-25 60 0s-60 25-60 0zM50 20c25 0 25 60 0 60s-25-60 0-60z" ${c}/><circle cx="50" cy="50" r="22" ${c}/>`,
    shapes: `<path d="M20 30l10-12 10 12-10 12z M60 20h16v16H60z M45 70l10-16 10 16z M75 62l8 8-8 8-8-8z" ${c}/>`,
    blob: `<path d="M50 16c18 0 32 14 30 32s-12 34-32 34-30-16-30-34 14-32 32-32z" fill="currentColor" opacity=".85"/>`,
    globe: `<circle cx="50" cy="50" r="30" ${c} stroke-dasharray="1 2"/><ellipse cx="50" cy="50" rx="44" ry="12" ${c}/>`,
    terrain: `<path d="M0 70q12-10 25 0t25 0 25 0 25 0M0 60q12-10 25 0t25 0 25 0 25 0M0 80q12-10 25 0t25 0 25 0 25 0" ${c}/>`,
    rings: `<circle cx="50" cy="50" r="12" ${c}/><ellipse cx="50" cy="50" rx="24" ry="10" ${c}/><ellipse cx="50" cy="50" rx="10" ry="30" ${c}/><ellipse cx="50" cy="50" rx="36" ry="20" ${c} transform="rotate(30 50 50)"/>`,
    tunnel: `<circle cx="50" cy="50" r="40" ${c}/><circle cx="50" cy="50" r="28" ${c}/><circle cx="50" cy="50" r="18" ${c}/><circle cx="50" cy="50" r="10" ${c}/><circle cx="50" cy="50" r="4" ${c}/>`,
    helix: `<path d="M35 12c30 12 30 26 0 38s-30 26 0 38M65 12c-30 12-30 26 0 38s30 26 0 38M38 22h24M38 40h24M38 60h24M38 78h24" ${c}/>`,
    voxels: `<path d="M14 70h10V52H14zM28 70h10V40H28zM42 70h10V30H42zM56 70h10V44H56zM70 70h10V56H70z" fill="currentColor" opacity=".85"/>`,
    ribbon: `<path d="M6 50q22-30 44 0t44 0M6 56q22-30 44 0t44 0M6 62q22-30 44 0t44 0M6 44q22-30 44 0t44 0" ${c}/>`,
    plexus: `<path d="M20 30L45 22 70 34 82 60 55 74 28 66 20 30 55 74M45 22L55 74M70 34L28 66" ${c}/><circle cx="20" cy="30" r="2.5" fill="currentColor"/><circle cx="45" cy="22" r="2.5" fill="currentColor"/><circle cx="70" cy="34" r="2.5" fill="currentColor"/><circle cx="82" cy="60" r="2.5" fill="currentColor"/><circle cx="55" cy="74" r="2.5" fill="currentColor"/><circle cx="28" cy="66" r="2.5" fill="currentColor"/>`,
    galaxy: `<path d="M50 50c10-12 28-6 30 8M50 50c-10 12-28 6-30-8M50 50c12 10 6 28-8 30M50 50c-12-10-6-28 8-30" ${c} stroke-dasharray="1 2"/><circle cx="50" cy="50" r="4" fill="currentColor"/>`,
    mobius: `<path d="M15 50c0-20 30-20 35 0s35 20 35 0-30-20-35 0-35 20-35 0z" ${c}/><path d="M18 46c4-12 26-12 32 4s28 16 32 4" ${c}/>`,
    name3d: `<text x="50" y="62" text-anchor="middle" font-size="34" font-weight="800" fill="currentColor" font-family="system-ui">Aa</text><text x="53" y="65" text-anchor="middle" font-size="34" font-weight="800" fill="none" stroke="currentColor" stroke-width=".6" font-family="system-ui">Aa</text>`,
    model: `<path d="M50 18l28 16v32L50 82 22 66V34z M22 34l28 16 28-16 M50 50v32" ${c}/>`,
    embed: `<path d="M50 18l28 16v32L50 82 22 66V34z M22 34l28 16 28-16 M50 50v32" ${c}/>`,
  };
  return `<svg viewBox="0 0 100 100" class="scene-poster" aria-hidden="true">${art[kind] || ''}</svg>`;
}

function threeSlot(d, opts, cls = '') {
  const kind = sceneKind(d);
  if (kind === 'none') return '';
  if (opts.thumb) return `<div class="three is-poster ${cls}">${scenePoster(kind)}</div>`;
  if (kind === 'embed') {
    return `<div class="three ${cls}"><iframe src="${esc(d.embedUrl)}" title="Interactive 3D scene" loading="lazy" allow="autoplay; fullscreen; xr-spatial-tracking" referrerpolicy="no-referrer"></iframe></div>`;
  }
  return `<div class="three ${cls}" data-three aria-hidden="true"></div>`;
}

function placement(d) {
  if (d.hero3dPlace && d.hero3dPlace !== 'auto') return d.hero3dPlace;
  return ['kinetic', 'brutalist'].includes(d.layout) ? 'background' : 'side';
}

const nameWords = (name) => String(name || 'Your Name').trim().split(/\s+/);

function avatarHtml(p, d, cls = 'avatar') {
  return d.showAvatar && isImageSrc(p.basics.avatar) ? `<img class="${cls}" src="${esc(p.basics.avatar)}" alt="Photo of ${esc(p.basics.name)}">` : '';
}

function ctas(b, label = 'Get in touch') {
  const out = [];
  if (b.email) out.push(`<a class="btn" href="mailto:${esc(b.email)}">${esc(label)}</a>`);
  if (safeUrl(b.resumeUrl)) out.push(`<a class="btn ghost" href="${esc(safeUrl(b.resumeUrl))}" target="_blank" rel="noopener">Résumé ↗</a>`);
  return out.length ? `<div class="hero-cta">${out.join('')}</div>` : '';
}

const availability = (b) => (b.availability ? `<p class="availability"><span class="dot" aria-hidden="true"></span>${esc(b.availability)}</p>` : '');

const revealOn = (d) => d.motion !== 'none' && ((d.revealStyle && d.revealStyle !== 'none') || d.motion === 'reveal');
const revealStyleOf = (d) => (d.revealStyle && d.revealStyle !== 'none' ? d.revealStyle : 'rise');

function sectionHtml(s, i, d, extra = '') {
  const reveal = revealOn(d) ? ' reveal' : '';
  return `<section class="sec${reveal}${extra}" id="${esc(s.slug)}" aria-labelledby="h-${esc(s.slug)}"><h2 class="sec-label" id="h-${esc(s.slug)}">${sectionLabel(s, i, d)}</h2><div class="sec-body">${s.html}</div></section>`;
}

function navHtml(sections, b, d) {
  const items = sections.map((s) => `<li><a href="#${esc(s.slug)}">${esc(s.title)}</a></li>`).join('');
  if (d.nav === 'top') {
    return `<nav class="nav" aria-label="Primary"><div class="wrap"><a class="brand" href="#top">${esc(initials(b.name))}<span class="muted">.</span></a><ul>${items}</ul></div></nav>`;
  }
  if (d.nav === 'floating') return `<nav class="nav-floating" aria-label="Primary"><ul>${items}</ul></nav>`;
  return '';
}

const footerHtml = (b) =>
  `<footer class="foot"><div class="wrap"><span>© ${new Date().getFullYear()} ${esc(b.name)}</span><a href="#top">Back to top ↑</a></div></footer>`;

// ---------------------------------------------------------------- hero variants (for minimal / brutalist)

function standardHero(p, d, opts) {
  const b = p.basics;
  const place = placement(d);
  const slot = threeSlot(d, opts, place === 'background' ? 'bg' : 'side');
  const mark = d.mark !== 'none' ? signatureSvg(b.name, d.seed, d.mark, d.heroStyle === 'split' ? 220 : 64) : '';
  const avatar = avatarHtml(p, d);
  const name = `<h1><span data-scramble>${esc(b.name || 'Your Name')}</span></h1>`;
  const meta = [
    b.location && `<div><dt>Based in</dt><dd>${esc(b.location)}</dd></div>`,
    b.availability && `<div><dt>Status</dt><dd><span class="dot" aria-hidden="true"></span>${esc(b.availability)}</dd></div>`,
    b.email && `<div><dt>Email</dt><dd><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></dd></div>`,
  ].filter(Boolean);
  const metaGrid = meta.length ? `<dl class="meta-grid">${meta.join('')}</dl>` : '';
  const links = `<div class="links">${linkList(p.socials)}</div>`;
  let inner;
  switch (d.heroStyle) {
    case 'statement':
      inner = `${mark || avatar ? `<div class="hero-row">${avatar}${mark}</div>` : ''}<p class="eyebrow">${esc(b.name)}${b.headline ? ` — ${esc(b.headline)}` : ''}</p><h1 class="statement">${esc(b.tagline || b.headline || 'I build things for the web.')}</h1>${availability(b)}${ctas(b)}${links}`;
      break;
    case 'split':
      inner = `<div class="split"><div><p class="eyebrow">${esc(b.headline)}</p>${name}${b.tagline ? `<p class="tagline">${esc(b.tagline)}</p>` : ''}${availability(b)}${ctas(b)}${links}</div><div class="hero-visual">${slot ? '' : avatar || mark || signatureSvg(b.name, d.seed, 'identicon', 220)}</div></div>`;
      break;
    case 'minimal':
      inner = `<div class="hero-minimal">${avatar}<div>${name}<p class="headline">${esc(b.headline)}${b.location ? ` · ${esc(b.location)}` : ''}</p></div></div>`;
      break;
    default:
      inner = `${mark || avatar ? `<div class="hero-row">${avatar}${mark}</div>` : ''}<p class="eyebrow">${esc(b.headline)}</p>${name}${b.tagline ? `<p class="tagline">${esc(b.tagline)}</p>` : ''}${metaGrid}${ctas(b)}${links}`;
  }
  return `<header class="hero hero-${esc(d.heroStyle)}${slot ? ` has-3d place-${place}` : ''}" id="top"><div class="hero-content">${inner}</div>${slot}</header>`;
}

// ---------------------------------------------------------------- theme bodies

const T = {};

T.classic = (p, d, S, opts) => {
  const b = p.basics;
  return `${navHtml(S, b, d)}<main id="main"><div class="wrap">${standardHero(p, d, opts)}${S.map((s, i) => sectionHtml(s, i, d)).join('')}</div></main>${footerHtml(b)}`;
};

T.brutalist = (p, d, S, opts) => {
  const b = p.basics;
  const items = p.skills.flatMap((s) => splitList(s.items));
  const run = items.map((x) => `<span>${esc(x)}</span><span aria-hidden="true">✶</span>`).join('');
  const marquee = items.length ? `<div class="marquee" aria-hidden="true"><div class="marquee-track">${run}${run}</div></div>` : '';
  return `${navHtml(S, b, d)}<main id="main"><div class="wrap">${standardHero(p, d, opts)}</div>${marquee}<div class="wrap">${S.map((s, i) => sectionHtml(s, i, d)).join('')}</div></main>${footerHtml(b)}`;
};

T.editorial = (p, d, S, opts) => {
  const b = p.basics;
  const name = b.name || 'Your Name';
  const vw = Math.min(15, 125 / Math.max(name.length, 4)).toFixed(2);
  const slot = threeSlot(d, opts);
  const issue = String((hashString(name) % 90) + 10);
  return `${navHtml(S, b, d)}<main id="main"><div class="wrap">
    <div class="masthead"><span>${esc(initials(name))} — Portfolio Edition</span><span>Vol. ${new Date().getFullYear()} · №${issue}</span><span>${esc(b.location || 'Worldwide')}</span></div>
    <header class="ed-hero" id="top">
      <h1 class="ed-name" style="font-size:clamp(3rem, ${vw}vw, 15rem)"><span data-scramble>${esc(name)}</span></h1>
      <div class="ed-dek">
        <p class="ed-kicker">${esc(b.headline)}</p>
        <p class="ed-standfirst">${esc(b.tagline)}</p>
        <div class="ed-byline">${availability(b)}<div class="links">${linkList(p.socials)}</div></div>
      </div>
      ${slot ? `<figure class="ed-figure">${slot}<figcaption>Fig. 1 — ${esc(SCENES[sceneKind(d)].name)}. Move your cursor to explore.</figcaption></figure>` : ''}
    </header>
    ${S.map((s, i) => sectionHtml(s, i, d)).join('')}
  </div></main>${footerHtml(b)}`;
};

T.terminal = (p, d, S, opts) => {
  const b = p.basics;
  const host = (nameWords(b.name)[0] || 'dev').toLowerCase().replace(/[^a-z0-9]/g, '') || 'dev';
  const place = placement(d);
  const slot = threeSlot(d, opts, place === 'background' ? 'bg' : 'side');
  const chips = ['help', 'about', 'projects', 'skills', 'contact', 'clear'].map((c) => `<button type="button" data-cmd="${c}">${c}</button>`).join('');
  return `${navHtml(S, b, d)}<main id="main" class="wrap">
    <header class="term-hero${slot ? ` has-3d place-${place}` : ''}" id="top">
      <div class="hero-content">
        <h1 class="sr-only">${esc(b.name)} — ${esc(b.headline)}</h1>
        <div class="term">
          <div class="term-bar"><i></i><i></i><i></i><span>${esc(host)}@portfolio — zsh — 80×24</span></div>
          <div class="term-screen" id="term-screen">
            <div class="term-out" id="term-out" aria-live="polite"></div>
            <label class="term-line"><span class="t-prompt">guest@${esc(host)}:~$</span><input id="term-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type a command"></label>
            <noscript><p><b>${esc(b.name)}</b> — ${esc(b.headline)}</p></noscript>
          </div>
        </div>
        <div class="term-chips" aria-label="Quick commands">${chips}</div>
      </div>
      ${slot}
    </header>
    <p class="scroll-note"><span class="prompt">#</span> prefer reading? scroll for the full portfolio ↓</p>
    ${S.map((s, i) => sectionHtml(s, i, d)).join('')}
  </main>${footerHtml(b)}`;
};

T.bento = (p, d, S, opts) => {
  const b = p.basics;
  const visual = threeSlot(d, opts) || avatarHtml(p, d) || signatureSvg(b.name, d.seed, d.mark === 'none' ? 'identicon' : d.mark, 150);
  const stars = p.projects.reduce((a, x) => a + (Number(x.stars) || 0), 0);
  const techCount = p.skills.flatMap((s) => splitList(s.items)).length;
  const span = { about: 3, skills: 2, contact: 2, projects: 4, experience: 2, education: 2, certifications: 2, achievements: 2 };
  return `${navHtml(S, b, d)}<main class="wrap" id="main"><div class="bento">
    <header class="tile t-hero span-3" id="top">
      ${b.availability ? `<p class="pill"><span class="dot" aria-hidden="true"></span>${esc(b.availability)}</p>` : ''}
      <h1><span data-scramble>${esc(b.name || 'Your Name')}</span></h1>
      <p class="headline">${esc(b.headline)}</p>
      ${b.tagline ? `<p class="tagline">${esc(b.tagline)}</p>` : ''}
      ${ctas(b)}<div class="links">${linkList(p.socials)}</div>
    </header>
    <div class="tile t-visual" data-tilt>${visual}</div>
    <div class="tile t-stat"><b>${p.projects.length}</b><span>Projects shipped</span></div>
    ${stars ? `<div class="tile t-stat"><b>${stars}</b><span>GitHub stars</span></div>` : ''}
    <div class="tile t-stat"><b>${techCount}</b><span>Technologies</span></div>
    ${b.location ? `<div class="tile t-stat t-loc"><span>Based in</span><b>${esc(b.location)}</b></div>` : ''}
    ${S.map((s, i) => sectionHtml(s, i, d, ` tile span-${span[s.key] || 4}`)).join('')}
  </div></main>${footerHtml(b)}`;
};

T.sidebar = (p, d, S, opts) => {
  const b = p.basics;
  const avatar = avatarHtml(p, d) || (d.mark !== 'none' ? signatureSvg(b.name, d.seed, d.mark, 64) : '');
  const items = S.map((s) => `<li><a href="#${esc(s.slug)}">${esc(s.title)}</a></li>`).join('');
  const slot = threeSlot(d, opts);
  return `<div class="shell" id="top">
    <aside>
      ${avatar}
      <div><h1><span data-scramble>${esc(b.name)}</span></h1><p class="muted" style="margin-top:8px">${esc(b.headline)}</p></div>
      ${availability(b)}
      <nav aria-label="Sections"><ul>${items}</ul></nav>
      <div class="links">${linkList(p.socials)}${b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : ''}</div>
    </aside>
    <main id="main">
      <div class="lead${slot ? ' has-3d place-side' : ''}"><div class="hero-content">${b.tagline ? `<p class="statement">${esc(b.tagline)}</p>` : ''}${ctas(b)}</div>${slot}</div>
      ${S.map((s, i) => sectionHtml(s, i, d)).join('')}
      ${footerHtml(b)}
    </main>
  </div>`;
};

T.spatial = (p, d, S, opts) => {
  const b = p.basics;
  const slot = threeSlot(d, opts);
  return `<div class="space-bg">${slot}<div class="space-glow"></div></div>
    ${navHtml(S, b, d)}
    <main id="main">
      <header class="sp-hero" id="top">
        <div class="wrap">
          <p class="eyebrow">${esc(b.headline)}</p>
          <h1><span data-scramble>${esc(b.name || 'Your Name')}</span></h1>
          ${b.tagline ? `<p class="tagline">${esc(b.tagline)}</p>` : ''}
          ${availability(b)}${ctas(b)}
          <div class="links">${linkList(p.socials)}</div>
        </div>
        <a class="sp-scroll" href="#${esc(S[0]?.slug || 'top')}" aria-label="Scroll to content"><span></span></a>
      </header>
      <div class="wrap sp-sections">${S.map((s, i) => sectionHtml(s, i, d, ' glass')).join('')}</div>
    </main>${footerHtml(b)}`;
};

T.swiss = (p, d, S, opts) => {
  const b = p.basics;
  const slot = threeSlot(d, opts);
  const words = nameWords(b.name);
  const metaCol = (k, v) => (v ? `<div><span class="sw-k">${k}</span><div class="sw-v">${v}</div></div>` : '');
  return `${navHtml(S, b, d)}<main id="main">
    <header class="sw-hero" id="top"><div class="wrap">
      <div class="sw-top"><span>${esc(initials(b.name))}®</span><span>Portfolio</span><span>${new Date().getFullYear()}</span><span>${esc(b.location || '')}</span></div>
      <div class="sw-namerow${slot ? ' has-visual' : ''}"><h1 class="sw-name">${words.map((w) => `<span class="sw-line" data-scramble>${esc(w)}</span>`).join('')}</h1>${slot ? `<div class="sw-visual">${slot}</div>` : ''}</div>
      <div class="sw-meta">
        ${metaCol('Role', esc(b.headline))}
        ${metaCol('Status', esc(b.availability))}
        ${metaCol('Contact', b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : '')}
        ${metaCol('Elsewhere', `<div class="links">${linkList(p.socials)}</div>`)}
      </div>
      ${b.tagline ? `<div class="sw-band"><p class="sw-statement">${esc(b.tagline)}</p></div>` : ''}
    </div></header>
    <div class="wrap">${S.map((s, i) => sectionHtml(s, i, d)).join('')}</div>
  </main>${footerHtml(b)}`;
};

const ICONS = {
  doc: '<svg viewBox="0 0 32 32" width="40" height="40" shape-rendering="crispEdges" aria-hidden="true"><path d="M7 3h13l6 6v20H7z" fill="var(--bg)" stroke="currentColor" stroke-width="2"/><path d="M20 3v6h6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 14h11M11 18h11M11 22h8" stroke="currentColor" stroke-width="2"/></svg>',
  folder: '<svg viewBox="0 0 32 32" width="40" height="40" shape-rendering="crispEdges" aria-hidden="true"><path d="M3 8h10l3 3h13v16H3z" fill="var(--bg)" stroke="currentColor" stroke-width="2"/><path d="M3 13h26" stroke="currentColor" stroke-width="2"/></svg>',
  disk: '<svg viewBox="0 0 32 32" width="40" height="40" shape-rendering="crispEdges" aria-hidden="true"><path d="M4 4h21l3 3v21H4z" fill="var(--bg)" stroke="currentColor" stroke-width="2"/><path d="M9 4v8h13V4M9 28v-9h14v9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  cube: '<svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true"><path d="M16 3l11 6v14l-11 6-11-6V9z M5 9l11 6 11-6 M16 15v14" fill="var(--bg)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};

T.os = (p, d, S, opts) => {
  const b = p.basics;
  const first = nameWords(b.name)[0] || 'Dev';
  const slot = threeSlot(d, opts);
  const iconFor = (k) => (k === 'projects' ? 'folder' : k === 'contact' ? 'disk' : 'doc');
  const wins = [];
  wins.push({
    id: 'win-hello',
    title: 'Welcome',
    open: true,
    style: 'left:4%;top:28px;width:min(480px,92%)',
    body: `<div class="hello">${avatarHtml(p, d) || (d.mark !== 'none' ? signatureSvg(b.name, d.seed, d.mark, 56) : '')}<div><p class="eyebrow">Hello, I am</p><p class="os-name" data-scramble>${esc(b.name)}</p><p>${esc(b.headline)}</p></div></div>${b.tagline ? `<p class="tagline">${esc(b.tagline)}</p>` : ''}${availability(b)}${ctas(b)}<p class="hint">Double-click (or tap) the icons to open more windows. Drag windows by their title bars.</p>`,
  });
  if (slot) wins.push({ id: 'win-3d', title: `${SCENES[sceneKind(d)].name}.obj`, open: true, style: 'left:64%;top:56px;width:min(340px,92%)', body: slot, cls: 'win-3d' });
  S.forEach((s, i) => {
    const open = i < 1;
    const pos = i === 0 ? 'left:30%;top:330px;width:min(560px,92%)' : i === 1 ? 'left:14%;top:520px;width:min(520px,92%)' : `left:${20 + (i % 5) * 7}%;top:${90 + (i % 5) * 46}px;width:min(520px,92%)`;
    wins.push({ id: `win-${s.slug}`, title: s.title, open, style: pos, body: s.html, section: s });
  });
  const icons = [
    `<button class="icon" data-open="win-hello">${ICONS.doc}<span>Welcome.txt</span></button>`,
    ...(slot ? [`<button class="icon" data-open="win-3d">${ICONS.cube}<span>Model</span></button>`] : []),
    ...S.map((s) => `<button class="icon" data-open="win-${esc(s.slug)}">${ICONS[iconFor(s.key)]}<span>${esc(s.title)}</span></button>`),
  ].join('');
  return `<div class="os" id="top">
    <div class="menubar"><b>◼ ${esc(first)}OS</b><span>File</span><span>Edit</span><span>View</span><span>Special</span><span class="spacer"></span><span data-clock></span></div>
    <main class="desktop" id="main">
      <h1 class="sr-only">${esc(b.name)} — ${esc(b.headline)}</h1>
      <nav class="icons" aria-label="Desktop">${icons}</nav>
      ${wins
        .map(
          (w, i) =>
            `<section class="win${w.cls ? ` ${w.cls}` : ''}${i === 0 ? ' active' : ''}" id="${esc(w.id)}" style="${w.style};z-index:${i + 1}"${w.open ? '' : ' hidden'}${w.section ? ` aria-labelledby="h-${esc(w.section.slug)}"` : ''}>
              <div class="win-bar"><button class="win-close" type="button" aria-label="Close ${esc(w.title)}"></button><h2 class="win-title"${w.section ? ` id="h-${esc(w.section.slug)}"` : ''}>${esc(w.title)}</h2></div>
              <div class="win-body">${w.body}</div>
            </section>`
        )
        .join('')}
    </main>
  </div>`;
};

T.kinetic = (p, d, S, opts) => {
  const b = p.basics;
  const words = nameWords(b.name);
  const firstLine = words[0];
  const rest = words.slice(1).join(' ') || '';
  const slot = threeSlot(d, opts, 'bg');
  const items = p.skills.flatMap((s) => splitList(s.items));
  const run = items.map((x) => `<span>${esc(x)}</span><span aria-hidden="true">●</span>`).join('');
  return `${navHtml(S, b, d)}<main id="main">
    <header class="kn-hero${slot ? ' has-3d place-background' : ''}" id="top">
      ${slot}
      <div class="kn-top"><span>${esc(b.headline)}</span><span>${esc(b.location)}</span><span>${esc(b.availability)}</span></div>
      <h1 class="kn-name" aria-label="${esc(b.name)}"><span class="kn-line" data-drift="-1"><span data-scramble>${esc(firstLine)}</span></span>${rest ? `<span class="kn-line outline" data-drift="1">${esc(rest)}</span>` : ''}</h1>
      <div class="kn-foot"><p class="kn-tag">${esc(b.tagline)}</p>${b.email ? `<a class="btn" href="mailto:${esc(b.email)}">Let’s talk →</a>` : ''}</div>
    </header>
    ${items.length ? `<div class="marquee" aria-hidden="true"><div class="marquee-track">${run}${run}</div></div>` : ''}
    <div class="wrap">${S.map((s, i) => sectionHtml(s, i, d)).join('')}</div>
  </main>${footerHtml(b)}`;
};

T.blueprint = (p, d, S, opts) => {
  const b = p.basics;
  const h = hashString(b.name || 'x');
  const fp = h.toString(16).toUpperCase().padStart(8, '0').slice(0, 6);
  const lat = ((h % 1800) / 10 - 90).toFixed(4);
  const lng = (((h >>> 11) % 3600) / 10 - 180).toFixed(4);
  const slot = threeSlot(d, opts);
  const visual = slot || signatureSvg(b.name, d.seed, d.mark === 'none' ? 'orbit' : d.mark, 220);
  const spec = [
    ['Role', esc(b.headline)],
    ['Status', esc(b.availability)],
    ['Based', esc(b.location)],
    ['Contact', b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : ''],
    ['Links', p.socials.length ? `<div class="links">${linkList(p.socials)}</div>` : ''],
  ].filter((r) => r[1]);
  return `${navHtml(S, b, d)}<main class="wrap" id="main">
    <header class="bp-hero" id="top">
      <div class="bp-frame"><i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i>
        <div class="bp-head"><span>DWG. NO. ${fp}</span><span>REV. ${(d.seed % 9) + 1}</span><span>SCALE 1:1</span><span>${lat}°, ${lng}°</span></div>
        <div class="bp-grid">
          <div>
            <p class="eyebrow">Sheet 01 — Developer profile</p>
            <h1><span data-scramble>${esc(b.name || 'Your Name')}</span></h1>
            <div class="dim"><span>${esc(String((b.name || '').length))} CHARS · ${(String(b.name || '').length * 0.6).toFixed(1)} EM</span></div>
            ${b.tagline ? `<p class="tagline">${esc(b.tagline)}</p>` : ''}
            ${spec.length ? `<table class="spec"><tbody>${spec.map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table>` : ''}
          </div>
          <figure class="bp-visual">${visual}<figcaption>FIG. 00 — ${esc((slot ? SCENES[sceneKind(d)].name : 'Signature mark').toUpperCase())}</figcaption></figure>
        </div>
      </div>
    </header>
    ${S.map((s, i) => sectionHtml(s, i, d)).join('')}
    <footer class="title-block"><div><span>Drawn by</span><b>${esc(b.name)}</b></div><div><span>Date</span><b>${new Date().getFullYear()}</b></div><div><span>Sheet</span><b>1 / 1</b></div><div><span>Checked</span><b>✓</b></div></footer>
  </main>`;
};

// ---------------------------------------------------------------- CSS

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

function buildCss(d) {
  const terminalFont = d.layout === 'terminal';
  const pair = terminalFont ? FONT_PAIRS.mono : FONT_PAIRS[d.fontPair] || FONT_PAIRS.inter;
  const paper = PAPERS[d.mode]?.[d.paper] || PAPERS.light.white;
  const scale = SCALE[d.scale] || SCALE.regular;
  const bw = d.border === 'bold' ? '2px' : d.border === 'none' ? '0px' : '1px';
  const radius = d.layout === 'brutalist' || d.layout === 'os' ? 0 : Number(d.radius) || 0;
  const accent = /^#[0-9a-f]{3,8}$/i.test(d.accent || '') ? d.accent : 'var(--fg)';
  const hw = pair.weight || 700;
  const heavy = pair.weight === 400 ? 400 : 800;
  const textCase = d.headingCase === 'upper' ? 'uppercase' : d.headingCase === 'lower' ? 'lowercase' : 'none';
  const textures = {
    none: 'none',
    grid: 'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
    dots: 'radial-gradient(var(--line-strong) 1px, transparent 1.2px)',
    lines: 'repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 28px)',
  };
  const textureSize = d.texture === 'grid' ? '40px 40px' : d.texture === 'dots' ? '22px 22px' : 'auto';

  return `
:root{--bg:${paper.bg};--fg:${paper.fg};--accent:${accent};
--muted:color-mix(in srgb,var(--fg) 60%,var(--bg));--line:color-mix(in srgb,var(--fg) 13%,var(--bg));--line-strong:color-mix(in srgb,var(--fg) 30%,var(--bg));
--card:color-mix(in srgb,var(--fg) 4%,var(--bg));--font-head:'${pair.head}',system-ui,sans-serif;--font-body:'${pair.body}',system-ui,sans-serif;
--mono:'JetBrains Mono','IBM Plex Mono',ui-monospace,monospace;--r:${radius}px;--bw:${bw};--pad:${DENSITY[d.density] || DENSITY.normal};--h1:${scale.h1};--h2:${scale.h2};--statement:${scale.statement};--hw:${hw};--heavy:${heavy}}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
html.flip{filter:invert(1)}
body{margin:0;background-color:var(--bg);color:var(--fg);font-family:var(--font-body);font-size:16.5px;line-height:1.65;-webkit-font-smoothing:antialiased;
background-image:${textures[d.texture] || 'none'};background-size:${textureSize};background-attachment:fixed;overflow-x:hidden}
::selection{background:var(--fg);color:var(--bg)}
a{color:inherit;text-decoration-color:var(--accent);text-underline-offset:3px;text-decoration-thickness:1px}
a:hover{text-decoration-thickness:2px}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
img{max-width:100%;display:block}
h1,h2,h3{font-family:var(--font-head);line-height:1.05;margin:0;font-weight:var(--hw);letter-spacing:${hw === 400 ? '-.01em' : '-.025em'}}
h1,.sec-label,.eyebrow{text-transform:${textCase}}
p{margin:0 0 .9em}
ul{margin:0;padding:0}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip{position:absolute;left:-999px;top:8px;background:var(--fg);color:var(--bg);padding:8px 12px;z-index:2000}
.skip:focus{left:8px}
.wrap{max-width:920px;margin:0 auto;padding:0 28px;position:relative}
.muted{color:var(--muted)}
.dot{flex:none;display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px var(--line);animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{50%{box-shadow:0 0 0 7px transparent}}
/* nav */
.nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:var(--bw) solid var(--line)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:60px;gap:20px;max-width:1240px}
.nav .brand{font-family:var(--font-head);font-weight:700;text-decoration:none}
.nav ul{display:flex;gap:22px;list-style:none;overflow-x:auto;scrollbar-width:none}
.nav ul a{text-decoration:none;color:var(--muted);font-size:.88rem;white-space:nowrap;transition:color .2s}
.nav ul a:hover{color:var(--fg)}
.nav-floating{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:60;background:var(--fg);color:var(--bg);border-radius:999px;padding:11px 20px;max-width:calc(100% - 32px);box-shadow:0 10px 40px rgba(0,0,0,.25)}
.nav-floating ul{display:flex;gap:18px;list-style:none;overflow-x:auto;scrollbar-width:none}
.nav-floating a{text-decoration:none;font-size:.84rem;white-space:nowrap;opacity:.72;transition:opacity .2s}
.nav-floating a:hover{opacity:1}
/* generic hero */
.hero{padding:calc(var(--pad) * 1.4) 0 var(--pad);position:relative}
.hero h1{font-size:var(--h1)}
.hero .headline{font-size:1.15rem;margin-top:14px;color:var(--muted)}
.tagline{font-size:1.18rem;max-width:44ch;margin-top:16px;line-height:1.55}
.eyebrow{font-family:var(--mono);font-size:.78rem;letter-spacing:.08em;color:var(--muted);margin-bottom:18px;text-transform:uppercase}
.statement{font-size:var(--statement);max-width:20ch;line-height:1.08}
.hero-row{display:flex;gap:16px;align-items:center;margin-bottom:28px}
.avatar{width:84px;height:84px;object-fit:cover;border-radius:calc(var(--r) * 3);border:var(--bw) solid var(--line)}
.split{display:grid;grid-template-columns:1.4fr 1fr;gap:48px;align-items:center}
.hero-visual{display:flex;justify-content:center}
.hero-visual .avatar{width:100%;height:auto;aspect-ratio:1;border-radius:var(--r)}
.hero-minimal{display:flex;gap:20px;align-items:center}
.hero-minimal h1{font-size:clamp(1.8rem,4vw,2.4rem)}
.hero-minimal .headline{margin-top:4px}
.mark{color:var(--fg);display:block}
.meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:0;margin:34px 0 0;border-top:var(--bw) solid var(--line)}
.meta-grid div{padding:14px 18px 0 0}
.meta-grid dt{font-family:var(--mono);font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.meta-grid dd{margin:4px 0 0;display:flex;align-items:flex-start;gap:10px;font-weight:500}
.meta-grid dd .dot,.availability .dot{margin-top:.55em}
.hero-cta{display:flex;gap:10px;flex-wrap:wrap;margin:28px 0 6px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;background:var(--fg);color:var(--bg);text-decoration:none;border-radius:calc(var(--r) * 1.5);font-weight:600;font-size:.95rem;border:var(--bw) solid var(--fg);transition:transform .2s,background .2s,color .2s}
.btn:hover{text-decoration:none}
.btn.ghost{background:transparent;color:var(--fg);border-color:var(--line-strong)}
.btn.ghost:hover{border-color:var(--fg)}
.availability{display:inline-flex;align-items:flex-start;gap:12px;font-size:.88rem;margin-top:18px;font-family:var(--mono)}
.links{display:flex;flex-wrap:wrap;gap:6px 20px;margin-top:18px;font-size:.95rem}
/* 3D slots */
.three{position:relative;min-height:340px}
.three canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block}
.three iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.three.is-poster{display:grid;place-items:center;color:var(--fg)}
.scene-poster{width:70%;max-width:260px;opacity:.85}
.three.no-webgl::after,.three.model-error::after{content:'3D unavailable';position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);font:500 .8rem var(--mono)}
.has-3d.place-side{display:grid;grid-template-columns:1.15fr 1fr;gap:32px;align-items:center}
.has-3d.place-side .three{height:min(56vh,480px)}
.has-3d.place-background .three{position:absolute;inset:0;z-index:0;min-height:0;pointer-events:none!important;opacity:.9}
.has-3d.place-background .hero-content,.has-3d.place-background > :not(.three){position:relative;z-index:1}
/* sections */
.sec{padding:var(--pad) 0;border-top:var(--bw) solid var(--line);position:relative}
.sec-label{font-size:var(--h2);margin-bottom:30px;font-weight:600;letter-spacing:-.01em}
.sec-label .num,.prompt{font-family:var(--mono);color:var(--muted);font-weight:400;margin-right:6px}
.prose{max-width:66ch;font-size:1.06rem}
.prose ul{padding-left:20px}
.tags{display:flex;flex-wrap:wrap;gap:8px;list-style:none}
.tags li{border:var(--bw) solid var(--line-strong);padding:4px 12px;border-radius:calc(var(--r) * 4);font-size:.87rem;transition:background .2s,color .2s}
.tags li:hover{background:var(--fg);color:var(--bg)}
.tags.small{gap:6px;margin-top:14px}
.tags.small li{font-size:.75rem;padding:2px 9px;font-family:var(--mono);color:var(--muted);border-color:var(--line)}
.skills{display:grid;gap:24px}
.skill-group h3{font-size:.75rem;font-family:var(--mono);font-weight:500;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.08em}
.skills-pre{font-family:var(--mono);white-space:pre-wrap;margin:0;font-size:.93rem;line-height:1.9}
.skills-pre .k{color:var(--muted)}
.bullets{padding-left:18px;margin:10px 0 0}
.bullets li{margin:3px 0}
/* projects */
.projects{display:grid;gap:18px}
.project{position:relative}
.project h3{font-size:1.2rem}
.project p{margin:8px 0 0;color:color-mix(in srgb,var(--fg) 82%,var(--bg))}
.project-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.project-num{display:none}
.stars{font-family:var(--mono);font-size:.8rem;color:var(--muted);white-space:nowrap}
.project .links{margin-top:16px;font-size:.9rem}
.project-img{border-radius:var(--r);border:var(--bw) solid var(--line);margin-bottom:16px;aspect-ratio:16/9;object-fit:cover;width:100%}
.projects-cards{grid-template-columns:repeat(auto-fill,minmax(290px,1fr))}
.projects-cards .project,.projects-grid .project{border:var(--bw) solid var(--line);border-radius:calc(var(--r) * 1.5);padding:24px;background:var(--card);transition:border-color .25s,transform .25s}
.projects-cards .project:hover,.projects-grid .project:hover{border-color:var(--fg)}
.projects-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.projects-grid .bullets{display:none}
.projects-list{gap:0}
.projects-list .project{display:grid;grid-template-columns:56px 1fr;gap:12px;padding:24px 0;border-bottom:var(--bw) solid var(--line)}
.projects-list .project-num,.projects-numbered .project-num{display:block;font-family:var(--mono);color:var(--muted);font-size:.85rem;padding-top:4px}
.projects-numbered{gap:0}
.projects-numbered .project{display:grid;grid-template-columns:110px 1fr;gap:20px;padding:30px 0;border-bottom:var(--bw) solid var(--line)}
.projects-numbered .project-num{font-family:var(--font-head);font-size:3rem;line-height:.9;font-weight:var(--heavy);padding:0;color:var(--fg)}
.projects-numbered .project-img,.projects-list .project-img{grid-column:2}
/* tilt */
.tilt{transform-style:preserve-3d;transition:transform .18s ease-out,border-color .25s;will-change:transform}
.tilt::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),color-mix(in srgb,var(--fg) 12%,transparent),transparent 55%);opacity:0;transition:opacity .2s}
.tilt:hover::after{opacity:1}
/* timeline + rows */
.timeline{display:grid;gap:32px}
.entry{display:grid;grid-template-columns:170px 1fr;gap:24px}
.entry-meta{font-family:var(--mono);font-size:.8rem;color:var(--muted);padding-top:4px}
.entry h3{font-size:1.1rem}
.entry .at{color:var(--muted);font-weight:500}
.entry p{margin:6px 0 0}
.rows{list-style:none;display:grid}
.rows li{display:flex;justify-content:space-between;gap:20px;padding:15px 0;border-bottom:var(--bw) solid var(--line);flex-wrap:wrap}
.rows li:first-child{padding-top:0}
.row-title{font-weight:600}
.row-meta{color:var(--muted);font-size:.92rem}
.contact .big-link{font-family:var(--font-head);font-size:clamp(1.6rem,5vw,3.2rem);font-weight:var(--hw);letter-spacing:-.025em;display:inline-block;margin:8px 0 14px;word-break:break-all;text-decoration:none;background:linear-gradient(currentColor,currentColor) 0 100%/0 2px no-repeat;transition:background-size .4s}
.contact .big-link:hover{background-size:100% 2px}
.contact .availability{margin:0 0 6px}
.foot{padding:40px 0 80px;color:var(--muted);font-size:.82rem;border-top:var(--bw) solid var(--line);font-family:var(--mono);position:relative}
.foot .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;max-width:1240px}
.marquee{overflow:hidden;background:var(--fg);color:var(--bg);white-space:nowrap;position:relative}
.marquee-track{display:inline-block;padding:14px 0;font-family:var(--font-head);font-weight:var(--heavy);text-transform:uppercase;letter-spacing:.01em;font-size:1.1rem;animation:marquee 32s linear infinite}
.marquee-track span{margin:0 22px}
@keyframes marquee{to{transform:translateX(-50%)}}

/* ===================== THEME: editorial ===================== */
.layout-editorial .wrap{max-width:1180px}
.masthead{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-family:var(--mono);font-size:.74rem;text-transform:uppercase;letter-spacing:.1em;padding:18px 0 14px;border-bottom:4px double var(--fg)}
.ed-hero{padding:calc(var(--pad) * .7) 0 var(--pad)}
.ed-name{line-height:.86;letter-spacing:-.045em;font-weight:var(--heavy);padding-bottom:22px;border-bottom:1px solid var(--fg);white-space:nowrap}
.ed-dek{display:grid;grid-template-columns:1fr 2fr 1.2fr;gap:36px;padding-top:24px}
.ed-kicker{font-family:var(--mono);font-size:.78rem;text-transform:uppercase;letter-spacing:.08em}
.ed-standfirst{font-family:var(--font-head);font-size:clamp(1.3rem,2.4vw,1.9rem);line-height:1.25;font-style:italic;margin:0}
.ed-byline .availability{margin-top:0}
.ed-figure{margin:40px 0 0;border-top:1px solid var(--fg);padding-top:8px}
.ed-figure .three{height:min(58vh,520px)}
.ed-figure figcaption{font-family:var(--mono);font-size:.74rem;color:var(--muted);margin-top:8px}
.layout-editorial .sec{display:grid;grid-template-columns:220px 1fr;gap:56px;border-top:1px solid var(--fg)}
.layout-editorial .sec-label{position:sticky;top:84px;align-self:start;font-size:.8rem;font-family:var(--mono);font-weight:500;letter-spacing:.08em;text-transform:uppercase}
.layout-editorial .sec-label .num{display:block;font-family:var(--font-head);font-size:3.4rem;color:var(--fg);letter-spacing:-.03em;margin-bottom:6px;font-weight:var(--heavy)}
.layout-editorial .about{max-width:none;font-size:1.12rem}
.layout-editorial .about > p:first-child::first-letter{float:left;font-family:var(--font-head);font-size:4.8em;line-height:.78;padding:.06em .1em 0 0;font-weight:var(--heavy)}
@media (min-width:980px){.layout-editorial .about{column-count:2;column-gap:44px}}

/* ===================== THEME: terminal ===================== */
.layout-terminal .wrap{max-width:1040px}
.term-hero{padding:56px 0 24px;position:relative}
.term{border:1px solid var(--line-strong);border-radius:calc(var(--r) * 1.4);background:color-mix(in srgb,var(--bg) 92%,var(--fg));overflow:hidden;box-shadow:0 30px 80px -30px rgba(0,0,0,.6);position:relative;z-index:1}
.term-bar{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--line);font-size:.78rem;color:var(--muted)}
.term-bar i{width:11px;height:11px;border-radius:50%;border:1.5px solid var(--line-strong);display:inline-block}
.term-bar i:first-child{background:var(--fg);border-color:var(--fg)}
.term-bar span{margin:0 auto}
.term-screen{height:min(58vh,460px);overflow-y:auto;padding:18px 20px;font-size:.92rem;line-height:1.7;cursor:text}
.term-out .ln{white-space:pre-wrap;word-break:break-word}
.term-out .row{display:grid;grid-template-columns:150px 1fr;gap:12px}
.t-prompt{color:var(--muted)}
.t-key{color:var(--muted)}
.t-dim{color:var(--muted)}
.t-err{opacity:.85;font-style:italic}
.t-caret{animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.term-line{display:flex;gap:10px;align-items:center}
.term-line input{flex:1;background:none;border:0;outline:0;color:var(--fg);font:inherit;caret-color:var(--fg);padding:0}
.term-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;position:relative;z-index:1}
.term-chips button{font:inherit;font-size:.82rem;background:transparent;color:var(--fg);border:1px dashed var(--line-strong);border-radius:6px;padding:5px 12px;cursor:pointer}
.term-chips button:hover{border-style:solid;border-color:var(--fg)}
.scroll-note{font-size:.85rem;color:var(--muted);margin:24px 0 0}
.layout-terminal .sec{border-top:1px dashed var(--line)}
.layout-terminal .sec-label{font-size:1rem;font-weight:500}
.layout-terminal .tags li{border-radius:4px;border-style:dashed}
.layout-terminal .term-hero.place-side{grid-template-columns:1.6fr 1fr}

/* ===================== THEME: bento ===================== */
.layout-bento .wrap{max-width:1240px}
.bento{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:28px 0 40px;grid-auto-flow:dense}
.tile{border:var(--bw) solid var(--line);border-radius:calc(var(--r) * 1.8);padding:28px;background:var(--card);position:relative;overflow:hidden}
.bento .sec.tile{padding:30px;border-top:var(--bw) solid var(--line)}
.t-hero{padding:40px;display:flex;flex-direction:column;justify-content:center}
.t-hero h1{font-size:clamp(2.6rem,6vw,4.8rem);font-weight:var(--heavy)}
.t-hero .headline{color:var(--muted);font-size:1.12rem;margin-top:12px}
.pill{display:inline-flex;align-self:flex-start;align-items:center;gap:10px;border:1px solid var(--line-strong);border-radius:99px;padding:5px 14px 5px 12px;font-size:.8rem;margin-bottom:22px;font-family:var(--mono)}
.t-visual{grid-row:span 2;display:grid;place-items:center;padding:0;min-height:320px}
.t-visual .three{position:absolute;inset:0;min-height:0}
.t-visual .avatar{width:100%;height:100%;border-radius:0;border:0;object-fit:cover}
.t-stat{display:flex;flex-direction:column;justify-content:space-between;min-height:150px}
.t-stat b{font-family:var(--font-head);font-size:3rem;line-height:1;font-weight:var(--heavy);letter-spacing:-.04em}
.t-stat span{color:var(--muted);font-size:.85rem;font-family:var(--mono)}
.t-loc b{font-size:1.5rem;letter-spacing:-.02em}
.span-1{grid-column:span 1}.span-2{grid-column:span 2}.span-3{grid-column:span 3}.span-4{grid-column:span 4}
.bento .entry{grid-template-columns:1fr;gap:4px}
.bento .sec-label{font-size:.78rem;font-family:var(--mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:500}

/* ===================== THEME: sidebar ===================== */
.layout-sidebar .shell{display:grid;grid-template-columns:330px 1fr;min-height:100vh}
.layout-sidebar aside{position:sticky;top:0;height:100vh;overflow:auto;padding:52px 34px;border-right:var(--bw) solid var(--line);display:flex;flex-direction:column;gap:20px}
.layout-sidebar aside h1{font-size:2.1rem}
.layout-sidebar aside nav ul{list-style:none;display:grid;gap:4px;margin-top:8px}
.layout-sidebar aside nav a{text-decoration:none;color:var(--muted);font-size:.92rem;display:block;padding:3px 0;transition:color .2s,padding .2s}
.layout-sidebar aside nav a:hover{color:var(--fg);padding-left:6px}
.layout-sidebar aside .links{flex-direction:column;gap:6px;margin-top:auto}
.layout-sidebar main{padding:0 60px;max-width:960px}
.layout-sidebar .lead{padding:var(--pad) 0 calc(var(--pad) / 2)}
.layout-sidebar .lead .statement{font-size:calc(var(--statement) * .85)}
.layout-sidebar .sec:first-of-type{border-top:0}

/* ===================== THEME: spatial (3D) ===================== */
.layout-spatial .space-bg{position:fixed;inset:0;z-index:0;pointer-events:none}
.layout-spatial .space-bg .three{position:absolute;inset:0;min-height:0}
.space-glow{position:absolute;inset:0;background:radial-gradient(60% 50% at 70% 30%,color-mix(in srgb,var(--fg) 8%,transparent),transparent 70%),radial-gradient(40% 40% at 20% 80%,color-mix(in srgb,var(--fg) 6%,transparent),transparent 70%)}
.layout-spatial main,.layout-spatial .foot{position:relative;z-index:1}
.layout-spatial .wrap{max-width:1100px}
.sp-hero{min-height:100vh;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:120px 0 90px;position:relative}
.sp-hero h1{font-size:clamp(3.4rem,12vw,10rem);line-height:.9;letter-spacing:-.05em;font-weight:var(--heavy);mix-blend-mode:difference;color:#fff}
.sp-hero .tagline{font-size:clamp(1.1rem,2vw,1.4rem)}
.sp-scroll{position:absolute;right:28px;bottom:40px;width:26px;height:44px;border:1.5px solid var(--line-strong);border-radius:99px}
.sp-scroll span{position:absolute;left:50%;top:8px;width:4px;height:8px;margin-left:-2px;border-radius:2px;background:var(--fg);animation:scrolly 1.8s ease-in-out infinite}
@keyframes scrolly{60%{transform:translateY(14px);opacity:0}}
.sp-sections{padding-bottom:80px}
.glass{background:color-mix(in srgb,var(--bg) 58%,transparent);backdrop-filter:blur(22px) saturate(130%);-webkit-backdrop-filter:blur(22px) saturate(130%);border:1px solid color-mix(in srgb,var(--fg) 14%,transparent);border-radius:calc(var(--r) * 2);padding:44px;margin:0 0 22px}
.layout-spatial .sec.glass{border-top:1px solid color-mix(in srgb,var(--fg) 14%,transparent)}
.layout-spatial .projects-cards .project{background:color-mix(in srgb,var(--bg) 40%,transparent)}

/* ===================== THEME: swiss ===================== */
.layout-swiss .wrap{max-width:1380px;padding:0 32px}
.sw-hero{padding:24px 0 var(--pad)}
.sw-top{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;border-top:8px solid var(--fg);padding-top:12px;font-weight:600;font-size:.9rem}
.sw-top span:last-child{text-align:right}
.sw-name{display:flex;flex-direction:column;font-size:clamp(3.6rem,15.5vw,16rem);line-height:.82;letter-spacing:-.065em;font-weight:var(--heavy);margin:40px 0 48px}
.sw-line{display:block}
.sw-line:nth-child(2){padding-left:12%}
.sw-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;border-top:2px solid var(--fg);padding-top:14px}
.sw-k{display:block;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.sw-v{font-size:.98rem;line-height:1.45}
.sw-v .links{flex-direction:column;gap:2px;margin:0}
.sw-band{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;margin-top:64px;align-items:end}
.sw-statement{grid-column:1 / span 8;font-family:var(--font-head);font-size:var(--statement);line-height:1.02;letter-spacing:-.04em;font-weight:700;margin:0}
.sw-namerow.has-visual{display:grid;grid-template-columns:1fr minmax(260px,36%);gap:24px;align-items:center}
.sw-namerow.has-visual .sw-name{font-size:clamp(3.4rem,11.5vw,12rem)}
.sw-visual .three{height:min(52vh,460px)}
.layout-swiss .sec{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;border-top:2px solid var(--fg)}
.layout-swiss .sec-label{grid-column:1 / span 4;font-size:1.1rem;font-weight:700}
.layout-swiss .sec-label .num{display:block;font-family:var(--font-head);font-size:clamp(3rem,7vw,6.5rem);line-height:.85;letter-spacing:-.06em;color:var(--accent);font-weight:var(--heavy);margin-bottom:14px}
.layout-swiss .sec-body{grid-column:5 / span 8}
.layout-swiss .tags li{border-radius:0;border-width:2px;border-color:var(--fg);font-weight:600}

/* ===================== THEME: retro desktop ===================== */
.layout-os{background-image:radial-gradient(color-mix(in srgb,var(--fg) 38%,var(--bg)) .8px,transparent .9px);background-size:4px 4px;font-size:15px}
.menubar{position:sticky;top:0;z-index:999;display:flex;gap:22px;align-items:center;height:32px;padding:0 16px;background:var(--bg);border-bottom:2px solid var(--fg);font-family:var(--font-head);font-size:.82rem}
.menubar .spacer{flex:1}
.desktop{position:relative;min-height:1180px;padding:20px}
.icons{position:absolute;right:18px;top:20px;display:grid;gap:14px;z-index:1}
.icon{display:flex;flex-direction:column;align-items:center;gap:4px;width:96px;background:none;border:0;color:var(--fg);cursor:pointer;padding:4px;font:inherit}
.icon span{font-family:var(--font-head);font-size:.68rem;background:var(--bg);padding:1px 5px;text-align:center;line-height:1.3}
.icon.sel span,.icon:focus-visible span{background:var(--fg);color:var(--bg)}
.win{position:absolute;background:var(--bg);border:2px solid var(--fg);box-shadow:5px 5px 0 var(--fg);max-width:calc(100% - 140px)}
.win-bar{display:flex;align-items:center;gap:10px;height:28px;padding:0 8px;border-bottom:2px solid var(--fg);cursor:grab;user-select:none;touch-action:none}
.win.active .win-bar{background:repeating-linear-gradient(to bottom,var(--fg) 0 2px,var(--bg) 2px 4px)}
.win-close{width:15px;height:15px;border:2px solid var(--fg);background:var(--bg);padding:0;cursor:pointer;flex:none}
.win-close:hover{background:var(--fg)}
.win-title{font-size:.78rem;font-weight:400;margin:0 auto;padding:0 10px;background:var(--bg);letter-spacing:0}
.win-body{padding:20px 22px;max-height:62vh;overflow:auto}
.win-3d .win-body{padding:0}
.win-3d .three{height:300px;min-height:0}
.hello{display:flex;gap:16px;align-items:center;margin-bottom:12px}
.hello .avatar{width:64px;height:64px;border-radius:0;border:2px solid var(--fg)}
.hello .eyebrow{margin:0}
.os-name{font-family:var(--font-head);font-size:clamp(1.6rem,3.4vw,2.4rem);line-height:1.05;margin:4px 0 6px}
.hint{font-size:.78rem;color:var(--muted);border-top:2px dotted var(--line-strong);padding-top:10px;margin-top:18px}
.layout-os .btn{border-radius:0;box-shadow:3px 3px 0 var(--fg);border-width:2px}
.layout-os .tags li{border-radius:0;border:2px solid var(--fg)}
.layout-os .entry{grid-template-columns:1fr;gap:2px}
.layout-os .projects-list .project{grid-template-columns:40px 1fr}

/* ===================== THEME: kinetic ===================== */
.kn-hero{min-height:100vh;min-height:100svh;display:flex;flex-direction:column;justify-content:space-between;padding:28px 0 40px;position:relative;overflow:hidden}
.kn-top{display:flex;justify-content:space-between;gap:18px;padding:0 28px;font-family:var(--mono);font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;flex-wrap:wrap;position:relative;z-index:1}
.kn-name{display:flex;flex-direction:column;font-size:clamp(4rem,17vw,19rem);line-height:.84;letter-spacing:-.05em;font-weight:var(--heavy);white-space:nowrap;padding:0 20px;position:relative;z-index:1}
.kn-line{display:block;will-change:transform}
.outline{color:var(--bg);text-shadow:1.5px 0 var(--fg),-1.5px 0 var(--fg),0 1.5px var(--fg),0 -1.5px var(--fg),1px 1px var(--fg),-1px -1px var(--fg),1px -1px var(--fg),-1px 1px var(--fg)}
.kn-line.outline{align-self:flex-end}
.kn-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:0 28px;flex-wrap:wrap;position:relative;z-index:1}
.kn-tag{max-width:32ch;font-size:1.2rem;margin:0}
.layout-kinetic .marquee-track{font-size:clamp(1.6rem,4vw,3rem);padding:18px 0}
.layout-kinetic .wrap{max-width:1300px}
.layout-kinetic .sec-label{font-size:clamp(3rem,10vw,8.5rem);line-height:.9;letter-spacing:-.05em;font-weight:var(--heavy);color:var(--bg);text-shadow:1.5px 0 var(--fg),-1.5px 0 var(--fg),0 1.5px var(--fg),0 -1.5px var(--fg),1px 1px var(--fg),-1px -1px var(--fg),1px -1px var(--fg),-1px 1px var(--fg);margin-bottom:44px;transition:color .4s}
.layout-kinetic .sec:hover .sec-label{color:var(--fg)}
.layout-kinetic .projects-list .project{grid-template-columns:90px 1fr;padding:34px 18px;margin:0 -18px;transition:background .3s,color .3s}
.layout-kinetic .projects-list .project:hover{background:var(--fg);color:var(--bg)}
.layout-kinetic .projects-list .project:hover p,.layout-kinetic .projects-list .project:hover .stars,.layout-kinetic .projects-list .project:hover .tags.small li,.layout-kinetic .projects-list .project:hover .project-num{color:var(--bg)}
.layout-kinetic .projects-list h3{font-size:clamp(1.8rem,4.5vw,3.6rem);letter-spacing:-.04em}
.layout-kinetic .bullets{display:none}
.hover-img{position:fixed;left:0;top:0;width:280px;aspect-ratio:4/3;object-fit:cover;pointer-events:none;z-index:900;opacity:0;transition:opacity .25s;border:1px solid var(--line-strong)}
.hover-img.on{opacity:1}

/* ===================== THEME: blueprint ===================== */
.layout-blueprint .wrap{max-width:1180px}
.bp-hero{padding:48px 0 24px}
.bp-frame{position:relative;border:1px solid var(--line-strong);padding:22px 30px 34px}
.crop{position:absolute;width:18px;height:18px;border-color:var(--fg);border-style:solid;border-width:0}
.crop.tl{top:-10px;left:-10px;border-top-width:1px;border-left-width:1px}
.crop.tr{top:-10px;right:-10px;border-top-width:1px;border-right-width:1px}
.crop.bl{bottom:-10px;left:-10px;border-bottom-width:1px;border-left-width:1px}
.crop.br{bottom:-10px;right:-10px;border-bottom-width:1px;border-right-width:1px}
.bp-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-family:var(--mono);font-size:.7rem;letter-spacing:.08em;color:var(--muted);border-bottom:1px dashed var(--line-strong);padding-bottom:12px;margin-bottom:34px}
.bp-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:40px;align-items:center}
.bp-hero h1{font-size:var(--h1);letter-spacing:-.03em}
.dim{position:relative;height:18px;margin:14px 0 22px;border-left:1px solid var(--fg);border-right:1px solid var(--fg);max-width:100%}
.dim::before{content:'';position:absolute;left:0;right:0;top:50%;border-top:1px solid var(--fg)}
.dim span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:var(--bg);padding:0 10px;font-family:var(--mono);font-size:.68rem;letter-spacing:.08em;white-space:nowrap}
.spec{border-collapse:collapse;width:100%;font-size:.9rem;margin-top:22px}
.spec th,.spec td{border:1px solid var(--line-strong);padding:8px 12px;text-align:left;vertical-align:top}
.spec th{font-family:var(--mono);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:500;width:110px}
.spec .links{margin:0}
.bp-visual{margin:0;border:1px dashed var(--line-strong);position:relative;display:grid;place-items:center;min-height:340px}
.bp-visual .three{position:absolute;inset:0;min-height:0}
.bp-visual figcaption{position:absolute;left:10px;bottom:8px;font-family:var(--mono);font-size:.66rem;letter-spacing:.08em;color:var(--muted)}
.layout-blueprint .sec{border:1px dashed var(--line-strong);padding:44px 32px 32px;margin:36px 0}
.layout-blueprint .sec-label{position:absolute;top:-.75em;left:20px;background:var(--bg);padding:0 10px;font-family:var(--mono);font-size:.82rem;letter-spacing:.06em;font-weight:500;margin:0}
.layout-blueprint .tags li{border-radius:0;border-style:dashed;font-family:var(--mono);font-size:.8rem}
.layout-blueprint .projects-grid .project,.layout-blueprint .projects-cards .project{border-style:dashed;background:transparent}
.title-block{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;border:1px solid var(--line-strong);margin:40px 0 80px;font-family:var(--mono)}
.title-block div{padding:10px 14px;border-left:1px solid var(--line-strong);display:flex;flex-direction:column;gap:2px}
.title-block div:first-child{border-left:0}
.title-block span{font-size:.64rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}

/* ===================== THEME: brutalist ===================== */
.layout-brutalist{--bw:2px}
.layout-brutalist .wrap{max-width:1100px}
.layout-brutalist h1{font-size:calc(var(--h1) * 1.1);text-transform:uppercase;letter-spacing:-.045em;font-weight:var(--heavy);line-height:.88}
.layout-brutalist .sec-label{text-transform:uppercase;font-weight:var(--heavy);font-size:calc(var(--h2) * 1.6);letter-spacing:-.03em}
.layout-brutalist .sec{border-top:3px solid var(--fg)}
.layout-brutalist .marquee + .wrap > .sec:first-child{border-top:0}
.layout-brutalist .projects-cards .project,.layout-brutalist .projects-grid .project{border:2px solid var(--fg);box-shadow:6px 6px 0 var(--fg);background:var(--bg)}
.layout-brutalist .projects-cards .project:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--fg)}
.layout-brutalist .tags li{border:2px solid var(--fg);border-radius:0;font-weight:600}
.layout-brutalist .btn{border:2px solid var(--fg);box-shadow:4px 4px 0 var(--fg)}
.layout-brutalist .nav{border-bottom:3px solid var(--fg)}
.layout-brutalist .rows li:hover{background:var(--fg);color:var(--bg)}
.layout-brutalist .marquee{border-top:3px solid var(--fg);border-bottom:3px solid var(--fg)}
.layout-brutalist .meta-grid{border-top:2px solid var(--fg)}

/* ===================== effects ===================== */
#progress{position:fixed;left:0;top:0;height:3px;width:100%;background:var(--accent);transform-origin:0 50%;transform:scaleX(0);z-index:1000}
${d.grain ? `body::after{content:'';position:fixed;inset:-50%;z-index:998;pointer-events:none;background-image:${GRAIN};opacity:${d.mode === 'dark' ? 0.11 : 0.07};animation:grain 1.2s steps(5) infinite}
@keyframes grain{0%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-3%)}60%{transform:translate(-2%,-1%)}80%{transform:translate(3%,2%)}100%{transform:translate(0,0)}}` : ''}
#preloader{position:fixed;inset:0;z-index:1500;background:var(--fg);color:var(--bg);display:flex;justify-content:space-between;align-items:flex-end;padding:32px;transition:transform .9s cubic-bezier(.75,0,.2,1);animation:pre-safety 0s 4s forwards}
#preloader.done{transform:translateY(-100%)}
.pre-name{font-family:var(--font-head);font-size:clamp(1.2rem,3vw,2rem);font-weight:600}
.pre-count{font-family:var(--mono);font-size:clamp(4rem,15vw,12rem);line-height:.8;letter-spacing:-.06em}
@keyframes pre-safety{to{visibility:hidden}}
.has-cursor,.has-cursor *{cursor:none!important}
.c-dot,.c-ring,.c-h,.c-v,.c-label{position:fixed;left:0;top:0;pointer-events:none;z-index:1400}
.c-dot{width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:var(--fg)}
.c-ring{width:36px;height:36px;margin:-18px 0 0 -18px;border:1px solid var(--fg);border-radius:50%;transition:width .25s,height .25s,margin .25s,background .25s}
.cursor-hover .c-ring{width:64px;height:64px;margin:-32px 0 0 -32px;background:color-mix(in srgb,var(--fg) 10%,transparent)}
.cursor-ring .c-dot{display:none}
.cursor-invert .c-dot{display:none}
.cursor-invert .c-ring{width:28px;height:28px;margin:-14px 0 0 -14px;background:#fff;border:0;mix-blend-mode:difference}
.cursor-invert.cursor-hover .c-ring{width:96px;height:96px;margin:-48px 0 0 -48px;background:#fff}
.cursor-crosshair .c-ring{display:none}
.c-h{width:100vw;height:1px;background:var(--line-strong)}
.c-v{width:1px;height:100vh;background:var(--line-strong)}
.c-label{font:500 10px var(--mono);letter-spacing:.06em;color:var(--muted);white-space:pre}
${d.motion === 'none' ? '*,*::before,*::after{transition:none!important;animation:none!important}' : ''}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.reveal{opacity:1!important;transform:none!important}}

/* ===================== responsive ===================== */
@media (max-width:980px){
  .layout-sidebar .shell{grid-template-columns:1fr}
  .layout-sidebar aside{position:static;height:auto;border-right:0;border-bottom:var(--bw) solid var(--line);padding:32px 24px}
  .layout-sidebar main{padding:0 24px}
  .layout-editorial .sec{grid-template-columns:1fr;gap:12px}
  .layout-editorial .sec-label{position:static}
  .ed-dek{grid-template-columns:1fr;gap:12px}
  .ed-name{white-space:normal}
  .bento{grid-template-columns:1fr 1fr}
  .bento .span-3,.bento .span-4{grid-column:span 2}
  .layout-swiss .sec{grid-template-columns:1fr}
  .layout-swiss .sec-label,.layout-swiss .sec-body{grid-column:auto}
  .sw-band{grid-template-columns:1fr}
  .sw-statement{grid-column:auto}
  .sw-namerow.has-visual{grid-template-columns:1fr}
  .bp-grid{grid-template-columns:1fr}
}
@media (max-width:720px){
  .wrap{padding:0 20px}
  .split,.has-3d.place-side,.layout-terminal .term-hero.place-side{grid-template-columns:1fr}
  .has-3d.place-side .three{height:300px}
  .entry{grid-template-columns:1fr;gap:4px}
  .projects-numbered .project,.projects-list .project{grid-template-columns:1fr;gap:6px}
  .projects-numbered .project-img,.projects-list .project-img{grid-column:auto}
  .bento{grid-template-columns:1fr}
  .bento > *,.bento .span-2,.bento .span-3,.bento .span-4{grid-column:span 1!important}
  .t-visual{grid-row:auto;min-height:280px}
  .nav ul{display:none}
  .sw-top,.sw-meta{grid-template-columns:1fr 1fr}
  .sw-line:nth-child(2){padding-left:0}
  .term-out .row{grid-template-columns:1fr;gap:0}
  .glass{padding:26px}
  .title-block{grid-template-columns:1fr 1fr}
  .desktop{min-height:0;padding:12px}
  .icons{position:static;display:flex;overflow-x:auto;gap:4px;margin-bottom:14px}
  .win,.win[hidden]{position:relative!important;left:auto!important;top:auto!important;width:auto!important;max-width:none;display:block;margin:0 0 18px}
  .win-body{max-height:none}
  .kn-name{font-size:clamp(3rem,19vw,8rem)}
  .layout-kinetic .projects-list .project{grid-template-columns:1fr;margin:0;padding:26px 0}
}
@media print{.nav,.nav-floating,.marquee,#preloader,.space-bg{display:none}.reveal{opacity:1;transform:none}}
`;
}

// ---------------------------------------------------------------- animations

function bgAnimHtml(d) {
  if (!d.bgAnim || d.bgAnim === 'none') return '';
  if (d.bgAnim === 'gradient') return '<div class="bg-anim" aria-hidden="true"><i class="blob"></i><i class="blob"></i><i class="blob"></i></div>';
  if (d.bgAnim === 'grid') return '<div class="bg-anim" aria-hidden="true"><i class="floor"></i></div>';
  return '<div class="bg-anim" aria-hidden="true"></div>';
}

// The inspiration image (or any photo) used as a soft backdrop behind the hero.
function heroImageCss(d) {
  if (!d.heroImage || !d.heroImageMode || d.heroImageMode === 'none' || !/^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(d.heroImage)) return '';
  const mono = d.heroImageMode !== 'color';
  // the hero area differs per layout: Sidebar's #top is the whole page, Retro Desktop's is the desktop
  const H = d.layout === 'sidebar' ? '.lead' : d.layout === 'os' ? '#win-hello .win-body' : '#top';
  const strength = d.heroImageMode === 'subtle' ? 0.35 : 0.9;
  // Image (::before) + a readability scrim (::after) between the image and the text:
  // solid behind the text on the left, fading out so the image still shows on the right.
  return `${H}{position:relative;isolation:isolate;overflow:hidden}
${H}::before{content:'';position:absolute;inset:0;z-index:-2;background:url("${d.heroImage}") center/cover no-repeat;filter:${mono ? 'grayscale(1) contrast(1.05)' : 'saturate(1.05)'}${d.heroImageBlur ? ' blur(14px)' : ''};${d.heroImageBlur ? 'transform:scale(1.12);' : ''}opacity:${strength};pointer-events:none}
${H}::after{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,color-mix(in srgb,var(--bg) 92%,transparent) 0%,color-mix(in srgb,var(--bg) 78%,transparent) 45%,color-mix(in srgb,var(--bg) 25%,transparent) 100%),linear-gradient(0deg,var(--bg) 0%,transparent 30%)}
${H} h1{mix-blend-mode:normal!important;color:var(--fg)!important}
@media (max-width:720px){${H}::after{background:color-mix(in srgb,var(--bg) 82%,transparent)}}`;
}

function animCss() {
  return `
@keyframes e-fade{from{opacity:0}}
@keyframes e-rise{from{opacity:0;transform:translateY(42px)}}
@keyframes e-blur{from{opacity:0;filter:blur(18px);transform:scale(1.04)}}
@keyframes e-scale{from{opacity:0;transform:scale(.86)}}
@keyframes e-mask{from{clip-path:inset(0 0 100% 0);transform:translateY(34px)}to{clip-path:inset(0 0 0 0)}}
@keyframes e-char{from{opacity:0;transform:translateY(.75em) rotate(8deg)}}
@keyframes e-tw{to{opacity:1}}
.enter-fade .enter{animation:e-fade 1.1s ease both}
.enter-rise .enter,.enter-split .enter{animation:e-rise .95s cubic-bezier(.2,.8,.2,1) both}
.enter-typewriter .enter{animation:e-fade .8s ease both}
.enter-blur .enter{animation:e-blur 1.3s cubic-bezier(.2,.8,.2,1) both}
.enter-scale .enter{animation:e-scale .95s cubic-bezier(.2,.8,.2,1) both}
.enter-mask .enter{animation:e-mask 1.15s cubic-bezier(.7,0,.2,1) both}
.enter-h .ch{display:inline-block;animation:e-char .85s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--d,0ms) + var(--i) * 38ms)}
.enter-h .tw{opacity:0;animation:e-tw 0s linear forwards;animation-delay:calc(var(--d,0ms) + 200ms + var(--i) * 70ms)}
.enter-typewriter h1.enter-h::after{content:'\\258D';font-weight:400;margin-left:.04em;animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.reveal{transition:opacity .9s ease,transform .95s cubic-bezier(.2,.8,.2,1),filter .9s ease,clip-path 1.1s cubic-bezier(.7,0,.2,1)}
.rv-fade .reveal{opacity:0}
.rv-rise .reveal{opacity:0;transform:translateY(54px)}
.rv-scale .reveal{opacity:0;transform:scale(.93)}
.rv-blur .reveal{opacity:0;filter:blur(14px)}
.rv-slide .reveal{opacity:0;transform:translateX(-70px)}
.rv-clip .reveal{clip-path:inset(0 0 100% 0)}
.reveal.in{opacity:1;transform:none;filter:none;clip-path:inset(0 0 0 0)}
.reveal .project,.reveal .entry,.reveal .skill-group,.reveal .rows li{opacity:0;translate:0 20px;transition:opacity .7s ease,translate .8s cubic-bezier(.2,.8,.2,1)}
.reveal.in .project,.reveal.in .entry,.reveal.in .skill-group,.reveal.in .rows li{opacity:1;translate:0 0}
.title-letters .sec-label .lc{display:inline-block;opacity:0;transform:translateY(.7em);transition:opacity .5s ease,transform .7s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--i) * 30ms)}
.title-letters .sec.in .sec-label .lc{opacity:1;transform:none}
.title-line .sec-label::after{content:'';display:block;height:2px;width:100%;margin-top:12px;background:var(--accent);transform:scaleX(0);transform-origin:left;transition:transform 1.1s cubic-bezier(.7,0,.2,1) .15s}
.title-line .sec.in .sec-label::after{transform:scaleX(1)}
.link-slide a:not(.btn):not(.brand):not(.skip):not(.big-link){text-decoration:none;background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .35s}
.link-slide a:not(.btn):not(.brand):not(.skip):not(.big-link):hover{background-size:100% 1px}
.link-highlight a:not(.btn):not(.brand):not(.skip):not(.big-link){text-decoration:none;background:linear-gradient(var(--fg),var(--fg)) 0 100%/100% 1px no-repeat;transition:background-size .3s,color .3s;padding:0 2px}
.link-highlight a:not(.btn):not(.brand):not(.skip):not(.big-link):hover{background-size:100% 100%;color:var(--bg)}
.link-arrow a:not(.btn):not(.brand):not(.skip)::after{content:'\\2192';display:inline-block;margin-left:4px;opacity:0;transform:translateX(-6px);transition:opacity .25s,transform .25s}
.link-arrow a:not(.btn):not(.brand):not(.skip):hover::after{opacity:1;transform:none}
.card-lift .project{transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s,border-color .25s}
.card-lift .project:hover{transform:translateY(-8px);box-shadow:0 28px 50px -26px rgba(0,0,0,.5)}
.card-invert .project{transition:background .3s,color .3s}
.card-invert .project:hover{background:var(--fg)!important;color:var(--bg)}
.card-invert .project:hover p,.card-invert .project:hover .stars,.card-invert .project:hover .tags.small li,.card-invert .project:hover .project-num{color:var(--bg)}
.card-zoom .project{overflow:hidden}
.card-zoom .project-img{transition:transform .7s cubic-bezier(.2,.8,.2,1),filter .4s}
.card-zoom .project:hover .project-img{transform:scale(1.07)}
.card-outline .project{transition:outline-offset .25s}
.card-outline .project:hover{outline:2px solid var(--fg);outline-offset:6px}
.bg-anim{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.bg-anim canvas{display:block}
.bg-anim .blob{position:absolute;width:60vmax;height:60vmax;border-radius:50%;filter:blur(70px);opacity:.32;background:radial-gradient(circle,var(--fg),transparent 62%);animation:blob 22s ease-in-out infinite alternate}
.bg-anim .blob:nth-child(1){top:-25%;left:-15%}
.bg-anim .blob:nth-child(2){bottom:-30%;right:-20%;animation-duration:28s;opacity:.22}
.bg-anim .blob:nth-child(3){top:25%;left:35%;width:38vmax;height:38vmax;animation-duration:17s;opacity:.16}
@keyframes blob{50%{transform:translate(12vw,10vh) scale(1.15)}100%{transform:translate(-8vw,14vh) scale(.9)}}
.bg-anim .floor{position:absolute;left:-50%;right:-50%;bottom:-10%;height:70vh;background-image:linear-gradient(var(--line-strong) 1px,transparent 1px),linear-gradient(90deg,var(--line-strong) 1px,transparent 1px);background-size:64px 64px;transform:perspective(420px) rotateX(62deg);transform-origin:50% 100%;animation:floor 2.4s linear infinite;-webkit-mask:linear-gradient(transparent,#000 70%);mask:linear-gradient(transparent,#000 70%)}
@keyframes floor{to{background-position:0 64px}}
@keyframes e-flip{from{opacity:0;transform:perspective(800px) rotateX(-70deg);transform-origin:50% 0}}
@keyframes e-slide{from{opacity:0;transform:translateX(-80px)}}
@keyframes e-zoom{from{opacity:0;transform:scale(1.25);filter:blur(10px)}}
@keyframes e-wave{0%{opacity:0;transform:translateY(.9em)}60%{opacity:1;transform:translateY(-.18em)}100%{transform:none}}
@keyframes curtain-up{0%{transform:none}100%{transform:translateY(-101%)}}
.enter-flip .enter{animation:e-flip 1s cubic-bezier(.2,.8,.2,1) both}
.enter-slide .enter{animation:e-slide .9s cubic-bezier(.2,.8,.2,1) both}
.enter-zoom .enter{animation:e-zoom 1.2s cubic-bezier(.2,.8,.2,1) both}
.enter-wave .enter,.enter-curtain .enter{animation:e-rise .95s cubic-bezier(.2,.8,.2,1) both}
.enter-wave .enter-h .ch{animation-name:e-wave;animation-duration:.9s}
.curtain{position:fixed;inset:0;z-index:1600;background:var(--fg);animation:curtain-up 1s .25s cubic-bezier(.76,0,.24,1) forwards;pointer-events:none}
.rv-flip .reveal{opacity:0;transform:perspective(1000px) rotateX(-22deg) translateY(40px);transform-origin:50% 0}
.rv-tilt .reveal{opacity:0;transform:rotate(-3deg) translateY(60px)}
.rv-zoom .reveal{opacity:0;transform:scale(1.08);filter:blur(8px)}
.rv-skew .reveal{opacity:0;transform:skewY(6deg) translateY(70px)}
.title-highlight .sec-label{background:linear-gradient(color-mix(in srgb,var(--accent) 32%,transparent),color-mix(in srgb,var(--accent) 32%,transparent)) 0 88%/0 .38em no-repeat;transition:background-size 1.1s cubic-bezier(.7,0,.2,1) .2s;display:inline-block}
.title-highlight .sec.in .sec-label{background-size:100% .38em}
.title-blur .sec-label{opacity:0;filter:blur(12px);letter-spacing:.2em;transition:opacity 1s,filter 1s,letter-spacing 1.2s cubic-bezier(.2,.8,.2,1)}
.title-blur .sec.in .sec-label{opacity:1;filter:none;letter-spacing:inherit}
.title-wave .sec-label .lc{display:inline-block}
.title-wave .sec.in .sec-label .lc{animation:e-wave .8s calc(var(--i) * 45ms) both}
.card-spotlight .project,.card-spotlight .tile{position:relative;overflow:hidden}
.card-spotlight .project::before,.card-spotlight .tile::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s;background:radial-gradient(320px circle at var(--gx,50%) var(--gy,50%),color-mix(in srgb,var(--fg) 13%,transparent),transparent 65%)}
.card-spotlight .project:hover::before,.card-spotlight .tile:hover::before{opacity:1}
.card-shine .project{position:relative;overflow:hidden}
.card-shine .project::after{content:'';position:absolute;top:0;bottom:0;left:-60%;width:40%;pointer-events:none;background:linear-gradient(105deg,transparent,color-mix(in srgb,var(--fg) 14%,transparent),transparent);transform:skewX(-20deg);transition:left .8s cubic-bezier(.2,.8,.2,1)}
.card-shine .project:hover::after{left:130%}
.c-spot{position:fixed;inset:0;pointer-events:none;z-index:990;background:radial-gradient(260px circle at var(--sx,-999px) var(--sy,-999px),color-mix(in srgb,var(--fg) 9%,transparent),transparent 70%)}
.c-trail{position:fixed;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--accent);pointer-events:none;z-index:1400}
.text-fill .fw{opacity:.18;transition:opacity .35s}
.text-fill .fw.on{opacity:1}
.scroll-skew .sec-body,.scroll-skew .hero-content{transform:skewY(var(--skew,0deg));will-change:transform}
.fx-ripple{position:fixed;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2px solid var(--fg);pointer-events:none;z-index:1500;animation:fx-rip .7s ease-out forwards}
@keyframes fx-rip{to{transform:scale(7);opacity:0}}
.fx-burst{position:fixed;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:var(--accent);pointer-events:none;z-index:1500;animation:fx-bur .65s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes fx-bur{to{transform:translate(var(--bx),var(--by)) scale(.2);opacity:0}}
@media (prefers-reduced-motion:reduce){.curtain{display:none}.text-fill .fw{opacity:1}.title-blur .sec-label{opacity:1;filter:none}}
@media (prefers-reduced-motion:reduce){.enter,.enter-h .ch,.enter-h .tw{animation:none!important;opacity:1!important}.reveal,.reveal .project,.reveal .entry,.reveal .skill-group,.reveal .rows li{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important;translate:none!important}.title-letters .sec-label .lc{opacity:1;transform:none}}
`;
}

// ---------------------------------------------------------------- page

export function renderPortfolio(profile, design, opts = {}) {
  const p = profile;
  const themeKey = THEMES[design.layout] ? design.layout : 'classic';
  const def = THEMES[themeKey];
  const d = { ...design, theme: themeKey, layout: def.base || themeKey };
  const custom = customColors(d);
  if (custom) d.mode = luminance(custom.bg) < 0.2 ? 'dark' : 'light';
  const b = p.basics;
  const pair = d.layout === 'terminal' ? FONT_PAIRS.mono : FONT_PAIRS[d.fontPair] || FONT_PAIRS.inter;
  const families = new Set([...pair.families, ...(def.families || []), 'JetBrains+Mono:wght@400;500;700']);
  const fontHref = `https://fonts.googleapis.com/css2?${[...families].map((f) => `family=${f}`).join('&')}&display=swap`;
  const sections = visibleSections(p, d);
  const body = T[d.layout](p, d, sections, opts);
  const kind = sceneKind(d);
  const description = b.tagline || b.headline || `${b.name} — developer portfolio`;
  const lite = opts.thumb;

  const effectsCfg = {
    cursor: lite ? 'none' : d.cursor,
    tilt: !lite && d.tilt,
    magnetic: !lite && d.magnetic,
    scramble: !lite && d.scramble,
    live: d.liveRepos && !opts.preview && !lite,
    preview: !!opts.preview || !!lite,
  };
  const animCfg = {
    entrance: d.entrance,
    titleAnim: d.titleAnim,
    parallax: !lite && d.parallax,
    counters: !lite && d.counters,
    bgAnim: lite ? 'none' : d.bgAnim,
    textFill: !lite && d.textFill,
    scrollSkew: !lite && d.scrollSkew,
    clickFx: lite ? 'none' : d.clickFx,
    cardHover: d.cardHover,
    introDelay: d.preloader && !opts.preview && !lite ? 1100 : 0,
  };
  const scripts = [`(${effectsRuntime.toString()})(${inlineJson(effectsCfg)});`, `(${animRuntime.toString()})(${inlineJson(animCfg)});`];
  if (d.layout === 'terminal') scripts.push(`(${terminalRuntime.toString()})(${inlineJson(profileDigest(p))},${inlineJson({ preview: !!opts.preview || !!lite, delay: d.preloader && !opts.preview ? 1300 : 300 })});`);
  if (d.layout === 'os') scripts.push(`(${desktopRuntime.toString()})();`);

  const needsThree = !lite && kind !== 'none' && kind !== 'embed';
  const firstName = nameWords(b.name)[0] || '';
  const threeCfg = {
    kind,
    seed: hashString(`${b.name}|${d.seed}`),
    model: d.modelData || d.modelUrl || '',
    mono: d.modelMono !== false,
    speed: Number(d.threeSpeed) || 1,
    drag: !!d.drag3d,
    text: firstName.length && firstName.length <= 7 ? firstName : initials(b.name),
    fontUrl: `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/fonts/helvetiker_bold.typeface.json`,
  };
  const threeBlock = needsThree
    ? `<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/"}}</script>
<script type="module">import * as THREE from 'three';
const loadGLTF = () => import('three/addons/loaders/GLTFLoader.js');
const loadText = () => Promise.all([import('three/addons/loaders/FontLoader.js'), import('three/addons/geometries/TextGeometry.js')]);
(${threeRuntime.toString()})(THREE, ${inlineJson(threeCfg)}, loadGLTF, loadText);</script>`
    : '';

  const preloader = d.preloader && !opts.preview && !lite ? `<div id="preloader" aria-hidden="true"><span class="pre-name">${esc(b.name)}</span><span class="pre-count">000</span></div><noscript><style>#preloader{display:none}</style></noscript>` : '';
  const progress = d.progress && !lite ? '<div id="progress" aria-hidden="true"></div>' : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(b.name || 'Portfolio')}${b.headline ? ' — ' + esc(b.headline) : ''}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(b.name)}">
<meta property="og:description" content="${esc(description)}">
<meta name="theme-color" content="${custom ? custom.bg : (PAPERS[d.mode]?.[d.paper] || PAPERS.light.white).bg}">
<meta name="generator" content="Monofolio">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontHref}">
<style>${buildCss(d)}${animCss()}${accentCss()}${heroImageCss(d)}${def.css || ''}${colorCss(d)}
${String(d.customCss || '').replace(/<\/style/gi, '<\\/style')}</style>
</head>
<body class="layout-${esc(d.layout)} theme-${esc(themeKey)} enter-${esc(d.entrance || 'none')} rv-${esc(revealStyleOf(d))} link-${esc(d.linkStyle || 'underline')} title-${esc(d.titleAnim || 'none')} card-${esc(d.cardHover || 'none')} accent-${esc(d.accentUse || 'links')}${d.scrollSkew ? ' scroll-skew' : ''}${d.textFill ? ' text-fill' : ''}">
<a class="skip" href="#main">Skip to content</a>
${bgAnimHtml(d)}${preloader}${progress}
${body}
<script>${scripts.join('\n')}</script>
${threeBlock}
</body>
</html>`;
}

export { allLinks };
