import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { Thumb } from '../components/Thumb.jsx';
import { DEFAULT_DESIGN, sampleProfile, withFreshLook } from '../app/store.jsx';
import { THEMES, renderPortfolio } from '../portfolio/render.js';
import { RESUME_TEMPLATES } from '../resume/templates.js';
import { README_TEMPLATES } from '../readme/templates.js';
import { CARD_DESIGNS } from '../card/designs.jsx';
import { FAQ } from '../content/faq.js';
import { LogoMark } from '../components/Logo.jsx';

// Real counts from the product, rounded down so the claims are always true
const floor10 = (n) => (n >= 10 ? `${Math.floor(n / 10) * 10}+` : String(n));
const COUNTS = [
  [floor10(Object.keys(THEMES).length), 'portfolio themes'],
  [String(Object.keys(RESUME_TEMPLATES).length), 'resume templates'],
  [floor10(README_TEMPLATES.length), 'README templates'],
  [String(CARD_DESIGNS.length), 'dev card designs'],
];

// Fictional students the hero types out, one after another
const PEOPLE = [
  { name: 'Mugiwara Luffy', role: 'Full-stack developer', skills: ['React', 'Node.js', 'PostgreSQL'], project: 'CampusCart · 1,200 users' },
  { name: 'Ananya Rao', role: 'ML engineer', skills: ['Python', 'PyTorch', 'FastAPI'], project: 'NoteSense · lecture summaries' },
  { name: 'Kabir Shah', role: 'Android developer', skills: ['Kotlin', 'Compose', 'Firebase'], project: 'BusBuddy · 40k downloads' },
];

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Adds .in once an element scrolls into view (for the gentle reveal animations)
function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

