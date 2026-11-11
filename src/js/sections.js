import { $, $$, esc, mulberry32 } from './utils.js';
import { JOURNEY, ARCH, PHASES, TOOLS, CASES } from './content.js';

/* ---------------- Principle 01: latency distribution ---------------- */
export function initLatency() {
  const root = $('[data-latency-chart]');
  if (!root) return;
  const svg = $('svg', root);
  const W = 560, H = 240, PAD = { l: 8, r: 8, t: 30, b: 28 };
  const MAX = 2000, BINS = 50;

  // Log-normal response times plus a slow tail (cache misses, lock waits)
  const rnd = mulberry32(42);
  const normal = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const samples = Array.from({ length: 2000 }, () => {
    const base = Math.exp(5.55 + 0.38 * normal());
    return rnd() < 0.07 ? base * (2.6 + rnd() * 2.2) : base;
  }).sort((a, b) => a - b);
  const pct = (p) => samples[Math.min(samples.length - 1, Math.floor(p * samples.length))];
  const stats = {
    avg: samples.reduce((a, b) => a + b, 0) / samples.length,
    p90: pct(0.9), p95: pct(0.95), p99: pct(0.99),
  };
  const notes = {
    avg: '— looks healthy, but it hides the slow tail.',
    p90: '— one request in ten is slower than this.',
    p95: `— one user in twenty waits ${(stats.p95 / stats.avg).toFixed(1)}× the average.`,
    p99: '— the tail where timeouts and complaints begin.',
  };

  const bins = new Array(BINS).fill(0);
  samples.forEach((v) => { bins[Math.min(BINS - 1, Math.floor((v / MAX) * BINS))]++; });
  const maxBin = Math.max(...bins);
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b, bw = iw / BINS;
  const x = (v) => PAD.l + (Math.min(v, MAX) / MAX) * iw;

  let out = `<line class="lc-axis" x1="${PAD.l}" y1="${H - PAD.b}" x2="${W - PAD.r}" y2="${H - PAD.b}"/>`;
  bins.forEach((c, i) => {
    const h = Math.max(1, (c / maxBin) * ih);
    out += `<rect class="lc-bar" data-from="${(i / BINS) * MAX}" x="${(PAD.l + i * bw + 1).toFixed(1)}" y="${(H - PAD.b - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5"/>`;
  });
  [0, 500, 1000, 1500, 2000].forEach((t) => {
    out += `<text class="lc-tick" x="${x(t)}" y="${H - 8}" text-anchor="${t === 0 ? 'start' : t === MAX ? 'end' : 'middle'}">${t === MAX ? '2 s' : t + (t ? '' : ' ms')}</text>`;
  });
  out += `<g class="lc-marker"><line x1="0" y1="${PAD.t - 8}" x2="0" y2="${H - PAD.b}"/><text x="6" y="${PAD.t - 12}"></text></g>`;
  svg.innerHTML = out;

  const marker = $('.lc-marker', svg);
  const label = $('text', marker);
  const bars = $$('.lc-bar', svg);
  const readLabel = $('[data-latency="label"]');
  const readValue = $('[data-latency="value"]');
  const readNote = $('[data-latency="note"]');
  const buttons = $$('[data-stat]');

  const select = (key) => {
    const v = stats[key];
    marker.style.transform = `translateX(${x(v).toFixed(1)}px)`;
    label.textContent = `${key === 'avg' ? 'avg' : key} ${Math.round(v)} ms`;
    label.setAttribute('text-anchor', x(v) > W * 0.75 ? 'end' : 'start');
    label.setAttribute('x', x(v) > W * 0.75 ? '-6' : '6');
    bars.forEach((b) => b.classList.toggle('is-tail', key !== 'avg' && Number(b.dataset.from) >= v - MAX / BINS));
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stat === key)));
    readLabel.textContent = key === 'avg' ? 'Average' : key;
    readValue.textContent = `${Math.round(v)} ms`;
    readNote.textContent = notes[key];
  };
  buttons.forEach((b) => b.addEventListener('click', () => select(b.dataset.stat)));
  select('p95');
}

