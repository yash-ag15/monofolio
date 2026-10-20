// ATS checker and job-description keyword matching.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoResumeData, emptyResumeData, newResume } from '../src/resume/model.js';
import { analyzeJob, matchResume } from '../src/resume/keywords.js';
import { checkResume } from '../src/resume/ats.js';

const JD = `Software Engineer Intern
Requirements:
- Strong in React and Node.js
- Experience with PostgreSQL and Docker
- Knowledge of Kubernetes is a plus`;

test('finds the skills a job post asks for', () => {
  const names = analyzeJob(JD).keywords.map((k) => k.name);
  for (const k of ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes']) assert.ok(names.includes(k), `${k} detected`);
});

test('matches a resume against the job and lists what is missing', () => {
  const m = matchResume(newResume({ data: demoResumeData() }), analyzeJob(JD));
  const missing = m.missing.map((k) => k.name ?? k);
  assert.ok(missing.includes('Kubernetes'));
  assert.ok(!missing.includes('React'));
  assert.ok(m.score > 70 && m.score <= 100, `score ${m.score}`);
});

test('a complete resume scores well; an empty one scores low', () => {
  const full = checkResume(newResume({ data: demoResumeData() })).score;
  const empty = checkResume(newResume({ data: emptyResumeData() })).score;
  assert.ok(full >= 85, `complete resume: ${full}`);
  assert.ok(empty < 60, `empty resume: ${empty}`);
});

test('with a job description, the score includes keyword match', () => {
  const r = checkResume(newResume({ data: demoResumeData() }), { jd: JD });
  assert.ok(r.match, 'match details are returned');
  assert.ok(r.score >= 0 && r.score <= 100);
});
