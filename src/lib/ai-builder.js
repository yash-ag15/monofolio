// Background AI portfolio builder. From a prompt and/or an inspiration image, the AI writes a
// complete portfolio as one HTML file. The code streams into the Code tab and the live preview,
// and the build keeps running while the user moves between tools.

import { grokJSON, grokStream, imageForGrok } from './grok.js';
import { describeTraits } from './inspire.js';

const SYSTEM = `You are an award-winning creative front-end developer. You write ONE complete, polished personal portfolio website as a single self-contained HTML file for a college student or early-career professional.

OUTPUT: only the HTML document, starting with <!doctype html> and ending with </html>. No markdown fences, no explanations before or after.

CONTENT
- Use ONLY the person's real content given to you (name, headline, about, experience, projects, skills, education, achievements, links). Never invent projects, employers, numbers, statistics, testimonials or links. Leave out sections that have no content. Do not add stats/counter sections unless the numbers appear in the content.
- From an inspiration image take the VISUAL STYLE only (layout, colours, type, shapes, spacing, mood). Never copy its text, labels, menu items, section names or numbers — headings and navigation come from the person's own sections.
- Write the person's name exactly as given. Links must use the URLs given.
- Profile photo: if the person has one, use <img src="{{PHOTO}}" alt="…">. If an inspiration image should appear on the page (e.g. as a hero background), use "{{INSPIRATION}}" as its URL. No other images — use CSS, gradients and inline SVG.

DESIGN
- Match the user's request and/or the inspiration image closely: layout structure, colour palette (exact hex values when visible), typography character, spacing, mood, motion. It must feel distinctive and intentional, not a generic template.
- Include: a nav, a hero (name + headline), about, projects (title, description, tech, links), experience, skills, education, and contact/footer — in a sensible order for the person.
- Responsive from 360px to wide screens with no horizontal scroll. Accessible: semantic landmarks, alt text, visible focus styles, sufficient contrast, and respect prefers-reduced-motion.

QUALITY BAR (check every item before you finish)
- Layout: a centred max-width container (about 1100–1240px) with consistent horizontal padding; a clear vertical rhythm (section spacing 96–140px on desktop, less on mobile).
- Typography: a deliberate scale (huge hero name using clamp(), distinct section headings, comfortable 16–18px body, line-height 1.5–1.7); pair fonts on purpose.
- Navigation: if it is fixed or sticky it MUST have its own background (solid or blurred, with a bottom border) so it never overlaps content; on phones the links must wrap onto more lines or sit in a simple menu — never run off-screen. Nav items are the person's own sections (About, Projects, Experience…).
- Sidebar layouts: the main content is offset by the sidebar's width and never sits under it; below 860px the sidebar becomes a normal top bar (static or sticky) at 100% width.
- Mobile: nothing may be wider than the screen at 360px — use max-width:100%, flexible grids (minmax(0,1fr)), and wrap long words/URLs.
- Readability: text must never sit on top of busy 3D, images or animation without a scrim — place 3D/visuals beside the text, or dim/blur them behind it.
- Interactions: visible hover and focus states on links, buttons and cards; smooth scroll; subtle scroll-reveal animations.
- Faithfulness: when the request names a pattern, build it for real — e.g. “bento” = a CSS grid of tiles with different spans; “timeline” = a vertical line with dated nodes; “terminal” = a real console look.
- Projects get the most visual weight: titles, one-line descriptions, tech tags and real links.
- Finish with a proper contact section and footer.

CODE
- All CSS in one <style> in the head; all JavaScript in <script> tags at the end of <body>. Comment the start of each section briefly.
- External resources allowed ONLY: Google Fonts, three.js and GSAP, loaded EXACTLY like this:
  three.js (3D), inside <script type="module">:  import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
  GSAP, as classic tags (NOT imports): <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script> and <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>, then use the globals gsap and ScrollTrigger (call gsap.registerPlugin(ScrollTrigger)). Never \`import\` GSAP.
  Nothing else — no trackers, no analytics, no forms that post anywhere.
- Content must stay visible if a script fails: don't hide elements in CSS for JavaScript to reveal — set initial hidden states from JavaScript.
- Keep it efficient: aim for well under 900 lines.`;

