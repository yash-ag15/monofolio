// Catalogue of fonts, themes (art directions), 3D scenes and interaction effects.

export const FONT_PAIRS = {
  inter: { label: 'Inter — neutral', head: 'Inter', body: 'Inter', families: ['Inter:wght@400;500;600;700;800'] },
  tight: { label: 'Inter Tight — Swiss', head: 'Inter Tight', body: 'Inter', families: ['Inter+Tight:wght@500;600;700;800', 'Inter:wght@400;500;600'] },
  grotesk: { label: 'Space Grotesk — technical', head: 'Space Grotesk', body: 'Inter', families: ['Space+Grotesk:wght@400;500;600;700', 'Inter:wght@400;500;600'] },
  bricolage: { label: 'Bricolage — characterful', head: 'Bricolage Grotesque', body: 'Inter', families: ['Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800', 'Inter:wght@400;500;600'] },
  unbounded: { label: 'Unbounded — wide display', head: 'Unbounded', body: 'Inter', families: ['Unbounded:wght@500;700;800', 'Inter:wght@400;500;600'] },
  syne: { label: 'Syne — expressive', head: 'Syne', body: 'Inter', families: ['Syne:wght@500;700;800', 'Inter:wght@400;500;600'] },
  sora: { label: 'Sora — geometric', head: 'Sora', body: 'Inter', families: ['Sora:wght@400;600;700;800', 'Inter:wght@400;500;600'] },
  serif: { label: 'Instrument Serif — elegant', head: 'Instrument Serif', body: 'Inter', weight: 400, families: ['Instrument+Serif:ital@0;1', 'Inter:wght@400;500;600'] },
  dmserif: { label: 'DM Serif — bold serif', head: 'DM Serif Display', body: 'DM Sans', weight: 400, families: ['DM+Serif+Display:ital@0;1', 'DM+Sans:wght@400;500;600'] },
  editorial: { label: 'Playfair — magazine', head: 'Playfair Display', body: 'Source Serif 4', families: ['Playfair+Display:wght@500;700;800', 'Source+Serif+4:wght@400;600'] },
  fraunces: { label: 'Fraunces — warm serif', head: 'Fraunces', body: 'Inter', families: ['Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800', 'Inter:wght@400;500;600'] },
  plex: { label: 'IBM Plex — engineered', head: 'IBM Plex Sans', body: 'IBM Plex Sans', families: ['IBM+Plex+Sans:wght@400;500;600;700', 'IBM+Plex+Mono:wght@400;500'] },
  mono: { label: 'JetBrains Mono — code', head: 'JetBrains Mono', body: 'JetBrains Mono', families: ['JetBrains+Mono:wght@400;500;700;800'] },
  typewriter: { label: 'Special Elite — typewriter', head: 'Special Elite', body: 'Courier Prime', weight: 400, families: ['Special+Elite', 'Courier+Prime:wght@400;700'] },
  times: { label: 'Times — web 1.0', head: 'Times New Roman', body: 'Times New Roman', families: [] },
  pixel: { label: 'Silkscreen — pixel', head: 'Silkscreen', body: 'IBM Plex Mono', weight: 400, families: ['Silkscreen:wght@400;700', 'IBM+Plex+Mono:wght@400;500;600'] },
};

// Each theme is a different art direction with its own page structure.
import { SKINS } from './skins.js';
import { SKINS_2 } from './skins2.js';

