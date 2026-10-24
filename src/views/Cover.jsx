import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../app/store.jsx';
import { Icon, Seg, downloadFile, printHtml, useToast } from '../components/ui.jsx';
import { AiBadge, useAiOn } from '../components/Ai.jsx';
import { analyzeJob } from '../resume/keywords.js';
import { LENGTHS, LETTER_DESIGNS, TONES, candidateFacts, letterHtml, letterText, writeFromTemplate, writeWithAi } from '../cover/letter.js';
import { loadJd } from './Ats.jsx';

const uid = () => Math.random().toString(36).slice(2, 10);
const blank = (resumeId) => ({ id: uid(), resumeId, jd: loadJd(), company: '', role: '', manager: '', tone: 'professional', length: 'standard', why: '', text: '', design: 'classic', accent: '#111111', paper: 'letter', closing: 'Sincerely', updated: Date.now() });

export default function Cover({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const aiOn = useAiOn();
  const letters = state.coverLetters || [];
  const resumes = state.resumes || [];
  const [activeId, setActiveId] = useState(letters[0]?.id || '');
  const letter = letters.find((l) => l.id === activeId) || letters[0];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ctrl = useRef(null);

  // first visit: start a letter
  useEffect(() => {
    if (!letters.length) {
      const l = blank(state.activeResume || resumes[0]?.id || '');
      dispatch({ type: 'cover/set', items: [l] });
      setActiveId(l.id);
    }
  }, [letters.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => ctrl.current?.abort(), []);

  const update = (patch) => dispatch({ type: 'cover/set', items: letters.map((l) => (l.id === letter.id ? { ...l, ...patch, updated: Date.now() } : l)) });
  const resume = resumes.find((r) => r.id === letter?.resumeId) || null;
  const facts = useMemo(() => candidateFacts(state.profile, resume), [state.profile, resume]);
  const job = useMemo(() => (letter?.jd && letter.jd.trim().length > 40 ? analyzeJob(letter.jd) : null), [letter?.jd]);
  const company = letter?.company || job?.company || '';
  const role = letter?.role || job?.title?.replace(/\s+[–—|-]\s+.*$/, '') || '';
  const view = letter ? { ...letter, company, role } : null;
  const html = useMemo(() => (view ? letterHtml(view, facts) : ''), [JSON.stringify(view), facts]); // eslint-disable-line react-hooks/exhaustive-deps

  // the letter is laid out at real paper width; scale the preview down to fit the pane
  const stage = useRef(null);
  const [stageW, setStageW] = useState(0);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [letter?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!letter) return null;
  const frame = letter.paper === 'a4' ? { w: 840, h: 1170 } : { w: 860, h: 1100 };
  const fit = stageW ? Math.min(1, (stageW - 8) / frame.w) : 1;

  const write = async () => {
    setError('');
    if (!aiOn) {
      update({ text: writeFromTemplate({ facts, jd: letter.jd, company, role, why: letter.why, length: letter.length }) });
      toast('Letter drafted from your resume — edit it freely');
      return;
    }
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setBusy(true);
    try {
      let last = 0;
      const text = await writeWithAi({
        facts,
        jd: letter.jd,
        company,
        role,
        manager: letter.manager,
        tone: letter.tone,
        length: letter.length,
        why: letter.why,
        signal: c.signal,
        onText: (t) => {
          if (Date.now() - last > 250) {
            last = Date.now();
            update({ text: t });
          }
        },
      });
      update({ text });
      toast('Letter written — read it through and make it yours');
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'The AI request failed.');
    } finally {
      setBusy(false);
    }
  };

  const newLetter = () => {
    const l = blank(letter.resumeId);
    dispatch({ type: 'cover/set', items: [l, ...letters] });
    setActiveId(l.id);
  };
  const remove = () => {
    if (!confirm('Delete this cover letter?')) return;
    const items = letters.filter((l) => l.id !== letter.id);
    dispatch({ type: 'cover/set', items });
    setActiveId(items[0]?.id || '');
  };
  const printPdf = () => {
    dispatch({ type: 'milestone', key: 'coverMade' });
    printHtml(letterHtml(view, facts, { forPrint: true }), base);
    toast('Choose “Save as PDF” in the print dialog');
  };
  const copy = async () => {
    dispatch({ type: 'milestone', key: 'coverMade' });
    try {
      await navigator.clipboard.writeText(letterText(view, facts));
      toast('Copied — paste it into an email or application form');
    } catch {
      toast('Couldn’t copy — use .txt instead');
    }
  };
  const base = `${(facts.name || 'Cover').replace(/\s+/g, '_')}_Cover_Letter${company ? `_${company.replace(/\s+/g, '_')}` : ''}`;
  const label = (l) => [l.company || (l.jd && analyzeJob(l.jd).company), l.role].filter(Boolean).join(' · ') || 'Untitled letter';

  return (
    <div className="page page-wide">
      <div className="resume-app">
        <div className="resume-panel">
          <div className="resume-top" style={{ paddingBottom: 14 }}>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <select className="select" value={letter.id} onChange={(e) => setActiveId(e.target.value)} aria-label="Saved letters">
                {letters.map((l) => (
                  <option key={l.id} value={l.id}>
                    {label(l)}
                  </option>
                ))}
              </select>
              <button className="btn secondary sm" onClick={newLetter}>
                <Icon name="plus" /> New
              </button>
              <button className="btn ghost icon" onClick={remove} disabled={letters.length < 2} title="Delete this letter">
                <Icon name="trash" />
              </button>
            </div>
          </div>
          <div className="resume-body">
            <div className="ctl">
              <div className="lbl">Write it from</div>
              <select className="select" value={letter.resumeId || ''} onChange={(e) => update({ resumeId: e.target.value })}>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    Resume: {r.name}
                  </option>
                ))}
                <option value="">My Dev Identity</option>
              </select>
            </div>
            <div className="ctl">
              <div className="lbl">Job description</div>
              <textarea className="textarea" rows={6} value={letter.jd} onChange={(e) => update({ jd: e.target.value })} placeholder="Paste the job post — the letter is matched to its requirements." />
            </div>
            <div className="grid-2">
              <label className="field">
                <span>Company</span>
                <input className="input" value={letter.company} placeholder={job?.company || 'e.g. Razorpay'} onChange={(e) => update({ company: e.target.value })} />
              </label>
              <label className="field">
                <span>Role</span>
                <input className="input" value={letter.role} placeholder={role || 'e.g. SDE Intern'} onChange={(e) => update({ role: e.target.value })} />
              </label>
              <label className="field span-2">
                <span>Hiring manager (optional)</span>
                <input className="input" value={letter.manager} placeholder="Hiring Manager" onChange={(e) => update({ manager: e.target.value })} />
              </label>
            </div>
            <div className="ctl">
              <div className="lbl">Tone</div>
              <Seg value={letter.tone} onChange={(v) => update({ tone: v })} options={TONES.map(([value, label]) => ({ value, label }))} />
            </div>
            <div className="ctl">
              <div className="lbl">Length</div>
              <Seg value={letter.length} onChange={(v) => update({ length: v })} options={LENGTHS.map(([value, label, words]) => ({ value, label: `${label} · ~${words}w` }))} />
            </div>
            <div className="ctl">
              <div className="lbl">
                <span>Why this company?</span>
                <span className="badge">optional · makes it personal</span>
              </div>
              <textarea className="textarea" rows={2} value={letter.why} onChange={(e) => update({ why: e.target.value })} placeholder="e.g. I use their app every week and love how simple their checkout is" />
            </div>

            <div className="row">
              <button className="btn" onClick={write} disabled={busy}>
                <Icon name="sparkle" /> {busy ? 'Writing…' : letter.text ? (aiOn ? 'Rewrite with AI' : 'Rewrite from template') : aiOn ? 'Write with AI' : 'Write from template'}
              </button>
              <AiBadge />
              {aiOn && !busy && (
                <button className="linklike small" onClick={() => update({ text: writeFromTemplate({ facts, jd: letter.jd, company, role, why: letter.why, length: letter.length }) })}>
                  or use the offline template
                </button>
              )}
            </div>
            {error && <div className="contrast bad">{error}</div>}

            <div className="ctl">
              <div className="lbl">
                <span>Letter</span>
                <span className="muted small">{(letter.text.match(/\S+/g) || []).length} words</span>
              </div>
              <textarea className="textarea letter-input" rows={14} value={letter.text} onChange={(e) => update({ text: e.target.value })} placeholder="Write with AI above, or type your letter here. Greeting and sign-off are added for you." />
              <div className="grid-2">
                <label className="field">
                  <span>Sign-off</span>
                  <input className="input" value={letter.closing} onChange={(e) => update({ closing: e.target.value })} />
                </label>
                <label className="field">
                  <span>Paper</span>
                  <Seg value={letter.paper} onChange={(v) => update({ paper: v })} options={[{ value: 'letter', label: 'Letter' }, { value: 'a4', label: 'A4' }]} />
                </label>
              </div>
            </div>

            <div className="ctl">
              <div className="lbl">Design</div>
              <div className="letter-designs">
                {Object.entries(LETTER_DESIGNS).map(([k, d]) => (
                  <button key={k} className={`rt-card ${letter.design === k ? 'on' : ''}`} onClick={() => update({ design: k })}>
                    <b>{d.name}</b>
                    <span>{d.desc}</span>
                  </button>
                ))}
              </div>
              {letter.design === 'modern' && (
                <div className="row">
                  <input type="color" className="color-in" value={letter.accent} onChange={(e) => update({ accent: e.target.value })} />
                  <span className="hint">Accent for the rule and title</span>
                </div>
              )}
            </div>
            <p className="hint">
              Tip: tailor your resume for the same job in{' '}
              <button className="linklike" onClick={() => go('tailor')}>
                Resume Tailoring
              </button>{' '}
              so the letter and resume tell the same story.
            </p>
          </div>
        </div>

        <div className="resume-preview">
          <div className="preview-bar">
            <b className="small">{label(view)}</b>
            <span className="spacer" />
            <button className="btn ghost sm" onClick={copy}>
              <Icon name="copy" /> Copy
            </button>
            <button className="btn ghost sm" onClick={() => {
                dispatch({ type: 'milestone', key: 'coverMade' });
                downloadFile(`${base}.txt`, letterText(view, facts));
              }}>
              .txt
            </button>
            <button className="btn sm" onClick={printPdf}>
              <Icon name="download" /> PDF
            </button>
          </div>
          <div className="resume-stage" ref={stage}>
            <div className="letter-fit" style={{ width: frame.w * fit, height: frame.h * fit }}>
              <iframe className="letter-frame" title="Cover letter preview" srcDoc={html} sandbox="allow-same-origin" style={{ width: frame.w, height: frame.h, transform: `scale(${fit})` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
