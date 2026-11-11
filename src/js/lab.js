import { $, $$, visibleLoop, fitCanvas, motionOK, clamp } from './utils.js';

/* ------------------------------------------------------------
   Queueing model for the live lab.
   Closed workload: N virtual users, think time Z. Each tier k has
   c_k servers with mean service time S_k. For a throughput X:
     U_k = X·S_k / c_k                 (utilisation law)
     R_k ≈ S_k / (1 − U_k^c_k)         (queueing delay grows near saturation)
     R   = Σ R_k
   and the interactive response-time law X = N / (R + Z) is solved
   for X by bisection. Simple, but it reproduces the real shape:
   linear scaling, a knee, then flat throughput and rising latency.
   ------------------------------------------------------------ */
const Z = 1.0; // seconds of think time
const BASE = {
  web: { c: 8, s: 0.004 },
  app: { c: 16, s: 0.028 },
  db: { c: 8, s: 0.012 },
};
const BOTTLENECK = { db: { c: 5, s: 0.032 } }; // slow query + undersized pool
const OPTIMISED = { app: { c: 24, s: 0.022 }, db: { c: 12, s: 0.009 } }; // index, pool sizing, caching

export function solve(n, tiers) {
  const keys = Object.keys(tiers);
  const xmax = Math.min(...keys.map((k) => tiers[k].c / tiers[k].s)) * 0.9995;
  const resp = (x) => keys.reduce((sum, k) => {
    const { c, s } = tiers[k];
    const u = Math.min(0.9995, (x * s) / c);
    return sum + s / (1 - Math.pow(u, c));
  }, 0);
  let lo = 0, hi = xmax;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (mid * (resp(mid) + Z) < n) lo = mid; else hi = mid;
  }
  let x = lo;
  // Beyond saturation the excess users simply queue: R grows linearly with N
  let r = n / x - Z;
  const util = Object.fromEntries(keys.map((k) => [k, Math.min(1, (x * tiers[k].s) / tiers[k].c)]));
  const peak = Math.max(...Object.values(util));
  // Requests queued past a 3 s timeout fail; a small error rate appears near saturation
  const err = peak > 0.92 ? clamp(((peak - 0.92) / 0.08) ** 2 * 2 + Math.max(0, (r - 3) * 4), 0, 35) : 0;
  return { x: x * (1 - err / 100), r, p95: r * 2.4 + 0.012, err, util, xmax };
}

