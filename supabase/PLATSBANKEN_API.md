# Publishing to Platsbanken automatically

Right now a Platsbanken ad means copying about 15 fields by hand into
Arbetsförmedlingen's website, one role at a time.

Arbetsförmedlingen has an **official API** for this, called *Direct
Transferred Job Posting*. Recruitment systems like Teamtailor use it. Once
it's connected, the **↗ Platsbanken** panel in the admin dashboard gets a
**Publish on Platsbanken** button. One click sends the whole ad. The same
panel can also update the ad, take it down, or check its status.

The website code is already written. What's left is paperwork with
Arbetsförmedlingen, then about 15 minutes of setup in Supabase.

> **Until this is done, nothing changes.** The panel still shows the copy
> fields exactly as before, and every other part of the site works normally.

---

## Overview

| Step | Who | How long |
|---|---|---|
| 1. Ask Arbetsförmedlingen to register Regma as a supplier | You or Isaac, by email | They reply in days to weeks |
| 2. Run database migration 006 | You | 2 minutes |
| 3. Deploy the `platsbanken` Edge Function | You | 5 minutes |
| 4. Add the secrets (sandbox first) | You | 5 minutes |
| 5. Isaac enters the consent key on arbetsformedlingen.se | Isaac, with BankID | 2 minutes |
| 6. Send a test ad to the sandbox | You | 2 minutes |
| 7. Switch to production | You | 1 minute |

You can do steps 2 and 3 **today**, before Arbetsförmedlingen replies. The
panel will then check each ad and list anything missing, even before it can
publish.

---

## Step 1 — Email Arbetsförmedlingen

Send this from Isaac's email (djomoi@yahoo.com), since he runs the company.
The address comes from Arbetsförmedlingen's page for the API:
<https://data.arbetsformedlingen.se/dataservice/direct-transferred-job-posting-api/>

**To:** opendata@arbetsformedlingen.se
**Subject:** Registrering som leverantör – Direct Transferred Job Posting API

> Hej,
>
> Vi på Regma IT AB (org.nr 559373-8080) vill registrera oss som leverantör
> för Direct Transferred Job Posting API, så att vi kan publicera våra egna
> platsannonser i Platsbanken direkt från vårt rekryteringssystem på
> regma.se.
>
> Integrationen används endast för Regma IT AB:s egna annonser. Vi har ett
> arbetsgivarkonto hos Arbetsförmedlingen och följer annonseringsvillkoren.
>
> Kan ni skicka det vi behöver för att komma igång, alltså client ID, client
> secret och medgivandenyckel, och berätta om det finns något mer vi behöver
> göra?
>
> Tekniskt kontaktperson: Roosevelt Djomo, rooseveltdjomo81@gmail.com
>
> Med vänliga hälsningar
> Isaac Djomo
> Regma IT AB
> +46 70 508 17 88

They should send back three things. Keep them private, like a password:

- a **client ID**
- a **client secret**
- a **consent key** (*medgivandenyckel*)

If their reply asks for something different, send it to me and I'll adjust.

---

## Step 2 — Run migration 006

1. Go to <https://supabase.com/dashboard> and open the Regma project.
2. In the left sidebar, click **SQL Editor**.
3. Click **+ New query**.
4. On your computer, open `supabase/migrations/006_platsbanken_api.sql`.
   Select everything (Ctrl+A) and copy it (Ctrl+C).
5. Paste it into the editor (Ctrl+V).
6. Click **Run** (bottom right) or press Ctrl+Enter.
7. You should see **"Success. No rows returned"**. That's correct.

It only adds new columns, so it's safe to run more than once.

---

## Step 3 — Deploy the Edge Function

This works the same way as `list-users` and `delete-account` did.

1. In Supabase, click **Edge Functions** in the left sidebar.
2. Click **Deploy a new function**, then **Via Editor**.
3. When it asks for a name, type exactly: `platsbanken`
4. Delete all the example code in the editor.
5. On your computer, open `supabase/functions/platsbanken/index.ts`.
   Copy all of it and paste it into the editor.
6. Click **Deploy function** (bottom right). Wait for the green
   "Successfully deployed" message.

**Check it:** open the admin dashboard, go to **Jobs**, and click
**↗ Platsbanken** on any role marked as a confirmed vacancy. The tag next to
"Publish directly" should now say **WAITING FOR CREDENTIALS** instead of
**NOT SET UP**.

