# Email setup — Regma IT AB

Everything needed to make the site send email reliably to **anyone**, not just
to the Resend account owner.

There are two Edge Functions:

| Function | Fires when | Sends |
|---|---|---|
| `application-confirmation` | someone applies for a job | "We've received your application" → the applicant |
| `contact-notification` | someone submits the contact form | "New enquiry" → Regma, plus an acknowledgement → the sender |

---

## ⚠ Read this first — the problem you are actually fixing

`application-confirmation` has been deployed and running for about a month.
It works. But it sends from **`onboarding@resend.dev`**, which is Resend's
**sandbox sender**.

The sandbox sender can only deliver to **the email address the Resend account
was registered with** (`rooseveltdjomo81@gmail.com`). Every other recipient is
rejected with **HTTP 403**, silently.

| Applicant's email | What happens |
|---|---|
| `rooseveltdjomo81@gmail.com` — the Resend account address | delivered ✅ |
| `djomoi@yahoo.com` | 403, nothing sent ❌ |
| Any real applicant | 403, nothing sent ❌ |

This was never a Yahoo problem or a spam-folder problem. **Until regma.se is
verified in Resend, no real applicant can receive anything.**

Verifying the domain (Part 1 below) is the single step that fixes it.

---

## Part 1 — Verify regma.se in Resend

**Time:** ~10 minutes of clicking, then 15 minutes to 24 hours for DNS to
propagate (usually well under an hour with Loopia).

1. Sign in at **https://resend.com**.
2. Go to **Domains** in the left sidebar → **Add Domain**.
3. Enter `regma.se`. Choose the region closest to Sweden (**eu-west-1** /
   Ireland) if asked.
4. Resend now shows a table of DNS records — typically:
   - one **MX** record (for the `send` subdomain)
   - one or two **TXT** records (SPF, and DMARC if offered)
   - one **TXT** or **CNAME** record for **DKIM** (a long key)

   Leave this page open. You need to copy these exactly.

