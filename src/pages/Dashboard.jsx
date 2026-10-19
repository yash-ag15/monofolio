import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_DESIGN, isBlankProfile, previewProfile, useStore } from '../store.jsx';
import { Icon, downloadFile, useToast } from '../components/ui.jsx';
import { NAV } from '../nav.js';
import { uniquenessScore } from '../portfolio/brief.js';
import { THEMES, renderPortfolio } from '../portfolio/render.js';
import { checkResume, scoreLabel } from '../resume/ats.js';
import { Thumb } from '../components/Thumb.jsx';
import { ScoreRing } from './Ats.jsx';
import { useAccount } from '../lib/account.jsx';

const TOOL_TEXT = {
  profile: 'Your details in one place — every other tool fills itself from here.',
  studio: 'Pick a look or describe one — AI builds your portfolio site.',
  github: 'Pull in your repos and keep project stars up to date.',
  resume: 'Clean, ATS-friendly resumes ready to download as PDF.',
  ats: 'See your resume the way company hiring software does.',
  tailor: 'Match your resume to a job post, keyword by keyword.',
  readme: 'A standout GitHub profile page from 35 templates.',
  cover: 'A personal cover letter for each job in seconds.',
  card: 'A shareable card for LinkedIn, WhatsApp or events.',
};

