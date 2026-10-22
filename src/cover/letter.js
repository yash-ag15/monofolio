// Cover letters: AI writing (streamed), an offline template fallback, and print-ready letter designs.

import { aiStream } from '../lib/ai.js';
import { lines } from '../resume/model.js';
import { analyzeJob, matchResume } from '../resume/keywords.js';
import { RESUME_FONTS, fontFamily } from '../resume/templates.js';

export const TONES = [
  ['professional', 'Professional'],
  ['warm', 'Warm'],
  ['confident', 'Confident'],
  ['concise', 'Concise'],
];
export const LENGTHS = [
  ['short', 'Short', 160],
  ['standard', 'Standard', 260],
  ['detailed', 'Detailed', 360],
];
export const LETTER_DESIGNS = {
  classic: { name: 'Classic', desc: 'Serif, letterhead on the left — timeless', font: 'garamond' },
  modern: { name: 'Modern', desc: 'Large name, thin accent rule', font: 'inter' },
  jake: { name: 'Match my resume', desc: 'Centred name and contact line, like Jake’s Resume', font: 'lato' },
  minimal: { name: 'Minimal', desc: 'Small header, generous whitespace', font: 'sourcesans' },
};

// what the letter is written from: a resume (preferred) or the Dev Identity
export function candidateFacts(profile, resume) {
  const b = profile.basics || {};
  if (resume) {
    const d = resume.data;
    return {
      name: d.header.name || b.name,
      email: d.header.email || b.email,
      phone: d.header.phone || b.phone,
      location: d.header.location || b.location,
      links: [d.header.linkedin, d.header.github, d.header.website].filter(Boolean),
      summary: d.summary || b.about || '',
      education: d.education.map((e) => `${e.degree}, ${e.school}${e.end ? ` (${e.end})` : ''}${e.score ? ` — ${e.score}` : ''}`),
      experience: d.experience.map((e) => ({ role: e.role, company: e.company, dates: [e.start, e.end].filter(Boolean).join(' – '), bullets: lines(e.bullets) })),
      projects: d.projects.map((p) => ({ name: p.name, tech: p.tech, bullets: lines(p.bullets) })),
      skills: d.skills.map((s) => `${s.group ? `${s.group}: ` : ''}${s.items}`),
      achievements: d.achievements.map((a) => a.text),
    };
  }
  return {
    name: b.name,
    email: b.email,
    phone: b.phone,
    location: b.location,
    links: [b.website, ...(profile.socials || []).map((s) => s.url)].filter(Boolean),
    summary: b.about || '',
    education: (profile.education || []).map((e) => `${e.degree}, ${e.school}${e.end ? ` (${e.end})` : ''}`),
    experience: (profile.experience || []).map((e) => ({ role: e.role, company: e.company, dates: [e.start, e.end].filter(Boolean).join(' – '), bullets: lines(e.bullets) })),
    projects: (profile.projects || []).map((p) => ({ name: p.name, tech: p.tech, bullets: [p.description, ...lines(p.bullets)].filter(Boolean) })),
    skills: (profile.skills || []).map((s) => `${s.group ? `${s.group}: ` : ''}${s.items}`),
    achievements: (profile.achievements || []).map((a) => [a.title, a.detail].filter(Boolean).join(' — ')),
  };
}

const SYSTEM = `You are an expert career coach who writes cover letters that get students and early-career candidates interviews — in any field.
Write ONLY the body of the letter: 3–4 short paragraphs separated by a blank line. No greeting, no sign-off, no headers, no placeholders like [Company] — those are added separately.
How to write it:
- Paragraph 1: a specific, confident opening — the role, the company, and one concrete reason this candidate fits (a real achievement or skill). Never open with "I am writing to express my interest".
- Middle: map 2–3 of the job's most important requirements to concrete evidence from the candidate's experience and projects — real numbers, tools and outcomes taken from their facts.
- If a reason for wanting this company is given, use it naturally; otherwise refer to something specific from the job post.
- Close with a short, confident call to action.
Rules:
- Use ONLY facts given about the candidate. Never invent employers, projects, numbers, degrees or skills.
- Plain, human, specific language. No clichés ("passionate", "team player", "hard-working", "go-getter", "I believe I would be a great fit").
- Write in the first person. Match the requested tone and length.`;

