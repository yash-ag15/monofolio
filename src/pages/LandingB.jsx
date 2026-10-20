// Landing page — version B: light "paper & ink" editorial look, kinetic headline, and one object
// that morphs as you scroll (profile → website → resume → ATS score → dev card).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { Thumb } from '../components/Thumb.jsx';
import { DEFAULT_DESIGN, sampleProfile, withFreshLook } from '../store.jsx';
import { THEMES, renderPortfolio } from '../portfolio/render.js';
import { RESUME_TEMPLATES } from '../resume/templates.js';
import { README_TEMPLATES } from '../readme/templates.js';
import { CARD_DESIGNS } from '../card/designs.jsx';
import CompareSwitch from '../components/CompareSwitch.jsx';
import { FAQ } from '../landing/faq.js';

const floor10 = (n) => (n >= 10 ? `${Math.floor(n / 10) * 10}+` : String(n));
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const go = (r) => (window.location.hash = `/${r}`);

// ---------- hero: the last word keeps changing ----------
const WORDS = ['portfolio', 'resume', 'cover letter', 'GitHub README', 'dev card'];
function Rotator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="l2-rot" aria-live="polite">
      <span className="l2-rot-word" key={i}>
        {WORDS[i]}
      </span>
      <span className="l2-rot-sizer" aria-hidden="true">
        cover letter
      </span>
    </span>
  );
}

// three documents on a desk that drift with the mouse
function Desk() {
  const ref = useRef(null);
  const [m, setM] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced()) return;
    const on = (e) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setM({ x: (e.clientX - (r.left + r.width / 2)) / r.width, y: (e.clientY - (r.top + r.height / 2)) / r.height });
    };
    window.addEventListener('pointermove', on);
    return () => window.removeEventListener('pointermove', on);
  }, []);
  const at = (depth, rot) => ({ transform: `translate(${m.x * depth}px, ${m.y * depth}px) rotate(${rot}deg)` });
  return (
    <div className="l2-desk" ref={ref} aria-hidden="true">
      <div className="l2-doc l2-doc-site" style={at(-26, -4)}>
        <div className="l2-chrome">
          <i />
          <i />
          <i />
          <span>luffy.github.io</span>
        </div>
        <div className="l2-site-in">
          <small>Full-stack developer · Indore</small>
          <b>Mugiwara Luffy</b>
          <p>I build fast, accessible web apps.</p>
          <div className="l2-pills">
            <em>React</em>
            <em>Node.js</em>
            <em>SQL</em>
          </div>
        </div>
      </div>
      <div className="l2-doc l2-doc-resume" style={at(18, 3)}>
        <b>Mugiwara Luffy</b>
        <span className="l2-r-sub">luffy@example.com · Indore</span>
        <span className="l2-r-h">Experience</span>
        <i style={{ width: '90%' }} />
        <i style={{ width: '75%' }} />
        <span className="l2-r-h">Projects</span>
        <i style={{ width: '85%' }} />
        <i style={{ width: '60%' }} />
        <span className="l2-r-h">Skills</span>
        <i style={{ width: '70%' }} />
      </div>
      <div className="l2-doc l2-doc-card" style={at(34, -8)}>
        <span className="l2-av">ML</span>
        <b>Mugiwara Luffy</b>
        <span>Full-stack developer</span>
        <span className="l2-qr" />
      </div>
      <span className="l2-sticker s1" style={at(46, -10)}>
        free for students
      </span>
      <span className="l2-sticker s2" style={at(-40, 8)}>
        no code needed
      </span>
      <span className="l2-sticker s3" style={at(30, 6)}>
        ✦ AI built in
      </span>
    </div>
  );
}

// ---------- the morph: one object, five shapes, driven by scroll ----------
const STEPS = [
  { k: 'profile', n: '01', title: 'Start with you.', text: 'Fill in your details once — or import your old resume PDF. It’s the only form you’ll fill in.' },
  { k: 'site', n: '02', title: 'Become a website.', text: `Pick from ${floor10(Object.keys(THEMES).length)} themes or describe the look you want. AI writes real HTML you own and can host free.` },
  { k: 'resume', n: '03', title: 'Become a resume.', text: 'Clean one-page templates, filled in from your profile. Download as PDF or LaTeX.' },
  { k: 'ats', n: '04', title: 'Get past the robots.', text: 'See your resume the way hiring software reads it, then tailor it to each job post.' },
  { k: 'card', n: '05', title: 'Be remembered.', text: 'A cover letter for every company, a GitHub README, and a dev card with a QR to your site.' },
];

