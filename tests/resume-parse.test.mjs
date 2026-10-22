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
