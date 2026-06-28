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

// ── GLOBAL SIGN OUT ──
async function regmaSignOut(e) {
  if (e) e.preventDefault();
  if (typeof sb === 'undefined') { location.href = 'index.html'; return; }
  if (window.showToast) showToast('Signing you out…', 'info', 1200);
  await sb.auth.signOut();
  setTimeout(() => { location.href = 'index.html'; }, 600);
}
window.regmaSignOut = regmaSignOut;

// Wait for the Supabase client to be initialised (it loads after this file)
function waitForSb(timeout = 3000) {
  return new Promise((resolve) => {
    if (typeof sb !== 'undefined') return resolve(true);
    const start = Date.now();
    const t = setInterval(() => {
      if (typeof sb !== 'undefined') { clearInterval(t); resolve(true); }
      else if (Date.now() - start > timeout) { clearInterval(t); resolve(false); }
    }, 50);
  });
}

// ── NAV USER STATE (dropdown menu) ──
(async function() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;
  if (navRight.dataset.noUserMenu !== undefined) return; // app pages use explicit Sign out
  if (!(await waitForSb())) return; // no Supabase on this page

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  const ADMIN = 'rooseveltdjomo81@gmail.com';
  const name = user.user_metadata?.name || user.email.split('@')[0];
  const initial = name.charAt(0).toUpperCase();
  const isAdminUser = user.email === ADMIN;

  const wrap = document.createElement('div');
  wrap.className = 'nav-user-wrap';
  wrap.innerHTML = `
    <button class="nav-user-btn" id="nav-user-btn" aria-haspopup="true" aria-expanded="false">
      <span class="nav-user-avatar">${initial}</span>
      <span class="nav-user-name">${name.split(' ')[0]}</span>
      <svg class="nav-user-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="nav-user-menu" id="nav-user-menu">
      <div class="nav-user-head">
        <span class="nav-user-avatar lg">${initial}</span>
        <div class="nav-user-meta">
          <strong>${name}</strong>
          <span>${user.email}</span>
        </div>
      </div>
      <a href="portal.html" class="nav-user-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        My Portal
      </a>
      <a href="career.html" class="nav-user-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        Open Positions
      </a>
      ${isAdminUser ? `<a href="admin.html" class="nav-user-item admin">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Admin Dashboard
      </a>` : ''}
      <div class="nav-user-divider"></div>
      <a href="#" class="nav-user-item danger" onclick="regmaSignOut(event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign out
      </a>
    </div>
  `;
  navRight.insertBefore(wrap, navRight.firstChild);

  const btn = wrap.querySelector('#nav-user-btn');
  const menu = wrap.querySelector('#nav-user-menu');
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', () => {
    menu.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', false);
  });

  // Hide redundant "Contact us" CTA when signed in to reduce clutter
  const cta = navRight.querySelector('.btn-contact');
  if (cta && cta.textContent.trim().toLowerCase().includes('contact')) cta.style.display = 'none';
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
