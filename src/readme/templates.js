// GitHub profile README templates. Each builds Markdown (with the small subset of HTML GitHub allows)
// from the Dev Identity, so every student gets a README with their own content.

import { techList } from './tech.js';

// ---------- options ----------
export const CARD_THEMES = [
  ['default', 'Light'],
  ['dark', 'Dark'],
  ['github_dark', 'GitHub dark'],
  ['transparent', 'Transparent'],
  ['tokyonight', 'Tokyo Night'],
  ['radical', 'Radical'],
  ['dracula', 'Dracula'],
  ['gruvbox', 'Gruvbox'],
  ['nord', 'Nord'],
  ['onedark', 'One Dark'],
  ['highcontrast', 'High contrast'],
];
export const DEFAULT_OPTS = {
  username: '',
  theme: 'github_dark',
  badges: 'brand', // brand | mono
  accent: '0EA5E9',
  currently: '',
  learning: '',
  askMe: '',
  funFact: '',
  show: { stats: true, langs: true, streak: true, trophies: false, activity: false, visitors: false, skills: true, projects: true, socials: true, experience: true },
};

// ---------- data from the Dev Identity ----------
const SOCIAL = [
  [/github\.com/i, 'GitHub', 'github', '181717'],
  [/linkedin\.com/i, 'LinkedIn', 'linkedin', '0A66C2'],
  [/(twitter|x)\.com/i, 'X', 'x', '000000'],
  [/instagram\.com/i, 'Instagram', 'instagram', 'E4405F'],
  [/youtube\.com|youtu\.be/i, 'YouTube', 'youtube', 'FF0000'],
  [/medium\.com/i, 'Medium', 'medium', '000000'],
  [/dev\.to/i, 'dev.to', 'devdotto', '0A0A0A'],
  [/leetcode\.com/i, 'LeetCode', 'leetcode', 'FFA116'],
  [/codeforces\.com/i, 'Codeforces', 'codeforces', '1F8ACB'],
  [/hackerrank\.com/i, 'HackerRank', 'hackerrank', '00EA64'],
  [/kaggle\.com/i, 'Kaggle', 'kaggle', '20BEFF'],
  [/dribbble\.com/i, 'Dribbble', 'dribbble', 'EA4C89'],
  [/behance\.net/i, 'Behance', 'behance', '1769FF'],
];
const hostless = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
const fullUrl = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
const linesOf = (s) =>
  String(s || '')
    .split('\n')
    .map((x) => x.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);

