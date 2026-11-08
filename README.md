# Shijay Jayan — Personal Portfolio

A responsive, static portfolio website for a Performance Test Engineer.

## Files
- `index.html` — website content
- `style.css` — responsive styling, animations and reduced-motion support
- `script.js` — mobile menu, dynamic year, scroll reveals, active-section nav, card tilt, hero network canvas
- `profile-96.webp` / `profile-96.jpg` — optimized avatar used in the header (`profile.png` is the original)
- `Shijay_KJ_Resume.pdf` — downloadable CV (replace this file to update it; keep the same name)
- `fonts/` — self-hosted Inter and Space Grotesk (latin subset, SIL Open Font License)
- `og-image.jpg` — 1200×630 link-preview image for LinkedIn, WhatsApp, etc.
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest` — site icons
- `404.html` — custom "page not found" page (GitHub Pages serves it automatically)
- `robots.txt`, `sitemap.xml` — search-engine basics (structured data lives in `index.html`)

No build step and no dependencies — it is plain HTML, CSS and JavaScript.

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```
(Opening `index.html` directly also works; the "Copy email" button only appears over http(s).)

## Free hosting: GitHub Pages
1. Create a free account at GitHub if you do not already have one.
2. Create a new **public** repository named `shijay-portfolio` (or `<yourusername>.github.io` for a root personal site).
3. Upload `index.html`, `style.css`, `script.js`, and this README.
4. In the repository, open **Settings → Pages**.
5. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
6. GitHub will provide your public `github.io` URL.

## Before publishing
- Review employer/project wording and remove anything confidential or proprietary.
- After changing content, update `<lastmod>` in `sitemap.xml`.
