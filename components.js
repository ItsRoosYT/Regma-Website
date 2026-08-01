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
    <p>We use cookies to improve your experience in accordance with Swedish and EU (GDPR) regulations. <a href="privacy.html">Learn more</a></p>
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

// ── LIGHT/DARK MODE (light is the default) ──
(function() {
  const saved = localStorage.getItem('regma_theme');
  if (saved !== 'dark') document.documentElement.classList.add('light');

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

  // Signed out → show a clear "Sign in" account button in the top bar
  if (!user) {
    const signIn = document.createElement('a');
    signIn.href = 'auth.html';
    signIn.className = 'btn-contact nav-signin';
    signIn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px;margin-right:6px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Sign in';
    navRight.insertBefore(signIn, navRight.firstChild);
    return;
  }

  const name = user.user_metadata?.name || user.email.split('@')[0];
  const initial = name.charAt(0).toUpperCase();
  const isAdminUser = typeof loadAdmin === 'function' ? !!(await loadAdmin()) : (user.email === 'rooseveltdjomo81@gmail.com');

  // Admins get a one-click Admin button right in the top bar
  if (isAdminUser) {
    const adminBtn = document.createElement('a');
    adminBtn.href = 'admin.html';
    adminBtn.className = 'btn-contact nav-admin-quick';
    adminBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px;margin-right:6px"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Admin';
    navRight.insertBefore(adminBtn, navRight.firstChild);
  }

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

// ── SKIP TO CONTENT (accessibility) ──
(function() {
  const main = document.querySelector('main');
  if (!main) return;
  if (!main.id) main.id = 'main-content';
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#' + main.id;
  skip.textContent = 'Skip to content';
  skip.addEventListener('click', () => {
    main.setAttribute('tabindex', '-1');
    main.focus();
  });
  document.body.prepend(skip);
})();

// ── COMMAND PALETTE (⌘K / Ctrl+K) ──
(function() {
  const NAV = [
    { label: 'Home',            href: 'index.html',    hint: 'Overview',            icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
    { label: 'About',           href: 'about.html',    hint: 'Who we are',          icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 8h.01M11 12h2v5h-2z' },
    { label: 'Services',        href: 'services.html', hint: 'What we do',          icon: 'M2 3h20v14H2zM8 21h8M12 17v4' },
    { label: 'Open Positions',  href: 'career.html',   hint: 'Careers at Regma',    icon: 'M2 7h20v14H2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
    { label: 'Contact',         href: 'contact.html',  hint: 'Start a conversation',icon: 'M4 4h16v16H4zM4 6l8 6 8-6' },
    { label: 'Team',            href: 'team.html',     hint: 'The people',          icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8' },
    { label: 'Blog',            href: 'blog.html',     hint: 'Writing',             icon: 'M4 3h16v18H4zM8 7h8M8 11h8M8 15h5' },
    { label: 'Privacy Policy',  href: 'privacy.html',  hint: 'GDPR',                icon: 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z' },
    { label: 'Sign in',         href: 'auth.html',     hint: 'Account',             icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8' }
  ];
  const ACTIONS = [
    { label: 'Toggle light / dark theme', hint: 'Appearance', icon: 'M12 3v18M12 3a9 9 0 0 1 0 18',
      run: () => document.querySelector('.theme-toggle')?.click() },
    { label: 'Scroll to top', hint: 'Navigation', icon: 'M12 19V5M5 12l7-7 7 7',
      run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }
  ];

  const el = document.createElement('div');
  el.className = 'cmdk';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Command palette');
  el.innerHTML = `
    <div class="cmdk__backdrop"></div>
    <div class="cmdk__panel">
      <div class="cmdk__search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Search pages and actions…" aria-label="Search" spellcheck="false" />
        <kbd>ESC</kbd>
      </div>
      <div class="cmdk__list" role="listbox"></div>
      <div class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span></div>
    </div>`;
  document.body.appendChild(el);

  const input = el.querySelector('input');
  const list  = el.querySelector('.cmdk__list');
  let items = [], cursor = 0, lastFocus = null;

  const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

  function render(q) {
    const query = q.trim().toLowerCase();
    const pool = [
      ...NAV.map(x => ({ ...x, group: 'Pages' })),
      ...ACTIONS.map(x => ({ ...x, group: 'Actions' }))
    ].filter(x => !query || (x.label + ' ' + x.hint).toLowerCase().includes(query));

    items = pool; cursor = 0;
    if (!pool.length) { list.innerHTML = '<div class="cmdk__empty">No matches</div>'; return; }

    let html = '', group = '';
    pool.forEach((x, i) => {
      if (x.group !== group) { group = x.group; html += `<div class="cmdk__group">${group}</div>`; }
      html += `<button class="cmdk__item" role="option" data-i="${i}">
        <span class="cmdk__ico">${svg(x.icon)}</span>
        <span class="cmdk__label">${x.label}</span>
        <span class="cmdk__hint">${x.hint}</span>
      </button>`;
    });
    list.innerHTML = html;
    list.querySelectorAll('.cmdk__item').forEach(b => {
      b.addEventListener('mouseenter', () => { cursor = +b.dataset.i; mark(); });
      b.addEventListener('click', () => choose(+b.dataset.i));
    });
    mark();
  }

  function mark() {
    list.querySelectorAll('.cmdk__item').forEach(b => {
      const on = +b.dataset.i === cursor;
      b.classList.toggle('on', on);
      if (on) b.scrollIntoView({ block: 'nearest' });
    });
  }

  function choose(i) {
    const x = items[i];
    if (!x) return;
    close();
    if (x.run) x.run();
    else window.location.href = x.href;
  }

  function open() {
    lastFocus = document.activeElement;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    render('');
    setTimeout(() => input.focus(), 20);
  }
  function close() {
    el.classList.remove('open');
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  }

  el.querySelector('.cmdk__backdrop').addEventListener('click', close);
  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); cursor = Math.min(cursor + 1, items.length - 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cursor = Math.max(cursor - 1, 0); mark(); }
    else if (e.key === 'Enter')  { e.preventDefault(); choose(cursor); }
  });

  window.regmaCommandPalette = open;

  // Discoverability: a search affordance in the top bar
  const navRight = document.querySelector('.nav-right');
  if (navRight) {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const trigger = document.createElement('button');
    trigger.className = 'cmdk-trigger';
    trigger.setAttribute('aria-label', 'Open command palette');
    trigger.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span>Search</span>
      <kbd>${isMac ? '⌘' : 'Ctrl'} K</kbd>`;
    trigger.addEventListener('click', open);
    navRight.insertBefore(trigger, navRight.firstChild);
  }

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) ||
                   document.activeElement?.isContentEditable;

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      el.classList.contains('open') ? close() : open();
      return;
    }
    if (e.key === '/' && !typing && !el.classList.contains('open')) {
      e.preventDefault(); open(); return;
    }
    if (e.key === 'Escape') {
      if (el.classList.contains('open')) { close(); return; }
      const drawer = document.querySelector('.mobile-drawer.open');
      if (drawer) {
        drawer.classList.remove('open');
        document.querySelector('.nav-burger')?.classList.remove('open');
      }
    }
  });
})();

// ── SMOOTH LINK TRANSITIONS ──
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript')) return;
  if (/^(mailto|tel):/i.test(href)) return;              // let the OS handle these
  if (link.target && link.target !== '_self') return;    // never swallow a new-tab link
  if (link.hasAttribute('download')) return;
  link.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
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
