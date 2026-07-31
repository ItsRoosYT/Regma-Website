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