export async function writeWithAi({ facts, jd, company, role, manager, tone, length, why, onText, signal }) {
  const words = LENGTHS.find((l) => l[0] === length)?.[2] || 260;
  const user = [
    `ROLE: ${role || '(see job description)'}`,
    `COMPANY: ${company || '(see job description)'}`,
    manager ? `HIRING MANAGER: ${manager}` : '',
    `TONE: ${TONES.find((t) => t[0] === tone)?.[1] || 'Professional'}`,
    `LENGTH: about ${words} words`,
    why ? `WHY THIS COMPANY (from the candidate): ${why}` : '',
    `JOB DESCRIPTION:\n${String(jd || '').slice(0, 7000)}`,
    `CANDIDATE FACTS (JSON):\n${JSON.stringify(facts)}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  const { text } = await aiStream({ system: SYSTEM, user, temperature: 0.6, maxTokens: 2500, onText, signal });
  return cleanBody(text);
}

// strip greetings / sign-offs / markdown the model may add anyway
export function cleanBody(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/^\s*(dear|hello|hi)\b[^\n]*\n+/i, '')
    .replace(/\n+\s*(sincerely|best regards|kind regards|regards|thank you|warm regards|yours (truly|sincerely))[,.]?\s*(\n.*)*$/i, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // plain characters that print and paste everywhere: "35 %" → "35%", "3 000" → "3,000", non-breaking hyphens → "-"
    .replace(/(\d)[\s  ]+%/g, '$1%')
    .replace(/(\d)[   ](\d{3})(?!\d)/g, '$1,$2')
    .replace(/[‐‑]/g, '-')
    .replace(/[  ]/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/^#+\s.*\n/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Offline letter from the resume + job keywords (no AI)
export function writeFromTemplate({ facts, jd, company, role, why, length }) {
  const job = jd && jd.trim().length > 40 ? analyzeJob(jd) : null;
  const fakeResume = {
    data: {
      header: {},
      summary: facts.summary,
      education: [],
      experience: facts.experience.map((e) => ({ role: e.role, company: e.company, tech: '', bullets: e.bullets.join('\n') })),
      projects: facts.projects.map((p) => ({ name: p.name, tech: p.tech, bullets: p.bullets.join('\n') })),
      skills: facts.skills.map((s) => ({ group: '', items: s })),
      achievements: [],
      certifications: [],
      custom: [],
    },
    hidden: {},
  };
  const matched = job ? matchResume(fakeResume, job).matched.filter((k) => k.type === 'hard').slice(0, 4).map((k) => k.name) : [];
  const exp = facts.experience[0];
  const proj = facts.projects[0];
  const best = (items) => items.find((b) => /\d/.test(b)) || items[0];
  const r = role || job?.title || 'this role';
  const c = company || job?.company || 'your team';
  const p = [];
  p.push(
    `I’m applying for the ${r} position at ${c}. ${exp ? `As ${/^[aeiou]/i.test(exp.role || '') ? 'an' : 'a'} ${exp.role} at ${exp.company}, I ${lowerFirst(best(exp.bullets) || 'delivered real work for real users')}` : proj ? `Recently I built ${proj.name}${proj.tech ? ` with ${proj.tech}` : ''}` : 'I bring hands-on project experience'}${matched.length ? ` — and I work daily with ${listText(matched)}, which your team asks for.` : '.'}`
  );
  if (length !== 'short') {
    const evidence = [exp && exp.bullets.slice(1, 3).length && `At ${exp.company}, I also ${exp.bullets.slice(1, 3).map(lowerFirst).join(', and ')}.`, proj && proj.bullets.length && `In ${proj.name}, I ${lowerFirst(best(proj.bullets))}.`].filter(Boolean);
    if (evidence.length) p.push(evidence.join(' '));
  }
  if (why) p.push(why.trim().replace(/^./, (x) => x.toUpperCase()).replace(/([^.!?])$/, '$1.'));
  else if (length === 'detailed' && facts.education[0]) p.push(`I’m completing my ${facts.education[0]}, where I’ve built a strong foundation I apply in every project.`);
  p.push(`I’d welcome the chance to discuss how I can contribute to ${c}. Thank you for your time and consideration.`);
  return p.join('\n\n');
}
const lowerFirst = (s) => String(s || '').replace(/^[A-Z](?=[a-z])/, (x) => x.toLowerCase()).replace(/\.$/, '');
const listText = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0] || '');

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// The full letter as a printable page (preview + PDF), in one of the designs
export function letterHtml(letter, facts, { forPrint = false } = {}) {
  const design = LETTER_DESIGNS[letter.design] ? letter.design : 'classic';
  const font = RESUME_FONTS[LETTER_DESIGNS[design].font] || RESUME_FONTS.inter || RESUME_FONTS.lato;
  const paper = letter.paper === 'a4' ? { w: '210mm', h: '297mm', size: 'A4' } : { w: '8.5in', h: '11in', size: 'letter' };
  const date = letter.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const contact = [facts.email, facts.phone, facts.location, ...(facts.links || []).map((l) => String(l).replace(/^https?:\/\/(www\.)?/, ''))].filter(Boolean);
  const recipient = [letter.manager, letter.company && `${letter.company}`].filter(Boolean);
  const body = String(letter.text || '')
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const accent = /^#[0-9a-f]{6}$/i.test(letter.accent || '') ? letter.accent : '#111111';
  const CSS = {
    classic: `header{margin-bottom:36px}h1{font-size:26px;font-weight:600;letter-spacing:.01em}.contact{margin-top:6px;color:#444;font-size:12.5px}.contact span+span:before{content:'  ·  ';white-space:pre;color:#999}`,
    modern: `header{margin-bottom:40px;padding-bottom:18px;border-bottom:2px solid ${accent}}h1{font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1.05}.title{color:${accent};font-weight:600;margin-top:6px}.contact{margin-top:10px;display:flex;flex-wrap:wrap;gap:4px 16px;color:#444;font-size:12px}`,
    jake: `header{text-align:center;margin-bottom:34px}h1{font-size:30px;font-weight:700}.contact{margin-top:6px;font-size:12.5px}.contact span+span:before{content:'  |  ';white-space:pre;color:#666}`,
    minimal: `header{margin-bottom:56px;font-size:12.5px;color:#444}h1{font-size:15px;font-weight:600;color:#111}.contact{margin-top:2px}.contact span+span:before{content:' / ';color:#aaa}`,
  }[design];
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc((facts.name || 'Cover').replace(/\s+/g, '_'))}_Cover_Letter</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${font.gf}&display=swap">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#d9d9d9;font-family:${fontFamily(font)};color:#111;-webkit-font-smoothing:antialiased}
.page{width:${paper.w};min-height:${paper.h};margin:22px auto;background:#fff;padding:0.9in 0.95in;box-shadow:0 12px 40px rgba(0,0,0,.28);font-size:11.5pt;line-height:1.6}
.meta{margin-bottom:26px;color:#333}.meta div+div{margin-top:2px}.date{margin-bottom:18px}
.greeting{margin-bottom:14px}p{margin-bottom:13px;text-align:left}.sign{margin-top:22px}.sign b{display:block;margin-top:4px;font-weight:600}
${CSS}
/* no page margin, so the browser has nowhere to print its date / title / URL headers */
@page{size:${paper.size};margin:0}
@media print{body{background:none}.page{width:auto;min-height:0;margin:0;padding:0.8in;box-shadow:none;-webkit-box-decoration-break:clone;box-decoration-break:clone}}
</style></head><body><div class="page">
<header><h1>${esc(facts.name || 'Your Name')}</h1>${design === 'modern' && letter.role ? `<div class="title">${esc(letter.role)}</div>` : ''}<div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join('')}</div></header>
<div class="meta"><div class="date">${esc(date)}</div>${recipient.map((r) => `<div>${esc(r)}</div>`).join('')}</div>
<div class="greeting">Dear ${esc(letter.manager || 'Hiring Manager')},</div>
${body || '<p style="color:#999">Your letter will appear here.</p>'}
<div class="sign">${esc(letter.closing || 'Sincerely')},<b>${esc(facts.name || '')}</b></div>
</div></body></html>`;
}

export function letterText(letter, facts) {
  return [`Dear ${letter.manager || 'Hiring Manager'},`, '', letter.text || '', '', `${letter.closing || 'Sincerely'},`, facts.name || ''].join('\n');
}