// Types each person's details field by field, holds, clears, and moves to the next person
function usePersonaLoop() {
  const empty = { name: '', role: '', skills: [], project: '', field: 'name' };
  const [s, setS] = useState(() => (reduced() ? { ...PEOPLE[0], field: '' } : empty));
  useEffect(() => {
    if (reduced()) return;
    let alive = true;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const type = async (field, text, speed) => {
      for (let i = 1; i <= text.length && alive; i++) {
        setS((x) => ({ ...x, field, [field]: text.slice(0, i) }));
        await sleep(speed);
      }
    };
    (async () => {
      for (let n = 0; alive; n = (n + 1) % PEOPLE.length) {
        const p = PEOPLE[n];
        setS(empty);
        await sleep(500);
        await type('name', p.name, 55);
        await sleep(250);
        await type('role', p.role, 32);
        for (const sk of p.skills) {
          if (!alive) return;
          await sleep(280);
          setS((x) => ({ ...x, field: 'skills', skills: [...x.skills, sk] }));
        }
        await sleep(300);
        await type('project', p.project, 30);
        setS((x) => ({ ...x, field: '' }));
        await sleep(2800);
      }
    })();
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return s;
}

// Scales a fixed-size drawing to fit its container
function useFit(baseW) {
  const ref = useRef(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(Math.min(1, e.contentRect.width / baseW)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseW]);
  return [ref, k];
}

const Bar = ({ w, dark }) => <i className={`lp-bar ${dark ? 'dark' : ''}`} style={{ width: w }} />;
const Caret = ({ on }) => (on ? <span className="lp-caret" /> : null);

export function HeroStage() {
  const s = usePersonaLoop();
  const [ref, k] = useFit(600);
  const first = s.name.split(' ')[0];
  const initials = s.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  return (
    <div className="lp-stage-wrap" ref={ref} style={{ height: 520 * k }}>
      <div className="lp-stage" style={{ transform: `scale(${k})` }} aria-hidden="true">
        <svg className="lp-wires" viewBox="0 0 600 520" width="600" height="520">
          <path id="w1" d="M250 175 C 285 175, 265 95, 300 95" />
          <path id="w2" d="M250 320 C 290 320, 290 345, 332 352" />
          <path id="w3" d="M150 396 L 150 408" />
        </svg>
        <span className="lp-pulse p1" />
        <span className="lp-pulse p2" />

        {/* the one profile */}
        <div className="lp-editor">
          <div className="lp-win-bar">
            <i />
            <i />
            <i />
            <span>dev-identity</span>
          </div>
          <div className="lp-fields">
            <label className={s.field === 'name' ? 'on' : ''}>
              <small>name</small>
              <b>
                {s.name}
                <Caret on={s.field === 'name'} />
              </b>
            </label>
            <label className={s.field === 'role' ? 'on' : ''}>
              <small>role</small>
              <span>
                {s.role}
                <Caret on={s.field === 'role'} />
              </span>
            </label>
            <label className={s.field === 'skills' ? 'on' : ''}>
              <small>skills</small>
              <span className="lp-chips">
                {s.skills.map((x) => (
                  <em key={x}>{x}</em>
                ))}
              </span>
            </label>
            <label className={s.field === 'project' ? 'on' : ''}>
              <small>project</small>
              <span>
                {s.project}
                <Caret on={s.field === 'project'} />
              </span>
            </label>
          </div>
        </div>

        {/* …becomes a portfolio site */}
        <div className="lp-site">
          <div className="lp-win-bar light">
            <i />
            <i />
            <i />
            <span>{(s.name || 'you').toLowerCase().replace(/[^a-z]/g, '') || 'you'}.github.io</span>
          </div>
          <div className="lp-site-body">
            <small className="lp-mono">{s.role || <Bar w={90} />}</small>
            <h4>{s.name || <Bar w={170} dark />}</h4>
            <div className="lp-site-chips">{s.skills.length ? s.skills.map((x) => <em key={x}>{x}</em>) : <Bar w={120} />}</div>
            <div className="lp-site-card">
              <b>{s.project.split(' · ')[0] || <Bar w={70} dark />}</b>
              <span>{s.project.split(' · ')[1] || ''}</span>
            </div>
          </div>
        </div>

        {/* …a resume */}
        <div className="lp-resume">
          <h5>{s.name || <Bar w={100} dark />}</h5>
          <p className="lp-res-sub">{s.role ? `${s.role} · ${first.toLowerCase()}@mail.com` : <Bar w={120} />}</p>
          <div className="lp-res-h">Projects</div>
          <p className="lp-res-b">{s.project ? `• ${s.project}` : <Bar w={130} />}</p>
          <Bar w={140} />
          <Bar w={110} />
          <div className="lp-res-h">Skills</div>
          <p className="lp-res-b">{s.skills.join(', ') || <Bar w={120} />}</p>
          <Bar w={90} />
        </div>

        {/* …and a dev card */}
        <div className="lp-card">
          <span className="lp-card-av">{initials || '·'}</span>
          <div>
            <b>{s.name || <Bar w={90} />}</b>
            <span>{s.role || ''}</span>
          </div>
          <span className="lp-card-qr" />
        </div>
      </div>
    </div>
  );
}

// A slowly drifting row of real theme previews
function ThemeDrift() {
  const wrapRef = useRef(null);
  const rowRef = useRef(null);
  const [shift, setShift] = useState(0);
  const items = useMemo(() => {
    const cats = [...new Set(Object.values(THEMES).map((t) => t.cat))];
    const keys = Object.keys(THEMES);
    const picks = cats.flatMap((c) => keys.filter((k2) => THEMES[k2].cat === c).slice(0, 2)).slice(0, 9);
    const person = sampleProfile();
    return picks.map((key) => [key, renderPortfolio(person, withFreshLook(DEFAULT_DESIGN, { layout: key, ...THEMES[key].preset }), { thumb: true })]);
  }, []);
  useEffect(() => {
    const row = rowRef.current;
    const wrap = wrapRef.current;
    if (!row || !wrap) return;
    const ro = new ResizeObserver(() => setShift(Math.min(0, wrap.clientWidth - row.scrollWidth)));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="lp-drift" ref={wrapRef}>
      <div className="lp-drift-row" ref={rowRef} style={{ '--shift': `${shift}px` }}>
        {items.map(([key, html]) => (
          <figure key={key} className="lp-theme">
            <div className="lp-theme-pic">
              <Thumb html={html} scale={300 / 1280} height={190} />
            </div>
            <figcaption>
              <b>{THEMES[key].name}</b>
              <span>{THEMES[key].cat}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

// ---------- tool tiles ----------
// ---------- career kit showcase: one tool at a time, shown as the real thing ----------
function useCountUp(target, on, ms = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    if (reduced()) return setV(target);
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, target, ms]);
  return v;
}

function ResumeScene() {
  const names = useMemo(() => Object.values(RESUME_TEMPLATES).map((t) => t.name), []);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => setI((x) => (x + 1) % names.length), 1800);
    return () => clearInterval(t);
  }, [names.length]);
  return (
    <div className="sc-resume">
      <div className="sc-paper">
        <h4>Mugiwara Luffy</h4>
        <p className="sc-contact">+91 98765 43210 · luffy@example.com · github.com · Indore, India</p>
        <div className="sc-h">Education</div>
        <div className="sc-row">
          <b>Indore Institute of Technology</b>
          <span>2023 – 2027</span>
        </div>
        <p className="sc-it">B.Tech in Computer Science · CGPA 8.9/10</p>
        <div className="sc-h">Experience</div>
        <div className="sc-row">
          <b>Finlytics — Software Engineering Intern</b>
          <span>May – Jul 2026</span>
        </div>
        <ul>
          <li>Built a React dashboard used daily by 40+ analysts</li>
          <li>Cut API latency by 35% with Redis caching</li>
        </ul>
        <div className="sc-h">Projects</div>
        <div className="sc-row">
          <b>CampusCart | Next.js, PostgreSQL</b>
          <span>2026</span>
        </div>
        <ul>
          <li>Campus marketplace with 1,200+ students in one semester</li>
        </ul>
        <div className="sc-h">Skills</div>
        <p className="sc-small">React, Node.js, TypeScript, Python, SQL, Docker, AWS</p>
      </div>
      <div className="sc-side">
        <span className="sc-tag" key={i}>
          {names[i]}
        </span>
        <span className="sc-tag ghost">1 page ✓</span>
        <span className="sc-tag ghost">PDF · LaTeX · TXT</span>
      </div>
    </div>
  );
}

function AtsScene({ on }) {
  const v = useCountUp(86, on);
  const c = 2 * Math.PI * 52;
  const rows = [
    ['Formatting & parsing', 100],
    ['Keywords for this job', 82],
    ['Impact in bullet points', 74],
    ['Contact & sections', 100],
  ];
  return (
    <div className="sc-ats">
      <div className="sc-ring">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="52" className="track" />
          <circle cx="65" cy="65" r="52" className="val" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
        </svg>
        <div>
          <b>{v}</b>
          <span>{v >= 85 ? 'Excellent' : v >= 70 ? 'Good' : 'Checking…'}</span>
        </div>
      </div>
      <div className="sc-checks">
        {rows.map(([label, pct], i) => (
          <div key={label} className="sc-check">
            <div>
              <span>{label}</span>
              <b>{pct}%</b>
            </div>
            <i>
              <em style={{ width: on ? `${pct}%` : 0, transitionDelay: `${0.2 + i * 0.15}s` }} />
            </i>
          </div>
        ))}
        <p className="sc-fix">
          <Icon name="alert" size={13} /> Top fix: add a number to “Wrote unit tests…”
        </p>
      </div>
    </div>
  );
}

function TailorScene({ on }) {
  const before = 64;
  const after = useCountUp(91, on, 1800);
  return (
    <div className="sc-tailor">
      <div className="sc-jd">
        <small className="lp-mono">job post · SDE Intern</small>
        <p>
          We’re looking for an intern comfortable with <mark>React</mark> and <mark>Node.js</mark>, who has built <mark>REST APIs</mark>, knows <mark>SQL</mark>, and has
          seen <mark className="add">Docker</mark> or <mark className="add late">CI/CD</mark> pipelines…
        </p>
      </div>
      <div className="sc-match">
        <div className="sc-match-row">
          <span>Before</span>
          <i>
            <em style={{ width: `${before}%` }} />
          </i>
          <b>{before}%</b>
        </div>
        <div className="sc-match-row now">
          <span>Tailored</span>
          <i>
            <em style={{ width: `${Math.max(before, after)}%` }} />
          </i>
          <b>{Math.max(before, after)}%</b>
        </div>
        <div className="sc-suggest">
          <small className="lp-mono">AI suggests</small>
          <p>+ “Containerised CampusCart with Docker and deployed via GitHub Actions”</p>
        </div>
      </div>
    </div>
  );
}

function LetterScene() {
  return (
    <div className="sc-letter">
      <div className="sc-letter-paper">
        <p className="sc-letter-to">To the Hiring Team, Razorpay</p>
        <p className="sc-type t1">I’m a final-year CS student who loves turning messy problems into simple products.</p>
        <p className="sc-type t2">At Finlytics I built a dashboard 40+ analysts use daily, and cut API latency by 35%.</p>
        <p className="sc-type t3">Your checkout is the one I study when I build — I’d love to help make it faster.</p>
        <p className="sc-sign">Sincerely,
          <br />
          Mugiwara Luffy
        </p>
      </div>
      <div className="sc-side">
        <span className="sc-tag">Tone: confident</span>
        <span className="sc-tag ghost">~250 words</span>
      </div>
    </div>
  );
}

function ReadmeScene() {
  return (
    <div className="sc-readme">
      <div className="sc-gh-bar">
        <Icon name="github" size={14} /> <span>luffy / README.md</span>
      </div>
      <div className="sc-gh-body">
        <h4>Hi, I’m Luffy 👋</h4>
        <p>Full-stack developer · building things students actually use</p>
        <div className="sc-badges">
          {['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'].map((b, i) => (
            <em key={b} style={{ animationDelay: `${i * 0.12}s` }}>
              {b}
            </em>
          ))}
        </div>
        <SnakeGrid />
      </div>
    </div>
  );
}

function SnakeGrid() {
  const W = 30;
  const H = 7;
  const [pos, setPos] = useState(24);
  const levels = useMemo(() => Array.from({ length: W * H }, (_, i) => [0, 1, 0, 2, 1, 3, 0, 1][(i * 7 + (i % 5)) % 8]), []);
  const order = useMemo(() => {
    const o = [];
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) o.push((x % 2 ? H - 1 - y : y) * W + x);
    return o;
  }, []);
  useEffect(() => {
    if (reduced()) return;
    const t = setInterval(() => setPos((p) => (p + 1) % (W * H)), 110);
    return () => clearInterval(t);
  }, []);
  const body = new Set(Array.from({ length: 7 }, (_, j) => order[(pos - j + W * H) % (W * H)]));
  return (
    <div className="lp-snake" style={{ gridTemplateColumns: `repeat(${W}, 1fr)` }}>
      {levels.map((l, i) => (
        <i key={i} className={body.has(i) ? 'snake' : `l${l}`} />
      ))}
    </div>
  );
}

function CardScene() {
  return (
    <div className="sc-cardscene">
      <div className="lp-tilt">
        <div className="lp-devcard big">
          <span className="lp-card-av">ML</span>
          <b>Mugiwara Luffy</b>
          <span>Full-stack developer · Indore</span>
          <div className="lp-devcard-foot">
            <em>React</em>
            <em>Node</em>
            <em>SQL</em>
            <span className="lp-card-qr" />
          </div>
        </div>
      </div>
      <div className="sc-side">
        <span className="sc-tag">QR → your portfolio</span>
        <span className="sc-tag ghost">PNG · PDF</span>
      </div>
    </div>
  );
}

const KIT = [
  { id: 'resume', title: 'Resume & CV', line: 'One-page, ATS-friendly templates, filled in from your profile.', Scene: ResumeScene },
  { id: 'ats', title: 'ATS checker', line: 'Your resume as hiring software reads it — with the fixes that matter most.', Scene: AtsScene },
  { id: 'tailor', title: 'Job tailoring', line: 'Paste a job post, close the keyword gaps, and let AI suggest bullet points.', Scene: TailorScene },
  { id: 'cover', title: 'Cover letters', line: 'A personal letter for each company, written from your real projects.', Scene: LetterScene },
  { id: 'readme', title: 'GitHub README', line: 'Profile READMEs from clean to wild — badges, stats, the contribution snake.', Scene: ReadmeScene },
  { id: 'card', title: 'Dev card', line: 'A shareable card with a QR to your portfolio, for LinkedIn and events.', Scene: CardScene },
];
const KIT_MS = 5200;

function KitShowcase({ on }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!on || paused || reduced()) return;
    const t = setTimeout(() => setI((x) => (x + 1) % KIT.length), KIT_MS);
    return () => clearTimeout(t);
  }, [i, on, paused]);
  const { Scene } = KIT[i];
  return (
    <div className="sc" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ol className="sc-list" role="tablist">
        {KIT.map((k, j) => (
          <li key={k.id}>
            <button role="tab" aria-selected={i === j} className={i === j ? 'on' : ''} onClick={() => setI(j)}>
              <span className="sc-n">{String(j + 1).padStart(2, '0')}</span>
              <span className="sc-t">
                <b>{k.title}</b>
                <span>{k.line}</span>
              </span>
              {i === j && <i className={`sc-progress ${paused || !on ? 'hold' : ''}`} key={`${i}-${paused}`} style={{ animationDuration: `${KIT_MS}ms` }} />}
            </button>
          </li>
        ))}
      </ol>
      <div className="sc-stage" role="tabpanel">
        <div className="sc-scene" key={KIT[i].id}>
          <Scene on={on} />
        </div>
      </div>
    </div>
  );
}

