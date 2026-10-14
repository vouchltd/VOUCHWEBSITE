// Reveal-on-scroll, and pause the scrolling strip when it is off screen.
// The page is fully readable without this: the "js" class that hides elements
// is only added by the inline script in <head>, and removed again if this file never runs.

const root = document.documentElement;
window.__vouchReady = true;

if (root.classList.contains('js') && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll(
    'main :is(h1, h2, .lead, .eyebrow, .card, .mock, .faq details, .btn-row, .stat, .steps3 > div, .person, .hero p)'
  );
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  // Small stagger for siblings that enter together.
  const seen = new Map();
  targets.forEach((el) => {
    const parent = el.parentElement;
    const n = seen.get(parent) || 0;
    seen.set(parent, n + 1);
    el.style.transitionDelay = `${Math.min(n, 4) * 0.06}s`;
    io.observe(el);
  });
}

const marquee = document.querySelector('.marquee');
if (marquee && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => marquee.classList.toggle('paused', !e.isIntersecting)).observe(marquee);
}
