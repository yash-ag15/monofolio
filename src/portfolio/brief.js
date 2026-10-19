// Rule-based "design brief" interpreter. No AI/API needed:
// it scans the user's own words for intent and maps them to concrete design tokens,
// returning both the changes and a human-readable explanation of each decision.

import { SECTION_KEYS } from '../store.jsx';
import { FONT_PAIRS, THEMES, hashString, mulberry32 } from './render.js';
import { parseColorText } from '../lib/color.js';

// A keyword only counts when it isn't negated: "no navbar" must not switch the navbar on.
// (Rules that start with "no …" match their whole phrase, so they are unaffected.)
const has = (text, words) =>
  words.some((w) => new RegExp(`(^|[^a-z0-9])(?<!(?:no|without|not|dont|don't|never)\\s+)${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(text));

function firstIndex(text, words) {
  let best = Infinity;
  words.forEach((w) => {
    const i = text.indexOf(w);
    if (i >= 0 && i < best) best = i;
  });
  return best;
}

const theme = (key) => ({ layout: key, ...THEMES[key].preset });

// Order matters: later rules override earlier ones, so broad "vibe" rules come first
// and specific requests (fonts, dark mode, 3D object…) refine them.
const RULES = [
  // ---- themes / art direction ----
  { words: ['terminal', 'hacker', 'cli', 'console', 'shell', 'command line', 'linux', 'typeable'], set: theme('terminal'), theme: 'terminal', why: 'Terminal / hacker vibe → interactive shell visitors can type commands into' },
  { words: ['retro os', 'desktop', 'windows', 'macintosh', 'mac os', 'old computer', 'operating system', 'draggable', '1-bit', 'pixel art', 'nostalgic'], set: theme('os'), theme: 'os', why: 'Retro computer → 1-bit desktop with draggable windows and icons' },
  { words: ['3d', 'three.js', 'threejs', 'webgl', 'immersive', 'spatial', 'futuristic', 'outer space', 'galaxy', 'sci-fi', 'cosmic'], set: theme('spatial'), theme: 'spatial', why: '3D / immersive → full-screen interactive 3D scene with glass panels' },
  { words: ['swiss', 'poster', 'helvetica', 'international style', 'bauhaus', 'grid system', 'typographic'], set: theme('swiss'), theme: 'swiss', why: 'Swiss poster → huge type on a strict 12-column grid' },
  { words: ['kinetic', 'moving text', 'motion type', 'awwwards', 'agency', 'experimental', 'giant text', 'outline text'], set: theme('kinetic'), theme: 'kinetic', why: 'Kinetic type → giant moving name, outlined headings, hover-reveal rows' },
  { words: ['blueprint', 'technical drawing', 'engineering drawing', 'architect', 'schematic', 'cad', 'drafting'], set: theme('blueprint'), theme: 'blueprint', why: 'Blueprint → technical drawing with crop marks, dimensions and spec sheet' },
  { words: ['editorial', 'magazine', 'journal', 'publication'], set: theme('editorial'), theme: 'editorial', why: 'Editorial → masthead, double rules, drop caps, numbered features' },
  { words: ['bento', 'tiles', 'tiled', 'apple', 'widgets', 'blocks'], set: theme('bento'), theme: 'bento', why: 'Bento → modular tiles with live stats and a 3D tile' },
  { words: ['brutal', 'brutalist', 'raw', 'loud', 'punchy', 'aggressive', 'neo-brutalism', 'neobrutalism'], set: theme('brutalist'), theme: 'brutalist', why: 'Brutalist → heavy borders, hard shadows, uppercase, skills marquee' },
  { words: ['sidebar', 'side bar', 'resume-like', 'cv style', 'fixed profile', 'docs style'], set: theme('sidebar'), theme: 'sidebar', why: 'Sidebar → fixed profile rail with scrolling content' },
  { words: ['noir', 'film noir', 'black and white movie'], set: theme('noir'), theme: 'noir', why: 'Noir → dark italic serif drama with film grain' },
  { words: ['zen', 'japanese', 'meditative', 'ultra minimal', 'centered'], set: theme('zen'), theme: 'zen', why: 'Zen → centred, tiny, maximum whitespace' },
  { words: ['readme', 'github readme', 'markdown file'], set: theme('readme'), theme: 'readme', why: 'README.md → portfolio rendered like a GitHub README' },
  { words: ['receipt', 'bill', 'invoice', 'thermal'], set: theme('receipt'), theme: 'receipt', why: 'Receipt → narrow printed thermal receipt' },
  { words: ['a4', 'paper sheet', 'printable', 'resume look'], set: theme('paper'), theme: 'paper', why: 'A4 Paper → a printed sheet on a desk' },
  { words: ['stacked cards', 'sticky cards', 'card stack', 'stacking'], set: theme('stack'), theme: 'stack', why: 'Sticky Stack → sections stack like cards as you scroll' },
  { words: ['timeline', 'chronological', 'journey', 'story'], set: theme('timeline'), theme: 'timeline', why: 'Timeline → a vertical spine with alternating sections' },
  { words: ['archive', 'index page', 'table layout', 'spreadsheet', 'dense list'], set: theme('archive'), theme: 'archive', why: 'Archive Index → everything as a dense index table' },
  { words: ['typewriter', 'old typewriter', 'typed letters'], set: theme('typewriter'), theme: 'typewriter', why: 'Typewriter → inked letters that type themselves out' },
  { words: ['scrapbook', 'polaroid', 'collage', 'handmade', 'taped'], set: theme('scrapbook'), theme: 'scrapbook', why: 'Scrapbook → taped polaroids and tilted cards' },
  { words: ['newspaper', 'broadsheet', 'front page', 'headline news'], set: theme('newspaper'), theme: 'newspaper', why: 'Broadsheet → blackletter masthead and column rules' },
  { words: ['museum', 'exhibition', 'art gallery', 'exhibit'], set: theme('museum'), theme: 'museum', why: 'Museum → projects hung like exhibits with placards' },
  { words: ['vs code', 'vscode', 'ide', 'code editor', 'editor look'], set: theme('ide'), theme: 'ide', why: 'Code Editor → file explorer, tab, gutter and status bar' },
  { words: ['split screen', 'half and half', 'two halves', 'inverted half'], set: theme('splitscreen'), theme: 'splitscreen', why: 'Split Screen → half inverted, half scrolling' },
  { words: ['matrix', 'code rain'], set: theme('matrix'), theme: 'matrix', why: 'Matrix → interactive terminal over falling glyph rain' },
  { words: ['neon', 'cyberpunk', 'crt', 'scanlines'], set: theme('neon'), theme: 'neon', why: 'Neon Noir → glowing type, scanlines, synth terrain' },
  { words: ['aurora', 'northern lights', 'gradient blobs', 'dreamy'], set: theme('aurora'), theme: 'aurora', why: 'Aurora → slow light fields behind frosted glass' },
  { words: ['cosmos', 'universe', 'astronomy', 'planets'], set: theme('cosmos'), theme: 'cosmos', why: 'Cosmos → a turning planet in drifting stars' },
  { words: ['grid lines', 'visible grid', 'column lines'], set: theme('gridlines'), theme: 'gridlines', why: 'Grid Lines → the Swiss grid made visible' },
  { words: ['zine', 'punk', 'diy', 'stickers', 'photocopy'], set: theme('zine'), theme: 'zine', why: 'Zine → halftone, stickers, crooked labels' },
  { words: ['web 1.0', 'geocities', '90s web', 'old internet', 'netscape'], set: theme('geocities'), theme: 'geocities', why: 'Web 1.0 → Times New Roman and bevelled buttons' },
  { words: ['gameboy', 'game boy', 'handheld', 'lcd'], set: theme('handheld'), theme: 'handheld', why: 'Handheld → retro desktop on a grey LCD' },
  { words: ['dashboard', 'analytics', 'console look', 'stats'], set: theme('dashboard'), theme: 'dashboard', why: 'Dashboard → data console with counting stats' },
  { words: ['manifesto', 'statement first', 'big statement'], set: theme('manifesto'), theme: 'manifesto', why: 'Manifesto → your tagline as a giant statement' },
  { words: ['minimal', 'minimalist', 'clean', 'simple', 'calm', 'quiet', 'understated'], set: { border: 'hairline', density: 'airy', texture: 'none', grain: false }, why: 'Minimal / clean → hairlines and generous whitespace' },

  // ---- animation ----
  { words: ['animated', 'animation', 'animations', 'motion', 'dynamic', 'alive'], set: { motion: 'subtle', entrance: 'rise', revealStyle: 'rise', cardHover: 'lift', linkStyle: 'slide' }, why: 'Animated → hero entrance, scroll reveals with stagger, hover lifts' },
  { words: ['smooth', 'buttery', 'fluid motion'], set: { entrance: 'rise', revealStyle: 'rise', cardHover: 'lift', parallax: true }, why: 'Smooth → rising entrance, staggered reveals, parallax hero' },
  { words: ['cinematic', 'dramatic', 'movie'], set: { entrance: 'mask', revealStyle: 'blur', grain: true, preloader: true }, why: 'Cinematic → mask-wipe entrance, blur reveals, grain, preloader' },
  { words: ['letter animation', 'split text', 'letters', 'text animation', 'animated text', 'animated name'], set: { entrance: 'split', titleAnim: 'letters' }, why: 'Text animation → name and titles animate letter by letter' },
  { words: ['typing effect', 'typed', 'typing animation', 'typewriter effect'], set: { entrance: 'typewriter' }, why: 'Your name types itself out' },
  { words: ['stars background', 'starry', 'starfield', 'warp'], set: { bgAnim: 'stars' }, why: 'Animated starfield background' },
  { words: ['matrix background', 'code rain background', 'falling code'], set: { bgAnim: 'matrix' }, why: 'Falling glyph rain background' },
  { words: ['gradient background', 'moving gradient', 'glow background', 'blobs'], set: { bgAnim: 'gradient' }, why: 'Slow moving light blobs in the background' },
  { words: ['moving grid', 'retro grid', 'synthwave grid', 'grid floor'], set: { bgAnim: 'grid' }, why: 'Moving perspective grid floor' },
  { words: ['interactive dots', 'dot background', 'dots background', 'reactive background'], set: { bgAnim: 'dots' }, why: 'Dot grid that reacts to the cursor' },
  { words: ['waves background', 'flowing lines', 'wave lines'], set: { bgAnim: 'waves' }, why: 'Flowing wave lines in the background' },
  { words: ['parallax'], set: { parallax: true }, why: 'Parallax hero on scroll' },
  { words: ['counters', 'counting numbers', 'animated numbers'], set: { counters: true }, why: 'Numbers count up when visible' },
  { words: ['hover lift', 'lift cards', 'floating cards'], set: { cardHover: 'lift' }, why: 'Cards lift on hover' },
  { words: ['zoom images', 'image zoom', 'zoom on hover'], set: { cardHover: 'zoom' }, why: 'Project images zoom on hover' },

  // ---- mood ----
  { words: ['elegant', 'classy', 'luxury', 'refined', 'sophisticated'], set: { fontPair: 'serif', density: 'airy', heroStyle: 'statement' }, why: 'Elegant → refined serif headings and a statement hero' },
  { words: ['playful', 'fun', 'quirky', 'creative', 'artsy', 'expressive'], set: { fontPair: 'syne', mark: 'orbit', motion: 'reveal', cursor: 'invert' }, why: 'Playful → expressive type, generative mark, inverting cursor' },
  { words: ['corporate', 'professional', 'formal', 'serious', 'enterprise', 'recruiter friendly'], set: { fontPair: 'plex', heroStyle: 'split', motion: 'subtle', sectionLabel: 'plain', cursor: 'none', grain: false }, why: 'Professional → engineered IBM Plex type, no gimmicks' },
  { words: ['retro', 'vintage', 'old school', '90s', 'typewriter'], set: { paper: 'warm', texture: 'lines' }, why: 'Retro → warm paper with ruled lines' },
  { words: ['modern', 'sleek', 'startup', 'saas'], set: { fontPair: 'sora', radius: 14, motion: 'reveal' }, why: 'Modern / sleek → geometric type, rounded corners, scroll reveals' },
  { words: ['technical', 'engineer', 'engineering', 'systems', 'backend'], set: { fontPair: 'grotesk', sectionLabel: 'slash' }, why: 'Technical tone → Space Grotesk with // code-comment labels' },
  { words: ['film', 'cinematic', 'analog', 'gritty', 'grain', 'grainy', 'noise', 'texture overlay'], set: { grain: true }, why: 'Cinematic → animated film-grain overlay' },

  // ---- 3D objects ----
  { words: ['particles', 'particle', 'points', 'dust', 'starfield'], set: { hero3d: 'particles' }, why: '3D: breathing particle sphere' },
  { words: ['knot', 'torus', 'wireframe', 'math', 'geometry'], set: { hero3d: 'knot' }, why: '3D: wireframe torus knot (shape unique to your name)' },
  { words: ['shapes', 'polyhedra', 'floating objects', 'geometric shapes', 'cubes'], set: { hero3d: 'shapes' }, why: '3D: floating wireframe solids' },
  { words: ['blob', 'organic', 'liquid', 'fluid', 'morph', 'morphing'], set: { hero3d: 'blob' }, why: '3D: morphing lit blob' },
  { words: ['globe', 'planet', 'earth', 'world', 'global'], set: { hero3d: 'globe' }, why: '3D: dotted globe with orbit arcs' },
  { words: ['terrain', 'wave terrain', 'landscape', 'mountains'], set: { hero3d: 'terrain' }, why: '3D: undulating wave terrain' },
  { words: ['rings', 'gyroscope', 'orbit rings', 'atom'], set: { hero3d: 'rings' }, why: '3D: gyroscope rings' },
  { words: ['spline'], set: { hero3d: 'embed' }, why: '3D: your own Spline scene (paste its URL in 3D & Motion)' },
  { words: ['my model', 'my 3d model', 'glb', 'gltf', 'own 3d'], set: { hero3d: 'model' }, why: '3D: your own model (upload a .glb in 3D & Motion)' },
  { words: ['no 3d', 'without 3d', 'flat design'], set: { hero3d: 'none' }, why: 'No 3D' },
  { words: ['3d background', 'background 3d', 'behind the text'], set: { hero3dPlace: 'background' }, why: '3D placed behind the hero text' },

  // ---- interactions ----
  { words: ['custom cursor', 'cursor'], set: { cursor: 'dot' }, why: 'Custom dot + ring cursor' },
  { words: ['invert cursor', 'blend cursor', 'inverting cursor'], set: { cursor: 'invert' }, why: 'Inverting blend-mode cursor' },
  { words: ['crosshair'], set: { cursor: 'crosshair' }, why: 'Crosshair cursor with live coordinates' },
  { words: ['tilt', '3d cards', 'parallax cards', 'hover effects'], set: { tilt: true }, why: '3D tilt on project cards' },
  { words: ['magnetic', 'magnetic buttons'], set: { magnetic: true }, why: 'Magnetic buttons' },
  { words: ['glitch', 'decode', 'scramble', 'matrix'], set: { scramble: true }, why: 'Name decodes from random glyphs on load' },
  { words: ['preloader', 'loading screen', 'intro', 'loader'], set: { preloader: true }, why: 'Intro preloader with a counter' },
  { words: ['progress bar', 'scroll progress', 'reading progress'], set: { progress: true }, why: 'Scroll progress bar' },
  { words: ['interactive', 'wow', 'impressive', 'stand out', 'unique', 'memorable'], set: { tilt: true, magnetic: true, scramble: true, cursor: 'ring' }, why: 'Make it memorable → tilt, magnetic buttons, name decode, custom cursor' },

  // ---- theme ----
  { words: ['dark', 'night', 'black background', 'dark mode', 'midnight', 'moody'], set: { mode: 'dark' }, why: 'Dark mode' },
  { words: ['light mode', 'light theme', 'white background', 'bright'], set: { mode: 'light' }, why: 'Light mode' },
  { words: ['warm', 'paper', 'cream', 'beige', 'off-white', 'sepia'], set: { paper: 'warm' }, why: 'Warm off-white paper' },
  { words: ['cool', 'cold', 'icy', 'blueish', 'steel'], set: { paper: 'cool' }, why: 'Cool neutral background' },

  // ---- type ----
  { words: ['serif'], set: { fontPair: 'serif' }, why: 'Serif headings' },
  { words: ['bold serif'], set: { fontPair: 'dmserif' }, why: 'Bold display serif' },
  { words: ['mono', 'monospace', 'code font'], set: { fontPair: 'mono' }, why: 'Monospace type' },
  { words: ['geometric'], set: { fontPair: 'sora' }, why: 'Geometric type' },
  { words: ['grotesk', 'grotesque'], set: { fontPair: 'grotesk' }, why: 'Grotesk type' },
  { words: ['wide font', 'wide type', 'extended'], set: { fontPair: 'unbounded' }, why: 'Wide display type' },
  { words: ['pixel font', 'bitmap', '8-bit', '8 bit'], set: { fontPair: 'pixel' }, why: 'Pixel font' },
  { words: ['huge', 'big type', 'large type', 'giant', 'massive', 'oversized', 'big name', 'large name'], set: { scale: 'large' }, why: 'Oversized headline scale' },
  { words: ['small type', 'subtle type', 'compact type', 'modest'], set: { scale: 'compact' }, why: 'Modest headline scale' },
  { words: ['uppercase', 'all caps', 'caps'], set: { headingCase: 'upper' }, why: 'Uppercase headings' },
  { words: ['lowercase', 'all lowercase'], set: { headingCase: 'lower' }, why: 'Lowercase headings' },

  // ---- spacing / shape ----
  { words: ['compact', 'dense', 'tight', 'condensed', 'one page'], set: { density: 'tight' }, why: 'Tighter vertical rhythm' },
  { words: ['spacious', 'airy', 'breathing room', 'whitespace', 'roomy'], set: { density: 'airy' }, why: 'More whitespace between sections' },
  { words: ['rounded', 'soft', 'friendly', 'pill'], set: { radius: 14 }, why: 'Rounded corners' },
  { words: ['sharp', 'square', 'angular', 'no rounded', 'hard edges'], set: { radius: 0 }, why: 'Sharp, square corners' },
  { words: ['borderless', 'no borders', 'no lines'], set: { border: 'none' }, why: 'Borderless surfaces' },
  { words: ['thick borders', 'heavy lines', 'outlined'], set: { border: 'bold' }, why: 'Heavier borders' },
  { words: ['grid background', 'graph paper', 'grid pattern'], set: { texture: 'grid' }, why: 'Graph-paper background' },
  { words: ['dots', 'dotted', 'dot grid', 'dot pattern'], set: { texture: 'dots' }, why: 'Dot-grid background' },
  { words: ['lined', 'notebook', 'ruled'], set: { texture: 'lines' }, why: 'Ruled notebook lines' },
  { words: ['plain background', 'no pattern', 'no texture'], set: { texture: 'none', grain: false }, why: 'Plain background' },

  // ---- motion ----
  { words: ['animated', 'animation', 'animations', 'motion', 'scroll effects', 'dynamic'], set: { motion: 'reveal' }, why: 'Scroll reveal animations' },
  { words: ['subtle animation', 'subtle animations', 'subtle motion', 'light animation', 'minimal animation'], set: { motion: 'subtle' }, why: 'Subtle transitions only' },
  { words: ['no animation', 'no animations', 'static', 'no motion'], set: { motion: 'none', scramble: false, preloader: false, entrance: 'none', revealStyle: 'none', bgAnim: 'none', titleAnim: 'none', parallax: false }, why: 'Motion disabled' },

  // ---- hero / marks ----
  { words: ['statement', 'big quote', 'tagline first', 'manifesto'], set: { heroStyle: 'statement' }, why: 'Statement hero' },
  { words: ['photo', 'picture', 'image of me', 'my face', 'split hero'], set: { heroStyle: 'split', showAvatar: true }, why: 'Photo-forward split hero' },
  { words: ['monogram', 'initials', 'logo'], set: { mark: 'monogram' }, why: 'Monogram mark' },
  { words: ['identicon', 'avatar pattern', 'generative', 'unique mark', 'signature'], set: { mark: 'identicon' }, why: 'Generative signature mark' },

  // ---- projects / labels / nav ----
  { words: ['cards', 'card layout'], set: { projectStyle: 'cards' }, why: 'Projects as cards' },
  { words: ['list', 'simple list'], set: { projectStyle: 'list' }, why: 'Projects as a list' },
  { words: ['gallery', 'grid of projects', 'many projects'], set: { projectStyle: 'grid' }, why: 'Projects as a compact grid' },
  { words: ['numbered', 'numbers', 'index'], set: { projectStyle: 'numbered', sectionLabel: 'numbered' }, why: 'Numbered projects and sections' },
  { words: ['code comments', 'comment style', 'slashes'], set: { sectionLabel: 'slash' }, why: '// section labels' },
  { words: ['brackets'], set: { sectionLabel: 'bracket' }, why: '[ bracketed ] labels' },
  { words: ['markdown', 'hashtags', 'hash headings'], set: { sectionLabel: 'hash' }, why: '# markdown labels' },
  { words: ['floating nav', 'floating menu', 'pill nav', 'bottom nav'], set: { nav: 'floating' }, why: 'Floating pill navigation' },
  { words: ['no nav', 'no navbar', 'no menu', 'single scroll'], set: { nav: 'none' }, why: 'Navigation hidden' },
  { words: ['navbar', 'top nav', 'sticky header', 'menu bar'], set: { nav: 'top' }, why: 'Sticky top navigation' },
];

const SECTION_ALIASES = {
  about: ['about', 'bio', 'intro', 'summary'],
  skills: ['skills', 'stack', 'tech stack', 'technologies', 'tools'],
  projects: ['projects', 'work', 'portfolio', 'builds'],
  experience: ['experience', 'internships', 'internship', 'jobs', 'work history'],
  education: ['education', 'college', 'university', 'degree', 'academics'],
  certifications: ['certifications', 'certificates', 'certs', 'courses'],
  achievements: ['achievements', 'awards', 'hackathons', 'accomplishments'],
  contact: ['contact', 'email', 'reach me'],
};

const COLOR_WORDS = {
  blue: '#2563eb', red: '#dc2626', green: '#16a34a', orange: '#ea580c', purple: '#7c3aed',
  teal: '#0d9488', pink: '#db2777', yellow: '#ca8a04', gold: '#b08d2b', gray: '#6b7280', grey: '#6b7280', lime: '#65a30d',
};

function findSection(fragment) {
  const f = fragment.toLowerCase();
  return Object.keys(SECTION_ALIASES).find((k) => SECTION_ALIASES[k].some((a) => f.includes(a)));
}

export function interpretBrief(brief, current) {
  const text = ` ${String(brief || '').toLowerCase()} `;
  const patch = {};
  const notes = [];
  if (!text.trim()) return { patch, notes };

  // Pick ONE theme: the one mentioned earliest. "3D" next to another theme
  // means "add a 3D object to that theme" rather than switching to Spatial.
  const themeHits = RULES.filter((r) => r.theme && has(text, r.words)).map((r) => ({ r, at: firstIndex(text, r.words) }));
  const others = themeHits.filter((h) => h.r.theme !== 'spatial');
  const chosen = (others.length ? others : themeHits).sort((a, b) => a.at - b.at)[0];
  if (chosen) {
    Object.assign(patch, chosen.r.set);
    notes.push(chosen.r.why);
    if (others.length && themeHits.some((h) => h.r.theme === 'spatial')) {
      patch.hero3d = 'particles';
      notes.push('3D requested → adding an interactive 3D object to this theme');
    }
  }
  RULES.forEach((r) => {
    if (!r.theme && has(text, r.words)) {
      Object.assign(patch, r.set);
      notes.push(r.why);
    }
  });
  // a 3D vibe without a specific object still needs one
  if (patch.layout === 'spatial' && (!patch.hero3d || patch.hero3d === 'none')) patch.hero3d = 'particles';

  // Full colour schemes: "navy and gold theme", "dark green background", "pastel colours", "dracula"…
  const scheme = parseColorText(text, { requireCue: true });
  const hex = text.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/i);
  const named = Object.keys(COLOR_WORDS).find((c) => has(text, [`${c} accent`, `accent of ${c}`, `${c} highlights`, `touch of ${c}`]));
  if (scheme?.mono) {
    patch.colorScheme = 'mono';
    patch.accent = '';
    notes.push('Strict black & white — no colour scheme');
  } else if (scheme) {
    patch.colorScheme = 'custom';
    patch.colors = scheme.colors;
    scheme.notes.forEach((n) => notes.push(`Colours: ${n}`));
  } else if (current.colorScheme === 'custom' && (hex || named)) {
    const a = hex ? hex[0] : COLOR_WORDS[named];
    patch.colors = { ...current.colors, accent: a };
    notes.push(`Accent changed to ${a}`);
  } else if (hex) {
    patch.accent = hex[0];
    notes.push(`Accent ${hex[0]} for links and highlights only — everything else stays monochrome`);
  } else if (named) {
    patch.accent = COLOR_WORDS[named];
    notes.push(`A single ${named} accent for links and highlights — everything else stays monochrome`);
  } else if (has(text, ['monochrome', 'black and white', 'no color', 'no colour', 'grayscale'])) {
    patch.accent = '';
    notes.push('Strict black & white — no accent');
  }

  const order = [...(current.sectionOrder || SECTION_KEYS)];
  const firstRe = /(?:start with|lead with|begin with|show)\s+(?:my\s+)?([a-z ]+?)\s*(?:first|at the top|on top)|([a-z ]+?)\s+(?:first|at the top|on top)/g;
  let m;
  const promoted = [];
  while ((m = firstRe.exec(text))) {
    const key = findSection(m[1] || m[2] || '');
    if (key && !promoted.includes(key)) promoted.push(key);
  }
  const lastRe = /([a-z ]+?)\s+(?:last|at the bottom|at the end)/g;
  const demoted = [];
  while ((m = lastRe.exec(text))) {
    const key = findSection(m[1]);
    if (key && !demoted.includes(key) && !promoted.includes(key)) demoted.push(key);
  }
  if (promoted.length || demoted.length) {
    const rest = order.filter((k) => !promoted.includes(k) && !demoted.includes(k));
    patch.sectionOrder = [...promoted, ...rest, ...demoted];
    if (promoted.length) notes.push(`Section order: ${promoted.join(', ')} moved to the top`);
    if (demoted.length) notes.push(`Section order: ${demoted.join(', ')} moved to the bottom`);
  }

  const hidden = { ...(current.hidden || {}) };
  const hideRe = /(?:hide|no|without|skip|remove|don't show|dont show)\s+(?:my\s+|the\s+)?([a-z]+(?:\s[a-z]+)?)/g;
  const hiddenNow = [];
  while ((m = hideRe.exec(text))) {
    const key = findSection(m[1]);
    if (key && key !== 'contact' && !/^(animation|nav|menu|border|line|pattern|texture|motion|color|colour|hero|3d|rounded)/.test(m[1])) {
      hidden[key] = true;
      hiddenNow.push(key);
    }
  }
  if (hiddenNow.length) {
    patch.hidden = hidden;
    notes.push(`Hidden sections: ${[...new Set(hiddenNow)].join(', ')}`);
  }

  return { patch, notes };
}

// ---------- variations ("Remix") ----------

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

export function generateVariation(base, seed) {
  const rand = mulberry32(seed);
  const layout = pick(rand, Object.keys(THEMES));
  const preset = THEMES[layout].preset;
  const kind = THEMES[layout].base || layout;
  const isSkin = kind !== layout;
  const fontsFor = {
    terminal: ['mono'],
    os: ['pixel', 'mono', 'plex'],
    editorial: ['editorial', 'serif', 'fraunces', 'dmserif'],
    brutalist: ['grotesk', 'syne', 'bricolage', 'unbounded'],
    kinetic: ['unbounded', 'syne', 'tight', 'bricolage'],
    swiss: ['tight', 'inter', 'grotesk'],
    blueprint: ['plex', 'mono', 'grotesk'],
    bento: ['bricolage', 'sora', 'inter', 'grotesk'],
    sidebar: ['plex', 'inter', 'serif', 'fraunces'],
    spatial: ['sora', 'unbounded', 'syne', 'tight'],
    classic: Object.keys(FONT_PAIRS).filter((k) => k !== 'pixel'),
  };
  const scenes3d = ['particles', 'knot', 'shapes', 'blob', 'globe', 'terrain', 'rings'];
  const wants3d = kind === 'spatial' || rand() > 0.55;
  return {
    ...base,
    ...preset,
    layout,
    fontPair: isSkin ? preset.fontPair : pick(rand, fontsFor[kind]),
    mode: isSkin ? preset.mode : kind === 'os' ? 'light' : rand() > 0.5 ? 'dark' : 'light',
    paper: isSkin ? preset.paper : pick(rand, ['white', 'white', 'warm', 'cool']),
    heroStyle: pick(rand, ['name-big', 'statement', 'split', 'minimal']),
    sectionLabel: kind === 'terminal' ? 'prompt' : kind === 'blueprint' ? 'fig' : pick(rand, ['plain', 'numbered', 'slash', 'bracket', 'hash']),
    mark: pick(rand, ['none', 'identicon', 'monogram', 'lines', 'orbit']),
    hero3d: preset.hero3d && preset.hero3d !== 'none' ? preset.hero3d : wants3d && kind !== 'sidebar' ? pick(rand, scenes3d) : 'none',
    entrance: preset.entrance || pick(rand, ['fade', 'rise', 'blur', 'scale', 'mask', 'split', 'typewriter']),
    revealStyle: preset.revealStyle || pick(rand, ['fade', 'rise', 'scale', 'blur', 'slide', 'clip']),
    titleAnim: pick(rand, ['none', 'none', 'letters', 'line', 'scramble']),
    cardHover: preset.cardHover || pick(rand, ['none', 'lift', 'zoom', 'outline', 'invert']),
    linkStyle: pick(rand, ['underline', 'slide', 'highlight', 'arrow']),
    bgAnim: preset.bgAnim || (rand() > 0.75 ? pick(rand, ['stars', 'gradient', 'grid', 'dots', 'waves']) : 'none'),
    parallax: rand() > 0.6,
    hero3dPlace: 'auto',
    cursor: pick(rand, ['none', 'none', 'dot', 'ring', 'invert']),
    tilt: rand() > 0.5,
    magnetic: rand() > 0.6,
    scramble: rand() > 0.5,
    grain: rand() > 0.7,
    seed: Math.floor(rand() * 100000),
  };
}

// How different is this design from the stock default? Higher = more personal.
export function uniquenessScore(design, defaults) {
  const keys = ['layout', 'mode', 'paper', 'fontPair', 'scale', 'density', 'radius', 'border', 'heroStyle', 'projectStyle', 'sectionLabel', 'headingCase', 'texture', 'motion', 'nav', 'mark', 'accent', 'hero3d', 'cursor', 'tilt', 'magnetic', 'scramble', 'grain', 'preloader', 'progress', 'colorScheme', 'accentUse', 'entrance', 'revealStyle', 'bgAnim', 'titleAnim', 'cardHover', 'linkStyle', 'parallax'];
  let changed = keys.filter((k) => String(design[k]) !== String(defaults[k])).length;
  if (design.sectionOrder.join() !== defaults.sectionOrder.join()) changed += 2;
  if (Object.values(design.hidden || {}).some(Boolean)) changed += 1;
  if ((design.customCss || '').trim()) changed += 3;
  if ((design.brief || '').trim().length > 30) changed += 2;
  if (design.hero3d === 'model' || design.hero3d === 'embed') changed += 4;
  const max = keys.length + 6;
  return Math.min(100, Math.round((changed / max) * 100));
}

export const fingerprint = (name, design) =>
  hashString(`${name}|${JSON.stringify({ ...design, brief: '', modelData: '', heroImage: '' })}`).toString(16).toUpperCase().padStart(8, '0');

export const BRIEF_EXAMPLES = [
  'Immersive 3D portfolio with a particle sphere, dark, giant name, custom cursor, film grain',
  'Interactive terminal hacker vibe, projects first, no certifications',
  'Retro OS desktop with draggable windows, pixel font, a 3D gyroscope window',
  'Swiss poster, huge type, numbered sections, a touch of red accent',
  'Kinetic agency style, giant moving text, invert cursor, preloader, scroll progress',
  'Blueprint technical drawing with a wireframe torus knot, crosshair cursor',
  'Elegant editorial magazine on warm paper, serif, spacious, globe figure',
  'Modern bento tiles like Apple, dark mode, morphing blob, tilt cards',
];
