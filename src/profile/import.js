// Turn an imported resume (see resume/parse.js) into Dev Identity profile fields,
// and merge it into an existing profile without duplicating what's already there.
import { lines } from '../resume/model.js';

const url = (u) => (!u ? '' : /^https?:\/\//i.test(u) ? u : `https://${u}`);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

export function profileFromResume(d) {
  const h = d.header || {};
  const socials = [];
  if (h.github) socials.push({ label: 'GitHub', url: url(h.github) });
  if (h.linkedin) socials.push({ label: 'LinkedIn', url: url(h.linkedin) });
  return {
    basics: {
      name: h.name || '',
      headline: d.experience?.[0]?.role || '',
      email: h.email || '',
      phone: h.phone || '',
      location: h.location || '',
      website: url(h.website),
      about: d.summary || '',
    },
    socials,
    skills: (d.skills || []).filter((s) => s.items).map((s) => ({ group: s.group || 'Skills', items: s.items })),
    experience: (d.experience || []).map((e) => ({ role: e.role || '', company: e.company || '', location: e.location || '', start: e.start || '', end: e.end || '', bullets: e.bullets || '', tech: e.tech || '' })),
    education: (d.education || []).map((e) => ({ school: e.school || '', degree: e.degree || '', start: e.start || '', end: e.end || '', score: e.score || '', details: e.details || '' })),
    // resumeDataFromProfile() writes the description as the first bullet, so read it back the same way
    projects: (d.projects || []).map((p) => {
      const [first = '', ...rest] = lines(p.bullets);
      const gh = /github\.com/i.test(p.link || '');
      return { name: p.name || '', description: first, tech: p.tech || '', link: gh ? '' : url(p.link), repo: gh ? url(p.link) : '', stars: 0, highlight: false, bullets: rest.join('\n'), image: '', source: 'resume' };
    }),
    certifications: (d.certifications || []).map((c) => ({ name: c.name || '', issuer: c.issuer || '', date: c.date || '', link: c.link || '' })),
    achievements: (d.achievements || []).map((a) => {
      const [title, ...detail] = String(a.text || '').split(/\s+[—–-]\s+/);
      return { title: title.trim(), detail: detail.join(' — ').trim() };
    }),
    custom: (d.custom || []).filter((c) => c.title || c.content).map((c) => ({ title: c.title || '', content: c.content || '' })),
  };
}

// what identifies "the same item" in each list
const KEYS = {
  socials: (x) => norm(x.label) || norm(x.url),
  skills: (x) => norm(x.group),
  experience: (x) => norm(`${x.company}${x.role}`),
  education: (x) => norm(x.school),
  projects: (x) => norm(x.name),
  certifications: (x) => norm(x.name),
  achievements: (x) => norm(x.title),
  custom: (x) => norm(x.title),
};

// mode 'add': fill empty basics and add list items that aren't there yet.
// mode 'replace': the resume's values win wherever it has them.
export function mergeProfile(current, incoming, mode = 'add') {
  const out = { ...current, basics: { ...current.basics } };
  const changed = [];
  for (const [k, v] of Object.entries(incoming.basics)) {
    if (!v) continue;
    if (mode === 'replace' ? v !== current.basics[k] : !current.basics[k]) {
      out.basics[k] = v;
      changed.push(k);
    }
  }
  let added = 0;
  for (const key of Object.keys(KEYS)) {
    const inc = incoming[key] || [];
    if (!inc.length) continue;
    if (mode === 'replace') {
      out[key] = inc;
      added += inc.length;
    } else {
      const have = new Set((current[key] || []).map(KEYS[key]));
      const fresh = inc.filter((x) => KEYS[key](x) && !have.has(KEYS[key](x)));
      out[key] = [...(current[key] || []), ...fresh];
      added += fresh.length;
    }
  }
  return { profile: out, changed, added };
}

// short counts for the review panel
export function importSummary(p) {
  return [
    ['Name', p.basics.name],
    ['Email', p.basics.email],
    ['Phone', p.basics.phone],
    ['Links', p.socials.map((s) => s.label).join(' · ')],
    ['Education', p.education.length],
    ['Experience', p.experience.length],
    ['Projects', p.projects.length],
    ['Skill groups', p.skills.length],
    ['Achievements', p.achievements.length],
    ['Other', p.certifications.length + p.custom.length],
  ];
}