function MorphFace({ k }) {
  if (k === 'profile')
    return (
      <div className="l2-f-profile">
        <small>dev identity</small>
        {[
          ['Name', 'Mugiwara Luffy'],
          ['Role', 'Full-stack developer'],
          ['Skills', 'React · Node.js · SQL'],
          ['Project', 'CampusCart · 1,200 users'],
        ].map(([l, v]) => (
          <label key={l}>
            <span>{l}</span>
            <b>{v}</b>
          </label>
        ))}
      </div>
    );
  if (k === 'site')
    return (
      <div className="l2-f-site">
        <div className="l2-chrome">
          <i />
          <i />
          <i />
          <span>luffy.github.io</span>
        </div>
        <div className="l2-f-site-in">
          <small>Full-stack developer · Indore</small>
          <b>Mugiwara Luffy</b>
          <div className="l2-pills">
            <em>React</em>
            <em>Node.js</em>
            <em>SQL</em>
          </div>
          <div className="l2-f-proj">
            <span>CampusCart</span>
            <span>git-standup</span>
            <span>Exam Planner</span>
          </div>
        </div>
      </div>
    );
  if (k === 'resume')
    return (
      <div className="l2-f-resume">
        <b>Mugiwara Luffy</b>
        <span className="l2-r-sub">+91 98765 43210 · luffy@example.com · Indore</span>
        <span className="l2-r-h">Education</span>
        <p>Indore Institute of Technology — B.Tech CS, 8.9 CGPA</p>
        <span className="l2-r-h">Experience</span>
        <p>• React dashboard used by 40+ analysts</p>
        <p>• API latency cut by 35% with Redis</p>
        <span className="l2-r-h">Projects</span>
        <p>• CampusCart — 1,200 students in one semester</p>
      </div>
    );
  if (k === 'ats')
    return (
      <div className="l2-f-ats">
        <b>86</b>
        <span>ATS score · Excellent</span>
      </div>
    );
  return (
    <div className="l2-f-card">
      <span className="l2-av">ML</span>
      <div>
        <b>Mugiwara Luffy</b>
        <span>Full-stack developer · Indore</span>
      </div>
      <span className="l2-qr" />
    </div>
  );
}

