/* Scroll-driven storytelling. Loaded lazily, only on wide screens
   with motion allowed, after the page is idle, so GSAP never sits on
   the critical rendering path. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $ } from './utils.js';

gsap.registerPlugin(ScrollTrigger);

export function initMotion({ journey }) {
  const mm = gsap.matchMedia();

  mm.add('(min-width: 941px) and (prefers-reduced-motion: no-preference)', () => {
    /* Journey: pin the section and let scroll advance the stages.
       Tabs still work; clicking one scrolls to its position. */
    const pin = $('[data-journey]');
    if (journey && pin) {
      const top = 64 + 24; // below the sticky bar
      const fits = () => pin.offsetHeight < window.innerHeight - top - 16;
      if (fits()) {
        const per = 0.55; // viewport heights of scroll per stage
        const st = ScrollTrigger.create({
          trigger: pin,
          start: `top top+=${top}`,
          end: () => `+=${window.innerHeight * per * (journey.count - 1)}`,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const i = Math.round(self.progress * (journey.count - 1));
            if (i !== journey.current) journey.show(i, { source: 'scroll' });
          },
        });
        journey.onChange((i, source) => {
          if (source !== 'tab' || !st.isActive) return;
          const y = st.start + (st.end - st.start) * (i / (journey.count - 1));
          window.scrollTo({ top: y + 1, behavior: 'smooth' });
        });
      }
    }

    /* Career: the timeline line draws as you read down it */
    const line = $('.tl-line span');
    if (line) {
      gsap.fromTo(line, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '[data-timeline]', start: 'top 70%', end: 'bottom 60%', scrub: 0.4 },
      });
    }

    /* Hero: the simulator drifts gently as the hero scrolls away */
    gsap.to('.hero-sim', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    /* Lab: KPI tiles settle in sequence the first time the lab is reached */
    gsap.from('.kpi', {
      y: 16, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.lab', start: 'top 75%', once: true },
    });
  });

  // Fonts or late layout changes can move trigger positions
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
