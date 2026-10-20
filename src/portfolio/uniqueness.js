// How personal is a design? A uniqueness score against the default look, and a short fingerprint
// used to notice when the design changes under hand-edited code.

import { hashString } from './render.js';

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