/* ---------------- Journey ---------------- */
const VIZ = {
  sla: '<path d="M0 40 C40 38 70 30 100 32 S170 20 210 26 S280 14 320 18"/><line class="warn" x1="0" y1="14" x2="320" y2="14" stroke-dasharray="4 4"/>',
  mix: '<rect class="fill" x="0" y="8" width="130" height="40" rx="4"/><rect class="fill" x="136" y="8" width="80" height="40" rx="4"/><rect class="fill" x="222" y="8" width="56" height="40" rx="4"/><rect class="fill" x="284" y="8" width="36" height="40" rx="4"/>',
  scenarios: '<path d="M0 46 L60 30 L320 30"/><path class="ok" d="M0 46 L40 18 L80 18 L120 46"/><path class="warn" d="M140 46 L200 6 L240 6 L250 46"/>',
  ramp: '<path class="fill" d="M0 50 L90 12 L250 12 L300 50 Z"/><path d="M0 50 L90 12 L250 12 L300 50"/>',
  monitor: '<path d="M0 34 C20 30 30 40 50 34 S80 22 100 30 S140 38 160 28 S200 18 220 26 S270 34 320 22"/><path class="ok" d="M0 44 L320 40"/>',
  knee: '<path d="M0 46 C80 44 160 40 210 34 C240 30 260 18 280 4"/><circle class="warn" cx="222" cy="31" r="5"/>',
  improve: '<path class="warn" d="M0 40 C60 36 120 24 160 8"/><path class="ok" d="M160 8 C200 20 260 34 320 38"/>',
  report: '<rect class="fill" x="10" y="20" width="40" height="30" rx="3"/><rect x="56" y="14" width="40" height="36" rx="3"/><rect class="fill" x="130" y="26" width="40" height="24" rx="3"/><rect x="176" y="22" width="40" height="28" rx="3"/><path class="ok" d="M250 30 L266 44 L300 10"/>',
};

export function initJourney() {
  const root = $('[data-journey]');
  if (!root) return null;
  const rail = $('.journey-rail', root);
  const stage = $('.journey-stage', root);
  rail.insertAdjacentHTML('beforeend', JOURNEY.map((s, i) => `
    <button type="button" class="j-tab" role="tab" id="jt-${s.id}" aria-controls="jp" aria-selected="false" tabindex="-1" data-i="${i}">
      <span class="j-n">${String(i + 1).padStart(2, '0')}</span>${esc(s.title)}
    </button>`).join(''));
  stage.id = 'jp';
  stage.setAttribute('role', 'tabpanel');
  const tabs = $$('.j-tab', rail);
  let current = -1;
  const listeners = new Set();

  const show = (i, { focus = false, source = 'user' } = {}) => {
    i = Math.max(0, Math.min(JOURNEY.length - 1, i));
    if (i === current) return;
    current = i;
    const s = JOURNEY[i];
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
      t.classList.toggle('is-done', k < i);
    });
    root.style.setProperty('--jp', ((i + 1) / JOURNEY.length).toFixed(3));
    stage.setAttribute('aria-labelledby', `jt-${s.id}`);
    stage.innerHTML = `
      <div class="j-panel">
        <p class="j-step">Stage ${i + 1} of ${JOURNEY.length}</p>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.lead)}</p>
        <svg class="j-viz" viewBox="0 0 320 56" preserveAspectRatio="none" aria-hidden="true">${VIZ[s.viz]}</svg>
        <div class="j-cols">
          <div class="j-box"><h4>What I do</h4><ul>${s.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
          <div class="j-box"><h4>Deliverables</h4><ul>${s.outputs.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
        </div>
        <div class="j-nav">
          <button type="button" class="btn btn-quiet" data-j="prev" ${i === 0 ? 'disabled' : ''}>← Previous</button>
          <button type="button" class="btn btn-quiet" data-j="next" ${i === JOURNEY.length - 1 ? 'disabled' : ''}>Next stage →</button>
        </div>
      </div>`;
    if (focus) tabs[i].focus();
    // keep the active chip visible in the horizontal mobile rail
    if (source !== 'init' && getComputedStyle(rail).flexDirection === 'row') {
      const t = tabs[i];
      rail.scrollTo({ left: t.offsetLeft - rail.clientWidth / 2 + t.clientWidth / 2, behavior: 'smooth' });
    }
    listeners.forEach((fn) => fn(i, source));
  };

  rail.addEventListener('click', (e) => {
    const t = e.target.closest('.j-tab');
    if (t) show(Number(t.dataset.i), { source: 'tab' });
  });
  rail.addEventListener('keydown', (e) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (e.key in keys) { e.preventDefault(); show(current + keys[e.key], { focus: true, source: 'tab' }); }
    if (e.key === 'Home') { e.preventDefault(); show(0, { focus: true, source: 'tab' }); }
    if (e.key === 'End') { e.preventDefault(); show(JOURNEY.length - 1, { focus: true, source: 'tab' }); }
  });
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('[data-j]');
    if (b) show(current + (b.dataset.j === 'next' ? 1 : -1), { source: 'tab' });
  });

  show(0, { source: 'init' });
  return { show, get current() { return current; }, count: JOURNEY.length, onChange: (fn) => listeners.add(fn) };
}

