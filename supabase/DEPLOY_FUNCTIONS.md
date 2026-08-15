# Deploying an Edge Function — click by click

Written assuming nothing. If you have never opened the Supabase dashboard
before, start at step 1 and do not skip anything.

There are two functions this site uses:

| Function name | What it does |
|---|---|
| `application-confirmation` | emails an applicant "we've received your application" |
| `contact-notification` | emails you when someone uses the contact form, and acknowledges them |

The steps are identical for both. Only the **name** and the **pasted code**
differ.

---

## Part A — Get to the Edge Functions screen

1. Open a browser and go to **https://supabase.com/dashboard**
2. Sign in if it asks. Use the account that owns the Regma project.
3. You now see a list of projects. Click the Regma project.
   (The URL will contain `flprvubcekattilqvyms` — that is the project ID.)
4. Look at the **left sidebar**. It is a vertical list of icons and words:
   Table Editor, SQL Editor, Database, Authentication, Storage,
   **Edge Functions**, Realtime, Reports, Logs, API Docs, Project Settings.
5. Click **Edge Functions**.

You should now see a page titled **Edge Functions** with a list of any
functions that already exist.

> **If the sidebar is collapsed to icons only**, hover over them — Edge
> Functions is the icon that looks like a lightning bolt or a small box.
> There is also a `>` button at the bottom of the sidebar to expand it.

---

## Part B — Create the function

6. Find the button in the top right. Depending on your dashboard version it
   says **Deploy a new function**, **Create a new function**, or just
   **+ New function**. Click it.
7. A menu or dialog appears offering how you want to create it. Choose
   **Via Editor** (sometimes written "Create via editor" or "Editor").
   *Do not* choose "Via CLI" — that needs software installed on your computer.
8. A **name field** appears. Type the function name **exactly**, all lowercase,
   with hyphens, no spaces:

   ```
   application-confirmation
   ```

   > The name becomes part of the URL and the webhook finds the function by
   > this name. `application_confirmation` or `Application-Confirmation` will
   > not work — it will fail silently, with no error anywhere.

9. Below the name is a **code editor** containing example code
   (usually something with "Hello World").
10. Click anywhere inside that code editor.
11. Select **all** of the existing code:
    - Windows: press `Ctrl` + `A`
    - Mac: press `Cmd` + `A`
12. Press `Delete` or `Backspace`. The editor should now be completely empty.
13. Paste the function code (the full block from the chat, or from
    `supabase/functions/application-confirmation/index.ts` in this repo):
    - Windows: `Ctrl` + `V`
    - Mac: `Cmd` + `V`
14. Check the first line reads:

    ```
    import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
    ```

    If it doesn't, the paste didn't take — repeat 11–13.

15. Click **Deploy function** (bottom right, sometimes just **Deploy**).
16. Wait. It takes roughly 10–30 seconds. When it finishes you are taken to
    the function's own page and it shows a green **Active** or **Deployed**
    status.

---

## Part C — Confirm the secrets are there

The function reads three values that are stored separately from the code.
Deleting a function does **not** delete these, but check them anyway.

17. Still in **Edge Functions**, look for **Secrets** in the sub-menu at the
    top of the page, or in the left sidebar under Edge Functions.
    (In some versions: **Project Settings → Edge Functions → Secrets**.)
18. You should see all three of these listed:

    | Name | Value it should hold |
    |---|---|
    | `RESEND_API_KEY` | your Resend API key, starting `re_` |
    | `RESEND_FROM` | `Regma IT AB <noreply@regma.se>` |
    | `NOTIFY_EMAIL` | `djomoi@yahoo.com` |

19. If any are missing, click **Add new secret**, type the name in the first
    box and the value in the second, click Save. Names are case-sensitive.

> You do **not** need to redeploy after changing a secret — but the deployed
> code must be a version that *reads* the secret. The code in Part B does.

---

## Part D — Connect it to the database

The function does nothing on its own. A **webhook** runs it whenever a new
row is added to a table.

20. In the **left sidebar**, click **Database**.
21. In the sub-menu that appears, click **Webhooks**.
22. Look for an entry called `on-application-created`.

    - **If it exists** and shows no error, you are done — skip to Part E.
    - **If it is missing**, or shows an error, continue to step 23.

23. Click **Create a new hook** (top right).
24. Fill the form in exactly:

    | Field | What to enter |
    |---|---|
    | Name | `on-application-created` |
    | Table | choose **applications** from the dropdown |
    | Events | tick **Insert** only — leave Update and Delete unticked |
    | Type of webhook | choose **Supabase Edge Functions** |
    | Edge Function | choose **application-confirmation** from the dropdown |
    | Method | `POST` |

    > Ticking Update or Delete would email people again every time you change
    > an application's status. Insert only.

25. Click **Create webhook**.

---

## Part E — Test that it actually works

26. Open **https://regma.se/career.html** in a **private/incognito window**
    (so you are not signed in as yourself).
27. Create an account using an email address that is **not**
    `rooseveltdjomo81@gmail.com`. That address is the Resend account address
    and it worked even when everything else was broken — testing with it
    proves nothing.
28. Apply for any position.
29. Check that inbox. Within a minute you should have
    "We've received your application — Regma IT AB".

**Look at who it is from. That single detail tells you everything:**

| From address | Meaning |
|---|---|
| `noreply@regma.se` | working correctly ✅ |
| `onboarding@resend.dev` | old code is still deployed — redo Part B |
| nothing arrives at all | see below |

---

## If nothing arrives

30. Go to **Edge Functions** → click **application-confirmation** → click the
    **Logs** tab.
31. Look at the most recent entry:

| What the log says | What it means | Fix |
|---|---|---|
| `Resend 403 … sandbox sender … only delivers to the Resend account's own address` | `RESEND_FROM` isn't set, or the deployed code doesn't read it | Part C, then redo Part B |
| `RESEND_API_KEY is not set` | secret missing or misspelled | Part C |
| **no entries at all** | the webhook never ran the function | Part D |
| `Resend error: 422` | the from-address domain isn't verified in Resend | check regma.se shows Verified at resend.com/domains |

32. You can also check **https://resend.com → Emails**. That lists every
    send attempt Resend received and whether it was delivered. If the
    attempt isn't listed there at all, the problem is on the Supabase side
    (steps 30–31). If it is listed but failed, the reason is shown there.

---

## Doing the second function

Repeat Parts A–D for `contact-notification`, with these differences:

- **Step 8** — the name is `contact-notification`
- **Step 13** — paste the code from
  `supabase/functions/contact-notification/index.ts`
- **Step 24** — the webhook is:

  | Field | Value |
  |---|---|
  | Name | `on-contact-created` |
  | Table | **contact_submissions** |
  | Events | **Insert** only |
  | Type | Supabase Edge Functions |
  | Edge Function | **contact-notification** |
  | Method | `POST` |

- **Test** by sending a message through https://regma.se/contact.html.
  You should get a "New enquiry" email at `NOTIFY_EMAIL`, and the sender
  should get an acknowledgement.

---

## Things that are safe to do

- **Deleting a function does not delete any data.** Applications, messages
  and CVs live in the database and storage, untouched.
- **Redeploying is safe** and can be done as often as you like.
- **A failed webhook never blocks the website.** If the function is broken or
  missing, applications still save correctly — only the email is skipped.
