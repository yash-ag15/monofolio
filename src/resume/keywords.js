// Rule-based keyword engine shared by the ATS checker and job tailoring (tech + core + business roles).
// A dictionary of tech skills/concepts (with aliases) + job-description parsing + resume matching.

import { lines } from './model.js';
import { DICT_CORE } from './keywords-core.js';

// [canonical, category, ...aliases]   ("cs:" prefix = case-sensitive alias, for words that are also English)
const DICT = [
  // languages
  ['JavaScript', 'Languages', 'js', 'javascript', 'es6', 'ecmascript'],
  ['TypeScript', 'Languages', 'ts', 'typescript'],
  ['Python', 'Languages', 'python', 'python3'],
  ['Java', 'Languages', 'java', 'core java'],
  ['C++', 'Languages', 'c++', 'cpp'],
  ['C', 'Languages', 'cs:C'],
  ['C#', 'Languages', 'c#', 'csharp'],
  ['Go', 'Languages', 'golang', 'cs:Go'],
  ['Rust', 'Languages', 'cs:Rust'],
  ['Kotlin', 'Languages', 'kotlin'],
  ['Swift', 'Languages', 'cs:Swift'],
  ['Ruby', 'Languages', 'cs:Ruby'],
  ['PHP', 'Languages', 'php'],
  ['Scala', 'Languages', 'scala'],
  ['R', 'Languages', 'cs:R'],
  ['Dart', 'Languages', 'cs:Dart'],
  ['SQL', 'Languages', 'sql'],
  ['Bash', 'Languages', 'bash', 'shell scripting', 'shell script'],
  ['HTML', 'Languages', 'html', 'html5'],
  ['CSS', 'Languages', 'css', 'css3'],
  ['Solidity', 'Languages', 'solidity'],
  ['MATLAB', 'Languages', 'matlab'],
  // frontend
  ['React', 'Frameworks', 'react', 'react.js', 'reactjs'],
  ['Next.js', 'Frameworks', 'next.js', 'nextjs'],
  ['Angular', 'Frameworks', 'angular', 'angularjs'],
  ['Vue.js', 'Frameworks', 'vue', 'vue.js', 'vuejs'],
  ['Svelte', 'Frameworks', 'svelte', 'sveltekit'],
  ['Redux', 'Frameworks', 'redux', 'redux toolkit'],
  ['Tailwind CSS', 'Frameworks', 'tailwind', 'tailwindcss', 'tailwind css'],
  ['Bootstrap', 'Frameworks', 'bootstrap'],
  ['jQuery', 'Frameworks', 'jquery'],
  ['React Native', 'Frameworks', 'react native'],
  ['Flutter', 'Frameworks', 'flutter'],
  ['Android', 'Frameworks', 'android'],
  ['iOS', 'Frameworks', 'ios'],
  ['SwiftUI', 'Frameworks', 'swiftui'],
  // backend
  ['Node.js', 'Frameworks', 'node', 'node.js', 'nodejs'],
  ['Express', 'Frameworks', 'cs:Express', 'express.js', 'expressjs'],
  ['NestJS', 'Frameworks', 'nestjs', 'nest.js'],
  ['Django', 'Frameworks', 'django'],
  ['Flask', 'Frameworks', 'flask'],
  ['FastAPI', 'Frameworks', 'fastapi'],
  ['Spring Boot', 'Frameworks', 'spring boot', 'springboot', 'spring framework', 'spring mvc'],
  ['Hibernate', 'Frameworks', 'hibernate'],
  ['.NET', 'Frameworks', '.net', 'dotnet', 'asp.net'],
  ['Ruby on Rails', 'Frameworks', 'rails', 'ruby on rails'],
  ['Laravel', 'Frameworks', 'laravel'],
  ['GraphQL', 'Frameworks', 'graphql'],
  ['gRPC', 'Frameworks', 'grpc'],
  ['REST APIs', 'Concepts', 'cs:REST', 'rest api', 'rest apis', 'restful', 'restful apis', 'restful api'],
  ['WebSockets', 'Frameworks', 'websocket', 'websockets', 'socket.io'],
  // data / ml
  ['Machine Learning', 'Data & ML', 'machine learning', 'ml'],
  ['Deep Learning', 'Data & ML', 'deep learning'],
  ['NLP', 'Data & ML', 'nlp', 'natural language processing'],
  ['Computer Vision', 'Data & ML', 'computer vision', 'opencv'],
  ['LLMs', 'Data & ML', 'llm', 'llms', 'large language models', 'genai', 'generative ai'],
  ['TensorFlow', 'Data & ML', 'tensorflow'],
  ['PyTorch', 'Data & ML', 'pytorch'],
  ['scikit-learn', 'Data & ML', 'scikit-learn', 'sklearn', 'scikit learn'],
  ['Pandas', 'Data & ML', 'pandas'],
  ['NumPy', 'Data & ML', 'numpy'],
  ['Spark', 'Data & ML', 'spark', 'apache spark', 'pyspark'],
  ['Hadoop', 'Data & ML', 'hadoop'],
  ['Data Analysis', 'Data & ML', 'data analysis', 'data analytics'],
  ['Power BI', 'Data & ML', 'power bi', 'powerbi'],
  ['Tableau', 'Data & ML', 'tableau'],
  ['Excel', 'Tools', 'cs:Excel', 'ms excel', 'microsoft excel', 'advanced excel', 'vlookup', 'pivot tables'],
  // databases
  ['PostgreSQL', 'Databases', 'postgresql', 'postgres'],
  ['MySQL', 'Databases', 'mysql'],
  ['MongoDB', 'Databases', 'mongodb', 'mongo'],
  ['Redis', 'Databases', 'redis'],
  ['SQLite', 'Databases', 'sqlite'],
  ['Oracle', 'Databases', 'oracle db', 'oracle'],
  ['DynamoDB', 'Databases', 'dynamodb'],
  ['Cassandra', 'Databases', 'cassandra'],
  ['Elasticsearch', 'Databases', 'elasticsearch', 'elastic search'],
  ['Firebase', 'Databases', 'firebase', 'firestore'],
  ['Supabase', 'Databases', 'supabase'],
  ['Prisma', 'Databases', 'prisma'],
  ['NoSQL', 'Databases', 'nosql'],
  // cloud / devops
  ['AWS', 'Cloud & DevOps', 'aws', 'amazon web services'],
  ['Azure', 'Cloud & DevOps', 'azure', 'microsoft azure'],
  ['GCP', 'Cloud & DevOps', 'gcp', 'google cloud', 'google cloud platform'],
  ['Docker', 'Cloud & DevOps', 'docker', 'containers', 'containerization'],
  ['Kubernetes', 'Cloud & DevOps', 'kubernetes', 'k8s'],
  ['Terraform', 'Cloud & DevOps', 'terraform'],
  ['CI/CD', 'Cloud & DevOps', 'ci/cd', 'ci cd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
  ['GitHub Actions', 'Cloud & DevOps', 'github actions'],
  ['Jenkins', 'Cloud & DevOps', 'jenkins'],
  ['Linux', 'Cloud & DevOps', 'linux', 'unix'],
  ['Nginx', 'Cloud & DevOps', 'nginx'],
  ['Kafka', 'Cloud & DevOps', 'kafka', 'apache kafka'],
  ['RabbitMQ', 'Cloud & DevOps', 'rabbitmq'],
  ['Serverless', 'Cloud & DevOps', 'serverless', 'lambda', 'aws lambda'],
  ['Vercel', 'Cloud & DevOps', 'vercel'],
  ['Microservices', 'Concepts', 'microservices', 'microservice', 'micro-services'],
  // tools / testing
  ['Git', 'Tools', 'git', 'version control'],
  ['GitHub', 'Tools', 'github'],
  ['Jira', 'Tools', 'jira'],
  ['Postman', 'Tools', 'postman'],
  ['Figma', 'Tools', 'figma'],
  ['Webpack', 'Tools', 'webpack'],
  ['Vite', 'Tools', 'cs:Vite', 'vitejs'],
  ['Jest', 'Testing', 'jest'],
  ['Cypress', 'Testing', 'cypress'],
  ['Selenium', 'Testing', 'selenium'],
  ['JUnit', 'Testing', 'junit'],
  ['PyTest', 'Testing', 'pytest'],
  ['Playwright', 'Testing', 'playwright'],
  ['Unit Testing', 'Testing', 'unit testing', 'unit tests', 'integration tests', 'integration testing', 'unit and integration tests', 'test-driven', 'tdd', 'automated testing', 'testing'],
  // concepts
  ['Data Structures', 'Concepts', 'data structures', 'dsa'],
  ['Algorithms', 'Concepts', 'algorithms', 'algorithm'],
  ['OOP', 'Concepts', 'oop', 'object-oriented', 'object oriented', 'oops'],
  ['System Design', 'Concepts', 'system design', 'low level design', 'high level design', 'lld', 'hld'],
  ['Distributed Systems', 'Concepts', 'distributed systems'],
  ['DBMS', 'Concepts', 'dbms', 'database design', 'database management'],
  ['Operating Systems', 'Concepts', 'operating systems'],
  ['Computer Networks', 'Concepts', 'computer networks', 'networking'],
  ['Design Patterns', 'Concepts', 'design patterns'],
  ['Agile', 'Concepts', 'agile', 'scrum', 'kanban'],
  ['Debugging', 'Concepts', 'debugging', 'troubleshooting'],
  ['Code Review', 'Concepts', 'code review', 'code reviews'],
  ['Performance Optimization', 'Concepts', 'performance optimization', 'performance tuning', 'optimization'],
  ['Security', 'Concepts', 'security', 'authentication', 'oauth', 'jwt'],
  ['Accessibility', 'Concepts', 'accessibility', 'a11y', 'wcag'],
  ['Responsive Design', 'Concepts', 'responsive design', 'responsive web', 'responsive ui', 'mobile-first'],
  ['Caching', 'Concepts', 'caching', 'cache'],
  ['Multithreading', 'Concepts', 'multithreading', 'concurrency'],
  ['Blockchain', 'Concepts', 'blockchain', 'web3'],
  // soft skills (scored lightly)
  ['Communication', 'Soft skills', 'communication', 'communicate', 'communication skills', 'verbal and written'],
  ['Teamwork', 'Soft skills', 'teamwork', 'collaborate', 'collaboration', 'cross-functional'],
  ['Problem Solving', 'Soft skills', 'problem solving', 'problem-solving'],
  ['Leadership', 'Soft skills', 'leadership', 'mentoring', 'mentor'],
  ['Ownership', 'Soft skills', 'ownership'],
];

// "AWS (EC2, S3), Docker" → ["AWS (EC2, S3)", "Docker"]  (commas inside brackets don't split)
export function splitItems(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of String(s || '')) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';' || ch === '|') && !depth) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
export const KEYWORDS = [...DICT, ...DICT_CORE].map(([name, cat, ...aliases]) => {
  // longest alias first, so "sap fico" wins over "sap"
  const ci = aliases.filter((a) => !a.startsWith('cs:')).sort((a, b) => b.length - a.length);
  const cs = aliases.filter((a) => a.startsWith('cs:')).map((a) => a.slice(3)).sort((a, b) => b.length - a.length);
  const B = '(?<![A-Za-z0-9+#.]|Series |Grade |Plan )';
  const A = '(?![A-Za-z0-9+#]|\\.[A-Za-z])';
  return {
    name,
    cat,
    aliases: [...ci, ...cs].map((a) => a.toLowerCase()),
    re: ci.length ? new RegExp(`${B}(?:${ci.map(escRe).join('|')})${A}`, 'gi') : null,
    reCs: cs.length ? new RegExp(`${B}(?:${cs.map(escRe).join('|')})(?![A-Za-z0-9+#&/-]|\\.[A-Za-z])`, 'g') : null,
  };
});

