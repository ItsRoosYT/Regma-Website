// Supabase Edge Function: notifies Regma (and acknowledges the sender)
// when someone submits the contact form.
//
// Trigger: a Database Webhook on INSERT into `contact_submissions`
// (same setup pattern as application-confirmation — see EMAIL_SETUP.md).
//
// Requires one secret:  RESEND_API_KEY  (from https://resend.com)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

// IMPORTANT: the default sender "onboarding@resend.dev" is Resend's sandbox.
// It can ONLY deliver to the address the Resend account was registered with —
// every other recipient is rejected with 403. That is why an application from
// the account's own gmail got a confirmation and one from yahoo did not.
// Fix: verify regma.se at resend.com/domains, then set the Edge Function
// secret RESEND_FROM to  Regma IT AB <noreply@regma.se>
const FROM = Deno.env.get("RESEND_FROM") ?? "Regma IT AB <onboarding@resend.dev>";
const SANDBOX = FROM.includes("resend.dev");

// Where new-enquiry notifications go. Override with the NOTIFY_EMAIL secret.
const NOTIFY = Deno.env.get("NOTIFY_EMAIL") ?? "djomoi@yahoo.com";

async function send(to: string, subject: string, html: string, replyTo?: string) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set — no email sent to", to);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 403 && SANDBOX) {
      console.error(
        `Resend 403 for ${to}: the sandbox sender ${FROM} can only deliver to the ` +
        `Resend account's own address. Verify regma.se and set the RESEND_FROM secret. ` +
        `Raw: ${detail}`,
      );
    } else {
      console.error("Resend error:", res.status, detail);
    }
    return false;
  }
  return true;
}

const escapeHtml = (s: string) =>
  (s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

serve(async (req) => {
  try {
    const body = await req.json();
    const msg = body.record ?? body;
    const name = escapeHtml(msg?.name || "Unknown");
    const email: string = msg?.email || "";
    const text = escapeHtml(msg?.message || "");

    // 1 — notify Regma, reply-to set to the sender so "Reply" just works
    await send(
      NOTIFY,
      `New enquiry from ${name} — regma.se`,
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2a2620">
        <div style="background:#1d5c45;color:#efe9dc;padding:16px 24px;border-bottom:3px solid #b3862d">
          <strong>New contact message · regma.se</strong>
        </div>
        <div style="padding:24px;font-size:15px;line-height:1.6">
          <p><strong>From:</strong> ${name} &lt;${escapeHtml(email)}&gt;</p>
          <p style="white-space:pre-wrap;background:#f6f4ef;padding:14px 16px;border-radius:8px">${text}</p>
          <p style="color:#6f6a5c;font-size:13px">Reply to this email to answer directly, or manage it in the
          <a href="https://regma.se/admin.html">admin dashboard</a>.</p>
        </div>
      </div>`,
      email || undefined,
    );

    // 2 — acknowledge the sender
    if (email) {
      await send(
        email,
        "We received your message — Regma IT AB",
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2a2620">
          <div style="background:#1d5c45;color:#efe9dc;padding:16px 24px;border-bottom:3px solid #b3862d">
            <strong style="font-size:17px">Regma IT AB</strong>
          </div>
          <div style="padding:24px;font-size:15px;line-height:1.6">
            <p>Hi ${escapeHtml(name.split(" ")[0])},</p>
            <p>Thanks for getting in touch — your message has reached us and we reply to
            every enquiry within one business day.</p>
            <p style="margin-top:22px">Warm regards,<br/><strong>Regma IT AB</strong><br/>
            <span style="color:#6f6a5c;font-size:13px">Angered, Gothenburg · Sweden · Org.nr 559373-8080</span></p>
          </div>
          <div style="padding:12px 24px;background:#f2f1ec;color:#6f6a5c;font-size:12px;border-top:1px solid #e2dbc9">
            Automated confirmation from regma.se — replies to this email reach us.
          </div>
        </div>`,
      );
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    // 200 so the webhook doesn't retry forever on malformed payloads
    return new Response("error logged", { status: 200 });
  }
});
