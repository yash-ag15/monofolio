// Dev profile cards: shareable images built from the Dev Identity (exported to PNG / PDF).
import { techList } from '../readme/tech.js';

export const CARD_SIZES = {
  card: { label: 'Business card', w: 1050, h: 600, note: '3.5 × 2 in' },
  square: { label: 'Square post', w: 1080, h: 1080, note: 'Instagram / LinkedIn' },
  story: { label: 'Story', w: 1080, h: 1920, note: '9:16' },
  banner: { label: 'LinkedIn banner', w: 1584, h: 396, note: '1584 × 396' },
  badge: { label: 'ID badge', w: 640, h: 1000, note: 'portrait' },
};

export const CARD_DESIGNS = [
  { id: 'minimal', name: 'Minimal', desc: 'Quiet type, lots of space', sizes: ['card', 'square', 'story', 'banner', 'badge'] },
  { id: 'terminal', name: 'Terminal', desc: 'A shell window introducing you', sizes: ['card', 'square', 'banner'] },
  { id: 'badge', name: 'ID badge', desc: 'Conference / company access pass', sizes: ['badge', 'story', 'square'] },
  { id: 'trading', name: 'Trading card', desc: 'Holo frame, your real stats', sizes: ['badge', 'story', 'square'] },
  { id: 'glass', name: 'Glass', desc: 'Frosted panel over soft colour', sizes: ['card', 'square', 'story', 'banner', 'badge'] },
  { id: 'neon', name: 'Neon', desc: 'Dark with a glowing outline', sizes: ['card', 'square', 'banner'] },
  { id: 'polaroid', name: 'Polaroid', desc: 'Photo print with a handwritten caption', sizes: ['square', 'badge', 'story'] },
  { id: 'brutalist', name: 'Brutalist', desc: 'Thick borders, loud type', sizes: ['card', 'square', 'story', 'banner', 'badge'] },
  { id: 'swiss', name: 'Swiss', desc: 'Grid, big initials, red dot', sizes: ['card', 'square', 'story', 'banner'] },
  { id: 'code', name: 'Code window', desc: 'You as a JavaScript object', sizes: ['card', 'square'] },
  { id: 'gradient', name: 'Gradient', desc: 'Bold colour field, big name', sizes: ['card', 'square', 'story', 'banner', 'badge'] },
  { id: 'business', name: 'Business card', desc: 'Classic and printable', sizes: ['card'] },
];

