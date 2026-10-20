// Additional themes built on top of a structural base theme.
// Each one ships its own preset AND a block of CSS that changes the art direction,
// so they look like different websites — not colour swaps.
// sig = [darkness, contrast, busyness, warmth] (0..1) used to match inspiration images.

export const SKINS = {
  noir: {
    name: 'Noir',
    cat: 'Minimal',
    base: 'classic',
    desc: 'Dark, italic serif drama with film grain. Quietly cinematic.',
    sig: [0.95, 0.7, 0.2, 0.4],
    preset: { fontPair: 'serif', mode: 'dark', paper: 'white', heroStyle: 'statement', projectStyle: 'list', sectionLabel: 'numbered', headingCase: 'normal', scale: 'large', density: 'airy', grain: true, cursor: 'ring', nav: 'floating', entrance: 'blur', revealStyle: 'fade' },
    css: `.hero h1,.statement{font-style:italic}
.sec-label{font-family:var(--mono);font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);font-weight:400}
.sec-label .num{color:var(--fg)}
.hero .eyebrow{letter-spacing:.3em}
.project h3{font-family:var(--font-head);font-style:italic;font-size:2rem;font-weight:400}`,
  },
  zen: {
    name: 'Zen',
    cat: 'Minimal',
    base: 'classic',
    desc: 'Centred, tiny and silent. Maximum whitespace, nothing extra.',
    sig: [0.05, 0.3, 0.05, 0.5],
    preset: { fontPair: 'serif', mode: 'light', paper: 'warm', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', scale: 'compact', density: 'airy', nav: 'none', cursor: 'none', grain: false, entrance: 'fade', revealStyle: 'fade' },
    css: `.wrap{max-width:600px}
body{font-size:17px}
.hero{text-align:center;padding-top:24vh;padding-bottom:18vh}
.hero .meta-grid{display:none}
.hero-cta,.hero .links,.hero-row{justify-content:center}
.tagline{margin-inline:auto}
.sec{border-top:0}
.sec-label{font-weight:400;font-style:italic;text-align:center;margin-bottom:44px}
.sec-label::after{content:'';display:block;width:28px;height:1px;background:var(--fg);margin:18px auto 0}
.tags{justify-content:center}.tags li{border:0;padding:0 6px}
.skill-group h3{text-align:center}
.projects-list .project{grid-template-columns:1fr;text-align:center}
.projects-list .project-num{display:none}
.project .links,.project .tags.small{justify-content:center}
.bullets{list-style:none;padding:0}
.contact{text-align:center}.contact .links{justify-content:center}`,
  },
  readme: {
    name: 'README.md',
    cat: 'Technical',
    base: 'classic',
    desc: 'Your portfolio as a GitHub README — file header, badges, rules.',
    sig: [0.1, 0.5, 0.4, 0.3],
    preset: { fontPair: 'inter', mode: 'light', paper: 'white', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'hash', headingCase: 'normal', scale: 'compact', density: 'tight', nav: 'none', radius: 6, entrance: 'none', revealStyle: 'none' },
    css: `body{background-color:color-mix(in srgb,var(--fg) 4%,var(--bg))}
main .wrap{max-width:900px;border:1px solid var(--line-strong);border-radius:10px;margin:40px auto;padding:0 44px 40px;background:var(--bg)}
main .wrap::before{content:'▤  README.md';display:block;font:600 .82rem var(--mono);border-bottom:1px solid var(--line-strong);margin:0 -44px 8px;padding:14px 20px;background:var(--card);border-radius:10px 10px 0 0}
.hero{padding:32px 0 8px}
.sec{border-top:0;padding:24px 0}
.sec-label{font-size:1.55rem;font-weight:700;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:18px}
.tags li{border-radius:4px;font-family:var(--mono);font-size:.74rem;padding:3px 9px;background:var(--fg);color:var(--bg);border:0}
.tags.small li{background:var(--card);color:var(--fg);border:1px solid var(--line)}
.projects-list .project{padding:14px 0}
.projects-list .project-num{display:none}.projects-list .project{grid-template-columns:1fr}
.project h3::before{content:'### ';color:var(--muted);font-family:var(--mono);font-size:.8em}
.foot{border:0}`,
  },
  receipt: {
    name: 'Receipt',
    cat: 'Retro',
    base: 'classic',
    desc: 'A printed thermal receipt: narrow, monospaced, dashed and itemised.',
    sig: [0.1, 0.55, 0.3, 0.55],
    preset: { fontPair: 'mono', mode: 'light', paper: 'white', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'upper', scale: 'compact', density: 'tight', nav: 'none', radius: 0, entrance: 'rise', revealStyle: 'none' },
    css: `body{background-color:color-mix(in srgb,var(--fg) 10%,var(--bg));font-size:14px}
main .wrap{max-width:460px;background:var(--bg);margin:48px auto 0;padding:34px 30px 46px;box-shadow:0 24px 60px -20px rgba(0,0,0,.35);position:relative}
main .wrap::after{content:'';position:absolute;left:0;right:0;bottom:-12px;height:12px;background:linear-gradient(-45deg,transparent 8px,var(--bg) 0) 0 0/16px 16px,linear-gradient(45deg,transparent 8px,var(--bg) 0) 0 0/16px 16px}
.hero{text-align:center;padding:10px 0 22px}
.hero h1{font-size:2rem;letter-spacing:.02em}
.hero .eyebrow::before{content:'*** ';}.hero .eyebrow::after{content:' ***'}
.meta-grid{grid-template-columns:1fr;text-align:left;border-top:2px dashed var(--fg)}
.meta-grid div{display:flex;justify-content:space-between;padding:6px 0}
.hero-cta,.hero .links,.hero-row{justify-content:center}
.sec{border-top:2px dashed var(--fg);padding:22px 0}
.sec-label{font-size:.95rem;text-align:center;letter-spacing:.12em}
.projects-list .project{grid-template-columns:36px 1fr;padding:12px 0;border-bottom:1px dotted var(--line-strong)}
.project h3{font-size:1rem}.bullets{display:none}
.tags li{border:0;padding:0 6px 0 0;border-radius:0}.tags li::before{content:'+ '}
.entry{grid-template-columns:1fr;gap:2px}
.rows li{border-bottom:1px dotted var(--line-strong)}
.foot{border:0;text-align:center}.foot .wrap{justify-content:center;box-shadow:none;background:none;margin:0 auto;padding:30px 0}
.foot .wrap::after{display:none}
.foot .wrap::before{content:'THANK YOU FOR VISITING';display:block;width:100%;text-align:center;letter-spacing:.2em}
.contact .big-link{font-size:1.2rem}`,
  },
  paper: {
    name: 'A4 Paper',
    cat: 'Minimal',
    base: 'classic',
    desc: 'A crisp printed sheet floating on a desk. Recruiter-friendly.',
    sig: [0.1, 0.4, 0.2, 0.45],
    preset: { fontPair: 'fraunces', mode: 'light', paper: 'white', heroStyle: 'split', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', scale: 'regular', density: 'tight', nav: 'none', radius: 0, entrance: 'rise', revealStyle: 'none' },
    css: `body{background-color:color-mix(in srgb,var(--fg) 12%,var(--bg))}
main .wrap{max-width:880px;background:var(--bg);margin:56px auto;padding:72px 84px;box-shadow:0 1px 3px rgba(0,0,0,.12),0 40px 80px -30px rgba(0,0,0,.35)}
.hero{padding:0 0 32px;border-bottom:2px solid var(--fg)}
.sec{border-top:0;padding:28px 0 0;display:grid;grid-template-columns:160px 1fr;gap:24px}
.sec-label{font-size:.75rem;text-transform:uppercase;letter-spacing:.14em;font-family:var(--mono);font-weight:500;padding-top:6px}
.projects-list .project{grid-template-columns:1fr;padding:12px 0}.projects-list .project-num{display:none}
.foot{border:0}
@media (max-width:720px){main .wrap{padding:32px 22px;margin:0}.sec{grid-template-columns:1fr}}`,
  },
  stack: {
    name: 'Sticky Stack',
    cat: 'Playful',
    base: 'classic',
    desc: 'Sections are cards that stack on top of each other as you scroll.',
    sig: [0.6, 0.5, 0.4, 0.4],
    preset: { fontPair: 'bricolage', mode: 'dark', paper: 'white', heroStyle: 'name-big', projectStyle: 'cards', sectionLabel: 'numbered', headingCase: 'normal', scale: 'large', density: 'normal', radius: 14, nav: 'none', entrance: 'split', revealStyle: 'scale', cardHover: 'lift' },
    css: `main .wrap{max-width:1000px}
.sec{position:sticky;top:24px;background:var(--card);background-color:color-mix(in srgb,var(--fg) 6%,var(--bg));border:1px solid var(--line);border-radius:28px;padding:48px;margin-bottom:28px;box-shadow:0 -20px 60px -20px rgba(0,0,0,.45);min-height:60vh}
.sec:nth-of-type(2){top:40px}.sec:nth-of-type(3){top:56px}.sec:nth-of-type(4){top:72px}.sec:nth-of-type(5){top:88px}.sec:nth-of-type(6){top:104px}.sec:nth-of-type(7){top:120px}.sec:nth-of-type(8){top:136px}
.sec-label{font-size:clamp(1.8rem,4vw,3rem);font-weight:var(--heavy)}
.projects-cards .project{background:var(--bg)}
@media (max-width:720px){.sec{position:relative;top:auto!important;padding:28px;min-height:0}}`,
  },
  timeline: {
    name: 'Timeline',
    cat: 'Editorial',
    base: 'classic',
    desc: 'A vertical spine runs through the page; sections alternate sides.',
    sig: [0.2, 0.5, 0.35, 0.4],
    preset: { fontPair: 'sora', mode: 'light', paper: 'white', heroStyle: 'statement', projectStyle: 'list', sectionLabel: 'numbered', headingCase: 'normal', scale: 'regular', density: 'normal', radius: 6, nav: 'top', entrance: 'rise', revealStyle: 'slide' },
    css: `main .wrap{max-width:1080px}
.hero{text-align:center}.hero .statement{margin-inline:auto}.hero-cta,.hero .links,.hero-row{justify-content:center}
.sec{width:50%;border-top:0;padding:48px 56px 48px 0;position:relative}
.sec::before{content:'';position:absolute;top:0;bottom:0;right:-1px;width:2px;background:var(--line-strong)}
.sec::after{content:'';position:absolute;top:56px;right:-8px;width:14px;height:14px;border-radius:50%;background:var(--bg);border:2px solid var(--fg)}
.sec:nth-of-type(even){margin-left:50%;padding:48px 0 48px 56px}
.sec:nth-of-type(even)::before{right:auto;left:-1px}.sec:nth-of-type(even)::after{right:auto;left:-6px}
.sec:nth-of-type(odd){text-align:right}
.sec:nth-of-type(odd) .tags,.sec:nth-of-type(odd) .links{justify-content:flex-end}
.sec:nth-of-type(odd) .bullets{list-style-position:inside;padding:0}
.projects-list .project{grid-template-columns:1fr}.projects-list .project-num{display:none}
.entry{grid-template-columns:1fr;gap:2px}
@media (max-width:820px){.sec,.sec:nth-of-type(even){width:auto;margin-left:0;padding:40px 0 40px 28px;text-align:left}.sec::before,.sec:nth-of-type(even)::before{left:0;right:auto}.sec::after,.sec:nth-of-type(even)::after{left:-6px;right:auto}.sec:nth-of-type(odd) .tags,.sec:nth-of-type(odd) .links{justify-content:flex-start}}`,
  },
  archive: {
    name: 'Archive Index',
    cat: 'Technical',
    base: 'classic',
    desc: 'Everything as a dense, sortable-looking index table. Very designer.',
    sig: [0.1, 0.6, 0.6, 0.3],
    preset: { fontPair: 'grotesk', mode: 'light', paper: 'white', heroStyle: 'minimal', projectStyle: 'list', sectionLabel: 'numbered', headingCase: 'upper', scale: 'compact', density: 'tight', radius: 0, nav: 'none', entrance: 'fade', revealStyle: 'none', cardHover: 'invert' },
    css: `main .wrap{max-width:1300px}
body{font-size:14px}
.hero{border-bottom:2px solid var(--fg)}
.sec{display:grid;grid-template-columns:220px 1fr;gap:24px;padding:28px 0;border-top:1px solid var(--fg)}
.sec-label{font-size:.78rem;letter-spacing:.06em;font-family:var(--mono);font-weight:500}
.projects-list .project{grid-template-columns:48px 1fr;padding:10px 8px;margin:0 -8px;border-bottom:1px solid var(--line)}
.projects-list .project-main{display:grid;grid-template-columns:1.1fr 1.6fr 1.2fr auto;gap:18px;align-items:baseline}
.project-main .bullets{display:none}.project-main p,.project-main .tags.small,.project-main .links{margin:0}
.project h3{font-size:.95rem;text-transform:uppercase}
.entry{grid-template-columns:220px 1fr}
.tags li{border-radius:0;font-size:.78rem}
@media (max-width:820px){.sec{grid-template-columns:1fr}.projects-list .project-main{grid-template-columns:1fr}}`,
  },
  typewriter: {
    name: 'Typewriter',
    cat: 'Retro',
    base: 'classic',
    desc: 'Inked letters on ruled paper — your name types itself out.',
    sig: [0.1, 0.45, 0.3, 0.8],
    families: [],
    preset: { fontPair: 'typewriter', mode: 'light', paper: 'warm', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'bracket', headingCase: 'normal', scale: 'regular', density: 'normal', radius: 0, texture: 'lines', nav: 'none', entrance: 'typewriter', revealStyle: 'fade' },
    css: `h1,h2,h3{font-weight:400!important}
.hero h1{letter-spacing:0}
.sec{border-top:1px dashed var(--line-strong)}
.tags li{border-style:dashed;border-radius:0}
.btn{border-radius:0}
.project h3{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px}`,
  },
  scrapbook: {
    name: 'Scrapbook',
    cat: 'Playful',
    base: 'classic',
    desc: 'Taped polaroids and tilted cards on a dotted desk.',
    sig: [0.15, 0.4, 0.7, 0.65],
    preset: { fontPair: 'bricolage', mode: 'light', paper: 'warm', heroStyle: 'split', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'normal', scale: 'large', density: 'normal', radius: 2, texture: 'dots', nav: 'none', tilt: false, entrance: 'scale', revealStyle: 'rise', cardHover: 'none' },
    css: `main .wrap{max-width:1040px}
.projects-cards{gap:36px;padding-top:16px}
.projects-cards .project{background:var(--bg);border:0;box-shadow:0 14px 34px -12px rgba(0,0,0,.28);transform:rotate(-1.6deg);transition:transform .3s}
.projects-cards .project:nth-child(even){transform:rotate(1.4deg)}
.projects-cards .project:hover{transform:rotate(0) scale(1.03)}
.projects-cards .project::before{content:'';position:absolute;top:-13px;left:50%;width:96px;height:26px;margin-left:-48px;background:color-mix(in srgb,var(--fg) 14%,transparent);transform:rotate(-3deg)}
.avatar,.hero-visual .avatar{border:10px solid #fff;border-bottom-width:34px;border-radius:0;box-shadow:0 18px 40px -14px rgba(0,0,0,.4);transform:rotate(-4deg)}
.sec-label{display:inline-block;background:var(--fg);color:var(--bg);padding:4px 14px;transform:rotate(-1.5deg)}
.sec{border-top:0}
.tags li{background:var(--bg);box-shadow:0 2px 0 var(--line-strong)}`,
  },
  newspaper: {
    name: 'Broadsheet',
    cat: 'Editorial',
    base: 'editorial',
    desc: 'A newspaper front page: blackletter masthead and column rules.',
    sig: [0.12, 0.7, 0.75, 0.55],
    families: ['UnifrakturMaguntia'],
    preset: { fontPair: 'editorial', mode: 'light', paper: 'warm', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'normal', scale: 'large', density: 'tight', radius: 0, nav: 'none', grain: true, entrance: 'fade', revealStyle: 'none' },
    css: `.ed-name{font-family:'UnifrakturMaguntia',serif!important;font-weight:400!important;text-align:center;letter-spacing:0!important;border-bottom:4px double var(--fg)}
.masthead{border-bottom:1px solid var(--fg)}
.ed-dek{grid-template-columns:1fr 2fr 1fr;text-align:center;border-bottom:1px solid var(--fg);padding-bottom:18px}
.ed-standfirst{font-style:normal;font-weight:700}
.layout-editorial .sec{grid-template-columns:1fr;gap:16px;border-top:2px solid var(--fg)}
.layout-editorial .sec-label{position:static;text-align:center;font-family:var(--font-head);font-size:1.6rem;text-transform:uppercase;letter-spacing:.04em;font-weight:800}
.layout-editorial .sec-label .num{display:none}
.projects-cards{display:block;column-count:3;column-rule:1px solid var(--line-strong);column-gap:32px}
.projects-cards .project{break-inside:avoid;border:0;background:none;padding:0 0 22px;border-radius:0}
.project h3{font-size:1.35rem}
.layout-editorial .about{column-count:3;column-rule:1px solid var(--line-strong)}
@media (max-width:820px){.projects-cards,.layout-editorial .about{column-count:1}}`,
  },
  museum: {
    name: 'Museum',
    cat: 'Editorial',
    base: 'editorial',
    desc: 'Projects hung like exhibits, each with a gallery placard.',
    sig: [0.05, 0.4, 0.15, 0.35],
    preset: { fontPair: 'dmserif', mode: 'light', paper: 'white', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'normal', scale: 'regular', density: 'airy', radius: 0, nav: 'none', grain: false, entrance: 'fade', revealStyle: 'fade' },
    css: `.masthead{border-bottom:1px solid var(--line)}
.ed-name{text-align:center;font-style:italic;border-bottom:0}
.ed-dek{grid-template-columns:1fr;text-align:center;max-width:620px;margin:0 auto}
.ed-byline .links{justify-content:center}
.layout-editorial .sec{grid-template-columns:1fr;border-top:0;text-align:left}
.layout-editorial .sec-label{position:static;text-align:center;font-family:var(--font-head);font-size:2rem;font-style:italic;text-transform:none;letter-spacing:0}
.layout-editorial .sec-label .num{display:none}
.projects-cards{grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:64px 48px}
.projects-cards .project{border:0;background:none;padding:0;border-radius:0}
.project-img{border:14px solid var(--bg);outline:1px solid var(--line-strong);box-shadow:0 30px 50px -30px rgba(0,0,0,.4)}
.projects-cards .project-main{border-left:2px solid var(--fg);padding-left:16px;font-size:.92rem}
.project h3{font-style:italic}
.layout-editorial .about{column-count:1!important;max-width:640px;margin:0 auto}`,
  },
  ide: {
    name: 'Code Editor',
    cat: 'Technical',
    base: 'sidebar',
    desc: 'An IDE: file explorer, editor tab, gutter and a status bar.',
    sig: [0.9, 0.5, 0.55, 0.3],
    preset: { fontPair: 'mono', mode: 'dark', paper: 'cool', projectStyle: 'list', sectionLabel: 'slash', headingCase: 'normal', scale: 'compact', density: 'tight', radius: 4, nav: 'none', entrance: 'typewriter', revealStyle: 'none' },
    css: `body{font-size:14px}
.layout-sidebar .shell{grid-template-columns:270px 1fr}
.layout-sidebar aside{background:color-mix(in srgb,var(--fg) 5%,var(--bg));padding:22px 18px 60px;gap:14px;border-left:44px solid color-mix(in srgb,var(--fg) 9%,var(--bg))}
.layout-sidebar aside::before{content:'EXPLORER';font:600 .7rem var(--mono);letter-spacing:.12em;color:var(--muted)}
.layout-sidebar aside h1{font-size:1.25rem}
.layout-sidebar aside nav a{font-family:var(--mono);font-size:.84rem;padding:3px 8px;border-radius:3px}
.layout-sidebar aside nav a::before{content:'▸ ';color:var(--muted)}
.layout-sidebar aside nav a::after{content:'.tsx';color:var(--muted)}
.layout-sidebar aside nav a:hover{background:var(--line);padding-left:8px}
.layout-sidebar main{padding:0 40px 60px;max-width:none}
.lead{border-bottom:1px solid var(--line)}
.lead::before{content:'index.tsx   ×';display:inline-block;font:500 .78rem var(--mono);padding:8px 16px;border:1px solid var(--line);border-bottom:2px solid var(--fg);margin:16px 0 28px;background:var(--bg)}
.sec-body{border-left:1px solid var(--line);padding-left:22px}
.sec{border-top:0;padding:28px 0}
.sec-label{font-size:.95rem;color:var(--muted)}
body::after{content:'⎇ main    ✓ 0 problems    UTF-8    TypeScript React    Ln 1, Col 1';position:fixed;left:0;right:0;bottom:0;height:24px;line-height:24px;padding:0 14px;background:var(--fg);color:var(--bg);font:11px var(--mono);z-index:60;white-space:nowrap;overflow:hidden}
.projects-list .project{padding:14px 0}
@media (max-width:980px){.layout-sidebar aside{border-left:0}}`,
  },
  splitscreen: {
    name: 'Split Screen',
    cat: 'Bold',
    base: 'sidebar',
    desc: 'Half the screen inverted with your name; the other half scrolls.',
    sig: [0.5, 0.95, 0.25, 0.3],
    preset: { fontPair: 'tight', mode: 'light', paper: 'white', projectStyle: 'numbered', sectionLabel: 'numbered', headingCase: 'normal', scale: 'large', density: 'normal', radius: 0, nav: 'none', entrance: 'mask', revealStyle: 'rise' },
    css: `.layout-sidebar .shell{grid-template-columns:1fr 1fr}
.layout-sidebar aside{background:var(--fg);color:var(--bg);padding:64px;justify-content:center;border:0;--muted:color-mix(in srgb,var(--bg) 60%,var(--fg));--line:color-mix(in srgb,var(--bg) 18%,var(--fg))}
.layout-sidebar aside h1{font-size:clamp(3rem,6.5vw,6.5rem);line-height:.88;letter-spacing:-.05em;font-weight:var(--heavy)}
.layout-sidebar aside .links{margin-top:24px}
.layout-sidebar aside .dot{background:var(--bg)}
.layout-sidebar aside .mark{color:var(--bg)}
.layout-sidebar main{padding:0 64px}
@media (max-width:980px){.layout-sidebar aside{padding:48px 24px;min-height:80vh}}`,
  },
  matrix: {
    name: 'Matrix',
    cat: 'Retro',
    base: 'terminal',
    desc: 'The interactive terminal over falling glyph rain.',
    sig: [0.97, 0.6, 0.6, 0.2],
    preset: { fontPair: 'mono', mode: 'dark', paper: 'white', projectStyle: 'list', sectionLabel: 'prompt', scale: 'regular', density: 'normal', radius: 6, nav: 'none', bgAnim: 'matrix', entrance: 'fade', revealStyle: 'fade', scramble: true },
    css: `.term{background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.sec{background:color-mix(in srgb,var(--bg) 80%,transparent)}`,
  },
  neon: {
    name: 'Neon Noir',
    cat: '3D',
    base: 'spatial',
    desc: 'Glowing type, CRT scanlines and a wireframe synth-terrain.',
    sig: [0.97, 0.85, 0.5, 0.25],
    preset: { fontPair: 'unbounded', mode: 'dark', paper: 'cool', projectStyle: 'cards', sectionLabel: 'slash', headingCase: 'upper', scale: 'large', density: 'normal', radius: 6, hero3d: 'terrain', hero3dPlace: 'auto', cursor: 'invert', grain: false, scramble: true, nav: 'floating', entrance: 'blur', revealStyle: 'blur' },
    css: `h1,.sec-label,.t-stat b{text-shadow:0 0 10px color-mix(in srgb,var(--fg) 70%,transparent),0 0 42px color-mix(in srgb,var(--fg) 35%,transparent)}
body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(to bottom,transparent 0 2px,rgba(0,0,0,.28) 2px 3px);pointer-events:none;z-index:997}
.glass{box-shadow:0 0 0 1px color-mix(in srgb,var(--fg) 25%,transparent),0 0 40px -10px color-mix(in srgb,var(--fg) 40%,transparent)}
.btn{box-shadow:0 0 22px -4px var(--fg)}`,
  },
  aurora: {
    name: 'Aurora',
    cat: '3D',
    base: 'spatial',
    desc: 'Slow-moving monochrome light fields behind frosted glass.',
    sig: [0.75, 0.35, 0.2, 0.4],
    preset: { fontPair: 'sora', mode: 'dark', paper: 'white', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'normal', scale: 'large', density: 'normal', radius: 14, hero3d: 'none', bgAnim: 'gradient', cursor: 'ring', grain: true, scramble: false, nav: 'floating', entrance: 'blur', revealStyle: 'rise' },
    css: `.space-glow{display:none}
.glass{background:color-mix(in srgb,var(--bg) 40%,transparent)}
.sp-hero h1{mix-blend-mode:normal;color:var(--fg)}`,
  },
  cosmos: {
    name: 'Cosmos',
    cat: '3D',
    base: 'spatial',
    desc: 'A dotted planet turning in a field of drifting stars.',
    sig: [0.98, 0.6, 0.35, 0.3],
    preset: { fontPair: 'syne', mode: 'dark', paper: 'cool', projectStyle: 'cards', sectionLabel: 'numbered', headingCase: 'upper', scale: 'large', density: 'normal', radius: 14, hero3d: 'globe', bgAnim: 'stars', cursor: 'ring', grain: false, scramble: true, nav: 'floating', entrance: 'blur', revealStyle: 'rise' },
    css: `.space-glow{background:radial-gradient(50% 40% at 70% 40%,color-mix(in srgb,var(--fg) 10%,transparent),transparent 70%)}`,
  },
  gridlines: {
    name: 'Grid Lines',
    cat: 'Bold',
    base: 'swiss',
    desc: 'The Swiss grid made visible — twelve hairline columns over everything.',
    sig: [0.9, 0.85, 0.4, 0.3],
    preset: { fontPair: 'grotesk', mode: 'dark', paper: 'white', projectStyle: 'numbered', sectionLabel: 'numbered', headingCase: 'upper', scale: 'large', density: 'normal', radius: 0, border: 'hairline', cursor: 'crosshair', nav: 'none', entrance: 'mask', revealStyle: 'clip' },
    css: `body::before{content:'';position:fixed;top:0;bottom:0;left:max(32px,calc((100vw - 1380px) / 2 + 32px));right:max(32px,calc((100vw - 1380px) / 2 + 32px));background:repeating-linear-gradient(to right,var(--line) 0 1px,transparent 1px calc(100% / 12));border-right:1px solid var(--line);pointer-events:none;z-index:0}
main{position:relative;z-index:1}
.sw-top{border-top-width:1px}
.layout-swiss .sec{border-top-width:1px}`,
  },
  zine: {
    name: 'Zine',
    cat: 'Playful',
    base: 'brutalist',
    desc: 'Photocopied DIY zine: halftone, stickers and crooked labels.',
    sig: [0.2, 0.9, 0.85, 0.6],
    preset: { fontPair: 'syne', mode: 'light', paper: 'warm', heroStyle: 'name-big', projectStyle: 'cards', sectionLabel: 'plain', headingCase: 'upper', scale: 'large', density: 'normal', radius: 0, border: 'bold', cursor: 'invert', grain: true, nav: 'none', entrance: 'split', revealStyle: 'scale' },
    css: `.hero{background-image:radial-gradient(var(--line-strong) 1.3px,transparent 1.6px);background-size:9px 9px;padding-left:24px;padding-right:24px;margin:24px -24px 0}
.layout-brutalist h1{transform:rotate(-2deg);display:inline-block;background:var(--bg);padding:0 10px}
.sec-label{display:inline-block;background:var(--fg);color:var(--bg);padding:6px 16px;transform:rotate(-1.5deg)}
.tags li:nth-child(odd){transform:rotate(-2deg)}.tags li:nth-child(even){transform:rotate(1.5deg)}
.projects-cards .project:nth-child(odd){transform:rotate(-.8deg)}.projects-cards .project:nth-child(even){transform:rotate(.8deg)}
.meta-grid{background:var(--bg)}`,
  },
  geocities: {
    name: 'Web 1.0',
    cat: 'Retro',
    base: 'brutalist',
    desc: 'Times New Roman, bevelled buttons, ridges — best viewed in Netscape.',
    sig: [0.05, 0.8, 0.6, 0.4],
    preset: { fontPair: 'times', mode: 'light', paper: 'white', heroStyle: 'name-big', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', scale: 'regular', density: 'tight', radius: 0, border: 'bold', cursor: 'none', nav: 'top', entrance: 'none', revealStyle: 'none' },
    css: `.layout-brutalist h1{text-transform:none;letter-spacing:0;font-weight:700;text-align:center}
.hero{text-align:center}.hero .tagline{margin-inline:auto}.hero-cta,.hero .links,.hero-row{justify-content:center}.meta-grid{text-align:left}
.sec{border-top:4px ridge var(--line-strong)!important}
.sec-label{text-transform:none;text-align:center;font-size:1.8rem;letter-spacing:0;text-decoration:underline}
.btn{background:#c0c0c0;color:#000;border:3px outset #fff!important;border-radius:0;box-shadow:none!important;font-family:'Times New Roman',serif}
.tags li{border:0!important;font-weight:400}.tags li::before{content:'• '}
a{color:var(--fg);text-decoration:underline}
.marquee{background:var(--bg);color:var(--fg);border-color:var(--fg)}
.foot .wrap::after{content:'Best viewed in Netscape Navigator 4.0 at 800×600 · You are visitor #000427';font-style:italic}
.nav{background:#c0c0c0;color:#000}.nav ul a{color:#000;text-decoration:underline}`,
  },
  handheld: {
    name: 'Handheld',
    cat: 'Retro',
    base: 'os',
    desc: 'The retro desktop on a grey LCD with chunky pixel windows.',
    sig: [0.35, 0.55, 0.6, 0.4],
    preset: { fontPair: 'pixel', mode: 'light', paper: 'cool', projectStyle: 'list', sectionLabel: 'plain', scale: 'compact', density: 'tight', radius: 0, border: 'bold', nav: 'none', entrance: 'scale', revealStyle: 'none' },
    css: `:root{--bg:#c9ccc5;--fg:#1d211b}
.layout-os{background-image:radial-gradient(color-mix(in srgb,var(--fg) 22%,var(--bg)) 1px,transparent 1.1px);background-size:3px 3px}
.win{box-shadow:none;border-width:3px;outline:3px solid var(--bg);outline-offset:-6px}
.menubar{background:var(--fg);color:var(--bg);border:0}`,
  },
  dashboard: {
    name: 'Dashboard',
    cat: 'Technical',
    base: 'bento',
    desc: 'A data console: stat panels, header strips and counting numbers.',
    sig: [0.85, 0.6, 0.8, 0.3],
    preset: { fontPair: 'plex', mode: 'dark', paper: 'cool', projectStyle: 'list', sectionLabel: 'slash', headingCase: 'normal', scale: 'regular', density: 'tight', radius: 4, hero3d: 'rings', nav: 'none', counters: true, entrance: 'scale', revealStyle: 'scale' },
    css: `.tile::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--fg)}
.tile{padding-top:34px}
.t-stat b{font-family:var(--mono);font-weight:500;letter-spacing:-.06em}
.t-stat{min-height:176px}
.t-stat::after{content:'';position:absolute;left:28px;right:28px;bottom:52px;height:16px;background:repeating-linear-gradient(90deg,var(--line-strong) 0 3px,transparent 3px 7px);mask:linear-gradient(90deg,#000 0,#000 70%,transparent);-webkit-mask:linear-gradient(90deg,#000,#000 70%,transparent)}
.bento .sec-label{color:var(--fg)}
.t-hero h1{font-family:var(--mono);font-weight:500;letter-spacing:-.04em}`,
  },
  manifesto: {
    name: 'Manifesto',
    cat: 'Bold',
    base: 'kinetic',
    desc: 'Your tagline becomes a giant statement; your name signs it.',
    sig: [0.1, 0.95, 0.35, 0.4],
    preset: { fontPair: 'tight', mode: 'light', paper: 'white', projectStyle: 'list', sectionLabel: 'plain', headingCase: 'normal', scale: 'large', density: 'normal', radius: 0, cursor: 'invert', grain: false, progress: true, nav: 'none', entrance: 'split', revealStyle: 'rise' },
    css: `.kn-hero{justify-content:center;gap:40px}
.kn-name{order:2;font-size:clamp(2rem,5vw,4rem)!important;flex-direction:row;gap:.3em;padding:0 28px;line-height:1.1}
.kn-line.outline{align-self:auto}
.kn-foot{order:1}
.kn-tag{font-family:var(--font-head);font-size:clamp(2.4rem,7vw,7rem);line-height:.95;letter-spacing:-.05em;font-weight:var(--heavy);max-width:16ch}
.kn-top{order:0}`,
  },
};