const BASE_THEMES = {
  classic: {
    base: 'classic',
    cat: 'Minimal',
    sig: [0.1, 0.5, 0.2, 0.4],
    name: 'Minimal',
    desc: 'Quiet single column with a details grid. Lets the work speak.',
    preset: { fontPair: 'inter', mode: 'light', paper: 'white', heroStyle: 'name-big', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'normal', texture: 'none', radius: 6, border: 'hairline', scale: 'regular', density: 'normal', hero3d: 'none', cursor: 'none', tilt: false, grain: false, scramble: false, nav: 'top' },
  },
  spatial: {
    base: 'spatial',
    cat: '3D',
    sig: [0.95, 0.6, 0.4, 0.3],
    name: 'Spatial 3D',
    desc: 'Full-screen interactive 3D scene with glass panels floating over it.',
    preset: { fontPair: 'sora', mode: 'dark', paper: 'white', projectStyle: 'cards', sectionLabel: 'numbered', headingCase: 'normal', texture: 'none', radius: 14, border: 'hairline', scale: 'large', density: 'normal', hero3d: 'particles', cursor: 'ring', tilt: true, grain: true, scramble: true, nav: 'floating', motion: 'reveal' },
  },
  terminal: {
    base: 'terminal',
    cat: 'Technical',
    sig: [0.95, 0.5, 0.4, 0.3],
    name: 'Interactive Terminal',
    desc: 'A real shell visitors can type into — help, projects, skills, contact.',
    preset: { fontPair: 'mono', mode: 'dark', paper: 'white', projectStyle: 'list', sectionLabel: 'prompt', headingCase: 'normal', texture: 'none', radius: 8, border: 'hairline', scale: 'regular', density: 'normal', hero3d: 'none', cursor: 'none', tilt: false, grain: false, scramble: false, nav: 'none' },
  },
  os: {
    base: 'os',
    cat: 'Retro',
    sig: [0.1, 0.8, 0.7, 0.4],
    name: 'Retro Desktop',
    desc: '1-bit desktop OS with draggable windows, icons and a menu bar clock.',
    preset: { fontPair: 'pixel', mode: 'light', paper: 'white', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', texture: 'none', radius: 0, border: 'bold', scale: 'compact', density: 'tight', hero3d: 'none', cursor: 'none', tilt: false, grain: false, scramble: false, nav: 'none' },
  },
  swiss: {
    base: 'swiss',
    cat: 'Bold',
    sig: [0.05, 0.95, 0.3, 0.4],
    name: 'Swiss Poster',
    desc: 'International typographic style: huge type, strict 12-column grid.',
    preset: { fontPair: 'tight', mode: 'light', paper: 'white', projectStyle: 'numbered', sectionLabel: 'numbered', headingCase: 'normal', texture: 'none', radius: 0, border: 'bold', scale: 'large', density: 'normal', hero3d: 'none', cursor: 'dot', tilt: false, grain: false, scramble: false, nav: 'none' },
  },
  kinetic: {
    base: 'kinetic',
    cat: 'Bold',
    sig: [0.9, 0.9, 0.4, 0.3],
    name: 'Kinetic Type',
    desc: 'Giant moving type, outlined headings and hover-reveal project rows.',
    preset: { fontPair: 'unbounded', mode: 'dark', paper: 'white', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'upper', texture: 'none', radius: 0, border: 'hairline', scale: 'large', density: 'normal', hero3d: 'none', cursor: 'invert', tilt: false, grain: true, scramble: true, progress: true, nav: 'none', motion: 'reveal' },
  },
  editorial: {
    base: 'editorial',
    cat: 'Editorial',
    sig: [0.1, 0.6, 0.5, 0.7],
    name: 'Magazine',
    desc: 'Masthead, double rules, drop caps and numbered features.',
    preset: { fontPair: 'editorial', mode: 'light', paper: 'warm', projectStyle: 'numbered', sectionLabel: 'numbered', headingCase: 'normal', texture: 'none', radius: 0, border: 'hairline', scale: 'large', density: 'airy', hero3d: 'none', cursor: 'none', tilt: false, grain: true, scramble: false, nav: 'top' },
  },
  blueprint: {
    base: 'blueprint',
    cat: 'Technical',
    sig: [0.9, 0.5, 0.6, 0.15],
    name: 'Blueprint',
    desc: 'Technical drawing: crop marks, dimensions, spec sheets and figures.',
    preset: { fontPair: 'plex', mode: 'dark', paper: 'cool', projectStyle: 'grid', sectionLabel: 'fig', headingCase: 'upper', texture: 'grid', radius: 0, border: 'hairline', scale: 'regular', density: 'normal', hero3d: 'knot', cursor: 'crosshair', tilt: false, grain: false, scramble: true, nav: 'top' },
  },
  bento: {
    base: 'bento',
    cat: '3D',
    sig: [0.85, 0.5, 0.6, 0.35],
    name: 'Bento',
    desc: 'Modular tiles with live stats, a local clock and a 3D tile.',
    preset: { fontPair: 'bricolage', mode: 'dark', paper: 'white', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'normal', texture: 'none', radius: 14, border: 'hairline', scale: 'regular', density: 'normal', hero3d: 'blob', cursor: 'none', tilt: true, grain: false, scramble: false, nav: 'top' },
  },
  brutalist: {
    base: 'brutalist',
    cat: 'Bold',
    sig: [0.05, 0.95, 0.6, 0.4],
    name: 'Brutalist',
    desc: 'Heavy borders, hard shadows, uppercase and a skills marquee.',
    preset: { fontPair: 'grotesk', mode: 'light', paper: 'white', heroStyle: 'name-big', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'upper', texture: 'none', radius: 0, border: 'bold', scale: 'large', density: 'normal', hero3d: 'none', cursor: 'invert', tilt: false, grain: false, scramble: false, nav: 'top' },
  },
  sidebar: {
    base: 'sidebar',
    cat: 'Minimal',
    sig: [0.05, 0.4, 0.3, 0.4],
    name: 'Sidebar',
    desc: 'Fixed profile rail with scrolling content. Résumé-like and calm.',
    preset: { fontPair: 'plex', mode: 'light', paper: 'white', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', texture: 'none', radius: 6, border: 'hairline', scale: 'regular', density: 'normal', hero3d: 'none', cursor: 'none', tilt: false, grain: false, scramble: false, nav: 'none' },
  },
};

export const THEMES = { ...BASE_THEMES, ...SKINS, ...SKINS_2 };

export const THEME_CATEGORIES = ['All', 'Minimal', 'Modern', 'Bold', '3D', 'Technical', 'Retro', 'Editorial', 'Playful'];

export const LAYOUTS = Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, `${t.name} — ${t.desc}`]));