// readable text colour on top of the accent
const onAccent = (hex) => {
  const n = parseInt(String(hex || '#000000').slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150 ? '#0b0b0b' : '#ffffff';
};
const host = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function cardData(profile, github) {
  const b = profile.basics || {};
  const social = (re) => (profile.socials || []).find((s) => re.test(s.url))?.url || '';
  const gh = social(/github\.com/i);
  const name = b.name || 'Your Name';
  const projects = profile.projects || [];
  const skills = [];
  (profile.skills || []).forEach((g) => techList(g.items).forEach((t) => !skills.includes(t.label) && skills.push(t.label)));
  return {
    name,
    first: name.split(' ')[0],
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase(),
    headline: b.headline || '',
    tagline: b.tagline || '',
    location: b.location || '',
    email: b.email || '',
    phone: b.phone || '',
    website: host(b.website),
    github: host(gh) || (github?.username ? `github.com/${github.username}` : ''),
    githubUser: github?.username || (gh.match(/github\.com\/([^/?#]+)/i) || [])[1] || '',
    linkedin: host(social(/linkedin\.com/i)),
    avatar: b.avatar || '',
    availability: b.availability || '',
    school: (profile.education || [])[0]?.school || '',
    degree: (profile.education || [])[0]?.degree || '',
    skills,
    stats: [
      ['Projects', projects.length],
      ['Stars', projects.reduce((a, p) => a + (Number(p.stars) || 0), 0) || (github?.repos || []).reduce((a, r) => a + (r.stars || 0), 0)],
      ['Skills', skills.length],
    ],
  };
}

// --- small pieces ---
const Photo = ({ d, o, className = 'dc-photo' }) => (o.photo && d.avatar ? <img className={className} src={d.avatar} alt="" /> : <div className={`${className} dc-initials`}>{d.initials}</div>);
const Qr = ({ qr, o, label }) =>
  o.qr && qr ? (
    <div className="dc-qr">
      <img src={qr} alt="QR code" />
      {label && <span>{label}</span>}
    </div>
  ) : null;
const Skills = ({ d, o, n = 6 }) => (o.skills && d.skills.length ? <div className="dc-skills">{d.skills.slice(0, n).map((s) => <span key={s}>{s}</span>)}</div> : null);
const Contact = ({ d, o }) => {
  const items = [d.email, d.website, o.socials && d.github, o.socials && d.linkedin, d.location].filter(Boolean);
  return items.length ? (
    <div className="dc-contact">
      {items.map((x) => (
        <span key={x}>{x}</span>
      ))}
    </div>
  ) : null;
};
const Barcode = ({ seed }) => {
  let h = hash(seed);
  const bars = [];
  for (let i = 0; i < 44; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(<i key={i} style={{ flexGrow: 1 + (h % 4) }} />);
  }
  return <div className="dc-barcode">{bars}</div>;
};

// --- designs ---
const DESIGNS = {
  minimal: ({ d, o, qr }) => (
    <>
      <div className="dc-top">
        {o.photo && <Photo d={d} o={o} />}
        <div>
          <div className="dc-name">{d.name}</div>
          {d.headline && <div className="dc-role">{d.headline}</div>}
        </div>
      </div>
      {d.tagline && <p className="dc-tag">{d.tagline}</p>}
      <Skills d={d} o={o} />
      <div className="dc-bottom">
        <Contact d={d} o={o} />
        <Qr qr={qr} o={o} />
      </div>
    </>
  ),
  terminal: ({ d, o, qr }) => (
    <div className="dc-window">
      <div className="dc-bar">
        <i />
        <i />
        <i />
        <span>~/{(d.githubUser || d.first).toLowerCase()} — zsh</span>
      </div>
      <div className="dc-term">
        <div className="dc-lines">
          <p>
            <b>$</b> whoami
          </p>
          <p className="dc-out dc-name">{d.name}</p>
          {d.headline && (
            <>
              <p>
                <b>$</b> cat role.txt
              </p>
              <p className="dc-out">{d.headline}</p>
            </>
          )}
          {o.skills && d.skills.length > 0 && (
            <>
              <p>
                <b>$</b> ls skills/
              </p>
              <p className="dc-out">{d.skills.slice(0, 8).join('  ')}</p>
            </>
          )}
          <p>
            <b>$</b> contact --all
          </p>
          <p className="dc-out">{[d.email, d.website || d.github].filter(Boolean).join('  ·  ')}</p>
          <p>
            <b>$</b> <span className="dc-cursor" />
          </p>
        </div>
        <Qr qr={qr} o={o} />
      </div>
    </div>
  ),
  badge: ({ d, o, qr }) => (
    <>
      <div className="dc-slot" />
      <div className="dc-band">DEVELOPER · ACCESS ALL AREAS</div>
      <Photo d={d} o={{ ...o, photo: true }} />
      <div className="dc-name">{d.name}</div>
      {d.headline && <div className="dc-role">{d.headline}</div>}
      {d.school && <div className="dc-org">{d.school}</div>}
      <Skills d={d} o={o} n={4} />
      <div className="dc-foot">
        <Barcode seed={d.name} />
        <Qr qr={qr} o={o} />
      </div>
    </>
  ),
  trading: ({ d, o, qr }) => (
    <div className="dc-holo">
      <div className="dc-inner">
        <div className="dc-plate">
          <span className="dc-name">{d.name}</span>
          <span className="dc-type">{(d.skills[0] || 'DEV').toUpperCase()}</span>
        </div>
        <div className="dc-art">
          <Photo d={d} o={{ ...o, photo: true }} />
        </div>
        <div className="dc-kind">{d.headline || 'Developer'}</div>
        <div className="dc-stats">
          {d.stats.map(([k, v]) => (
            <div key={k}>
              <b>{v}</b>
              <span>{k}</span>
            </div>
          ))}
        </div>
        {d.tagline && <p className="dc-flavor">“{d.tagline}”</p>}
        <div className="dc-foot">
          <Skills d={d} o={o} n={4} />
          <Qr qr={qr} o={o} />
        </div>
      </div>
    </div>
  ),
  glass: ({ d, o, qr }) => (
    <>
      <i className="dc-blob a" />
      <i className="dc-blob b" />
      <i className="dc-blob c" />
      <div className="dc-pane">
        <div className="dc-top">
          {o.photo && <Photo d={d} o={o} />}
          <div>
            <div className="dc-name">{d.name}</div>
            {d.headline && <div className="dc-role">{d.headline}</div>}
          </div>
        </div>
        <Skills d={d} o={o} />
        <div className="dc-bottom">
          <Contact d={d} o={o} />
          <Qr qr={qr} o={o} />
        </div>
      </div>
    </>
  ),
  neon: ({ d, o, qr }) => (
    <div className="dc-frame">
      <div className="dc-name">{d.name}</div>
      {d.headline && <div className="dc-role">{d.headline}</div>}
      <Skills d={d} o={o} />
      <div className="dc-bottom">
        <Contact d={d} o={o} />
        <Qr qr={qr} o={o} />
      </div>
    </div>
  ),
  polaroid: ({ d, o, qr }) => (
    <div className="dc-print">
      <div className="dc-shot">
        <Photo d={d} o={{ ...o, photo: true }} />
        <Qr qr={qr} o={o} />
      </div>
      <div className="dc-caption">
        <span className="dc-name">{d.name}</span>
        <span className="dc-role">{d.headline}</span>
      </div>
    </div>
  ),
  brutalist: ({ d, o, qr }) => (
    <>
      <div className="dc-block">{d.initials}</div>
      <div className="dc-name">{d.name}</div>
      {d.headline && <div className="dc-role">{d.headline}</div>}
      <Skills d={d} o={o} />
      <div className="dc-bottom">
        <Contact d={d} o={o} />
        <Qr qr={qr} o={o} />
      </div>
    </>
  ),
  swiss: ({ d, o, qr }) => (
    <>
      <div className="dc-big">
        {d.initials}
        <i className="dc-dot" />
      </div>
      <div className="dc-info">
        <div className="dc-name">{d.name}</div>
        {d.headline && <div className="dc-role">{d.headline}</div>}
        <hr />
        <Skills d={d} o={o} />
        <div className="dc-bottom">
          <Contact d={d} o={o} />
          <Qr qr={qr} o={o} />
        </div>
      </div>
    </>
  ),
  code: ({ d, o, qr }) => (
    <div className="dc-window">
      <div className="dc-bar">
        <i />
        <i />
        <i />
        <span>{(d.first || 'dev').toLowerCase()}.js</span>
      </div>
      <div className="dc-term">
        <pre className="dc-src">
          <span className="k">const</span> <span className="v">dev</span> = {'{\n'}
          {'  '}name: <span className="s">"{d.name}"</span>,{'\n'}
          {d.headline && (
            <>
              {'  '}role: <span className="s">"{d.headline}"</span>,{'\n'}
            </>
          )}
          {d.location && (
            <>
              {'  '}location: <span className="s">"{d.location}"</span>,{'\n'}
            </>
          )}
          {o.skills && d.skills.length > 0 && (
            <>
              {'  '}stack: [{d.skills.slice(0, 5).map((s, i) => (
                <span key={s}>
                  <span className="s">"{s}"</span>
                  {i < Math.min(4, d.skills.length - 1) ? ', ' : ''}
                </span>
              ))}],{'\n'}
            </>
          )}
          {'  '}hireable: <span className="k">{d.availability ? 'true' : 'false'}</span>,{'\n'}
          {d.email && (
            <>
              {'  '}contact: <span className="s">"{d.email}"</span>,{'\n'}
            </>
          )}
          {'};'}
        </pre>
        <Qr qr={qr} o={o} />
      </div>
    </div>
  ),
  gradient: ({ d, o, qr }) => (
    <>
      <div className="dc-top">
        {o.photo && <Photo d={d} o={o} />}
        <div className="dc-hello">Hello, I’m</div>
      </div>
      <div className="dc-name">{d.name}</div>
      {d.headline && <div className="dc-role">{d.headline}</div>}
      <Skills d={d} o={o} />
      <div className="dc-bottom">
        <Contact d={d} o={o} />
        <Qr qr={qr} o={o} />
      </div>
    </>
  ),
  business: ({ d, o, qr }) => (
    <>
      <div className="dc-left">
        <div className="dc-mono">{d.initials}</div>
        <div className="dc-name">{d.name}</div>
        {d.headline && <div className="dc-role">{d.headline}</div>}
      </div>
      <div className="dc-right">
        {d.phone && <span>☎ {d.phone}</span>}
        {d.email && <span>✉ {d.email}</span>}
        {d.website && <span>⌂ {d.website}</span>}
        {o.socials && d.github && <span>⌥ {d.github}</span>}
        {d.location && <span>⌖ {d.location}</span>}
        <Qr qr={qr} o={o} />
      </div>
    </>
  ),
};

// The card itself, at its real export size (preview scales the wrapper, not this node)
export function DevCard({ design, size, data, opts, qr, innerRef }) {
  const s = CARD_SIZES[size] || CARD_SIZES.card;
  const Body = DESIGNS[design] || DESIGNS.minimal;
  return (
    <div ref={innerRef} className={`dc dc-${design} dc-size-${size} dc-${opts.mode}`} style={{ width: s.w, height: s.h, '--accent': opts.accent, '--on-accent': onAccent(opts.accent) }}>
      <Body d={data} o={opts} qr={qr} />
      {opts.watermark && <span className="dc-mark">monofolio</span>}
    </div>
  );
}
