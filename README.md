# Shijay Jayan — Personal Portfolio

A responsive, static portfolio website for a Performance Test Engineer.

## Files
- `index.html` — website content
- `style.css` — responsive styling, animations and reduced-motion support
- `script.js` — mobile menu, dynamic year, scroll reveals, active-section nav, card tilt, hero network canvas
- `profile-96.webp` / `profile-96.jpg` — optimized avatar used in the header (`profile.png` is the original, used for link previews)

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
- Add your preferred LinkedIn URL and professional email in the Contact section.
- Add a downloadable CV if desired.
- Review employer/project wording and remove anything confidential or proprietary.
