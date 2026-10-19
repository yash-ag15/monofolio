// Rule-based ATS / recruiter check that works for any field (software, core engineering,
// business, finance, design…). Every check returns pass | warn | fail, an explanation and a fix.
//
// Two scores, the way hiring software works:
//   • Resume readiness — can an ATS read it, and does it read well to a recruiter? (no job needed)
//   • Job match — how a job's ATS would rank it: hard skills, soft skills, title, education, experience.
// With a job description the headline ATS score blends both (65% match, 35% readiness).

import { lines } from './model.js';
import { RESUME_TEMPLATES } from './templates.js';
import { KEYWORDS, analyzeJob, detectField, experienceMonths, findKeywords, matchResume, resumeTexts, splitItems, termCount } from './keywords.js';

export const ACTION_VERBS = new Set(
  `accelerated accomplished achieved acquired added addressed administered advised analysed analyzed applied approved architected arranged assembled assessed audited authored automated balanced boosted budgeted built calculated calibrated campaigned captured catalogued championed cleaned coached coded collaborated collected compiled completed composed computed conceived conceptualized conducted configured consolidated constructed consulted contributed controlled converted coordinated corrected created cultivated curated cut debugged decreased defined delivered demonstrated deployed designed detected determined developed devised diagnosed directed discovered documented doubled drafted drove earned edited educated eliminated enabled encouraged engineered enhanced ensured established estimated evaluated examined executed expanded expedited experimented extended extracted fabricated facilitated finalized fixed forecasted formulated fostered founded gathered generated grew guided halved handled headed identified illustrated implemented improved increased influenced initiated innovated inspected installed instructed integrated interpreted interviewed introduced invented investigated launched led leveraged liaised machined maintained managed mapped marketed maximized measured mediated mentored merged migrated minimized mobilized modeled modelled modernized modified monitored motivated negotiated operated optimised optimized orchestrated organised organized outperformed overhauled oversaw owned parallelized partnered performed piloted pioneered planned prepared presented prioritized processed procured produced profiled programmed promoted proposed prototyped published purchased qualified raised ranked rebuilt received recommended reconciled recruited redesigned reduced refactored refined regulated remodeled reorganized replaced reported represented researched resolved restructured revamped reviewed revised rewrote saved scaled scheduled screened secured selected served shipped simplified simulated slashed sold solved sourced spearheaded standardized steered streamlined strengthened structured submitted supervised supported surpassed surveyed sustained synthesized tailored taught tested tracked trained transformed translated triaged tripled troubleshot tuned unified upgraded utilized validated verified visualized volunteered won wrote`.split(/\s+/)
);
const WEAK = [
  ['responsible for', 'Say what you did: “Managed…”, “Built…”, “Led…”'],
  ['worked on', 'Name the result: “Designed…”, “Delivered…”, “Improved…”'],
  ['helped', 'Show your part: “Implemented…”, “Coordinated…”, “Contributed…”'],
  ['assisted', 'Show your part: “Prepared…”, “Co-ordinated…”, “Analysed…”'],
  ['involved in', 'Lead with the action you took'],
  ['participated in', 'Lead with what you achieved'],
  ['tasked with', 'Lead with what you did'],
  ['duties included', 'Replace duties with achievements'],
  ['various', 'Be specific — name them'],
  ['etc', 'List the important items instead of “etc.”'],
  ['familiar with', 'Show where you used it instead'],
];
const BUZZ = ['hard-working', 'hardworking', 'team player', 'go-getter', 'self-motivated', 'passionate', 'synergy', 'results-driven', 'think outside the box', 'dynamic individual', 'motivated individual', 'quick learner', 'fast learner', 'enthusiastic', 'best of my knowledge', 'seeking a challenging'];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
const METRIC = /(\d[\d,.]*\s*(%|x\b|k\b|m\b|cr\b|lakh|crore|\+|ms|s\b|sec|hours?|hrs?|days?|weeks?|months?|users?|students?|customers?|clients?|requests?|downloads?|stars?|teams?|members?|people|employees|records?|rows?|units?|parts?|tons?|tonnes?|kg|kw|mw|sq\.?\s?ft|accounts?|leads?|orders?|sites?|machines?|projects?|reports?|pages?)|\$\s?\d|₹\s?\d|rs\.?\s?\d|\b(?!(?:19|20)\d{2}\b)\d{2,}\b|\btop \d+|\b(?:twice|double[d]?|triple[d]?|half)\b)/i;
const DATE_FMT = [
  ['Mon YYYY', /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/i],
  ['MM/YYYY', /\b\d{1,2}\/\d{4}\b/],
  ['YYYY only', /^\s*\d{4}\s*$/],
];
const STD_HEADING = /(education|academic|qualification|experience|employment|work|internship|training|project|skill|competenc|certification|course|achievement|award|honou?r|accomplishment|summary|profile|objective|responsibilit|leadership|activit|publication|research|volunteer|extra|co-curricular|language|interest|hobb|contact|patent|presentation|conference)/i;

