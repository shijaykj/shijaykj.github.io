/* Shijay Jayan — portfolio interactions.
   Vanilla JS, no dependencies. Every effect is progressive:
   the page works fully without it, and motion-heavy effects
   are skipped when the user prefers reduced motion. */
(() => {
  'use strict';

  const doc = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionOK = () => !reduceMotion.matches;

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  const menu = document.querySelector('.menu');
  const links = document.querySelector('.nav-links');

  const setMenu = (open) => {
    if (!menu || !links) return;
    links.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  menu?.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links?.classList.contains('open')) { setMenu(false); menu.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (links?.classList.contains('open') && !e.target.closest('.nav')) setMenu(false);
  });

  /* ---------- Scroll-driven UI (one rAF-throttled handler) ---------- */
  const navWrap = document.querySelector('.nav-wrap');
  const progress = document.querySelector('.scroll-progress');
  const timeline = document.querySelector('.timeline');
  const track = document.querySelector('.timeline-track');
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const max = doc.scrollHeight - window.innerHeight;
    navWrap?.classList.toggle('scrolled', y > 8);
    progress?.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : '0');

    if (timeline && track) {
      const r = timeline.getBoundingClientRect();
      const start = window.innerHeight * 0.75;
      const p = Math.min(1, Math.max(0, (start - r.top) / r.height));
      track.style.setProperty('--p', p.toFixed(4));
    }
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = navAnchors.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id ? '#' + entry.target.id : ''; // hero has no id: clears highlight
        navAnchors.forEach((a) => {
          const on = a.getAttribute('href') === id;
          a.classList.toggle('active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
    const hero = document.querySelector('.hero-shell');
    if (hero) spy.observe(hero);
  }

  /* ---------- Count-up for numeric stats ---------- */
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.textContent.replace(/^[\d.,]+/, '');
    if (!motionOK() || !Number.isFinite(target)) return;
    const t0 = performance.now();
    const dur = 1200;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Hero stat counts once the intro animation has started
  document.querySelectorAll('[data-count]').forEach((el) => setTimeout(() => countUp(el), 650));

  /* ---------- Card spotlight + subtle 3D tilt ---------- */
  const tiltCards = document.querySelectorAll('.card-fx');
  tiltCards.forEach((card) => {
    const canTilt = card.hasAttribute('data-tilt');
    const max = Number(card.dataset.tiltMax) || 5;
    let frame = 0;

    card.addEventListener('pointermove', (e) => {
      if (!finePointer.matches) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        if (canTilt && motionOK()) {
          card.classList.add('is-tilting');
          card.style.setProperty('--rx', ((0.5 - y) * max).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((x - 0.5) * max).toFixed(2) + 'deg');
        }
      });
    });

    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  /* ---------- Hero 3D parallax (follows the mouse across the hero) ---------- */
  const heroShell = document.querySelector('.hero-shell');
  const stage = document.querySelector('.tilt-stage');
  if (heroShell && stage) {
    const max = Number(stage.dataset.tiltMax) || 7;
    let frame = 0;
    heroShell.addEventListener('pointermove', (e) => {
      if (!finePointer.matches || !motionOK()) return;
      const r = heroShell.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        stage.classList.add('is-tilting');
        stage.style.setProperty('--rx', (-y * max).toFixed(2) + 'deg');
        stage.style.setProperty('--ry', (x * max * 1.4).toFixed(2) + 'deg');
      });
    });
    heroShell.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      stage.classList.remove('is-tilting');
      stage.style.setProperty('--rx', '0deg');
      stage.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- Copy email ---------- */
  const copyBtn = document.querySelector('.copy-email');
  const copyStatus = document.getElementById('copy-status');
  if (copyBtn && navigator.clipboard && window.isSecureContext) {
    copyBtn.hidden = false;
    let reset = 0;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        copyBtn.textContent = 'Copied ✓';
        copyBtn.classList.add('copied');
        if (copyStatus) copyStatus.textContent = 'Email address copied to clipboard';
        clearTimeout(reset);
        reset = setTimeout(() => {
          copyBtn.textContent = 'Copy email';
          copyBtn.classList.remove('copied');
          if (copyStatus) copyStatus.textContent = '';
        }, 2200);
      } catch { /* clipboard denied: the mailto link still works */ }
    });
  }

  /* ---------- Hero network canvas ----------
     A light "distributed system" backdrop: drifting nodes, links
     between nearby nodes and small packets travelling along them.
     Runs only while the hero is on screen and the tab is visible. */
  const canvas = document.querySelector('.hero-canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !heroShell) return;

  let w = 0, h = 0, dpr = 1, nodes = [], packets = [], raf = 0, running = false, inView = true;
  const mouse = { x: -9999, y: -9999 };
  const LINK = 140;
  const LINK2 = LINK * LINK;

  const build = () => {
    const rect = heroShell.getBoundingClientRect();
    w = rect.width; h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const small = w < 650;
    const count = Math.min(small ? 32 : 72, Math.floor((w * h) / (small ? 22000 : 15000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.4 + 0.8,
      blue: Math.random() < 0.3,
    }));
    packets = [];
  };

  const spawnPacket = () => {
    const a = nodes[(Math.random() * nodes.length) | 0];
    if (!a) return;
    let best = null, bestD = LINK2;
    for (const b of nodes) {
      if (b === a) continue;
      const dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
      if (d < bestD && d > 900) { bestD = d; best = b; }
    }
    if (best) packets.push({ a, b: best, t: 0 });
  };

  const draw = (animate) => {
    ctx.clearRect(0, 0, w, h);

    for (const n of nodes) {
      if (animate) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
        if (d < LINK2) {
          ctx.strokeStyle = `rgba(150,170,195,${(1 - d / LINK2) * 0.16})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
      if (md < 32400) {
        ctx.strokeStyle = `rgba(166,227,107,${(1 - md / 32400) * 0.35})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }

    for (const n of nodes) {
      ctx.fillStyle = n.blue ? 'rgba(111,182,255,.55)' : 'rgba(166,227,107,.55)';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }

    if (animate) {
      if (packets.length < 6 && Math.random() < 0.04) spawnPacket();
      ctx.fillStyle = 'rgba(200,245,150,.9)';
      packets = packets.filter((p) => {
        p.t += 0.014;
        if (p.t >= 1) return false;
        const x = p.a.x + (p.b.x - p.a.x) * p.t;
        const y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
        return true;
      });
    }
  };

  const loop = () => {
    draw(true);
    raf = requestAnimationFrame(loop);
  };

  const update = () => {
    const shouldRun = inView && !document.hidden && motionOK();
    if (shouldRun && !running) { running = true; raf = requestAnimationFrame(loop); }
    else if (!shouldRun && running) { running = false; cancelAnimationFrame(raf); }
    if (!motionOK()) draw(false); // one static frame
  };

  const start = () => {
    build();
    draw(false);
    update();

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); draw(false); }, 150);
    };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(heroShell);
    else window.addEventListener('resize', onResize, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }).observe(heroShell);
    }
    document.addEventListener('visibilitychange', update);
    reduceMotion.addEventListener?.('change', update);

    heroShell.addEventListener('pointermove', (e) => {
      const r = heroShell.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    heroShell.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  };

  // Start after first paint so the canvas never competes with the hero's LCP
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 800 });
  else setTimeout(start, 200);
})();
