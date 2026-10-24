// Resume importer: turning text lines from a PDF / Word file into structured resume fields.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseResumeLines } from '../src/resume/parse.js';

// Simulates extracted lines: ALL-CAPS lines are headings; 4+ spaces separate columns (dates on the right).
const parse = (text) =>
  parseResumeLines(
    text
      .trim()
      .split('\n')
      .map((t) => ({ text: t.trim().replace(/ {4,}/g, '\t'), size: /^[A-Z &]+$/.test(t.trim()) ? 11 : 10 }))
  );

test("Jake's layout: company line, then role line", () => {
  const { data } = parse(`
    Riya Verma
    riya@mail.com | +91 98111 22233 | Pune, Maharashtra
    EXPERIENCE
    Razorpay    Jun 2025 – Aug 2025
    Software Engineering Intern    Bengaluru
    • Built payment retries
  `);
  assert.equal(data.header.name, 'Riya Verma');
  assert.equal(data.header.email, 'riya@mail.com');
  assert.equal(data.header.location, 'Pune, Maharashtra');
  assert.deepEqual(data.experience.map((e) => [e.company, e.role]), [['Razorpay', 'Software Engineering Intern']]);
});

test('skill rows like "Languages: Java, Go" stay in the skills section', () => {
  const { data } = parse(`
    Riya Verma
    riya@mail.com
    TECHNICAL SKILLS
    Languages: Java, Go
    Developer Tools: Git, Docker
    LANGUAGES
    English, Hindi
  `);
  assert.deepEqual(data.skills.map((s) => s.group), ['Languages', 'Developer Tools']);
  assert.deepEqual(data.custom.map((c) => c.title.toLowerCase()), ['languages'], 'a bare "LANGUAGES" heading is its own section');
});

test('role and company on one line', () => {
  const { data } = parse(`
    Arjun Rao
    arjun@mail.com
    EXPERIENCE
    Backend Developer at Swiggy    2024 – Present
    • Scaled order APIs
    Android Developer Intern, Zomato    2023
    • Offline tracking
    Data Analyst — Flipkart    2022 – 2023
    • Dashboards
    Google, Bangalore    2021
    • Things
  `);
  const pairs = data.experience.map((e) => [e.role, e.company]);
  assert.deepEqual(pairs[0], ['Backend Developer', 'Swiggy'], '"Role at Company"');
  assert.deepEqual(pairs[1], ['Android Developer Intern', 'Zomato'], '"Role, Company"');
  assert.deepEqual(pairs[2], ['Data Analyst', 'Flipkart'], '"Role — Company"');
  assert.deepEqual(pairs[3], ['', 'Google, Bangalore'], '"Company, City" is not split');
  assert.equal(data.header.location, '', 'a city inside the experience section is not the person’s location');
});

test('an empty file explains what went wrong', () => {
  const r = parseResumeLines([]);
  assert.match(r.warnings[0], /No text found/);
});

test('a bullet wrapping onto a capitalised line stays one bullet, not a new project', () => {
  const { data } = parse(`
    Meera Iyer
    meera@mail.com
    PROJECTS
    Weather Dashboard | Vue, Flask | Preview
    – Built a dashboard that shows hourly forecasts for any city, refreshing every few minutes from the
    OpenWeather API.
    – Added saved locations.
    Library Manager | Java, SQLite
    – Wrote a desktop app for issuing and returning books with due-date reminders and fines kept in a local
    SQLite database.
  `);
  assert.deepEqual(data.projects.map((p) => [p.name, p.tech]), [['Weather Dashboard', 'Vue, Flask'], ['Library Manager', 'Java, SQLite']]);
  assert.equal(data.projects[0].bullets.split('\n').length, 2);
  assert.match(data.projects[0].bullets, /from the OpenWeather API\./);
});

