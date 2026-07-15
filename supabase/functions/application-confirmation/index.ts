// Supabase Edge Function: sends an automatic confirmation email to an
// applicant right after they submit an application.
//
// Trigger: a Database Webhook on INSERT into the `applications` table
// (see setup steps in supabase/EMAIL_SETUP.md).
//
// Requires one secret:  RESEND_API_KEY  (from https://resend.com)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// Once regma.se is verified in Resend, send from your own domain.
// Until then you can use "onboarding@resend.dev" (only delivers to your own address).
const FROM = "Regma IT AB <noreply@regma.se>";

serve(async (req) => {
  try {
    const body = await req.json();
    // Supabase webhook payload puts the new row under `record`
    const app = body.record ?? body;
    const email: string = app?.email;
    const name: string = (app?.name || "there").split(" ")[0];
    const role: string = app?.role || "the position you applied for";

    if (!email) return new Response("No email on record", { status: 200 });

    const html = `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#2a2620">
        <div style="background:#1d5c45;color:#efe9dc;padding:20px 24px;border-bottom:3px solid #b3862d">
          <strong style="font-size:18px;letter-spacing:.5px">Regma IT AB</strong>
        </div>
        <div style="padding:28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6">
          <p>Hi ${name},</p>
          <p>Thank you for applying for <strong>${role}</strong> at Regma IT AB.</p>
          <p>We've received your application and it's now with our team. We review every
          application personally and will reach out to you as soon as possible regarding
          the next steps.</p>
          <p>If you have any questions in the meantime, just reply to this email.</p>
          <p style="margin-top:24px">Warm regards,<br/>
          <strong>The Regma IT AB Team</strong><br/>
          <span style="color:#6f6a5c;font-size:13px">Angered, Gothenburg · Sweden</span></p>
        </div>
        <div style="padding:14px 24px;background:#f2f1ec;color:#6f6a5c;font-size:12px;font-family:Arial,sans-serif;border-top:1px solid #e2dbc9">
          This is an automated confirmation from regma.se — no action is needed.
        </div>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "We've received your application — Regma IT AB",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response("Email failed: " + err, { status: 200 }); // 200 so the insert isn't affected
    }
    return new Response("Confirmation sent", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Error: " + (e as Error).message, { status: 200 });
  }
});
