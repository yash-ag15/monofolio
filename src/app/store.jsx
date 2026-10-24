import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { THEMES } from '../portfolio/themes.js';
import { track } from '../lib/analytics.js';
import { emptyProfile, sampleProfile } from '../portfolio/sample.js';

export { emptyProfile, sampleProfile };


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
  threeSpeed: 1,
  drag3d: false,
  clickFx: 'none',
  textFill: false,
  scrollSkew: false,
  heroImage: '',
  heroImageMode: 'none',
  heroImageBlur: false,
  colorScheme: 'mono',
  colors: { bg: '#f4f0e8', fg: '#1b1916', accent: '#b4532a' },
  accentUse: 'links',
  sectionOrder: [...SECTION_KEYS],
  hidden: {},
  customCss: '',
  seed: 1,
};

// Everything that makes up the *look* of a portfolio. When switching to a theme, remix or
// inspiration design we reset these first, so two designs never blend into each other.
// (Content-ish settings — section order, hidden sections, brief, custom CSS, uploaded 3D model — are kept.)
export const LOOK_KEYS = [
  'mode', 'paper', 'fontPair', 'scale', 'density', 'radius', 'border', 'heroStyle', 'projectStyle', 'sectionLabel', 'headingCase',
  'texture', 'motion', 'nav', 'mark', 'accent', 'hero3d', 'hero3dPlace', 'cursor', 'tilt', 'magnetic', 'scramble', 'progress', 'grain',
  'preloader', 'entrance', 'revealStyle', 'bgAnim', 'titleAnim', 'linkStyle', 'cardHover', 'parallax', 'counters',
  'heroImage', 'heroImageMode', 'heroImageBlur', 'colorScheme', 'colors', 'accentUse',
  'threeSpeed', 'drag3d', 'clickFx', 'textFill', 'scrollSkew',
];
export const COLOR_KEYS = ['colorScheme', 'colors', 'accent', 'accentUse', 'heroImage', 'heroImageMode', 'heroImageBlur'];

export function withFreshLook(design, patch, keep = []) {
  const fresh = {};
  LOOK_KEYS.forEach((k) => {
    fresh[k] = keep.includes(k) ? design[k] : DEFAULT_DESIGN[k];
  });
  return { ...design, ...fresh, ...patch };
}

// New accounts start empty. The sample person (Mugiwara Luffy) only appears as placeholder text in
// forms and in previews while there is nothing of your own yet — see previewProfile().
const initialState = () => ({
  profile: emptyProfile(),
  design: { ...DEFAULT_DESIGN },
  github: { username: '', autoSync: false, lastSync: 0, user: null, repos: [] },
  tailored: [],
  coverLetters: [],
  // Live code editor: html = your edited copy of the portfolio, active = use it instead of the generated page,
  // fp = fingerprint of the design it was copied from (to warn when the design changes later)
  code: { html: '', active: false, fp: '' },
  resumes: [],
  activeResume: '',
  // GitHub profile README builder: chosen template, options, and the markdown if edited by hand
  readme: { template: 'classic', opts: {}, md: '', edited: false },
  // Dev profile card: design, size and options
  card: { design: 'minimal', size: 'card', opts: {} },
  // things the user has done at least once (for the dashboard journey)
  milestones: {},
  appTheme: 'dark',
});

// The demo person used to be "Aarav Mehta" with made-up profile links. Saved data from that time
// (profile, resumes, letters, AI-built pages…) is switched to the new demo, Mugiwara Luffy, with
// personal links replaced by the plain LinkedIn / GitHub sites. Runs only if the old demo is present.
const OLD_DEMO = [
  [/https?:\/\/(www\.)?linkedin\.com\/in\/aaravmehta\/?/g, 'https://www.linkedin.com'],
  [/linkedin\.com\/in\/aaravmehta/g, 'linkedin.com'],
  [/https?:\/\/(www\.)?github\.com\/aaravmehta(\/[\w.-]+)?\/?/g, 'https://github.com'],
  [/github\.com\/aaravmehta(\/[\w.-]+)?/g, 'github.com'],
  [/https?:\/\/(www\.)?x\.com\/aaravbuilds\/?/g, 'https://x.com'],
  [/https?:\/\/campuscart\.app\/?/g, ''],
  [/https?:\/\/aarav\.dev\/?/g, ''],
  [/aarav\.dev/g, ''],
  [/aarav\.mehta@example\.com/g, 'luffy@example.com'],
  [/AARAV MEHTA/g, 'MUGIWARA LUFFY'],
  [/Aarav Mehta/g, 'Mugiwara Luffy'],
  [/aaravmehta|aaravbuilds/g, ''],
  [/Aarav/g, 'Luffy'],
  [/AARAV/g, 'LUFFY'],
  [/aarav/g, 'luffy'],
];
function migrateDemo(raw) {
  if (!/aarav/i.test(raw)) return raw;
  let out = raw;
  OLD_DEMO.forEach(([re, to]) => (out = out.replace(re, () => to)));
  try {
    const s = JSON.parse(out);
    // the old demo also had an X account — drop that social link entirely
    if (s.profile?.socials) s.profile.socials = s.profile.socials.filter((x) => x.url !== 'https://x.com');
    out = JSON.stringify(s);
  } catch {
    return raw;
  }
  return out;
}

