import { $ } from './utils.js';

/* Measures this page's own Core Web Vitals in the visitor's browser
   and shows them in the footer. Uses only native PerformanceObserver
   entries; no library, no beacon, nothing leaves the browser. */
export function initVitals() {
  if (!('PerformanceObserver' in window)) return;
  const el = (k) => $(`[data-vital="${k}"]`);
  const set = (k, text, rating) => {
    const node = el(k);
    if (!node) return;
    node.querySelector('b').textContent = text;
    node.classList.remove('good', 'ni', 'poor');
    if (rating) node.classList.add(rating);
  };
  const rate = (v, good, poor) => (v <= good ? 'good' : v <= poor ? 'ni' : 'poor');
  const observe = (type, cb, opts = {}) => {
    try { new PerformanceObserver((l) => cb(l.getEntries())).observe({ type, buffered: true, ...opts }); } catch { /* unsupported */ }
  };

  observe('largest-contentful-paint', (list) => {
    const v = list[list.length - 1].startTime;
    set('lcp', `${(v / 1000).toFixed(2)} s`, rate(v, 2500, 4000));
  });

  // CLS using session windows (max 5 s, gap < 1 s), as in the web-vitals definition
  let cls = 0, win = 0, first = 0, prev = 0;
  observe('layout-shift', (list) => {
    for (const e of list) {
      if (e.hadRecentInput) continue;
      if (win && e.startTime - prev < 1000 && e.startTime - first < 5000) win += e.value;
      else { win = e.value; first = e.startTime; }
      prev = e.startTime;
      cls = Math.max(cls, win);
    }
    set('cls', cls.toFixed(3), rate(cls, 0.1, 0.25));
  });
  set('cls', '0.000', 'good');

  // INP approximation: worst interaction latency seen so far
  let inp = 0;
  observe('event', (list) => {
    for (const e of list) if (e.interactionId && e.duration > inp) inp = e.duration;
    if (inp) set('inp', `${Math.round(inp)} ms`, rate(inp, 200, 500));
  }, { durationThreshold: 16 });
  set('inp', 'interact', null);

  const bytes = () => {
    const nav = performance.getEntriesByType('navigation')[0];
    const all = [nav, ...performance.getEntriesByType('resource')].filter(Boolean);
    const sum = all.reduce((a, r) => a + (r.transferSize || 0), 0);
    if (sum === 0) set('kb', 'cached', 'good');
    else set('kb', `${(sum / 1024).toFixed(0)} KB`, rate(sum, 300 * 1024, 1000 * 1024));
  };
  if (document.readyState === 'complete') setTimeout(bytes, 0);
  else window.addEventListener('load', () => setTimeout(bytes, 0), { once: true });
}
