# Auto-response email setup

When someone submits a job application, they automatically get a branded
confirmation email ("We've received your application…"). Here's the one-time setup.

## 1. Create a Resend account (free)
- Go to https://resend.com and sign up (free tier: 3,000 emails/month).
- **Verify your domain** so email comes from `noreply@regma.se`:
  - In Resend → **Domains → Add Domain → `regma.se`**.
  - Resend shows a few DNS records (SPF, DKIM). Add them in **Loopia** DNS
    for regma.se (same place you added the website records). These are TXT/CNAME
    records for email and do **not** affect the website.
  - Wait until Resend shows the domain as **Verified**.
- Go to **API Keys → Create API Key**, copy it (starts with `re_...`).

> Not ready to verify the domain? You can test first by editing `FROM` in
> `application-confirmation/index.ts` to `onboarding@resend.dev` — but that only
> delivers to your own Resend account email. Switch to `noreply@regma.se` once verified.

## 2. Deploy the Edge Function
In the Supabase dashboard:
- **Edge Functions → Create a new function** → name it `application-confirmation`.
- Paste the contents of `supabase/functions/application-confirmation/index.ts`.
- Click **Deploy**.
- Go to **Edge Functions → Secrets** (or Project Settings → Edge Functions) and add:
  - `RESEND_API_KEY` = the key you copied from Resend.

## 3. Fire it when an application is submitted
In the Supabase dashboard:
- **Database → Webhooks → Create a new hook**
  - Name: `on-application-created`
  - Table: `applications`
  - Events: **Insert**
  - Type: **Supabase Edge Functions** → select `application-confirmation`
  - Save.

That's it. Submit a test application on the site — the confirmation email
should arrive within a few seconds.

## Editing the email text
Open `supabase/functions/application-confirmation/index.ts`, edit the `html`
block (greeting, wording, signature), and redeploy the function.

---

## Contact form notifications (contact-notification)

Same pattern, second function. When someone sends the contact form:
- **You** get a "New enquiry from …" email at djomoi@yahoo.com, with
  reply-to set to the sender — pressing Reply answers them directly.
- **They** get a "we received your message" acknowledgement.

Setup (after step 1 above is done once):
1. **Edge Functions → Create function** → name `contact-notification`,
   paste `supabase/functions/contact-notification/index.ts`, Deploy.
2. **Database → Webhooks → Create**: table `contact_submissions`,
   event **Insert**, type **Edge Function** → `contact-notification`.

---

## ⚠ Why yahoo got no confirmation but gmail did

**This is the single most important thing on this page.**

Both functions default to sending `from: onboarding@resend.dev`. That is
Resend's **sandbox sender**, and it can only deliver to the email address the
Resend account was registered with (`rooseveltdjomo81@gmail.com`). Every other
recipient is rejected with **HTTP 403** — silently, from the applicant's point
of view.

So:

| Applicant's email | Result |
|---|---|
| rooseveltdjomo81@gmail.com (the Resend account address) | delivered ✅ |
| djomoi@yahoo.com — or any real applicant | 403, never sent ❌ |

It was never a Yahoo problem or a spam-folder problem. Until the domain is
verified, **no real applicant can ever receive a confirmation.**

The same applies to `contact-notification`: it tries to notify
`djomoi@yahoo.com`, which the sandbox sender cannot reach either.

### The fix (one-time, ~20 minutes plus DNS propagation)

1. **Resend → Domains → Add Domain → `regma.se`.**
2. Add the SPF/DKIM records Resend shows into **Loopia** DNS for regma.se.
   These are TXT/CNAME records for mail and do not affect the website.
3. Wait for Resend to show **Verified**.
4. **Supabase → Edge Functions → Secrets**, add:

   | Secret | Value |
   |---|---|
   | `RESEND_FROM` | `Regma IT AB <noreply@regma.se>` |
   | `NOTIFY_EMAIL` | `djomoi@yahoo.com` (where enquiries are sent) |

No code change is needed — both functions read these at runtime and fall back
to the sandbox sender if they are absent.

### Checking it worked
Supabase → Edge Functions → your function → **Logs**. A 403 logs an explicit
message naming the sandbox sender as the cause. Success logs nothing unusual.
