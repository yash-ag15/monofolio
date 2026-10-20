// Filling the Dev Identity profile from an imported resume.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoResumeData, resumeDataFromProfile } from '../src/resume/model.js';
import { mergeProfile, profileFromResume } from '../src/profile/import.js';

const blankProfile = () => ({
  basics: { name: '', headline: '', tagline: '', location: '', email: '', phone: '', website: '', avatar: '', about: '', availability: '', resumeUrl: '' },
  socials: [], skills: [], experience: [], education: [], projects: [], certifications: [], achievements: [], custom: [],
});

test('maps resume fields onto the profile', () => {
  const p = profileFromResume(demoResumeData());
  assert.equal(p.basics.name, 'Mugiwara Luffy');
  assert.equal(p.basics.headline, 'Software Engineering Intern', 'headline comes from the latest role');
  assert.equal(p.basics.location, 'Indore, India');
  assert.deepEqual(p.socials.map((s) => s.label), ['GitHub', 'LinkedIn']);
  assert.ok(p.socials.every((s) => s.url.startsWith('https://')), 'links become full URLs');
  assert.equal(p.projects.length, 3);
  assert.equal(p.projects[0].name, 'CampusCart');
});

test('a project’s first bullet becomes its description (round trip with the resume builder)', () => {
  const p = profileFromResume(demoResumeData());
  const back = resumeDataFromProfile({ ...blankProfile(), ...p, basics: { ...blankProfile().basics, ...p.basics } });
  assert.equal(back.projects[0].bullets, demoResumeData().projects[0].bullets);
});

test('"add what’s missing" fills an empty profile and never duplicates', () => {
  const incoming = profileFromResume(demoResumeData());
  const first = mergeProfile(blankProfile(), incoming, 'add');
  assert.equal(first.profile.basics.name, 'Mugiwara Luffy');
  assert.ok(first.added > 0);
  const again = mergeProfile(first.profile, incoming, 'add');
  assert.equal(again.added, 0, 'importing the same resume twice adds nothing');
  assert.equal(again.changed.length, 0);
  assert.equal(again.profile.projects.length, first.profile.projects.length);
});

test('"add" keeps what the user typed; "replace" lets the resume win', () => {
  const mine = { ...blankProfile(), basics: { ...blankProfile().basics, name: 'My Own Name' } };
  const incoming = profileFromResume(demoResumeData());
  assert.equal(mergeProfile(mine, incoming, 'add').profile.basics.name, 'My Own Name');
  assert.equal(mergeProfile(mine, incoming, 'replace').profile.basics.name, 'Mugiwara Luffy');
});
