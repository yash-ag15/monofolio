// Resume documents: data model, demo content, and conversion from the Dev Identity profile.

export const RESUME_SECTIONS = ['summary', 'education', 'experience', 'projects', 'skills', 'achievements', 'certifications', 'custom'];

export const RESUME_SECTION_LABELS = {
  summary: 'Summary',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Technical Skills',
  achievements: 'Achievements',
  certifications: 'Certifications',
  custom: 'Custom sections',
};

const rid = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_RESUME_STYLE = {
  template: 'jake',
  font: 'lato',
  fontSize: 10.5, // pt
  spacing: 'normal', // compact | normal | relaxed
  margins: 'normal', // narrow | normal | wide
  paper: 'letter', // letter | a4
  accent: '#1f4e79',
  icons: true,
  linkStyle: 'label', // label ("View Project") | url
};

export const emptyResumeData = () => ({
  header: { name: '', phone: '', email: '', linkedin: '', github: '', website: '', location: '' },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: [],
  achievements: [],
  certifications: [],
  custom: [],
});

// Demo content (fictional) that shows every part of a template.
export const demoResumeData = () => ({
  header: {
    name: 'Aarav Mehta',
    phone: '+91 98765 43210',
    email: 'aarav.mehta@example.com',
    linkedin: 'linkedin.com/in/aaravmehta',
    github: 'github.com/aaravmehta',
    website: '',
    location: 'Pune, India',
  },
  summary: '',
  education: [
    { school: 'Pune Institute of Technology', degree: 'Bachelor of Technology in Computer Science', start: 'Aug 2023', end: 'Expected May 2027', location: 'Pune, Maharashtra', score: 'CGPA: 8.9/10', details: 'Coursework: Data Structures, Operating Systems, DBMS, Computer Networks' },
  ],
  experience: [
    {
      company: 'Finlytics',
      role: 'Software Engineering Intern',
      tech: 'React, Node.js, Redis, Jest',
      location: 'Remote',
      start: 'May 2026',
      end: 'Jul 2026',
      bullets: 'Built a React dashboard for loan analytics used daily by 40+ internal analysts, replacing 6 manual spreadsheets\nReduced p95 API latency by 35% by introducing Redis caching on the five most-requested endpoints\nWrote 120+ unit and integration tests with Jest, raising coverage from 48% to 81%',
    },
    {
      company: 'Open Source — DevTools Collective',
      role: 'Open Source Contributor',
      tech: 'TypeScript, Node.js, GitHub Actions',
      location: 'Remote',
      start: 'Jan 2026',
      end: 'Apr 2026',
      bullets: 'Merged 14 pull requests fixing performance and accessibility issues in a CLI with 9k+ GitHub stars\nAutomated release notes with GitHub Actions, saving maintainers ~2 hours per release',
    },
  ],
  projects: [
    { name: 'CampusCart', tech: 'Next.js, PostgreSQL, Prisma, Stripe', link: 'https://campuscart.app', linkLabel: 'View Project', date: '2026', bullets: 'Built a campus marketplace for used books and gear with 1,200+ students onboarded in the first semester\nImplemented real-time buyer–seller chat with WebSockets and Stripe-based escrow payments' },
    { name: 'git-standup', tech: 'Node.js, TypeScript', link: 'https://github.com/aaravmehta/git-standup', linkLabel: 'View Project', date: '2025', bullets: 'Published an npm CLI that summarises commits across repositories for daily stand-ups; 3,000+ downloads' },
    { name: 'Exam Planner', tech: 'React, Firebase', link: '', linkLabel: '', date: '2025', bullets: 'Created a spaced-repetition revision planner used by 300+ classmates during end-semester exams' },
  ],
  skills: [
    { group: 'Languages', items: 'Java, Python, JavaScript, TypeScript, C++, SQL' },
    { group: 'Frameworks', items: 'React, Next.js, Node.js, Express, Tailwind CSS' },
    { group: 'Cloud & Databases', items: 'AWS (EC2, S3, Lambda), PostgreSQL, MongoDB, Redis, Firebase' },
    { group: 'Tools', items: 'Git, Docker, Linux, GitHub Actions, Jest, Postman' },
    { group: 'Concepts', items: 'Data Structures, Algorithms, OOP, REST APIs, System Design basics' },
  ],
  achievements: [
    { text: 'Smart India Hackathon 2025 — National Finalist (Top 5 of 400+ teams, EdTech track)', link: '', linkLabel: '' },
    { text: 'Ranked in the top 3% globally in Google Kick Start 2025', link: '', linkLabel: '' },
    { text: 'Lead, College Code Club — organised 12 workshops for 300+ juniors', link: '', linkLabel: '' },
  ],
  certifications: [{ name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2026', link: '' }],
  custom: [],
});

const strip = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');

// Build resume content from the Dev Identity profile (the single source of truth).
export function resumeDataFromProfile(p) {
  const b = p.basics || {};
  const social = (re) => strip((p.socials || []).find((s) => re.test(s.label) || re.test(s.url))?.url);
  return {
    header: { name: b.name || '', phone: b.phone || '', email: b.email || '', linkedin: social(/linkedin/i), github: social(/github/i), website: strip(b.website), location: b.location || '' },
    summary: '',
    education: (p.education || []).map((e) => ({ school: e.school, degree: e.degree, start: e.start, end: e.end, location: '', score: e.score, details: e.details })),
    experience: (p.experience || []).map((e) => ({ company: e.company, role: e.role, tech: e.tech, location: e.location, start: e.start, end: e.end, bullets: e.bullets })),
    projects: (p.projects || []).map((x) => ({ name: x.name, tech: x.tech, link: x.link || x.repo || '', linkLabel: x.link || x.repo ? 'View Project' : '', date: '', bullets: [x.description, x.bullets].filter(Boolean).join('\n') })),
    skills: (p.skills || []).map((s) => ({ group: s.group, items: s.items })),
    achievements: (p.achievements || []).map((a) => ({ text: [a.title, a.detail].filter(Boolean).join(' — '), link: '', linkLabel: '' })),
    certifications: (p.certifications || []).map((c) => ({ ...c })),
    custom: (p.custom || []).map((c) => ({ title: c.title, content: c.content })),
  };
}

export function newResume({ name = 'My Resume', data, style } = {}) {
  return {
    id: rid(),
    name,
    updated: Date.now(),
    style: { ...DEFAULT_RESUME_STYLE, ...(style || {}) },
    order: ['education', 'experience', 'projects', 'skills', 'achievements', 'certifications', 'summary', 'custom'],
    hidden: { summary: true },
    data: data || demoResumeData(),
  };
}

export const lines = (s) =>
  String(s || '')
    .split('\n')
    .map((x) => x.replace(/^\s*[-•*▪●◦]\s*/, '').trim())
    .filter(Boolean);
