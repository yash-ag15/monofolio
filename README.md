# Monofolio — Developer Identity Studio

Everything a student developer needs in one place: one profile (your "Dev Identity") drives a
unique portfolio site, and later the résumé, cover letters, ATS checks and profile cards.

A Next.js app: the interface runs in the browser, and API routes (`pages/api/[...path].js` →
`server/`) handle accounts (email, Google, demo), each user's saved data in Neon Postgres, and AI
with the site owner's key. Visitors never enter a key.

## Run

```bash
npm install
cp .env.example .env.local   # then fill in your keys (DATABASE_URL, AI key, Google, AUTH_SECRET)
npm run dev                  # http://localhost:5173
npm run build && npm start   # production build
```

## Deploy (Vercel)

Import the repo in Vercel — it detects Next.js, no extra settings. Add the variables from
`.env.local` under Settings → Environment Variables (plus `APP_URL=https://your-domain`), and add
`https://your-domain/api/auth/google/callback` as a redirect URI in your Google OAuth client.

## What's done (Portfolio)

- **Dev Identity** — basics, photo, links, skills, projects (with screenshots), experience,
  education, certifications, achievements, and unlimited custom sections.
- **Portfolio Studio** (black-first UI, tool rail: Themes, Inspire, Brief, Style, Motion, 3D, Layout, Publish)
  - *35 themes in 7 categories*, each with its own page structure: Minimal, Noir, Zen, A4 Paper, Sidebar,
    Split Screen, Swiss Poster, Grid Lines, Brutalist, Kinetic Type, Manifesto, Zine, Spatial 3D, Neon Noir,
    Aurora, Cosmos, Bento, Dashboard, Interactive Terminal, Matrix, Code Editor, README.md, Archive Index,
    Blueprint, Retro Desktop, Handheld, Web 1.0, Typewriter, Receipt, Magazine, Broadsheet, Museum,
    Timeline, Scrapbook, Sticky Stack. New themes are skins in src/portfolio/skins.js (a base + CSS + preset).
  - *Animations*: 8 hero entrances (fade, rise, blur, scale, mask wipe, letter-by-letter, typewriter),
    7 scroll reveals with stagger, animated section titles, 6 animated backgrounds (starfield, code rain,
    aurora, retro grid, cursor-reactive dots, waves), card + link hovers, parallax, counters, preloader,
    grain, scroll progress, plus one-click animation presets. All respect reduced motion.
  - *Inspire from an image*: drop a design/screenshot/moodboard; it is analysed in the browser
    (brightness, contrast, detail, warmth, palette, accent), matched to the best themes, and can be used
    as the hero background (src/lib/inspire.js).
  - *3D (Three.js, no keys)*: 7 seeded scenes, your own .glb model, or a Spline / Sketchfab embed.
  - *Design brief* in plain English, *Remix*, fine style controls, generative signature mark,
    custom CSS, uniqueness score, undo, save/load design.
  - *Export*: one self-contained index.html, free to host on GitHub Pages / Netlify / Vercel.
- **Live GitHub Sync** — public API (no token), import repos as projects, refresh stars and
  descriptions, optional auto-sync; the exported site also updates star counts live.

## Next

Résumé & CV builder, résumé tailoring, ATS checker, cover letters, dev profile card, portfolio roast.
