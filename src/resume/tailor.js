// Job-description tailoring: rank and reorder what's already in the resume, and add only what the
// user confirms they know. Nothing is invented. Works for any field — job keywords can be
// dictionary skills (React, AutoCAD, Tally) or free phrases pulled from the job post.

import { lines, newResume } from './model.js';
import { keywordCat, matchResume, splitItems, termCount } from './keywords.js';

// relevance of a piece of text to the job = sum of the weights of the job keywords it mentions
const relevance = (text, job) => {
  let score = 0;
  const hits = [];
  job.keywords.forEach((k) => {
    if (termCount(text, k)) {
      score += k.weight;
      hits.push(k.name);
    }
  });
  return { score, hits };
};
const stableSort = (arr, key) => arr.map((x, i) => [x, i]).sort((a, b) => key(b[0]) - key(a[0]) || a[1] - b[1]).map(([x]) => x);

// which existing skills row a new keyword belongs to
const GROUP_HINTS = {
  Languages: /lang/i,
  Frameworks: /frame|librar|web|front|back|stack/i,
  Databases: /data ?base|db|storage/i,
  'Cloud & DevOps': /cloud|devops|infra|deploy/i,
  'Data & ML': /\bml\b|machine|data|ai\b|analytic/i,
  Testing: /test|tool/i,
  Tools: /tool|platform|software|other/i,
  Concepts: /concept|core|fundamental|cs\b|course/i,
  'Engineering Tools': /software|tool|cad|design/i,
  'Core Engineering': /technical|core|domain|engineering/i,
  'Business & Finance': /financ|account|business|domain/i,
  'Business & Marketing': /business|marketing|domain|management/i,
  'Office & ERP': /software|tool|office|computer/i,
  Design: /design|creative|tool|software/i,
  Other: /skill|technical|domain|tool|other/i,
};
export function groupFor(name, skills) {
  const cat = keywordCat(name);
  const hint = GROUP_HINTS[cat];
  const i = hint ? skills.findIndex((s) => hint.test(s.group)) : -1;
  return { index: i, group: i >= 0 ? skills[i].group : cat === 'Other' ? 'Other Skills' : cat };
}

