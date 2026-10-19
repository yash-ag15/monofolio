// Import an existing resume (PDF / DOCX / TXT) and turn it into editable fields.
// Everything runs in the browser. Parsing is heuristic: it understands the common one-page
// layouts (Jake's, FAANGPath, Overleaf/Word templates) and reports what it found.

import { emptyResumeData } from './model.js';

// ---------- 1. extract lines of text ----------

async function pdfLines(file) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // copied into public/ by scripts/copy-pdf-worker.mjs
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const out = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const [content, annots] = await Promise.all([page.getTextContent(), page.getAnnotations()]);
    const links = annots.filter((a) => a.subtype === 'Link' && a.url).map((a) => ({ url: a.url, y0: Math.min(a.rect[1], a.rect[3]), y1: Math.max(a.rect[1], a.rect[3]), x0: a.rect[0] }));
    // group text items into visual lines by their baseline
    const items = content.items.filter((i) => i.str && i.str.trim()).map((i) => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: Math.abs(i.transform[3]) || i.height || 10 }));
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const rows = [];
    items.forEach((it) => {
      const row = rows.find((r) => Math.abs(r.y - it.y) < Math.max(2.5, it.h * 0.35));
      if (row) row.items.push(it);
      else rows.push({ y: it.y, items: [it] });
    });
    rows.sort((a, b) => b.y - a.y);
    rows.forEach((r) => {
      r.items.sort((a, b) => a.x - b.x);
      let text = '';
      let end = null;
      r.items.forEach((it) => {
        if (end !== null) {
          const gap = it.x - end;
          text += gap > 18 ? '\t' : gap > 1.2 && !text.endsWith(' ') && !it.s.startsWith(' ') ? ' ' : '';
        }
        text += it.s;
        end = it.x + it.w;
      });
      const size = Math.max(...r.items.map((i) => i.h));
      const urls = links.filter((l) => r.y >= l.y0 - 3 && r.y <= l.y1 + 3).sort((a, b) => a.x0 - b.x0).map((l) => l.url);
      out.push({ text: text.replace(/\s+\t/g, '\t').replace(/\t\s+/g, '\t').trim(), urls, size });
    });
  }
  return out;
}

async function docxLines(file) {
  const mod = await import('mammoth');
  const mammoth = mod.default || mod;
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value.split('\n').map((t) => ({ text: t.trim(), urls: [] }));
}

export async function extractResumeLines(file) {
  const name = (file.name || '').toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return pdfLines(file);
  if (name.endsWith('.docx')) return docxLines(file);
  if (name.endsWith('.doc')) throw new Error('Old .doc files can’t be read — save it as .docx or PDF and try again.');
  const text = await file.text();
  return text.split('\n').map((t) => ({ text: t.trim(), urls: [] }));
}

// ---------- 2. understand the structure ----------

const SECTION_ALIASES = {
  summary: ['summary', 'profile', 'objective', 'about me', 'professional summary', 'career objective', 'profile summary'],
  education: ['education', 'academics', 'academic background', 'educational qualifications', 'education and training', 'academic details'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'internships', 'internship', 'internship experience', 'work history', 'industry experience'],
  projects: ['projects', 'personal projects', 'academic projects', 'key projects', 'technical projects', 'selected projects'],
  skills: ['skills', 'technical skills', 'skills and interests', 'technologies', 'tech stack', 'core competencies', 'skills summary', 'technical proficiency'],
  achievements: ['achievements', 'awards', 'honors', 'honours', 'accomplishments', 'achievements and awards', 'awards and achievements', 'honors and awards'],
  certifications: ['certifications', 'certificates', 'licenses and certifications', 'certifications and courses', 'courses'],
};
const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const ONE_DATE = `(?:${MONTH}\\s*'?\\d{2,4}|\\d{1,2}\\/\\d{4}|(?:19|20)\\d{2})`;
const DATE_RE = new RegExp(`((?:expected\\s+)?${ONE_DATE})\\s*(?:-|–|—|to|until)\\s*(${ONE_DATE}|present|current|now|ongoing|till date)|(?:expected\\s+|graduating\\s+)?${ONE_DATE}`, 'i');
const BULLET_RE = /^[•▪●◦■□➢►\-*–·]\s*/;

const norm = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

function headingKey(line) {
  const t = line.text.replace(/\t/g, ' ').trim();
  if (!t || t.length > 42 || /\d{3,}/.test(t) || DATE_RE.test(t) || BULLET_RE.test(t)) return null;
  const n = norm(t);
  for (const [k, aliases] of Object.entries(SECTION_ALIASES)) if (aliases.includes(n)) return k;
  // other short ALL-CAPS / title lines that look like headings → custom section
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 4 && t === t.toUpperCase() && t.split(/\s+/).length <= 4) return 'custom';
  if (/^(positions? of responsibility|leadership|extra[- ]?curricular|volunteer(ing)?|publications?|languages|interests|hobbies|activities|research)/i.test(t)) return 'custom';
  return null;
}

