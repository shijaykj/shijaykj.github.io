import { $, $$, visibleLoop, fitCanvas, motionOK, clamp } from './utils.js';

/* Hero: a miniature load test. Virtual users ramp up, requests
   travel Users → Traffic → Application → Metrics, and the readouts
   follow a simple, plausible model. One canvas, pooled particles,
   paused whenever the hero is off screen. */
export function initHero() {
  const flow = $('[data-flow]');
  if (!flow) return;
  const canvas = $('.flow-canvas', flow);
  const nodes = $$('.flow-node', flow);
  const out = Object.fromEntries($$('[data-hero]').map((el) => [el.dataset.hero, el]));
  const appNode = nodes.find((n) => n.dataset.node === 'app');

  const PEAK = 1000, RAMP = 9000, HOLD = 7000, DOWN = 2500, CYCLE = RAMP + HOLD + DOWN;
  const small = window.matchMedia('(max-width: 680px)');
  let total = 0, w = 0, h = 0, ctx = null;
  const pool = [];
  let t = 0, spawnAcc = 0, uiAcc = 0;
  const hist = [];

  // Requests travel along a traffic lane under the node cards,
  // with a tap line rising to each stage it passes.
  let lane = { x0: 0, x1: 0, y: 0 }, taps = [];
  const layout = () => {
    ({ ctx, w, h } = fitCanvas(canvas));
    const f = flow.getBoundingClientRect();
    const rects = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return { cx: r.left - f.left + r.width / 2, bottom: r.bottom - f.top, top: r.top - f.top };
    });
    const bottom = Math.max(...rects.map((r) => r.bottom));
    lane = { x0: 14, x1: w - 14, y: bottom + (h - bottom) / 2 };
    // only cards on the last row connect straight down to the lane
    taps = rects.filter((r) => r.bottom > bottom - 2).map((r) => ({ x: r.cx, y0: r.bottom }));
    total = lane.x1 - lane.x0;
  };

  const at = (d) => ({ x: lane.x0 + d, y: lane.y });

  const model = (time) => {
    const c = time % CYCLE;
    let vus, phase;
    if (c < RAMP) { vus = PEAK * (c / RAMP); phase = 'ramp-up'; }
    else if (c < RAMP + HOLD) { vus = PEAK; phase = 'steady state'; }
    else { vus = PEAK * (1 - (c - RAMP - HOLD) / DOWN); phase = 'ramp-down'; }
    const u = vus / PEAK;
    const wobble = Math.sin(time / 700) * 6 + Math.sin(time / 230) * 3;
    return {
      vus, phase, u,
      rps: vus * 0.084,
      cpu: clamp(8 + u * 64 + wobble * 0.4, 0, 99),
      p95: 160 + u * u * 260 + wobble,
    };
  };

  const render = (m, animate) => {
    ctx.clearRect(0, 0, w, h);
    // lane + taps
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(214,226,240,.12)';
    ctx.beginPath();
    ctx.moveTo(lane.x0, lane.y - 7); ctx.lineTo(lane.x1, lane.y - 7);
    ctx.moveTo(lane.x0, lane.y + 7); ctx.lineTo(lane.x1, lane.y + 7);
    ctx.stroke();
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    taps.forEach((t) => { ctx.moveTo(t.x, t.y0); ctx.lineTo(t.x, lane.y - 7); });
    ctx.stroke();
    ctx.setLineDash([]);
    if (!animate) return;
    // requests: short capsules whose colour shows the stage they're in
    const appX = taps[2]?.x ?? lane.x0 + total * 0.62;
    const metX = taps[3]?.x ?? lane.x0 + total * 0.85;
    ctx.lineCap = 'round';
    for (const p of pool) {
      if (!p.on) continue;
      const q = at(p.d);
      const y = q.y + p.off;
      ctx.strokeStyle = q.x > metX ? 'rgba(111,179,242,.95)'
        : q.x > appX - 30 && p.hot ? 'rgba(242,184,75,.95)'
        : 'rgba(159,220,108,.9)';
      ctx.lineWidth = p.r;
      ctx.beginPath();
      ctx.moveTo(q.x - 6, y); ctx.lineTo(q.x, y);
      ctx.stroke();
    }
  };

  const spark = () => {
    if (hist.length < 2) return;
    const max = 480;
    const d = hist.map((v, i) => `${i ? 'L' : 'M'}${((i / (hist.length - 1)) * 300).toFixed(1)} ${(46 - (v / max) * 42).toFixed(1)}`).join(' ');
    out.spark.setAttribute('d', d);
  };

  const updateUI = (m) => {
    out.vus.textContent = Math.round(m.vus).toLocaleString('en');
    out.rps.textContent = m.rps.toFixed(0);
    out.cpu.textContent = `${Math.round(m.cpu)}%`;
    out.p95.textContent = Math.round(m.p95);
    out.phase.textContent = m.phase;
    const hot = m.cpu > 62;
    appNode.classList.toggle('is-hot', hot);
    const ok = m.p95 < 400;
    out.sla.textContent = ok ? 'SLA ✓  p95 < 400 ms' : 'SLA ⚠  p95 ≥ 400 ms';
    out.sla.classList.toggle('is-warn', !ok);
    hist.push(m.p95);
    if (hist.length > 60) hist.shift();
    spark();
  };

  const tick = (dt) => {
    t += dt;
    const m = model(t);
    const speed = (small.matches ? 0.11 : 0.15) * (1 - m.u * 0.35); // requests slow down as load rises
    const cap = small.matches ? 40 : 90;
    spawnAcc += dt * (0.004 + m.u * (small.matches ? 0.018 : 0.03));
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      let p = pool.find((q) => !q.on);
      if (!p && pool.length < cap) { p = {}; pool.push(p); }
      if (p) Object.assign(p, { on: true, d: 0, r: 1.6 + Math.random() * 1, off: (Math.random() - 0.5) * 8, v: speed * (0.8 + Math.random() * 0.4), hot: m.u > 0.75 && Math.random() < 0.35 });
    }
    for (const p of pool) {
      if (!p.on) continue;
      p.d += p.v * dt;
      if (p.d >= total) p.on = false;
    }
    render(m, true);
    uiAcc += dt;
    if (uiAcc > 220) { uiAcc = 0; updateUI(m); }
  };

  layout();
  new ResizeObserver(() => { layout(); if (!motionOK()) staticFrame(); }).observe(flow);

  const staticFrame = () => {
    const m = model(RAMP + 1000); // steady state
    render(m, false);
    hist.length = 0;
    for (let i = 0; i < 60; i++) hist.push(model(RAMP * (i / 60)).p95);
    updateUI(m);
  };

  if (!motionOK()) staticFrame();
  visibleLoop(flow, tick, { onPause: () => { if (!motionOK()) staticFrame(); } });
}