test('a bullet glyph on its own line: tech-stack line becomes the tech, degree line stays in the header', () => {
  const { data } = parse(`
    Kabir Shah
    kabir@mail.com
    EDUCATION
    Sample University    Springfield, USA
    •
    Bachelor of Science in Physics (GPA: 3.6)    2020 – 2024
    PROJECTS
    Recipe Finder
    •
    Python, Django, Redis
    • Indexed 5,000 recipes so searches return in under a second.
  `);
  assert.deepEqual(data.education.map((e) => [e.school, e.degree]), [['Sample University', 'Bachelor of Science in Physics']]);
  assert.deepEqual(data.projects.map((p) => [p.name, p.tech, p.bullets]), [['Recipe Finder', 'Python, Django, Redis', 'Indexed 5,000 recipes so searches return in under a second.']]);
});

test('a first bullet that is a sentence with commas is not mistaken for a tech stack', () => {
  const { data } = parse(`
    Ana Das
    ana@mail.com
    PROJECTS
    Expense Tracker
    • Designed schemas, wrote APIs and shipped dashboards
  `);
  assert.equal(data.projects[0].tech, '');
  assert.equal(data.projects[0].bullets, 'Designed schemas, wrote APIs and shipped dashboards');
});

// Lines as a PDF of an HTML/Word resume gives them: no bullet characters — bullets are drawn as graphics —
// so bullet text is only recognisable by its indent (x) and where each line ends (right).
const L = (text, x, right, size = 10) => ({ text, x, right, size, urls: [] });

test('bullets without bullet characters are found by indentation; wrapped lines are joined', () => {
  const { data } = parseResumeLines([
    L('Riya Verma', 220, 380, 22),
    L('riya@mail.com', 240, 360),
    L('EXPERIENCE', 32, 110, 12),
    L('Backend Developer Intern, Northwind Labs\tJun 2025 – Aug 2025', 41, 580),
    L('Remote', 41, 72),
    L('Built an order service in Go that handles payment retries and webhooks for every partner across', 54, 566),
    L('Southeast Asia.', 54, 130),
    L('Cut p95 latency by 40% by caching hot product lookups', 54, 360),
    L('PROJECTS', 32, 100, 12),
    L('Weather Dashboard | Vue, Flask\tView Project', 41, 580),
    L('Designed a dashboard showing hourly forecasts for any city, with saved places kept in browser Local-', 54, 570),
    L('Storage between visits.', 54, 160),
    L('Added offline support.', 54, 170),
  ]);
  assert.deepEqual(data.experience.map((e) => [e.role, e.company, e.location]), [['Backend Developer Intern', 'Northwind Labs', 'Remote']]);
  assert.deepEqual(data.experience[0].bullets.split('\n'), ['Built an order service in Go that handles payment retries and webhooks for every partner across Southeast Asia.', 'Cut p95 latency by 40% by caching hot product lookups']);
  assert.deepEqual(data.projects.map((p) => [p.name, p.tech, p.bullets.split('\n').length]), [['Weather Dashboard', 'Vue, Flask', 2]]);
});

test('a bullet that ends mid-sentence near the margin is still a new bullet when the next line starts with an action verb', () => {
  const { data } = parseResumeLines([
    L('Ana Das', 220, 380, 22),
    L('PROJECTS', 32, 100, 12),
    L('Chat App | Node.js', 41, 580),
    L('Implemented token-based authentication for the REST API and the realtime socket connection', 54, 575),
    L('Developed group chats and read receipts', 54, 300),
  ]);
  assert.equal(data.projects[0].bullets.split('\n').length, 2);
});

test('dates with a day ("20 May 2025 – 20 Jul 2025") and a "Scholastic Achievements" heading are understood', () => {
  const { data } = parse(`
    Kabir Shah
    kabir@mail.com
    EXPERIENCE
    Data Analyst Intern, Contoso    20 May 2025 – 20 Jul 2025
    • Built dashboards
    SCHOLASTIC ACHIEVEMENTS
    • Ranked in the top 1% of a national science olympiad
  `);
  assert.deepEqual(data.experience.map((e) => [e.role, e.company, e.start, e.end]), [['Data Analyst Intern', 'Contoso', '20 May 2025', '20 Jul 2025']]);
  assert.equal(data.achievements.length, 1);
});
