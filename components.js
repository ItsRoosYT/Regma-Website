// Scroll progress bar
const prog = document.createElement('div');
prog.className = 'scroll-progress';
document.body.prepend(prog);

// Back to top button
const btt = document.createElement('button');
btt.className = 'back-top';
btt.setAttribute('aria-label', 'Back to top');
btt.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
document.body.appendChild(btt);

window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  prog.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0%';
  btt.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

// Cookie consent
if (!localStorage.getItem('regma_cookies')) {
  const bar = document.createElement('div');
  bar.className = 'cookie-bar';
  bar.innerHTML = `
    <p>We use cookies to improve your experience. By continuing to use this site you agree to our use of cookies in accordance with Swedish and EU regulations.</p>
    <div class="cookie-btns">
      <button class="btn btn-primary" onclick="acceptCookies()">Accept</button>
      <button class="btn" onclick="acceptCookies()">Decline</button>
    </div>
  `;
  document.body.appendChild(bar);
}

function acceptCookies() {
  localStorage.setItem('regma_cookies', 'true');
  const bar = document.querySelector('.cookie-bar');
  if (bar) bar.style.display = 'none';
}
window.acceptCookies = acceptCookies;