// Keywords whose aliases contain another keyword as a whole word ("lean manufacturing" ⊃ "manufacturing",
// "react native" ⊃ "react"). When counting the shorter one, text claimed by the longer one is ignored.
KEYWORDS.forEach((k) => {
  k.containers = KEYWORDS.filter(
    (o) =>
      o !== k &&
      o.aliases.some((oa) =>
        k.aliases.some((ka) => oa.length > ka.length && oa.includes(ka) && new RegExp(`(^|[^a-z0-9+#])${escRe(ka)}([^a-z0-9+#]|$)`).test(oa))
      )
  );
});
function countKeyword(k, text) {
  let t = String(text || '');
  k.containers.forEach((o) => {
    if (o.re) t = t.replace(o.re, ' ¦ ');
    if (o.reCs) t = t.replace(o.reCs, ' ¦ ');
  });
  return (k.re ? (t.match(k.re) || []).length : 0) + (k.reCs ? (t.match(k.reCs) || []).length : 0);
}

export const SKILL_CATEGORIES = ['Languages', 'Frameworks', 'Databases', 'Cloud & DevOps', 'Data & ML', 'Testing', 'Tools', 'Concepts', 'Engineering Tools', 'Core Engineering', 'Business & Finance', 'Business & Marketing', 'Office & ERP', 'Design', 'Soft skills'];
const TECH_CATS = new Set(['Languages', 'Frameworks', 'Databases', 'Cloud & DevOps', 'Data & ML', 'Testing']);

