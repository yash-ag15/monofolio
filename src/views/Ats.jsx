import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon, Seg, useToast } from '../components/ui.jsx';
import { newResume } from '../resume/model.js';
import { renderResumeText } from '../resume/templates.js';
import { extractResumeLines, parseResumeLines } from '../resume/parse.js';
import { checkResume, scoreLabel, scoreNote } from '../resume/ats.js';
import { GrokReviewCard } from '../components/Grok.jsx';

export const JD_KEY = 'monofolio:jd';
export const loadJd = () => {
  try {
    return localStorage.getItem(JD_KEY) || '';
  } catch {
    return '';
  }
};
export const saveJd = (v) => {
  try {
    localStorage.setItem(JD_KEY, v);
  } catch {
    /* storage unavailable */
  }
};

export function ScoreRing({ value, size = 132, label, stroke = 6 }) {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--fg)" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .7s ease' }} />
      </svg>
      <div className="ring-in">
        <b>{value}</b>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}

export const StatusIcon = ({ s }) => <span className={`st st-${s}`}>{s === 'pass' ? <Icon name="check" /> : s === 'warn' ? <Icon name="alert" /> : <Icon name="x" />}</span>;
const statusOf = (score, max) => (score / max >= 0.85 ? 'pass' : score / max >= 0.55 ? 'warn' : 'fail');
const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Ats({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const resumes = state.resumes || [];
  const [mode, setMode] = useState(resumes.length ? 'builder' : 'upload');
  const [rid, setRid] = useState(state.activeResume || resumes[0]?.id || '');
  const [upload, setUpload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [jd, setJd] = useState(loadJd);

  useEffect(() => saveJd(jd), [jd]);

  const resume = mode === 'builder' ? resumes.find((r) => r.id === rid) || resumes[0] : upload?.resume;
  const result = useMemo(() => (resume ? checkResume(resume, { jd, source: mode === 'builder' ? { kind: 'builder' } : upload.source }) : null), [resume, jd, mode, upload]);
  useEffect(() => {
    if (result) dispatch({ type: 'milestone', key: 'atsChecked' });
  }, [!!result]); // eslint-disable-line react-hooks/exhaustive-deps

  const readFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const ls = await extractResumeLines(file);
      const parsed = parseResumeLines(ls);
      const r = newResume({ name: file.name.replace(/\.[^.]+$/, ''), data: parsed.data });
      r.hidden = {};
      setUpload({ resume: r, name: file.name, source: { kind: 'upload', fileType: file.name.split('.').pop().toLowerCase(), rawText: ls.map((l) => l.text.replace(/\t/g, '   ')).join('\n'), found: parsed.found } });
    } catch (e) {
      setError(e.message || 'Could not read that file.');
      setUpload(null);
    } finally {
      setBusy(false);
    }
  };

  const openInBuilder = () => {
    if (mode === 'builder') dispatch({ type: 'resumes/set', items: resumes, active: resume.id });
    else {
      const r = { ...upload.resume, hidden: { summary: !upload.resume.data.summary } };
      dispatch({ type: 'resumes/set', items: [...resumes, r], active: r.id });
      toast('Added to the Resume builder — pick a single-column template there');
    }
    go('resume');
  };

  const job = result?.job;

  return (
    <div className="page ats-page">
      <header className="ats-hero">
        <div className="eyebrow">ATS Checker</div>
        <h1>See your resume the way hiring software does.</h1>
        <p>The same things applicant-tracking systems and recruiters look at — readability, sections, measurable impact, skills and keyword match — for any field: software, core engineering, finance, marketing, design or operations.</p>
        <div className="hero-chips">
          <span>
            <Icon name="check" /> Any role or industry
          </span>
          <span>
            <Icon name="check" /> Rule checks run on your device
          </span>
          <span>
            <Icon name="check" /> Specific fixes, not just a number
          </span>
        </div>
      </header>

      <section className="ats-setup">
        <div className="setup-step">
          <div className="step-head">
            <span className="step-n">1</span>
            <div>
              <h3>Your resume</h3>
              <p>One you built here, or upload a PDF / DOCX.</p>
            </div>
          </div>
          <Seg value={mode} onChange={setMode} options={[{ value: 'builder', label: 'Built here' }, { value: 'upload', label: 'Upload a file' }]} />
          {mode === 'builder' &&
            (resumes.length ? (
              <select className="select" value={resume?.id || ''} onChange={(e) => setRid(e.target.value)} aria-label="Resume to check">
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            ) : (
              <button className="btn secondary" onClick={() => go('resume')}>
                Build your first resume
              </button>
            ))}
          {mode === 'upload' && (
            <label
              className={`drop-row ${busy ? 'busy' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                readFile(e.dataTransfer.files[0]);
              }}
            >
              <Icon name="upload" size={20} />
              <span>
                <b>{busy ? 'Reading…' : upload ? upload.name : 'Choose or drop a file'}</b>
                <small>{upload ? 'Drop another file to re-check' : 'PDF, DOCX or TXT · never leaves your browser'}</small>
              </span>
              <input type="file" accept=".pdf,.docx,.txt" hidden onChange={(e) => { readFile(e.target.files[0]); e.target.value = ''; }} />
            </label>
          )}
          {error && <div className="contrast bad">{error}</div>}
        </div>
        <div className="setup-step">
          <div className="step-head">
            <span className="step-n">2</span>
            <div>
              <h3>
                Target job <em>optional · recommended</em>
              </h3>
              <p>Paste the job post to get your match rate — what a company’s ATS ranks applicants by.</p>
            </div>
          </div>
          <textarea className="textarea" rows={6} placeholder="Paste the full job description: title, responsibilities, requirements, nice-to-haves…" value={jd} onChange={(e) => setJd(e.target.value)} />
          {job && (
            <div className="detected">
              <span>Detected</span>
              {job.title && <b>{job.title}</b>}
              {job.company && <b>{job.company}</b>}
              <b>{job.keywords.length} keywords</b>
              {job.degree && <b>{job.degree.level === 'bachelor' ? "Bachelor's" : job.degree.level === 'master' ? "Master's" : job.degree.level} required</b>}
              {job.years && <b>{job.years}+ yrs</b>}
            </div>
          )}
        </div>
      </section>

      {!result && (
        <div className="report-empty">
          <Icon name="file" size={26} />
          <b>Your report will appear here</b>
          <span>{mode === 'upload' ? 'Upload your resume to start.' : 'Choose a resume to start.'}</span>
        </div>
      )}

      {result && (
        <section className="ats-report">
          <aside className="report-side">
            <div className="score-card">
              <div className="lbl-sm">{result.match ? 'ATS score for this job' : 'ATS readiness'}</div>
              <ScoreRing value={result.score} size={164} stroke={8} label="out of 100" />
              <h2>{scoreLabel(result.score)}</h2>
              <p>{scoreNote(result.score, !!result.match)}</p>
              {result.match && (
                <div className="sub-scores">
                  <div>
                    <span>Job match</span>
                    <div className="bar">
                      <i style={{ width: `${result.match.score}%` }} />
                    </div>
                    <b>{result.match.score}%</b>
                  </div>
                  <div>
                    <span>Resume readiness</span>
                    <div className="bar">
                      <i style={{ width: `${result.readiness}%` }} />
                    </div>
                    <b>{result.readiness}</b>
                  </div>
                </div>
              )}
            </div>
            <nav className="cat-nav" aria-label="Report sections">
              <button onClick={() => jump('r-grok')}>
                <span className="st st-pass">
                  <Icon name="sparkle" />
                </span>
                <span>Recruiter review</span>
                <b>AI</b>
              </button>
              {result.match && (
                <button onClick={() => jump('r-match')}>
                  <StatusIcon s={statusOf(result.match.score, 100)} />
                  <span>Job match</span>
                  <b>{result.match.score}%</b>
                </button>
              )}
              {result.categories.map((c) => (
                <button key={c.id} onClick={() => jump(`r-${c.id}`)}>
                  <StatusIcon s={c.issues ? statusOf(c.score, c.max) : 'pass'} />
                  <span>{c.label}</span>
                  <b>
                    {c.score}/{c.max}
                  </b>
                </button>
              ))}
              {result.bullets.length > 0 && (
                <button onClick={() => jump('r-bullets')}>
                  <StatusIcon s={result.stats.quantified >= 50 && result.stats.verbs >= 80 ? 'pass' : 'warn'} />
                  <span>Bullet review</span>
                  <b>{result.bullets.filter((b) => !b.flags.length).length}/{result.bullets.length}</b>
                </button>
              )}
            </nav>
            <button className="btn secondary side-btn" onClick={openInBuilder}>
              <Icon name="file" /> {mode === 'builder' ? 'Fix in Resume builder' : 'Open in Resume builder'}
            </button>
          </aside>

          <div className="report-main">
            <div className="stat-tiles">
              <Tile label="Keyword match" value={result.match ? `${result.match.matched.length}/${result.match.total}` : '—'} note={result.match ? 'job keywords found' : 'add a job post'} />
              <Tile label="Measurable results" value={`${result.stats.quantified}%`} note="of bullets have a number" />
              <Tile label="Action verbs" value={`${result.stats.verbs}%`} note="of bullets start strong" />
              <Tile label="Length" value={result.words} note="words" />
            </div>

            <GrokReviewCard
              key={resume.id + (mode === 'upload' ? upload.name : '')}
              text={mode === 'builder' ? renderResumeText(resume) : upload.source.rawText}
              jd={jd}
              onCopy={(t) => {
                try {
                  navigator.clipboard.writeText(t);
                  toast('Copied — paste it into the bullet in the Resume builder');
                } catch {
                  toast('Couldn’t copy — select the text instead');
                }
              }}
            />

            {result.match ? <MatchCard result={result} jd={jd} go={go} /> : <JobCta />}

            {result.categories.map((c) => (
              <CategoryCard key={c.id} cat={c} checks={result.checks.filter((x) => x.cat === c.id)} />
            ))}

            {result.bullets.length > 0 && <BulletCard bullets={result.bullets} />}

            <details className="r-card ats-plain">
              <summary>
                <span>What the ATS reads</span>
                <small>The plain text a parser extracts from your resume</small>
              </summary>
              <pre>{mode === 'builder' ? renderResumeText(resume) : upload.source.rawText}</pre>
            </details>
          </div>
        </section>
      )}
    </div>
  );
}

const Tile = ({ label, value, note }) => (
  <div className="tile">
    <span>{label}</span>
    <b>{value}</b>
    <small>{note}</small>
  </div>
);

function JobCta() {
  return (
    <div className="r-card job-cta" id="r-match">
      <Icon name="target" size={22} />
      <div>
        <b>Add a job description to see your match rate</b>
        <p>Company ATS rank applicants by how well a resume matches the job: required skills, job title, education and experience. Paste a job post in step 2 above.</p>
      </div>
    </div>
  );
}

function MatchCard({ result, jd, go }) {
  const m = result.match;
  const job = result.job;
  const [tab, setTab] = useState('hard');
  const rows = [
    m.hard != null && { s: statusOf(m.hard, 100), label: 'Hard skills', value: `${m.hard}%`, detail: `${m.matched.filter((k) => k.type === 'hard').length} of ${job.keywords.filter((k) => k.type === 'hard').length} skills, tools and qualifications from the post` },
    m.soft != null && { s: statusOf(m.soft, 100), label: 'Soft skills', value: `${m.soft}%`, detail: `${m.matched.filter((k) => k.type === 'soft').length} of ${job.keywords.filter((k) => k.type === 'soft').length} — show them through achievements, not adjectives` },
    m.title && { s: m.title.exact ? 'pass' : m.title.score >= 50 ? 'warn' : 'fail', label: 'Job title', value: m.title.exact ? 'Found' : 'Not found', detail: m.title.exact ? `“${m.title.title}” appears in your resume.` : `Recruiters search by title. Add “${m.title.title}” to your summary or headline if it fits you.` },
    m.education && { s: m.education.levelOk && m.education.fieldOk ? 'pass' : m.education.levelOk || m.education.fieldOk ? 'warn' : 'fail', label: 'Education', value: m.education.levelOk && m.education.fieldOk ? 'Meets' : 'Check', detail: `Asks for ${m.education.want.level === 'bachelor' ? "a bachelor's" : m.education.want.level === 'master' ? "a master's" : m.education.want.level}${m.education.want.fields.length ? ` in ${m.education.want.fields.slice(0, 3).join(' / ')}` : ''}. ${m.education.levelOk && m.education.fieldOk ? 'Your degree matches.' : 'Make sure your degree name and field are written out in full.'}` },
    m.years && { s: statusOf(m.years.score, 100), label: 'Experience level', value: `${(m.years.months / 12).toFixed(1)} / ${m.years.want} yrs`, detail: m.years.score >= 100 ? 'You meet the experience requirement.' : 'Counted from dated roles. Internships and part-time work count — date them all.' },
  ].filter(Boolean);
  const list = [...m.matched, ...m.missing].filter((k) => k.type === tab).sort((a, b) => (a.inResume ? 1 : 0) - (b.inResume ? 1 : 0) || b.weight - a.weight);
  const hasSoft = job.keywords.some((k) => k.type === 'soft');
  return (
    <section className="r-card" id="r-match">
      <div className="r-head">
        <div>
          <h3>Job match</h3>
          <p>
            How {job.company || 'the company'}’s ATS would likely rank you{job.title ? ` for ${job.title}` : ''}.
          </p>
        </div>
        <div className="r-score">
          <b>{m.score}%</b>
          <div className="bar">
            <i style={{ width: `${m.score}%` }} />
          </div>
        </div>
      </div>
      <div className="match-rows">
        {rows.map((r) => (
          <div key={r.label} className="match-row">
            <StatusIcon s={r.s} />
            <b>{r.label}</b>
            <span className="val">{r.value}</span>
            <p>{r.detail}</p>
          </div>
        ))}
      </div>
      <div className="kw-head">
        <h4>Keywords from the job</h4>
        {hasSoft && <Seg value={tab} onChange={setTab} options={[{ value: 'hard', label: 'Hard skills' }, { value: 'soft', label: 'Soft skills' }]} />}
      </div>
      <div className="kw-table" role="table">
        <div className="kw-row kw-th" role="row">
          <span>Keyword</span>
          <span>Priority</span>
          <span>In job</span>
          <span>In resume</span>
          <span />
        </div>
        {list.map((k) => (
          <div key={k.name} className={`kw-row ${k.inResume ? '' : 'missing'}`} role="row">
            <span className="kw-name">
              {k.name}
              {k.where === 'skills' && k.type === 'hard' && <i title="Listed in Skills but not shown in any bullet">skills list only</i>}
            </span>
            <span className={`prio prio-${k.importance}`}>{k.importance === 'mentioned' ? 'mentioned' : k.importance}</span>
            <span className="mono">{k.count}</span>
            <span className="mono">{k.inResume || '—'}</span>
            <StatusIcon s={k.inResume ? 'pass' : 'fail'} />
          </div>
        ))}
        {!list.length && <p className="hint" style={{ padding: 14 }}>No {tab} skills detected in this job post.</p>}
      </div>
      <div className="r-foot">
        <p className="hint">Only add skills you really have. Keywords used inside a bullet count more than a bare list.</p>
        <button className="btn" onClick={() => { saveJd(jd); go('tailor'); }}>
          <Icon name="target" /> Tailor my resume to this job
        </button>
      </div>
    </section>
  );
}

function CategoryCard({ cat, checks }) {
  const [showPassed, setShowPassed] = useState(false);
  const issues = checks.filter((c) => c.status !== 'pass').sort((a, b) => (a.status === 'fail' ? 0 : 1) - (b.status === 'fail' ? 0 : 1) || b.weight - a.weight);
  const passed = checks.filter((c) => c.status === 'pass');
  return (
    <section className="r-card" id={`r-${cat.id}`}>
      <div className="r-head">
        <div>
          <h3>{cat.label}</h3>
          <p>{cat.desc}</p>
        </div>
        <div className="r-score">
          <b>
            {cat.score}
            <small>/{cat.max}</small>
          </b>
          <div className="bar">
            <i style={{ width: `${(cat.score / cat.max) * 100}%` }} />
          </div>
        </div>
      </div>
      {issues.length > 0 ? (
        <div className="check-list">
          {issues.map((c) => (
            <div key={c.id} className={`check-item ${c.status}`}>
              <StatusIcon s={c.status} />
              <div>
                <b>{c.title}</b>
                {c.detail && <p className="detail">{c.detail}</p>}
                {c.fix && (
                  <p className="fix">
                    <span>How to fix</span>
                    {c.fix}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="all-good">
          <StatusIcon s="pass" /> Everything here looks good.
        </div>
      )}
      {passed.length > 0 && (
        <>
          <button className="passed-toggle" onClick={() => setShowPassed(!showPassed)}>
            <Icon name="chevron" className={showPassed ? 'rot' : ''} /> {passed.length} passed check{passed.length > 1 ? 's' : ''}
          </button>
          {showPassed && (
            <div className="passed-list">
              {passed.map((c) => (
                <div key={c.id}>
                  <Icon name="check" /> {c.title}
                  {c.detail && <span> — {c.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function BulletCard({ bullets }) {
  const [all, setAll] = useState(false);
  const weak = bullets.filter((b) => b.flags.length);
  const shown = all ? bullets : weak;
  return (
    <section className="r-card" id="r-bullets">
      <div className="r-head">
        <div>
          <h3>Bullet review</h3>
          <p>
            Formula that works in every field: <b className="fg">action verb</b> + <b className="fg">what you did</b> + <b className="fg">how / with what</b> + <b className="fg">measurable result</b>.
          </p>
        </div>
        <div className="r-score">
          <b>
            {bullets.length - weak.length}
            <small>/{bullets.length}</small>
          </b>
          <span className="hint">strong</span>
        </div>
      </div>
      <div className="examples">
        <span>e.g.</span> “Reduced machining scrap by 18% by redesigning the fixture in SolidWorks.” · “Reconciled 1,200+ vendor invoices monthly in Tally, cutting closing time by 3 days.” · “Built a React dashboard used daily by 40+ analysts.”
      </div>
      <div className="bullet-list">
        {shown.map((b, i) => (
          <div key={i} className={`bullet-row ${b.flags.length ? '' : 'ok'}`}>
            <div className="bullet-where">{b.where}</div>
            <div>
              <div className="bullet-text">{b.text}</div>
              <div className="chips">
                {b.flags.length ? (
                  b.flags.map((f) => (
                    <span key={f.id} className="flag" title={f.tip}>
                      {f.label}
                    </span>
                  ))
                ) : (
                  <span className="flag ok">
                    <Icon name="check" /> strong
                  </span>
                )}
              </div>
              {b.flags[0] && <p className="tip">{b.flags[0].tip}</p>}
            </div>
          </div>
        ))}
        {!shown.length && (
          <div className="all-good">
            <StatusIcon s="pass" /> Every bullet starts with a verb and shows a result.
          </div>
        )}
      </div>
      <button className="passed-toggle" onClick={() => setAll(!all)}>
        <Icon name="chevron" className={all ? 'rot' : ''} /> {all ? 'Show only bullets to improve' : `Show all ${bullets.length} bullets`}
      </button>
    </section>
  );
}

// chip groups (used by the Tailor page)
export function KeywordGroups({ match, onToggle, picked }) {
  const req = match.missing.filter((k) => k.importance === 'required');
  const other = match.missing.filter((k) => k.importance !== 'required');
  return (
    <div className="kw-groups">
      <div>
        <div className="kw-title">Found ({match.matched.length})</div>
        <div className="chips">
          {match.matched.map((k) => (
            <span key={k.name} className="kw on" title={k.where === 'skills' ? 'Only in your skills list — mention it in a bullet too' : 'Found in your resume'}>
              <Icon name="check" /> {k.name}
              {k.where === 'skills' && <i>skills only</i>}
            </span>
          ))}
          {!match.matched.length && <span className="hint">None yet.</span>}
        </div>
      </div>
      {[['Missing — required', req], ['Missing — nice to have / mentioned', other]].map(([t, list]) =>
        list.length ? (
          <div key={t}>
            <div className="kw-title">
              {t} ({list.length})
            </div>
            <div className="chips">
              {list.map((k) =>
                onToggle && k.type === 'hard' ? (
                  <button key={k.name} className={`kw miss pick ${picked?.has(k.name) ? 'picked' : ''}`} onClick={() => onToggle(k.name)} title="I have this skill — add it">
                    {picked?.has(k.name) ? <Icon name="check" /> : <Icon name="plus" />} {k.name}
                  </button>
                ) : (
                  <span key={k.name} className="kw miss">
                    {k.name}
                  </span>
                )
              )}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