// Edits return only the changed parts (search/replace blocks), not the whole page: several times
// fewer tokens, much faster, and it fits within small per-minute token limits.
const EDIT_SYSTEM = `You are an expert front-end developer editing a person's single-file HTML portfolio.
You receive the CURRENT HTML and a change request. Make the change well — polished, responsive and accessible — and keep everything else exactly as it is.

Reply ONLY with one or more edit blocks in this exact format, nothing else:
<<<<<<< SEARCH
(exact lines copied from the current HTML — enough to be unique)
=======
(the new lines that replace them)
>>>>>>> REPLACE

Rules:
- SEARCH text must match the current HTML exactly, character for character. Keep SEARCH parts short but unique.
- To add something, SEARCH for a nearby line and include it again in REPLACE with the addition.
- Use several small blocks rather than one huge block. Never return the whole document.
- Keep the person's real content; never invent projects, employers, numbers or links. Tokens like {{IMG_1}} stand for images — leave them as they are.
- Libraries: GSAP only via classic <script src> tags (use the globals gsap / ScrollTrigger); three.js only via import from https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js inside <script type="module">. No other external scripts.`;

const BLOCK = /<{5,9} ?SEARCH\s*\n([\s\S]*?)\n?={5,9}\s*\n([\s\S]*?)\n?>{5,9} ?REPLACE/g;
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Apply search/replace blocks; exact match first, then whitespace-tolerant.
export function applyEdits(html, text) {
  let out = html;
  let applied = 0;
  let failed = 0;
  for (const m of String(text).matchAll(BLOCK)) {
    const [, search, replace] = m;
    if (!search.trim()) {
      failed++;
      continue;
    }
    const i = out.indexOf(search);
    if (i >= 0) {
      out = out.slice(0, i) + replace + out.slice(i + search.length);
      applied++;
      continue;
    }
    const loose = new RegExp(
      search
        .trim()
        .split(/\s+/)
        .map(escRe)
        .join('\\s+')
    );
    const lm = out.match(loose);
    if (lm) {
      out = out.slice(0, lm.index) + replace.trim() + out.slice(lm.index + lm[0].length);
      applied++;
    } else failed++;
  }
  return { html: out, applied, failed };
}

// the person's content for the AI (no photos or other data URLs — those are swapped in afterwards)
function portfolioContent(profile) {
  const strip = (v) => (typeof v === 'string' && v.startsWith('data:') ? '' : v);
  const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => strip(v)));
  const b = profile.basics || {};
  return clean({
    name: b.name,
    headline: b.headline,
    tagline: b.tagline,
    about: b.about,
    location: b.location,
    email: b.email,
    website: b.website,
    availability: b.availability,
    resumeUrl: b.resumeUrl,
    hasPhoto: !!b.avatar,
    socials: profile.socials,
    skills: profile.skills,
    experience: profile.experience,
    projects: profile.projects,
    education: profile.education,
    achievements: profile.achievements,
    certifications: profile.certifications,
    custom: profile.custom,
  });
}

