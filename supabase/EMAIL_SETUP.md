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

## Why one address got "a confirmation" and another didn't

Neither of these functions was deployed yet, so **no application or contact
emails have ever been sent**. The email the gmail account received was
Supabase's *account sign-up* confirmation (from mail.app.supabase.io), which
only arrives the first time an account is created. Yahoo very often puts
mail.app.supabase.io in the spam folder — check there. Once regma.se is
verified in Resend and FROM is switched to noreply@regma.se, deliverability
to Yahoo/Hotmail improves substantially.