// Turns saved data (from the account, or a backup file) into a complete, current-shape state.
export function hydrate(savedState) {
  try {
    if (!savedState) return initialState();
    // `inspiration` held images for the old Inspire page (now part of the AI composer) — drop it
    // eslint-disable-next-line no-unused-vars
    const { inspiration, ...saved } = JSON.parse(migrateDemo(JSON.stringify(savedState)));
    const base = initialState();
    return {
      ...base,
      ...saved,
      profile: { ...emptyProfile(), ...saved.profile, basics: { ...emptyProfile().basics, ...saved.profile?.basics } },
      design: normalizeDesign(saved.design),
      github: { ...base.github, ...saved.github },
      appTheme: saved.appThemeChosen ? saved.appTheme : 'dark',
      code: { ...base.code, ...saved.code },
      resumes: saved.resumes || [],
      activeResume: saved.activeResume || '',
      readme: { ...base.readme, ...saved.readme },
      card: { ...base.card, ...saved.card },
      milestones: { ...base.milestones, ...saved.milestones },
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

// ---------- design history (undo / redo / reset) ----------
// Kept in memory only (not saved), so it survives moving between pages but not a page reload.
const HISTORY_LIMIT = 60;
const EMPTY_HISTORY = { past: [], future: [], lastKey: null, lastAt: 0, done: '' };
const COALESCE_MS = 900; // typing, dragging a colour picker etc. count as ONE step

const KEY_LABELS = {
  layout: 'Theme', colorScheme: 'Colours', colors: 'Colours', accent: 'Accent', accentUse: 'Accent', mode: 'Light / dark', paper: 'Paper tone',
  fontPair: 'Font', scale: 'Headline size', density: 'Spacing', radius: 'Corners', border: 'Borders', texture: 'Background texture',
  headingCase: 'Heading case', sectionLabel: 'Section labels', heroStyle: 'Hero style', projectStyle: 'Projects display', nav: 'Navigation',
  mark: 'Signature mark', seed: 'Variant', showAvatar: 'Photo', sectionOrder: 'Section order', hidden: 'Hidden sections',
  hero3d: '3D object', hero3dPlace: '3D placement', modelUrl: '3D model', modelData: '3D model', modelMono: '3D model', embedUrl: '3D embed',
  cursor: 'Cursor', tilt: 'Tilt cards', magnetic: 'Magnetic buttons', scramble: 'Name decode', preloader: 'Preloader', progress: 'Scroll progress',
  grain: 'Film grain', motion: 'Motion', entrance: 'Hero entrance', revealStyle: 'Scroll reveal', titleAnim: 'Title animation', bgAnim: 'Background animation',
  linkStyle: 'Link hover', cardHover: 'Card hover', parallax: 'Parallax', counters: 'Counters', heroImage: 'Hero image', heroImageMode: 'Hero image',
  heroImageBlur: 'Hero image blur', threeSpeed: '3D speed', drag3d: 'Drag to rotate', clickFx: 'Click effect', textFill: 'Text fill', scrollSkew: 'Scroll skew', brief: 'Brief text', customCss: 'Custom CSS', liveRepos: 'Live GitHub stars',
};
function labelFor(keys) {
  const names = [...new Set(keys.map((k) => KEY_LABELS[k] || k))];
  return names.length > 2 ? 'Design' : names.join(' & ');
}

function recordDesign(state, next, label, force = false) {
  if (!force && JSON.stringify(next) === JSON.stringify(state.design)) return state; // nothing changed
  const h = state.history || EMPTY_HISTORY;
  const now = Date.now();
  const same = !force && h.lastKey === label && now - h.lastAt < COALESCE_MS && h.past.length;
  return {
    ...state,
    design: next,
    history: {
      past: same ? h.past : [...h.past, { design: state.design, label }].slice(-HISTORY_LIMIT),
      future: [],
      lastKey: label,
      lastAt: now,
      done: '',
    },
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'profile/set':
      return { ...state, profile: action.profile };
    case 'basics/set':
      return { ...state, profile: { ...state.profile, basics: { ...state.profile.basics, ...action.patch } } };
    case 'list/set':
      return { ...state, profile: { ...state.profile, [action.key]: action.items } };
    case 'design/set': {
      const next = normalizeDesign({ ...state.design, ...action.patch });
      return recordDesign(state, next, action.label || labelFor(Object.keys(action.patch)));
    }
    case 'design/replace':
      return recordDesign(state, normalizeDesign(action.design), action.label || 'Design');
    case 'design/undo': {
      const h = state.history || EMPTY_HISTORY;
      if (!h.past.length) return state;
      const prev = h.past[h.past.length - 1];
      return {
        ...state,
        design: prev.design,
        history: { past: h.past.slice(0, -1), future: [{ design: state.design, label: prev.label }, ...h.future].slice(0, HISTORY_LIMIT), lastKey: null, lastAt: 0, done: `Undid: ${prev.label}` },
      };
    }
    case 'design/redo': {
      const h = state.history || EMPTY_HISTORY;
      if (!h.future.length) return state;
      const next = h.future[0];
      return {
        ...state,
        design: next.design,
        history: { past: [...h.past, { design: state.design, label: next.label }].slice(-HISTORY_LIMIT), future: h.future.slice(1), lastKey: null, lastAt: 0, done: `Redid: ${next.label}` },
      };
    }
    case 'design/reset': {
      // 'theme': the CURRENT theme back to its original look (as when it was first picked),
      //          keeping content-like settings (section order, hidden sections, brief, custom CSS, 3D model).
      // 'all':   every design setting back to the defaults.
      const key = THEMES[state.design.layout] ? state.design.layout : 'classic';
      const next = action.scope === 'theme' ? normalizeDesign(withFreshLook(state.design, { layout: key, ...THEMES[key].preset })) : normalizeDesign({ ...DEFAULT_DESIGN });
      return recordDesign(state, next, action.scope === 'theme' ? `Reset ${THEMES[key].name}` : 'Reset everything', true);
    }
    case 'github/set':
      return { ...state, github: { ...state.github, ...action.patch } };
    case 'tailored/set':
      return { ...state, tailored: action.items };
    case 'cover/set':
      return { ...state, coverLetters: action.items };
    case 'theme/toggle':
      return { ...state, appTheme: state.appTheme === 'light' ? 'dark' : 'light', appThemeChosen: true };
    case 'milestone':
      return state.milestones?.[action.key] ? state : { ...state, milestones: { ...(state.milestones || {}), [action.key]: Date.now() } };
    case 'card/set':
      return { ...state, card: { ...(state.card || {}), ...action.patch } };
    case 'readme/set':
      return { ...state, readme: { ...(state.readme || {}), ...action.patch } };
    case 'resumes/set':
      return { ...state, resumes: action.items, activeResume: action.active ?? state.activeResume };
    case 'resume/update':
      return { ...state, resumes: (state.resumes || []).map((r) => (r.id === action.id ? { ...r, ...action.patch, updated: Date.now() } : r)) };
    case 'code/set':
      return { ...state, code: { ...(state.code || {}), ...action.patch } };
    case 'all/replace':
      return { ...initialState(), ...action.state, design: normalizeDesign(action.state.design) };
    case 'all/reset':
      return { ...initialState(), profile: action.empty ? emptyProfile() : sampleProfile() };
    default:
      return state;
  }
}

const StoreContext = createContext(null);

// initial: the signed-in user's saved state; onSave(state) is called (debounced) after every change.
export function StoreProvider({ children, initial, onSave }) {
  const [state, rawDispatch] = useReducer(reducer, initial, hydrate);
  // key moments (resume exported, portfolio downloaded…) also go to analytics — every time, not just the first
  const dispatch = useCallback((action) => {
    if (action.type === 'milestone') track(action.key);
    rawDispatch(action);
  }, []);
  const loaded = useRef(state);

  useEffect(() => {
    if (state === loaded.current) return; // nothing changed since loading
    const t = setTimeout(() => {
      // eslint-disable-next-line no-unused-vars
      const { history, ...persisted } = state; // undo history stays in memory only
      onSave?.(persisted);
    }, 250);
    return () => clearTimeout(t);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.dataset.theme = state.appTheme;
    try {
      localStorage.setItem('monofolio:theme', state.appTheme); // used on the sign-in page
    } catch {
      /* ignore */
    }
  }, [state.appTheme]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

// Is this profile still empty (a brand-new account, or after “Start fresh”)?
export function isBlankProfile(p) {
  const b = p?.basics || {};
  return !b.name && !b.headline && !b.about && !b.email && !['skills', 'projects', 'experience', 'education'].some((k) => (p?.[k] || []).length);
}
// What previews show: your profile, or the sample profile while yours is still empty.
// Downloads and exports always use your own data — see isBlankProfile().
let sampleCache = null;
export const previewProfile = (p) => (isBlankProfile(p) ? (sampleCache ||= sampleProfile()) : p);

export const uid = () => Math.random().toString(36).slice(2, 10);
