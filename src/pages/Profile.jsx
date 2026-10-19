import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon, ListEditor, Switch, Text, useToast } from '../components/ui.jsx';
import { initials } from '../portfolio/render.js';

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

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dev Identity</h1>
          <p>One source of truth for everything about you. Your portfolio, résumé, cover letters and profile card are all generated from this.</p>
        </div>
        <button className="btn" onClick={() => go('studio')}>
          <Icon name="layout" /> Design portfolio
        </button>
      </div>

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
            <Text label="Full name" value={b.name} onChange={(v) => setB({ name: v })} placeholder="Mugiwara Luffy" />
            <Text label="Headline" value={b.headline} onChange={(v) => setB({ headline: v })} placeholder="Full-Stack Developer · CS Undergrad" />
            <Text className="span-2" label="Tagline" hint="One sentence that captures what you do. Used as the statement in some hero styles." value={b.tagline} onChange={(v) => setB({ tagline: v })} />
            <Text className="span-2" label="About" multiline rows={6} hint="Separate paragraphs with a blank line. Lines starting with “- ” become bullets." value={b.about} onChange={(v) => setB({ about: v })} />
            <Text label="Email" type="email" value={b.email} onChange={(v) => setB({ email: v })} />
            <Text label="Phone" value={b.phone} onChange={(v) => setB({ phone: v })} />
            <Text label="Location" value={b.location} onChange={(v) => setB({ location: v })} placeholder="City, Country" />
            <Text label="Website" value={b.website} onChange={(v) => setB({ website: v })} placeholder="https://" />
            <Text label="Availability" hint="e.g. Open to internships — Summer 2027" value={b.availability} onChange={(v) => setB({ availability: v })} />
            <Text label="Résumé link" hint="Public link to your PDF (Drive, etc.)" value={b.resumeUrl} onChange={(v) => setB({ resumeUrl: v })} />
            <ImageInput label="Photo (shown in grayscale)" value={b.avatar} onChange={(v) => setB({ avatar: v })} max={480} fallback={initials(b.name)} />
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
                <Text label="Label" value={s.label} onChange={(v) => set({ label: v })} />
                <Text label="URL" value={s.url} onChange={(v) => set({ url: v })} placeholder="https://" />
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
          render={(s, set) => (
            <div className="grid-2">
              <Text label="Group" value={s.group} onChange={(v) => set({ group: v })} placeholder="Languages" />
              <Text label="Skills (comma separated)" value={s.items} onChange={(v) => set({ items: v })} placeholder="Python, Java, C++" />
            </div>
          )}
        />
      )}

      {tab === 'projects' && (
        <>
          <div className="card card-pad row" style={{ marginBottom: 16 }}>
            <Icon name="github" />
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
            render={(x, set) => (
              <div className="grid-2">
                <Text label="Name" value={x.name} onChange={(v) => set({ name: v })} />
                <Text label="Tech used" value={x.tech} onChange={(v) => set({ tech: v })} placeholder="React, Node.js" />
                <Text className="span-2" label="Short description" value={x.description} onChange={(v) => set({ description: v })} />
                <Text className="span-2" label="Highlights (one per line)" hint="Results and numbers impress recruiters: users, speed-ups, downloads, awards." multiline rows={3} value={x.bullets} onChange={(v) => set({ bullets: v })} />
                <Text label="Live link" value={x.link} onChange={(v) => set({ link: v })} placeholder="https://" />
                <Text label="Repository" value={x.repo} onChange={(v) => set({ repo: v })} placeholder="https://github.com/you/repo" />
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
          render={(x, set) => (
            <div className="grid-2">
              <Text label="Role" value={x.role} onChange={(v) => set({ role: v })} />
              <Text label="Company / Organisation" value={x.company} onChange={(v) => set({ company: v })} />
              <Text label="Start" value={x.start} onChange={(v) => set({ start: v })} placeholder="May 2026" />
              <Text label="End" value={x.end} onChange={(v) => set({ end: v })} placeholder="Present" />
              <Text label="Location" value={x.location} onChange={(v) => set({ location: v })} placeholder="Remote" />
              <Text label="Tech" value={x.tech} onChange={(v) => set({ tech: v })} />
              <Text className="span-2" label="What you did (one per line)" multiline rows={4} value={x.bullets} onChange={(v) => set({ bullets: v })} />
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
          render={(x, set) => (
            <div className="grid-2">
              <Text label="Degree" value={x.degree} onChange={(v) => set({ degree: v })} placeholder="B.Tech in Computer Science" />
              <Text label="School / College" value={x.school} onChange={(v) => set({ school: v })} />
              <Text label="Start" value={x.start} onChange={(v) => set({ start: v })} />
              <Text label="End" value={x.end} onChange={(v) => set({ end: v })} placeholder="2027 (expected)" />
              <Text label="Score" value={x.score} onChange={(v) => set({ score: v })} placeholder="CGPA 8.9 / 10" />
              <Text label="Details" value={x.details} onChange={(v) => set({ details: v })} placeholder="Relevant coursework, thesis…" />
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
          render={(x, set) => (
            <div className="grid-2">
              <Text label="Name" value={x.name} onChange={(v) => set({ name: v })} />
              <Text label="Issuer" value={x.issuer} onChange={(v) => set({ issuer: v })} />
              <Text label="Date" value={x.date} onChange={(v) => set({ date: v })} />
              <Text label="Credential link" value={x.link} onChange={(v) => set({ link: v })} />
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
          render={(x, set) => (
            <div className="grid-2">
              <Text label="Title" value={x.title} onChange={(v) => set({ title: v })} />
              <Text label="Detail" value={x.detail} onChange={(v) => set({ detail: v })} />
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
          render={(x, set) => (
            <div className="stack">
              <Text label="Section title" value={x.title} onChange={(v) => set({ title: v })} placeholder="Open Source" />
              <Text label="Content" hint="Blank line = new paragraph. Lines starting with “- ” become bullets." multiline rows={6} value={x.content} onChange={(v) => set({ content: v })} />
            </div>
          )}
        />
      )}
    </div>
  );
}