export const SCENES = {
  none: { name: 'None', desc: 'No 3D' },
  particles: { name: 'Particle sphere', desc: 'Breathing cloud of points' },
  knot: { name: 'Torus knot', desc: 'Wireframe knot, unique p/q per name' },
  shapes: { name: 'Floating solids', desc: 'Wireframe polyhedra drifting' },
  blob: { name: 'Morphing blob', desc: 'Lit, faceted organic form' },
  globe: { name: 'Dot globe', desc: 'Dotted planet with orbit arcs' },
  terrain: { name: 'Wave terrain', desc: 'Undulating wireframe landscape' },
  rings: { name: 'Gyroscope', desc: 'Nested rings spinning on axes' },
  name3d: { name: '3D Name', desc: 'Your name as real 3D lettering' },
  tunnel: { name: 'Tunnel', desc: 'Fly through rings of light' },
  helix: { name: 'DNA Helix', desc: 'A turning double helix' },
  voxels: { name: 'Voxel City', desc: 'Cubes rising like an equaliser' },
  ribbon: { name: 'Silk Ribbons', desc: 'Flowing waves of lines' },
  plexus: { name: 'Network', desc: 'Nodes linking up as they drift' },
  galaxy: { name: 'Spiral Galaxy', desc: 'Thousands of stars in arms' },
  mobius: { name: 'Möbius Strip', desc: 'A one-sided wireframe loop' },
  model: { name: 'Your 3D model', desc: 'Upload a .glb / paste a URL' },
  embed: { name: 'Spline / embed', desc: 'Any Spline or Sketchfab scene' },
};

export const CURSORS = {
  none: 'System',
  dot: 'Dot + trailing ring',
  ring: 'Soft ring',
  invert: 'Inverting blob',
  crosshair: 'Crosshair + coords',
  trail: 'Comet trail',
  spotlight: 'Spotlight',
};