// Fix the most common library mistake: GSAP imported as an ES module (it ships as a classic script).
const GSAP_IMPORT = /^[ \t]*import\s[^;\n]*?from\s+['"]https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[^'"]+['"];?[ \t]*$/gm;
const GSAP_TAGS = '<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>\n';
// A tiny safety net added to every AI page: no sideways scrolling on phones, media never wider than the screen.
const SAFETY_CSS = '<style id="mf-safety">html,body{max-width:100%;overflow-x:clip}img,video{max-width:100%;height:auto}@media (max-width:860px){nav{max-width:100%!important}nav,nav>div,nav ul{flex-wrap:wrap}}</style>\n';
export function fixLibraries(html, { safety = true } = {}) {
  let out = html;
  if (safety && !out.includes('id="mf-safety"')) out = /<\/head>/i.test(out) ? out.replace(/<\/head>/i, `${SAFETY_CSS}</head>`) : out;
  if (!out.match(GSAP_IMPORT)) return out;
  out = out.replace(GSAP_IMPORT, '');
  if (!/<script[^>]+src=["'][^"']*gsap@[^"']*\/gsap\.min\.js["']/i.test(out)) out = /<\/head>/i.test(out) ? out.replace(/<\/head>/i, `${GSAP_TAGS}</head>`) : GSAP_TAGS + out;
  else if (!/<script[^>]+src=["'][^"']*ScrollTrigger\.min\.js["']/i.test(out)) out = out.replace(/(<script[^>]+src=["'][^"']*gsap\.min\.js["'][^>]*><\/script>)/i, `$1\n${GSAP_TAGS.split('\n')[1]}`);
  return out;
}

// Strip anything before <!doctype/<html and any markdown fence after </html>.
function cleanHtml(text, final = false, safety = true) {
  let t = String(text || '');
  const start = t.search(/<!doctype html|<html[\s>]/i);
  if (start > 0) t = t.slice(start);
  else if (start < 0) t = t.replace(/^\s*```(?:html)?\s*/i, '');
  if (final) {
    const end = t.toLowerCase().lastIndexOf('</html>');
    if (end >= 0) t = t.slice(0, end + 7);
    t = fixLibraries(t.replace(/```\s*$/, '').trim(), { safety }) + '\n';
  }
  return t;
}
// (replacements are passed as functions: a plain string would treat $& $' $` in minified scripts as special patterns)
const fillPlaceholders = (html, profile, image, blobs = {}) => {
  let out = html.replaceAll('{{PHOTO}}', () => profile.basics?.avatar || '').replaceAll('{{INSPIRATION}}', () => (image && image.startsWith('data:') ? image : ''));
  Object.entries(blobs).forEach(([k, v]) => (out = out.replaceAll(k, () => v)));
  return out;
};
// For edits: swap embedded images (long data: URLs) for short tokens so they aren't sent to the AI.
// With `assets` (editing a built-in theme) the theme's own <style> and <script> blocks are hidden
// too — they are large and the AI doesn't need them; style changes go into an overrides sheet instead.
export const AI_STYLE_MARK = '/* AI changes — added on top of the theme */';
function packBlobs(html, { assets = false } = {}) {
  const blobs = {};
  let n = 0;
  const hide = (prefix) => (m) => {
    const k = `<!--MF_${prefix}_${++n}-->`;
    blobs[k] = m;
    return k;
  };
  let packed = html;
  if (assets) {
    if (!packed.includes(AI_STYLE_MARK)) packed = packed.replace(/<\/head>/i, `<style id="ai-overrides">\n${AI_STYLE_MARK}\n</style>\n</head>`);
    packed = packed.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, hide('SCRIPT'));
    packed = packed.replace(/<style\b(?![^>]*id="ai-overrides")[^>]*>[\s\S]*?<\/style>/gi, hide('STYLE'));
  }
  packed = packed.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[a-z0-9+/=]{200,}/gi, (m) => {
    const k = `{{IMG_${++n}}}`;
    blobs[k] = m;
    return k;
  });
  return { packed, blobs };
}

// The theme's design tokens (CSS custom properties), so the AI's overrides can use and change them.
function themeTokens(html) {
  const roots = [...html.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1].trim()).join(';');
  const body = (html.match(/<body[^>]*class="([^"]*)"/i) || [])[1] || '';
  return `CSS variables: ${roots.slice(0, 1500)}\nBody classes: ${body}`;
}

// Step 1 for images: a vision model studies the image and writes a precise design spec;
// step 2: the code model builds the page from that spec (better code than a small vision model writes).
const VISION_SYSTEM = `You are a senior visual designer. Study the attached image (a website, app screen, poster, moodboard or photo) and describe its design so a developer can recreate its look for a personal portfolio website.
Respond with ONE JSON object:
{
  "kind": "website | app screen | poster | photo | moodboard | other",
  "layout": "structure in detail: columns, grid, sidebar, hero composition, card shapes, spacing, alignment",
  "palette": { "background": "#hex", "surface": "#hex", "text": "#hex", "muted": "#hex", "accent": "#hex", "others": ["#hex"] },
  "typography": "font character (serif/sans/mono/display), weights, sizes, letter-spacing, case — and closest Google Fonts",
  "shapes": "corners, borders, shadows, dividers, textures, gradients, glass/noise etc.",
  "imagery": "illustrations, icons, 3D, photos and how they are used",
  "mood": "3-6 words",
  "motion": "animations that would suit it",
  "signature": "the 2-3 most distinctive details that make this design recognisable"
}
Be concrete and use exact hex colours as seen in the image. Describe the visual style only. NEVER write any word, label, menu item, heading or number that appears in the image — refer to them generically ("three nav items", "small uppercase label", "large two-word heading").`;

