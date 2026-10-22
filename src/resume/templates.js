// Resume templates rendered as real HTML/CSS (selectable text → ATS-readable PDFs).
// Modelled on the open-source LaTeX templates students use for off-campus applications.

import { lines } from './model.js';

export const RESUME_FONTS = {
  lato: { label: 'Lato', css: "'Lato'", gf: 'Lato:ital,wght@0,400;0,700;0,900;1,400' },
  serif: { label: 'Source Serif', css: "'Source Serif 4'", serif: true, gf: 'Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400' },
  times: { label: 'Times (Tinos)', css: "'Tinos'", serif: true, gf: 'Tinos:ital,wght@0,400;0,700;1,400' },
  garamond: { label: 'EB Garamond', css: "'EB Garamond'", serif: true, gf: 'EB+Garamond:ital,wght@0,400;0,600;0,700;1,400' },
  calibri: { label: 'Calibri-like (Carlito)', css: "'Carlito'", gf: 'Carlito:ital,wght@0,400;0,700;1,400' },
  sourcesans: { label: 'Source Sans', css: "'Source Sans 3'", gf: 'Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  roboto: { label: 'Roboto', css: "'Roboto'", gf: 'Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400' },
  inter: { label: 'Inter', css: "'Inter'", gf: 'Inter:wght@400;500;600;700' },
  cmu: { label: 'Computer Modern (LaTeX)', css: "'CMU Serif'", serif: true, face: 'cmu-serif' },
};

// the font plus a fallback of the same kind, so a serif résumé never drops to Arial while the font loads
export const fontFamily = (font) => `${font.css},${font.serif ? "Georgia,'Times New Roman',serif" : "'Helvetica Neue',Arial,sans-serif"}`;

// fonts not on Google Fonts — the real LaTeX font, from the computer-modern npm package
const CMU = 'https://cdn.jsdelivr.net/npm/computer-modern@0.1.3/fonts';
const FONT_FACES = {
  'cmu-serif': [
    ['normal', 400, 'cmu-serif-500-roman'],
    ['italic', 400, 'cmu-serif-500-italic'],
    ['normal', 700, 'cmu-serif-700-roman'],
    ['italic', 700, 'cmu-serif-700-italic'],
  ]
    .map(([style, weight, file]) => `@font-face{font-family:'CMU Serif';font-style:${style};font-weight:${weight};font-display:swap;src:url(${CMU}/${file}.woff2) format('woff2')}`)
    .join('\n'),
};

export const RESUME_TEMPLATES = {
  jake: { name: "Jake's Resume", desc: 'The most-used off-campus template: centred name, ruled section titles, dates on the right.', ats: 'Excellent', font: 'lato', size: 10.5 },
  jakeclassic: { name: "Jake's Resume (LaTeX)", desc: 'The original Overleaf look: Computer Modern serif, small-caps headings, role first with the organisation in italics.', ats: 'Excellent', font: 'cmu', size: 10.5 },
  faang: { name: 'FAANGPath', desc: 'Times-style serif, uppercase headings — the classic big-tech one-pager.', ats: 'Excellent', font: 'times', size: 10.5 },
  sb2nov: { name: 'sb2nov', desc: 'Name on the left, contact stacked on the right, small-caps headings.', ats: 'Excellent', font: 'serif', size: 10.5 },
  rendercv: { name: 'Modern (RenderCV)', desc: 'Clean sans-serif with an accent colour for headings.', ats: 'Excellent', font: 'sourcesans', size: 10.5 },
  compact: { name: 'Ultra Compact', desc: 'Dense one-pager with inline rules — fits a lot without looking crowded.', ats: 'Excellent', font: 'calibri', size: 10 },
  awesome: { name: 'Awesome CV', desc: 'Bold name, accent-coloured headings and company names.', ats: 'Good', font: 'sourcesans', size: 10 },
  deedy: { name: 'Deedy (two column)', desc: 'Large light name and a sidebar column. Looks striking, but two columns can confuse some ATS.', ats: 'Fair', font: 'lato', size: 10 },
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const href = (u) => {
  const v = String(u || '').trim();
  if (!v) return '';
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (/^[a-z]+:/i.test(v)) return '';
  return 'https://' + v;
};
const dates = (a, b) => [a, b].filter(Boolean).join(' – ');

const ICON = {
  phone: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.3 18.3V10H5.7v8.3zM7 8.9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11.3 9.4v-4.6c0-2.4-1.3-3.6-3-3.6-1.4 0-2 .8-2.4 1.3V10h-2.6v8.3h2.6v-4.6c0-1.2.2-2.4 1.8-2.4 1.5 0 1.5 1.4 1.5 2.5v4.5z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>',
  website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  location: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>',
};

function contactItems(h, withIcons) {
  const items = [];
  const add = (k, text, link) => {
    if (!text) return;
    const icon = withIcons ? `<span class="ic">${ICON[k]}</span>` : '';
    items.push(link ? `<a href="${esc(link)}">${icon}${esc(text)}</a>` : `<span>${icon}${esc(text)}</span>`);
  };
  add('phone', h.phone, h.phone ? `tel:${h.phone.replace(/\s/g, '')}` : '');
  add('email', h.email, h.email ? `mailto:${h.email}` : '');
  add('linkedin', h.linkedin, href(h.linkedin));
  add('github', h.github, href(h.github));
  add('website', h.website, href(h.website));
  add('location', h.location, '');
  return items;
}

// ---------- section bodies (shared markup, styled per template) ----------
const bulletsHtml = (text) => {
  const ls = lines(text);
  return ls.length ? `<ul>${ls.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '';
};
const linkHtml = (url, label, s) => {
  const u = href(url);
  if (!u) return '';
  const text = s.linkStyle === 'url' ? String(url).replace(/^https?:\/\/(www\.)?/, '') : label || 'Link';
  return `<a class="lnk" href="${esc(u)}">${esc(text)}</a>`;
};

const SECTIONS = {
  summary: (d) => (d.summary ? `<p class="summary">${esc(d.summary)}</p>` : ''),
  education: (d, s, t) =>
    d.education
      .map((e) => {
        // LaTeX Jake: location top-right, dates bottom-right
        const [r1, r2] = t === 'jakeclassic' ? [esc(e.location), esc(dates(e.start, e.end))] : [esc(dates(e.start, e.end)), esc(e.location)];
        return `<div class="entry">
        <div class="row"><b class="t">${esc(e.school)}</b><span class="d">${r1}</span></div>
        <div class="row sub"><i>${esc(e.degree)}${e.score ? ` <span class="score">— ${esc(e.score)}</span>` : ''}</i><i>${r2}</i></div>
        ${e.details ? `<div class="note">${esc(e.details)}</div>` : ''}
      </div>`;
      })
      .join(''),
  experience: (d, s, t) =>
    d.experience
      .map((e) => {
        const roleFirst = t === 'faang' || t === 'awesome' || t === 'jakeclassic';
        const top = roleFirst ? e.role : e.company;
        const second = roleFirst ? e.company : e.role;
        return `<div class="entry">
        <div class="row"><b class="t">${esc(top)}</b><span class="d">${esc(dates(e.start, e.end))}</span></div>
        <div class="row sub"><i><span class="org">${esc(second)}</span>${e.tech ? ` <span class="tech">| ${esc(e.tech)}</span>` : ''}</i><i>${esc(e.location)}</i></div>
        ${bulletsHtml(e.bullets)}
      </div>`;
      })
      .join(''),
  projects: (d, s) =>
    d.projects
      .map(
        (p) => `<div class="entry">
        <div class="row"><span><b class="t">${esc(p.name)}</b>${p.tech ? ` <i class="tech">| ${esc(p.tech)}</i>` : ''}</span><span class="d">${linkHtml(p.link, p.linkLabel, s) || esc(p.date)}</span></div>
        ${bulletsHtml(p.bullets)}
      </div>`
      )
      .join(''),
  skills: (d) => `<div class="skills">${d.skills.map((k) => `<div><b>${esc(k.group)}</b>${k.group ? ': ' : ''}${esc(k.items)}</div>`).join('')}</div>`,
  achievements: (d, s) => `<ul class="flat">${d.achievements.map((a) => `<li><span class="row"><span>${esc(a.text)}</span>${linkHtml(a.link, a.linkLabel || 'View', s)}</span></li>`).join('')}</ul>`,
  certifications: (d, s) =>
    `<ul class="flat">${d.certifications.map((c) => `<li><span class="row"><span><b>${esc(c.name)}</b>${c.issuer ? ` — ${esc(c.issuer)}` : ''}</span><span class="d">${linkHtml(c.link, 'Credential', s) || esc(c.date)}</span></span></li>`).join('')}</ul>`,
};

const hasContent = (key, d) => {
  if (key === 'summary') return !!d.summary;
  if (key === 'skills') return d.skills.some((k) => k.items || k.group);
  return (d[key] || []).length > 0;
};

function sectionBlocks(resume) {
  const { data: d, style: s } = resume;
  const out = [];
  resume.order.forEach((key) => {
    if (resume.hidden?.[key]) return;
    if (key === 'custom') {
      (d.custom || []).forEach((c, i) => {
        if (!c.title && !c.content) return;
        const ls = String(c.content || '').split('\n').filter((l) => l.trim());
        const body = ls.every((l) => /^\s*[-•*]/.test(l)) ? bulletsHtml(c.content) : `<p>${ls.map(esc).join('<br>')}</p>`;
        out.push({ key: `custom-${i}`, title: c.title || 'Section', html: body });
      });
      return;
    }
    if (!hasContent(key, d)) return;
    const titles = { summary: 'Summary', education: 'Education', experience: 'Experience', projects: 'Projects', skills: 'Technical Skills', achievements: 'Achievements', certifications: 'Certifications' };
    out.push({ key, title: resume.titles?.[key]?.trim() || titles[key], html: SECTIONS[key](d, s, s.template) });
  });
  return out;
}

const titleHtml = (title, t) => {
  if (t === 'awesome') return `<span><span class="ac">${esc(title.slice(0, 3))}</span>${esc(title.slice(3))}</span>`;
  return esc(title);
};

// ---------- template-specific CSS ----------
const TEMPLATE_CSS = {
  jake: `
header{text-align:center}
h1{font-size:2.3em;font-weight:700;line-height:1.05}
.contact{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 16px;margin-top:5px}
.contact a{text-decoration:underline;text-underline-offset:2px}
h2{font-size:1.25em;font-weight:700;border-bottom:1px solid #000;padding-bottom:1px;margin-bottom:3px}
.sec-body{padding-left:.12in}
.lnk{font-weight:700}`,
  jakeclassic: `
header{text-align:center}
h1{font-size:2.5em;font-weight:700;line-height:1.1}
.contact{display:flex;flex-wrap:wrap;justify-content:center;margin-top:3px;font-size:.9em}
.contact > *:not(:last-child)::after{content:'|';display:inline-block;margin:0 6px}
.contact a{text-decoration:underline;text-underline-offset:2px}
h2{font-size:1.2em;font-weight:400;font-variant:small-caps;letter-spacing:.01em;border-bottom:.8px solid #000;padding-bottom:1px;margin-bottom:4px}
.sec-body{padding-left:.15in}
.t{font-size:1.02em}
.sub{font-size:.88em}
ul{font-size:.9em;list-style:none;padding-left:1.55em}
li{position:relative}
li::before{content:'\\2022';position:absolute;left:-.85em;font-size:.85em;top:.05em}
.skills,.note{font-size:.9em}
.lnk{font-weight:700}`,
  faang: `
header{text-align:center}
h1{font-size:2em;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.contact{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 0;margin-top:4px}
.contact > *:not(:last-child)::after{content:'|';margin:0 8px;color:#444}
h2{font-size:1.08em;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border-bottom:1.3px solid #000;padding-bottom:1px;margin-bottom:4px}
.lnk{text-decoration:underline}`,
  sb2nov: `
header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}
h1{font-size:2.4em;font-weight:700;line-height:1}
.contact{display:grid;grid-template-columns:auto auto;gap:1px 18px;text-align:right;font-size:.95em}
h2{font-size:1.25em;font-variant:small-caps;font-weight:600;letter-spacing:.02em;border-bottom:1px solid #000;margin-bottom:3px}
.sec-body{padding-left:.1in}
.lnk{text-decoration:underline}`,
  rendercv: `
header{text-align:left}
h1{font-size:2.3em;font-weight:700;color:var(--accent);line-height:1.05}
.contact{display:flex;flex-wrap:wrap;gap:2px 16px;margin-top:6px;color:#333}
.contact .ic{color:var(--accent)}
h2{font-size:1.2em;font-weight:700;color:var(--accent);border-bottom:1.2px solid var(--accent);padding-bottom:1px;margin-bottom:4px}
.d{color:#444}
.lnk{color:var(--accent);font-weight:600}`,
  compact: `
header{text-align:center}
h1{font-size:2em;font-weight:700;line-height:1.05}
.contact{display:flex;flex-wrap:wrap;justify-content:center;gap:0;margin-top:2px}
.contact > *:not(:last-child)::after{content:'•';margin:0 7px}
h2{display:flex;align-items:center;gap:8px;font-size:1.02em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
h2::after{content:'';flex:1;border-top:1px solid #000}
.lnk{text-decoration:underline}`,
  awesome: `
header{text-align:center}
h1{font-size:2.7em;line-height:1.05;font-weight:300;letter-spacing:.01em}
h1 b{font-weight:700}
.contact{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 14px;margin-top:6px;font-size:.92em;color:#555}
.contact .ic{color:var(--accent)}
h2{display:flex;align-items:center;gap:10px;font-size:1.35em;font-weight:700}
h2 .ac{color:var(--accent)}
h2::after{content:'';flex:1;border-top:1px solid #999}
.sub .org{color:var(--accent);font-style:normal;text-transform:uppercase;font-size:.88em;letter-spacing:.04em}
.d{color:var(--accent);font-style:italic}
li::marker{color:var(--accent)}
.lnk{color:var(--accent)}`,
  deedy: `
header{margin-bottom:6px}
h1{font-size:2.9em;font-weight:300;letter-spacing:.02em;line-height:1}
.contact{display:flex;flex-wrap:wrap;gap:2px 14px;margin-top:6px;font-size:.92em;color:#333}
.cols{display:grid;grid-template-columns:32% 1fr;gap:0 .28in}
.side{border-right:1px solid #ddd;padding-right:.18in}
h2{font-size:1.25em;font-weight:300;text-transform:uppercase;letter-spacing:.12em;color:#333;margin-bottom:3px}
.side .row{display:block}
.side .row > :last-child{display:block;text-align:left}
.lnk{text-decoration:underline}`,
};

export function renderResumeHtml(resume, { forPrint = false } = {}) {
  const s = resume.style;
  const t = RESUME_TEMPLATES[s.template] ? s.template : 'jake';
  const font = RESUME_FONTS[s.font] || RESUME_FONTS.lato;
  const d = resume.data;
  const h = d.header;
  const sp = s.spacing === 'compact' ? 0.72 : s.spacing === 'relaxed' ? 1.3 : 1;
  const margin = s.margins === 'narrow' ? '0.45in' : s.margins === 'wide' ? '0.85in' : '0.6in';
  const paper = s.paper === 'a4' ? { w: '210mm', h: '297mm', size: 'A4' } : { w: '8.5in', h: '11in', size: 'letter' };
  const words = String(h.name || 'Your Name').trim().split(/\s+/);
  const nameHtml = t === 'awesome' && words.length > 1 ? `${esc(words.slice(0, -1).join(' '))} <b>${esc(words[words.length - 1])}</b>` : esc(h.name || 'Your Name');
  const contact = contactItems(h, s.icons && !['faang', 'compact', 'jakeclassic'].includes(t)).join('');
  const blocks = sectionBlocks(resume);
  const sec = (b) => `<section class="sec sec-${b.key}"><h2>${titleHtml(b.title, t)}</h2><div class="sec-body">${b.html}</div></section>`;
  let body;
  if (t === 'deedy') {
    const sideKeys = ['education', 'skills', 'achievements', 'certifications'];
    body = `<div class="cols"><div class="side">${blocks.filter((b) => sideKeys.includes(b.key)).map(sec).join('')}</div><div class="main">${blocks.filter((b) => !sideKeys.includes(b.key)).map(sec).join('')}</div></div>`;
  } else body = blocks.map(sec).join('');

  // page-break guides (preview only)
  const guides = forPrint ? '' : [1, 2, 3].map((n) => `<div class="pb" style="top:calc(${paper.h} * ${n})"><span>Page ${n + 1}</span></div>`).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc((h.name || 'Resume').replace(/\s+/g, '_'))}_Resume</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${font.face ? `<style>${FONT_FACES[font.face]}</style>` : `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${font.gf}&display=swap">`}
<style>
:root{--font:${fontFamily(font)};--fs:${Number(s.fontSize) || 10.5}pt;--sp:${sp};--m:${margin};--fill:${Math.max(0, Number(s.fill) || 0)}px;--pw:${paper.w};--ph:${paper.h};--accent:${/^#[0-9a-f]{6}$/i.test(s.accent || '') ? s.accent : '#1f4e79'}}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:#d9d9d9;font-family:var(--font);color:#111;font-size:var(--fs);line-height:1.27;-webkit-font-smoothing:antialiased}
.page{width:var(--pw);min-height:var(--ph);margin:22px auto;background:#fff;padding:var(--m);box-shadow:0 12px 40px rgba(0,0,0,.28);position:relative}
a{color:inherit;text-decoration:none}
.ic{display:inline-block;width:.95em;height:.95em;margin-right:4px;vertical-align:-.12em}
.ic svg{width:100%;height:100%;display:block}
.row{display:flex;justify-content:space-between;gap:14px;align-items:baseline}
.row > :last-child:not(:first-child){text-align:right;white-space:nowrap;flex:none}
.sec{margin-top:calc(9px * var(--sp) + var(--fill))}
.entry{margin-top:calc(5px * var(--sp))}
.entry:first-child{margin-top:calc(2px * var(--sp))}
.t{font-size:1.03em}
.sub{font-size:.95em}
.tech{font-weight:400}
.note{font-size:.93em;margin-top:1px}
ul{padding-left:1.3em;margin-top:calc(2px * var(--sp))}
li{margin-top:calc(1.5px * var(--sp))}
ul.flat{margin-top:0}
.skills div{margin-top:calc(1.5px * var(--sp))}
.summary{margin-top:2px}
.pb{position:absolute;left:-12px;right:-12px;border-top:1.5px dashed #9a9a9a;pointer-events:none}
.pb span{position:absolute;right:0;top:2px;background:#111;color:#fff;font:600 10px Arial,sans-serif;padding:2px 6px;border-radius:3px}
${TEMPLATE_CSS[t]}
/* no page margin, so the browser has nowhere to print its date / title / URL headers; the margin lives on .page and repeats on every page */
@page{size:${paper.size};margin:0}
@media print{body{background:none}.page{width:auto;min-height:0;margin:0;padding:var(--m);box-shadow:none;-webkit-box-decoration-break:clone;box-decoration-break:clone}.pb{display:none}.entry,li{break-inside:avoid}h2{break-after:avoid}}
</style></head>
<body><div class="page" id="page">
<header><h1>${nameHtml}</h1>${contact ? `<div class="contact">${contact}</div>` : ''}</header>
${body}
${guides}
</div></body></html>`;
}

// Plain-text version (what an ATS "sees") — also offered as a download.
export function renderResumeText(resume) {
  const T = (key, def) => (resume.titles?.[key]?.trim() || def).toUpperCase();
  const d = resume.data;
  const h = d.header;
  const out = [h.name, [h.phone, h.email, h.linkedin, h.github, h.website, h.location].filter(Boolean).join(' | '), ''];
  resume.order.forEach((key) => {
    if (resume.hidden?.[key]) return;
    if (key === 'summary' && d.summary) out.push(T('summary', 'Summary'), d.summary, '');
    if (key === 'education' && d.education.length) {
      out.push(T('education', 'Education'));
      d.education.forEach((e) => out.push([e.school, e.location].filter(Boolean).join('	'), [[e.degree, e.score].filter(Boolean).join(', '), dates(e.start, e.end)].filter(Boolean).join('	'), ...(e.details ? [e.details] : [])));
      out.push('');
    }
    if (key === 'experience' && d.experience.length) {
      out.push(T('experience', 'Experience'));
      d.experience.forEach((e) => out.push([e.company, dates(e.start, e.end)].filter(Boolean).join('	'), [[e.role, e.tech].filter(Boolean).join(' | '), e.location].filter(Boolean).join('	'), ...lines(e.bullets).map((b) => `- ${b}`)));
      out.push('');
    }
    if (key === 'projects' && d.projects.length) {
      out.push(T('projects', 'Projects'));
      d.projects.forEach((p) => out.push(`${p.name}${p.tech ? ` | ${p.tech}` : ''}${p.link ? ` | ${p.link}` : ''}`, ...lines(p.bullets).map((b) => `- ${b}`)));
      out.push('');
    }
    if (key === 'skills' && d.skills.length) out.push(T('skills', 'Technical Skills'), ...d.skills.map((k) => `${k.group}: ${k.items}`), '');
    if (key === 'achievements' && d.achievements.length) out.push(T('achievements', 'Achievements'), ...d.achievements.map((a) => `- ${a.text}`), '');
    if (key === 'certifications' && d.certifications.length) out.push(T('certifications', 'Certifications'), ...d.certifications.map((c) => `- ${c.name}${c.issuer ? `, ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`), '');
    if (key === 'custom') (d.custom || []).forEach((c) => c.title && out.push(c.title.toUpperCase(), c.content, ''));
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
