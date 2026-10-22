import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../app/store.jsx';
import { Icon, ListEditor, Seg, Switch, Text, downloadFile, useToast } from '../components/ui.jsx';
import { Pressable, Thumb } from '../components/Thumb.jsx';
import { RESUME_SECTION_LABELS, demoResumeData, emptyResumeData, isBlankResume, newResume, resumeDataFromProfile } from '../resume/model.js';
import { plainExamples, showExamples, withExamples } from '../resume/examples.js';
import { RESUME_FONTS, RESUME_TEMPLATES, renderResumeHtml, renderResumeText } from '../resume/templates.js';
import { resumeToLatex } from '../resume/latex.js';
import { extractResumeLines, parseResumeLines } from '../resume/parse.js';

// The sample resume's content appears as grey "e.g." hints in empty fields.
const SAMPLE_DATA = demoResumeData();
const eg = (v) => (v ? `e.g. ${v}` : undefined);
const example = (key, i, field, fallback) => {
  const list = SAMPLE_DATA[key] || [];
  return eg(list.length ? list[i % list.length][field] : '') || fallback;
};

const TABS = [
  { id: 'content', label: 'Content', icon: 'file' },
  { id: 'design', label: 'Template', icon: 'layout' },
  { id: 'style', label: 'Style', icon: 'type' },
  { id: 'import', label: 'Import', icon: 'upload' },
];
const BULLET_HINT = 'One bullet per line. Start with an action verb and add a number — e.g. “Reduced load time by 40% by…”.';
// gentlest change first: spacing, then margins, then font size (never below 9pt)
const FIT_STEPS = [
  (s) => (s.fill ? { fill: 0 } : null), // undo an earlier fit's stretch first
  (s) => (s.spacing === 'relaxed' ? { spacing: 'normal' } : null),
  (s) => (s.fontSize > 10.5 ? { fontSize: +(s.fontSize - 0.25).toFixed(2) } : null),
  (s) => (s.spacing !== 'compact' ? { spacing: 'compact' } : null),
  (s) => (s.margins === 'wide' ? { margins: 'normal' } : null),
  (s) => (s.margins !== 'narrow' ? { margins: 'narrow' } : null),
  (s) => (s.fontSize > 9 ? { fontSize: +(s.fontSize - 0.25).toFixed(2) } : null),
];
const slug = (s) => String(s || 'resume').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '');