/* ---------------- Architecture ---------------- */
export function initArch() {
  const root = $('[data-arch]');
  if (!root) return;
  const map = $('.arch-map', root);
  const svg = $('.arch-links', root);
  const detail = $('.arch-detail', root);
  const nodes = $$('[data-arch-node]', root);
  const main = ['users', 'loadgen', 'web', 'app', 'db'];
  const byId = Object.fromEntries(nodes.map((n) => [n.dataset.archNode, n]));

  const draw = () => {
    const m = map.getBoundingClientRect();
    const c = (id) => {
      const r = byId[id].getBoundingClientRect();
      return { x: r.left - m.left + r.width / 2, y: r.top - m.top + r.height / 2, r };
    };
    const vertical = getComputedStyle($('.arch-main', root)).gridTemplateColumns.split(' ').length === 1;
    let d = '';
    for (let i = 0; i < main.length - 1; i++) {
      const a = c(main[i]), b = c(main[i + 1]);
      d += `<path class="flowing" data-link="${main[i]}-${main[i + 1]}" d="M${a.x} ${a.y} L${b.x} ${b.y}"/>`;
    }
    const mon = c('monitoring');
    main.slice(2).forEach((id) => {
      const a = c(id);
      if (vertical) {
        const x = m.width - 14;
        d += `<path class="mon" data-link="monitoring-${id}" d="M${a.r.right - m.left} ${a.y} H${x} V${mon.y}"/>`;
      } else {
        d += `<path class="mon" data-link="monitoring-${id}" d="M${a.x} ${a.r.bottom - m.top} V${(a.r.bottom - m.top + mon.r.top - m.top) / 2} H${mon.x} V${mon.r.top - m.top}"/>`;
      }
    });
    svg.setAttribute('viewBox', `0 0 ${m.width} ${m.height}`);
    svg.innerHTML = d;
    light(current);
  };

  let current = 'app';
  const light = (id) => {
    $$('path', svg).forEach((p) => p.classList.toggle('is-lit', p.dataset.link.split('-').includes(id)));
  };
  const select = (id) => {
    current = id;
    const a = ARCH[id];
    nodes.forEach((n) => n.setAttribute('aria-pressed', String(n.dataset.archNode === id)));
    light(id);
    detail.innerHTML = `
      <div class="ad">
        <p class="ad-kicker">${esc(a.kicker)}</p>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.body)}</p>
        <div class="ad-group"><h4>What I measure</h4><ul class="ad-metrics">${a.metrics.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="ad-group"><h4>Bottlenecks I look for</h4><ul class="ad-risks">${a.risks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="ad-group"><h4>Tools</h4><p class="mono">${esc(a.tools)}</p></div>
      </div>`;
  };
  nodes.forEach((n) => n.addEventListener('click', () => select(n.dataset.archNode)));
  select(current);

  new ResizeObserver(() => requestAnimationFrame(draw)).observe(map);
  new IntersectionObserver(([e]) => root.classList.toggle('in-view', e.isIntersecting)).observe(root);
}