// how many times each dictionary keyword appears in a text → Map(name → count)
export function findKeywords(text) {
  const out = new Map();
  const t = String(text || '');
  KEYWORDS.forEach((k) => {
    const n = countKeyword(k, t);
    if (n) out.set(k.name, n);
  });
  return out;
}
const BY_NAME = new Map(KEYWORDS.map((k) => [k.name, k]));
export const keywordCat = (name) => BY_NAME.get(name)?.cat || 'Other';

// ---------- generic phrase matching (works for any field, not just tech) ----------
const stemWord = (w) => (w.length > 4 ? w.replace(/ies$/, 'y').replace(/(ing|ed|es|s)$/, '') : w);
const normWords = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#&/.\s-]/g, ' ')
    .replace(/(\w)[.](\s|$)/g, '$1$2')
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map(stemWord);
const normText = (s) => ` ${normWords(s).join(' ')} `;

// count a job keyword (dictionary or free phrase) in a text
export function termCount(text, kw) {
  const k = BY_NAME.get(kw.name);
  if (k && !kw.phrase) return countKeyword(k, text);
  const p = normWords(kw.name).join(' ');
  if (!p) return 0;
  return normText(text).split(` ${p} `).length - 1;
}

const STOP = new Set(
  `a an the and or of to in on for with without at by from as is are be been being it its this that these those we you our your their they will would should can could may might must shall do does did has have had not no nor but if then than so such into over under about across per via etc eg ie e.g i.e
  experience experienced knowledge ability abilities skill skills strong good great excellent solid sound basic advanced proven track record understanding working work works team teams candidate candidates role roles job position company organisation organization years year required requirement requirements preferred plus must nice have having including include includes using use used based related relevant hands hands-on minimum degree bachelor bachelors master masters equivalent field areas area tools tool technologies technology knowledge environment environments new various multiple other others well also within least one two three four five familiarity familiar exposure proficiency proficient expertise background demonstrated similar strong-willed ability ensure support supporting help`.split(/\s+/)
);
const NOT_ACRONYM = new Set(['US', 'USA', 'UK', 'CEO', 'CTO', 'COO', 'WFH', 'CTC', 'LPA', 'JD', 'FAQ', 'NA', 'II', 'III', 'IV', 'OR', 'AND', 'TO', 'IN', 'OF', 'EEO', 'PTO', 'EOE', 'ID', 'OK', 'AM', 'PM', 'IST', 'PST', 'HQ', 'MNC', 'INR', 'USD', 'NOTE', 'ABOUT', 'ROLE', 'JOB']);
const CUE = /(?:experience (?:in|with|of)|knowledge of|proficien(?:t|cy) (?:in|with)|familiar(?:ity)? with|expertise in|skilled in|skills? in|background in|understanding of|hands[- ]on (?:experience )?(?:in|with)|working knowledge of|exposure to|certification in|certified in|competen(?:t|ce|cy) in|ability to use)\s+([^.;:()]+)/gi;