// AI: a prompt is typed, then code streams out
const PROMPT = 'Dark terminal vibe. Projects first. Huge serif name.';
const CODE = [
  '<section class="hero">',
  '  <h1 class="serif">Ananya Rao</h1>',
  '  <p class="mono">$ ml-engineer --open-to-work</p>',
  '</section>',
  '<section id="projects">',
  '  <article class="card">NoteSense</article>',
];
function AiMock({ on }) {
  const [typed, setTyped] = useState(reduced() ? PROMPT : '');
  const [lines, setLines] = useState(reduced() ? CODE.length : 0);
  useEffect(() => {
    if (!on || reduced()) return;
    let alive = true;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (alive) {
        setTyped('');
        setLines(0);
        await sleep(600);
        for (let i = 1; i <= PROMPT.length && alive; i++) {
          setTyped(PROMPT.slice(0, i));
          await sleep(38);
        }
        await sleep(500);
        for (let i = 1; i <= CODE.length && alive; i++) {
          setLines(i);
          await sleep(320);
        }
        await sleep(3200);
      }
    })();
    return () => {
      alive = false;
    };
  }, [on]);
  const done = lines === CODE.length;
  return (
    <div className="lp-ai">
      <div className="lp-ai-prompt">
        <Icon name="sparkle" size={14} />
        <span>
          {typed}
          <Caret on={typed.length < PROMPT.length || !lines} />
        </span>
        <span className="lp-ai-img">
          <Icon name="image" size={13} /> screenshot.png
        </span>
      </div>
      <pre className="lp-ai-code">
        {CODE.slice(0, lines).map((l, i) => (
          <div key={i} className="lp-code-line">
            <span>{String(i + 1).padStart(2, ' ')}</span>
            {l}
          </div>
        ))}
        {!done && lines > 0 && <span className="lp-caret" />}
      </pre>
      <div className={`lp-ai-status ${done ? 'done' : ''}`}>
        <i /> {done ? 'Portfolio built — live preview ready' : lines ? 'Writing your portfolio…' : 'Waiting for your idea'}
      </div>
    </div>
  );
}

