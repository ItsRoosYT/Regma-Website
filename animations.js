// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Scroll reveal for the visual system (.rise / .wipe).
// Separate from .reveal because it uses a different class name and a
// rootMargin that triggers slightly before the element reaches the viewport,
// so the animation is already underway by the time you see it.
const riseObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      riseObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.rise, .wipe').forEach(el => riseObserver.observe(el));

// Hero parallax: drift the hero photo slightly slower than the page scroll.
// rAF-throttled so it never blocks the scroll thread.
const heroImg = document.querySelector('.photo-hero__bg img');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (heroImg && !reduceMotion) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      // stop calculating once the hero is well off screen
      if (y < window.innerHeight * 1.2) {
        heroImg.style.translate = `0 ${y * 0.28}px`;
      }
      ticking = false;
    });
  }, { passive: true });
}

// Loader
const loader = document.getElementById('loader');
if (loader) {
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hide'), 1200);
  });
}

/* ─────────────────────────────────────────────────────────────
   AUTO-REVEAL
   Several pages (privacy, portal, apply, auth, 404) were built before the
   reveal system existed and had no motion at all. Rather than hand-tagging
   every element on every page, opt those containers in automatically.
   Anything already carrying .reveal or .rise is left alone.
   ───────────────────────────────────────────────────────────── */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const AUTO = [
    // legal pages (privacy) — the content sits directly in .legal-content
    ".legal-content > h2",
    ".legal-content > p",
    ".legal-content > ul",
    // portal
    ".profile-card",
    ".portal-section-header",
    ".portal-stats",
    ".app-card",
    // apply
    ".apply-header",
    ".apply-section",
    // 404
    ".page-404 > *",
    // generic
    ".contact-wrap > *",
    ".team-card",
  ];

  const seen = new WeakSet();
  document.querySelectorAll(AUTO.join(',')).forEach((el, i) => {
    if (el.classList.contains('reveal') || el.classList.contains('rise')) return;
    if (seen.has(el)) return;
    seen.add(el);
    el.classList.add('auto-reveal');
    // stagger within a group, capped so long lists don't crawl
    el.style.setProperty('--ar-delay', Math.min(i % 6, 5) * 60 + 'ms');
  });

  const revealAll = () =>
    document.querySelectorAll('.auto-reveal').forEach((el) => el.classList.add('in'));

  // No IntersectionObserver (old browser, odd environment) — show everything.
  if (!('IntersectionObserver' in window)) { revealAll(); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.auto-reveal').forEach((el) => io.observe(el));

  // FAIL-SAFE. A reveal animation must never be able to hide content
  // permanently. If anything above the fold has not been revealed shortly
  // after load, assume the observer is not firing and show everything.
  // Losing the animation is fine; losing the page is not.
  setTimeout(() => {
    const pending = [...document.querySelectorAll('.auto-reveal:not(.in)')];
    const stuckInView = pending.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    if (stuckInView) revealAll();
  }, 1200);

  // Same guard for anything revealed by the older .rise / .wipe system
  setTimeout(() => {
    document.querySelectorAll('.rise:not(.in), .wipe:not(.in), .reveal:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }, 1500);
})();

/* ─────────────────────────────────────────────────────────────
   COUNT-UP
   Numeric stats tick up when they scroll into view. Reads the number that
   is already in the DOM, so it never invents or changes a value — if the
   text is not a plain number it is left exactly as written.
   ───────────────────────────────────────────────────────────── */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  function countUp(el) {
    const raw = el.textContent.trim();
    // only touch pure numbers, optionally with spaces as thousand separators
    if (!/^\d[\d\s]*$/.test(raw)) return;
    const target = parseInt(raw.replace(/\s/g, ''), 10);
    if (!Number.isFinite(target) || target === 0) return;

    const dur = 900;
    const start = performance.now();
    const fmt = (n) => raw.includes(' ') ? n.toLocaleString('sv-SE') : String(n);

    el.style.fontVariantNumeric = 'tabular-nums';
    (function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);           // ease-out cubic
      el.textContent = fmt(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = raw;                       // restore exactly
    })(start);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.5 });

  // run after other scripts have written their numbers in
  setTimeout(() => {
    document.querySelectorAll('.band-stat .v, .admin-stat-card .a-val').forEach((el) => io.observe(el));
  }, 400);
})();

/* ─────────────────────────────────────────────────────────────
   SMOOTH IN-PAGE SCROLLING
   ───────────────────────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href');
  if (!id || id === '#') return;
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', id);
});
