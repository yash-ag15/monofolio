import { createContext, useContext, useEffect, useReducer } from 'react';

const STORAGE_KEY = 'monofolio:v1';

export const SECTION_KEYS = [
  'about',
  'skills',
  'projects',
  'experience',
  'education',
  'certifications',
  'achievements',
  'custom',
  'contact',
];

export const SECTION_LABELS = {
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements',
  custom: 'Custom sections',
  contact: 'Contact',
};

export const DEFAULT_DESIGN = {
  brief: '',
  layout: 'classic',
  mode: 'light',
  paper: 'white',
  fontPair: 'inter',
  scale: 'regular',
  density: 'normal',
  radius: 6,
  border: 'hairline',
  heroStyle: 'name-big',
  projectStyle: 'cards',
  sectionLabel: 'plain',
  headingCase: 'normal',
  texture: 'none',
  motion: 'subtle',
  nav: 'top',
  mark: 'none',
  accent: '',
  showAvatar: true,
  liveRepos: true,
  hero3d: 'none',
  hero3dPlace: 'auto',
  modelUrl: '',
  modelData: '',
  modelMono: true,
  embedUrl: '',
  cursor: 'none',
  tilt: false,
  magnetic: false,
  scramble: false,
  progress: false,
  grain: false,
  preloader: false,
  entrance: 'none',
  revealStyle: 'none',
  bgAnim: 'none',
  titleAnim: 'none',
  linkStyle: 'underline',
  cardHover: 'none',
  parallax: false,
  counters: false,
  heroImage: '',
  heroImageMode: 'none',
  colorScheme: 'mono',
  colors: { bg: '#f4f0e8', fg: '#1b1916', accent: '#b4532a' },
  accentUse: 'links',
  sectionOrder: [...SECTION_KEYS],
  hidden: {},
  customCss: '',
  seed: 1,
};

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
    name: 'Aarav Mehta',
    headline: 'Full-Stack Developer · CS Undergrad',
    tagline: 'I build fast, accessible web apps and tinker with developer tooling.',
    location: 'Pune, India',
    email: 'aarav.mehta@example.com',
    phone: '+91 98765 43210',
    website: 'https://aarav.dev',
    avatar: '',
    about:
      'Final-year Computer Science student who enjoys turning messy problems into simple products. I have shipped 6 web apps used by 2,000+ students, led my college coding club, and contributed to open source in the React ecosystem. Currently exploring distributed systems and developer experience.',
    availability: 'Open to SDE internships — Summer 2027',
    resumeUrl: '',
  },
  socials: [
    { label: 'GitHub', url: 'https://github.com/aaravmehta' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/aaravmehta' },
    { label: 'X', url: 'https://x.com/aaravbuilds' },
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
      school: 'Pune Institute of Technology',
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
      link: 'https://campuscart.app',
      repo: 'https://github.com/aaravmehta/campuscart',
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
      repo: 'https://github.com/aaravmehta/git-standup',
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
      repo: 'https://github.com/aaravmehta/exam-planner',
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

const initialState = () => ({
  profile: sampleProfile(),
  design: { ...DEFAULT_DESIGN },
  github: { username: '', autoSync: false, lastSync: 0, user: null, repos: [] },
  tailored: [],
  coverLetters: [],
  inspiration: [],
  appTheme: 'dark',
});

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const saved = JSON.parse(raw);
    const base = initialState();
    return {
      ...base,
      ...saved,
      profile: { ...emptyProfile(), ...saved.profile, basics: { ...emptyProfile().basics, ...saved.profile?.basics } },
      design: normalizeDesign(saved.design),
      github: { ...base.github, ...saved.github },
      appTheme: saved.appThemeChosen ? saved.appTheme : 'dark',
      inspiration: saved.inspiration || [],
    };
  } catch {
    return initialState();
  }
}

export function normalizeDesign(d = {}) {
  const merged = { ...DEFAULT_DESIGN, ...d, hidden: { ...(d.hidden || {}) } };
  const order = (merged.sectionOrder || []).filter((k) => SECTION_KEYS.includes(k));
  SECTION_KEYS.forEach((k) => {
    if (!order.includes(k)) order.push(k);
  });
  merged.sectionOrder = order;
  return merged;
}

function reducer(state, action) {
  switch (action.type) {
    case 'profile/set':
      return { ...state, profile: action.profile };
    case 'basics/set':
      return { ...state, profile: { ...state.profile, basics: { ...state.profile.basics, ...action.patch } } };
    case 'list/set':
      return { ...state, profile: { ...state.profile, [action.key]: action.items } };
    case 'design/set':
      return { ...state, design: normalizeDesign({ ...state.design, ...action.patch }) };
    case 'design/replace':
      return { ...state, design: normalizeDesign(action.design) };
    case 'github/set':
      return { ...state, github: { ...state.github, ...action.patch } };
    case 'tailored/set':
      return { ...state, tailored: action.items };
    case 'cover/set':
      return { ...state, coverLetters: action.items };
    case 'theme/toggle':
      return { ...state, appTheme: state.appTheme === 'light' ? 'dark' : 'light', appThemeChosen: true };
    case 'inspiration/set':
      return { ...state, inspiration: action.items };
    case 'all/replace':
      return { ...initialState(), ...action.state, design: normalizeDesign(action.state.design) };
    case 'all/reset':
      return { ...initialState(), profile: action.empty ? emptyProfile() : sampleProfile() };
    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage full or blocked — app keeps working in memory
      }
    }, 250);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.appTheme;
  }, [state.appTheme]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

export const uid = () => Math.random().toString(36).slice(2, 10);