// Compact two-column FAQ — one answer open at a time
function GoodToKnow() {
  const [open, setOpen] = useState(-1);
  return (
    <div className="lp-faq">
      {FAQ.map(([q, a], i) => (
        <div key={q} className={`lp-faq-item ${open === i ? 'open' : ''}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span>{q}</span>
            <i aria-hidden="true" />
          </button>
          <div className="lp-faq-a">
            <p>{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Reveal({ children, className = '', as: Tag = 'section', ...rest }) {
  const [ref, seen] = useInView(0.15);
  return (
    <Tag ref={ref} className={`lp-reveal ${seen ? 'in' : ''} ${className}`} {...rest}>
      {typeof children === 'function' ? children(seen) : children}
    </Tag>
  );
}

export default function Landing() {
  const go = (r) => (window.location.hash = `/${r}`);
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const top = () => document.querySelector('.lp')?.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="lp">
      <header className="lp-nav">
        <a className="logo" href="#/" onClick={(e) => (e.preventDefault(), top())}>
          <LogoMark />
          Monofolio
        </a>
        <nav>
          <button onClick={() => jump('how')}>How it works</button>
          <button onClick={() => jump('tools')}>Career kit</button>
          <button onClick={() => jump('themes')}>Themes</button>
          <button onClick={() => jump('faq')}>FAQ</button>
        </nav>
        <div className="lp-nav-cta">
          <button className="btn ghost sm" onClick={() => go('signin')}>
            Sign in
          </button>
          <button className="btn sm" onClick={() => go('signup')}>
            Get started
          </button>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <span className="lp-eyebrow">
            <i /> For college developers · free
          </span>
          <h1>
            Write yourself <span className="lp-under">once.</span>
            <br />
            Show up everywhere.
          </h1>
          <p>
            Monofolio turns one profile into your <b>portfolio website</b>, an <b>ATS-ready resume</b>, <b>cover letters</b>, a <b>GitHub README</b> and a shareable <b>dev card</b> — with AI that builds the look you describe.
          </p>
          <div className="lp-hero-cta">
            <button className="btn lp-big" onClick={() => go('signup')}>
              Start for free <Icon name="chevron" />
            </button>
            <button className="btn secondary lp-big" onClick={() => jump('how')}>
              See how it works
            </button>
          </div>
          <p className="lp-fine">Free · No credit card · Sign in with Google or email</p>
        </div>
        <figure className="lp-hero-fig">
          <HeroStage />
          <figcaption className="lp-mono">fig. 01 — edit your profile once; the site, resume and card follow</figcaption>
        </figure>
      </section>

      <div className="lp-counts">
        {COUNTS.map(([n, label]) => (
          <div key={label}>
            <b>{n}</b>
            <span>{label}</span>
          </div>
        ))}
        <div>
          <b>1</b>
          <span>profile to fill in</span>
        </div>
      </div>

      {/* ---------- how it works ---------- */}
      <Reveal id="how" className="lp-section">
        <div className="lp-head">
          <span className="lp-index">01 — how it works</span>
          <h2>Three steps, about ten minutes.</h2>
        </div>
        <ol className="lp-steps">
          <li>
            <span className="lp-step-n">1</span>
            <h3>Fill in your Dev Identity</h3>
            <p>Name, skills, projects, education — once. Or import your old resume PDF and let it fill itself.</p>
            <div className="lp-step-vis lp-vis-form">
              <Bar w="40%" dark />
              <Bar w="75%" />
              <Bar w="60%" />
              <span className="lp-vis-tick">
                <Icon name="check" size={11} strokeWidth={3} /> imported from resume.pdf
              </span>
            </div>
          </li>
          <li>
            <span className="lp-step-n">2</span>
            <h3>Pick a look — or describe one</h3>
            <p>Choose from dozens of themes, tweak colours, fonts, 3D and motion, or tell AI what you want.</p>
            <div className="lp-step-vis lp-vis-swatch">
              <i />
              <i />
              <i />
              <i />
            </div>
          </li>
          <li>
            <span className="lp-step-n">3</span>
            <h3>Download and apply</h3>
            <p>Your site as one index.html, your resume as PDF, plus a README and a dev card. Free to host anywhere.</p>
            <div className="lp-step-vis lp-vis-files">
              <em>index.html</em>
              <em>resume.pdf</em>
              <em>README.md</em>
              <em>card.png</em>
            </div>
          </li>
        </ol>
      </Reveal>

      {/* ---------- AI ---------- */}
      <Reveal className="lp-section lp-split">
        {(seen) => (
          <>
            <div className="lp-head">
              <span className="lp-index">02 — ai studio</span>
              <h2>Describe it. Or drop a screenshot.</h2>
              <p>Type the vibe you want, or paste a portfolio you love. AI writes the code, you watch it build live, then keep editing — by hand or by asking.</p>
              <ul className="lp-ticks">
                <li>
                  <Icon name="check" size={13} strokeWidth={3} /> Real HTML & CSS you own
                </li>
                <li>
                  <Icon name="check" size={13} strokeWidth={3} /> Restyle any theme with one sentence
                </li>
                <li>
                  <Icon name="check" size={13} strokeWidth={3} /> No API keys needed
                </li>
              </ul>
            </div>
            <AiMock on={seen} />
          </>
        )}
      </Reveal>

      {/* ---------- career kit ---------- */}
      <Reveal id="tools" className="lp-section">
        {(seen) => (
          <>
            <div className="lp-head lp-head-row">
              <div>
                <span className="lp-index">03 — career kit</span>
                <h2>Everything you need to apply.</h2>
              </div>
              <p>Six tools that all read the same profile — so your resume, letter and README never disagree.</p>
            </div>
            <KitShowcase on={seen} />
          </>
        )}
      </Reveal>

      {/* ---------- themes ---------- */}
      <Reveal id="themes" className="lp-section lp-themes">
        <div className="lp-head">
          <span className="lp-index">04 — themes</span>
          <h2>Not another template that looks like everyone’s.</h2>
          <p>{COUNTS[0][0]} art directions — minimal, editorial, retro OS, 3D, brutalist and more. Every one is a live page, shown here with sample data.</p>
        </div>
        <ThemeDrift />
      </Reveal>

      {/* ---------- good to know ---------- */}
      <Reveal id="faq" className="lp-section lp-faq-sec">
        <div className="lp-head lp-head-row">
          <div>
            <span className="lp-index">05 — good to know</span>
            <h2>Questions, answered.</h2>
          </div>
          <p>Still unsure? Here’s what students usually ask before signing up.</p>
        </div>
        <GoodToKnow />
      </Reveal>

      {/* ---------- final CTA ---------- */}
      <Reveal className="lp-final">
        <h2>Your portfolio is ten minutes away.</h2>
        <p>Free for students. Sign up with Google or email and start with a blank profile.</p>
        <div className="lp-hero-cta">
          <button className="btn lp-big" onClick={() => go('signup')}>
            Create your account <Icon name="chevron" />
          </button>
          <button className="btn secondary lp-big" onClick={() => go('signin')}>
            I already have one
          </button>
        </div>
      </Reveal>

      {/* ---------- footer ---------- */}
      <footer className="lp-foot">
        <div className="lp-foot-top">
          <div className="lp-foot-brand">
            <span className="logo">
              <LogoMark />
              Monofolio
            </span>
            <p>One profile → a portfolio site, resume, cover letters, a GitHub README and a dev card. Made for students who build things.</p>
          </div>
          <div className="lp-foot-cols">
            <div>
              <h4>Product</h4>
              <button onClick={() => jump('how')}>How it works</button>
              <button onClick={() => jump('tools')}>Career kit</button>
              <button onClick={() => jump('themes')}>Portfolio themes</button>
              <button onClick={() => jump('faq')}>Good to know</button>
            </div>
            <div>
              <h4>Tools</h4>
              <span>Portfolio Studio</span>
              <span>Resume & ATS checker</span>
              <span>Cover letters & README</span>
            </div>
            <div>
              <h4>Account</h4>
              <button onClick={() => go('signup')}>Create account</button>
              <button onClick={() => go('signin')}>Sign in</button>
            </div>
          </div>
        </div>
        <div className="lp-wordmark" aria-hidden="true">
          monofolio
        </div>
        <div className="lp-foot-bottom">
          <span>© {new Date().getFullYear()} Monofolio</span>
          <span className="lp-mono">Your data stays private to your account</span>
          <button className="lp-top" onClick={top}>
            Back to top <Icon name="up" size={13} />
          </button>
        </div>
      </footer>
    </div>
  );
}
