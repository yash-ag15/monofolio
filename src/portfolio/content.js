// Content helpers + section renderers shared by every theme.

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function safeUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^[a-z]+:/i.test(u)) return ''; // block javascript:, data:, etc.
  return 'https://' + u.replace(/^\/+/, '');
}

export const isImageSrc = (u) => /^(https?:\/\/|data:image\/(png|jpe?g|gif|webp|svg\+xml);)/i.test(String(u || '').trim());

export const splitList = (s) =>
  String(s || '')
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

export const lines = (s) =>
  String(s || '')
    .split('\n')
    .map((x) => x.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

export const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const initials = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

export function repoSlug(url) {
  const m = String(url || '').match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : '';
}

// JSON that is safe to inline inside <script> tags.
export const inlineJson = (v) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');

export function richText(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map((b) => {
      const ls = b.split('\n').filter((l) => l.trim());
      if (ls.length && ls.every((l) => /^\s*[-•*]\s+/.test(l))) {
        return `<ul>${ls.map((l) => `<li>${esc(l.replace(/^\s*[-•*]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${ls.map(esc).join('<br>')}</p>`;
    })
    .join('');
}

export function linkList(items) {
  return items
    .filter((i) => safeUrl(i.url))
    .map((i) => `<a href="${esc(safeUrl(i.url))}" target="_blank" rel="noopener">${esc(i.label || i.url)}</a>`)
    .join('');
}

// ---------- signature marks: a unique black & white mark per person ----------
export function signatureSvg(name, seed, kind, size = 120) {
  const rand = mulberry32(hashString(`${name}|${seed}`));
  const open = (label, extra = '') => `<svg class="mark" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${label}" ${extra}>`;
  if (kind === 'monogram') {
    return `${open('Monogram')}<rect x="2" y="2" width="96" height="96" fill="none" stroke="currentColor" stroke-width="3"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="40" font-weight="700" fill="currentColor" font-family="var(--font-head)">${esc(initials(name))}</text></svg>`;
  }
  if (kind === 'lines') {
    const count = 9 + Math.floor(rand() * 8);
    let out = '';
    for (let i = 0; i < count; i++) {
      const y = 6 + (i * 88) / (count - 1);
      out += `<line x1="${(6 + rand() * 30).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(64 + rand() * 30).toFixed(1)}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-width="${(1 + rand() * 3).toFixed(1)}" stroke-linecap="round"/>`;
    }
    return `${open('Signature mark')}${out}</svg>`;
  }
  if (kind === 'orbit') {
    let out = '';
    const rings = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < rings; i++) {
      const r = 14 + i * (32 / rings);
      const a = rand() * Math.PI * 2;
      out += `<circle cx="50" cy="50" r="${r.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="${(50 + r * Math.cos(a)).toFixed(1)}" cy="${(50 + r * Math.sin(a)).toFixed(1)}" r="${(2 + rand() * 3).toFixed(1)}" fill="currentColor"/>`;
    }
    return `${open('Signature mark')}${out}<circle cx="50" cy="50" r="5" fill="currentColor"/></svg>`;
  }
  let cells = '';
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      if (rand() > 0.5) {
        [...new Set([x, 4 - x])].forEach((px) => {
          cells += `<rect x="${10 + px * 16}" y="${10 + y * 16}" width="16" height="16" fill="currentColor"/>`;
        });
      }
    }
  }
  return `${open('Signature mark', 'shape-rendering="crispEdges"')}${cells}</svg>`;
}

// ---------- sections ----------
export const TITLES = {
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements',
  contact: 'Contact',
};

function renderAbout(p) {
  return p.basics.about ? `<div class="prose about">${richText(p.basics.about)}</div>` : '';
}

function renderSkills(p, d) {
  if (!p.skills.length) return '';
  if (d.layout === 'terminal') {
    return `<pre class="skills-pre">${p.skills
      .map((s) => `<span class="k">${esc(s.group || 'skills')}</span>: [${splitList(s.items).map((x) => `"${esc(x)}"`).join(', ')}]`)
      .join('\n')}</pre>`;
  }
  return `<div class="skills">${p.skills
    .map(
      (s) =>
        `<div class="skill-group">${s.group ? `<h3>${esc(s.group)}</h3>` : ''}<ul class="tags">${splitList(s.items)
          .map((x) => `<li>${esc(x)}</li>`)
          .join('')}</ul></div>`
    )
    .join('')}</div>`;
}

function projectLinks(pr) {
  const out = [];
  if (safeUrl(pr.link)) out.push(`<a href="${esc(safeUrl(pr.link))}" target="_blank" rel="noopener">Live ↗</a>`);
  if (safeUrl(pr.repo)) out.push(`<a href="${esc(safeUrl(pr.repo))}" target="_blank" rel="noopener">Code ↗</a>`);
  return out.join('');
}

export const sortedProjects = (p) => [...p.projects].sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0));

function renderProjects(p, d) {
  const list = sortedProjects(p);
  if (!list.length) return '';
  const style = d.layout === 'kinetic' ? 'list' : d.projectStyle;
  const star = (pr) => {
    const slug = repoSlug(pr.repo);
    if (!slug && !pr.stars) return '';
    return `<span class="stars" ${slug ? `data-repo="${esc(slug)}"` : ''}>★ <span class="star-count">${Number(pr.stars) || 0}</span></span>`;
  };
  const item = (pr, i) => {
    const bullets = lines(pr.bullets);
    const hasImg = isImageSrc(pr.image);
    const img = hasImg && style !== 'list' ? `<img class="project-img" src="${esc(pr.image)}" alt="Screenshot of ${esc(pr.name)}" loading="lazy">` : '';
    return `<article class="project${pr.highlight ? ' is-featured' : ''}"${hasImg ? ` data-img="${esc(pr.image)}"` : ''}>
      ${img}
      <div class="project-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="project-main">
        <div class="project-top"><h3>${esc(pr.name)}</h3>${star(pr)}</div>
        ${pr.description ? `<p>${esc(pr.description)}</p>` : ''}
        ${bullets.length ? `<ul class="bullets">${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        ${pr.tech ? `<ul class="tags small">${splitList(pr.tech).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <div class="links">${projectLinks(pr)}</div>
      </div>
    </article>`;
  };
  return `<div class="projects projects-${esc(style)}">${list.map(item).join('')}</div>`;
}

function renderTimeline(items, head, sub) {
  return `<div class="timeline">${items
    .map(
      (e) => `<article class="entry">
      <div class="entry-meta">${esc([e.start, e.end].filter(Boolean).join(' — '))}${e.location ? `<br>${esc(e.location)}` : ''}</div>
      <div class="entry-body">
        <h3>${esc(e[head])}${e[sub] ? ` <span class="at">· ${esc(e[sub])}</span>` : ''}</h3>
        ${e.score ? `<p class="muted">${esc(e.score)}</p>` : ''}
        ${e.details ? `<p>${esc(e.details)}</p>` : ''}
        ${lines(e.bullets).length ? `<ul class="bullets">${lines(e.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        ${e.tech ? `<ul class="tags small">${splitList(e.tech).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      </div>
    </article>`
    )
    .join('')}</div>`;
}

function renderCerts(p) {
  if (!p.certifications.length) return '';
  return `<ul class="rows">${p.certifications
    .map((c) => {
      const name = safeUrl(c.link) ? `<a href="${esc(safeUrl(c.link))}" target="_blank" rel="noopener">${esc(c.name)} ↗</a>` : esc(c.name);
      return `<li><span class="row-title">${name}</span><span class="row-meta">${esc([c.issuer, c.date].filter(Boolean).join(' · '))}</span></li>`;
    })
    .join('')}</ul>`;
}

function renderAchievements(p) {
  if (!p.achievements.length) return '';
  return `<ul class="rows">${p.achievements.map((a) => `<li><span class="row-title">${esc(a.title)}</span><span class="row-meta">${esc(a.detail)}</span></li>`).join('')}</ul>`;
}

export function allLinks(p) {
  const b = p.basics;
  return [...p.socials, ...(b.website ? [{ label: 'Website', url: b.website }] : []), ...(b.resumeUrl ? [{ label: 'Résumé', url: b.resumeUrl }] : [])];
}

function renderContact(p) {
  const b = p.basics;
  const parts = [];
  if (b.availability) parts.push(`<p class="availability"><span class="dot" aria-hidden="true"></span>${esc(b.availability)}</p>`);
  if (b.email) parts.push(`<a class="big-link" href="mailto:${esc(b.email)}" data-magnetic>${esc(b.email)}</a>`);
  const meta = [b.phone && `<a href="tel:${esc(b.phone.replace(/\s/g, ''))}">${esc(b.phone)}</a>`, b.location && esc(b.location)].filter(Boolean);
  if (meta.length) parts.push(`<p class="muted">${meta.join(' · ')}</p>`);
  const socials = linkList(allLinks(p));
  if (socials) parts.push(`<div class="links">${socials}</div>`);
  return parts.length ? `<div class="contact">${parts.join('')}</div>` : '';
}

const RENDERERS = {
  about: renderAbout,
  skills: renderSkills,
  projects: renderProjects,
  experience: (p) => (p.experience.length ? renderTimeline(p.experience, 'role', 'company') : ''),
  education: (p) => (p.education.length ? renderTimeline(p.education, 'degree', 'school') : ''),
  certifications: renderCerts,
  achievements: renderAchievements,
  contact: renderContact,
};

export function visibleSections(p, d) {
  const out = [];
  d.sectionOrder.forEach((key) => {
    if (d.hidden[key]) return;
    if (key === 'custom') {
      (p.custom || []).forEach((c, i) => {
        if (c.title || c.content) {
          const slug = slugify(c.title) || `section-${i + 1}`;
          out.push({ key: `custom-${i}`, file: slug, slug: `x-${slug}`, title: c.title || 'More', html: `<div class="prose">${richText(c.content)}</div>` });
        }
      });
      return;
    }
    const html = RENDERERS[key](p, d);
    if (html) out.push({ key, file: key, slug: key, title: TITLES[key], html });
  });
  return out;
}

export function sectionLabel(s, index, d) {
  const n = String(index + 1).padStart(2, '0');
  const style = d.layout === 'terminal' ? 'prompt' : d.sectionLabel;
  switch (style) {
    case 'prompt':
      return `<span class="prompt">~$</span> cat ${esc(s.file)}.md`;
    case 'numbered':
      return `<span class="num">${n}</span> ${esc(s.title)}`;
    case 'slash':
      return `<span class="num">//</span> ${esc(s.title.toLowerCase())}`;
    case 'bracket':
      return `[ ${esc(s.title)} ]`;
    case 'hash':
      return `<span class="num">#</span> ${esc(s.title.toLowerCase())}`;
    case 'fig':
      return `<span class="num">FIG. ${n} —</span> ${esc(s.title.toUpperCase())}`;
    default:
      return esc(s.title);
  }
}

// A compact, script-friendly summary used by interactive themes (terminal).
export function profileDigest(p) {
  const b = p.basics;
  return {
    name: b.name,
    headline: b.headline,
    tagline: b.tagline,
    about: b.about,
    location: b.location,
    email: b.email,
    availability: b.availability,
    links: allLinks(p).filter((l) => safeUrl(l.url)).map((l) => ({ label: l.label, url: safeUrl(l.url) })),
    skills: p.skills.map((s) => ({ group: s.group, items: splitList(s.items) })),
    projects: sortedProjects(p).map((x) => ({ name: x.name, description: x.description, tech: x.tech, url: safeUrl(x.link) || safeUrl(x.repo) })),
    experience: p.experience.map((e) => ({ role: e.role, company: e.company, when: [e.start, e.end].filter(Boolean).join(' — ') })),
    education: p.education.map((e) => ({ degree: e.degree, school: e.school, when: [e.start, e.end].filter(Boolean).join(' — ') })),
  };
}
