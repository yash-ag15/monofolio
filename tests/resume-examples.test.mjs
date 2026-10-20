// Resume preview examples: the sample fills only the parts the user hasn't written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyResumeData, newResume } from '../src/resume/model.js';
import { showExamples, withExamples } from '../src/resume/examples.js';
import { renderResumeHtml } from '../src/resume/templates.js';

const strip = (s) => String(s).replace(/[\u2063\u2064]/g, '');

test('an empty resume shows the whole sample', () => {
  const { resume, used } = withExamples(newResume({ data: emptyResumeData() }));
  assert.ok(used);
  assert.equal(resume.data.header.name, 'Mugiwara Luffy');
  assert.ok(resume.data.experience.length > 0);
});

test('what the user typed wins; everything else stays as the example', () => {
  const data = emptyResumeData();
  data.header.name = 'Priya Sharma';
  data.education = [{ school: 'IIT Delhi', degree: '', start: '', end: '', location: '', score: '', details: '' }];
  const { resume } = withExamples(newResume({ data }));
  assert.equal(resume.data.header.name, 'Priya Sharma');
  assert.equal(resume.data.education.length, 1, 'a started section keeps only the user’s entries');
  assert.equal(resume.data.education[0].school, 'IIT Delhi');
  assert.match(strip(resume.data.education[0].degree), /Computer Science/, 'missing fields borrow the example');
  assert.ok(resume.data.projects.length > 0, 'untouched sections still show the example');
});

test('a complete resume needs no examples', () => {
  const full = withExamples(newResume()); // newResume() defaults to the sample data
  assert.equal(full.used, false);
});

test('the preview marks examples, and the original data is untouched', () => {
  const r = newResume({ data: emptyResumeData() });
  const html = showExamples(renderResumeHtml(withExamples(r).resume));
  assert.match(html, /<span class="ex">/);
  assert.doesNotMatch(html, /[\u2063\u2064]/, 'no invisible markers left');
  assert.equal(r.data.header.name, '', 'downloads still see an empty resume');
});