export function initLab() {
  const root = $('[data-lab]');
  if (!root) return;
  const range = $('#vu-range');
  const outVu = $('#vu-out');
  const btnB = $('[data-lab="bottleneck"]', root);
  const btnO = $('[data-lab="optimise"]', root);
  const btnR = $('[data-lab="reset"]', root);
  const insight = $('[data-lab="insight"]', root);
  const kpi = Object.fromEntries($$('[data-kpi]', root).map((el) => [el.dataset.kpi, el]));
  const tiers = Object.fromEntries($$('[data-tier]', root).map((el) => [el.dataset.tier, el]));
  const rtCanvas = $('[data-chart="rt"]', root);
  const xCanvas = $('[data-chart="x"]', root);

  const state = { n: Number(range.value), bottleneck: false, optimised: false };
  const SAMPLES = 90;
  const hist = { p95: [], avg: [], x: [] };
  let shown = null; // smoothed values (metrics move like real telemetry, not instantly)
  let target = null;
  let lastInsight = '';

  const config = () => {
    const t = structuredClone(BASE);
    if (state.bottleneck) Object.assign(t.db, BOTTLENECK.db);
    if (state.optimised) { Object.assign(t.app, OPTIMISED.app); Object.assign(t.db, OPTIMISED.db); }
    return t;
  };

  const recompute = () => {
    target = solve(state.n, config());
    if (!shown) shown = { ...target, util: { ...target.util } };
    describe();
  };

  const level = (v, warn, crit) => (v >= crit ? 'is-crit' : v >= warn ? 'is-warn' : '');
  const setLevel = (el, cls) => { el.classList.remove('is-warn', 'is-crit'); if (cls) el.classList.add(cls); };

  const describe = () => {
    const m = target;
    const [hotKey, hotU] = Object.entries(m.util).sort((a, b) => b[1] - a[1])[0];
    const name = { web: 'web tier', app: 'application tier', db: 'database' }[hotKey];
    const pct = Math.round(hotU * 100);
    let text, cls = '';
    if (state.optimised && state.bottleneck) {
      text = `Optimisation applied: the database pool is resized and the slow query is indexed. The ${name} now peaks at ${pct}% and p95 is ${fmtMs(m.p95)}.`;
    } else if (hotU > 0.95) {
      text = `Bottleneck: the ${name} is saturated at ${pct}%. Throughput has flattened at ${Math.round(m.x)} req/s, so extra users only add queueing time. p95 is ${fmtMs(m.p95)}${m.err > 0.1 ? ` and ${m.err.toFixed(1)}% of requests are timing out` : ''}.`;
      cls = 'is-crit';
    } else if (hotU > 0.8) {
      text = `Approaching the knee: the ${name} is at ${pct}%. Latency starts to climb faster than load from here.`;
      cls = 'is-warn';
    } else {
      text = `Healthy: throughput scales with load and every tier has headroom (busiest is the ${name} at ${pct}%).`;
    }
    if (state.bottleneck && !state.optimised && hotKey === 'db' && hotU > 0.8) text += ' Try “Apply optimisation”.';
    insight.classList.remove('is-warn', 'is-crit');
    if (cls) insight.classList.add(cls);
    if (text !== lastInsight) { insight.textContent = text; lastInsight = text; }
  };

  const fmtMs = (s) => (s >= 10 ? `${(s).toFixed(0)} s` : s >= 1 ? `${s.toFixed(1)} s` : `${Math.round(s * 1000)} ms`);

  const paintKPIs = () => {
    const m = shown;
    kpi.x.textContent = Math.round(m.x).toLocaleString('en');
    kpi.r.textContent = Math.round(m.r * 1000).toLocaleString('en');
    kpi.p95.textContent = Math.round(m.p95 * 1000).toLocaleString('en');
    kpi.err.textContent = m.err.toFixed(m.err < 10 ? 1 : 0);
    setLevel(kpi.p95.parentElement, level(m.p95, 0.8, 2));
    setLevel(kpi.r.parentElement, level(m.r, 0.5, 1.5));
    setLevel(kpi.err.parentElement, level(m.err, 0.5, 2));
    for (const [k, el] of Object.entries(tiers)) {
      const u = m.util[k];
      el.style.setProperty('--u', u.toFixed(3));
      el.querySelector('.tier-v').textContent = `${Math.round(u * 100)}%`;
      setLevel(el, level(u, 0.8, 0.95));
    }
  };

  const chart = (canvas, series, { max, sla, colors, fmt }) => {
    const { ctx, w, h } = fitCanvas(canvas);
    const pad = { l: 40, r: 8, t: 8, b: 16 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    ctx.clearRect(0, 0, w, h);
    ctx.font = '10px ui-monospace, Consolas, monospace';
    ctx.fillStyle = 'rgba(154,163,177,.85)';
    ctx.strokeStyle = 'rgba(214,226,240,.07)';
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + ih - (i / 4) * ih;
      ctx.beginPath(); ctx.moveTo(pad.l, y + 0.5); ctx.lineTo(w - pad.r, y + 0.5); ctx.stroke();
      ctx.fillText(fmt((max * i) / 4), pad.l - 6, y + 3);
    }
    if (sla != null && sla < max) {
      const y = pad.t + ih - (sla / max) * ih;
      ctx.strokeStyle = 'rgba(255,111,111,.8)';
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.setLineDash([]);
    }
    series.forEach((data, si) => {
      if (data.length < 2) return;
      ctx.strokeStyle = colors[si];
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = pad.l + (iw * (i + SAMPLES - data.length)) / (SAMPLES - 1);
        const y = pad.t + ih - (Math.min(v, max) / max) * ih;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
    });
  };

  const niceMax = (v, floor) => {
    const m = Math.max(floor, v * 1.15);
    const p = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / p) * p;
  };

  const paintCharts = () => {
    const rtMax = niceMax(Math.max(...hist.p95, 0.8), 1);
    chart(rtCanvas, [hist.avg, hist.p95], {
      max: rtMax, sla: 0.8, colors: ['#6fb3f2', '#f2b84b'],
      fmt: (v) => (rtMax >= 4 ? `${+v.toFixed(1)}s` : `${Math.round(v * 1000)}`),
    });
    const xMax = niceMax(Math.max(...hist.x, 100), 100);
    chart(xCanvas, [hist.x], { max: xMax, colors: ['#9fdc6c'], fmt: (v) => Math.round(v) });
  };

  let sampleAcc = 0;
  const step = (dt) => {
    const k = 1 - Math.exp(-dt / 450);
    const noise = () => 1 + (Math.random() - 0.5) * 0.05;
    shown.x += (target.x - shown.x) * k;
    shown.r += (target.r - shown.r) * k;
    shown.p95 += (target.p95 - shown.p95) * k;
    shown.err += (target.err - shown.err) * k;
    for (const key in shown.util) shown.util[key] += (target.util[key] - shown.util[key]) * k;
    sampleAcc += dt;
    if (sampleAcc >= 200) {
      sampleAcc = 0;
      hist.p95.push(shown.p95 * noise());
      hist.avg.push(shown.r * noise());
      hist.x.push(shown.x * noise());
      for (const key in hist) if (hist[key].length > SAMPLES) hist[key].shift();
      paintKPIs();
      paintCharts();
    }
  };

  const jumpTo = () => {
    // reduced motion / first paint: show the settled state with a flat history
    shown = { ...target, util: { ...target.util } };
    for (const key in hist) hist[key] = new Array(SAMPLES).fill(key === 'x' ? target.x : key === 'p95' ? target.p95 : target.r);
    paintKPIs();
    paintCharts();
  };

  const syncRange = () => {
    const p = ((state.n - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty('--fill', `${p}%`);
    outVu.textContent = state.n.toLocaleString('en');
    range.setAttribute('aria-valuetext', `${state.n} virtual users`);
  };

  range.addEventListener('input', () => {
    state.n = Number(range.value);
    syncRange();
    recompute();
    if (!motionOK()) jumpTo();
  });
  btnB.addEventListener('click', () => {
    state.bottleneck = !state.bottleneck;
    btnB.setAttribute('aria-pressed', String(state.bottleneck));
    btnB.textContent = state.bottleneck ? 'Bottleneck active' : 'Inject DB bottleneck';
    if (state.bottleneck && state.n < 400) { state.n = 600; range.value = 600; syncRange(); }
    recompute();
    if (!motionOK()) jumpTo();
  });
  btnO.addEventListener('click', () => {
    state.optimised = !state.optimised;
    btnO.setAttribute('aria-pressed', String(state.optimised));
    btnO.textContent = state.optimised ? 'Optimisation on' : 'Apply optimisation';
    recompute();
    if (!motionOK()) jumpTo();
  });
  btnR.addEventListener('click', () => {
    Object.assign(state, { n: 200, bottleneck: false, optimised: false });
    range.value = 200;
    btnB.setAttribute('aria-pressed', 'false'); btnB.textContent = 'Inject DB bottleneck';
    btnO.setAttribute('aria-pressed', 'false'); btnO.textContent = 'Apply optimisation';
    syncRange();
    recompute();
    jumpTo();
  });

  syncRange();
  recompute();
  // Settle the numbers now, but size and draw the canvases only once the lab
  // is about to be seen, so start-up never forces layout of this section.
  shown = { ...target, util: { ...target.util } };
  for (const key in hist) hist[key] = new Array(SAMPLES).fill(key === 'x' ? target.x : key === 'p95' ? target.p95 : target.r);
  paintKPIs();
  const first = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    first.disconnect();
    paintCharts();
    new ResizeObserver(() => paintCharts()).observe($('.lab-charts', root));
    visibleLoop(root, step);
  }, { rootMargin: '200px' });
  first.observe(root);
}
