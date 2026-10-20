import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../app/store.jsx';
import { Icon, Switch, useToast } from '../components/ui.jsx';
import { renderResumeHtml } from '../resume/templates.js';
import { analyzeJob, matchResume } from '../resume/keywords.js';
import { applyTailoring, tailorPlan } from '../resume/tailor.js';
import { KeywordGroups, ScoreRing, loadJd, saveJd } from './Ats.jsx';
import { AiBadge, useAiOn } from '../components/Ai.jsx';
import { aiTailor } from '../resume/ai-tailor.js';

const SAMPLE_JD = `Software Engineer Intern – Full Stack
About Acme Labs
Acme Labs builds tools that help 2M+ small businesses get paid faster. Join Acme Labs for a 6-month internship.

What you'll do
- Build features end-to-end with React and Node.js
- Design REST APIs and work with PostgreSQL
- Write unit tests and take part in code reviews

Requirements
- Strong fundamentals in data structures and algorithms
- Experience with JavaScript or TypeScript
- Familiarity with Git and Linux

Nice to have
- Docker, AWS or Redis
- Experience with Next.js`;

export default function Tailor({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const resumes = state.resumes || [];
  const [rid, setRid] = useState(state.activeResume || resumes[0]?.id || '');
  const base = resumes.find((r) => r.id === rid) || resumes[0];
  const [jd, setJd] = useState(loadJd);
  const [title, setTitle] = useState(null); // null = use detected
  const [company, setCompany] = useState(null);
  const [picked, setPicked] = useState(() => new Set());
  const [opts, setOpts] = useState({ reorderSkills: true, reorderProjects: true, reorderBullets: true, reorderExperience: false, skillsUp: false, useSummary: true });
  const [hide, setHide] = useState(null); // null = use suggestion
  const [summary, setSummary] = useState(null);
  // AI suggestions for this job: { data, busy, error } + which ones the user chose to use
  const aiOn = useAiOn();
  const [ai, setAi] = useState({ data: null, busy: false, error: '' });
  const [useRw, setUseRw] = useState(() => new Set());
  const [useNb, setUseNb] = useState(() => new Set());
  const aiCtrl = useRef(null);
  const aiKey = useRef('');

  useEffect(() => saveJd(jd), [jd]);

  const detected = useMemo(() => (jd.trim().length > 40 ? analyzeJob(jd) : null), [jd]);
  const job = detected && { ...detected, title: title ?? detected.title, company: company ?? detected.company };
  const plan = useMemo(() => (base && job ? tailorPlan(base, job) : null), [base, jd, title, company]); // eslint-disable-line react-hooks/exhaustive-deps
  const hideSet = hide ?? new Set(plan?.lowProjects || []);
  const summaryText = summary ?? plan?.summary ?? '';

  const tailored = useMemo(() => {
    if (!plan) return null;
    return applyTailoring(base, job, {
      add: [...picked],
      ...opts,
      hideProjects: [...hideSet],
      summary: opts.useSummary ? summaryText : null,
      rewrites: (ai.data?.rewrites || []).filter((_, i) => useRw.has(i)),
      newBullets: (ai.data?.newBullets || []).filter((_, i) => useNb.has(i)),
    });
  }, [plan, picked, opts, hideSet, summaryText, ai.data, useRw, useNb]); // eslint-disable-line react-hooks/exhaustive-deps
  const after = useMemo(() => (tailored ? matchResume(tailored.resume, job) : null), [tailored]); // eslint-disable-line react-hooks/exhaustive-deps

  // reset per-job choices when the job changes
  const jdRef = useRef(jd);
  useEffect(() => {
    if (jdRef.current === jd) return;
    jdRef.current = jd;
    setPicked(new Set());
    setHide(null);
    setSummary(null);
    setTitle(null);
    setCompany(null);
    setUseRw(new Set());
    setUseNb(new Set());
  }, [jd]);

  // Ask the AI what to add for this job — automatically once the job post is pasted (after a short pause)
  const runAi = () => {
    if (!base || jd.trim().length < 120) return;
    aiCtrl.current?.abort();
    const c = new AbortController();
    aiCtrl.current = c;
    aiKey.current = base.id + '|' + jd.trim();
    setAi({ data: null, busy: true, error: '' });
    setUseRw(new Set());
    setUseNb(new Set());
    aiTailor({ resume: base, jd, signal: c.signal })
      .then((data) => aiCtrl.current === c && setAi({ data, busy: false, error: '' }))
      .catch((e) => e.name !== 'AbortError' && setAi({ data: null, busy: false, error: e.message || 'The AI request failed.' }));
  };
  useEffect(() => {
    if (!aiOn || !base || jd.trim().length < 120 || aiKey.current === base.id + '|' + jd.trim()) return;
    const t = setTimeout(runAi, 1500);
    return () => clearTimeout(t);
  }, [aiOn, jd, base?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => aiCtrl.current?.abort(), []);
  const toggleIn = (setter) => (i) =>
    setter((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const togglePick = (name) =>
    setPicked((prev) => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  const toggleHide = (i) => {
    const n = new Set(hideSet);
    n.has(i) ? n.delete(i) : n.add(i);
    setHide(n);
  };
  const setOpt = (k) => (v) => setOpts({ ...opts, [k]: v });

  const create = () => {
    const r = { ...tailored.resume, examples: false }; // a real resume: never fill gaps with examples
    dispatch({ type: 'resumes/set', items: [...resumes, r], active: r.id });
    toast(`Created “${r.name}”`);
    go('resume');
  };

  if (!resumes.length) {
    return (
      <div className="page">
        <div className="empty" style={{ padding: 56 }}>
          <Icon name="target" size={28} />
          <h2 style={{ color: 'var(--fg)', marginTop: 14, fontSize: 20 }}>Build a resume first</h2>
          <p style={{ marginTop: 8 }}>Tailoring starts from one of your resumes and creates a job-specific copy.</p>
          <button className="btn" style={{ marginTop: 18 }} onClick={() => go('resume')}>
            Open the Resume builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <div className="resume-app">
        <div className="resume-panel">
          <div className="resume-top" style={{ paddingBottom: 14 }}>
            <div>
              <h1 className="panel-title">Tailor to a job</h1>
              <p className="hint">Paste a job post. We reorder what’s already in your resume so the most relevant things come first, add skills only if you confirm you have them, and save it as a new copy.</p>
            </div>
          </div>
          <div className="resume-body">
            <div className="ctl">
              <div className="lbl">Start from</div>
              <select className="select" value={base.id} onChange={(e) => setRid(e.target.value)}>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ctl">
              <div className="lbl">
                <span>Job description</span>
                {!jd && (
                  <button className="link-btn" onClick={() => setJd(SAMPLE_JD)}>
                    Try a sample
                  </button>
                )}
              </div>
              <textarea className="textarea" rows={9} placeholder="Paste the full job post here — title, responsibilities, requirements, nice-to-haves." value={jd} onChange={(e) => setJd(e.target.value)} />
            </div>

            {!plan && <div className="empty">Paste a job description to see your match and the suggested changes.</div>}

            {plan && (
              <>
                <div className="grid-2">
                  <label className="field">
                    <span className="lbl-sm">Role</span>
                    <input className="input" value={job.title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SDE Intern" />
                  </label>
                  <label className="field">
                    <span className="lbl-sm">Company</span>
                    <input className="input" value={job.company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Razorpay" />
                  </label>
                </div>

                <div className="card card-pad score-pair">
                  <ScoreRing value={plan.match.score} size={84} label="now" />
                  <Icon name="chevron" size={22} />
                  <ScoreRing value={after?.score ?? plan.match.score} size={84} label="tailored" />
                  <p className="hint">Keyword match with this job. {detected.keywords.length} keywords found in the post{detected.years ? ` · asks for ${detected.years}+ years` : ''}. Reordering doesn’t change this number — it puts the relevant parts where a recruiter looks in the first 6 seconds. Adding skills you have and mentioning them in bullets does.</p>
                </div>

                {aiOn && (
                  <AiSuggestions
                    ai={ai}
                    onRun={runAi}
                    useRw={useRw}
                    useNb={useNb}
                    toggleRw={toggleIn(setUseRw)}
                    toggleNb={toggleIn(setUseNb)}
                    picked={picked}
                    togglePick={togglePick}
                    summaryUsed={!!(opts.useSummary && ai.data?.summary && summaryText === ai.data.summary)}
                    onUseSummary={() => {
                      setSummary(ai.data.summary);
                      setOpts((o) => ({ ...o, useSummary: true }));
                    }}
                  />
                )}

                <div className="stack-sm">
                  <div className="lbl-sm">Keywords — click a missing skill you really have to add it</div>
                  <KeywordGroups match={plan.match} onToggle={togglePick} picked={picked} />
                </div>

                <div className="card card-pad stack-sm">
                  <div className="lbl-sm">Changes</div>
                  <Switch checked={opts.reorderSkills} onChange={setOpt('reorderSkills')} label="Put the job’s skills first in Technical Skills" />
                  <Switch checked={opts.reorderBullets} onChange={setOpt('reorderBullets')} label="Lead each entry with its most relevant bullet" />
                  <Switch checked={opts.reorderProjects} onChange={setOpt('reorderProjects')} label="Order projects by relevance" />
                  <Switch checked={opts.reorderExperience} onChange={setOpt('reorderExperience')} label="Order experience by relevance (instead of by date)" />
                  <Switch checked={opts.skillsUp} onChange={setOpt('skillsUp')} label="Move Technical Skills right below Education" />
                  <Switch checked={opts.useSummary} onChange={setOpt('useSummary')} label="Add a summary for this role" />
                  {opts.useSummary && <textarea className="textarea" rows={4} value={summaryText} onChange={(e) => setSummary(e.target.value)} />}
                </div>

                {plan.projects.length > 0 && (
                  <div className="card card-pad stack-sm">
                    <div className="lbl-sm">Project relevance — untick to leave a project out</div>
                    {[...plan.projects].sort((a, b) => b.score - a.score).map((p) => {
                      const max = Math.max(1, ...plan.projects.map((x) => x.score));
                      return (
                        <label key={p.index} className="rel-row">
                          <input type="checkbox" checked={!hideSet.has(p.index)} onChange={() => toggleHide(p.index)} />
                          <span className="name">{p.name}</span>
                          <div className="bar">
                            <i style={{ width: `${(p.score / max) * 100}%` }} />
                          </div>
                          <span className="hits">{p.hits.length ? p.hits.slice(0, 3).join(', ') : 'no matching keywords'}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {plan.coach.length > 0 && (
                  <div className="card card-pad stack-sm">
                    <div className="lbl-sm">Work these into your bullets</div>
                    <p className="hint">These job keywords are in an entry’s tech stack but none of its bullets. Recruiters trust a skill more when a bullet shows how you used it — edit them in the Resume builder after creating the copy.</p>
                    {plan.coach.map((c) => (
                      <div key={c.kind + c.name} className="coach-row">
                        <b>{c.name}</b>
                        <span>{c.words.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button className="btn" onClick={create}>
                  <Icon name="plus" /> Create tailored resume
                </button>
              </>
            )}
          </div>
        </div>

        <div className="resume-preview">
          <div className="preview-bar">
            <b className="small">{tailored ? tailored.resume.name : base.name}</b>
            <span className="spacer" />
            {tailored && <span className="badge">{tailored.changes.length} change{tailored.changes.length === 1 ? '' : 's'}</span>}
          </div>
          {tailored && tailored.changes.length > 0 && (
            <ul className="notes changes">
              {tailored.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          <MiniPreview resume={tailored ? tailored.resume : base} />
        </div>
      </div>
    </div>
  );
}

// AI suggestions: each one can be switched on and is applied to the tailored copy (and its preview) at once
function AiSuggestions({ ai, onRun, useRw, useNb, toggleRw, toggleNb, picked, togglePick, summaryUsed, onUseSummary }) {
  const d = ai.data;
  const UseBtn = ({ on, onClick }) => (
    <button className={`btn sm ${on ? '' : 'secondary'}`} onClick={onClick}>
      <Icon name={on ? 'check' : 'plus'} /> {on ? 'Added' : 'Use'}
    </button>
  );
  return (
    <div className="card card-pad stack-sm ai-tailor">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="lbl-sm">AI suggestions for this job</div>
        <span className="row" style={{ gap: 6 }}>
          <AiBadge />
          {d && !ai.busy && (
            <button className="btn ghost sm" onClick={onRun} title="Ask again">
              <Icon name="refresh" />
            </button>
          )}
        </span>
      </div>
      {ai.busy && (
        <div className="ai-status running compact">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <div className="ai-status-text">
            <b>Reading the job and your resume…</b>
          </div>
        </div>
      )}
      {ai.error && (
        <div className="contrast bad">
          {ai.error}{' '}
          <button className="linklike" onClick={onRun}>
            Try again
          </button>
        </div>
      )}
      {!d && !ai.busy && !ai.error && (
        <button className="btn secondary sm" style={{ justifySelf: 'start' }} onClick={onRun}>
          <Icon name="sparkle" /> Get AI suggestions
        </button>
      )}
      {d && (
        <>
          <p className="ai-fit">
            <b>{d.score}/100</b> {d.fit}
          </p>

          {d.summary && (
            <div className="sug">
              <div className="sug-head">
                <b>Summary for this role</b>
                <UseBtn on={summaryUsed} onClick={onUseSummary} />
              </div>
              <p className="sug-text">{d.summary}</p>
            </div>
          )}

          {d.rewrites.length > 0 && (
            <div className="sug-group">
              <div className="sug-title">Stronger bullets for this job</div>
              {d.rewrites.map((x, i) => (
                <div key={i} className="sug">
                  <div className="sug-head">
                    <span className="sug-entry">{x.entry}</span>
                    <UseBtn on={useRw.has(i)} onClick={() => toggleRw(i)} />
                  </div>
                  <p className="sug-before">{x.original}</p>
                  <p className="sug-text">{x.improved}</p>
                  {x.why && <small>{x.why}</small>}
                </div>
              ))}
            </div>
          )}

          {d.newBullets.length > 0 && (
            <div className="sug-group">
              <div className="sug-title">Bullets you could add</div>
              {d.newBullets.map((x, i) => (
                <div key={i} className="sug">
                  <div className="sug-head">
                    <span className="sug-entry">{x.entry}</span>
                    <UseBtn on={useNb.has(i)} onClick={() => toggleNb(i)} />
                  </div>
                  <p className="sug-text">{x.bullet}</p>
                  {x.why && <small>{x.why}</small>}
                </div>
              ))}
              <p className="hint">Only add what is true. Fill in the [ ] placeholders with your real numbers in the Resume builder.</p>
            </div>
          )}

          {d.skills.length > 0 && (
            <div className="sug-group">
              <div className="sug-title">Skills to list — only if you have them</div>
              <div className="chips">
                {d.skills.map((x) => (
                  <button key={x.skill} className={`kw miss pick ${picked.has(x.skill) ? 'picked' : ''}`} onClick={() => togglePick(x.skill)} title={x.why}>
                    <Icon name={picked.has(x.skill) ? 'check' : 'plus'} /> {x.skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {d.highlight.length > 0 && (
            <div className="sug-group">
              <div className="sug-title">Put first</div>
              <ul className="notes">
                {d.highlight.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {d.gaps.length > 0 && (
            <div className="sug-group">
              <div className="sug-title">Gaps to address</div>
              <ul className="notes">
                {d.gaps.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// a scaled, non-interactive preview of a resume
function MiniPreview({ resume }) {
  const wrap = useRef(null);
  const frame = useRef(null);
  const [w, setW] = useState(700);
  const [h, setH] = useState(1100);
  useEffect(() => {
    const el = wrap.current;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const html = useMemo(() => renderResumeHtml(resume), [resume]);
  const pageW = 860;
  const scale = Math.min(1.1, (w - 24) / pageW);
  const onLoad = () => {
    const doc = frame.current?.contentDocument;
    if (doc) {
      doc.querySelectorAll('.pb').forEach((g) => (g.style.display = 'none'));
      setH(doc.documentElement.scrollHeight);
    }
  };
  return (
    <div className="resume-stage" ref={wrap}>
      <div className="resume-sheet" style={{ width: pageW * scale, height: h * scale }}>
        <iframe ref={frame} className="resume-frame" title="Tailored preview" srcDoc={html} onLoad={onLoad} sandbox="allow-same-origin" style={{ width: pageW, height: h, transform: `scale(${scale})` }} />
      </div>
    </div>
  );
}
