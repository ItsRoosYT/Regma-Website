/* Help centre behaviour: search + filter over HELP_ARTICLES, the anonymous
   report form, and the code-based status lookup.
   Content lives in help-data.js. */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  /* ── FAQ rendering ──────────────────────────────────────────── */

  const root      = $('faq-root');
  const searchBox = $('help-search');
  const countEl   = $('search-count');
  const emptyEl   = $('help-empty');

  let activeCat = 'all';
  let query     = '';

  // Highlight matches without ever putting user text through innerHTML.
  function markup(text, q) {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q);
    if (i === -1) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  // The answer HTML is authored in help-data.js, so it is trusted. To search it
  // we need the plain text — strip tags via the DOM rather than a regex.
  const plain = (html) => { const d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').toLowerCase(); };
  HELP_ARTICLES.forEach(a => { a._text = plain(a.a); a._q = a.q.toLowerCase(); });

  function render() {
    const q = query.trim().toLowerCase();

    const matches = HELP_ARTICLES.filter(a =>
      (activeCat === 'all' || a.cat === activeCat) &&
      (!q || a._q.includes(q) || a._text.includes(q))
    );

    // Group by category so results stay oriented
    const groups = {};
    matches.forEach(a => { (groups[a.cat] = groups[a.cat] || []).push(a); });

    root.innerHTML = '';
    Object.keys(HELP_CATEGORIES).forEach(cat => {
      const items = groups[cat];
      if (!items || !items.length) return;

      const section = document.createElement('div');
      section.className = 'faq-group';

      const title = document.createElement('p');
      title.className = 'faq-group-title';
      title.textContent = HELP_CATEGORIES[cat];
      section.appendChild(title);

      items.forEach(item => {
        const wrap = document.createElement('div');
        wrap.className = 'faq-item';

        const btn = document.createElement('button');
        btn.className = 'faq-q';
        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = markup(item.q, q);

        const ans = document.createElement('div');
        ans.className = 'faq-a';
        ans.innerHTML = item.a;           // authored content, not user input

        btn.addEventListener('click', () => {
          const open = wrap.classList.toggle('open');
          btn.setAttribute('aria-expanded', String(open));
        });

        // Searching implies you want to read, not hunt for a click target
        if (q) { wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }

        wrap.appendChild(btn);
        wrap.appendChild(ans);
        section.appendChild(wrap);
      });

      root.appendChild(section);
    });

    emptyEl.classList.toggle('show', matches.length === 0);
    countEl.textContent = !q
      ? ''
      : matches.length === 0
        ? 'No answers matched "' + q + '"'
        : matches.length + (matches.length === 1 ? ' answer' : ' answers') + ' for "' + q + '"';
  }

  searchBox.addEventListener('input', (e) => { query = e.target.value; render(); });

  $('help-cats').addEventListener('click', (e) => {
    const btn = e.target.closest('.help-cat');
    if (!btn) return;
    document.querySelectorAll('.help-cat').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCat = btn.dataset.cat;
    render();
  });

  render();

  // Deep link: /help.html?q=cv  or  #report
  const params = new URLSearchParams(location.search);
  if (params.get('q')) { searchBox.value = params.get('q'); query = params.get('q'); render(); }
  if (location.hash === '#report') {
    setTimeout(() => $('report').scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }

  /* ── Tabs ───────────────────────────────────────────────────── */

  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.report-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.report-panel').forEach(p => p.classList.remove('active'));
      $('panel-' + tab.dataset.panel).classList.add('active');
    });
  });

  /* ── Report form ────────────────────────────────────────────── */

  let category = 'application';

  $('cat-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-opt');
    if (!btn) return;
    document.querySelectorAll('.cat-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    category = btn.dataset.cat;
  });

  const msgBox  = $('report-message');
  const msgHint = $('msg-hint');
  const MIN = 15;

  msgBox.addEventListener('input', () => {
    const n = msgBox.value.trim().length;
    msgHint.textContent = n === 0 ? '' : n < MIN ? 'A little more detail, please (' + n + '/' + MIN + ' characters)' : '';
    if (n >= MIN) showError('');
  });

  function showError(msg) {
    const el = $('report-error');
    el.textContent = msg;
    el.hidden = !msg;
    if (msg) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // Ambiguous characters (0/O, 1/I) left out — these get written on paper.
  const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  function makeCode() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let out = '';
    for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
    return 'RG-' + out;
  }

  $('report-submit').addEventListener('click', async () => {
    const message = msgBox.value.trim();
    const email   = $('report-email').value.trim();

    if (message.length < MIN) {
      showError('Please describe what happened — at least ' + MIN + ' characters so we have something to act on.');
      msgBox.focus();
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      showError('That email address does not look right. Correct it, or clear the field to stay anonymous.');
      $('report-email').focus();
      return;
    }

    const btn = $('report-submit');
    btn.classList.add('loading');
    btn.disabled = true;
    showError('');

    if (typeof sb === 'undefined' || !sb) {
      btn.classList.remove('loading');
      btn.disabled = false;
      showError('The reporting service is unavailable right now. Please email regmaitab@gmail.com instead — sorry about this.');
      return;
    }

    // Retry once on the astronomically unlikely code collision.
    let code, error;
    for (let attempt = 0; attempt < 2; attempt++) {
      code = makeCode();
      ({ error } = await sb.from('reports').insert({
        code, category, message, email: email || null
      }));
      if (!error || !/duplicate|unique/i.test(error.message)) break;
    }

    btn.classList.remove('loading');
    btn.disabled = false;

    if (error) {
      showError('Your report could not be sent (' + error.message + '). Please email regmaitab@gmail.com instead so it does not get lost.');
      console.error(error);
      return;
    }

    $('report-code').textContent = code;
    $('report-form-wrap').style.display = 'none';
    $('report-done').style.display = 'block';
    $('report-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('copy-code').addEventListener('click', async () => {
    const btn = $('copy-code');
    try {
      await navigator.clipboard.writeText($('report-code').textContent);
      btn.textContent = 'Copied';
    } catch {
      // Clipboard is blocked in some browsers/contexts — select it so Ctrl+C works.
      const r = document.createRange();
      r.selectNodeContents($('report-code'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      btn.textContent = 'Selected — press Ctrl+C';
    }
    setTimeout(() => { btn.textContent = 'Copy code'; }, 2600);
  });

  $('report-another').addEventListener('click', () => {
    msgBox.value = '';
    $('report-email').value = '';
    msgHint.textContent = '';
    $('report-done').style.display = 'none';
    $('report-form-wrap').style.display = 'block';
    $('report-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ── Status lookup ──────────────────────────────────────────── */

  const STATUS_TEXT = {
    new:      ['status-new',      'Received',   'Your report has arrived and is waiting to be read.'],
    seen:     ['status-seen',     'Being read', 'Someone at Regma IT has read this and is looking into it.'],
    resolved: ['status-resolved', 'Resolved',   'This has been dealt with. Any note from us is shown below.'],
  };

  $('check-submit').addEventListener('click', async () => {
    const codeInput = $('check-code');
    const code = codeInput.value.trim().toUpperCase();
    const box  = $('check-result');
    box.classList.add('show');

    if (!code) {
      box.innerHTML = '<p style="opacity:.8">Enter the reference code you were given.</p>';
      codeInput.focus();
      return;
    }

    if (typeof sb === 'undefined' || !sb) {
      box.innerHTML = '<p style="opacity:.8">The lookup service is unavailable right now. Please try again later.</p>';
      return;
    }

    const btn = $('check-submit');
    btn.classList.add('loading');
    btn.disabled = true;

    const { data, error } = await sb.rpc('check_report', { p_code: code });

    btn.classList.remove('loading');
    btn.disabled = false;

    if (error) {
      box.innerHTML = '<p style="opacity:.8">Could not check that right now (' + esc(error.message) + '). Please try again shortly.</p>';
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      box.innerHTML =
        '<p style="opacity:.85"><strong>No report found with that code.</strong></p>' +
        '<p style="opacity:.7;font-size:14.4px;line-height:1.7">Check for typos — codes look like <code>RG-K7M2QP4X</code>. ' +
        'Because reports are anonymous we cannot look yours up any other way, so if the code is lost the only option is to send a new report.</p>';
      return;
    }

    const [cls, label, blurb] = STATUS_TEXT[row.status] || ['status-new', row.status, ''];
    const sent = new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    box.innerHTML =
      '<div style="border:1px solid var(--line,#2a2a30);border-radius:12px;padding:20px">' +
        '<span class="status-pill ' + cls + '">' + esc(label) + '</span>' +
        '<p style="margin:14px 0 0;line-height:1.7">' + esc(blurb) + '</p>' +
        '<p style="margin:12px 0 0;font-size:14px;opacity:.65">Sent ' + esc(sent) + ' · ' + esc(row.category) + '</p>' +
        (row.reply
          ? '<div style="margin-top:17px;padding-top:17px;border-top:1px solid var(--line,#2a2a30)">' +
              '<p style="margin:0 0 7px;font-size:12.6px;letter-spacing:.08em;text-transform:uppercase;opacity:.6">Reply from Regma IT</p>' +
              '<p style="margin:0;line-height:1.75;white-space:pre-wrap">' + esc(row.reply) + '</p>' +
            '</div>'
          : '') +
      '</div>';
  });

  $('check-code').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('check-submit').click(); }
  });

})();
