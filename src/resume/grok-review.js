// Grok recruiter review for the ATS checker — complements the rule-based score with judgement:
// what a recruiter in the candidate's field would think, and concrete bullet rewrites.

import { grokJSON } from '../lib/grok.js';

const SYSTEM = `You are an experienced campus recruiter and ATS specialist who screens resumes for every field —
software, core engineering (mechanical, civil, electrical, chemical), finance, consulting, marketing, design and operations.
Review the resume honestly, as a recruiter at a well-known company would during a 30-second screen.
If a job description is given, judge fit for THAT job; otherwise judge it for the roles the resume targets.
Respond with ONE JSON object only:
{
  "field": "the field/role this resume targets, e.g. 'Mechanical design (GET)'",
  "score": 0-100,                       // overall shortlist likelihood
  "verdict": "one sentence a recruiter would say",
  "strengths": ["max 4, specific"],
  "improvements": [{"issue": "specific problem", "fix": "exact action to take"}],   // max 6, most important first
  "rewrites": [{"original": "exact bullet from the resume", "improved": "rewritten bullet", "why": "short reason"}],  // 3-5 weakest bullets
  "missingKeywords": ["skills/terms the target job expects that are absent — max 10"],
  "redFlags": ["anything that would get it rejected — empty if none"]
}
Score with this scale, so scores are consistent between resumes:
- 85–100: would be shortlisted at top companies — strong, quantified impact; relevant experience; clean and complete.
- 70–84: likely shortlisted — solid, with a few clear improvements.
- 50–69: borderline — relevant but weak bullets (duties, no numbers), gaps or formatting issues.
- 30–49: unlikely — little evidence of skills or impact, missing key sections.
- 0–29: would be rejected — no real experience/projects/education shown, or unprofessional.
Rules:
- Rewrites must keep the candidate's real facts. Never invent numbers, employers or tools; where a number is missing, use a placeholder like "[X%]" or "[N users]" for the candidate to fill in.
- Start every rewritten bullet with a strong past-tense verb; keep it to 1–2 lines.
- Be specific to the field; don't suggest GitHub or coding to non-software candidates.`;

export async function grokReview({ text, jd, signal }) {
  const user = [`RESUME (plain text as an ATS extracts it):\n${String(text).slice(0, 12000)}`, jd && jd.trim().length > 40 ? `JOB DESCRIPTION:\n${jd.slice(0, 8000)}` : 'No job description given.'].join('\n\n');
  const r = await grokJSON({ system: SYSTEM, user, temperature: 0.3, signal });
  const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);
  return {
    field: String(r.field || ''),
    score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))),
    verdict: String(r.verdict || ''),
    strengths: arr(r.strengths, 4).map(String),
    improvements: arr(r.improvements, 6).filter((x) => x && x.issue).map((x) => ({ issue: String(x.issue), fix: String(x.fix || '') })),
    rewrites: arr(r.rewrites, 6).filter((x) => x && x.improved).map((x) => ({ original: String(x.original || ''), improved: String(x.improved), why: String(x.why || '') })),
    missingKeywords: arr(r.missingKeywords, 10).map(String),
    redFlags: arr(r.redFlags, 5).map(String).filter(Boolean),
  };
}
