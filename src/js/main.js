import '../css/main.css';
import { $, $$, motionOK } from './utils.js';
import { initLatency, initJourney, initArch, initTools, initCases } from './sections.js';
import { initHero } from './hero.js';
import { initLab } from './lab.js';
import { initVitals } from './vitals.js';

initVitals();

/* ---------- Footer year ---------- */
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

/* ---------- Mobile menu ---------- */
const menuBtn = $('.menu-btn');
const links = $('.nav-links');
const setMenu = (open) => {
  links.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuBtn.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));
links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && links.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
});
document.addEventListener('click', (e) => {
  if (links.classList.contains('is-open') && !e.target.closest('.nav')) setMenu(false);
});

/* ---------- Scroll UI: one rAF-throttled, passive handler ---------- */
const topbar = $('.topbar');
const meter = $('.scroll-meter');
const toTop = $('.to-top');
let ticking = false;
const onScroll = () => {
  ticking = false;
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  topbar.classList.toggle('is-scrolled', y > 8);
  meter.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : '0');
  toTop.classList.toggle('is-shown', y > window.innerHeight);
};
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
requestAnimationFrame(onScroll); // reading scrollHeight now would force an early layout

/* ---------- In-page navigation ----------
   Off-screen sections use content-visibility, so their heights are
   estimates until rendered. Scroll to the target, then re-aim once
   the scroll settles and the real heights are known. */
const navOffset = () => topbar.offsetHeight + 16;
// "settled" = no scroll events for 160 ms (works with any scroll duration)
const settle = (fn) => {
  let timer = 0;
  const done = () => { window.removeEventListener('scroll', bump); fn(); };
  const bump = () => { clearTimeout(timer); timer = setTimeout(done, 160); };
  window.addEventListener('scroll', bump, { passive: true });
  bump();
};
const goTo = (target, smooth = motionOK()) => {
  target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  let tries = 0;
  const correct = () => {
    const off = target.getBoundingClientRect().top - navOffset();
    if (Math.abs(off) > 6 && tries++ < 3) {
      window.scrollBy({ top: off, behavior: 'auto' });
      requestAnimationFrame(() => requestAnimationFrame(correct));
    }
  };
  settle(correct);
  // move keyboard focus with the view, without scrolling again
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const hash = a.getAttribute('href');
  const target = hash.length > 1 && document.getElementById(hash.slice(1));
  if (!target) return;
  e.preventDefault();
  if (location.hash !== hash) history.pushState(null, '', hash);
  goTo(target);
});
if (location.hash.length > 1) {
  const t = document.getElementById(location.hash.slice(1));
  if (t) window.addEventListener('load', () => goTo(t, false), { once: true });
}

/* ---------- Active section in the nav ---------- */
const navAnchors = $$('.nav-links a[href^="#"]');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = `#${entry.target.id}`;
    navAnchors.forEach((a) => {
      const on = a.getAttribute('href') === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => spy.observe(s));

/* ---------- Interactive sections (content renders immediately) ---------- */
initLatency();
const journey = initJourney();
initArch();
initTools();
initCases();
initLab();

/* ---------- Reveal on scroll ---------- */
const revealIO = new IntersectionObserver((entries, obs) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    obs.unobserve(e.target);
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
$$('[data-reveal]').forEach((el) => revealIO.observe(el));

/* ---------- Copy email ---------- */
const copyBtn = $('.copy-email');
if (copyBtn && navigator.clipboard && window.isSecureContext) {
  copyBtn.hidden = false;
  const label = $('[data-copy-label]', copyBtn);
  const status = $('#copy-status');
  let reset = 0;
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copy);
      label.textContent = 'Copied ✓';
      copyBtn.classList.add('is-copied');
      status.textContent = 'Email address copied to clipboard';
      clearTimeout(reset);
      reset = setTimeout(() => { label.textContent = 'Copy email address'; copyBtn.classList.remove('is-copied'); status.textContent = ''; }, 2200);
    } catch { /* clipboard denied: the mailto link still works */ }
  });
}

/* ---------- Deferred work: after first paint / idle ---------- */
const idle = (fn, timeout = 1200) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 200));

// Hero canvas starts after the LCP text has painted
idle(initHero, 600);

// GSAP + ScrollTrigger only where they add value (wide screens, motion on)
const wide = window.matchMedia('(min-width: 941px)');
if (wide.matches && motionOK()) {
  const load = () => import('./motion.js').then((m) => m.initMotion({ journey }));
  if (document.readyState === 'complete') idle(load);
  else window.addEventListener('load', () => idle(load), { once: true });
}