export function readmeData(profile, github, opts) {
  const b = profile.basics || {};
  const ghUrl = (profile.socials || []).find((s) => /github\.com\//i.test(s.url))?.url || '';
  const username = (opts.username || github?.username || (ghUrl.match(/github\.com\/([^/?#]+)/i) || [])[1] || '').trim();
  const socials = [];
  (profile.socials || []).forEach((s) => {
    if (!s.url) return;
    const m = SOCIAL.find(([re]) => re.test(s.url));
    socials.push(m ? { label: m[1], url: fullUrl(s.url), slug: m[2], color: m[3] } : { label: s.label || hostless(s.url), url: fullUrl(s.url), slug: '', color: '555555' });
  });
  if (b.website) socials.push({ label: 'Portfolio', url: fullUrl(b.website), slug: 'googlechrome', color: '000000' });
  if (b.email) socials.push({ label: 'Email', url: `mailto:${b.email}`, slug: 'gmail', color: 'D14836' });
  const skillGroups = (profile.skills || []).filter((g) => g.items).map((g) => ({ group: g.group || 'Skills', items: techList(g.items) }));
  const allTech = [];
  skillGroups.forEach((g) => g.items.forEach((t) => !allTech.some((x) => x.label === t.label) && allTech.push(t)));
  const projects = [...(profile.projects || [])]
    .filter((p) => p.name)
    .sort((a, c) => (c.highlight ? 1 : 0) - (a.highlight ? 1 : 0) || (c.stars || 0) - (a.stars || 0))
    .slice(0, 6)
    .map((p) => {
      const repoMatch = String(p.repo || '').match(/github\.com\/([^/]+)\/([^/?#]+)/i);
      return { ...p, url: p.link || p.repo || '', owner: repoMatch?.[1] || '', repoName: repoMatch?.[2]?.replace(/\.git$/, '') || '', techList: techList(p.tech) };
    });
  const name = b.name || username || 'Your Name';
  return {
    username,
    name,
    first: name.split(' ')[0],
    headline: b.headline || '',
    tagline: b.tagline || '',
    about: b.about || '',
    location: b.location || '',
    email: b.email || '',
    website: b.website ? fullUrl(b.website) : '',
    resumeUrl: b.resumeUrl || '',
    availability: b.availability || '',
    socials,
    skillGroups,
    allTech,
    projects,
    experience: (profile.experience || []).filter((e) => e.company || e.role),
    education: (profile.education || []).filter((e) => e.school),
    achievements: (profile.achievements || []).filter((a) => a.title),
    currently: opts.currently || projects[0]?.name || '',
    learning: opts.learning || '',
    askMe: opts.askMe || allTech.slice(0, 3).map((t) => t.label).join(', '),
    funFact: opts.funFact || '',
  };
}

// ---------- building blocks ----------
const enc = (s) => encodeURIComponent(String(s).replace(/-/g, '--').replace(/_/g, '__'));
const isLight = (hex) => {
  const n = parseInt(String(hex).slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const bl = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * bl > 160;
};
const badgeUrl = (label, slug, color, o, style = 'for-the-badge') => {
  const mono = o.badges === 'mono';
  const bg = mono ? '111111' : color;
  const logo = slug ? `&logo=${slug}&logoColor=${mono || !isLight(bg) ? 'white' : 'black'}` : '';
  return `https://img.shields.io/badge/${enc(label)}-${bg}?style=${style}${logo}`;
};
const badgeMd = (t, o, style) => `![${t.label}](${badgeUrl(t.label, t.slug, t.color, o, style)})`;
const badgeHtml = (t, o, style) => `<img src="${badgeUrl(t.label, t.slug, t.color, o, style)}" alt="${t.label}" />`;
const socialBadges = (d, o, html = false) =>
  d.socials.map((s) => (html ? `<a href="${s.url}"><img src="${badgeUrl(s.label, s.slug, s.color, o)}" alt="${s.label}" /></a>` : `[![${s.label}](${badgeUrl(s.label, s.slug, s.color, o)})](${s.url})`)).join(html ? '\n' : ' ');
const skillIcons = (techs, perline = 12, theme = 'dark') => {
  const ids = techs.map((t) => t.icon).filter(Boolean);
  return ids.length ? `<img src="https://skillicons.dev/icons?i=${ids.join(',')}&perline=${perline}&theme=${theme}" alt="${techs.map((t) => t.label).join(', ')}" />` : '';
};
const iconTheme = (o) => (['default', 'transparent', 'highcontrast'].includes(o.theme) ? 'light' : 'dark');

// hosts of the stats / trophy / graph images above — the in-app preview loads these through /api/card (see server/card-proxy.js)
export const CARD_HOSTS = ['github-readme-stats.vercel.app', 'github-trophies.vercel.app', 'github-activity-graph.vercel.app', 'streak-stats.demolab.com', 'readme-typing-svg.demolab.com', 'komarev.com'];
const STREAK = { default: 'default', dark: 'dark', github_dark: 'github-dark-blue', transparent: 'transparent', tokyonight: 'tokyonight', radical: 'radical', dracula: 'dracula', gruvbox: 'gruvbox', nord: 'nord', onedark: 'onedark', highcontrast: 'highcontrast' };
// the original github-profile-trophy and github-readme-activity-graph deployments are disabled (HTTP 402) — these are live mirrors of the same projects
const TROPHY = { default: 'flat', dark: 'darkhub', github_dark: 'darkhub', transparent: 'flat', tokyonight: 'tokyonight', radical: 'radical', dracula: 'dracula', gruvbox: 'gruvbox', nord: 'nord', onedark: 'onedark', highcontrast: 'flat' };
const ACTIVITY = { default: 'minimal', dark: 'github-compact', github_dark: 'github-compact', transparent: 'minimal', tokyonight: 'tokyo-night', radical: 'redical', dracula: 'dracula', gruvbox: 'gruvbox', nord: 'nord', onedark: 'one-dark', highcontrast: 'high-contrast' };
const statsUrl = (u, o) => `https://github-readme-stats.vercel.app/api?username=${u}&show_icons=true&theme=${o.theme}&hide_border=true&rank_icon=github`;
const langsUrl = (u, o) => `https://github-readme-stats.vercel.app/api/top-langs/?username=${u}&layout=compact&theme=${o.theme}&hide_border=true&langs_count=8`;
const streakUrl = (u, o) => `https://streak-stats.demolab.com?user=${u}&theme=${STREAK[o.theme] || 'default'}&hide_border=true`;
const trophyUrl = (u, o) => `https://github-trophies.vercel.app/?username=${u}&theme=${TROPHY[o.theme] || 'flat'}&no-frame=true&no-bg=true&margin-w=4&row=1&column=7`;
const activityUrl = (u, o) => `https://github-activity-graph.vercel.app/graph?username=${u}&theme=${ACTIVITY[o.theme] || 'minimal'}&hide_border=true`;
const visitorsUrl = (u, o) => `https://komarev.com/ghpvc/?username=${u}&label=Profile%20views&color=${o.badges === 'mono' ? '111111' : o.accent}&style=flat`;
const pinUrl = (owner, repo, o) => `https://github-readme-stats.vercel.app/api/pin/?username=${owner}&repo=${repo}&theme=${o.theme}&hide_border=true`;
const typingUrl = (lines, o, opts = {}) =>
  `https://readme-typing-svg.demolab.com?font=${opts.font || 'JetBrains+Mono'}&weight=${opts.weight || 600}&size=${opts.size || 22}&pause=1000&color=${o.badges === 'mono' ? '888888' : o.accent}&center=true&vCenter=true&width=${opts.width || 600}&lines=${lines.filter(Boolean).map(encodeURIComponent).join(';')}`;

// the stats cards the user switched on
function statsBlock(d, o, { center = true } = {}) {
  const u = d.username;
  if (!u) return '';
  const row = [];
  if (o.show.stats) row.push(`<img height="165" src="${statsUrl(u, o)}" alt="GitHub stats" />`);
  if (o.show.langs) row.push(`<img height="165" src="${langsUrl(u, o)}" alt="Top languages" />`);
  const out = [];
  if (row.length) out.push(row.join('\n'));
  if (o.show.streak) out.push(`<img src="${streakUrl(u, o)}" alt="GitHub streak" />`);
  if (o.show.trophies) out.push(`<img src="${trophyUrl(u, o)}" alt="GitHub trophies" />`);
  if (o.show.activity) out.push(`<img width="100%" src="${activityUrl(u, o)}" alt="Contribution graph" />`);
  if (!out.length) return '';
  return center ? `<p align="center">\n${out.join('\n<br/>\n')}\n</p>` : out.join('\n\n');
}
const visitors = (d, o) => (o.show.visitors && d.username ? `![Profile views](${visitorsUrl(d.username, o)})` : '');
const sec = (title, body) => (String(body || '').trim() ? `## ${title}\n\n${body.trim()}\n` : '');
const join = (...parts) =>
  parts
    .filter((p) => String(p || '').trim())
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
const projectLink = (p) => (p.url ? `[${p.name}](${p.url})` : `**${p.name}**`);
const projectsList = (d, o) => (o.show.projects && d.projects.length ? d.projects.map((p) => `- ${projectLink(p)}${p.description ? ` — ${p.description}` : ''}${p.tech ? ` \`${p.tech}\`` : ''}`).join('\n') : '');
const skillsBadges = (d, o, style) => (o.show.skills && d.allTech.length ? d.allTech.map((t) => badgeMd(t, o, style)).join(' ') : '');
const socialsLine = (d, o) => (o.show.socials && d.socials.length ? socialBadges(d, o) : '');
const dates = (a, b) => [a, b].filter(Boolean).join(' – ');
const expList = (d, o) => (o.show.experience && d.experience.length ? d.experience.map((e) => `- **${e.role}** @ ${e.company}${e.start || e.end ? ` _(${dates(e.start, e.end)})_` : ''}`).join('\n') : '');
const quoteJs = (s) => JSON.stringify(String(s || ''));

const BLANK = Symbol('blank line');

// ---------- templates ----------
export const README_TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    desc: 'Greeting, quick facts, badges, stats — the most popular layout.',
    build: (d, o) =>
      join(
        `# Hi, I'm ${d.first} 👋`,
        d.tagline && `### ${d.tagline}`,
        [d.currently && `- 🔭 I'm currently working on **${d.currently}**`, d.learning && `- 🌱 I'm currently learning **${d.learning}**`, d.askMe && `- 💬 Ask me about **${d.askMe}**`, d.availability && `- 🎯 ${d.availability}`, d.location && `- 📍 Based in ${d.location}`, d.email && `- 📫 Reach me at **${d.email}**`, d.funFact && `- ⚡ Fun fact: ${d.funFact}`].filter(Boolean).join('\n'),
        sec('Tech stack', skillsBadges(d, o)),
        sec('GitHub stats', statsBlock(d, o)),
        sec('Connect', socialsLine(d, o)),
        visitors(d, o)
      ),
  },
  {
    id: 'typing',
    name: 'Typing hero',
    desc: 'Animated typing intro, centred, with big skill icons.',
    build: (d, o) =>
      join(
        `<h1 align="center">${d.name}</h1>`,
        `<p align="center">\n  <img src="${typingUrl([d.headline || `Hi, I'm ${d.first}`, d.tagline, d.availability], o)}" alt="Typing intro" />\n</p>`,
        o.show.socials && d.socials.length && `<p align="center">\n${socialBadges(d, o, true)}\n</p>`,
        d.about && `<p align="center">${d.about}</p>`,
        o.show.skills && d.allTech.length && `<h3 align="center">Tech stack</h3>\n<p align="center">\n  ${skillIcons(d.allTech, 10, iconTheme(o))}\n</p>`,
        statsBlock(d, o),
        visitors(d, o) && `<p align="center">${visitors(d, o)}</p>`
      ),
  },
  {
    id: 'terminal',
    name: 'Terminal session',
    desc: 'Your profile as commands and output in a shell.',
    build: (d, o) =>
      join(
        '```console',
        `$ whoami\n${d.name}${d.headline ? ` — ${d.headline}` : ''}`,
        d.location && `$ echo $LOCATION\n${d.location}`,
        o.show.skills && d.skillGroups.length && `$ cat skills.txt\n${d.skillGroups.map((g) => `${g.group.padEnd(12)} ${g.items.map((t) => t.label).join(', ')}`).join('\n')}`,
        o.show.projects && d.projects.length && `$ ls ~/projects\n${d.projects.map((p) => p.name).join('   ')}`,
        d.availability && `$ cat status\n${d.availability}`,
        d.email && `$ mail\n${d.email}`,
        '```'
      ) +
      '\n' +
      join(statsBlock(d, o), socialsLine(d, o), visitors(d, o)),
  },
  {
    id: 'json',
    name: 'JSON profile',
    desc: 'About-me as a JSON object — clean and developer-y.',
    build: (d, o) =>
      join(
        `# ${d.name}`,
        '```json\n' +
          JSON.stringify(
            {
              name: d.name,
              role: d.headline || undefined,
              location: d.location || undefined,
              currentlyBuilding: d.currently || undefined,
              learning: d.learning || undefined,
              skills: o.show.skills ? Object.fromEntries(d.skillGroups.map((g) => [g.group, g.items.map((t) => t.label)])) : undefined,
              openTo: d.availability || undefined,
              contact: d.email || undefined,
            },
            null,
            2
          ) +
          '\n```',
        statsBlock(d, o),
        socialsLine(d, o),
        visitors(d, o)
      ),
  },
  {
    id: 'python',
    name: 'Python class',
    desc: 'You, as a Python class with attributes and a method.',
    build: (d, o) => {
      const cls = d.first.replace(/[^A-Za-z0-9]/g, '') || 'Developer';
      return join(
        `### Hi there, I'm ${d.first}`,
        '```python\n' +
          [
            `class ${cls}:`,
            '    def __init__(self):',
            `        self.name = ${quoteJs(d.name)}`,
            d.headline && `        self.role = ${quoteJs(d.headline)}`,
            d.location && `        self.location = ${quoteJs(d.location)}`,
            o.show.skills && d.allTech.length && `        self.stack = [${d.allTech.slice(0, 12).map((t) => quoteJs(t.label)).join(', ')}]`,
            d.learning && `        self.learning = ${quoteJs(d.learning)}`,
            BLANK,
            '    def say_hi(self):',
            `        print(${quoteJs(d.tagline || "Thanks for dropping by — let's build something!")})`,
            BLANK,
            BLANK,
            `me = ${cls}()`,
            'me.say_hi()',
          ]
            .filter((x) => x === BLANK || (typeof x === 'string' && x)) // drop missing fields, keep the blank lines
            .map((x) => (x === BLANK ? '' : x))
            .join('\n') +
          '\n```',
        statsBlock(d, o),
        socialsLine(d, o)
      );
    },
  },
  {
    id: 'yaml',
    name: 'YAML config',
    desc: 'Profile as a config file — neat and scannable.',
    build: (d, o) =>
      join(
        `## ${d.name} \`${d.username ? `@${d.username}` : 'dev'}\``,
        '```yaml\n' +
          [
            `name: ${d.name}`,
            d.headline && `role: ${d.headline}`,
            d.location && `location: ${d.location}`,
            d.currently && `building: ${d.currently}`,
            d.learning && `learning: ${d.learning}`,
            o.show.skills && d.skillGroups.length && `skills:\n${d.skillGroups.map((g) => `  ${g.group.toLowerCase().replace(/[^a-z0-9]+/g, '_')}: [${g.items.map((t) => t.label).join(', ')}]`).join('\n')}`,
            d.availability && `status: ${d.availability}`,
            d.email && `contact: ${d.email}`,
          ]
            .filter(Boolean)
            .join('\n') +
          '\n```',
        statsBlock(d, o),
        socialsLine(d, o)
      ),
  },
  {
    id: 'icons',
    name: 'Skill icon grid',
    desc: 'Big icon rows, one per skill group.',
    build: (d, o) =>
      join(
        `<h2 align="center">${d.name}</h2>`,
        d.headline && `<p align="center"><b>${d.headline}</b></p>`,
        d.about && `<p align="center">${d.about}</p>`,
        o.show.skills &&
          d.skillGroups
            .map((g) => {
              const icons = skillIcons(g.items, 10, iconTheme(o));
              return icons ? `<h4 align="center">${g.group}</h4>\n<p align="center">${icons}</p>` : '';
            })
            .filter(Boolean)
            .join('\n\n'),
        statsBlock(d, o),
        o.show.socials && d.socials.length && `<p align="center">\n${socialBadges(d, o, true)}\n</p>`
      ),
  },
  {
    id: 'badges',
    name: 'Badge wall',
    desc: 'A table of skill groups, each filled with badges.',
    build: (d, o) =>
      join(
        `# ${d.name}`,
        d.headline && `**${d.headline}**`,
        d.about,
        o.show.skills && d.skillGroups.length && `| | |\n|---|---|\n${d.skillGroups.map((g) => `| **${g.group}** | ${g.items.map((t) => badgeMd(t, o, 'flat-square')).join(' ')} |`).join('\n')}`,
        statsBlock(d, o),
        socialsLine(d, o),
        visitors(d, o)
      ),
  },
  {
    id: 'dashboard',
    name: 'Stats dashboard',
    desc: 'Everything GitHub can show: stats, languages, streak, trophies, activity.',
    build: (d, o) =>
      join(
        `<h1 align="center">${d.name}'s GitHub</h1>`,
        d.headline && `<p align="center">${d.headline}</p>`,
        d.username
          ? statsBlock(d, { ...o, show: { ...o.show, stats: true, langs: true, streak: true, trophies: true, activity: true } })
          : '> Add your GitHub username in the options to show live stats here.',
        o.show.skills && d.allTech.length && `<p align="center">${skillIcons(d.allTech, 14, iconTheme(o))}</p>`,
        o.show.socials && d.socials.length && `<p align="center">\n${socialBadges(d, o, true)}\n</p>`
      ),
  },
  {
    id: 'twocol',
    name: 'Two columns',
    desc: 'About and stack on the left, live stats on the right.',
    build: (d, o) =>
      join(
        `# ${d.name}`,
        `<table>\n<tr>\n<td width="55%" valign="top">\n\n${[d.headline && `**${d.headline}**`, d.about, d.currently && `🔭 Working on **${d.currently}**`, d.availability && `🎯 ${d.availability}`, o.show.skills && skillIcons(d.allTech, 8, iconTheme(o))].filter(Boolean).join('\n\n')}\n\n</td>\n<td width="45%" valign="top">\n\n${
          d.username ? [o.show.stats && `<img width="100%" src="${statsUrl(d.username, o)}" alt="GitHub stats" />`, o.show.langs && `<img width="100%" src="${langsUrl(d.username, o)}" alt="Top languages" />`].filter(Boolean).join('\n') : 'Add your GitHub username to show stats here.'
        }\n\n</td>\n</tr>\n</table>`,
        socialsLine(d, o)
      ),
  },
  {
    id: 'pinned',
    name: 'Pinned projects',
    desc: 'Repository cards for your best projects, in a grid.',
    build: (d, o) => {
      const cards = d.projects.filter((p) => p.repoName);
      return join(
        `## ${d.name}`,
        d.tagline && `_${d.tagline}_`,
        o.show.projects &&
          (cards.length
            ? `### Featured projects\n\n<p>\n${cards.map((p) => `<a href="https://github.com/${p.owner}/${p.repoName}"><img width="48%" src="${pinUrl(p.owner, p.repoName, o)}" alt="${p.name}" /></a>`).join('\n')}\n</p>`
            : sec('Projects', projectsList(d, o))),
        o.show.skills && d.allTech.length && `### Stack\n\n${skillIcons(d.allTech, 12, iconTheme(o))}`,
        statsBlock(d, o),
        socialsLine(d, o)
      );
    },
  },
  {
    id: 'banner',
    name: 'Wave banner',
    desc: 'A gradient wave header and footer around a centred profile.',
    build: (d, o) =>
      join(
        `<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=${o.badges === 'mono' ? '111111' : o.accent}&height=180&section=header&text=${encodeURIComponent(d.name)}&fontSize=42&fontColor=ffffff&desc=${encodeURIComponent(d.headline || '')}&descAlignY=72&animation=fadeIn" alt="${d.name}" />`,
        d.about && `<p align="center">${d.about}</p>`,
        o.show.skills && d.allTech.length && `<p align="center">${skillIcons(d.allTech, 12, iconTheme(o))}</p>`,
        statsBlock(d, o),
        o.show.socials && d.socials.length && `<p align="center">\n${socialBadges(d, o, true)}\n</p>`,
        `<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=${o.badges === 'mono' ? '111111' : o.accent}&height=110&section=footer" alt="" />`
      ),
  },
  {
    id: 'student',
    name: 'Student, open to work',
    desc: 'Education first, availability up top — made for internships.',
    build: (d, o) =>
      join(
        `# ${d.name}`,
        d.availability && `> **${d.availability}**${d.resumeUrl ? ` · [Resume](${d.resumeUrl})` : ''}${d.email ? ` · [${d.email}](mailto:${d.email})` : ''}`,
        d.headline && `**${d.headline}**${d.location ? ` · ${d.location}` : ''}`,
        d.about,
        sec('Education', d.education.map((e) => `- **${e.school}** — ${e.degree}${e.end ? ` _(${e.end})_` : ''}${e.score ? ` · ${e.score}` : ''}`).join('\n')),
        sec('Experience', expList(d, o)),
        sec('Projects', projectsList(d, o)),
        sec('Skills', skillsBadges(d, o, 'flat')),
        sec('Stats', statsBlock(d, o, { center: false })),
        socialsLine(d, o)
      ),
  },
  {
    id: 'resume',
    name: 'Mini resume',
    desc: 'A concise resume: experience, projects, education, skills.',
    build: (d, o) =>
      join(
        `# ${d.name}`,
        [d.headline, d.location, d.email && `[${d.email}](mailto:${d.email})`, d.website && `[Portfolio](${d.website})`].filter(Boolean).join(' · '),
        sec(
          'Experience',
          o.show.experience &&
            d.experience
              .map((e) => `**${e.role}** · ${e.company}${e.start || e.end ? ` — _${dates(e.start, e.end)}_` : ''}\n${linesOf(e.bullets).slice(0, 3).map((x) => `- ${x}`).join('\n')}`)
              .join('\n\n')
        ),
        sec('Projects', o.show.projects && d.projects.map((p) => `**${projectLink(p)}**${p.tech ? ` · _${p.tech}_` : ''}  \n${p.description || ''}`).join('\n\n')),
        sec('Education', d.education.map((e) => `**${e.school}** — ${e.degree}${e.end ? ` _(${e.end})_` : ''}`).join('\n\n')),
        sec('Skills', o.show.skills && d.skillGroups.map((g) => `**${g.group}:** ${g.items.map((t) => t.label).join(', ')}`).join('  \n')),
        statsBlock(d, o)
      ),
  },
  {
    id: 'timeline',
    name: 'Timeline',
    desc: 'Your journey as a dated timeline.',
    build: (d, o) => {
      const items = [
        ...(o.show.experience ? d.experience.map((e) => ({ when: e.end || e.start || '', text: `**${e.role}** at ${e.company}` })) : []),
        ...d.education.map((e) => ({ when: e.end || e.start || '', text: `**${e.degree}** — ${e.school}` })),
        ...d.achievements.map((a) => ({ when: a.date || '', text: `🏆 ${a.title}` })),
      ];
      return join(
        `# ${d.name}`,
        d.tagline && `_${d.tagline}_`,
        sec('Journey', items.map((i) => `- \`${(i.when || 'now').padEnd(9)}\` ${i.text}`).join('\n')),
        sec('Projects', projectsList(d, o)),
        sec('Stack', skillsBadges(d, o, 'flat-square')),
        statsBlock(d, o),
        socialsLine(d, o)
      );
    },
  },
  {
    id: 'details',
    name: 'Collapsible',
    desc: 'Tidy sections that expand on click.',
    build: (d, o) => {
      const box = (title, body, open) => (String(body || '').trim() ? `<details${open ? ' open' : ''}>\n<summary><b>${title}</b></summary>\n\n${body}\n\n</details>` : '');
      return join(
        `## 📂 ${d.first}'s profile`,
        d.headline && `> ${d.headline}${d.location ? ` · ${d.location}` : ''}`,
        d.about,
        '_Click a section to open it._',
        box('Tech stack', o.show.skills && d.skillGroups.map((g) => `**${g.group}:** ${g.items.map((t) => t.label).join(', ')}`).join('  \n'), true),
        box('Projects', projectsList(d, o)),
        box('Experience', expList(d, o)),
        box('GitHub stats', statsBlock(d, o, { center: false })),
        socialsLine(d, o)
      );
    },
  },
  {
    id: 'gitlog',
    name: 'Git log',
    desc: 'Your story as commits on main.',
    build: (d, o) => {
      const hash = (s) => Math.abs([...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(16).padStart(7, '0').slice(0, 7);
      const commits = [
        d.availability && `* ${hash('now')} (HEAD -> main) ${d.availability}`,
        d.currently && `* ${hash(d.currently)} feat: building ${d.currently}`,
        ...(o.show.experience ? d.experience.map((e) => `* ${hash(e.company)} work: ${e.role} @ ${e.company}${e.start ? ` (${e.start})` : ''}`) : []),
        ...(o.show.projects ? d.projects.slice(0, 4).map((p) => `* ${hash(p.name)} ship: ${p.name}${p.description ? ` — ${p.description}` : ''}`) : []),
        ...d.education.map((e) => `* ${hash(e.school)} edu: ${e.degree} @ ${e.school}`),
        `* ${hash(d.name)} init: hello world, I'm ${d.first}`,
      ].filter(Boolean);
      return join(`## \`git log --oneline\``, '```text\n' + commits.join('\n') + '\n```', sec('Stack', skillsBadges(d, o, 'flat-square')), statsBlock(d, o), socialsLine(d, o));
    },
  },
  {
    id: 'changelog',
    name: 'Changelog',
    desc: 'Releases of you — current version on top.',
    build: (d, o) =>
      join(
        `# Changelog — ${d.name}`,
        `## [Unreleased]\n${[d.learning && `- Learning ${d.learning}`, d.availability && `- ${d.availability}`].filter(Boolean).map((x) => x).join('\n') || '- Building cool things'}`,
        `## [Current]\n### Added\n${[d.currently && `- Working on **${d.currently}**`, ...(o.show.skills ? [`- Stack: ${d.allTech.slice(0, 10).map((t) => t.label).join(', ')}`] : [])].filter(Boolean).join('\n')}`,
        o.show.experience && d.experience.length && `### Experience\n${d.experience.map((e) => `- ${e.role} @ ${e.company}${e.start ? ` (${dates(e.start, e.end)})` : ''}`).join('\n')}`,
        o.show.projects && d.projects.length && `### Shipped\n${d.projects.map((p) => `- ${projectLink(p)}${p.description ? ` — ${p.description}` : ''}`).join('\n')}`,
        d.education.length && `## [1.0.0] — Education\n${d.education.map((e) => `- ${e.degree}, ${e.school}`).join('\n')}`,
        statsBlock(d, o),
        socialsLine(d, o)
      ),
  },
  {
    id: 'minimal',
    name: 'Ultra minimal',
    desc: 'One line, links, done. Quietly confident.',
    build: (d, o) =>
      join(
        `**${d.name}**${d.headline ? ` — ${d.headline}` : ''}${d.location ? `, ${d.location}` : ''}.`,
        d.tagline,
        o.show.socials && d.socials.map((s) => `[${s.label}](${s.url})`).join(' · '),
        d.username && o.show.stats && `<img height="120" src="${statsUrl(d.username, { ...o, theme: o.theme })}&hide=contribs,prs&hide_title=true&hide_rank=true" alt="GitHub stats" />`
      ),
  },
  {
    id: 'centered',
    name: 'Centred elegant',
    desc: 'Symmetric, airy, with thin dividers.',
    build: (d, o) =>
      join(
        `<div align="center">\n\n# ${d.name}\n\n${d.headline ? `*${d.headline}*` : ''}\n\n---\n\n${d.about || ''}\n\n---\n\n${o.show.skills ? d.allTech.map((t) => badgeMd(t, o, 'flat-square')).join(' ') : ''}\n\n${statsBlock(d, o, { center: false })}\n\n${o.show.socials ? d.socials.map((s) => `[${s.label}](${s.url})`).join(' &nbsp;·&nbsp; ') : ''}\n\n</div>`
      ),
  },
  {
    id: 'table',
    name: 'Skills table',
    desc: 'A clean Markdown table of what you use and where.',
    build: (d, o) =>
      join(
        `# ${d.name}`,
        d.about,
        o.show.skills && d.skillGroups.length && `| Area | Technologies |\n|:--|:--|\n${d.skillGroups.map((g) => `| ${g.group} | ${g.items.map((t) => t.label).join(' · ')} |`).join('\n')}`,
        o.show.projects && d.projects.length && `| Project | What it is | Built with |\n|:--|:--|:--|\n${d.projects.map((p) => `| ${projectLink(p)} | ${p.description || ''} | ${p.tech || ''} |`).join('\n')}`,
        statsBlock(d, o),
        socialsLine(d, o)
      ),
  },
  {
    id: 'ascii',
    name: 'ASCII card',
    desc: 'A retro box-drawing business card in a code block.',
    build: (d, o) => {
      const rows = [d.name, d.headline, d.location, '', d.currently && `building: ${d.currently}`, d.learning && `learning: ${d.learning}`, d.email, d.username && `github.com/${d.username}`].filter((x) => x !== false && x !== undefined && x !== null);
      const w = Math.min(60, Math.max(28, ...rows.map((r) => String(r).length))) + 2;
      const line = (s) => `│ ${String(s).slice(0, w - 2).padEnd(w - 2)} │`;
      const card = [`┌${'─'.repeat(w)}┐`, ...rows.map(line), `└${'─'.repeat(w)}┘`].join('\n');
      return join('```text\n' + card + '\n```', sec('Stack', skillsBadges(d, o, 'flat-square')), statsBlock(d, o), socialsLine(d, o));
    },
  },
  {
    id: 'connect',
    name: 'Connect-first',
    desc: 'Big social buttons up top — for networkers and creators.',
    build: (d, o) =>
      join(
        `<h1 align="center">Hey, I'm ${d.first} 👋</h1>`,
        d.tagline && `<p align="center">${d.tagline}</p>`,
        d.socials.length && `<p align="center">\n${socialBadges(d, o, true)}\n</p>`,
        d.about && `---\n\n${d.about}`,
        sec('What I work with', skillsBadges(d, o, 'flat')),
        sec('Recent projects', projectsList(d, o)),
        statsBlock(d, o),
        visitors(d, o) && `<p align="center">${visitors(d, o)}</p>`
      ),
  },
  {
    id: 'sql',
    name: 'SQL query',
    desc: 'SELECT * FROM developers WHERE name = you.',
    build: (d, o) =>
      join(
        '```sql\n' + `SELECT name, role, location, stack\nFROM   developers\nWHERE  username = '${d.username || d.first.toLowerCase()}';` + '\n```',
        `| name | role | location | stack |\n|---|---|---|---|\n| ${d.name} | ${d.headline || '—'} | ${d.location || '—'} | ${o.show.skills ? d.allTech.slice(0, 6).map((t) => t.label).join(', ') : '—'} |`,
        `_1 row returned._`,
        sec('Projects', projectsList(d, o)),
        statsBlock(d, o),
        socialsLine(d, o)
      ),
  },
  {
    id: 'statement',
    name: 'Statement',
    desc: 'A bold one-line statement, then the essentials.',
    build: (d, o) =>
      join(
        `# ${d.tagline || d.headline || `Hi, I'm ${d.first}.`}`,
        `— **${d.name}**${d.headline && d.tagline ? `, ${d.headline}` : ''}`,
        d.about,
        sec('Selected work', projectsList(d, o)),
        sec('Toolbox', o.show.skills && d.allTech.map((t) => `\`${t.label}\``).join(' ')),
        statsBlock(d, o),
        socialsLine(d, o)
      ),
  },
  {
    id: 'cards',
    name: 'Project gallery',
    desc: 'Projects as a 2-column HTML card grid with tech icons.',
    build: (d, o) => {
      const cells = d.projects.map((p) => `<td width="50%" valign="top">\n\n### ${projectLink(p)}\n${p.description || ''}\n\n${skillIcons(p.techList, 8, iconTheme(o)) || (p.tech ? `\`${p.tech}\`` : '')}\n\n</td>`);
      const rows = [];
      for (let i = 0; i < cells.length; i += 2) rows.push(`<tr>\n${cells[i]}\n${cells[i + 1] || '<td></td>'}\n</tr>`);
      return join(`# 🛠️ Things ${d.first} has built`, [d.headline, d.location].filter(Boolean).join(' · '), d.tagline, o.show.projects && rows.length && `## Projects\n\n<table>\n${rows.join('\n')}\n</table>`, statsBlock(d, o), socialsLine(d, o));
    },
  },
];

// ---------- bold & fun templates ----------
// animated header art (capsule-render): type = waving | venom | rect | soft | cylinder | egg | shark | slice
const capsule = (o, { type = 'waving', color, height = 200, section = 'header', text = '', desc = '', fontColor = 'ffffff', fontSize = 48, animation = 'fadeIn', extra = '' }) =>
  `<img width="100%" src="https://capsule-render.vercel.app/api?type=${type}&color=${o.badges === 'mono' ? '0:111111,100:444444' : color}&height=${height}&section=${section}${text ? `&text=${encodeURIComponent(text)}&fontSize=${fontSize}&fontColor=${fontColor}` : ''}${desc ? `&desc=${encodeURIComponent(desc)}&descAlignY=70&descSize=18` : ''}&animation=${animation}${extra}" alt="${text || 'banner'}" />`;
const typing = (lines, color, font, opts = {}) =>
  `<img src="https://readme-typing-svg.demolab.com?font=${font}&weight=${opts.weight || 700}&size=${opts.size || 24}&duration=${opts.duration || 3500}&pause=900&color=${color}&center=true&vCenter=true&width=${opts.width || 640}&lines=${lines.filter(Boolean).map(encodeURIComponent).join(';')}" alt="${lines.filter(Boolean)[0] || ''}" />`;
const center = (...parts) => `<p align="center">\n${parts.filter(Boolean).join('\n')}\n</p>`;
const icons = (d, o, theme = 'dark', perline = 12) => (o.show.skills && d.allTech.length ? skillIcons(d.allTech, perline, theme) : '');
const socialsCenter = (d, o) => (o.show.socials && d.socials.length ? center(socialBadges(d, o, true)) : '');
const mono = (o, color) => (o.badges === 'mono' ? 'AAAAAA' : color);

export const SNAKE_WORKFLOW = `name: Generate contribution snake

on:
  schedule:
    - cron: "0 */12 * * *"   # twice a day
  workflow_dispatch:          # run it by hand from the Actions tab
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: Platane/snk@v3
        with:
          github_user_name: \${{ github.repository_owner }}
          outputs: |
            dist/github-contribution-grid-snake.svg
            dist/github-contribution-grid-snake-dark.svg?palette=github-dark

      - uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

README_TEMPLATES.push(
  {
    id: 'neon',
    vibe: 'bold',
    name: 'Neon cyberpunk',
    desc: 'Glowing gradient header, neon typing, dark cards.',
    build: (d, o) =>
      join(
        capsule(o, { type: 'venom', color: '0:ff00cc,100:3a0ca3', height: 220, text: d.name.toUpperCase(), fontSize: 56, desc: d.headline, animation: 'twinkling', extra: '&stroke=ff00cc&strokeWidth=2' }),
        center(typing([`> ${d.tagline || 'Building things for the web'}`, d.currently && `> Currently hacking on ${d.currently}`, d.availability && `> ${d.availability}`], mono(o, 'FF00CC'), 'Orbitron')),
        o.show.skills && d.allTech.length && `<h3 align="center">⚡ STACK ⚡</h3>\n${center(icons(d, o, 'dark', 10))}`,
        statsBlock(d, o),
        socialsCenter(d, o),
        capsule(o, { type: 'venom', color: '0:3a0ca3,100:ff00cc', height: 120, section: 'footer', animation: 'twinkling' })
      ),
  },
  {
    id: 'synthwave',
    vibe: 'bold',
    name: 'Synthwave ’84',
    desc: 'Retro sunset gradient, ’80s display type, chrome vibes.',
    build: (d, o) =>
      join(
        capsule(o, { type: 'waving', color: '0:fc466b,50:9b5de5,100:3f5efb', height: 230, text: d.name, fontSize: 60, desc: d.headline, fontColor: 'fdf0ff' }),
        center(typing([d.tagline || `Hi, I'm ${d.first}`, d.learning && `Leveling up in ${d.learning}`, d.availability], mono(o, 'F72585'), 'Monoton', { size: 26, weight: 400 })),
        d.about && `<p align="center"><i>${d.about}</i></p>`,
        o.show.skills && d.allTech.length && `<h2 align="center">✦ GEAR ✦</h2>\n${center(icons(d, o, 'dark', 10))}`,
        o.show.projects && d.projects.length && `<h2 align="center">✦ TRACKLIST ✦</h2>\n\n${d.projects.map((p, i) => `\`${String(i + 1).padStart(2, '0')}\` ${projectLink(p)}${p.description ? ` — ${p.description}` : ''}`).join('  \n')}`,
        statsBlock(d, o),
        socialsCenter(d, o)
      ),
  },
  {
    id: 'matrix',
    vibe: 'bold',
    name: 'Matrix',
    desc: 'Green-on-black typing, terminal output, hacker energy.',
    build: (d, o) =>
      join(
        capsule(o, { type: 'rect', color: '0:000000,100:003b00', height: 140, text: `> ${d.username || d.first.toLowerCase()}_`, fontSize: 44, fontColor: '00FF41', animation: 'blinking' }),
        center(typing([`Wake up, ${d.first}...`, 'The Matrix has you...', d.headline && `Role: ${d.headline}`, d.currently && `Running: ${d.currently}`], mono(o, '00FF41'), 'Fira+Code', { size: 20 })),
        '```bash\n' +
          [`root@github:~$ ./whoami.sh`, `[ OK ] user ........ ${d.name}`, d.location && `[ OK ] location .... ${d.location}`, o.show.skills && d.allTech.length && `[ OK ] modules ..... ${d.allTech.slice(0, 8).map((t) => t.label).join(', ')}`, d.learning && `[ .. ] loading ..... ${d.learning}`, d.email && `[ OK ] contact ..... ${d.email}`, `root@github:~$ _`].filter(Boolean).join('\n') +
          '\n```',
        statsBlock(d, o),
        socialsLine(d, o)
      ),
  },
  {
    id: 'space',
    vibe: 'bold',
    name: 'Space mission',
    desc: 'Starry animated header, mission log and launches.',
    build: (d, o) =>
      join(
        capsule(o, { type: 'rect', color: '0:0f2027,50:203a43,100:2c5364', height: 200, text: `🚀 ${d.name}`, fontSize: 50, desc: d.headline, animation: 'twinkling' }),
        center(typing([`Mission: ${d.tagline || 'build useful things'}`, d.learning && `Exploring: ${d.learning}`, d.availability && `Status: ${d.availability}`], mono(o, '7DD3FC'), 'Space+Mono', { size: 20 })),
        sec('🛰️ Mission log', o.show.experience && d.experience.map((e) => `- **${e.role}** @ ${e.company}${e.start || e.end ? ` · _${dates(e.start, e.end)}_` : ''}`).join('\n')),
        sec('🌌 Launches', o.show.projects && d.projects.map((p) => `- 🚀 ${projectLink(p)}${p.description ? ` — ${p.description}` : ''}`).join('\n')),
        o.show.skills && d.allTech.length && `## 🧰 Flight systems\n\n${icons(d, o, 'dark', 12)}`,
        statsBlock(d, o),
        socialsCenter(d, o)
      ),
  },
  {
    id: 'rpg',
    vibe: 'bold',
    name: 'RPG character sheet',
    desc: 'Class, guild, quests, abilities and inventory — profile as a game.',
    build: (d, o) => {
      const guild = d.experience[0]?.company || d.education[0]?.school || '—';
      const tools = d.skillGroups.find((g) => /tool|devops|platform/i.test(g.group));
      const abilities = d.allTech.filter((t) => !tools || !tools.items.some((x) => x.label === t.label));
      return join(
        `<h1 align="center">⚔️ ${d.name} ⚔️</h1>`,
        center(typing([`A wild ${d.headline || 'developer'} appeared!`, d.currently && `Current quest: ${d.currently}`, `Press START to connect`], mono(o, 'FBBF24'), 'Press+Start+2P', { size: 16, weight: 400 })),
        `| 🧙 Character | |\n|:--|:--|\n| **Class** | ${d.headline || 'Developer'} |\n| **Guild** | ${guild} |\n${d.location ? `| **Realm** | ${d.location} |\n` : ''}${d.currently ? `| **Active quest** | ${d.currently} |\n` : ''}${d.learning ? `| **Training** | ${d.learning} |\n` : ''}${d.availability ? `| **Looking for** | ${d.availability} |\n` : ''}`,
        sec('✨ Abilities', o.show.skills && abilities.map((t) => `\`${t.label}\``).join(' ')),
        sec('🎒 Inventory', o.show.skills && tools && tools.items.map((t) => `\`${t.label}\``).join(' ')),
        sec('📜 Quests completed', [...(o.show.experience ? d.experience.map((e) => `- [x] ${e.role} @ ${e.company}`) : []), ...(o.show.projects ? d.projects.map((p) => `- [x] Shipped ${projectLink(p)}`) : []), ...d.achievements.map((a) => `- [x] 🏆 ${a.title}`)].join('\n')),
        statsBlock(d, o),
        socialsLine(d, o)
      );
    },
  },
  {
    id: 'trophies',
    vibe: 'bold',
    name: 'Achievements unlocked',
    desc: 'Projects and wins as gold trophy badges, plus the trophy case.',
    build: (d, o) => {
      const trophy = (label, value) => `![${label}](https://img.shields.io/badge/${enc(label)}-${enc(value)}-${o.badges === 'mono' ? '111111' : 'FFD700'}?style=for-the-badge&labelColor=111111)`;
      return join(
        `# 🏆 ${d.name}`,
        d.headline && `**${d.headline}**${d.location ? ` · ${d.location}` : ''}`,
        sec('Achievements unlocked', [...d.achievements.map((a) => trophy('🏆 Unlocked', a.title)), ...(o.show.projects ? d.projects.map((p) => trophy('🚀 Shipped', p.name)) : []), ...(o.show.experience ? d.experience.map((e) => trophy('💼 Joined', e.company)) : [])].join('\n')),
        d.username && `## Trophy case\n\n<img width="100%" src="${trophyUrl(d.username, o)}" alt="GitHub trophies" />`,
        sec('Skill tree', skillsBadges(d, o)),
        statsBlock(d, { ...o, show: { ...o.show, trophies: false } }),
        socialsLine(d, o)
      );
    },
  },
  {
    id: 'snake',
    vibe: 'bold',
    name: 'Contribution snake',
    desc: 'The famous snake that eats your contribution graph (needs a one-time GitHub Action).',
    workflow: 'snake',
    build: (d, o) => {
      const u = d.username || 'your-username';
      return join(
        center(typing([`Hi 👋 I'm ${d.first}`, d.headline, d.tagline], mono(o, o.accent), 'Fira+Code')),
        d.about && `<p align="center">${d.about}</p>`,
        center(icons(d, o, iconTheme(o), 12)),
        statsBlock(d, o),
        `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${u}/${u}/output/github-contribution-grid-snake-dark.svg" />\n  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${u}/${u}/output/github-contribution-grid-snake.svg" />\n  <img alt="Contribution snake" src="https://raw.githubusercontent.com/${u}/${u}/output/github-contribution-grid-snake.svg" />\n</picture>`,
        socialsCenter(d, o)
      );
    },
  },
  {
    id: 'pixel',
    vibe: 'bold',
    name: 'Pixel arcade',
    desc: '8-bit type, arcade header and a high-score table.',
    build: (d, o) =>
      join(
        capsule(o, { type: 'rect', color: '0:1a1a2e,100:16213e', height: 150, text: 'PLAYER 1', fontSize: 40, fontColor: 'f9d71c', animation: 'blinking' }),
        center(typing([`${d.name.toUpperCase()}`, 'INSERT COIN TO CONTINUE', d.headline && d.headline.toUpperCase()], mono(o, 'F9D71C'), 'Press+Start+2P', { size: 18, weight: 400 })),
        o.show.projects && d.projects.length && `<h3 align="center">👾 HIGH SCORES 👾</h3>\n\n| RANK | GAME | ⭐ |\n|:--:|:--|:--:|\n${d.projects.map((p, i) => `| ${['1ST', '2ND', '3RD', '4TH', '5TH', '6TH'][i]} | ${projectLink(p)} | ${p.stars || '—'} |`).join('\n')}`,
        o.show.skills && d.allTech.length && `<h3 align="center">🕹️ POWER-UPS</h3>\n${center(icons(d, o, 'dark', 10))}`,
        statsBlock(d, o),
        socialsCenter(d, o)
      ),
  },
  {
    id: 'aurora',
    vibe: 'bold',
    name: 'Aurora',
    desc: 'Soft aurora gradient, light type, airy and modern.',
    build: (d, o) =>
      join(
        capsule(o, { type: 'soft', color: '0:a18cd1,50:fbc2eb,100:8fd3f4', height: 210, text: d.name, fontSize: 52, desc: d.headline, fontColor: '2d2a4a', animation: 'scaleIn' }),
        d.tagline && `<h3 align="center"><i>“${d.tagline}”</i></h3>`,
        d.about && `<p align="center">${d.about}</p>`,
        center(icons(d, o, 'light', 12)),
        o.show.projects && d.projects.length && `<h3 align="center">Selected work</h3>\n\n${d.projects.map((p) => `> ${projectLink(p)}${p.description ? ` — ${p.description}` : ''}`).join('\n>\n')}`,
        statsBlock(d, o),
        socialsCenter(d, o),
        capsule(o, { type: 'soft', color: '0:8fd3f4,50:fbc2eb,100:a18cd1', height: 100, section: 'footer', animation: 'scaleIn' })
      ),
  }
);
// everything not marked bold is a clean, professional layout
['typing', 'banner', 'ascii', 'gitlog', 'connect'].forEach((id) => {
  const t = README_TEMPLATES.find((x) => x.id === id);
  if (t) t.vibe = 'bold';
});
README_TEMPLATES.forEach((t) => (t.vibe = t.vibe || 'clean'));

// order: Classic first, then the bold showcase templates, then everything else
const SHOWCASE = ['neon', 'synthwave', 'matrix', 'space', 'rpg', 'trophies', 'snake', 'pixel', 'aurora'];
{
  const showcase = SHOWCASE.map((id) => README_TEMPLATES.find((t) => t.id === id)).filter(Boolean);
  const rest = README_TEMPLATES.filter((t) => !SHOWCASE.includes(t.id) && t.id !== 'classic');
  const classic = README_TEMPLATES.find((t) => t.id === 'classic');
  README_TEMPLATES.splice(0, README_TEMPLATES.length, classic, ...showcase, ...rest);
}

export function buildReadme(templateId, profile, github, opts) {
  const o = { ...DEFAULT_OPTS, ...opts, show: { ...DEFAULT_OPTS.show, ...(opts?.show || {}) } };
  const t = README_TEMPLATES.find((x) => x.id === templateId) || README_TEMPLATES[0];
  return t.build(readmeData(profile, github, o), o);
}
