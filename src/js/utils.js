export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const motionOK = () => !reduceMotion.matches;
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Escape text before it goes into an HTML template. */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Run `tick(dt, now)` on every animation frame, but only while `el` is on
 * screen, the tab is visible and motion is allowed. Returns a controller.
 */
export function visibleLoop(el, tick, { rootMargin = '0px', onPause, onResume } = {}) {
  let raf = 0, running = false, inView = false, last = 0;
  const frame = (now) => {
    const dt = Math.min(64, now - (last || now));
    last = now;
    tick(dt, now);
    raf = requestAnimationFrame(frame);
  };
  const update = () => {
    const should = inView && !document.hidden && motionOK();
    if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); onResume?.(); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); onPause?.(); }
  };
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; update(); }, { rootMargin });
  io.observe(el);
  document.addEventListener('visibilitychange', update);
  reduceMotion.addEventListener?.('change', update);
  return { get running() { return running; }, update };
}

/** Size a canvas to its CSS box at a capped device-pixel ratio. */
export function fitCanvas(canvas, maxDpr = 2) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/** Deterministic PRNG so generated charts look identical on every visit. */
export function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
