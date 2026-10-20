// Portfolio preview with examples: every Dev Identity field the user hasn't filled in yet shows the sample
// person, so each detail they add replaces just its own part of the page. Only for previews — exports,
// the code tab and AI builds use the real profile.
import { sampleProfile } from './sample.js';

const LISTS = ['socials', 'skills', 'experience', 'education', 'projects', 'certifications', 'achievements', 'custom'];

const blank = (v) => !String(v ?? '').trim();

// item → its empty fields taken from `example`
const fill = (item, example) => {
  const out = { ...item };
  for (const [k, v] of Object.entries(example)) if (blank(out[k]) && !blank(v)) out[k] = v;
  return out;
};

let sample = null;

export function profileWithExamples(profile) {
  sample ||= sampleProfile();
  const out = { ...profile, basics: fill(profile.basics || {}, sample.basics) };
  for (const key of LISTS) {
    const mine = profile[key] || [];
    const ex = sample[key] || [];
    // an empty section shows the sample entries; started entries borrow the sample's fields they still lack
    out[key] = (mine.length ? mine : ex.map(() => ({}))).map((item, i) => (ex[i] ? fill(item, ex[i]) : item));
  }
  return out;
}