function completeness(p) {
  const b = p.basics;
  const checks = [
    ['Add your name and a one-line headline', b.name && b.headline],
    ['Write an About section (60+ words)', (b.about || '').split(/\s+/).filter(Boolean).length >= 60],
    ['Add a contact email', b.email],
    ['Add at least 2 links (GitHub, LinkedIn…)', p.socials.filter((s) => s.url).length >= 2],
    ['List 8 or more skills', p.skills.flatMap((s) => s.items.split(',')).filter((x) => x.trim()).length >= 8],
    ['Add 3 or more projects', p.projects.length >= 3],
    ['Give every project a live link or code link', p.projects.length > 0 && p.projects.every((x) => x.link || x.repo)],
    ['Use numbers in your highlights (e.g. “500+ users”)', [...p.projects.map((x) => x.bullets), ...p.experience.map((x) => x.bullets)].some((t) => /\d/.test(t || ''))],
    ['Add your education', p.education.length > 0],
    ['Say if you’re open to work', b.availability],
  ];
  const done = checks.filter((c) => c[1]).length;
  return { checks, pct: Math.round((done / checks.length) * 100) };
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Width of an element, so the live preview scales to fit its card.
function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export default function Dashboard({ go }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const p = state.profile;
  const ms = state.milestones || {};
  const resumes = state.resumes || [];
  const letters = state.coverLetters || [];
  const code = state.code || {};
  const { checks, pct } = completeness(p);
  const { user } = useAccount();
  const firstName = (p.basics.name || user?.name || '').split(' ')[0];
  const unique = uniquenessScore(state.design, DEFAULT_DESIGN);
  const useCode = code.active && !!code.html;
  const themeName = useCode && code.base !== 'theme' ? 'Custom AI design' : (THEMES[state.design.layout] || THEMES.classic).name;
  const stars = p.projects.reduce((n, x) => n + (Number(x.stars) || 0), 0);
  const tailoredCount = resumes.filter((r) => r.tailoredFor).length;
  const lettersWritten = letters.filter((l) => (l.text || '').trim()).length;
  const missing = checks.filter((c) => !c[1]);

  const activeResume = resumes.find((r) => r.id === state.activeResume) || resumes[0];
  const ats = useMemo(() => {
    if (!activeResume) return null;
    try {
      return checkResume(activeResume).score;
    } catch {
      return null;
    }
  }, [activeResume]);

  const [previewRef, previewW] = useWidth();
  const previewHtml = useMemo(() => (useCode ? code.html : renderPortfolio(previewProfile(p), { ...state.design }, { thumb: true })), [useCode, code.html, p, state.design]);
  const sampleShown = !useCode && isBlankProfile(p);

  const steps = [
    { id: 'profile', title: 'Fill in your details', text: 'Name, skills, projects — entered once, used everywhere.', done: pct >= 70, action: 'Complete profile', route: 'profile', icon: 'user' },
    { id: 'design', title: 'Choose your portfolio look', text: 'Pick a theme, or describe your dream site to AI.', done: unique > 0 || useCode || !!ms.exported, action: 'Open Studio', route: 'studio', icon: 'palette' },
    { id: 'export', title: 'Download your portfolio', text: 'One index.html file — host it free on GitHub Pages or Netlify.', done: !!ms.exported, action: 'Export site', route: 'studio?tab=publish', icon: 'rocket' },
    { id: 'resume', title: 'Make your resume', text: 'Auto-filled from your profile. Download as PDF.', done: !!ms.resumeExported, action: 'Build resume', route: 'resume', icon: 'file' },
    { id: 'ats', title: 'Check your ATS score', text: 'See what hiring software sees, and what to fix.', done: !!ms.atsChecked, action: 'Check score', route: 'ats', icon: 'check' },
    { id: 'apply', title: 'Apply to a job', text: 'Tailor your resume and write a cover letter for it.', done: tailoredCount > 0 || !!ms.coverMade, action: 'Tailor resume', route: 'tailor', icon: 'target' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  const status = {
    profile: { text: `${pct}% complete`, on: pct >= 70 },
    studio: { text: ms.exported ? `${themeName} · exported` : themeName, on: !!ms.exported },
    github: { text: state.github?.username ? `@${state.github.username}` : 'Not connected', on: !!state.github?.username },
    resume: { text: resumes.length ? `${resumes.length} resume${resumes.length === 1 ? '' : 's'}` : 'Not started', on: resumes.length > 0 },
    ats: { text: ms.atsChecked && ats != null ? `Score ${ats} · ${scoreLabel(ats)}` : 'Not checked yet', on: !!ms.atsChecked },
    tailor: { text: tailoredCount ? `${tailoredCount} tailored` : 'Not started', on: tailoredCount > 0 },
    readme: { text: ms.readmeMade ? 'Downloaded' : 'Not started', on: !!ms.readmeMade },
    cover: { text: lettersWritten ? `${lettersWritten} letter${lettersWritten === 1 ? '' : 's'}` : 'Not started', on: lettersWritten > 0 },
    card: { text: ms.cardMade ? 'Saved' : 'Not started', on: !!ms.cardMade },
  };

  return (
    <div className="page dash">
      {/* Greeting + the one thing to do next */}
      <section className="dash-hero">
        <div className="dash-hello">
          <span className="dash-kicker">{greeting()}{firstName ? `, ${firstName}` : ''} 👋</span>
          <h1>{next ? 'Let’s get you job-ready.' : 'You’re all set. Go apply!'}</h1>
          <p>Build your portfolio, resume and cover letters from one profile. Everything is saved to your account.</p>
          <div className="dash-progress">
            <div className="dash-progress-top">
              <b>{doneCount} of {steps.length} steps done</b>
              <span>{Math.round((doneCount / steps.length) * 100)}%</span>
            </div>
            <div className="dash-bar">
              {steps.map((s, i) => (
                <i key={s.id} className={s.done ? 'on' : ''} title={`${s.title}${s.done ? ' — done' : ''}`} style={{ '--i': i }} />
              ))}
            </div>
          </div>
        </div>
        <div className="dash-next">
          {next ? (
            <>
              <span className="dash-label">Your next step</span>
              <div className="dash-next-icon">
                <Icon name={next.icon} size={20} />
              </div>
              <h2>{next.title}</h2>
              <p>{next.text}</p>
              <button className="btn" onClick={() => go(next.route)}>
                {next.action} <Icon name="chevron" />
              </button>
            </>
          ) : (
            <>
              <span className="dash-label">Extra credit</span>
              <div className="dash-next-icon">
                <Icon name="sparkle" size={20} />
              </div>
              <h2>Stand out even more</h2>
              <p>Add a GitHub profile README and a shareable dev card.</p>
              <div className="row">
                <button className="btn" onClick={() => go('readme')}>
                  Make a README
                </button>
                <button className="btn secondary" onClick={() => go('card')}>
                  Dev card
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Portfolio preview + numbers */}
      <section className="dash-split">
        <div className="card dash-preview">
          <div className="dash-preview-head">
            <div>
              <span className="dash-label">Your portfolio</span>
              <b>
                {themeName}
                {sampleShown && <span className="badge dash-sample">Sample content</span>}
              </b>
            </div>
            <div className="row">
              <button className="btn ghost sm" onClick={() => go('studio?tab=code')}>
                <Icon name="sparkle" /> Change with AI
              </button>
              <button className="btn secondary sm" onClick={() => go('studio')}>
                Open Studio
              </button>
            </div>
          </div>
          <div className="dash-frame" ref={previewRef}>
            <div className="dash-browser">
              <i />
              <i />
              <i />
              <span>{(p.basics.name || 'you').toLowerCase().replace(/\s+/g, '')}.github.io</span>
            </div>
            {previewW > 0 && <Thumb html={previewHtml} scale={previewW / 1280} height={Math.round(previewW * 0.6)} eager />}
            <button className="dash-frame-cover" onClick={() => go('studio')} aria-label="Open in Studio" />
          </div>
        </div>

        <div className="dash-stats">
          <button className="card dash-stat" onClick={() => go('profile')}>
            <ScoreRing value={pct} size={64} stroke={5} />
            <div>
              <span className="dash-label">Profile strength</span>
              <b>{pct >= 90 ? 'Excellent' : pct >= 70 ? 'Strong' : pct >= 40 ? 'Getting there' : 'Just started'}</b>
              <span className="muted small">{missing.length ? `${missing.length} thing${missing.length === 1 ? '' : 's'} to add` : 'Nothing missing'}</span>
            </div>
          </button>
          <button className="card dash-stat" onClick={() => go(activeResume ? 'ats' : 'resume')}>
            {ats != null ? <ScoreRing value={ats} size={64} stroke={5} /> : <span className="dash-num">—</span>}
            <div>
              <span className="dash-label">Resume ATS score</span>
              <b>{ats != null ? scoreLabel(ats) : 'No resume yet'}</b>
              <span className="muted small">{activeResume ? activeResume.name : 'Create one in a minute'}</span>
            </div>
          </button>
          <button className="card dash-stat" onClick={() => go('github')}>
            <span className="dash-num">{p.projects.length}</span>
            <div>
              <span className="dash-label">Projects</span>
              <b>
                <Icon name="star" size={13} /> {stars} stars
              </b>
              <span className="muted small">{p.projects.filter((x) => x.source === 'github' || /github\.com/.test(x.repo || '')).length} linked to GitHub</span>
            </div>
          </button>
          <button className="card dash-stat" onClick={() => go('studio')}>
            <span className="dash-num">{unique}%</span>
            <div>
              <span className="dash-label">Design uniqueness</span>
              <b>{unique >= 60 ? 'One of a kind' : unique >= 25 ? 'Personalised' : 'Close to default'}</b>
              <span className="muted small">How far you’ve moved from the default look</span>
            </div>
          </button>
        </div>
      </section>

      {/* What to improve */}
      {missing.length > 0 && (
        <section className="card dash-improve">
          <div className="dash-improve-head">
            <div>
              <h3>Quick wins for your profile</h3>
              <p>Recruiters look for these first. Each takes a minute or two.</p>
            </div>
            <button className="btn secondary sm" onClick={() => go('profile')}>
              Edit profile
            </button>
          </div>
          <div className="dash-wins">
            {missing.slice(0, 6).map(([label]) => (
              <button key={label} className="dash-win" onClick={() => go('profile')}>
                <span className="dash-win-dot" />
                <span>{label}</span>
                <Icon name="chevron" size={13} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* All tools with status */}
      {NAV.slice(1).map((g) => (
        <section key={g.title} className="dash-section">
          <div className="dash-section-head">
            <h3>{g.title}</h3>
          </div>
          <div className="dash-tools">
            {g.items.map((it) => {
              const st = status[it.id];
              return (
                <button key={it.id} className="dash-tool" onClick={() => go(it.id)}>
                  <div className="dash-tool-top">
                    <span className="dash-tool-icon">
                      <Icon name={it.icon} />
                    </span>
                    {st && <span className={`dash-chip ${st.on ? 'on' : ''}`}>{st.text}</span>}
                  </div>
                  <h4>{it.label}</h4>
                  <p>{TOOL_TEXT[it.id]}</p>
                  <span className="dash-tool-go">
                    Open <Icon name="chevron" size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Data */}
      <section className="card dash-data">
        <div>
          <h3>
            <Icon name="eye" size={15} /> Your data is safe
          </h3>
          <p>Saved to your account automatically — sign in on any device to continue. You can also download a backup copy.</p>
        </div>
        <div className="row">
          <button className="btn secondary sm" onClick={() => downloadFile('monofolio-backup.json', JSON.stringify(state, null, 2), 'application/json')}>
            <Icon name="download" /> Save backup
          </button>
          <label className="btn secondary sm">
            <Icon name="upload" /> Restore backup
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
          <button className="btn ghost sm" onClick={() => confirm('Replace everything with the sample profile?') && dispatch({ type: 'all/reset' })}>
            Load sample
          </button>
          <button className="btn ghost sm" onClick={() => confirm('Clear all your data and start from a blank profile? Save a backup first if you want to keep it.') && dispatch({ type: 'all/reset', empty: true })}>
            Start fresh
          </button>
        </div>
      </section>
    </div>
  );
}