const year = (s) => (String(s || '').match(/(19|20)\d{2}/) || [''])[0];
export function draftSummary(resume, job, match) {
  const d = resume.data;
  const ed = d.education[0];
  // "Bachelor of Technology in Mechanical Engineering" → "Mechanical Engineering"
  const degree = ed ? ((/\bin\s+([^,–—(]+)/i.exec(ed.degree || '') || [])[1] || ed.degree || '').trim() : '';
  const grad = ed && year(ed.end) ? ` (graduating ${year(ed.end)})` : '';
  const who = ed ? `${degree ? `${degree.replace(/^\w/, (c) => c.toUpperCase())} student` : 'Student'}${ed.school ? ` at ${ed.school}` : ''}${grad}` : 'Graduate';
  const top = match.matched.filter((k) => k.type === 'hard' && k.cat !== 'Concepts').slice(0, 4).map((k) => k.name);
  const skills = top.length > 1 ? `${top.slice(0, -1).join(', ')} and ${top[top.length - 1]}` : top[0] || '';
  const exp = d.experience[0];
  const projs = d.projects.slice(0, 2).map((p) => p.name).filter(Boolean);
  const proof = exp && exp.company ? `Previously ${exp.role ? `${exp.role} at` : 'at'} ${exp.company}${projs.length ? `; projects include ${projs.join(' and ')}` : ''}.` : projs.length ? `Projects include ${projs.join(' and ')}.` : '';
  // "Graduate Engineer Trainee – Mechanical (Design)" → "Graduate Engineer Trainee"
  const role = String(job.title || '').replace(/\s+[–—|-]\s+.*$/, '').replace(/\s*\(.*\)\s*$/, '').trim();
  const goal = role ? ` Looking to contribute as ${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}${job.company ? ` at ${job.company}` : ''}.` : '';
  return `${who}${skills ? ` with hands-on experience in ${skills}` : ''}. ${proof}${goal}`.replace(/\s+/g, ' ').replace(/\.\./g, '.').trim();
}

// Everything the Tailor page shows before applying.
export function tailorPlan(resume, job) {
  const d = resume.data;
  const match = matchResume(resume, job);
  const projects = d.projects.map((p, i) => ({ index: i, name: p.name || `Project ${i + 1}`, ...relevance([p.name, p.tech, p.bullets].join('\n'), job) }));
  const experience = d.experience.map((e, i) => ({ index: i, name: e.company || e.role || `Experience ${i + 1}`, ...relevance([e.role, e.tech, e.bullets].join('\n'), job) }));
  const addable = match.missing.filter((k) => k.type === 'hard').map((k) => ({ ...k, target: groupFor(k.name, d.skills).group }));
  // coaching: job keywords sitting in an entry's tech/tools line but never mentioned in its bullets
  const coach = [];
  [...d.experience.map((e) => ({ e, kind: 'experience', name: e.company || e.role })), ...d.projects.map((e) => ({ e, kind: 'projects', name: e.name }))].forEach(({ e, kind, name }) => {
    const words = job.keywords.filter((k) => termCount(e.tech || '', k) && !termCount(e.bullets || '', k)).map((k) => k.name);
    if (words.length) coach.push({ kind, name, words });
  });
  const lowProjects = d.projects.length > 3 ? projects.filter((p) => p.score === 0).map((p) => p.index) : [];
  return { match, projects, experience, addable, coach, lowProjects, summary: draftSummary(resume, job, match) };
}

// Build the tailored copy.
// opts: { add: [keyword names], reorderSkills, reorderProjects, reorderExperience, reorderBullets, hideProjects: [indexes], summary: string|null, skillsUp }
export function applyTailoring(resume, job, opts) {
  const d = JSON.parse(JSON.stringify(resume.data));
  const changes = [];

  // AI suggestions the user accepted: rewritten bullets and new bullets
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
  const entries = [...d.experience.map((e) => ({ e, name: e.company || e.role })), ...d.projects.map((e) => ({ e, name: e.name }))];
  let rewritten = 0;
  (opts.rewrites || []).forEach((rw) => {
    for (const { e } of entries) {
      const ls = lines(e.bullets);
      const i = ls.findIndex((b) => norm(b) === norm(rw.original));
      if (i >= 0) {
        ls[i] = rw.improved;
        e.bullets = ls.join('\n');
        rewritten++;
        break;
      }
    }
  });
  if (rewritten) changes.push(`Used ${rewritten} AI-rewritten bullet${rewritten > 1 ? 's' : ''}`);
  let added = 0;
  (opts.newBullets || []).forEach((nb) => {
    const target = entries.find(({ name }) => norm(name) === norm(nb.entry)) || entries.find(({ name }) => norm(name).includes(norm(nb.entry)) || norm(nb.entry).includes(norm(name)));
    if (!target) return;
    target.e.bullets = [...lines(target.e.bullets), nb.bullet].join('\n');
    added++;
  });
  if (added) changes.push(`Added ${added} new bullet${added > 1 ? 's' : ''} from AI suggestions${(opts.newBullets || []).some((b) => /\[[^\]]+\]/.test(b.bullet)) ? ' — fill in the [ ] placeholders' : ''}`);

  // add confirmed skills (skip any already listed)
  const skillText = d.skills.map((s) => s.items).join(', ');
  const add = (opts.add || []).filter((n) => !termCount(skillText, job.keywords.find((x) => x.name === n) || { name: n, phrase: true }));
  if (add.length) {
    add.forEach((name) => {
      const { index, group } = groupFor(name, d.skills);
      if (index >= 0) d.skills[index].items = [d.skills[index].items, name].filter(Boolean).join(', ');
      else {
        const j = d.skills.findIndex((s) => s.group === group);
        if (j >= 0) d.skills[j].items += `, ${name}`;
        else d.skills.push({ group, items: name });
      }
    });
    changes.push(`Added ${add.length} skill${add.length > 1 ? 's' : ''} you confirmed: ${add.join(', ')}`);
  }
  if (opts.reorderSkills) {
    d.skills = d.skills.map((s) => ({ ...s, items: stableSort(splitItems(s.items), (x) => relevance(x, job).score).join(', ') }));
    d.skills = stableSort(d.skills, (s) => relevance(s.items, job).score);
    changes.push('Moved the skills this job asks for to the front of each row, and the most relevant rows to the top');
  }
  if (opts.reorderBullets) {
    let moved = 0;
    const reorder = (text) => {
      const ls = lines(text);
      const sorted = stableSort(ls, (b) => relevance(b, job).score);
      if (sorted.some((b, i) => b !== ls[i])) moved++;
      return sorted.join('\n');
    };
    d.experience = d.experience.map((e) => ({ ...e, bullets: reorder(e.bullets) }));
    d.projects = d.projects.map((p) => ({ ...p, bullets: reorder(p.bullets) }));
    if (moved) changes.push(`Put the most relevant bullet first in ${moved} entr${moved > 1 ? 'ies' : 'y'}`);
  }
  const hideSet = new Set(opts.hideProjects || []);
  if (hideSet.size) {
    const removed = d.projects.filter((_, i) => hideSet.has(i)).map((p) => p.name);
    d.projects = d.projects.filter((_, i) => !hideSet.has(i));
    changes.push(`Left out less relevant project${removed.length > 1 ? 's' : ''}: ${removed.join(', ')}`);
  }
  if (opts.reorderProjects) {
    const before = d.projects.map((p) => p.name).join('|');
    d.projects = stableSort(d.projects, (p) => relevance([p.name, p.tech, p.bullets].join('\n'), job).score);
    if (d.projects.map((p) => p.name).join('|') !== before) changes.push(`Reordered projects by relevance: ${d.projects.map((p) => p.name).join(' → ')}`);
  }
  if (opts.reorderExperience) {
    const before = d.experience.map((e) => e.company).join('|');
    d.experience = stableSort(d.experience, (e) => relevance([e.role, e.tech, e.bullets].join('\n'), job).score);
    if (d.experience.map((e) => e.company).join('|') !== before) changes.push('Reordered experience by relevance');
  }

  const order = [...resume.order];
  const hidden = { ...resume.hidden };
  if (opts.summary) {
    d.summary = opts.summary;
    hidden.summary = false;
    // summary belongs right under the header
    order.splice(order.indexOf('summary'), 1);
    order.unshift('summary');
    changes.push('Added a summary written for this role');
  }
  if (opts.skillsUp) {
    order.splice(order.indexOf('skills'), 1);
    order.splice(order.indexOf('education') + 1, 0, 'skills');
    changes.push('Moved Skills right below Education');
  }

  const label = [job.company, job.title].filter(Boolean).join(' – ') || 'Tailored';
  const out = newResume({ name: `${resume.name} · ${label}`, data: d, style: resume.style });
  out.order = order;
  out.hidden = hidden;
  if (resume.titles) out.titles = { ...resume.titles };
  out.tailoredFor = { company: job.company, title: job.title, from: resume.id, at: Date.now() };
  return { resume: out, changes };
}