export default function Resume({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const resumes = state.resumes || [];
  const resume = resumes.find((r) => r.id === state.activeResume) || resumes[0];
  const [tab, setTab] = useState('content');
  const [open, setOpen] = useState('header');
  const [pages, setPages] = useState(1);
  const [dims, setDims] = useState({ w: 860, h: 1100 });
  const [stageW, setStageW] = useState(800);
  const [zoom, setZoom] = useState('fit');
  const [fitting, setFitting] = useState(false);
  const fitRef = useRef(false);
  const filledRef = useRef(false); // this fit already spread the leftover space
  const spare = useRef({ gap: 0, sections: 0 }); // empty space under a one-page resume, from measure()
  const frame = useRef(null);
  const stage = useRef(null);

  // first visit: start a resume from the user's Dev Identity (empty for a new account)
  useEffect(() => {
    if (!resumes.length) {
      const r = newResume({ name: 'My Resume', data: resumeDataFromProfile(state.profile) });
      dispatch({ type: 'resumes/set', items: [r], active: r.id });
    }
  }, [resumes.length, dispatch]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [resume?.id]);

  const update = useCallback((patch) => resume && dispatch({ type: 'resume/update', id: resume.id, patch }), [resume, dispatch]);
  const setData = (patch) => update({ data: { ...resume.data, ...patch } });
  const setStyle = (patch) => update({ style: { ...resume.style, ...patch } });

  // parts the user hasn't written yet show the sample resume (lighter) until "Hide examples"
  const sample = !!resume && isBlankResume(resume.data); // nothing of their own yet → nothing to download
  const examples = resume?.examples !== false;
  const filled = useMemo(() => (resume ? withExamples(resume) : null), [resume]);
  const shown = resume && examples ? filled.resume : resume;
  const html = useMemo(() => (shown ? (examples ? showExamples(renderResumeHtml(shown)) : renderResumeHtml(shown)) : ''), [shown, examples]);
  // Examples are never downloaded, so while they're showing, pages are counted (and "Fit to one page"
  // works) on a hidden copy without them — otherwise the PDF comes out shorter than the preview.
  const measureHtml = useMemo(() => (resume && examples && filled?.used ? renderResumeHtml(resume) : ''), [resume, examples, filled]);
  const measureFrame = useRef(null);

  // count pages, show only the needed page-break guides, and size the frame
  const measure = () => {
    const doc = frame.current?.contentDocument;
    const page = doc?.getElementById('page');
    if (!page) return 1;
    page.style.minHeight = '';
    const mdoc = measureHtml ? measureFrame.current?.contentDocument : doc;
    const mpage = mdoc?.getElementById('page');
    const n = mpage ? countPages(mpage) : pages; // the hidden copy may still be loading
    const cs = doc.defaultView.getComputedStyle(page);
    const pageH = parseFloat(cs.minHeight) || page.offsetHeight;
    page.style.minHeight = `${pageH * n}px`;
    doc.querySelectorAll('.pb').forEach((g, i) => (g.style.display = i < n - 1 ? '' : 'none'));
    setPages(n);
    setDims({ w: page.offsetWidth + 44, h: page.offsetHeight + 44 });
    return n;
  };
  const countPages = (page) => {
    const doc = page.ownerDocument;
    const cs = doc.defaultView.getComputedStyle(page);
    const pageH = parseFloat(cs.minHeight) || page.offsetHeight;
    let bottom = 0;
    [...page.children].forEach((c) => {
      if (!c.classList.contains('pb')) bottom = Math.max(bottom, c.offsetTop + c.offsetHeight);
    });
    const n = Math.max(1, Math.ceil((bottom + (parseFloat(cs.paddingBottom) || 0) - 0.5) / pageH)); // tight, so the count matches the PDF
    spare.current = { gap: n === 1 ? pageH - bottom - (parseFloat(cs.paddingBottom) || 0) : 0, sections: doc.querySelectorAll('.page > .sec').length };
    return n;
  };

  // "Fit to one page": shrink one step per render until it fits
  const fitStep = (n) => {
    if (!fitRef.current) return;
    if (n <= 1) {
      // the shrink steps are coarse and can leave a big empty band at the bottom — share it out between
      // the sections so the page ends at the bottom margin, in the preview and the PDF alike
      const { gap, sections } = spare.current;
      const extra = sections ? Math.floor((gap - 4) / sections) : 0;
      if (!filledRef.current && extra >= 1) {
        filledRef.current = true;
        return setStyle({ fill: (resume.style.fill || 0) + extra });
      }
      fitRef.current = false;
      setFitting(false);
      toast('Fits on one page');
      return;
    }
    for (const step of FIT_STEPS) {
      const patch = step(resume.style);
      if (patch) return setStyle(patch);
    }
    fitRef.current = false;
    setFitting(false);
    toast('Still more than one page at the smallest size — trim a few bullets or hide a section');
  };
  const startFit = () => {
    fitRef.current = true;
    filledRef.current = false;
    setFitting(true);
    fitStep(pages);
  };
  // the frame that's measured drives "Fit to one page"; the other one only re-lays out the preview
  const onFrameLoad = (measured) => () => {
    const doc = (measured && measureHtml ? measureFrame : frame).current?.contentDocument;
    const run = () => (measured ? fitStep(measure()) : measure());
    measure();
    if (doc?.fonts?.ready) doc.fonts.ready.then(run);
    else run();
  };
  const scale = zoom === 'fit' ? Math.min(1.2, Math.max(0.3, (stageW - 24) / dims.w)) : 1;

  if (!resume) return null;
  const d = resume.data;
  // downloads never contain the sample
  const needContent = () => {
    if (!sample) return false;
    toast('Add your details first — the preview is only a sample');
    setTab('content');
    return true;
  };

  // ---------- resume management ----------
  const addResume = (kind) => {
    const data = kind === 'profile' ? resumeDataFromProfile(state.profile) : kind === 'blank' ? emptyResumeData() : kind === 'copy' ? JSON.parse(JSON.stringify(d)) : demoResumeData();
    const r = newResume({ name: kind === 'copy' ? `${resume.name} (copy)` : `Resume ${resumes.length + 1}`, data, style: kind === 'copy' ? resume.style : undefined });
    if (kind === 'copy') Object.assign(r, { order: [...resume.order], hidden: { ...resume.hidden } });
    dispatch({ type: 'resumes/set', items: [...resumes, r], active: r.id });
    toast(kind === 'profile' ? 'New resume created from your Dev Identity' : 'New resume created');
  };
  const removeResume = () => {
    if (!confirm(`Delete “${resume.name}”? This can’t be undone.`)) return;
    const items = resumes.filter((r) => r.id !== resume.id);
    dispatch({ type: 'resumes/set', items, active: items[0]?.id || '' });
  };

  // ---------- downloads ----------
  const printPdf = () => {
    if (needContent()) return;
    dispatch({ type: 'milestone', key: 'resumeExported' });
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    f.onload = () => {
      const go2 = () => {
        f.contentWindow.focus();
        f.contentWindow.print();
        setTimeout(() => f.remove(), 2000);
      };
      if (f.contentDocument.fonts?.ready) f.contentDocument.fonts.ready.then(go2);
      else setTimeout(go2, 500);
    };
    f.srcdoc = renderResumeHtml(resume, { forPrint: true });
    toast('In the print dialog choose “Save as PDF” — the text stays selectable for ATS');
  };
  const base = `${slug(d.header.name)}_Resume`;

  // ---------- sections order ----------
  const move = (k, dir) => {
    const order = [...resume.order];
    const i = order.indexOf(k);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    update({ order });
  };
  const toggleHidden = (k) => update({ hidden: { ...resume.hidden, [k]: !resume.hidden[k] } });
  const list = (key) => (items) => setData({ [key]: items });


  return (
    <div className="page page-wide">
      <div className="resume-app">
        <div className="resume-panel">
          <div className="resume-top">
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <select className="select" value={resume.id} onChange={(e) => dispatch({ type: 'resumes/set', items: resumes, active: e.target.value })} aria-label="Choose resume">
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <NewMenu onPick={addResume} />
              <button className="btn ghost icon" title="Delete this resume" onClick={removeResume} disabled={resumes.length < 2}>
                <Icon name="trash" />
              </button>
            </div>
            <input className="input name-in" value={resume.name} onChange={(e) => update({ name: e.target.value })} aria-label="Resume name" />
            <div className="tabs">
              {TABS.map((t) => (
                <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'content' && (
            <div className="resume-body">
              <Section id="header" open={open} setOpen={setOpen} hidden={resume.hidden} title="Header & contact">
                <div className="grid-2">
                  <Text placeholder={eg(SAMPLE_DATA.header.name)} className="span-2" label="Full name" value={d.header.name} onChange={(v) => setData({ header: { ...d.header, name: v } })} />
                  <Text placeholder={eg(SAMPLE_DATA.header.phone)} label="Phone" value={d.header.phone} onChange={(v) => setData({ header: { ...d.header, phone: v } })} />
                  <Text placeholder={eg(SAMPLE_DATA.header.email)} label="Email" value={d.header.email} onChange={(v) => setData({ header: { ...d.header, email: v } })} />
                  <Text label="LinkedIn" placeholder="e.g. linkedin.com/in/your-name" value={d.header.linkedin} onChange={(v) => setData({ header: { ...d.header, linkedin: v } })} />
                  <Text label="GitHub" placeholder="e.g. github.com/your-username" value={d.header.github} onChange={(v) => setData({ header: { ...d.header, github: v } })} />
                  <Text placeholder={eg(SAMPLE_DATA.header.website)} label="Website / portfolio" value={d.header.website} onChange={(v) => setData({ header: { ...d.header, website: v } })} />
                  <Text placeholder={eg(SAMPLE_DATA.header.location)} label="Location (optional)" value={d.header.location} onChange={(v) => setData({ header: { ...d.header, location: v } })} />
                </div>
              </Section>

              <div className="card card-pad order-card">
                <div className="lbl-sm">Sections — rename, reorder or hide</div>
                <div className="order-list">
                  {resume.order.map((k, i) => (
                    <div key={k} className={`order-item ${resume.hidden[k] ? 'off' : ''}`}>
                      {k === 'custom' ? (
                        <span className="name">{RESUME_SECTION_LABELS[k]}</span>
                      ) : (
                        <input className="name title-in" value={resume.titles?.[k] ?? ''} placeholder={RESUME_SECTION_LABELS[k]} onChange={(e) => update({ titles: { ...resume.titles, [k]: e.target.value } })} aria-label={`Heading for ${RESUME_SECTION_LABELS[k]}`} title="Click to rename this heading" />
                      )}
                      <button className="btn ghost icon" onClick={() => move(k, -1)} disabled={i === 0} aria-label="Move up">
                        <Icon name="up" />
                      </button>
                      <button className="btn ghost icon" onClick={() => move(k, 1)} disabled={i === resume.order.length - 1} aria-label="Move down">
                        <Icon name="down" />
                      </button>
                      <button className="btn ghost icon" onClick={() => toggleHidden(k)} aria-label={resume.hidden[k] ? 'Show' : 'Hide'}>
                        <Icon name={resume.hidden[k] ? 'eyeOff' : 'eye'} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Section id="summary" open={open} setOpen={setOpen} hidden={resume.hidden} title="Summary (optional)">
                <Text multiline rows={4} hint="2–3 lines. Freshers can usually skip this; turn the section on with the eye icon above." value={d.summary} onChange={(v) => setData({ summary: v })} />
              </Section>

              <Section id="education" open={open} setOpen={setOpen} hidden={resume.hidden} title="Education" count={d.education.length}>
                <ListEditor
                  items={d.education}
                  onChange={list('education')}
                  blank={() => ({ school: '', degree: '', start: '', end: '', location: '', score: '', details: '' })}
                  title={(x) => x.school}
                  subtitle={(x) => x.degree}
                  addLabel="Add education"
                  render={(x, set, i) => (
                    <div className="grid-2">
                      <Text placeholder={example('education', i, 'school')} className="span-2" label="School / college" value={x.school} onChange={(v) => set({ school: v })} />
                      <Text className="span-2" label="Degree" value={x.degree} onChange={(v) => set({ degree: v })} placeholder={example('education', i, 'degree', "Bachelor of Technology in Computer Science")} />
                      <Text label="Start" value={x.start} onChange={(v) => set({ start: v })} placeholder={example('education', i, 'start', "Aug 2023")} />
                      <Text label="End" value={x.end} onChange={(v) => set({ end: v })} placeholder={example('education', i, 'end', "Expected May 2027")} />
                      <Text placeholder={example('education', i, 'location')} label="Location" value={x.location} onChange={(v) => set({ location: v })} />
                      <Text label="Score" value={x.score} onChange={(v) => set({ score: v })} placeholder={example('education', i, 'score', "CGPA: 8.9/10")} />
                      <Text className="span-2" label="Details (optional)" value={x.details} onChange={(v) => set({ details: v })} placeholder={example('education', i, 'details', "Relevant coursework…")} />
                    </div>
                  )}
                />
              </Section>

              <Section id="experience" open={open} setOpen={setOpen} hidden={resume.hidden} title="Experience" count={d.experience.length}>
                <ListEditor
                  items={d.experience}
                  onChange={list('experience')}
                  blank={() => ({ company: '', role: '', tech: '', location: '', start: '', end: '', bullets: '' })}
                  title={(x) => x.company}
                  subtitle={(x) => x.role}
                  addLabel="Add experience"
                  emptyText="Internships, freelance, research, open source, club roles…"
                  render={(x, set, i) => (
                    <div className="grid-2">
                      <Text placeholder={example('experience', i, 'company')} label="Company / organisation" value={x.company} onChange={(v) => set({ company: v })} />
                      <Text placeholder={example('experience', i, 'role')} label="Role" value={x.role} onChange={(v) => set({ role: v })} />
                      <Text label="Tech used" value={x.tech} onChange={(v) => set({ tech: v })} placeholder={example('experience', i, 'tech', "AWS, Python, Golang")} />
                      <Text placeholder={example('experience', i, 'location')} label="Location" value={x.location} onChange={(v) => set({ location: v })} />
                      <Text label="Start" value={x.start} onChange={(v) => set({ start: v })} placeholder={example('experience', i, 'start', "May 2026")} />
                      <Text label="End" value={x.end} onChange={(v) => set({ end: v })} placeholder={example('experience', i, 'end', "Present")} />
                      <Text placeholder={example('experience', i, 'bullets')} className="span-2" label="Bullet points" multiline rows={5} hint={BULLET_HINT} value={x.bullets} onChange={(v) => set({ bullets: v })} />
                    </div>
                  )}
                />
              </Section>

              <Section id="projects" open={open} setOpen={setOpen} hidden={resume.hidden} title="Projects" count={d.projects.length}>
                <ListEditor
                  items={d.projects}
                  onChange={list('projects')}
                  blank={() => ({ name: '', tech: '', link: '', linkLabel: 'View Project', date: '', bullets: '' })}
                  title={(x) => x.name}
                  subtitle={(x) => x.tech}
                  addLabel="Add project"
                  render={(x, set, i) => (
                    <div className="grid-2">
                      <Text placeholder={example('projects', i, 'name')} label="Project name" value={x.name} onChange={(v) => set({ name: v })} />
                      <Text placeholder={example('projects', i, 'tech')} label="Tech stack" value={x.tech} onChange={(v) => set({ tech: v })} />
                      <Text label="Link" value={x.link} onChange={(v) => set({ link: v })} placeholder={example('projects', i, 'link', "https://")} />
                      <Text label="Link text" value={x.linkLabel} onChange={(v) => set({ linkLabel: v })} placeholder={example('projects', i, 'linkLabel', "View Project")} />
                      <Text placeholder={example('projects', i, 'date')} label="Date (shown if no link)" value={x.date} onChange={(v) => set({ date: v })} />
                      <div />
                      <Text placeholder={example('projects', i, 'bullets')} className="span-2" label="Bullet points" multiline rows={4} hint={BULLET_HINT} value={x.bullets} onChange={(v) => set({ bullets: v })} />
                    </div>
                  )}
                />
              </Section>

              <Section id="skills" open={open} setOpen={setOpen} hidden={resume.hidden} title="Technical skills" count={d.skills.length}>
                <ListEditor
                  items={d.skills}
                  onChange={list('skills')}
                  blank={() => ({ group: '', items: '' })}
                  title={(x) => x.group}
                  subtitle={(x) => x.items}
                  addLabel="Add skill row"
                  render={(x, set, i) => (
                    <div className="grid-2">
                      <Text label="Category" value={x.group} onChange={(v) => set({ group: v })} placeholder={example('skills', i, 'group', "Languages")} />
                      <Text placeholder={example('skills', i, 'items')} label="Skills (comma separated)" value={x.items} onChange={(v) => set({ items: v })} />
                    </div>
                  )}
                />
              </Section>

              <Section id="achievements" open={open} setOpen={setOpen} hidden={resume.hidden} title="Achievements" count={d.achievements.length}>
                <ListEditor
                  items={d.achievements}
                  onChange={list('achievements')}
                  blank={() => ({ text: '', link: '', linkLabel: 'View' })}
                  title={(x) => x.text}
                  addLabel="Add achievement"
                  render={(x, set, i) => (
                    <div className="grid-2">
                      <Text placeholder={example('achievements', i, 'text')} className="span-2" label="Achievement" value={x.text} onChange={(v) => set({ text: v })} />
                      <Text placeholder={example('achievements', i, 'link')} label="Link (optional)" value={x.link} onChange={(v) => set({ link: v })} />
                      <Text label="Link text" value={x.linkLabel} onChange={(v) => set({ linkLabel: v })} placeholder={example('achievements', i, 'linkLabel', "View Post")} />
                    </div>
                  )}
                />
              </Section>

              <Section id="certifications" open={open} setOpen={setOpen} hidden={resume.hidden} title="Certifications" count={d.certifications.length}>
                <ListEditor
                  items={d.certifications}
                  onChange={list('certifications')}
                  blank={() => ({ name: '', issuer: '', date: '', link: '' })}
                  title={(x) => x.name}
                  subtitle={(x) => x.issuer}
                  addLabel="Add certification"
                  render={(x, set, i) => (
                    <div className="grid-2">
                      <Text placeholder={example('certifications', i, 'name')} label="Name" value={x.name} onChange={(v) => set({ name: v })} />
                      <Text placeholder={example('certifications', i, 'issuer')} label="Issuer" value={x.issuer} onChange={(v) => set({ issuer: v })} />
                      <Text placeholder={example('certifications', i, 'date')} label="Date" value={x.date} onChange={(v) => set({ date: v })} />
                      <Text placeholder={example('certifications', i, 'link')} label="Credential link" value={x.link} onChange={(v) => set({ link: v })} />
                    </div>
                  )}
                />
              </Section>

              <Section id="custom" open={open} setOpen={setOpen} hidden={resume.hidden} title="Custom sections" count={d.custom.length}>
                <ListEditor
                  items={d.custom}
                  onChange={list('custom')}
                  blank={() => ({ title: '', content: '' })}
                  title={(x) => x.title}
                  addLabel="Add custom section"
                  emptyText="Positions of Responsibility, Publications, Volunteering, Extracurriculars…"
                  render={(x, set, i) => (
                    <div className="stack">
                      <Text label="Section title" value={x.title} onChange={(v) => set({ title: v })} placeholder={example('custom', i, 'title', "Positions of Responsibility")} />
                      <Text placeholder={example('custom', i, 'content')} label="Content" multiline rows={4} hint="Lines starting with “- ” become bullets." value={x.content} onChange={(v) => set({ content: v })} />
                    </div>
                  )}
                />
              </Section>
            </div>
          )}

          {tab === 'design' && (
            <div className="resume-body">
              <div className="lbl-sm">Template</div>
              <div className="tpl-grid">
                {Object.entries(RESUME_TEMPLATES).map(([k, t]) => (
                  <Pressable key={k} className={`tpl-card ${resume.style.template === k ? 'on' : ''}`} label={`Use ${t.name}`} onActivate={() => setStyle({ template: k, font: t.font, fontSize: t.size })}>
                    <Thumb html={plainExamples(renderResumeHtml({ ...filled.resume, style: { ...resume.style, template: k, font: t.font, fontSize: t.size } }, { forPrint: true }))} scale={0.2} height={150} width={830} eager />
                    <div className="tpl-meta">
                      <b>{t.name}</b>
                      <span className={`ats ats-${t.ats.toLowerCase()}`}>ATS: {t.ats}</span>
                      <p>{t.desc}</p>
                    </div>
                  </Pressable>
                ))}
              </div>
              <button className="btn secondary style-next" onClick={() => setTab('style')}>
                <Icon name="type" /> Next: adjust font, size & spacing <Icon name="chevron" />
              </button>
            </div>
          )}

          {tab === 'style' && (
            <div className="resume-body">
              <div className="style-head">
                <div>
                  <span className="lbl-sm">Template</span>
                  <b>{RESUME_TEMPLATES[resume.style.template]?.name}</b>
                </div>
                <div className="row">
                  <button
                    className="btn ghost sm"
                    title="Font, size, spacing and margins back to this template’s defaults"
                    onClick={() => {
                      const t = RESUME_TEMPLATES[resume.style.template];
                      setStyle({ font: t.font, fontSize: t.size, spacing: 'normal', margins: 'normal' });
                      toast('Back to the template’s default look');
                    }}
                  >
                    <Icon name="undo" /> Reset
                  </button>
                  <button className="btn secondary sm" onClick={() => setTab('design')}>
                    Change template
                  </button>
                </div>
              </div>

              <div className="lbl-sm">Font</div>
              <div className="font-row">
                {Object.entries(RESUME_FONTS).map(([k, f]) => (
                  <button key={k} className={`chip ${resume.style.font === k ? 'on' : ''}`} onClick={() => setStyle({ font: k })}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="ctl">
                <div className="lbl">
                  <span>Font size</span>
                  <span className="mono muted">{resume.style.fontSize} pt</span>
                </div>
                <input type="range" min="9" max="12" step="0.25" value={resume.style.fontSize} onChange={(e) => setStyle({ fontSize: Number(e.target.value) })} />
              </div>
              <div className="ctl">
                <div className="lbl">Spacing</div>
                <Seg value={resume.style.spacing} onChange={(v) => setStyle({ spacing: v })} options={[{ value: 'compact', label: 'Compact' }, { value: 'normal', label: 'Normal' }, { value: 'relaxed', label: 'Relaxed' }]} />
              </div>
              <div className="ctl">
                <div className="lbl">Margins</div>
                <Seg value={resume.style.margins} onChange={(v) => setStyle({ margins: v })} options={[{ value: 'narrow', label: 'Narrow' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Wide' }]} />
              </div>
              <div className="ctl">
                <div className="lbl">Paper</div>
                <Seg value={resume.style.paper} onChange={(v) => setStyle({ paper: v })} options={[{ value: 'letter', label: 'US Letter' }, { value: 'a4', label: 'A4' }]} />
              </div>
              <div className="ctl">
                <div className="lbl">Links show as</div>
                <Seg value={resume.style.linkStyle} onChange={(v) => setStyle({ linkStyle: v })} options={[{ value: 'label', label: '“View Project”' }, { value: 'url', label: 'Full URL' }]} />
              </div>
              {['rendercv', 'awesome'].includes(resume.style.template) && (
                <div className="ctl">
                  <div className="lbl">Accent colour</div>
                  <div className="row">
                    <input type="color" className="color-in" value={resume.style.accent} onChange={(e) => setStyle({ accent: e.target.value })} />
                    <span className="hint">Used for the name, headings and links. Keep it dark so it prints well.</span>
                  </div>
                </div>
              )}
              {!['faang', 'compact', 'jakeclassic'].includes(resume.style.template) && <Switch checked={resume.style.icons} onChange={(v) => setStyle({ icons: v })} label="Icons next to contact details" />}
              <p className="hint">Tip: choosing a different template resets the font and size to that template’s defaults. If your resume runs onto 2 pages, use “Fit to one page” above the preview.</p>
            </div>
          )}

          {tab === 'import' && <ImportTab current={resume} profile={state.profile} onCreate={(data, name) => { const r = { ...newResume({ name, data }), examples: false }; dispatch({ type: 'resumes/set', items: [...resumes, r], active: r.id }); toast('Imported — check each section, then pick a template'); setTab('content'); }} onReplace={(data) => { update({ data, examples: false }); toast('Content replaced'); setTab('content'); }} />}
        </div>

        <div className="resume-preview">
          <div className="preview-bar">
            <span className={`badge ${pages > 1 ? '' : 'solid'}`}>{pages === 1 ? '1 page ✓' : `${pages} pages`}</span>
            {pages > 1 && (
              <button className="btn secondary sm" onClick={startFit} disabled={fitting}>
                {fitting ? 'Fitting…' : 'Fit to one page'}
              </button>
            )}
            <Seg value={zoom} onChange={setZoom} options={[{ value: 'fit', label: 'Fit' }, { value: '1', label: '100%' }]} />
            {filled?.used && (
              <button className="btn ghost sm" onClick={() => update({ examples: !examples })} title="Examples fill the parts you haven’t written yet. They’re never downloaded.">
                <Icon name="eye" /> {examples ? 'Hide examples' : 'Show examples'}
              </button>
            )}
            <span className="spacer" />
            <button className="btn ghost sm" onClick={() => {
              if (needContent()) return;
              dispatch({ type: 'milestone', key: 'resumeExported' });
              downloadFile(`${base}.tex`, resumeToLatex(resume), 'application/x-tex');
            }} title="LaTeX source (Jake's Resume format) for Overleaf">
              .tex
            </button>
            <button className="btn ghost sm" onClick={() => {
              if (needContent()) return;
              dispatch({ type: 'milestone', key: 'resumeExported' });
              downloadFile(`${base}.txt`, renderResumeText(resume));
            }} title="Plain text — exactly what an ATS reads">
              .txt
            </button>
            <button className="btn ghost sm" onClick={() => !needContent() && downloadFile(`${base}.json`, JSON.stringify(resume, null, 2), 'application/json')}>
              .json
            </button>
            <button className="btn sm" onClick={printPdf}>
              <Icon name="download" /> PDF
            </button>
          </div>
          {examples && filled?.used && (
            <div className="sample-strip">
              <Icon name="eye" size={14} />
              <span>
                <b>Grey text is an example</b> — it fills the parts you haven’t written yet so you can see the whole template. As you type, your words replace it. Examples are never downloaded.
              </span>
            </div>
          )}
          <div className="resume-stage" ref={stage}>
            <div className="resume-sheet" style={{ width: dims.w * scale, height: dims.h * scale }}>
              <iframe ref={frame} className="resume-frame" title="Resume preview" srcDoc={html} onLoad={onFrameLoad(!measureHtml)} sandbox="allow-same-origin" style={{ width: dims.w, height: dims.h, transform: `scale(${scale})` }} />
              {measureHtml && <iframe ref={measureFrame} className="resume-measure" title="" aria-hidden="true" tabIndex={-1} srcDoc={measureHtml} onLoad={onFrameLoad(true)} sandbox="allow-same-origin" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, count, open, setOpen, hidden, children }) {
  return (
    <div className={`acc ${open === id ? 'open' : ''}`}>
      <button className="acc-head" onClick={() => setOpen(open === id ? '' : id)}>
        <Icon name="chevron" className="chev" />
        <b>{title}</b>
        {count !== undefined && <span className="count">{count}</span>}
        {hidden?.[id] && <span className="badge">hidden</span>}
      </button>
      {open === id && <div className="acc-body">{children}</div>}
    </div>
  );
}

function NewMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="history-bar">
      <button className="btn secondary sm" onClick={() => setOpen(!open)}>
        <Icon name="plus" /> New
      </button>
      {open && (
        <div className="history-menu" style={{ left: 0, right: 'auto' }} onMouseLeave={() => setOpen(false)}>
          {[
            ['profile', 'From my Dev Identity', 'Uses everything in your profile'],
            ['demo', 'With demo content', 'See how a full resume looks'],
            ['copy', 'Duplicate this resume', 'e.g. one version per company'],
            ['blank', 'Blank', 'Start from scratch'],
          ].map(([k, t, s]) => (
            <button
              key={k}
              onClick={() => {
                onPick(k);
                setOpen(false);
              }}
            >
              <b>{t}</b>
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImportTab({ current, profile, onCreate, onReplace }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const read = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const lines = await extractResumeLines(file);
      setResult({ ...parseResumeLines(lines), file: file.name });
    } catch (e) {
      setError(e.message || 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  };
  const r = result?.data;
  return (
    <div className="resume-body">
      <label
        className={`dropzone ${busy ? 'busy' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          read(e.dataTransfer.files[0]);
        }}
      >
        <Icon name="upload" size={24} />
        <b>{busy ? 'Reading your resume…' : 'Upload your existing resume'}</b>
        <span>PDF, Word (.docx) or text. We read it on your device and turn it into editable fields — then you can switch it to any template.</span>
        <input type="file" accept=".pdf,.docx,.txt,application/pdf" hidden onChange={(e) => { read(e.target.files[0]); e.target.value = ''; }} />
      </label>
      {error && <div className="contrast bad">{error}</div>}
      {r && (
        <div className="card card-pad stack">
          <b className="small">Found in “{result.file}”</b>
          <div className="import-grid">
            <span>Name</span><b>{r.header.name || '—'}</b>
            <span>Email</span><b>{r.header.email || '—'}</b>
            <span>Phone</span><b>{r.header.phone || '—'}</b>
            <span>LinkedIn / GitHub</span><b>{[r.header.linkedin, r.header.github].filter(Boolean).join(' · ') || '—'}</b>
            <span>Education</span><b>{r.education.length}</b>
            <span>Experience</span><b>{r.experience.length}</b>
            <span>Projects</span><b>{r.projects.length}</b>
            <span>Skill rows</span><b>{r.skills.length}</b>
            <span>Achievements</span><b>{r.achievements.length}</b>
            <span>Other sections</span><b>{r.custom.length + r.certifications.length}</b>
          </div>
          {result.warnings.length > 0 && (
            <ul className="notes">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <div className="row">
            <button className="btn" onClick={() => onCreate(r, `${(r.header.name || 'Imported').split(' ')[0]}’s resume (imported)`)}>
              Create a new resume from this
            </button>
            <button className="btn secondary" onClick={() => confirm(`Replace the content of “${current.name}” with the imported resume?`) && onReplace(r)}>
              Replace current content
            </button>
          </div>
          <span className="hint">Parsing is automatic, so give every section a quick check after importing.</span>
        </div>
      )}
      <div className="card card-pad stack">
        <b className="small">Or pull everything from your Dev Identity</b>
        <span className="hint">Uses your profile’s education, experience, projects, skills and achievements.</span>
        <button className="btn secondary sm" style={{ justifySelf: 'start' }} onClick={() => confirm(`Replace the content of “${current.name}” with your Dev Identity?`) && onReplace(resumeDataFromProfile(profile))}>
          Use my Dev Identity
        </button>
      </div>
    </div>
  );
}

