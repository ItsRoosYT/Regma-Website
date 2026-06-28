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

// ── DARK/LIGHT MODE ──
(function() {
  const saved = localStorage.getItem('regma_theme');
  if (saved === 'light') document.documentElement.classList.add('light');

  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle theme');
  const isLight = () => document.documentElement.classList.contains('light');
  const updateIcon = () => {
    btn.innerHTML = isLight()
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  };
  updateIcon();
  btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    localStorage.setItem('regma_theme', isLight() ? 'light' : 'dark');
    updateIcon();
  });
  navRight.insertBefore(btn, navRight.firstChild);
})();

// ── NAV USER STATE ──
(async function() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;
  if (typeof sb === 'undefined') return;

  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const name = user.user_metadata?.name || user.email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();
    const el = document.createElement('div');
    el.className = 'nav-user';
    el.innerHTML = `
      <a href="portal.html" style="display:flex;align-items:center;gap:6px;text-decoration:none">
        <span class="nav-user-avatar">${initial}</span>
        <span style="color:var(--muted);font-size:12px">${name.split(' ')[0]}</span>
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
