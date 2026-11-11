# Shijay Jayan — Performance Engineering Portfolio

An interactive portfolio for a Performance Test Engineer, designed like an
engineering control room and built to be fast: the site measures its own Core
Web Vitals live in the footer.

## Sections
1. **Hero:** a miniature load test (users → traffic → application → metrics) on one canvas.
2. **Approach:** interactive latency distribution (average vs p90/p95/p99).
3. **Process:** the eight-stage testing journey; scroll-driven on desktop, swipeable on mobile.
4. **Systems:** clickable architecture (users, load generator, web, app, database, monitoring).
5. **Toolchain:** tools filtered by lifecycle phase, with how each is used.
6. **Case studies:** challenge → investigation → bottleneck → improvement → outcome.
7. **Live lab:** a queueing-model simulator (VU slider, bottleneck injection, optimisation).
8. **Career:** experience timeline, education and certifications.
9. **Contact:** email, LinkedIn, GitHub and CV download.

## Project layout
- `index.html`: page markup and content (career details live here)
- `src/js/content.js`: text for the journey, architecture, toolchain and case studies
- `src/js/`: `main.js` (entry), `sections.js`, `hero.js`, `lab.js` (queueing model), `vitals.js`, `motion.js` (GSAP, lazy-loaded)
- `src/css/main.css`: design system and layout
- `public/`: files copied as-is (CV, fonts, icons, og-image, robots.txt, sitemap.xml, manifest)
- `404.html`: custom not-found page

## Develop
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
```

## Deploy (GitHub Pages)
`.github/workflows/deploy.yml` builds the site and publishes `dist/` on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Performance notes
- Critical path: HTML + one CSS file + one small JS module + two preloaded, self-hosted fonts.
- GSAP/ScrollTrigger load only on wide screens with motion enabled, after the page is idle.
- Canvas loops run only while visible and the tab is active; nothing animates with `prefers-reduced-motion`.
- Off-screen sections use `content-visibility: auto` with measured size estimates. If you change a
  section's content substantially, update its `--est` value in `main.css`.

## Updating content
- Replace `public/Shijay_KJ_Resume.pdf` to update the CV (keep the name).
- After changing content, update `<lastmod>` in `public/sitemap.xml`.