async function describeImage(img, prompt, traits, signal) {
  const user = [
    prompt ? `The user wants this from the image: “${prompt}”. Focus on that.` : 'Describe the whole design.',
    traits ? `Colours we measured: background ${traits.bgColor}, text ${traits.fgColor}, accent ${traits.accentColor}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return grokJSON({ system: VISION_SYSTEM, user, images: [img], temperature: 0.2, maxTokens: 900, signal }); // a short spec; small budgets fit free-plan limits
}

// ---------- shared build state (one build at a time) ----------
let state = { status: 'idle', phase: '', live: '', progress: '', error: '', note: '', kind: '', prompt: '', previous: '', previousMeta: null, startedAt: 0 };
let ctrl = null;
const subs = new Set();
const emit = (patch) => {
  state = { ...state, ...patch };
  subs.forEach((fn) => fn(state));
};
export const getBuild = () => state;
export const subscribeBuild = (fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};
export const cancelBuild = () => {
  ctrl?.abort();
  ctrl = null;
  if (state.status === 'running') emit({ status: 'idle', note: 'Stopped — the code written so far is kept.' });
};
export const MAX_EDIT_CHARS = 90000; // larger pages are too big to send back for an edit

/**
 * Start a background build.
 * @param {object} o
 * @param {Function} o.dispatch   store dispatch
 * @param {object} o.profile
 * @param {string} [o.prompt]     what the user typed
 * @param {string} [o.image]      inspiration image (data URL)
 * @param {object} [o.traits]     our own colour/layout reading of the image
 * @param {string} [o.currentHtml] for edits: the code to change
 * @param {string} [o.previousHtml] code to restore if the user doesn't like the result
 */
export async function startBuild({ dispatch, profile, prompt = '', image, traits, currentHtml, previousHtml = '', previousMeta = null, theme = '', patches = [] }) {
  ctrl?.abort();
  const c = new AbortController();
  ctrl = c;
  const edit = !!currentHtml;
  const kind = edit ? 'edit' : image ? 'image' : 'prompt';
  emit({ status: 'running', phase: 'writing', live: '', progress: '', error: '', note: '', kind, prompt, previous: previousHtml, previousMeta, startedAt: Date.now() });

  const { packed, blobs } = edit ? packBlobs(currentHtml, { assets: !!theme }) : { packed: '', blobs: {} };
  if (packed.length > MAX_EDIT_CHARS) {
    emit({ status: 'error', error: 'This page is too large for the AI to edit in one go. Generate a new portfolio from a prompt instead, or make this change by hand in the code.' });
    return;
  }
  let user = edit
    ? theme
      ? `CHANGE REQUEST: ${prompt}

This page uses the built-in “${theme}” theme. Its stylesheet and scripts are hidden behind tokens like <!--MF_STYLE_1--> and <!--MF_SCRIPT_2--> — never edit or remove those tokens.
- To change the LOOK (colours, fonts, spacing, sizes, borders, shadows, animations): add CSS inside <style id="ai-overrides"> — SEARCH for its comment line "${AI_STYLE_MARK}" and REPLACE it with the same line followed by your rules. Make rules specific enough to win over the theme (start selectors with "body" or use the classes in the page) and add !important where needed. Prefer changing the theme's CSS variables in a "body { --var: value }" rule.
- To change CONTENT or STRUCTURE (add a section, reorder, rewrite text, add a timeline…): edit the markup with normal blocks.
- Extra behaviour may go in a new <script> placed right before </body>.
${themeTokens(currentHtml)}

CURRENT HTML (tokens like {{IMG_1}} stand for embedded images — keep them exactly as they are):
${packed}`
      : `CHANGE REQUEST: ${prompt}\n\nCURRENT HTML (tokens like {{IMG_1}} stand for embedded images — keep them exactly as they are):\n${packed}`
    : [
        image ? `Build my portfolio inspired by an image the user uploaded.${prompt ? ` What I want from it: “${prompt}”.` : ' Capture its layout, colours, typography and mood.'}` : `Build my portfolio. What I want: “${prompt}”.`,
        traits ? `Colours measured from the image: background ${traits.bgColor}, text ${traits.fgColor}, accent ${traits.accentColor}${traits.panelColor ? `, cards ${traits.panelColor}` : ''}. ${describeTraits(traits).join(' ')}` : '',
        `MY CONTENT (JSON):\n${JSON.stringify(portfolioContent(profile))}`,
      ]
        .filter(Boolean)
        .join('\n\n');

  // push code to the store (→ live preview) at most every ~2.5s so the preview doesn't flicker
  let lastPush = 0;
  // meta: how this code relates to the theme — 'theme' (theme + replayable AI edits) or 'ai' (AI-written page)
  let meta = edit ? {} : { base: 'ai', patches: [], syncFailed: 0 };
  const push = (html, force) => {
    const now = Date.now();
    if (!force && now - lastPush < 2500) return;
    lastPush = now;
    // mid-stream: drop a <script> that is still being written, so the preview never runs half a script
    if (!force) {
      const lower = html.toLowerCase();
      const open = lower.lastIndexOf('<script');
      if (open > lower.lastIndexOf('</script>')) html = html.slice(0, open);
    }
    dispatch({ type: 'code/set', patch: { html: fillPlaceholders(html, profile, image, blobs), active: true, fp: 'ai', ...meta } });
  };

  try {
    if (image) {
      emit({ phase: 'looking' });
      let spec = null;
      try {
        spec = await describeImage(await imageForGrok(image), prompt, traits, c.signal);
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        // vision unavailable — our own colour/layout reading (already in the prompt) is used instead
      }
      if (spec && edit) user += `

DESIGN SPEC OF AN INSPIRATION IMAGE — restyle the page to match its visual style; ignore any words it mentions and keep all my content:
${JSON.stringify(spec)}`;
      else if (!spec && edit && traits) user += `

Restyle the page using these colours measured from an inspiration image: background ${traits.bgColor}, text ${traits.fgColor}, accent ${traits.accentColor}.`;
      else if (spec) user = user.replace('MY CONTENT (JSON):', () => `DESIGN SPEC OF THE INSPIRATION IMAGE (follow its visual style closely; ignore any words it mentions — all text comes from my content):
${JSON.stringify(spec)}

MY CONTENT (JSON):`);
    }
    emit({ phase: 'writing' });
    const { text, truncated } = await grokStream({
      system: edit ? EDIT_SYSTEM : SYSTEM,
      user,
      temperature: edit ? 0.3 : 0.8,
      maxTokens: edit ? 4000 : 16000, // change blocks are small; a lower budget also eases per-minute token limits
      onWait: (s) => emit({ progress: `Waiting for AI capacity — about ${s}s` }),
      signal: c.signal,
      onText: (t) => {
        if (edit) {
          // edits arrive as small change blocks — show progress, apply them when complete
          emit({ progress: `${(t.match(/>{5,9} ?REPLACE/g) || []).length} change${(t.match(/>{5,9} ?REPLACE/g) || []).length === 1 ? '' : 's'} written` });
          return;
        }
        const html = cleanHtml(t);
        emit({ live: fillPlaceholders(html, profile, image, blobs) });
        if (html.length > 400) push(html);
      },
    });
    if (ctrl !== c) return; // a newer build replaced this one
    let html;
    let editNote = '';
    if (edit) {
      const r = applyEdits(packed, text);
      if (r.applied) {
        html = cleanHtml(r.html, true, !theme); // built-in themes are already responsive — no safety net
        // remember the edit so it can be re-applied when the user changes colours, 3D, theme or content
        if (theme) meta = { base: 'theme', patches: [...patches, text], syncFailed: 0 };
        editNote = r.failed ? `${r.applied} change${r.applied > 1 ? 's' : ''} applied, ${r.failed} couldn’t be placed — check the result, or ask again more specifically.` : `${r.applied} change${r.applied > 1 ? 's' : ''} applied to your code.`;
      } else if (/<html[\s>]/i.test(text)) {
        html = cleanHtml(text, true); // the model returned a whole page instead — it no longer follows the theme
        meta = { base: 'ai', patches: [], syncFailed: 0 };
      }
      else throw new Error('The AI couldn’t match its change to your code — try describing it differently.');
    } else html = cleanHtml(text, true);
    if (!/<html[\s>]/i.test(html) || html.length < 500) throw new Error('The AI didn’t return a usable page — try again or rephrase your request.');
    push(html, true);
    emit({
      status: 'done',
      live: fillPlaceholders(html, profile, image, blobs),
      note: editNote || (!edit && (truncated || !/<\/html>\s*$/i.test(html)) ? 'The page was very long and may be cut off at the end — ask the AI to “finish the page” or simplify the request.' : ''),
    });
  } catch (e) {
    if (e.name === 'AbortError' || ctrl !== c) return;
    emit({ status: 'error', error: e.message || 'The AI build failed.' });
  } finally {
    if (ctrl === c) ctrl = null;
  }
}

// after the user undoes a build
export const clearBuild = (note = '') => emit({ status: 'idle', live: '', note, previous: '', previousMeta: null });

/**
 * Rebuild an AI-changed theme: take a fresh render of the theme (with the user's latest colours, 3D,
 * fonts, content…) and re-apply every AI edit on top, exactly as it was applied the first time.
 * Returns { html, failed } — failed counts edits that no longer fit (e.g. after switching theme).
 */
export function replayEdits(themeHtml, patches) {
  let html = themeHtml;
  let failed = 0;
  for (const p of patches || []) {
    const { packed, blobs } = packBlobs(html, { assets: true });
    const r = applyEdits(packed, p);
    if (!r.applied) failed++;
    else if (r.failed) failed += 0.5; // partly applied
    let next = cleanHtml(r.html, true, false);
    Object.entries(blobs).forEach(([k, v]) => (next = next.replaceAll(k, () => v)));
    html = next;
  }
  return { html, failed: Math.ceil(failed) };
}