---

## Step 4 — Add the secrets

1. In Supabase: **Edge Functions**, then **Secrets** (in the left submenu,
   or the **Secrets** tab at the top).
2. Add each row below. For each one: type the name, paste the value, then
   click **Save** / **Add**.

| Name | Value |
|---|---|
| `AF_CLIENT_ID` | the client ID from Arbetsförmedlingen |
| `AF_CLIENT_SECRET` | the client secret from Arbetsförmedlingen |
| `AF_EMPLOYER_ID` | Regma's **kundnummer**, digits only (see below) |
| `AF_ENV` | `sandbox` — leave it like this until step 6 works |
| `AF_WORKPLACE_POSTCODE` | the workplace postcode, 5 digits, e.g. `42437` |
| `AF_WORKPLACE_STREET` | the workplace street address, e.g. `Exempelgatan 1` |
| `AF_WORKPLACE_CITY` | `Göteborg` |

**Finding the kundnummer:** Isaac signs in at
<https://arbetsformedlingen.se/for-arbetsgivare> and opens
**Hantera organisation**. It's listed as **Organisationens kundnummer**.

**Workplace address:** this is printed on every ad as the place of work. Use
the address the job is actually based at. I've deliberately left it blank
rather than guess.

New secrets take effect straight away. No redeploy is needed, because the
function reads them on every request.

---

## Step 5 — Isaac gives consent (BankID)

This is what allows Regma's website to publish ads in the company's name.
Only the company can do this, so it has to be Isaac.

1. Go to <https://arbetsformedlingen.se/for-arbetsgivare> and sign in with
   BankID.
2. Open **Annonsera i Platsbanken**.
3. Click **Hantera medgivanden**.
4. Enter the **consent key** from step 1 and confirm.

If you skip this step, publishing will fail with a message about "403" and
"Hantera medgivanden". The panel explains what went wrong.

---

## Step 6 — Test in the sandbox

With `AF_ENV` set to `sandbox`, nothing is shown to the public. Arbetsförmedlingen
checks the ad and replies as if it were real.

1. Admin dashboard, then **Jobs**, then **↗ Platsbanken** at the top.
   This opens the first role that's ready.
2. The tag should say **TEST MODE**.
3. If the panel lists problems, click **Edit position**, fix them and save.
   The usual ones are:
   - **No occupation chosen.** In the form, type into *Yrke för Platsbanken*
     (e.g. "IT-konsult") and pick from the list.
   - **No deadline.** Set *Sista ansökningsdag*, 1–180 days ahead.
   - **Ad text too short.** Platsbanken needs at least 100 characters. Add a
     summary and a few responsibilities.
4. Click **Send test ad (sandbox)**.
5. You should see "Test ad accepted by the sandbox — ad 1000000X".

If Arbetsförmedlingen rejects it, the panel shows the exact field and the
reason. You can also paste the ad into their preview tool to see how it
would look: <https://jobposting-preview.arbetsformedlingen.se/>

---

## Step 7 — Go live

1. Supabase, then **Edge Functions**, then **Secrets**.
2. Change `AF_ENV` from `sandbox` to `prod`.
3. In the admin panel the tag now says **LIVE** in red, and the button reads
   **Publish on Platsbanken**. It asks you to confirm before sending.

From then on, for each role:

- **Publish on Platsbanken** puts the ad live within minutes.
- **Update ad with current text** sends any edits you've made in the
  dashboard.
- **Take the ad down** removes it from Platsbanken.
- **Check status** asks Arbetsförmedlingen whether it's still live.

The **↗ Platsbanken (N ready)** button at the top of the Jobs tab steps
through every confirmed vacancy that isn't on Platsbanken yet.

---

## Safeguards built in

- **Only confirmed vacancies can be published.** The function refuses any
  role without *Confirmed Regma vacancy* ticked. Arbetsförmedlingen's terms
  require ads to be for real jobs, and breaking them can get the employer
  account suspended.
- **Only admins who manage jobs can publish.** This is checked on the server
  from the signed-in account, not in the browser.
- **The credentials never reach a browser.** They live only in Supabase
  secrets.
- **Every ad is checked before it's sent:** deadline 1–180 days ahead, text
  100–6500 characters, title up to 75 characters, occupation chosen.
- **Test ads (sandbox) are never recorded as "posted"**, so the dashboard
  can't claim something is on Platsbanken when it isn't.