const splitTab = (t) => t.split('\t').map((x) => x.trim()).filter(Boolean);
const findDates = (s) => {
  const m = s.match(DATE_RE);
  if (!m) return { start: '', end: '', rest: s };
  const rest = s.replace(m[0], '').replace(/\s{2,}/g, ' ').replace(/^[\s|,–-]+|[\s|,–-]+$/g, '').trim();
  if (m[1]) return { start: m[1].trim(), end: m[2].trim(), rest };
  return { start: '', end: m[0].trim(), rest };
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const LINK_WORDS = /\b(view (project|post|certificate|credential|demo|live)|live demo|github|demo|link|source|code)\b\s*$/i;

// split a section's lines into entries: header lines followed by bullet lines
function entries(lines) {
  const out = [];
  let cur = null;
  lines.forEach((l) => {
    const isBullet = BULLET_RE.test(l.text);
    if (isBullet) {
      if (!cur) cur = { head: [], bullets: [], urls: [] };
      cur.bullets.push(l.text.replace(BULLET_RE, '').trim());
    } else if (cur && cur.bullets.length && /^[a-z(]/.test(l.text) && !/[|	]|https?:/.test(l.text)) {
      cur.bullets[cur.bullets.length - 1] += ' ' + l.text; // wrapped bullet continues
    } else {
      if (!cur || cur.bullets.length) {
        cur = { head: [], bullets: [], urls: [] };
        out.push(cur);
      }
      cur.head.push(l.text);
      cur.urls.push(...(l.urls || []));
    }
  });
  if (cur && !out.includes(cur)) out.push(cur);
  return out;
}

function parseExperience(lines) {
  return entries(lines).map((e) => {
    const all = e.head.join('\t');
    const { start, end, rest } = findDates(all);
    const parts = splitTab(rest);
    const first = (e.head[0] ? splitTab(findDates(e.head[0]).rest)[0] : parts[0]) || '';
    const second = (e.head[1] ? splitTab(findDates(e.head[1]).rest) : []) || [];
    let company = first;
    let role = second[0] || '';
    const location = second[1] || (e.head[0] ? splitTab(findDates(e.head[0]).rest)[1] : '') || '';
    // "Role at Company" / "Role, Company" on a single line
    if (!role) {
      const m = company.match(/^(.*?)\s+(?:at|@|,|—|–|-)\s+(.+)$/);
      if (m) [role, company] = [m[1], m[2]];
    }
    let tech = '';
    if (role.includes('|')) [role, tech] = role.split('|').map((x) => x.trim());
    return { company: company.replace(/\s*\|\s*$/, ''), role, tech, location: /\d/.test(location) ? '' : location, start: cap(start), end: cap(end), bullets: e.bullets.join('\n') };
  });
}

function parseEducation(lines) {
  return entries(lines).map((e) => {
    const all = e.head.join('\n');
    const { start, end } = findDates(all.replace(/\n/g, '\t'));
    const h0 = splitTab(findDates(e.head[0] || '').rest);
    const h1 = splitTab(findDates(e.head[1] || '').rest);
    const scoreM = all.match(/((?:c?gpa|cpi|percentage|score|grade)[\s:–-]*[\d.]+\s*(?:\/\s*[\d.]+)?%?|[\d.]+\s*%|[\d.]+\s*\/\s*10)/i);
    const degreeLine = h1[0] || '';
    return {
      school: h0[0] || '',
      degree: degreeLine.replace(scoreM ? scoreM[0] : '§', '').replace(/[,;–-]\s*$/, '').trim(),
      start: cap(start),
      end: cap(end),
      location: h0[1] && !/\d/.test(h0[1]) ? h0[1] : h1[1] && !/\d/.test(h1[1]) ? h1[1] : '',
      score: scoreM ? scoreM[0].trim() : '',
      details: [...e.head.slice(2), ...e.bullets].join('; '),
    };
  });
}

function parseProjects(lines) {
  return entries(lines).map((e) => {
    const parts = splitTab(e.head.join('\t'));
    let [name = '', tech = ''] = (parts[0] || '').split(/\s*\|\s*/);
    if (!tech && parts[1] && !LINK_WORDS.test(parts[1]) && !DATE_RE.test(parts[1])) tech = parts[1];
    const dateM = e.head.join(' ').match(DATE_RE);
    const label = parts.find((p) => LINK_WORDS.test(p));
    const url = e.urls[e.urls.length - 1] || (e.head.join(' ').match(/https?:\/\/\S+/) || [])[0] || '';
    return { name: name.replace(LINK_WORDS, '').trim(), tech: tech.replace(/[–—-]\s*\d.*$/, '').trim(), link: url, linkLabel: url ? (label || 'View Project').replace(/^\W+/, '') : '', date: dateM ? dateM[0] : '', bullets: e.bullets.join('\n') };
  });
}

function parseSkills(lines) {
  const out = [];
  lines.forEach((l) => {
    const t = l.text.replace(BULLET_RE, '').replace(/\t/g, ' ');
    const m = t.match(/^([^:]{2,40}):\s*(.+)$/);
    if (m) out.push({ group: m[1].trim(), items: m[2].trim() });
    else if (out.length && !/:/.test(t) && out[out.length - 1].items && /^[a-z,]/i.test(t) && t.length < 120 && lines.length > 1 && l !== lines[0] && !/[A-Z][a-z]+:/.test(t)) out[out.length - 1].items += ', ' + t;
    else if (t) out.push({ group: '', items: t });
  });
  return out;
}

const parseList = (lines) =>
  lines
    .map((l) => ({ text: l.text.replace(BULLET_RE, '').replace(/\t+/g, ' ').replace(LINK_WORDS, '').trim(), url: (l.urls || [])[0] || '' }))
    .filter((x) => x.text);

export function parseResumeLines(rawLines) {
  const ls = rawLines.map((l) => ({ ...l, text: (l.text || '').replace(/ /g, ' ').trim() })).filter((l) => l.text);
  const data = emptyResumeData();
  const found = [];
  const warnings = [];
  if (!ls.length) return { data, found, warnings: ['No text found. If this is a scanned/image PDF, the text can’t be read — try the .docx or a text-based PDF.'] };

  const all = ls.map((l) => l.text).join('\n');
  const urls = ls.flatMap((l) => l.urls || []);
  const h = data.header;
  h.email = (all.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [''])[0];
  h.phone = ((all.match(/(\+?\d[\d\s().-]{8,}\d)/) || [''])[0] || '').trim();
  const pick = (re) => {
    const u = urls.find((x) => re.test(x)) || (all.match(new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${re.source}[^\\s|\\t]*`, 'i')) || [''])[0];
    return (u || '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
  };
  h.linkedin = pick(/linkedin\.com\/in\//);
  h.github = pick(/github\.com\//);

  // the name: the biggest text near the top, else the first line that isn't contact info
  const top = ls.slice(0, 6);
  const biggest = top.filter((l) => l.size).sort((a, b) => b.size - a.size)[0];
  const nameLine = biggest && biggest.size > (ls[3]?.size || 0) * 1.25 ? biggest : top.find((l) => !/@|\d{5}|linkedin|github|http/i.test(l.text));
  h.name = nameLine ? nameLine.text.replace(/\t/g, ' ').trim() : '';

  // split into sections
  const sections = [];
  let cur = { key: 'header', title: '', lines: [] };
  ls.forEach((l) => {
    const k = l === nameLine ? null : headingKey(l);
    if (k) {
      cur = { key: k, title: cap(l.text.toLowerCase().replace(/\t/g, ' ')), lines: [] };
      sections.push(cur);
    } else cur.lines.push(l);
  });

  const leftover = (cur.key === 'header' && cur.lines) || [];
  sections.forEach((s) => {
    if (!s.lines.length) return;
    if (s.key === 'experience') data.experience.push(...parseExperience(s.lines));
    else if (s.key === 'education') data.education.push(...parseEducation(s.lines));
    else if (s.key === 'projects') data.projects.push(...parseProjects(s.lines));
    else if (s.key === 'skills') data.skills.push(...parseSkills(s.lines));
    else if (s.key === 'achievements') data.achievements.push(...parseList(s.lines).map((x) => ({ text: x.text, link: x.url, linkLabel: x.url ? 'View' : '' })));
    else if (s.key === 'certifications') data.certifications.push(...parseList(s.lines).map((x) => ({ name: x.text, issuer: '', date: '', link: x.url })));
    else if (s.key === 'summary') data.summary = s.lines.map((l) => l.text.replace(/\t/g, ' ')).join(' ');
    else data.custom.push({ title: s.title.replace(/\b\w/g, (c) => c.toUpperCase()), content: s.lines.map((l) => `- ${l.text.replace(BULLET_RE, '').replace(/\t+/g, ' — ')}`).join('\n') });
    if (!found.includes(s.key)) found.push(s.key);
  });

  if (!sections.length) warnings.push('No section headings (Education, Experience, Projects…) were recognised — the text was put into a custom section for you to sort.');
  if (!sections.length && leftover.length > 2) data.custom.push({ title: 'Imported text', content: leftover.slice(1).map((l) => `- ${l.text}`).join('\n') });
  if (!h.email) warnings.push('No email address found — add it in the header.');
  if (data.experience.some((e) => !e.start && !e.end)) warnings.push('Some experience dates could not be read — please check them.');
  return { data, found, warnings };
}
