import { useRef, useState } from 'react';
import { isBlankProfile, sampleProfile, useStore } from '../app/store.jsx';
import { Icon, ListEditor, Switch, Text, useToast } from '../components/ui.jsx';
import { initials } from '../portfolio/render.js';
import { extractResumeLines, parseResumeLines } from '../resume/parse.js';
import { importSummary, mergeProfile, profileFromResume } from '../profile/import.js';

// Upload a resume and fill in the profile from it: a drop zone, then a review of what was found.
function ResumeImport({ profile, onApply, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [drag, setDrag] = useState(false);
  const run = useRef(0); // bumped on cancel so a resume still being read is ignored
  const blank = isBlankProfile(profile);
  const read = async (file) => {
    if (!file) return;
    const id = ++run.current;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const lines = await extractResumeLines(file);
      if (id !== run.current) return;
      const parsed = parseResumeLines(lines);
      const incoming = profileFromResume(parsed.data);
      const found = importSummary(incoming).filter(([, v]) => v);
      if (!found.length) throw new Error(parsed.warnings[0] || 'We couldn’t find anything to import in that file.');
      setResult({ incoming, warnings: parsed.warnings, file: file.name });
    } catch (e) {
      if (id === run.current) setError(e.message || 'Could not read that file.');
    } finally {
      if (id === run.current) setBusy(false);
    }
  };
  const cancelRead = () => {
    run.current++;
    setBusy(false);
  };
  const input = <input type="file" accept=".pdf,.docx,.txt,application/pdf" hidden onChange={(e) => (read(e.target.files[0]), (e.target.value = ''))} />;

  if (result)
    return (
      <div className="card card-pad stack pi-review">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b>Found in “{result.file}”</b>
          <button className="btn ghost sm" onClick={() => (setResult(null), onClose?.())}>
            Cancel
          </button>
        </div>
        <div className="pi-found">
          {importSummary(result.incoming).map(([label, v]) => (
            <div key={label} className={v ? '' : 'none'}>
              <span>{label}</span>
              <b>{v || '—'}</b>
            </div>
          ))}
        </div>
        {result.warnings.length > 0 && (
          <ul className="notes">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        <div className="row">
          {blank ? (
            <button className="btn" onClick={() => onApply(result.incoming, 'replace', result.file)}>
              <Icon name="check" /> Fill my profile
            </button>
          ) : (
            <>
              <button className="btn" onClick={() => onApply(result.incoming, 'add', result.file)}>
                <Icon name="plus" /> Add what’s missing
              </button>
              <button className="btn secondary" onClick={() => confirm('Replace your details with the ones from this resume? Sections in the resume overwrite yours.') && onApply(result.incoming, 'replace', result.file)}>
                Replace with resume
              </button>
            </>
          )}
        </div>
        <span className="hint">Reading resumes is automatic, so give each tab a quick check afterwards.</span>
      </div>
    );

  return (
      <label
        className={`pi-drop ${drag ? 'drag' : ''} ${busy ? 'busy' : ''}`}
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => (e.preventDefault(), setDrag(false), read(e.dataTransfer.files[0]))}
      >
        {/* first, so clicking the box opens the file picker — a label activates its first button or input */}
        {input}
        <span className="pi-icon">
          <Icon name="upload" size={20} />
        </span>
        <span className="pi-text">
          <b>{busy ? 'Reading your resume…' : 'Have a resume? Upload it and we’ll fill this page for you.'}</b>
          <span>PDF, Word (.docx) or text · read on your device · or type your details below — the grey “e.g.” text is just an example.</span>
          {error && <em className="pi-err">{error}</em>}
        </span>
        {busy ? (
          <button type="button" className="btn ghost sm" onClick={(e) => (e.preventDefault(), cancelRead())}>
            Cancel
          </button>
        ) : (
          <span className="btn secondary sm">Choose file</span>
        )}
        {onClose && !busy && (
          <button type="button" className="btn ghost icon" title="Close" onClick={(e) => (e.preventDefault(), onClose())}>
            <Icon name="x" />
          </button>
        )}
      </label>
  );
}

// The sample person's details appear as grey "e.g." hints, never as real data.
const SAMPLE = sampleProfile();
const eg = (v) => (v ? `e.g. ${v}` : undefined);
const example = (key, i, field, fallback) => {
  const list = SAMPLE[key] || [];
  return eg(list.length ? list[i % list.length][field] : '') || fallback;
};

const TABS = [
  { id: 'basics', label: 'Basics' },
  { id: 'socials', label: 'Links', list: true },
  { id: 'skills', label: 'Skills', list: true },
  { id: 'projects', label: 'Projects', list: true },
  { id: 'experience', label: 'Experience', list: true },
  { id: 'education', label: 'Education', list: true },
  { id: 'certifications', label: 'Certifications', list: true },
  { id: 'achievements', label: 'Achievements', list: true },
  { id: 'custom', label: 'Custom sections', list: true },
];

const SOCIAL_PRESETS = ['GitHub', 'LinkedIn', 'X', 'LeetCode', 'Codeforces', 'Kaggle', 'Dev.to', 'Medium', 'Hashnode', 'Dribbble', 'YouTube', 'Instagram', 'Stack Overflow', 'HackerRank', 'CodeChef'];

// Shrink uploaded images so they fit comfortably in local storage and exports.
function readImage(file, max = 480) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ImageInput({ label, value, onChange, max, fallback }) {
  const toast = useToast();
  return (
    <div className="field">
      <span>{label}</span>
      <div className="avatar-up">
        <div className="pic" style={value ? { backgroundImage: `url("${value}")` } : undefined}>
          {!value && fallback}
        </div>
        <div className="row">
          <label className="btn secondary sm">
            <Icon name="upload" /> Upload
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  onChange(await readImage(f, max));
                } catch {
                  toast('Could not read that image');
                }
                e.target.value = '';
              }}
            />
          </label>
          {value && (
            <button className="btn ghost sm" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Profile({ go }) {
  const { state, dispatch } = useStore();
  const p = state.profile;
  const b = p.basics;
  const [tab, setTab] = useState('basics');
  const setB = (patch) => dispatch({ type: 'basics/set', patch });
  const setList = (key) => (items) => dispatch({ type: 'list/set', key, items });
  const toast = useToast();
  const blank = isBlankProfile(p);
  const [importOpen, setImportOpen] = useState(false);
  const [lastImport, setLastImport] = useState(null); // the profile from before the last import, so it can be undone
  const applyImport = (incoming, mode, file) => {
    const { profile, changed, added } = mergeProfile(p, incoming, mode);
    dispatch({ type: 'profile/set', profile });
    setLastImport({ before: p, file });
    setImportOpen(false);
    setTab('basics');
    const parts = [changed.length && `${changed.length} detail${changed.length === 1 ? '' : 's'}`, added && `${added} item${added === 1 ? '' : 's'}`].filter(Boolean);
    toast(parts.length ? `Imported ${parts.join(' and ')} — check each tab` : 'Nothing new to add — your profile already has all of it');
  };

  const undoImport = () => {
    dispatch({ type: 'profile/set', profile: lastImport.before });
    setLastImport(null);
    toast('Import undone — your profile is back to how it was');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dev Identity</h1>
          <p>One source of truth for everything about you. Your portfolio, résumé, cover letters and profile card are all generated from this.</p>
        </div>
        <div className="row">
          {!blank && !importOpen && (
            <button className="btn secondary" onClick={() => setImportOpen(true)}>
              <Icon name="upload" /> Import resume
            </button>
          )}
          <button className="btn" onClick={() => go('studio')}>
            <Icon name="layout" /> Design portfolio
          </button>
        </div>
      </div>

      {lastImport && !importOpen && (
        <div className="pi-done">
          <Icon name="check" size={18} />
          <span>
            Filled from <b>“{lastImport.file}”</b>. Not what you wanted?
          </span>
          <button className="btn secondary sm" onClick={undoImport}>
            <Icon name="undo" /> Undo import
          </button>
          <button className="btn ghost icon" title="Dismiss" aria-label="Dismiss" onClick={() => setLastImport(null)}>
            <Icon name="x" />
          </button>
        </div>
      )}

      {((blank && !lastImport) || importOpen) && <ResumeImport profile={p} onApply={applyImport} onClose={blank ? undefined : () => setImportOpen(false)} />}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            {t.list && <span className="count">{p[t.id].length}</span>}
          </button>
        ))}
      </div>

      {tab === 'basics' && (
        <div className="card card-pad">
          <div className="grid-2">
            <Text label="Full name" value={b.name} onChange={(v) => setB({ name: v })} placeholder={eg(SAMPLE.basics.name) || "Mugiwara Luffy"} />
            <Text label="Headline" value={b.headline} onChange={(v) => setB({ headline: v })} placeholder={eg(SAMPLE.basics.headline) || "Full-Stack Developer · CS Undergrad"} />
            <Text placeholder={eg(SAMPLE.basics.tagline)} className="span-2" label="Tagline" hint="One sentence that captures what you do. Used as the statement in some hero styles." value={b.tagline} onChange={(v) => setB({ tagline: v })} />
            <Text placeholder={eg(SAMPLE.basics.about)} className="span-2" label="About" multiline rows={6} hint="Separate paragraphs with a blank line. Lines starting with “- ” become bullets." value={b.about} onChange={(v) => setB({ about: v })} />
            <Text placeholder={eg(SAMPLE.basics.email)} label="Email" type="email" value={b.email} onChange={(v) => setB({ email: v })} />
            <Text placeholder={eg(SAMPLE.basics.phone)} label="Phone" value={b.phone} onChange={(v) => setB({ phone: v })} />
            <Text label="Location" value={b.location} onChange={(v) => setB({ location: v })} placeholder={eg(SAMPLE.basics.location) || "City, Country"} />
            <Text label="Website" value={b.website} onChange={(v) => setB({ website: v })} placeholder={eg(SAMPLE.basics.website) || "https://"} />
            <Text placeholder={eg(SAMPLE.basics.availability)} label="Availability" hint="e.g. Open to internships — Summer 2027" value={b.availability} onChange={(v) => setB({ availability: v })} />
            <Text placeholder={eg(SAMPLE.basics.resumeUrl)} label="Résumé link" hint="Public link to your PDF (Drive, etc.)" value={b.resumeUrl} onChange={(v) => setB({ resumeUrl: v })} />
            <ImageInput label="Photo" value={b.avatar} onChange={(v) => setB({ avatar: v })} max={480} fallback={initials(b.name)} />
          </div>
        </div>
      )}

      {tab === 'socials' && (
        <>
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="small muted" style={{ marginBottom: 10 }}>Quick add</div>
            <div className="chips">
              {SOCIAL_PRESETS.filter((s) => !p.socials.some((x) => x.label === s)).map((s) => (
                <button key={s} className="chip" onClick={() => setList('socials')([...p.socials, { label: s, url: '' }])}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
          <ListEditor
            items={p.socials}
            onChange={setList('socials')}
            blank={() => ({ label: '', url: '' })}
            title={(s) => s.label}
            subtitle={(s) => s.url}
            addLabel="Add link"
            emptyText="Add GitHub, LinkedIn, coding profiles, blogs…"
            render={(s, set) => (
              <div className="grid-2">
                <Text label="Label" placeholder="e.g. GitHub" value={s.label} onChange={(v) => set({ label: v })} />
                <Text label="URL" value={s.url} onChange={(v) => set({ url: v })} placeholder="e.g. https://github.com/your-username" />
              </div>
            )}
          />
        </>
      )}

      {tab === 'skills' && (
        <ListEditor
          items={p.skills}
          onChange={setList('skills')}
          blank={() => ({ group: '', items: '' })}
          title={(s) => s.group}
          subtitle={(s) => s.items}
          addLabel="Add skill group"
          emptyText="Group your skills: Languages, Frontend, Backend, Tools…"
          render={(s, set, i) => (
            <div className="grid-2">
              <Text label="Group" value={s.group} onChange={(v) => set({ group: v })} placeholder={example('skills', i, 'group', "Languages")} />
              <Text label="Skills (comma separated)" value={s.items} onChange={(v) => set({ items: v })} placeholder={example('skills', i, 'items', "Python, Java, C++")} />
            </div>
          )}
        />
      )}

      {tab === 'projects' && (
        <>
          <div className="card card-pad row" style={{ marginBottom: 16 }}>
            <Icon name="github" size={20} style={{ flex: 'none' }} />
            <span className="spacer">Import projects straight from your GitHub repositories and keep stars in sync.</span>
            <button className="btn secondary sm" onClick={() => go('github')}>
              Open GitHub Sync
            </button>
          </div>
          <ListEditor
            items={p.projects}
            onChange={setList('projects')}
            blank={() => ({ name: '', description: '', tech: '', link: '', repo: '', stars: 0, highlight: false, bullets: '', image: '', source: 'manual' })}
            title={(x) => x.name}
            subtitle={(x) => [x.highlight && '★ featured', x.source === 'github' && 'from GitHub', x.tech].filter(Boolean).join(' · ')}
            addLabel="Add project"
            emptyText="Projects are the most important part of a student portfolio. Add 3–6 of your best."
            render={(x, set, i) => (
              <div className="grid-2">
                <Text placeholder={example('projects', i, 'name')} label="Name" value={x.name} onChange={(v) => set({ name: v })} />
                <Text label="Tech used" value={x.tech} onChange={(v) => set({ tech: v })} placeholder={example('projects', i, 'tech', "React, Node.js")} />
                <Text placeholder={example('projects', i, 'description')} className="span-2" label="Short description" value={x.description} onChange={(v) => set({ description: v })} />
                <Text placeholder={example('projects', i, 'bullets')} className="span-2" label="Highlights (one per line)" hint="Results and numbers impress recruiters: users, speed-ups, downloads, awards." multiline rows={3} value={x.bullets} onChange={(v) => set({ bullets: v })} />
                <Text label="Live link" value={x.link} onChange={(v) => set({ link: v })} placeholder={example('projects', i, 'link', "https://")} />
                <Text label="Repository" value={x.repo} onChange={(v) => set({ repo: v })} placeholder={example('projects', i, 'repo', "https://github.com/you/repo")} />
                <ImageInput label="Screenshot (optional)" value={x.image} onChange={(v) => set({ image: v })} max={960} fallback="IMG" />
                <div className="field" style={{ justifyContent: 'center' }}>
                  <Switch checked={x.highlight} onChange={(v) => set({ highlight: v })} label="Featured project (shown first)" />
                </div>
              </div>
            )}
          />
        </>
      )}

      {tab === 'experience' && (
        <ListEditor
          items={p.experience}
          onChange={setList('experience')}
          blank={() => ({ role: '', company: '', location: '', start: '', end: '', bullets: '', tech: '' })}
          title={(x) => x.role}
          subtitle={(x) => x.company}
          addLabel="Add experience"
          emptyText="Internships, freelance work, research, open-source, club roles…"
          render={(x, set, i) => (
            <div className="grid-2">
              <Text placeholder={example('experience', i, 'role')} label="Role" value={x.role} onChange={(v) => set({ role: v })} />
              <Text placeholder={example('experience', i, 'company')} label="Company / Organisation" value={x.company} onChange={(v) => set({ company: v })} />
              <Text label="Start" value={x.start} onChange={(v) => set({ start: v })} placeholder={example('experience', i, 'start', "May 2026")} />
              <Text label="End" value={x.end} onChange={(v) => set({ end: v })} placeholder={example('experience', i, 'end', "Present")} />
              <Text label="Location" value={x.location} onChange={(v) => set({ location: v })} placeholder={example('experience', i, 'location', "Remote")} />
              <Text placeholder={example('experience', i, 'tech')} label="Tech" value={x.tech} onChange={(v) => set({ tech: v })} />
              <Text placeholder={example('experience', i, 'bullets')} className="span-2" label="What you did (one per line)" multiline rows={4} value={x.bullets} onChange={(v) => set({ bullets: v })} />
            </div>
          )}
        />
      )}

      {tab === 'education' && (
        <ListEditor
          items={p.education}
          onChange={setList('education')}
          blank={() => ({ school: '', degree: '', start: '', end: '', score: '', details: '' })}
          title={(x) => x.degree}
          subtitle={(x) => x.school}
          addLabel="Add education"
          render={(x, set, i) => (
            <div className="grid-2">
              <Text label="Degree" value={x.degree} onChange={(v) => set({ degree: v })} placeholder={example('education', i, 'degree', "B.Tech in Computer Science")} />
              <Text placeholder={example('education', i, 'school')} label="School / College" value={x.school} onChange={(v) => set({ school: v })} />
              <Text placeholder={example('education', i, 'start')} label="Start" value={x.start} onChange={(v) => set({ start: v })} />
              <Text label="End" value={x.end} onChange={(v) => set({ end: v })} placeholder={example('education', i, 'end', "2027 (expected)")} />
              <Text label="Score" value={x.score} onChange={(v) => set({ score: v })} placeholder={example('education', i, 'score', "CGPA 8.9 / 10")} />
              <Text label="Details" value={x.details} onChange={(v) => set({ details: v })} placeholder={example('education', i, 'details', "Relevant coursework, thesis…")} />
            </div>
          )}
        />
      )}

      {tab === 'certifications' && (
        <ListEditor
          items={p.certifications}
          onChange={setList('certifications')}
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
      )}

      {tab === 'achievements' && (
        <ListEditor
          items={p.achievements}
          onChange={setList('achievements')}
          blank={() => ({ title: '', detail: '' })}
          title={(x) => x.title}
          subtitle={(x) => x.detail}
          addLabel="Add achievement"
          emptyText="Hackathons, competitive programming ranks, scholarships, leadership…"
          render={(x, set, i) => (
            <div className="grid-2">
              <Text placeholder={example('achievements', i, 'title')} label="Title" value={x.title} onChange={(v) => set({ title: v })} />
              <Text placeholder={example('achievements', i, 'detail')} label="Detail" value={x.detail} onChange={(v) => set({ detail: v })} />
            </div>
          )}
        />
      )}

      {tab === 'custom' && (
        <ListEditor
          items={p.custom}
          onChange={setList('custom')}
          blank={() => ({ title: '', content: '' })}
          title={(x) => x.title}
          addLabel="Add custom section"
          emptyText="Anything else that makes you, you: Blog posts, Talks, Open source, Research, Volunteering, Now, Hobbies…"
          render={(x, set, i) => (
            <div className="stack">
              <Text label="Section title" value={x.title} onChange={(v) => set({ title: v })} placeholder={example('custom', i, 'title', "Open Source")} />
              <Text placeholder={example('custom', i, 'content')} label="Content" hint="Blank line = new paragraph. Lines starting with “- ” become bullets." multiline rows={6} value={x.content} onChange={(v) => set({ content: v })} />
            </div>
          )}
        />
      )}
    </div>
  );
}
