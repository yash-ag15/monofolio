// Profile shapes: a new account's empty profile, and the sample person shown in previews and placeholders.
import { DEMO_AVATAR } from './demo-avatar.js';

export const emptyProfile = () => ({
  basics: {
    name: '',
    headline: '',
    tagline: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    avatar: '',
    about: '',
    availability: '',
    resumeUrl: '',
  },
  socials: [],
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  achievements: [],
  custom: [],
});

export const sampleProfile = () => ({
  basics: {
    name: 'Mugiwara Luffy',
    headline: 'Full-Stack Developer · CS Undergrad',
    tagline: 'I build fast, accessible web apps and tinker with developer tooling.',
    location: 'Indore, India',
    email: 'luffy@example.com',
    phone: '+91 98765 43210',
    website: '',
    avatar: DEMO_AVATAR,
    about:
      'Final-year Computer Science student who enjoys turning messy problems into simple products. I have shipped 6 web apps used by 2,000+ students, led my college coding club, and contributed to open source in the React ecosystem. Currently exploring distributed systems and developer experience.',
    availability: 'Open to SDE internships — Summer 2027',
    resumeUrl: '',
  },
  socials: [
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com' },
  ],
  skills: [
    { group: 'Languages', items: 'JavaScript, TypeScript, Python, Java, SQL' },
    { group: 'Frontend', items: 'React, Next.js, Tailwind CSS, HTML, CSS' },
    { group: 'Backend', items: 'Node.js, Express, PostgreSQL, MongoDB, Redis' },
    { group: 'Tools', items: 'Git, Docker, Linux, AWS, GitHub Actions' },
  ],
  experience: [
    {
      role: 'Software Engineering Intern',
      company: 'Finlytics',
      location: 'Remote',
      start: 'May 2026',
      end: 'Jul 2026',
      bullets:
        'Built a React dashboard for loan analytics used by 40+ internal analysts\nReduced API response time by 35% by adding Redis caching to hot endpoints\nWrote 120+ unit tests with Jest, raising coverage from 48% to 81%',
      tech: 'React, Node.js, Redis, Jest',
    },
  ],
  education: [
    {
      school: 'Indore Institute of Technology',
      degree: 'B.Tech in Computer Science',
      start: '2023',
      end: '2027',
      score: 'CGPA 8.9 / 10',
      details: 'Coursework: Data Structures, Operating Systems, DBMS, Computer Networks',
    },
  ],
  projects: [
    {
      name: 'CampusCart',
      description: 'A marketplace for students to buy and sell used books and gear inside campus.',
      tech: 'Next.js, PostgreSQL, Prisma, Stripe',
      link: '',
      repo: '',
      stars: 48,
      highlight: true,
      bullets: 'Onboarded 1,200 students in the first semester\nImplemented real-time chat with WebSockets',
      source: 'manual',
    },
    {
      name: 'git-standup',
      description: 'CLI that summarises your commits across repos for daily standups.',
      tech: 'Node.js, TypeScript',
      link: '',
      repo: '',
      stars: 112,
      highlight: true,
      bullets: 'Published to npm with 3k+ downloads',
      source: 'manual',
    },
    {
      name: 'Exam Planner',
      description: 'Smart revision planner that schedules topics using spaced repetition.',
      tech: 'React, Firebase',
      link: '',
      repo: '',
      stars: 9,
      highlight: false,
      bullets: '',
      source: 'manual',
    },
  ],
  certifications: [
    { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2026', link: '' },
  ],
  achievements: [
    { title: 'Smart India Hackathon — Finalist', detail: 'Top 5 out of 400+ teams in the EdTech track' },
    { title: 'Lead, Code Club', detail: 'Organised 12 workshops for 300+ juniors' },
  ],
  custom: [],
});
