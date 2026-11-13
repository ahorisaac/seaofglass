# Sea of Glass · Shidoon

Immersive cyber-security & penetration-testing education. Plain HTML + CSS + JS + three.js. No build step.

## Run it

ES modules require a server (any static server works):

    npx serve .
    # or
    python -m http.server 8080

Open http://localhost:8080. Deploy by uploading the folder to Netlify, Vercel, GitHub Pages, or any host.

## Structure

- One page = one HTML + one CSS + one JS file. Shared design system lives in `assets/css/base.css`,
  shared behaviour in `assets/js/core/`.
- All curriculum content lives in `assets/data/curriculum.js`. The paths page renders from it.
- 3D scenes are self-contained modules in `assets/js/home/`, built on `core/three-utils.js`.

## Add a new concept page (the pattern)

1. Duplicate `pages/concepts/cia-triad.html` → `pages/concepts/<slug>.html`.
2. Duplicate `assets/css/lesson.css` / `assets/js/lesson.js` if the lesson needs custom behaviour,
   or reuse them as-is (the CLI and quiz engine are data-driven).
3. In `assets/data/curriculum.js`, find the lesson and add `href: "concepts/<slug>.html"` and
   `slug: "<slug>"`. It instantly becomes a live, progress-tracked link on the paths page.
4. Add the URL to `sitemap.xml`.

Progress is stored in `localStorage` under `sog:progress` → `{ slug: { lab: true, quiz: 100 } }`.

## Temporary brand assets (replace later)

- Logo: `assets/img/shidoon-mark.svg` + the Orbitron wordmark (`--font-disp` in base.css).
- Creator photo: `assets/img/ahor-isaac.svg` → swap for a real photo (same filename or update HTML).
- Coffee link: https://www.buymeacoffee.com/ahorisaac — update in `index.html` + footers.
- Domain: `https://seaofglass.shidoon.com` is a placeholder in canonical/OG URLs, robots.txt, sitemap.xml.
- OG image: replace `assets/img/og-cover.svg` with a 1200×630 PNG for full social-crawler support.

## Notes

- three.js r160 is pinned via import map (jsDelivr CDN).
- Every attack shown is a **simulation for education**. Content is permission-first and ethics-first.
- Home page stat counters (23 modules · 137 lessons · 55 labs) are kept in sync with curriculum.js.
