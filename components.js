// ── PAGE TRANSITION ──
document.querySelector('main')?.classList.add('page-enter');

// ── SCROLL PROGRESS ──
const prog = document.createElement('div');
prog.className = 'scroll-progress';
document.body.prepend(prog);

// ── BACK TO TOP ──
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

// ── COOKIE CONSENT ──
if (!localStorage.getItem('regma_cookies')) {
  const bar = document.createElement('div');
  bar.className = 'cookie-bar';
  bar.id = 'cookie-bar';
  bar.innerHTML = `
    <p>We use cookies to improve your experience in accordance with Swedish and EU (GDPR) regulations. <a href="about.html">Learn more</a></p>
    <div class="cookie-btns">
      <button class="btn btn-primary" onclick="acceptCookies(true)">Accept all</button>
      <button class="btn" onclick="acceptCookies(false)">Necessary only</button>
    </div>
  `;
  document.body.appendChild(bar);
}

function acceptCookies(all) {
  localStorage.setItem('regma_cookies', all ? 'all' : 'necessary');
  const bar = document.getElementById('cookie-bar');
  if (bar) bar.remove();
  showToast(all ? 'Cookies accepted' : 'Only necessary cookies enabled', 'success');
}
window.acceptCookies = acceptCookies;

// ── TOAST NOTIFICATIONS ──
let toastContainer = document.querySelector('.toast-container');
if (!toastContainer) {
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
}

function showToast(msg, type = 'success', duration = 3000) {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  t.innerHTML = `<span class="toast-icon">${icon}</span> ${msg}`;
  toastContainer.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, duration);
}
window.showToast = showToast;

// ── NAV USER STATE ──
(function() {
  const user = JSON.parse(localStorage.getItem('regma_user') || 'null');
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  if (user) {
    const el = document.createElement('div');
    el.className = 'nav-user';
    const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
    el.innerHTML = `
      <a href="portal.html" style="display:flex;align-items:center;gap:6px;text-decoration:none">
        <span class="nav-user-avatar">${initial}</span>
        <span style="color:var(--muted);font-size:12px">${user.name.split(' ')[0]}</span>
      </a>
    `;
    navRight.insertBefore(el, navRight.firstChild);
  }
})();

// ── DISMISSIBLE ANNOUNCEMENT BAR ──
(function() {
  const bar = document.querySelector('.announce');
  if (!bar || localStorage.getItem('regma_announce_closed')) return;
  const close = document.createElement('button');
  close.className = 'announce-close';
  close.innerHTML = '✕';
  close.setAttribute('aria-label', 'Dismiss');
  close.addEventListener('click', () => {
    bar.remove();
    localStorage.setItem('regma_announce_closed', 'true');
  });
  bar.appendChild(close);
})();

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', (e) => {
  // Escape closes mobile drawer
  if (e.key === 'Escape') {
    const drawer = document.querySelector('.mobile-drawer.open');
    if (drawer) {
      drawer.classList.remove('open');
      document.querySelector('.nav-burger')?.classList.remove('open');
    }
  }
});

// ── SMOOTH LINK TRANSITIONS ──
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript')) return;
  link.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const main = document.querySelector('main');
    if (main) {
      main.style.opacity = '0';
      main.style.transform = 'translateY(6px)';
      main.style.transition = 'opacity .15s ease, transform .15s ease';
    }
    setTimeout(() => { window.location.href = href; }, 150);
  });
});