function cleanPhrase(p) {
  let w = p.replace(/^[\s,-]+|[\s,-]+$/g, '').split(/\s+/);
  const dropable = (x) => x !== x.toUpperCase() && STOP.has(x.toLowerCase()); // never trim acronyms like "AS"
  while (w.length && dropable(w[0])) w.shift();
  while (w.length && dropable(w[w.length - 1])) w.pop();
  if (!w.length || w.length > 4) return '';
  const s = w.join(' ');
  if (s.length < 2 || s.length > 40 || /^\d+$/.test(s)) return '';
  if (w.every((x) => STOP.has(x.toLowerCase()))) return '';
  return s;
}

// free-form skill phrases from one JD line (anything the dictionary doesn't know)
function linePhrases(l) {
  const out = [];
  let m;
  CUE.lastIndex = 0;
  while ((m = CUE.exec(l))) {
    m[1]
      .split(/,|\band\b|\bor\b|\/|;|\betc\b/i)
      .map(cleanPhrase)
      .filter(Boolean)
      .forEach((p) => out.push(p));
  }
  // acronyms (HVAC, PMP, IND AS, ISO 9001) and CamelCase tool names (QuickBooks) — looked for only
  // outside text the dictionary already matched, so "SAP FICO" / "Power BI" don't leave "FICO" / "BI"
  let rest = l;
  KEYWORDS.forEach((k) => {
    if (k.re) rest = rest.replace(k.re, ' ¦ ');
    if (k.reCs) rest = rest.replace(k.reCs, ' ¦ ');
  });
  (rest.match(/\b[A-Z][A-Z0-9&]{1,7}(?:\s(?:[A-Z]{2,6}|\d{3,5}))?\b/g) || []).forEach((a) => !NOT_ACRONYM.has(a) && out.push(a));
  (rest.match(/\b[A-Z][a-z]+[A-Z][A-Za-z]+\b/g) || []).forEach((a) => out.push(a));
  return out;
}

