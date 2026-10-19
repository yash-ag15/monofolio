// Fifteen more art directions, each modelled on a different real-world object or interface.
// Same format as skins.js: a structural base + preset + CSS (+ optional extra font families).
// sig = [darkness, contrast, busyness, warmth] (0..1) used to match inspiration images.

export const SKINS_2 = {
  nowplaying: {
    name: 'Now Playing',
    cat: 'Playful',
    base: 'classic',
    desc: 'A music player: album-cover hero, playback bar and your projects as a tracklist.',
    sig: [0.92, 0.6, 0.35, 0.35],
    preset: { fontPair: 'inter', mode: 'dark', paper: 'white', heroStyle: 'split', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', scale: 'large', density: 'tight', radius: 8, mark: 'identicon', nav: 'none', entrance: 'rise', revealStyle: 'fade', cardHover: 'none', accentUse: 'bold' },
    css: `main .wrap{max-width:1040px}
.hero{padding-top:56px}
.hero .split{grid-template-columns:1fr 300px;direction:rtl}
.hero .split > *{direction:ltr}
.hero-visual{background:linear-gradient(160deg,color-mix(in srgb,var(--fg) 14%,var(--bg)),var(--card));border-radius:10px;aspect-ratio:1;width:300px;display:grid;place-items:center;box-shadow:0 30px 60px -20px rgba(0,0,0,.6)}
.hero .eyebrow::before{content:'Artist · '}
.hero h1{font-size:clamp(2.6rem,7vw,5.5rem);letter-spacing:-.04em}
.hero .tagline::after{content:'';display:block;height:4px;margin-top:26px;border-radius:99px;background:linear-gradient(90deg,var(--accent) 0 38%,var(--line-strong) 38%)}
.hero .hero-cta::before{content:'\\25C2\\25C2    \\25B6    \\25B8\\25B8';font-size:1.3rem;letter-spacing:.1em;margin-right:18px;align-self:center;white-space:pre}
.hero .btn{border-radius:99px}
.sec{border-top:0;padding:28px 0}
.sec-label{font-size:1.6rem;font-weight:800}
.projects-list .project{grid-template-columns:44px 1fr;padding:10px 14px;border:0;border-radius:8px;transition:background .2s}
.projects-list .project:hover{background:var(--card)}
.projects-list .project-num{font-size:.95rem;text-align:center}
.projects-list .project:hover .project-num{font-size:0}
.projects-list .project:hover .project-num::before{content:'\\25B6';font-size:.8rem}
.project h3{font-size:1.05rem}
.project p{color:var(--muted);font-size:.9rem;margin-top:2px}
.project .bullets,.project .tags.small{display:none}
.project .links{margin-top:6px}
.tags li{background:var(--card);border:0;border-radius:99px;padding:6px 14px}
@media (max-width:720px){.hero .split{grid-template-columns:1fr;direction:ltr}.hero-visual{width:100%;max-width:300px}}`,
  },

  ticket: {
    name: 'Boarding Pass',
    cat: 'Playful',
    base: 'classic',
    desc: 'Your intro printed on a ticket — perforation, barcode and stub-shaped sections.',
    sig: [0.12, 0.55, 0.35, 0.45],
    preset: { fontPair: 'plex', mode: 'light', paper: 'cool', heroStyle: 'name-big', projectStyle: 'cards', sectionLabel: 'numbered', headingCase: 'upper', scale: 'regular', density: 'normal', radius: 14, nav: 'none', entrance: 'scale', revealStyle: 'rise' },
    css: `body{background-color:color-mix(in srgb,var(--fg) 7%,var(--bg))}
main .wrap{max-width:980px}
.hero{margin-top:48px;padding:40px 44px;border-radius:20px;border:1px solid var(--line-strong);background:radial-gradient(circle at 72% 0,color-mix(in srgb,var(--fg) 7%,var(--bg)) 15px,transparent 16px),radial-gradient(circle at 72% 100%,color-mix(in srgb,var(--fg) 7%,var(--bg)) 15px,transparent 16px),var(--bg);box-shadow:0 20px 50px -30px rgba(0,0,0,.4)}
.hero::after{content:'';position:absolute;top:18px;bottom:18px;left:72%;border-left:2px dashed var(--line-strong)}
.hero-content{padding-right:30%}
.hero-content::after{content:'';position:absolute;right:44px;top:44px;width:18%;height:96px;background:repeating-linear-gradient(90deg,var(--fg) 0 2px,transparent 2px 4px,var(--fg) 4px 5px,transparent 5px 8px,var(--fg) 8px 11px,transparent 11px 13px)}
.hero .eyebrow::before{content:'Boarding pass \\00B7  '}
.hero h1{font-size:clamp(2.2rem,5vw,3.6rem);letter-spacing:.02em}
.meta-grid{border-top:1px dashed var(--line-strong)}
.meta-grid dt{letter-spacing:.14em}
.meta-grid dd{font-size:1.1rem;font-weight:700}
.sec{background:var(--bg);border:1px solid var(--line-strong);border-radius:16px;padding:34px 38px;margin:22px 0}
.sec-label{font-size:.85rem;letter-spacing:.16em;border-bottom:1px dashed var(--line-strong);padding-bottom:12px}
.sec-label .num::before{content:'Gate '}
.projects-cards .project{border-style:dashed}
@media (max-width:720px){.hero-content{padding-right:0}.hero::after,.hero-content::after{display:none}.hero{padding:28px}}`,
  },

  chat: {
    name: 'Messenger',
    cat: 'Playful',
    base: 'classic',
    desc: 'Your portfolio as a conversation — visitors ask, you answer in chat bubbles.',
    sig: [0.08, 0.4, 0.3, 0.45],
    preset: { fontPair: 'sora', mode: 'light', paper: 'white', heroStyle: 'minimal', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', scale: 'compact', density: 'tight', radius: 14, nav: 'none', mark: 'monogram', entrance: 'rise', revealStyle: 'rise' },
    css: `main .wrap{max-width:720px}
.hero{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);padding:18px 0;border-bottom:1px solid var(--line)}
.hero-minimal{gap:14px}
.hero-minimal h1{font-size:1.2rem!important;letter-spacing:0}
.hero .avatar{width:48px;height:48px;border-radius:50%}
.hero-minimal .headline::before{content:'\\25CF  Active now \\00B7  ';font-size:.8rem}
.sec{border-top:0;padding:14px 0;display:flex;flex-direction:column}
.sec-label{align-self:flex-end;background:var(--fg);color:var(--bg);font-size:.95rem;font-weight:500;padding:10px 16px;border-radius:20px 20px 4px 20px;margin-bottom:10px;max-width:80%}
#about .sec-label,#skills .sec-label,#projects .sec-label,#experience .sec-label,#education .sec-label,#certifications .sec-label,#achievements .sec-label,#contact .sec-label{font-size:0}
#about .sec-label::before{content:'So, who are you?'}
#skills .sec-label::before{content:'What do you work with?'}
#projects .sec-label::before{content:'What have you built?'}
#experience .sec-label::before{content:'Where have you worked?'}
#education .sec-label::before{content:'Where did you study?'}
#certifications .sec-label::before{content:'Any certifications?'}
#achievements .sec-label::before{content:'Anything you are proud of?'}
#contact .sec-label::before{content:'How can I reach you?'}
.sec-label::before{font-size:.95rem}
.sec-label .num{display:none}
.sec-body{align-self:flex-start;max-width:88%;background:var(--card);border:1px solid var(--line);border-radius:20px 20px 20px 4px;padding:16px 20px}
.projects-list .project{grid-template-columns:1fr;padding:12px 0}
.projects-list .project-num{display:none}
.entry{grid-template-columns:1fr;gap:2px}
.contact .big-link{font-size:1.4rem}
.foot{border:0;text-align:left}
.foot .wrap::before{content:'\\2022 \\2022 \\2022';letter-spacing:.2em;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:8px 14px;width:fit-content}`,
  },

  notion: {
    name: 'Docs Page',
    cat: 'Minimal',
    base: 'classic',
    desc: 'A notes-app page: cover band, page icon, properties table, callouts and toggles.',
    sig: [0.04, 0.4, 0.25, 0.45],
    preset: { fontPair: 'inter', mode: 'light', paper: 'white', heroStyle: 'name-big', projectStyle: 'grid', sectionLabel: 'plain', headingCase: 'normal', scale: 'compact', density: 'tight', radius: 6, nav: 'none', mark: 'identicon', entrance: 'fade', revealStyle: 'none' },
    css: `body::before{content:'';display:block;height:210px;background:linear-gradient(120deg,color-mix(in srgb,var(--fg) 10%,var(--bg)),color-mix(in srgb,var(--fg) 3%,var(--bg)))}
main .wrap{max-width:780px}
.hero{padding-top:0}
.hero-row{margin-top:-46px;margin-bottom:18px}
.hero-row .mark{background:var(--bg);padding:10px;border-radius:12px;width:92px;height:92px;box-shadow:0 2px 10px rgba(0,0,0,.08)}
.hero .eyebrow{text-transform:none;letter-spacing:0;font-family:var(--font-body);font-size:.85rem}
.hero .eyebrow::before{content:'Workspace  /  Portfolio  /  '}
.hero h1{font-size:2.5rem;letter-spacing:-.02em}
.meta-grid{grid-template-columns:1fr;border-top:0;margin-top:18px}
.meta-grid div{display:grid;grid-template-columns:150px 1fr;padding:6px 0}
.meta-grid dt{text-transform:none;letter-spacing:0;font-family:var(--font-body);font-size:.9rem}
.meta-grid dt::before{content:'\\2261  '}
.sec{border-top:0;padding:16px 0}
.sec-label{font-size:1.45rem;font-weight:700;margin-bottom:12px}
.sec-label::before{content:'\\25BE  ';color:var(--muted);font-size:.8em}
#about .prose{background:var(--card);border-radius:6px;padding:16px 18px 16px 50px;position:relative;max-width:none}
#about .prose::before{content:'\\2726';position:absolute;left:18px;top:16px;font-size:1.1rem}
.tags li{border:0;border-radius:4px;background:color-mix(in srgb,var(--fg) 7%,var(--bg));padding:2px 8px;font-size:.85rem}
.projects-grid .project{border-radius:6px;background:var(--bg);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.foot{border:0}`,
  },

  wiki: {
    name: 'Encyclopedia',
    cat: 'Editorial',
    base: 'classic',
    desc: 'Written up like an encyclopedia article — infobox, [edit] links and a footnote.',
    sig: [0.03, 0.5, 0.45, 0.4],
    preset: { fontPair: 'serif', mode: 'light', paper: 'white', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', scale: 'compact', density: 'tight', radius: 0, nav: 'none', accent: '#3366cc', entrance: 'none', revealStyle: 'none', linkStyle: 'underline' },
    css: `body{font-size:15px}
main .wrap{max-width:1080px}
.hero{display:flow-root;padding:28px 0 8px}
.hero .eyebrow{font-size:0;margin-bottom:6px}
.hero .eyebrow::after{content:'From Monofolio, the free encyclopedia';font-size:.82rem;font-family:var(--font-body);text-transform:none;letter-spacing:0}
.hero h1{font-size:2.3rem;font-weight:400;border-bottom:1px solid var(--line-strong);padding-bottom:6px;margin-bottom:6px}
.hero .tagline{max-width:none;font-size:1rem}
.hero-content{display:grid;grid-template-columns:1fr 290px;column-gap:28px;align-items:start}
.hero-content > *{grid-column:1}
.hero .eyebrow,.hero h1{grid-column:1 / -1}
.meta-grid{grid-column:2;grid-row:3 / span 4;grid-template-columns:1fr;border:1px solid var(--line-strong);background:var(--card);margin:0;padding:4px 10px 10px;font-size:.85rem}
@media (max-width:720px){.hero-content{display:block}.meta-grid{margin:16px 0}}
.meta-grid::before{content:'Developer';display:block;text-align:center;font-weight:700;padding:6px;margin:0 -10px 6px;background:color-mix(in srgb,var(--fg) 8%,var(--bg))}
.meta-grid div{display:grid;grid-template-columns:90px 1fr;padding:4px 0}
.meta-grid dt{text-transform:none;letter-spacing:0;font-weight:700;color:var(--fg);font-family:var(--font-body)}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.btn{background:var(--card);color:var(--accent);border-color:var(--line-strong);border-radius:2px}
.sec{border-top:0;padding:14px 0}
.sec-label{font-weight:400;font-size:1.65rem;border-bottom:1px solid var(--line-strong);padding-bottom:4px;margin-bottom:12px}
.sec-label::after{content:'[edit]';font-size:.75rem;color:var(--accent);font-family:var(--font-body);margin-left:12px;vertical-align:middle}
.projects-list .project{grid-template-columns:1fr;border:0;padding:4px 0}
.projects-list .project-num{display:none}
.project h3{font-family:var(--font-body);font-size:1rem;font-weight:700;display:inline}
.project .bullets,.project .tags.small{display:none}
.tags li{border:0;padding:0;border-radius:0}.tags li:not(:last-child)::after{content:' \\00B7'}
.foot{font-family:var(--font-body)}
.foot .wrap::before{content:'This page was last edited today. Text is available under the Creative Commons licence.';display:block;width:100%;font-size:.75rem}`,
  },

  credits: {
    name: 'Film Credits',
    cat: 'Editorial',
    base: 'classic',
    desc: 'Letterboxed and centred like the end credits of a film.',
    sig: [0.97, 0.75, 0.15, 0.45],
    preset: { fontPair: 'editorial', mode: 'dark', paper: 'white', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'upper', scale: 'regular', density: 'airy', radius: 0, nav: 'none', grain: true, entrance: 'fade', revealStyle: 'fade', motion: 'subtle' },
    css: `body::before,body::after{content:'';position:fixed;left:0;right:0;height:5.5vh;background:#000;z-index:80;pointer-events:none}
body::before{top:0}body::after{bottom:0}
main .wrap{max-width:820px;text-align:center}
.hero{padding-top:22vh;padding-bottom:16vh}
.hero .eyebrow{letter-spacing:.4em}
.hero .eyebrow::before{content:'A Monofolio production \\00B7  '}
.hero h1{font-weight:400!important;letter-spacing:.18em;font-size:clamp(2.2rem,6vw,4.4rem)}
.hero .tagline,.prose{margin-inline:auto}
.meta-grid{display:none}
.hero-cta,.hero .links,.hero-row,.links,.tags{justify-content:center}
.sec{border-top:0}
.sec-label{font-family:var(--mono);font-size:.75rem;letter-spacing:.45em;color:var(--muted);font-weight:400}
.rows li,.projects-list .project-main{display:grid;grid-template-columns:1fr 1fr;gap:28px;text-align:left;border:0;padding:6px 0}
.rows .row-title,.project-top{text-align:right;justify-content:flex-end}
.projects-list .project{grid-template-columns:1fr;border:0;padding:10px 0}
.projects-list .project-num,.project .bullets,.project .tags.small{display:none}
.project .links{grid-column:1 / -1;justify-content:center}
.project p{margin:0}
.entry{grid-template-columns:1fr;text-align:center}
.foot{border:0;text-align:center}.foot .wrap{justify-content:center}
.foot .wrap::before{content:'THE END';display:block;width:100%;font-family:var(--font-head);font-size:2rem;letter-spacing:.3em;color:var(--fg);margin-bottom:12px}`,
  },

  kanban: {
    name: 'Kanban Board',
    cat: 'Technical',
    base: 'classic',
    desc: 'Every section is a board column of cards — scroll sideways like a project board.',
    sig: [0.06, 0.45, 0.7, 0.35],
    preset: { fontPair: 'inter', mode: 'light', paper: 'cool', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', scale: 'compact', density: 'tight', radius: 10, nav: 'none', entrance: 'rise', revealStyle: 'none', cardHover: 'lift' },
    css: `body{background-color:color-mix(in srgb,var(--fg) 5%,var(--bg))}
main .wrap{max-width:none;display:flex;gap:16px;align-items:flex-start;overflow-x:auto;padding:28px;scroll-snap-type:x proximity}
main .wrap > *{flex:0 0 320px;scroll-snap-align:start}
.hero{padding:22px;background:var(--fg);color:var(--bg);border-radius:12px;--muted:color-mix(in srgb,var(--bg) 65%,var(--fg));--line:color-mix(in srgb,var(--bg) 20%,var(--fg))}
.hero h1{font-size:2rem}
.hero .btn{background:var(--bg);color:var(--fg);border-color:var(--bg)}
.hero .meta-grid{grid-template-columns:1fr}
.sec{border:1px solid var(--line);background:var(--card);background-color:color-mix(in srgb,var(--fg) 4%,var(--bg));border-radius:12px;padding:14px}
.sec-label{font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;font-family:var(--mono);font-weight:500;margin-bottom:12px;display:flex;justify-content:space-between}
.sec-label::after{content:'\\22EF'}
.prose,.skill-group,.entry,.rows li,.projects-list .project,.contact{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(0,0,0,.06);max-width:none;font-size:.92rem}
.projects{gap:0}
.projects-list .project{grid-template-columns:1fr}
.projects-list .project-num{display:none}
.entry{grid-template-columns:1fr;gap:4px}
.timeline,.skills{gap:0}
.rows li{display:block}
.contact .big-link{font-size:1.1rem}
.foot{display:none}`,
  },

  neumorph: {
    name: 'Soft UI',
    cat: 'Modern',
    base: 'classic',
    desc: 'Neumorphism — every surface is gently pressed out of the same soft material.',
    sig: [0.12, 0.2, 0.2, 0.4],
    preset: { fontPair: 'sora', mode: 'light', paper: 'cool', heroStyle: 'split', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'normal', scale: 'regular', density: 'airy', radius: 14, border: 'none', mark: 'orbit', nav: 'floating', entrance: 'scale', revealStyle: 'scale' },
    css: `:root{--hi:color-mix(in srgb,#ffffff 75%,var(--bg));--lo:color-mix(in srgb,var(--fg) 16%,var(--bg))}
.sec{border:0;border-radius:28px;padding:44px;margin:30px 0;box-shadow:10px 10px 24px var(--lo),-10px -10px 24px var(--hi)}
.hero-visual{border-radius:50%;padding:30px;box-shadow:inset 8px 8px 18px var(--lo),inset -8px -8px 18px var(--hi);aspect-ratio:1;display:grid;place-items:center}
.btn{background:var(--bg);color:var(--fg);border:0;border-radius:99px;box-shadow:6px 6px 14px var(--lo),-6px -6px 14px var(--hi);transition:box-shadow .2s}
.btn:hover{box-shadow:inset 4px 4px 10px var(--lo),inset -4px -4px 10px var(--hi)}
.tags li{border:0;border-radius:99px;box-shadow:3px 3px 8px var(--lo),-3px -3px 8px var(--hi)}
.tags li:hover{background:var(--bg);color:var(--fg);box-shadow:inset 3px 3px 6px var(--lo),inset -3px -3px 6px var(--hi)}
.projects-cards .project{background:var(--bg);border:0;border-radius:22px;box-shadow:inset 5px 5px 12px var(--lo),inset -5px -5px 12px var(--hi)}
.projects-cards .project:hover{box-shadow:7px 7px 16px var(--lo),-7px -7px 16px var(--hi)}
.meta-grid{border:0}
.nav-floating{background:var(--bg);color:var(--fg);box-shadow:8px 8px 20px var(--lo),-8px -8px 20px var(--hi)}`,
  },

  papercut: {
    name: 'Paper Layers',
    cat: 'Playful',
    base: 'classic',
    desc: 'Outlined sheets of paper stacked behind every section; a layered headline.',
    sig: [0.1, 0.65, 0.35, 0.6],
    preset: { fontPair: 'bricolage', mode: 'light', paper: 'warm', heroStyle: 'name-big', projectStyle: 'cards', sectionLabel: 'numbered', headingCase: 'normal', scale: 'large', density: 'normal', radius: 10, nav: 'none', entrance: 'rise', revealStyle: 'rise', cardHover: 'lift' },
    css: `.hero h1{text-shadow:3px 3px 0 var(--bg),5px 5px 0 var(--fg),8px 8px 0 var(--bg),10px 10px 0 color-mix(in srgb,var(--fg) 45%,var(--bg))}
.sec{background:var(--bg);border:1.5px solid var(--fg);border-radius:var(--r);padding:40px;margin:34px 10px 34px 0;box-shadow:7px 7px 0 -1.5px var(--bg),7px 7px 0 0 var(--fg),14px 14px 0 -1.5px var(--bg),14px 14px 0 0 var(--fg)}
.sec-label .num{display:inline-grid;place-items:center;width:2em;height:2em;border:1.5px solid var(--fg);border-radius:50%;color:var(--fg);font-size:.8em}
.projects-cards .project{background:var(--bg);border:1.5px solid var(--fg);box-shadow:5px 5px 0 -1.5px var(--bg),5px 5px 0 0 var(--fg)}
.btn{box-shadow:4px 4px 0 -1.5px var(--bg),4px 4px 0 0 var(--fg)}
.tags li{border-width:1.5px;border-color:var(--fg)}`,
  },

  glitch: {
    name: 'Y2K Glitch',
    cat: 'Retro',
    base: 'classic',
    desc: 'Chrome lettering that glitches, sparkles and a synth grid — pure year 2000.',
    sig: [0.95, 0.8, 0.5, 0.3],
    preset: { fontPair: 'unbounded', mode: 'dark', paper: 'cool', heroStyle: 'statement', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'upper', scale: 'large', density: 'normal', radius: 22, nav: 'floating', cursor: 'invert', bgAnim: 'grid', entrance: 'blur', revealStyle: 'scale', titleAnim: 'scramble' },
    css: `.hero h1,.statement{background:linear-gradient(180deg,var(--fg) 0%,color-mix(in srgb,var(--fg) 35%,var(--bg)) 48%,var(--fg) 52%,color-mix(in srgb,var(--fg) 70%,var(--bg)) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(-3px 0 0 color-mix(in srgb,var(--fg) 30%,transparent)) drop-shadow(3px 0 0 color-mix(in srgb,var(--accent) 45%,transparent));animation:y2k 4s steps(1) infinite}
.hero .statement{font-size:clamp(2rem,5.2vw,4.2rem);max-width:none;overflow-wrap:anywhere}
@keyframes y2k{0%,92%,100%{transform:none;clip-path:none}93%{transform:translate(-4px,2px);clip-path:inset(10% 0 55% 0)}95%{transform:translate(4px,-2px);clip-path:inset(60% 0 8% 0)}97%{transform:translate(-2px,0);clip-path:inset(30% 0 40% 0)}}
.sec-label::before{content:'\\2726  '}
.sec-label::after{content:'  \\2726'}
.sec{border-top:0}
.projects-cards .project{border:1.5px solid transparent;background:linear-gradient(var(--card),var(--card)) padding-box,linear-gradient(135deg,var(--fg),color-mix(in srgb,var(--fg) 20%,var(--bg)),var(--fg)) border-box}
.tags li{border-radius:99px;background:linear-gradient(180deg,color-mix(in srgb,var(--fg) 18%,var(--bg)),var(--bg));border-color:color-mix(in srgb,var(--fg) 40%,var(--bg))}
.btn{border-radius:99px;background:linear-gradient(180deg,var(--fg),color-mix(in srgb,var(--fg) 55%,var(--bg)))}`,
  },

  topo: {
    name: 'Topographic',
    cat: 'Technical',
    base: 'classic',
    desc: 'Contour-map background, a compass mark, map-legend panels and a scale bar.',
    sig: [0.1, 0.4, 0.6, 0.5],
    preset: { fontPair: 'plex', mode: 'light', paper: 'warm', heroStyle: 'split', projectStyle: 'grid', sectionLabel: 'numbered', headingCase: 'upper', scale: 'regular', density: 'normal', radius: 4, mark: 'orbit', nav: 'none', entrance: 'fade', revealStyle: 'fade' },
    css: `body{background-image:repeating-radial-gradient(ellipse at 18% 28%,transparent 0 26px,var(--line) 26px 27px),repeating-radial-gradient(ellipse at 82% 72%,transparent 0 34px,var(--line) 34px 35px),repeating-radial-gradient(ellipse at 60% 10%,transparent 0 20px,var(--line) 20px 21px);background-attachment:fixed}
main .wrap{max-width:1040px}
.hero .eyebrow::before{content:'\\25B2 Elev. 560 m  \\00B7  '}
.hero-content::after{content:'0 \\2500\\2500\\2500\\2500 1 \\2500\\2500\\2500\\2500 2 km';display:block;margin-top:26px;font:500 .72rem var(--mono);letter-spacing:.1em;color:var(--muted)}
.sec{background:color-mix(in srgb,var(--bg) 90%,transparent);border:1px solid var(--line-strong);padding:28px 32px;margin:26px 0}
.sec-label{font-family:var(--mono);font-size:.8rem;letter-spacing:.14em;font-weight:500;display:flex;gap:10px;align-items:center}
.sec-label::after{content:'';flex:1;border-top:1px dashed var(--line-strong)}
.tags li{border-radius:2px;border-style:dotted}`,
  },

  mondrian: {
    name: 'Mondrian',
    cat: 'Bold',
    base: 'bento',
    desc: 'A thick black grid of blocks with solid colour fields — modern-art tiles.',
    sig: [0.15, 0.95, 0.55, 0.45],
    preset: { fontPair: 'grotesk', mode: 'light', paper: 'white', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'upper', scale: 'regular', density: 'normal', radius: 0, border: 'none', hero3d: 'none', mark: 'monogram', nav: 'none', accent: '#d1281f', accentUse: 'bold', entrance: 'scale', revealStyle: 'none' },
    css: `.layout-bento .wrap{max-width:1240px}
.bento{gap:10px;background:var(--fg);padding:10px;margin:24px 0}
.tile,.bento .sec.tile{border:0;border-radius:0;background:var(--bg)}
.bento > :nth-child(2){background:var(--accent)}
.bento > :nth-child(2) .mark{color:var(--on-accent)}
.bento > :nth-child(4){background:var(--fg);color:var(--bg)}
.bento > :nth-child(4) span{color:color-mix(in srgb,var(--bg) 70%,var(--fg))}
.bento > :nth-child(6){background:color-mix(in srgb,#f2c230 85%,var(--bg))}
.t-hero h1{font-weight:800;letter-spacing:-.04em}
.bento .sec-label{color:var(--fg);font-weight:700}
.tags li{border-radius:0;border:2px solid var(--fg)}`,
  },

  departures: {
    name: 'Departure Board',
    cat: 'Retro',
    base: 'classic',
    desc: 'Split-flap letters and your projects listed like flights — all ON TIME.',
    sig: [0.97, 0.7, 0.45, 0.35],
    preset: { fontPair: 'mono', mode: 'dark', paper: 'white', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'upper', scale: 'regular', density: 'tight', radius: 4, nav: 'none', accent: '#f5c518', accentUse: 'bold', entrance: 'split', revealStyle: 'none' },
    css: `body{text-transform:uppercase;letter-spacing:.04em}
main .wrap{max-width:1100px}
.hero h1{font-size:clamp(2rem,6vw,4.2rem);letter-spacing:.05em}
.enter-h .ch{background:linear-gradient(180deg,#1d1d1d 0 49%,#000 49% 51%,#161616 51%);color:var(--accent);padding:.06em .08em;margin:0 .04em;border-radius:5px;box-shadow:0 2px 0 #000;animation-name:flap!important}
@keyframes flap{0%{transform:rotateX(90deg);opacity:0}60%{transform:rotateX(-20deg);opacity:1}100%{transform:none}}
.hero .eyebrow::before{content:'Departures \\00B7  '}
.sec{border-top:1px solid #222}
.sec-label{color:var(--accent);font-size:1rem;letter-spacing:.2em}
.projects-list::before{content:'Flight';display:grid;font-size:.72rem;color:var(--muted);letter-spacing:.2em;padding:0 0 8px}
.projects-list .project{grid-template-columns:70px 1fr;padding:12px 0;border-bottom:1px solid #222}
.projects-list .project-num::before{content:'MF'}
.projects-list .project-main{display:grid;grid-template-columns:1.1fr 1.6fr auto;gap:18px;align-items:baseline}
.project-main .bullets,.project-main .tags.small{display:none}
.project-main p{margin:0;color:var(--muted)}
.project-main .links{margin:0}
.project-main .links::before{content:'On time';color:var(--accent);margin-right:12px}
.tags li{border-radius:3px;border-color:#333;background:#151515}
@media (max-width:720px){.projects-list .project-main{grid-template-columns:1fr}}`,
  },

  comic: {
    name: 'Comic Book',
    cat: 'Bold',
    base: 'classic',
    desc: 'Inked panels, halftone dots, caption boxes and a speech-bubble tagline.',
    sig: [0.05, 0.95, 0.8, 0.55],
    families: ['Bangers'],
    preset: { fontPair: 'bricolage', mode: 'light', paper: 'warm', heroStyle: 'name-big', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'upper', scale: 'large', density: 'normal', radius: 0, border: 'bold', nav: 'none', accent: '#ffd400', accentUse: 'bold', entrance: 'scale', revealStyle: 'scale' },
    css: `.hero h1,.sec-label,.project h3,.btn,.contact .big-link{font-family:'Bangers',var(--font-head)!important;font-weight:400!important;letter-spacing:.05em}
.hero h1{font-size:clamp(3.4rem,11vw,8rem);color:var(--bg);-webkit-text-stroke:2.5px var(--fg);text-shadow:6px 6px 0 var(--fg)}
.hero .tagline{position:relative;background:var(--bg);border:3px solid var(--fg);border-radius:26px;padding:18px 24px;margin-top:28px}
.hero .tagline::after{content:'';position:absolute;left:48px;bottom:-22px;border:12px solid transparent;border-top:20px solid var(--fg)}
.sec{border:4px solid var(--fg);background:var(--bg);padding:42px 30px 30px;margin:40px 0}
.sec:nth-of-type(even){background-image:radial-gradient(var(--line-strong) 1.3px,transparent 1.6px);background-size:9px 9px}
.sec-label{display:inline-block;background:var(--accent);color:#000;border:3px solid var(--fg);padding:4px 16px;transform:rotate(-1.5deg);margin:-62px 0 18px;font-size:1.6rem}
.projects-cards .project{border:3px solid var(--fg);border-radius:0;background:var(--bg);box-shadow:6px 6px 0 var(--fg)}
.btn{border:3px solid var(--fg);border-radius:0;box-shadow:4px 4px 0 var(--fg);font-size:1.2rem}
.tags li{border:2px solid var(--fg);border-radius:0;font-weight:700}
.eyebrow,.stars,.project-num{color:var(--fg)!important}`,
  },

  launch: {
    name: 'Launch Page',
    cat: 'Modern',
    base: 'classic',
    desc: 'Like a modern product launch: centred glow hero, gradient headline, gradient-border cards.',
    sig: [0.96, 0.55, 0.3, 0.3],
    preset: { fontPair: 'tight', mode: 'dark', paper: 'cool', heroStyle: 'name-big', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'normal', scale: 'large', density: 'airy', radius: 14, nav: 'top', entrance: 'blur', revealStyle: 'rise', cardHover: 'lift', linkStyle: 'slide' },
    css: `main .wrap{max-width:1100px}
body::before{content:'';position:absolute;inset:0 0 auto 0;height:720px;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:56px 56px;-webkit-mask:radial-gradient(ellipse 70% 60% at 50% 0,#000,transparent);mask:radial-gradient(ellipse 70% 60% at 50% 0,#000,transparent);pointer-events:none;z-index:-1}
.hero{text-align:center;padding-top:18vh;isolation:isolate}
.hero::before{content:'';position:absolute;left:50%;top:6%;width:min(820px,90vw);height:420px;transform:translateX(-50%);background:radial-gradient(closest-side,color-mix(in srgb,var(--accent) 34%,transparent),transparent);filter:blur(30px);z-index:-1}
.hero .eyebrow{display:inline-block;border:1px solid var(--line-strong);border-radius:99px;padding:6px 14px;background:var(--card)}
.hero h1{background:linear-gradient(180deg,var(--fg),color-mix(in srgb,var(--fg) 45%,var(--bg)));-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:700;letter-spacing:-.05em}
.hero .tagline{margin-inline:auto;color:var(--muted)}
.meta-grid{display:none}
.hero-cta,.hero .links,.hero-row{justify-content:center}
.btn{border-radius:10px}
.btn.ghost{background:var(--card)}
.sec{border-top:0;text-align:center}
.sec-label{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:700;letter-spacing:-.04em}
.sec-body{text-align:left}
.prose{margin-inline:auto}
.projects-cards .project{border:1px solid transparent;background:linear-gradient(var(--card),var(--card)) padding-box,linear-gradient(180deg,color-mix(in srgb,var(--fg) 35%,transparent),transparent 70%) border-box}
.skills{justify-items:center;text-align:center}
.tags{justify-content:center}
.tags li{background:var(--card);border-color:var(--line)}`,
  },
};