/* ---------------- Toolchain ---------------- */
export function initTools() {
  const root = $('[data-tools]');
  if (!root) return;
  const bar = $('.phase-bar', root);
  const grid = $('.tool-grid', root);
  const detail = $('.tool-detail', root);

  bar.innerHTML = PHASES.map((p) => `<button type="button" data-phase="${p.id}" aria-pressed="${p.id === 'all'}">${esc(p.label)}</button>`).join('');
  grid.innerHTML = TOOLS.map((t, i) => `
    <li><button type="button" class="tool" data-tool="${i}" aria-pressed="false">
      <span class="tool-cat">${esc(t.cat)}</span>
      <span class="tool-name">${esc(t.name)}</span>
    </button></li>`).join('');
  const toolEls = $$('.tool', grid);
  const label = (id) => PHASES.find((p) => p.id === id).label;
  let phase = 'all';

  const show = (i) => {
    const t = TOOLS[i];
    toolEls.forEach((el, k) => el.setAttribute('aria-pressed', String(k === i)));
    detail.innerHTML = `
      <div class="td">
        <p class="td-cat">${esc(t.cat)}</p>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.how)}</p>
        <ul class="td-phases" aria-label="Lifecycle phases">${PHASES.slice(1).map((p) => `<li class="${t.phases.includes(p.id) ? 'on' : ''}">${esc(p.label)}</li>`).join('')}</ul>
        <p class="td-where">Used at: ${esc(t.where)}</p>
      </div>`;
  };
  const filter = (id) => {
    phase = id;
    $$('button', bar).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.phase === id)));
    toolEls.forEach((el, k) => el.classList.toggle('is-dim', id !== 'all' && !TOOLS[k].phases.includes(id)));
    const first = toolEls.findIndex((_, k) => id === 'all' || TOOLS[k].phases.includes(id));
    if (first >= 0) show(first);
    grid.setAttribute('aria-label', id === 'all' ? 'Tools' : `Tools used in the ${label(id)} phase are highlighted`);
  };
  bar.addEventListener('click', (e) => { const b = e.target.closest('[data-phase]'); if (b) filter(b.dataset.phase); });
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-tool]'); if (b) show(Number(b.dataset.tool)); });
  show(0);
}

/* ---------------- Case studies ---------------- */
export function initCases() {
  const root = $('[data-cases]');
  if (!root) return;
  const LABELS = { challenge: 'Challenge', investigation: 'Investigation', bottleneck: 'Bottleneck', improvement: 'Improvement', outcome: 'Outcome' };
  root.innerHTML = CASES.map((c, i) => `
    <article class="case${i === 0 ? ' is-open' : ''}" data-reveal style="--d:${i}">
      <h3 class="case-h">
        <button type="button" class="case-head" aria-expanded="${i === 0}" aria-controls="case-${i}">
          <span class="case-no">${String(i + 1).padStart(2, '0')}</span>
          <span><span class="case-tag">${esc(c.tag)}</span><span class="case-title">${esc(c.title)}</span><span class="case-sum">${esc(c.summary)}</span></span>
          <span class="case-toggle" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="case-body" id="case-${i}" role="region" aria-label="${esc(c.title)} details"><div><div class="case-inner">
        <ol class="case-steps">${Object.entries(c.steps).map(([k, v]) => `<li class="cs" data-k="${k}"><h4><i aria-hidden="true"></i>${LABELS[k]}</h4><p>${esc(v)}</p></li>`).join('')}</ol>
        <ul class="case-tags" aria-label="Tools and techniques">${c.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div></div></div>
    </article>`).join('');
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.case-head');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    b.closest('.case').classList.toggle('is-open', open);
  });
}