5. In a second tab, sign in to **Loopia** (https://www.loopia.se → Logga in).
6. Go to **Mina tjänster / Mina domäner** → click **regma.se** → open the
   **DNS-redigerare** (DNS editor).
7. Add each record Resend listed. For every record:
   - **Subdomän / Namn** — Resend shows something like `send.regma.se` or
     `resend._domainkey.regma.se`. Loopia usually wants only the part *before*
     `.regma.se`, so enter `send` or `resend._domainkey`. If Resend shows `@`,
     that means the root domain — in Loopia that is the domain itself with no
     subdomain.
   - **Typ** — MX, TXT or CNAME, exactly as Resend states.
   - **Värde / Data** — paste exactly. DKIM keys are long; copy the whole
     string with no line breaks and no added spaces.
   - **Prioritet** — only for MX. Use the number Resend gives (often `10`).
   - **TTL** — leave the Loopia default.

   > These are **mail** records. They do not touch the website, and adding
   > them cannot take regma.se offline.

8. Save in Loopia, go back to Resend and press **Verify DNS Records**.
   If it says pending, wait 15 minutes and press it again.
9. Done when the domain shows **Verified** ✅.

**Common snag:** Loopia sometimes appends the domain automatically. If you
enter `send.regma.se` you can end up with `send.regma.se.regma.se`. If
verification keeps failing, look at the saved records in Loopia and check for
a doubled domain.

---

## Part 2 — Get your API key

1. Resend → **API Keys** → **Create API Key**.
2. Name it `regma-site`, permission **Sending access**.
3. Copy it (starts with `re_`). You only see it once.

> **Rotate the old key.** A previous key was pasted in plain text in chat and
> should be considered compromised. Delete it in Resend → API Keys → the old
> key → Delete, and use the new one everywhere below.

---

## Part 3 — Deploy the functions

For each of the two functions:

1. Supabase dashboard → your project → **Edge Functions** (left sidebar).
2. **Deploy a new function** → **Via Editor** (or "Create a new function").
3. **Name it exactly:**
   - `application-confirmation`
   - `contact-notification`

   The name becomes the URL, and the webhook in Part 5 refers to it. A typo
   here means the webhook silently points at nothing.
4. Delete the placeholder code in the editor and paste the entire contents of:
   - `supabase/functions/application-confirmation/index.ts`
   - `supabase/functions/contact-notification/index.ts`
5. Click **Deploy**.

`application-confirmation` already exists — open it, replace its code with the
current version from this repo, and redeploy. The new version reads the
`RESEND_FROM` secret and logs a clear message on a 403.

---

## Part 4 — Set the secrets

Supabase → **Edge Functions** → **Secrets** (may be under *Project Settings →
Edge Functions → Secrets* depending on dashboard version) → **Add new secret**.

| Name | Value | Why |
|---|---|---|
| `RESEND_API_KEY` | your `re_…` key | authenticates with Resend |
| `RESEND_FROM` | `Regma IT AB <noreply@regma.se>` | **the fix** — leaves the sandbox sender behind |
| `NOTIFY_EMAIL` | `djomoi@yahoo.com` | where contact enquiries are sent |

Names are case-sensitive. Secrets apply to all functions in the project, so
you set them once, not per function.

If `RESEND_FROM` is missing, both functions fall back to the sandbox sender —
i.e. back to the broken behaviour. That fallback is deliberate (nothing
crashes), but it means **the secret is what actually switches it on**.

You do not need to redeploy after adding secrets; functions read them at
runtime on the next invocation.

---

## Part 5 — Wire up the triggers

Supabase → **Database** → **Webhooks** → **Create a new hook**.

**Hook 1 — applications** (this may already exist; check first)

| Field | Value |
|---|---|
| Name | `on-application-created` |
| Table | `applications` |
| Events | **Insert** only |
| Type | Supabase Edge Functions |
| Edge Function | `application-confirmation` |
| Method | POST |

**Hook 2 — contact form** (new)

| Field | Value |
|---|---|
| Name | `on-contact-created` |
| Table | `contact_submissions` |
| Events | **Insert** only |
| Type | Supabase Edge Functions |
| Edge Function | `contact-notification` |
| Method | POST |

Do not tick Update or Delete — you would email people again every time you
mark a message as read.

---

## Part 6 — Test it properly

Test with an address that is **not** the Resend account's gmail. That is the
whole point — the gmail worked before and proves nothing.

1. **Contact form:** open https://regma.se/contact.html, submit using your
   dad's yahoo address, or any other address you can check.
   - Expect: an acknowledgement to that address, **and** a "New enquiry"
     email at `NOTIFY_EMAIL`.
   - The message should also appear in the admin dashboard inbox
     (requires `003_admin_inbox.sql` — see below).
2. **Application:** apply for a role from a non-gmail account.
   - Expect: "We've received your application".

### If nothing arrives

Supabase → **Edge Functions** → the function → **Logs**. Look at the most
recent invocation.

| Log line | Meaning | Fix |
|---|---|---|
| `Resend 403 … sandbox sender … only delivers to the Resend account's own address` | `RESEND_FROM` is not set, or the domain is not verified yet | finish Part 1, then set the secret in Part 4 |
| `RESEND_API_KEY is not set` | secret missing or misspelled | Part 4 — check exact spelling |
| No invocation logged at all | the webhook never fired | Part 5 — check the table name and that the function name matches exactly |
| `Resend error: 422` | the `from` address is not on a verified domain | the domain in `RESEND_FROM` must be the one you verified |

Also check Resend → **Emails**, which lists every send attempt and its status.
That distinguishes "Resend refused it" from "Resend sent it and the mailbox
filtered it".

---

## Related: make messages visible in the admin dashboard

Separate from email. The contact form has been **saving** messages correctly,
but row-level security hides them from the dashboard — it returns zero rows
with no error, so the dashboard honestly believes the inbox is empty.

Run **`supabase/migrations/003_admin_inbox.sql`** once in
Supabase → **SQL Editor** → **New query** → paste → **Run**.

It adds admin read policies for `contact_submissions`, `applications` and
`newsletter_subscribers`, adds the new/read/archived status column, and
deletes the diagnostic row used while investigating.

Also outstanding: **`002_platsbanken_fields.sql`**, which adds the job
deadline and Platsbanken columns the admin panel expects.

---

## Changing the email wording later

Both functions build plain HTML strings — edit the `html` template inside the
function and redeploy. The brand colours used are:

| Colour | Hex |
|---|---|
| Forest green header | `#1d5c45` |
| Brass rule | `#b3862d` |
| Body text | `#2a2620` |
| Muted text | `#6f6a5c` |

---

## Turning on "Confirm email" (do this LAST)

**Order matters.** Enabling confirmation before custom SMTP is configured
locks every new applicant out — Supabase's built-in mailer refuses to
deliver to anyone outside the project team.

1. **Configure custom SMTP first**
   Authentication → Emails → SMTP Settings:

   | Field | Value |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` (literally this word) |
   | Password | your Resend API key |
   | Sender email | `noreply@regma.se` |
   | Sender name | `Regma IT AB` |

2. **Brand the email**
   Authentication → Emails → **Confirm signup** → paste
   `supabase/email-templates/confirm-signup.html`. The default template is
   plain text and reads like spam; this one matches the site.

3. **Allow the landing page**
   Authentication → URL Configuration → **Redirect URLs**, add:
   - `https://regma.se/confirmed.html`
   - `https://regma.se/portal.html`

   Without this Supabase refuses the redirect and the link dead-ends.

4. **Send yourself a test signup** with an address that is not the Resend
   account address. Confirm the email arrives, the button works, and you
   land on the branded confirmation page.

5. **Only then** turn on Authentication → Sign In / Providers →
   **Confirm email**.

### Why bother
With it off, anyone can register using an address they do not own —
including your dad's, or a client's — and then apply as that person.
