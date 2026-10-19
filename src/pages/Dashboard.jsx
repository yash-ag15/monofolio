import { DEFAULT_DESIGN, useStore } from '../store.jsx';
import { Icon, downloadFile, useToast } from '../components/ui.jsx';
import { NAV } from '../nav.js';
import { uniquenessScore } from '../portfolio/brief.js';

const TOOL_TEXT = {
  profile: 'Everything about you in one place — the source for every other tool.',
  studio: 'Design a portfolio that looks like nobody else’s. Describe it or show an image — AI builds it — then fine-tune and export.',
  github: 'Import repositories and keep project stars in sync.',
  resume: 'ATS-friendly résumés and CVs generated from your identity.',
  tailor: 'Match your résumé to a job description, keyword by keyword.',
  ats: 'Check formatting, keywords and readability like an ATS would.',
  cover: 'Personalised cover letters from your projects and the job post.',
  card: 'Shareable developer cards as PNG or PDF.',
  roast: 'Honest feedback on design, content, accessibility and recruiter appeal.',
};

function completeness(p) {
  const b = p.basics;
  const checks = [
    ['Name and headline', b.name && b.headline],
    ['About section (60+ words)', (b.about || '').split(/\s+/).filter(Boolean).length >= 60],
    ['Contact email', b.email],
    ['At least 2 links (GitHub, LinkedIn…)', p.socials.filter((s) => s.url).length >= 2],
    ['8+ skills', p.skills.flatMap((s) => s.items.split(',')).filter((x) => x.trim()).length >= 8],
    ['3+ projects', p.projects.length >= 3],
    ['Projects with live links or code', p.projects.length > 0 && p.projects.every((x) => x.link || x.repo)],
    ['Numbers in your highlights', [...p.projects.map((x) => x.bullets), ...p.experience.map((x) => x.bullets)].some((t) => /\d/.test(t || ''))],
    ['Education', p.education.length > 0],
    ['Availability status', b.availability],
  ];
  const done = checks.filter((c) => c[1]).length;
  return { checks, pct: Math.round((done / checks.length) * 100) };
}

export default function Dashboard({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const p = state.profile;
  const { checks, pct } = completeness(p);
  const firstName = (p.basics.name || '').split(' ')[0];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{firstName ? `Welcome back, ${firstName}` : 'Welcome'}</h1>
          <p>Your developer identity, portfolio and career kit — all in one place, private to your browser.</p>
        </div>
      </div>

      <div className="hero-card" style={{ marginBottom: 20 }}>
        <div>
          <h2>Build a portfolio that’s unmistakably yours.</h2>
          <p>Pick from 35 art directions, drop in an inspiration image, add 3D and animations, or describe the look you want in plain words — “dark terminal vibe, projects first, huge serif name” — and the studio turns it into a real design. Then remix, fine-tune and export a single HTML file you can host anywhere for free.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => go('studio')}>
            <Icon name="wand" /> Open Studio
          </button>
          <button className="btn secondary" onClick={() => go('profile')}>
            Edit details
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card card-pad stat">
          <span className="small muted">Profile completeness</span>
          <b>{pct}%</b>
          <div className="progress">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="card card-pad stat">
          <span className="small muted">Design uniqueness</span>
          <b>{uniquenessScore(state.design, DEFAULT_DESIGN)}%</b>
          <span className="small muted">How far you’ve moved from the default look</span>
        </div>
        <div className="card card-pad stat">
          <span className="small muted">Projects</span>
          <b>{p.projects.length}</b>
          <span className="small muted">{p.projects.filter((x) => x.source === 'github' || /github\.com/.test(x.repo || '')).length} linked to GitHub</span>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 28 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Portfolio checklist</h3>
              <p>What recruiters look for first.</p>
            </div>
          </div>
          <div className="card-pad"><ul className="checklist">
            {checks.map(([label, ok]) => (
              <li key={label} className={ok ? 'done' : ''}>
                <span className="box">{ok && <Icon name="check" size={11} strokeWidth={3} />}</span>
                <span>{label}</span>
              </li>
            ))}
          </ul></div>
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Your data</h3>
              <p>Stored only in this browser. Back it up or move it to another device.</p>
            </div>
          </div>
          <div className="card-pad stack">
            <div className="row">
              <button
                className="btn secondary sm"
                onClick={() => downloadFile('monofolio-backup.json', JSON.stringify(state, null, 2), 'application/json')}
              >
                <Icon name="download" /> Export backup
              </button>
              <label className="btn secondary sm">
                <Icon name="upload" /> Import backup
                <input
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const data = JSON.parse(await f.text());
                      if (!data.profile) throw new Error();
                      dispatch({ type: 'all/replace', state: data });
                      toast('Backup restored');
                    } catch {
                      toast('That is not a valid Monofolio backup');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div className="row">
              <button
                className="btn ghost sm"
                onClick={() => {
                  if (confirm('Replace everything with the sample profile?')) dispatch({ type: 'all/reset' });
                }}
              >
                Load sample data
              </button>
              <button
                className="btn ghost sm"
                onClick={() => {
                  if (confirm('Clear all your data and start from a blank profile? Export a backup first if you want to keep it.')) dispatch({ type: 'all/reset', empty: true });
                }}
              >
                Start blank
              </button>
            </div>
          </div>
        </div>
      </div>

      {NAV.slice(1).map((g) => (
        <div key={g.title} style={{ marginBottom: 24 }}>
          <div className="nav-title" style={{ padding: '0 0 10px' }}>
            {g.title}
          </div>
          <div className="tool-grid">
            {g.items.map((it) => (
              <button key={it.id} className="tool" onClick={() => go(it.id)}>
                <Icon name={it.icon} />
                <h4>
                  {it.label}
                  {it.soon && <span className="badge">next</span>}
                </h4>
                <p>{TOOL_TEXT[it.id]}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
