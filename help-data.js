/* Help centre content.
   Kept separate from help.js so the wording can be edited without touching logic.
   Each entry: { cat, q, a }  — `a` is trusted HTML authored here, never user input. */

const HELP_CATEGORIES = {
  applying: 'Applying for a job',
  account:  'Account & sign-in',
  after:    'After you apply',
  privacy:  'Privacy & your data',
  company:  'About Regma IT',
};

const HELP_ARTICLES = [

  /* ── Applying ─────────────────────────────────────────────── */
  {
    cat: 'applying',
    q: 'How do I apply for a job?',
    a: `<ol>
      <li>Open <a href="career.html">Careers</a> and choose the role you want.</li>
      <li>Press <strong>Apply</strong>. If you are not signed in, you will be asked to create an account first — it takes under a minute.</li>
      <li>Add your phone number, then pick how you want to apply: upload a CV, or write out your experience directly in the form.</li>
      <li>Press <strong>Submit application</strong>. You will land on your portal, where the application is listed.</li>
    </ol>
    <p>If any step fails, you can always email your CV to <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a> with the job title in the subject line. Applications sent that way are treated exactly the same.</p>`
  },
  {
    cat: 'applying',
    q: 'Do I need a CV to apply?',
    a: `<p>No. On the application form choose <strong>&ldquo;Write it out&rdquo;</strong> instead of &ldquo;Upload CV&rdquo;. You then describe your experience, your key skills and why the role interests you, directly in the form.</p>
    <p>This is a genuine alternative, not a lesser option. Plenty of capable people do not have a CV ready, or have one that undersells them. It is read the same way as an uploaded CV.</p>`
  },
  {
    cat: 'applying',
    q: 'My CV will not upload',
    a: `<p>The form accepts <strong>PDF, DOC and DOCX</strong> files up to <strong>10&nbsp;MB</strong>. It also checks the inside of the file, not just the name, so renaming a file to <code>.pdf</code> will not get it through.</p>
    <p>The usual causes:</p>
    <ul>
      <li><strong>Wrong format.</strong> Pages documents, screenshots, images and ZIP files cannot be opened on our side. Export to PDF first — every word processor can do this.</li>
      <li><strong>Too big.</strong> Usually a CV with high-resolution images. Re-export it or compress it.</li>
      <li><strong>Damaged file.</strong> If the upload says the file does not look like a real PDF, open it yourself to check it still works, then export a fresh copy.</li>
      <li><strong>Sign-in expired.</strong> If the tab has been open a long time, the upload can fail with a permissions error. Reload the page, sign in again and retry.</li>
    </ul>
    <p>Still stuck? Use <strong>&ldquo;Write it out&rdquo;</strong> instead, or email the CV to <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a>. Please also <a href="#report">report it below</a> so we can fix it for the next person.</p>`
  },
  {
    cat: 'applying',
    q: 'Can I apply for more than one role?',
    a: `<p>Yes, and it does not count against you. Apply for each role separately so we can consider you properly for each one.</p>
    <p>If you are unsure which of two roles fits you better, apply for both and say so in your cover note — we would rather place you in the right role than reject you from the wrong one.</p>`
  },
  {
    cat: 'applying',
    q: 'Can I edit or withdraw my application?',
    a: `<p>There is no edit button yet. If something needs correcting, email <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a> with the role name and what changed, and it will be attached to your application.</p>
    <p>To withdraw entirely, email the same address and say so. No explanation needed, and it will not affect any future application you make.</p>`
  },
  {
    cat: 'applying',
    q: 'The deadline has passed — is it too late?',
    a: `<p>Send it anyway. Deadlines mark when we start reviewing seriously, not a hard cut-off, and roles often stay open longer than planned.</p>
    <p>If the form will no longer accept it, email <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a> with the job title.</p>`
  },

  /* ── Account & sign-in ────────────────────────────────────── */
  {
    cat: 'account',
    q: 'I cannot create an account',
    a: `<p><strong>This was broken, and it is now fixed.</strong> For a period, creating an account appeared to work but then asked you to confirm an email that never arrived — leaving you unable to sign in or apply. If that happened to you, we are sorry: it was our fault, not anything you did wrong.</p>
    <p>Accounts now work immediately. There is <strong>no confirmation email to wait for</strong> — you register and you are signed straight in.</p>
    <p>If you still cannot register:</p>
    <ul>
      <li>Check the password is at least <strong>6 characters</strong> and both password boxes match.</li>
      <li>If it says the address is already registered, you have an account — use <strong>Sign in</strong>, or <strong>Forgot password?</strong>.</li>
      <li>Try a different browser, or turn off a VPN or ad-blocker briefly.</li>
    </ul>
    <p>If none of that works, <a href="#report">report it below</a> and apply by email meanwhile — do not let this cost you the role.</p>`
  },
  {
    cat: 'account',
    q: 'I never received a confirmation email',
    a: `<p>You do not need one any more. Confirmation emails were switched off precisely because they were failing and locking people out.</p>
    <p>If you are looking at an older &ldquo;check your inbox&rdquo; screen, reload the page and sign in normally with the email and password you chose. If an account was created during the broken period, it still exists and still works — try <strong>Forgot password?</strong> if you are unsure of the password.</p>`
  },
  {
    cat: 'account',
    q: 'I forgot my password',
    a: `<p>On the sign-in page, enter your email address and press <strong>Forgot password?</strong>. A reset link is sent to that address.</p>
    <p>If it does not arrive within a few minutes, check your spam folder. If it still does not arrive, email <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a> and we will sort it out manually — and please <a href="#report">report it</a>, because that would be a bug.</p>`
  },
  {
    cat: 'account',
    q: 'My session keeps expiring',
    a: `<p>Sessions last a long time, but a tab left open for days can hold an expired one. The symptom is usually a confusing permissions error when you submit something.</p>
    <p>Reload the page and sign in again. Nothing you typed is sent until you are properly signed in, so an expired session cannot silently lose your application — but it is worth copying a long cover note before reloading, just in case.</p>`
  },
  {
    cat: 'account',
    q: 'How do I delete my account?',
    a: `<p>Open <a href="portal.html">My Portal</a> and use the delete option there, or email <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a> asking us to delete it.</p>
    <p>Deleting removes your account, your profile and any CV you uploaded. It is permanent. If you have a live application you would like considered, tell us and we can keep just that and remove the rest.</p>`
  },

  /* ── After you apply ──────────────────────────────────────── */
  {
    cat: 'after',
    q: 'How do I know my application actually arrived?',
    a: `<p>Two ways:</p>
    <ul>
      <li>It appears in <a href="portal.html">My Portal</a> straight away. That is the reliable signal — if it is listed there, we have it.</li>
      <li>A confirmation email is sent automatically.</li>
    </ul>
    <p><strong>Trust the portal over the email.</strong> Email can be delayed or filtered as spam. If the application is in your portal but no email arrived, nothing is wrong with your application — though we would like to know, so please <a href="#report">report it</a>.</p>`
  },
  {
    cat: 'after',
    q: 'How long until I hear back?',
    a: `<p>We aim to respond within <strong>one to two weeks</strong>. Regma IT is a small company and applications are read personally rather than filtered by software — that is slower, but it means a real person reads yours.</p>
    <p>Heard nothing after two weeks? Email <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a> and ask. Following up is completely normal and is never held against you.</p>`
  },
  {
    cat: 'after',
    q: 'Will I be told if I am rejected?',
    a: `<p>Yes. We reply either way. Being left guessing is the most common complaint people have about applying for jobs, and we would rather not be part of that.</p>
    <p>If you would like feedback on why, ask — we will give you something honest and specific where we can.</p>`
  },
  {
    cat: 'after',
    q: 'Can I reapply later if I am rejected?',
    a: `<p>Yes, always. A rejection is about the fit for one role at one moment, not a permanent judgement of you. People are hired having applied before.</p>`
  },

  /* ── Privacy ──────────────────────────────────────────────── */
  {
    cat: 'privacy',
    q: 'What data do you keep about me?',
    a: `<p>If you apply: your name, email, phone number, and either your uploaded CV or the experience you typed in. Plus which role you applied for and when.</p>
    <p>CVs are stored privately. They are not public, not searchable, and not shared with anyone outside Regma IT.</p>
    <p>If you send an anonymous report, we store only the category, your message, the optional email if you chose to give one, and a random reference code. Nothing links it to you.</p>
    <p>See the full <a href="privacy.html">privacy policy</a> for details.</p>`
  },
  {
    cat: 'privacy',
    q: 'Is the anonymous report really anonymous?',
    a: `<p>Yes. The report form does not record your name, your IP address, or whether you are signed in. If you leave the email field blank there is no technical way for us — or anyone who obtained the data — to trace it back to you.</p>
    <p>The reference code you receive is random and is not derived from anything about you. It is the only link between you and the report, and only you have it. That is also why we cannot recover it for you if you lose it.</p>
    <p>If you <em>do</em> enter an email, it is used solely to reply to that report.</p>`
  },
  {
    cat: 'privacy',
    q: 'How do I get my data deleted?',
    a: `<p>Email <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a> with &ldquo;GDPR&rdquo; in the subject line, from the address you applied with. We will confirm and delete within 30 days, as the GDPR requires.</p>
    <p>You can ask for a copy of your data, a correction, or full deletion. You do not have to give a reason.</p>
    <p>If we handle it badly, you can complain directly to the Swedish data protection authority, IMY, at <a href="https://www.imy.se" target="_blank" rel="noopener">imy.se</a> — you do not need our permission or involvement.</p>`
  },
  {
    cat: 'privacy',
    q: 'How long do you keep applications?',
    a: `<p>Up to <strong>two years</strong>, so we can contact you if a suitable role opens up. After that they are deleted.</p>
    <p>You can ask us to delete yours sooner at any time, and we will.</p>`
  },

  /* ── Company ──────────────────────────────────────────────── */
  {
    cat: 'company',
    q: 'Who is Regma IT AB?',
    a: `<p>An IT consultancy based in Angered, Gothenburg, working in IT consulting, software development and technical advisory for companies across Sweden.</p>
    <p>Registered as Regma IT AB, org.nr 559373-8080, with its seat in Gothenburg. More on the <a href="about.html">About</a> page.</p>`
  },
  {
    cat: 'company',
    q: 'Are the jobs on this site real?',
    a: `<p>Roles marked as confirmed vacancies are genuine openings we are actively hiring for.</p>
    <p>Some listings describe the kinds of roles we recruit for on behalf of clients, and are not always live at the moment you read them. If you are unsure whether a specific role is open right now, email <a href="mailto:regmaitab@gmail.com">regmaitab@gmail.com</a> and ask before spending time on an application — we will tell you straight.</p>`
  },
  {
    cat: 'company',
    q: 'Do you hire juniors or career changers?',
    a: `<p>Yes. If a listing asks for more experience than you have but the work genuinely interests you, apply and say where you are in your career.</p>
    <p>Use &ldquo;Write it out&rdquo; to explain your background in your own words — that suits a non-traditional path far better than a CV template does.</p>`
  },
  {
    cat: 'company',
    q: 'I want to report how someone treated me',
    a: `<p>Use the <a href="#report">report form</a> and choose <strong>Conduct or fairness</strong>. You can leave the email field blank and stay entirely anonymous.</p>
    <p>This covers anything from a rude or dismissive exchange to discrimination or a process that felt unfair. It is read by the company owner.</p>
    <p>If you would rather not involve Regma IT at all, discrimination in Swedish recruitment can be reported directly to the Equality Ombudsman (Diskrimineringsombudsmannen) at <a href="https://www.do.se" target="_blank" rel="noopener">do.se</a>.</p>`
  },
];
