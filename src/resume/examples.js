// Resume preview with examples: every part the user hasn't filled in yet shows the sample resume,
// marked so the preview can draw it lighter. Only for the on-screen preview — downloads use the real data.
import { demoResumeData } from './model.js';

// invisible markers around sample text, turned into <span class="ex"> after rendering
const OPEN = '\u2063';
const CLOSE = '\u2064';
const MARKERS = /[\u2063\u2064]/g;
const LISTS = ['education', 'experience', 'projects', 'skills', 'achievements', 'certifications'];
// fields every template prints as one piece of text (the name isn't — one template splits it into words)
const MARKED = new Set(['location', 'school', 'degree', 'score', 'details', 'company', 'role', 'tech', 'start', 'end', 'bullets', 'name', 'date', 'group', 'items', 'text', 'issuer']);

const blank = (v) => !String(v ?? '').trim();
// mark each line separately (bullets are split into lines), keeping a leading "- " outside the mark
const mark = (v) =>
  String(v)
    .split('\n')
    .map((l) => l.replace(/^(\s*[-•*▪●◦]\s*)?(.*\S.*)$/, (m, p = '', t) => `${p}${OPEN}${t}${CLOSE}`))
    .join('\n');

function fill(item, example) {
  const out = { ...item };
  let used = false;
  for (const [k, v] of Object.entries(example)) {
    if (blank(out[k]) && !blank(v)) {
      out[k] = typeof v === 'string' && MARKED.has(k) ? mark(v) : v;
      used = true;
    }
  }
  return [out, used];
}

let sample = null;

// → { resume, used }: the resume with examples filled in, and whether any example was needed
export function withExamples(resume) {
  sample ||= demoResumeData();
  const d = resume.data;
  let used = false;
  const header = { ...d.header };
  for (const [k, v] of Object.entries(sample.header)) {
    if (blank(header[k]) && !blank(v)) {
      header[k] = k === 'name' ? v : mark(v);
      used = true;
    }
  }
  const data = { ...d, header };
  for (const key of LISTS) {
    const mine = d[key] || [];
    const ex = sample[key] || [];
    // an empty section shows the sample entries; started entries borrow the sample's fields they still lack
    data[key] = (mine.length ? mine : ex.map(() => ({}))).map((item, i) => {
      if (!ex[i]) return item;
      const [filled, u] = fill(item, ex[i]);
      used ||= u;
      return filled;
    });
  }
  return { resume: { ...resume, data }, used };
}

// Rendered resume HTML → sample parts drawn lighter, with no markers left anywhere
export function showExamples(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, (t) => t.replace(MARKERS, ''))
    .replace(/<[^>]+>/g, (tag) => tag.replace(MARKERS, '')) // never inside a tag (link addresses)
    .replace(new RegExp(`${OPEN}([^${OPEN}${CLOSE}]*)${CLOSE}`, 'g'), '<span class="ex">$1</span>')
    .replace(MARKERS, '')
    .replace('</head>', '<style>.ex{opacity:.45}</style></head>');
}

// Rendered resume HTML → examples shown at full strength (template thumbnails)
export const plainExamples = (html) => html.replace(MARKERS, '');
