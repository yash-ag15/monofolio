// AI suggestions for tailoring a resume to a job description: what to add, rewrite and highlight.
// Suggestions only — the user picks which to use. Facts are never invented.

import { grokJSON } from '../lib/grok.js';
import { lines } from './model.js';

const SYSTEM = `You are a senior recruiter and resume coach for students and early-career candidates in every field (software, core engineering, finance, marketing, design, operations).
You get a candidate's resume (JSON) and a job description. Suggest the most valuable changes to tailor THIS resume to THIS job.
Respond with ONE JSON object only:
{
  "fit": "one honest sentence on how well the candidate fits today",
  "score": 0-100,
  "summary": "a 2–3 line professional summary for this job, using only facts from the resume",
  "rewrites": [{ "entry": "exact company or project name from the resume", "original": "an existing bullet, copied EXACTLY", "improved": "the rewritten bullet", "why": "short reason" }],
  "newBullets": [{ "entry": "exact company or project name", "bullet": "a new bullet the candidate could add", "why": "short reason" }],
  "skills": [{ "skill": "a skill the job wants", "why": "where the resume suggests they have it" }],
  "highlight": ["what to move up or emphasise, and why"],
  "gaps": ["job requirements the resume cannot show yet, with a tip to address each"]
}
Rules:
- NEVER invent employers, projects, tools, degrees or numbers. Rewrites keep the original facts; where a number would help but isn't known, use a placeholder like [X%], [N users] or [time saved].
- Rewrites: 3–6 of the bullets most relevant to the job — reword to use the job's language and keywords naturally, start with a strong past-tense verb, 1–2 lines.
- newBullets: 2–4 ideas the candidate could truthfully add based on what their entries suggest (e.g. a tool listed in a project's tech stack but never described). Use placeholders for unknown numbers.
- skills: only skills the job asks for that the resume already implies (e.g. used in a project) but doesn't list. Max 6.
- Be specific to the field and the job; no generic advice.`;

// the resume, compact, as the AI sees it
function resumeForAi(resume) {
  const d = resume.data;
  const hidden = resume.hidden || {};
  return {
    education: hidden.education ? [] : d.education.map((e) => ({ school: e.school, degree: e.degree, end: e.end, score: e.score })),
    experience: hidden.experience ? [] : d.experience.map((e) => ({ company: e.company, role: e.role, tech: e.tech, dates: [e.start, e.end].filter(Boolean).join(' – '), bullets: lines(e.bullets) })),
    projects: hidden.projects ? [] : d.projects.map((p) => ({ name: p.name, tech: p.tech, bullets: lines(p.bullets) })),
    skills: hidden.skills ? [] : d.skills.map((s) => `${s.group ? `${s.group}: ` : ''}${s.items}`),
    achievements: hidden.achievements ? [] : d.achievements.map((a) => a.text),
    certifications: hidden.certifications ? [] : d.certifications.map((c) => c.name),
    summary: hidden.summary ? '' : d.summary,
  };
}

export async function grokTailor({ resume, jd, signal }) {
  const user = `JOB DESCRIPTION:\n${String(jd).slice(0, 8000)}\n\nRESUME (JSON):\n${JSON.stringify(resumeForAi(resume))}`;
  const r = await grokJSON({ system: SYSTEM, user, temperature: 0.3, maxTokens: 3000, signal });
  const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);
  const allBullets = [...resume.data.experience, ...resume.data.projects].flatMap((e) => lines(e.bullets));
  return {
    fit: String(r.fit || ''),
    score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))),
    summary: String(r.summary || '').trim(),
    // keep only rewrites of bullets that really exist, so applying them is safe
    rewrites: arr(r.rewrites, 6)
      .filter((x) => x && x.improved && allBullets.some((b) => norm(b) === norm(x.original)))
      .map((x) => ({ entry: String(x.entry || ''), original: String(x.original), improved: String(x.improved), why: String(x.why || '') })),
    newBullets: arr(r.newBullets, 4)
      .filter((x) => x && x.bullet)
      .map((x) => ({ entry: String(x.entry || ''), bullet: String(x.bullet), why: String(x.why || '') })),
    skills: arr(r.skills, 6)
      .filter((x) => x && x.skill)
      .map((x) => ({ skill: String(x.skill).trim(), why: String(x.why || '') })),
    highlight: arr(r.highlight, 4).map(String),
    gaps: arr(r.gaps, 5).map(String),
  };
}

export const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