const firstWord = (b) => (b.trim().split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function allBullets(resume) {
  const d = resume.data;
  const h = resume.hidden || {};
  const out = [];
  if (!h.experience) d.experience.forEach((e, i) => lines(e.bullets).forEach((t) => out.push({ text: t, where: e.company || e.role || `Experience ${i + 1}`, section: 'experience', index: i })));
  if (!h.projects) d.projects.forEach((p, i) => lines(p.bullets).forEach((t) => out.push({ text: t, where: p.name || `Project ${i + 1}`, section: 'projects', index: i })));
  return out;
}

export function reviewBullet(text) {
  const flags = [];
  const w = firstWord(text);
  if (!ACTION_VERBS.has(w)) flags.push({ id: 'verb', label: /^(i|my|we|me)$/.test(w) ? 'starts with a pronoun' : 'no action verb', tip: 'Start with a strong past-tense verb: Led, Designed, Reduced, Managed, Built…' });
  if (!METRIC.test(text)) flags.push({ id: 'metric', label: 'no number', tip: 'Add a number: people, %, ₹/$, time saved, volume, scale (e.g. “for 40+ clients”, “cut cost by 12%”).' });
  if (text.length > 230) flags.push({ id: 'long', label: 'too long', tip: 'Keep bullets to 1–2 lines; split or trim.' });
  if (text.length < 40) flags.push({ id: 'short', label: 'too short', tip: 'Add what you used or how, and what changed because of it.' });
  const weak = WEAK.find(([p]) => new RegExp(`\\b${p}\\b`, 'i').test(text));
  if (weak) flags.push({ id: 'weak', label: `“${weak[0]}”`, tip: weak[1] });
  if (/\b(i|me|my)\b/i.test(text)) flags.push({ id: 'pronoun', label: 'first person', tip: 'Drop “I / my” — resumes use implied first person.' });
  return flags;
}

export const CATEGORIES = [
  { id: 'format', label: 'Searchability', desc: 'Can an ATS read and file your resume correctly?', max: 25 },
  { id: 'contact', label: 'Contact details', desc: 'Can a recruiter reach and find you?', max: 10 },
  { id: 'sections', label: 'Sections & dates', desc: 'Are the expected sections present and dated?', max: 15 },
  { id: 'impact', label: 'Impact & writing', desc: 'Do your bullets show results, not duties?', max: 30 },
  { id: 'skills', label: 'Skills', desc: 'Are your skills clear and backed by experience?', max: 10 },
  { id: 'length', label: 'Length & tone', desc: 'Is it the right length and free of filler?', max: 10 },
];

// source = { kind: 'builder' | 'upload', fileType, rawText, found, pages }
export function checkResume(resume, { jd = '', source = { kind: 'builder' } } = {}) {
  const d = resume.data;
  const h = d.header;
  const hidden = resume.hidden || {};
  const titles = resume.titles || {};
  const field = detectField(resume);
  const checks = [];
  const add = (cat, id, status, title, detail, fix, weight = 1) => checks.push({ cat, id, status, title, detail, fix, weight });

  const texts = resumeTexts(resume);
  const plain = source.rawText || [h.name, h.email, h.phone, h.linkedin, h.github, h.location, texts.all, d.education.map((e) => `${e.school} ${e.start} ${e.end}`).join(' '), d.experience.map((e) => `${e.company} ${e.start} ${e.end}`).join(' ')].join('\n');
  const words = plain.split(/\s+/).filter(Boolean).length;
  const bullets = allBullets(resume).map((b) => ({ ...b, flags: reviewBullet(b.text) }));
  const has = (k) => !hidden[k] && (k === 'summary' ? !!d.summary : (d[k] || []).length > 0);

  // ---------- searchability ----------
  if (source.kind === 'builder') {
    const tpl = RESUME_TEMPLATES[resume.style?.template] || RESUME_TEMPLATES.jake;
    if (resume.style?.template === 'deedy') add('format', 'columns', 'warn', 'Two-column layout', 'Some ATS (older Taleo/iCIMS versions) read two columns straight across, mixing sections together.', 'Use a single-column template for portal applications; keep two columns for direct emails.', 3);
    else add('format', 'columns', 'pass', 'Single-column layout', `${tpl.name} keeps one reading order, which every ATS parses correctly.`, '', 3);
    add('format', 'text', 'pass', 'Real, selectable text', 'Exported PDFs contain real text, not images of text.', '', 2);
    const custom = [...Object.entries(titles).filter(([k, v]) => v && !hidden[k]).map(([, v]) => v), ...(has('custom') ? d.custom.map((c) => c.title).filter(Boolean) : [])];
    const odd = custom.filter((t) => !STD_HEADING.test(t));
    add('format', 'headings', odd.length ? 'warn' : 'pass', odd.length ? 'Non-standard section headings' : 'Standard section headings', odd.length ? `ATS may not recognise: ${odd.join(', ')}.` : 'Education, Experience, Projects, Skills — the words ATS look for.', odd.length ? 'Rename to standard words like “Experience”, “Projects”, “Skills”, “Certifications”.' : '', 2);
  } else {
    if (!source.rawText || source.rawText.trim().length < 200) add('format', 'text', 'fail', 'Very little readable text', 'The file is probably a scanned image or uses graphics for text — an ATS would see almost nothing.', 'Export a text-based PDF from Word/Docs/LaTeX, or rebuild it in the Resume builder.', 4);
    else add('format', 'text', 'pass', 'Text is machine-readable', `${words} words were extracted from the file.`, '', 4);
    add('format', 'filetype', source.fileType === 'txt' ? 'warn' : 'pass', source.fileType === 'txt' ? 'Plain-text file' : `${(source.fileType || 'pdf').toUpperCase()} file`, source.fileType === 'txt' ? 'Most portals expect PDF or DOCX.' : 'A format every ATS accepts.', source.fileType === 'txt' ? 'Upload a text-based PDF or a DOCX.' : '', 1);
    const found = source.found || [];
    const std = ['education', 'skills'].filter((k) => found.includes(k)).length + (found.includes('experience') || found.includes('projects') ? 1 : 0);
    add('format', 'headings', std >= 3 ? 'pass' : std >= 2 ? 'warn' : 'fail', std >= 3 ? 'Standard section headings found' : 'Some section headings weren’t recognised', `Recognised: ${found.filter((k) => k !== 'custom').join(', ') || 'none'}.`, std >= 3 ? '' : 'Use exact words like “Education”, “Experience”, “Projects”, “Skills” — creative headings get missed.', 3);
  }
  if (EMOJI.test(plain)) add('format', 'emoji', 'fail', 'Emoji or pictographs', 'They often turn into “?” or empty boxes after parsing.', 'Remove emoji and decorative symbols.', 1);
  else add('format', 'emoji', 'pass', 'No emoji or special symbols', '', '', 1);
  const fmts = new Set();
  [...d.education, ...d.experience].forEach((e) =>
    [e.start, e.end].forEach((v) => {
      if (!v || /present|current|now|till/i.test(v)) return;
      const f = DATE_FMT.find(([, re]) => re.test(v.replace(/expected\s+/i, '')));
      fmts.add(f ? f[0] : 'other');
    })
  );
  add('format', 'datefmt', fmts.size > 1 ? 'warn' : 'pass', fmts.size > 1 ? 'Mixed date formats' : 'Consistent date format', fmts.size > 1 ? `Found: ${[...fmts].join(', ')}. ATS calculate experience from dates and can misread mixed formats.` : '', fmts.size > 1 ? 'Use one format everywhere, e.g. “May 2026 – Present”.' : '', 1);

  // ---------- contact ----------
  add('contact', 'name', h.name ? 'pass' : 'fail', h.name ? 'Full name' : 'Name missing', '', h.name ? '' : 'Put your full name as the first line.', 1);
  const emailOk = /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(h.email || '');
  add('contact', 'email', emailOk ? 'pass' : 'fail', emailOk ? 'Email address' : 'Email missing or invalid', h.email || '', emailOk ? '' : 'Add a working email address.', 2);
  if (emailOk && /(cool|cute|sexy|love|king|queen|rockstar|ninja|xx|baby|\d{5,})/i.test(h.email)) add('contact', 'email-pro', 'warn', 'Email may look unprofessional', h.email, 'Use firstname.lastname@… for job applications.', 1);
  const phoneOk = (h.phone || '').replace(/\D/g, '').length >= 10;
  add('contact', 'phone', phoneOk ? 'pass' : 'warn', phoneOk ? 'Phone number' : 'Phone number missing', '', phoneOk ? '' : 'Add a phone number with country code (e.g. +91 …).', 1);
  add('contact', 'location', h.location ? 'pass' : 'warn', h.location ? 'Location' : 'No location', '', h.location ? '' : 'Add your city and state — recruiters often filter candidates by location.', 1);
  add('contact', 'linkedin', h.linkedin ? 'pass' : 'warn', h.linkedin ? 'LinkedIn profile' : 'No LinkedIn', '', h.linkedin ? '' : 'Recruiters check LinkedIn — add linkedin.com/in/your-name.', 1);
  if (field === 'tech') add('contact', 'github', h.github || h.website ? 'pass' : 'warn', h.github || h.website ? 'GitHub / portfolio link' : 'No GitHub or portfolio', '', h.github || h.website ? '' : 'For software roles, link your GitHub or portfolio.', 1);

  // ---------- sections ----------
  add('sections', 'education', has('education') ? 'pass' : 'fail', has('education') ? 'Education' : 'Education missing', '', has('education') ? '' : 'List your degree, institution and graduation year — ATS use it for eligibility filters.', 2);
  add('sections', 'skills', has('skills') ? 'pass' : 'fail', has('skills') ? 'Skills section' : 'Skills section missing', '', has('skills') ? '' : 'Add a Skills section — it’s the first place an ATS looks for keywords.', 2);
  const exp = has('experience');
  const projN = has('projects') ? d.projects.length : 0;
  if (exp || projN >= 2) add('sections', 'proof', 'pass', exp ? 'Experience' : `${projN} projects`, exp ? `${d.experience.length} entr${d.experience.length === 1 ? 'y' : 'ies'}.` : 'Projects carry your resume when you have no internships yet.', '', 2);
  else add('sections', 'proof', 'fail', 'Not enough proof of work', 'No experience and fewer than 2 projects.', 'Add internships, training, part-time work, freelance, research, or 2–3 solid academic projects.', 2);
  if (!exp && projN >= 2) add('sections', 'exp', 'warn', 'No experience section', 'Normal for students — but internships, industrial training, research, club roles and freelance work all count.', 'Add any of those under Experience.', 1);
  const undated = [...(has('education') ? d.education : []), ...(exp ? d.experience : [])].filter((e) => !e.start && !e.end);
  add('sections', 'dates', undated.length ? 'warn' : 'pass', undated.length ? `${undated.length} entr${undated.length === 1 ? 'y has' : 'ies have'} no dates` : 'Every entry is dated', '', undated.length ? 'Add start and end dates (or “Present”) — ATS calculate experience from them.' : '', 1);
  if (has('summary')) {
    const sw = d.summary.split(/\s+/).filter(Boolean).length;
    add('sections', 'summary', sw > 70 ? 'warn' : 'pass', sw > 70 ? 'Summary is long' : 'Concise summary', `${sw} words.`, sw > 70 ? 'Keep it to 2–3 lines (under 60 words).' : '', 1);
  }

  // ---------- impact ----------
  const nb = bullets.length;
  if (!nb) add('impact', 'bullets', 'fail', 'No bullet points', 'Experience and projects need bullet points describing what you did and achieved.', 'Add 2–4 bullets for each experience and project.', 4);
  else {
    const verbs = bullets.filter((b) => !b.flags.some((f) => f.id === 'verb')).length;
    const p1 = pct(verbs, nb);
    add('impact', 'verbs', p1 >= 80 ? 'pass' : p1 >= 50 ? 'warn' : 'fail', `${p1}% of bullets start with an action verb`, `${verbs} of ${nb}.`, p1 >= 80 ? '' : 'Start every bullet with a past-tense verb — Led, Designed, Managed, Reduced, Delivered.', 3);
    const nums = bullets.filter((b) => !b.flags.some((f) => f.id === 'metric')).length;
    const p2 = pct(nums, nb);
    add('impact', 'metrics', p2 >= 50 ? 'pass' : p2 >= 25 ? 'warn' : 'fail', `${p2}% of bullets show measurable results`, `${nums} of ${nb} include a number.`, p2 >= 50 ? '' : 'Numbers prove impact: %, ₹/$ saved, time cut, volume handled, people served, team size.', 4);
    const weak = bullets.filter((b) => b.flags.some((f) => f.id === 'weak'));
    add('impact', 'weak', weak.length ? 'warn' : 'pass', weak.length ? `Weak phrasing in ${weak.length} bullet${weak.length > 1 ? 's' : ''}` : 'No weak phrases', weak.length ? [...new Set(weak.map((b) => b.flags.find((f) => f.id === 'weak').label))].join(', ') : '“Responsible for”, “worked on”, “helped with” — none found.', weak.length ? 'Replace duties with what you actually did and achieved.' : '', 2);
    const pron = bullets.filter((b) => b.flags.some((f) => f.id === 'pronoun')).length;
    if (pron) add('impact', 'pronoun', 'warn', `First person in ${pron} bullet${pron > 1 ? 's' : ''}`, '', 'Remove “I”, “me”, “my”.', 1);
    const long = bullets.filter((b) => b.flags.some((f) => f.id === 'long')).length;
    const short = bullets.filter((b) => b.flags.some((f) => f.id === 'short')).length;
    add('impact', 'length', long + short ? 'warn' : 'pass', long + short ? 'Some bullets are too long or too short' : 'Bullet length is good', long + short ? `${long} too long, ${short} too short.` : 'All between about one and two lines.', long + short ? 'Aim for 1–2 lines: action + what/how + result.' : '', 1);
    const counts = {};
    bullets.forEach((b) => {
      const w = firstWord(b.text);
      if (ACTION_VERBS.has(w)) counts[w] = (counts[w] || 0) + 1;
    });
    const rep = Object.entries(counts).filter(([, n]) => n >= 3).map(([w, n]) => `“${w[0].toUpperCase() + w.slice(1)}” ×${n}`);
    add('impact', 'variety', rep.length ? 'warn' : 'pass', rep.length ? 'Repeated opening verbs' : 'Varied action verbs', rep.join(', '), rep.length ? 'Vary them: Developed → Engineered, Managed → Directed, Improved → Optimised.' : '', 1);
    const thin = [...(exp ? d.experience : []).filter((e) => lines(e.bullets).length < 2), ...(has('projects') ? d.projects : []).filter((p) => !lines(p.bullets).length)];
    const fat = [...(exp ? d.experience : []), ...(has('projects') ? d.projects : [])].filter((e) => lines(e.bullets).length > 6);
    if (thin.length || fat.length) add('impact', 'perentry', 'warn', 'Uneven bullets per entry', [thin.length && `${thin.length} with too few bullets`, fat.length && `${fat.length} with more than 6`].filter(Boolean).join(', ') + '.', 'Use 2–5 bullets per role and 1–3 per project.', 1);
  }

  // ---------- skills (field-neutral: any skill text is checked against your experience) ----------
  const skillItems = has('skills') ? d.skills.flatMap((s) => splitItems(s.items)) : [];
  if (skillItems.length) {
    add('skills', 'count', skillItems.length < 6 || skillItems.length > 45 ? 'warn' : 'pass', `${skillItems.length} skills listed`, '', skillItems.length < 6 ? 'List the tools, software, methods and domain skills you have actually used.' : skillItems.length > 45 ? 'Trim to what you can discuss in an interview (about 15–35).' : '', 1);
    const grouped = d.skills.length >= 2 && d.skills.every((s) => s.group);
    add('skills', 'grouped', grouped ? 'pass' : 'warn', grouped ? 'Skills are grouped' : 'Skills aren’t grouped', '', grouped ? '' : 'Group them, e.g. Software / Technical / Domain / Languages — easier to scan.', 1);
    const dupes = skillItems.filter((x, i) => skillItems.findIndex((y) => y.toLowerCase() === x.toLowerCase()) !== i);
    if (dupes.length) add('skills', 'dupes', 'warn', 'Duplicate skills', [...new Set(dupes)].join(', '), 'List each skill once.', 1);
    // evidence: does each hard skill appear in experience/projects?
    const evidence = texts.evidence;
    const hardItems = skillItems
      .map((x) => x.replace(/\(.*?\)/g, '').trim())
      .filter((x) => x && x.length < 40 && ![...findKeywords(x).keys()].some((n) => KEYWORDS.find((k) => k.name === n)?.cat === 'Soft skills'));
    const unproven = hardItems.filter((x) => {
      const dict = [...findKeywords(x).keys()];
      if (dict.length) return !dict.some((n) => findKeywords(evidence).has(n));
      return !termCount(evidence, { name: x, phrase: true });
    });
    const p3 = pct(hardItems.length - unproven.length, hardItems.length);
    if (hardItems.length) add('skills', 'proven', p3 >= 50 ? 'pass' : 'warn', `${p3}% of your skills are backed by experience`, unproven.length ? `Only in the skills list: ${unproven.slice(0, 10).join(', ')}${unproven.length > 10 ? '…' : ''}` : 'Every skill appears in a role or project.', p3 >= 50 ? '' : 'Mention key skills inside bullets (“Modelled the gearbox in SolidWorks…”, “Built the dashboard in Excel…”) — recruiters trust skills they can see used.', 2);
  }
  const miscased = [];
  const toolText = [texts.skills, ...d.experience.map((e) => e.tech), ...d.projects.map((p) => p.tech)].join('\n');
  KEYWORDS.forEach((k) => {
    if (!k.re || k.cat === 'Soft skills' || k.cat === 'Concepts') return;
    (toolText.match(k.re) || []).forEach((m) => {
      if (m.length > 2 && m !== k.name && m.toLowerCase() === k.name.toLowerCase() && !miscased.includes(`${m} → ${k.name}`)) miscased.push(`${m} → ${k.name}`);
    });
  });
  if (miscased.length) add('skills', 'case', 'warn', 'Tool names in non-standard spelling', miscased.slice(0, 8).join(', '), 'Use the official spelling — it looks careful and matches recruiter searches exactly.', 1);

  // ---------- length & tone ----------
  const months = experienceMonths(resume);
  const longOk = months > 60 ? 1100 : 850;
  add('length', 'words', words < 250 || words > longOk ? 'warn' : 'pass', `${words} words`, words < 250 ? 'Quite thin for a resume.' : words > longOk ? 'Likely more than one page.' : 'A good length (about 350–750 words for one page).', words < 250 ? 'Add experience, measurable results and skills.' : words > longOk ? 'Students and early-career candidates should keep to one page: cut older or weaker items.' : '', 2);
  if (source.pages) add('length', 'pages', source.pages > 1 && months < 36 ? 'warn' : 'pass', source.pages > 1 ? `${source.pages} pages` : 'One page', '', source.pages > 1 && months < 36 ? 'With under 3 years of experience, one page is the norm.' : '', 1);
  const buzz = BUZZ.filter((b) => new RegExp(`\\b${b}\\b`, 'i').test(plain));
  add('length', 'buzz', buzz.length ? 'warn' : 'pass', buzz.length ? 'Clichés found' : 'No clichés', buzz.join(', '), buzz.length ? 'Recruiters skip these — show the quality through an achievement instead.' : '', 1);

  // ---------- scores ----------
  const categories = CATEGORIES.map((c) => {
    const cs = checks.filter((x) => x.cat === c.id);
    const tw = cs.reduce((a, x) => a + x.weight, 0);
    const got = cs.reduce((a, x) => a + x.weight * (x.status === 'pass' ? 1 : x.status === 'warn' ? 0.5 : 0), 0);
    return { ...c, score: tw ? Math.round((got / tw) * c.max) : c.max, issues: cs.filter((x) => x.status !== 'pass').length };
  });
  const readiness = categories.reduce((a, c) => a + c.score, 0);

  let match = null;
  let job = null;
  if (jd && jd.trim().length > 40) {
    job = analyzeJob(jd);
    match = matchResume(resume, job);
  }
  const score = match ? Math.round(match.score * 0.65 + readiness * 0.35) : readiness;
  const stats = {
    words,
    bullets: nb,
    verbs: nb ? pct(bullets.filter((b) => !b.flags.some((f) => f.id === 'verb')).length, nb) : 0,
    quantified: nb ? pct(bullets.filter((b) => !b.flags.some((f) => f.id === 'metric')).length, nb) : 0,
    months,
  };
  return { score, readiness, categories, checks, bullets, words, match, job, plain, field, stats };
}

export const scoreLabel = (s) => (s >= 85 ? 'Excellent' : s >= 70 ? 'Good' : s >= 50 ? 'Needs work' : 'Weak');
export const scoreNote = (s, withJob) =>
  withJob
    ? s >= 85
      ? 'Likely to rank near the top of the applicant list for this job.'
      : s >= 70
        ? 'Competitive — closing a few keyword gaps would move you up the list.'
        : s >= 50
          ? 'Likely to be filtered below stronger matches. Add the missing skills you have.'
          : 'Unlikely to pass this job’s ATS filter as it is.'
    : s >= 85
      ? 'Reads cleanly in any ATS and shows clear impact.'
      : s >= 70
        ? 'Solid. A few fixes will make it stand out.'
        : s >= 50
          ? 'An ATS can read it, but recruiters may skim past it.'
          : 'Needs work before you send it out.';