// Plays through the five shapes on its own while on screen (no scroll-pinning); any step can be clicked.
const STEP_MS = 3200;
function Morph() {
  const ref = useRef(null);
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!inView || paused || reduced()) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [step, inView, paused]);
  const s = STEPS[step];
  const running = inView && !paused && !reduced();
  return (
    <section className="l2-morph-sec" ref={ref} id="how" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="l2-morph-copy">
        <span className="l2-kicker">How it works</span>
        <div className="l2-step-n">
          <b key={s.n}>{s.n}</b>
          <span>/ 0{STEPS.length}</span>
        </div>
        <h2 key={`t${step}`}>{s.title}</h2>
        <p key={`p${step}`}>{s.text}</p>
        <ol className="l2-steps">
          {STEPS.map((x, i) => (
            <li key={x.k}>
              <button className={i === step ? 'on' : i < step ? 'done' : ''} onClick={() => setStep(i)}>
                <span>{x.title.replace('.', '')}</span>
                <i>{i === step && <em className={running ? 'run' : ''} key={`${step}-${running}`} style={{ animationDuration: `${STEP_MS}ms` }} />}</i>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="l2-morph-stage">
        <div className={`l2-morph m-${s.k}`}>
          {STEPS.map((x) => (
            <div key={x.k} className={`l2-face ${x.k === s.k ? 'on' : ''}`}>
              <MorphFace k={x.k} />
            </div>
          ))}
        </div>
        <span className="l2-morph-label">{s.k === 'profile' ? 'your profile' : `↳ ${s.k === 'ats' ? 'ATS check' : s.k === 'card' ? 'dev card' : s.k}`}</span>
      </div>
    </section>
  );
}

// ---------- theme shuffler: real themes, rendered live ----------
function Shuffler() {
  const keys = useMemo(() => Object.keys(THEMES), []);
  const person = useMemo(() => sampleProfile(), []);
  const [k, setK] = useState(() => keys[Math.floor(keys.length / 3)]);
  const [spin, setSpin] = useState(0);
  const frame = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const html = useMemo(() => renderPortfolio(person, withFreshLook(DEFAULT_DESIGN, { layout: k, ...THEMES[k].preset }), { thumb: true }), [k, person]);
  const shuffle = () => {
    let n = k;
    while (n === k) n = keys[Math.floor(Math.random() * keys.length)];
    setK(n);
    setSpin((x) => x + 1);
  };
  return (
    <section className="l2-shuffle" id="themes">
      <div className="l2-shuffle-copy">
        <span className="l2-kicker">Themes</span>
        <h2>
          {floor10(keys.length)} looks. <em>Zero</em> templates that look like everyone’s.
        </h2>
        <p>Every theme is a real, live page — this one is showing sample data. Hit shuffle and see a different direction.</p>
        <button className="l2-btn ink" onClick={shuffle}>
          <Icon name="shuffle" size={16} /> Shuffle theme
        </button>
        <div className="l2-theme-meta" key={spin}>
          <b>{THEMES[k].name}</b>
          <span>{THEMES[k].cat}</span>
        </div>
      </div>
      <div className="l2-shuffle-frame" ref={frame}>
        <div className="l2-chrome">
          <i />
          <i />
          <i />
          <span>luffy.github.io</span>
        </div>
        <div className="l2-shuffle-view" key={k}>
          {w > 0 && <Thumb html={html} scale={w / 1280} height={Math.round(w * 0.62)} eager />}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="l2-faq">
      {FAQ.map(([q, a], i) => (
        <div key={q} className={`l2-q ${open === i ? 'open' : ''}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span>{q}</span>
            <i aria-hidden="true">+</i>
          </button>
          <div className="l2-a">
            <p>{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const TICKER = ['Portfolio website', 'Resume & CV', 'ATS checker', 'Job tailoring', 'Cover letters', 'GitHub README', 'Dev card', 'AI studio'];

export default function LandingB() {
  const scroller = useRef(null);
  const top = () => scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const counts = [
    [floor10(Object.keys(THEMES).length), 'portfolio themes'],
    [String(Object.keys(RESUME_TEMPLATES).length), 'resume templates'],
    [floor10(README_TEMPLATES.length), 'README templates'],
    [String(CARD_DESIGNS.length), 'dev card designs'],
  ];

  return (
    <div className="l2" ref={scroller}>
      <header className="l2-nav">
        <a className="l2-logo" href="#/b" onClick={(e) => (e.preventDefault(), top())}>
          <span className="l2-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          monofolio
        </a>
        <nav>
          <button onClick={() => jump('how')}>How it works</button>
          <button onClick={() => jump('themes')}>Themes</button>
          <button onClick={() => jump('faq')}>FAQ</button>
        </nav>
        <div className="l2-nav-cta">
          <button className="l2-link" onClick={() => go('signin')}>
            Sign in
          </button>
          <button className="l2-btn ink sm" onClick={() => go('signup')}>
            Get started
          </button>
        </div>
      </header>

      {/* hero */}
      <section className="l2-hero">
        <p className="l2-kicker">
          <span className="l2-dot" /> For college developers
        </p>
        <h1>
          One profile.
          <br />
          <span className="l2-serif">A whole</span> <Rotator />
        </h1>
        <div className="l2-hero-row">
          <p className="l2-lede">
            Fill in your details once. Monofolio turns them into your portfolio website, an ATS-ready resume, cover letters, a GitHub README and a dev card — with AI that builds what you describe.
          </p>
          <div className="l2-hero-cta">
            <button className="l2-btn ink" onClick={() => go('signup')}>
              Start for free <Icon name="chevron" />
            </button>
            <button className="l2-btn line" onClick={() => jump('how')}>
              See how it works
            </button>
          </div>
        </div>
        <Desk />
      </section>

      <div className="l2-ticker" aria-hidden="true">
        <div className="l2-ticker-row">
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>
              {t} <em>✦</em>
            </span>
          ))}
        </div>
      </div>

      <Morph />

      <Shuffler />

      {/* numbers + FAQ */}
      <section className="l2-facts" id="faq">
        <div className="l2-counts">
          {counts.map(([n, label]) => (
            <div key={label}>
              <b>{n}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="l2-faq-wrap">
          <div>
            <span className="l2-kicker">Questions</span>
            <h2>
              Good to <span className="l2-serif">know.</span>
            </h2>
          </div>
          <Faq />
        </div>
      </section>

      {/* final */}
      <section className="l2-final">
        <h2>
          Start writing <span className="l2-serif">yourself</span>
          <br />
          into the job.
        </h2>
        <button className="l2-btn paper" onClick={() => go('signup')}>
          Create your free account <Icon name="chevron" />
        </button>
        <p>Takes less than a minute · Google or email</p>
      </section>

      <footer className="l2-foot">
        <div className="l2-foot-main">
          <a className="l2-logo" href="#/b" onClick={(e) => (e.preventDefault(), top())}>
            <span className="l2-mark" aria-hidden="true">
              <i />
              <i />
            </span>
            monofolio
          </a>
          <p>The job kit for college developers. One profile in — portfolio, resume, letters, README and dev card out.</p>
        </div>
        <div className="l2-foot-links">
          <button onClick={() => jump('how')}>How it works</button>
          <button onClick={() => jump('themes')}>Themes</button>
          <button onClick={() => jump('faq')}>FAQ</button>
          <button onClick={() => go('signup')}>Create account</button>
          <button onClick={() => go('signin')}>Sign in</button>
        </div>
        <div className="l2-foot-end">
          <span>© {new Date().getFullYear()} Monofolio</span>
          <button onClick={top}>
            Back to top <Icon name="up" size={13} />
          </button>
        </div>
      </footer>
      <CompareSwitch current="b" />
    </div>
  );
}