const REQ_HEAD = /(requirement|qualification|must[- ]have|what you('ll)? (need|bring)|you (have|bring)|we('re| are) looking for|who you are|skills required|eligibility|minimum|basic qualifications|required|desired profile|candidate profile)/i;
const PREF_HEAD = /(nice[- ]to[- ]have|preferred|bonus|good[- ]to[- ]have|plus|desired skills|additional|extra credit)/i;
const RESP_HEAD = /(responsibilit|what you('ll)? do|role|about the (job|role)|day[- ]to[- ]day|you will|key result|kra)/i;

const DEGREE_LEVELS = [
  ['phd', /\b(ph\.?\s?d|doctorate)\b/i],
  ['master', /\b(master'?s?|m\.?\s?tech|m\.?\s?e\b|m\.?\s?sc|mba|pgdm|m\.?\s?com|mca|post[- ]?graduate)\b/i],
  ['bachelor', /\b(bachelor'?s?|b\.?\s?tech|b\.?\s?e\b|b\.?\s?sc|b\.?\s?com|bca|bba|b\.?\s?a\b|undergraduate|graduate degree|graduation|be\/b\.?tech)\b/i],
  ['diploma', /\b(diploma|iti|polytechnic)\b/i],
];
const LEVEL_RANK = { diploma: 1, bachelor: 2, master: 3, phd: 4 };
const FIELDS = ['computer science', 'computer engineering', 'information technology', 'software', 'electronics', 'electrical', 'mechanical', 'civil', 'chemical', 'production', 'industrial', 'instrumentation', 'aerospace', 'automobile', 'biotechnology', 'mathematics', 'statistics', 'physics', 'economics', 'commerce', 'finance', 'accounting', 'business', 'management', 'marketing', 'human resources', 'design', 'data science', 'engineering'];
const degreeLevel = (t) => DEGREE_LEVELS.find(([, re]) => re.test(t))?.[0] || '';

// Parse a job description into weighted keywords + a few facts.
export function analyzeJob(jd) {
  const text = String(jd || '');
  const ls = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let mode = 'general';
  const found = new Map(); // key → { name, cat, phrase, required, preferred, count }
  const bump = (key, base, lineMode, n = 1) => {
    const w = found.get(key) || { ...base, required: false, preferred: false, count: 0 };
    w.count += n;
    if (lineMode === 'required') w.required = true;
    if (lineMode === 'preferred') w.preferred = true;
    found.set(key, w);
  };
  ls.forEach((l) => {
    const short = l.length < 70 && !/[.;]$/.test(l);
    if (short && PREF_HEAD.test(l)) mode = 'preferred';
    else if (short && REQ_HEAD.test(l)) mode = 'required';
    else if (short && RESP_HEAD.test(l)) mode = 'general';
    const lineMode = /\b(is a plus|nice to have|preferred|bonus|good to have|advantageous|desirable)\b/i.test(l) ? 'preferred' : /\b(must|required|mandatory|strong (knowledge|understanding|experience)|proficien)/i.test(l) ? 'required' : mode;
    const dict = findKeywords(l);
    dict.forEach((n, name) => bump(name, { name, cat: keywordCat(name), phrase: false }, lineMode, n));
    linePhrases(l).forEach((p) => {
      if (findKeywords(p).size) return; // dictionary already covers it
      const key = normWords(p).join(' ');
      if (!key || STOP.has(key)) return;
      bump(`~${key}`, { name: p, cat: 'Other', phrase: true }, lineMode);
    });
  });
  let list = [...found.values()].map((w) => {
    const type = w.cat === 'Soft skills' ? 'soft' : 'hard';
    const base = w.required ? 3 : w.preferred ? 1 : 2;
    const conf = w.phrase ? 0.7 : 1; // free phrases are guesses — weigh them a little less
    return { ...w, type, importance: w.required ? 'required' : w.preferred ? 'preferred' : 'mentioned', weight: +((base + Math.min(2, w.count - 1) * 0.5) * conf).toFixed(2) };
  });
  // keep free phrases only when they look important (required, repeated or an acronym/tool name)
  list = list.filter((k) => !k.phrase || k.required || k.count > 1 || /[A-Z]{2,}|[a-z][A-Z]/.test(k.name));
  const phrases = list.filter((k) => k.phrase).sort((a, b) => b.weight - a.weight).slice(0, 14);
  list = [...list.filter((k) => !k.phrase), ...phrases].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));

  // facts
  const yrs = text.match(/(\d+)\s*\+?\s*(?:-|to)?\s*(\d+)?\s*\+?\s*years?(?:'|’)?\s*(?:of\s+)?(?:\w+\s+){0,3}?(?:experience|exp)/i);
  const fresher = /\b(fresher|freshers|intern|internship|new grad|graduate trainee|entry[- ]level|campus|0\s*-\s*\d\s*years?)\b/i.test(text);
  const level = degreeLevel(text);
  const fields = FIELDS.filter((f) => new RegExp(`\\b${f}\\b`, 'i').test(text)).filter((f) => f !== 'engineering' || !FIELDS.some((g) => g !== 'engineering' && text.toLowerCase().includes(g)));
  const titleLine = ls.find((l) => /^(job title|title|role|position|designation)\s*[:–-]/i.test(l));
  const firstLine = ls[0] && ls[0].length < 80 && !/[.!?]$/.test(ls[0]) ? ls[0] : '';
  const generic = (text.match(/\b((?:senior |junior |associate |assistant |graduate |trainee |full[- ]stack |front[- ]?end |back[- ]?end |software |data |ml |mobile |devops |cloud |mechanical |civil |electrical |design |production |quality |process |sales |marketing |financial |business |hr |operations |product )*(?:engineer|developer|intern|analyst|scientist|manager|executive|associate|consultant|designer|accountant|officer|specialist|trainee)(?: intern| trainee)?)\b/i) || [])[1] || '';
  const titleGuess = (titleLine && titleLine.replace(/^[^:–-]+[:–-]\s*/, '')) || firstLine || generic;
  const company = ((text.match(/\b(?:at|join)[ \t]+([A-Z][A-Za-z0-9&]+(?:[ \t][A-Z][A-Za-z0-9&]+){0,2})/) || text.match(/About[ \t]+([A-Z][A-Za-z0-9&]+(?:[ \t][A-Z][A-Za-z0-9&]+){0,2})/) || [])[1] || '').replace(/\s+(Is|As|And|We|In|To)$/, '');
  return {
    keywords: list,
    years: yrs && !fresher ? Number(yrs[1]) : null,
    fresher,
    degree: level ? { level, fields } : null,
    title: cleanTitle(titleGuess),
    company: /^(the|our|a|an|us)$/i.test(company) ? '' : company,
    words: text.split(/\s+/).filter(Boolean).length,
  };
}
const cleanTitle = (s) => String(s || '').replace(/\s+/g, ' ').trim().replace(/^\w/, (c) => c.toUpperCase());

// all resume text, plus separate "evidence" text (experience/projects bullets) and skills text
export function resumeTexts(resume) {
  const d = resume.data;
  const hidden = resume.hidden || {};
  const show = (k) => !hidden[k];
  const skills = show('skills') ? d.skills.map((s) => `${s.group}: ${s.items}`).join('\n') : '';
  const evidence = [
    ...(show('experience') ? d.experience.flatMap((e) => [e.role, e.tech, ...lines(e.bullets)]) : []),
    ...(show('projects') ? d.projects.flatMap((p) => [p.name, p.tech, ...lines(p.bullets)]) : []),
    ...(show('achievements') ? d.achievements.map((a) => a.text) : []),
    ...(show('custom') ? d.custom.map((c) => c.content) : []),
  ].join('\n');
  const other = [show('summary') ? d.summary : '', ...(show('education') ? d.education.map((e) => `${e.degree} ${e.details}`) : []), ...(show('certifications') ? d.certifications.map((c) => `${c.name} ${c.issuer}`) : [])].join('\n');
  return { skills, evidence, other, all: [skills, evidence, other].join('\n') };
}

// Is this mostly a software resume? (decides a few field-specific tips, e.g. GitHub)
export function detectField(resume) {
  let tech = 0;
  let other = 0;
  findKeywords(resumeTexts(resume).all).forEach((_, name) => {
    const c = keywordCat(name);
    if (TECH_CATS.has(c)) tech++;
    else if (c !== 'Soft skills' && c !== 'Concepts' && c !== 'Tools') other++;
  });
  return tech >= 4 && tech >= other ? 'tech' : 'general';
}

// months of experience from dated entries
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function toMonth(s, now) {
  const v = String(s || '').toLowerCase();
  if (!v) return null;
  if (/present|current|now|till/.test(v)) return now;
  const y = v.match(/(19|20)\d{2}/);
  if (!y) return null;
  const m = v.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
  const mm = v.match(/\b(\d{1,2})\/(19|20)\d{2}/);
  return Number(y[0]) * 12 + (m ? MONTHS[m[1]] : mm ? Number(mm[1]) - 1 : 0);
}
export function experienceMonths(resume) {
  const now = new Date().getFullYear() * 12 + new Date().getMonth();
  return resume.data.experience.reduce((sum, e) => {
    const a = toMonth(e.start, now);
    const b = toMonth(e.end, now) ?? a;
    return a != null && b != null && b >= a ? sum + Math.min(b - a + 1, 600) : sum;
  }, 0);
}

// Compare a resume with an analysed job, the way ATS rank candidates:
// hard skills, soft skills, job title, education and experience level.
export function matchResume(resume, job) {
  const t = resumeTexts(resume);
  const d = resume.data;
  const matched = [];
  const missing = [];
  const skillsOnly = [];
  const part = { hard: { got: 0, total: 0 }, soft: { got: 0, total: 0 } };
  job.keywords.forEach((k) => {
    const ev = termCount(t.evidence, k);
    const sk = termCount(t.skills, k);
    const ot = termCount(t.other, k);
    const p = part[k.type];
    p.total += k.weight;
    if (ev || sk || ot) {
      // only in the skills list counts a little less than proven in a bullet
      p.got += k.weight * (ev || ot ? 1 : 0.8);
      matched.push({ ...k, inResume: ev + sk + ot, where: ev ? 'experience' : sk ? 'skills' : 'other' });
      if (!ev && sk && k.type === 'hard') skillsOnly.push(k);
    } else missing.push({ ...k, inResume: 0 });
  });
  const pctOf = (p) => (p.total ? Math.round((p.got / p.total) * 100) : null);
  const hard = pctOf(part.hard);
  const soft = pctOf(part.soft);

  // job title: exact phrase anywhere, else most of its significant words in roles/summary/headline
  const core = String(job.title || '')
    .replace(/\s[-–|(].*$/, '')
    .replace(/\b(senior|sr|junior|jr|lead|associate|i{1,3}|\d)\b\.?/gi, '')
    .trim();
  const coreWords = normWords(core).filter((w) => !STOP.has(w));
  const roleText = [d.summary, ...d.experience.map((e) => e.role), ...d.projects.map((p) => p.name), d.header.name].join(' \n ');
  let title = null;
  if (coreWords.length) {
    const exact = normText(t.all + ' ' + roleText).includes(` ${coreWords.join(' ')} `);
    const rt = normText(roleText);
    const share = coreWords.filter((w) => rt.includes(` ${w} `)).length / coreWords.length;
    title = { title: core, exact, score: exact ? 100 : Math.round(share * 70) };
  }

  // education
  let education = null;
  if (job.degree) {
    const edText = d.education.map((e) => `${e.degree} ${e.school} ${e.details}`).join(' ');
    const lvl = degreeLevel(edText);
    const levelOk = lvl && LEVEL_RANK[lvl] >= LEVEL_RANK[job.degree.level];
    const fieldOk = !job.degree.fields.length || job.degree.fields.some((f) => normText(edText).includes(` ${normWords(f).join(' ')} `));
    education = { want: job.degree, have: lvl, levelOk: !!levelOk, fieldOk, score: (levelOk ? 60 : lvl ? 20 : 0) + (fieldOk ? 40 : 0) };
  }

  // experience level
  let years = null;
  if (job.years) {
    const months = experienceMonths(resume);
    years = { want: job.years, months, score: Math.min(100, Math.round((months / (job.years * 12)) * 100)) };
  }

  // weighted match rate (missing parts are re-normalised)
  const parts = [
    [hard, 60],
    [soft, 10],
    [title?.score ?? null, 15],
    [education?.score ?? null, 10],
    [years?.score ?? null, 5],
  ].filter(([v]) => v != null);
  const wsum = parts.reduce((a, [, w]) => a + w, 0);
  const score = wsum ? Math.round(parts.reduce((a, [v, w]) => a + v * w, 0) / wsum) : 0;
  return { score, hard, soft, title, education, years, matched, missing, skillsOnly, total: job.keywords.length };
}
