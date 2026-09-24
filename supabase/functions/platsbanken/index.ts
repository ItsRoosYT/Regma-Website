// Supabase Edge Function: publishes Regma job ads straight to Platsbanken
// through Arbetsförmedlingen's official "Direct Transferred Job Posting" API.
//
// This replaces copying ~15 fields by hand into the Platsbanken website.
//
// Actions (POST body { action, jobId }):
//   config    — is the integration set up, and sandbox or production?
//   preview   — build the ad and list every problem, WITHOUT sending anything
//   publish   — create the ad on Platsbanken
//   update    — push edits to an ad that is already published
//   unpublish — take the ad down
//   status    — ask Arbetsförmedlingen for the ad's current status
//
// Secrets (Supabase → Edge Functions → Secrets):
//   AF_CLIENT_ID, AF_CLIENT_SECRET  — given to Regma when registered as a supplier
//   AF_EMPLOYER_ID                  — "Organisationens kundnummer" (digits only)
//   AF_ENV                          — "sandbox" (default) or "prod"
//   AF_WORKPLACE_STREET, AF_WORKPLACE_POSTCODE, AF_WORKPLACE_CITY
//                                   — the workplace address shown on the ad
//
// API documentation:
//   https://data.arbetsformedlingen.se/documents/jobposting/DirectTransferredJobPostingAPIdocumentation.pdf

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OWNER_EMAIL = "rooseveltdjomo81@gmail.com";

const AF_CLIENT_ID = Deno.env.get("AF_CLIENT_ID") ?? "";
const AF_CLIENT_SECRET = Deno.env.get("AF_CLIENT_SECRET") ?? "";
const AF_EMPLOYER_ID = (Deno.env.get("AF_EMPLOYER_ID") ?? "").replace(/\D/g, "");
const AF_ENV = (Deno.env.get("AF_ENV") ?? "sandbox") === "prod" ? "prod" : "sandbox";
const WORKPLACE = {
  street: Deno.env.get("AF_WORKPLACE_STREET") ?? "",
  postalCode: (Deno.env.get("AF_WORKPLACE_POSTCODE") ?? "").replace(/\D/g, ""),
  city: Deno.env.get("AF_WORKPLACE_CITY") ?? "Göteborg",
};

const AF_BASE = `https://apier.arbetsformedlingen.se/direct-transferred-job-posting/v1/${AF_ENV}/jobads`;

// Company details used on every ad
const COMPANY = {
  name: "Regma IT AB",
  web: "https://regma.se",
  responsibleEmail: "regmaitab@gmail.com",
  contact: { firstname: "Isaac", surname: "Djomo", title: "VD", email: "regmaitab@gmail.com", phoneNumber: "+46705081788" },
};

// Taxonomy concept IDs (JobTech taxonomy, fetched 2026-09-19)
const TAX = {
  employmentType: { regular: "PFZr_Syz_cUq", summer: "Jh8f_q9J_pbJ", onCall: "1paU_aCR_nGn" },
  duration: { permanent: "a7uU_j21_mkL", sixPlus: "qQUd_4qe_NDT", threeToSix: "Xj7x_7yZ_jEn", upToThree: "Sy9J_aRd_ALx", tenDays: "cAQ8_TpB_Tdv" },
  extent: { full: "6YE1_gAC_R2G", part: "947z_JGS_Uk2" },
  wageFixed: "oG8G_9cW_nRf",
  municipality: { "göteborg": "PVZL_BQT_XtL", "gothenburg": "PVZL_BQT_XtL" } as Record<string, string>,
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not signed in" }, 401);

    const db = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Caller identity comes from the verified token, never from the body
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return json({ error: "Invalid session" }, 401);

    let allowed = user.email === OWNER_EMAIL;
    if (!allowed) {
      const { data: row } = await db.from("admins").select("*").eq("email", user.email).maybeSingle();
      allowed = !!row && row.is_active !== false && row.can_manage_jobs !== false;
    }
    if (!allowed) return json({ error: "Only administrators who manage jobs can publish to Platsbanken" }, 403);

    const { action, jobId } = await req.json().catch(() => ({}));

    const missingConfig = [
      !AF_CLIENT_ID && "AF_CLIENT_ID",
      !AF_CLIENT_SECRET && "AF_CLIENT_SECRET",
      !AF_EMPLOYER_ID && "AF_EMPLOYER_ID",
      WORKPLACE.postalCode.length !== 5 && "AF_WORKPLACE_POSTCODE",
    ].filter(Boolean) as string[];

    if (action === "config") {
      return json({ configured: missingConfig.length === 0, missing: missingConfig, env: AF_ENV });
    }

    if (!jobId) return json({ error: "jobId is required" }, 400);
    const { data: job, error: jobErr } = await db.from("jobs").select("*").eq("id", jobId).maybeSingle();
    if (jobErr || !job) return json({ error: "Job not found" }, 404);

    const { payload, problems } = buildPayload(job);

    if (action === "preview") {
      return json({ payload, problems, env: AF_ENV, configured: missingConfig.length === 0, missing: missingConfig });
    }

    if (missingConfig.length) {
      return json({ error: "Platsbanken is not connected yet. Missing secrets: " + missingConfig.join(", ") }, 400);
    }

    const headers = {
      "accept": "application/json",
      "content-type": "application/json",
      "Employer-Id": AF_EMPLOYER_ID,
      "client_id": AF_CLIENT_ID,
      "client_secret": AF_CLIENT_SECRET,
    };

    const save = (patch: Record<string, unknown>) =>
      db.from("jobs").update({ ...patch, af_last_sync: new Date().toISOString() }).eq("id", jobId);

    if (action === "publish" || action === "update") {
      if (problems.length) return json({ error: "Fix these first", problems }, 422);
      if (action === "publish" && job.af_ad_id) {
        return json({ error: "Already on Platsbanken (ad " + job.af_ad_id + "). Use Update instead." }, 409);
      }
      if (action === "update" && !job.af_ad_id) return json({ error: "This role has not been published yet." }, 409);

      const res = await fetch(action === "publish" ? AF_BASE : `${AF_BASE}/${job.af_ad_id}`, {
        method: action === "publish" ? "POST" : "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      const body = await res.text();
      if (!res.ok) {
        const msg = explainAfError(res.status, body);
        await save({ af_last_error: msg });
        return json({ error: msg, status: res.status }, 502);
      }
      const patch: Record<string, unknown> = { af_last_error: null, af_status: "PUBLISHED" };
      if (action === "publish") {
        const id = String(JSON.parse(body).id);
        Object.assign(patch, {
          af_ad_id: id,
          af_env: AF_ENV,
          // Only real (production) ads count as "posted"
          ...(AF_ENV === "prod" ? { posted_to_af: true, posted_to_af_at: new Date().toISOString() } : {}),
        });
      }
      await save(patch);
      return json({ ok: true, env: AF_ENV, ...patch });
    }

    if (action === "unpublish" || action === "status") {
      if (!job.af_ad_id) return json({ error: "This role has no Platsbanken ad." }, 409);
      const res = await fetch(`${AF_BASE}/${job.af_ad_id}${action === "status" ? "/status" : ""}`, {
        method: action === "status" ? "GET" : "DELETE",
        headers,
      });
      const body = await res.text();
      if (!res.ok) {
        const msg = explainAfError(res.status, body);
        await save({ af_last_error: msg });
        return json({ error: msg, status: res.status }, 502);
      }
      const status = action === "status" ? (JSON.parse(body).status ?? "UNKNOWN") : "UNPUBLISHED";
      await save({ af_status: status, af_last_error: null });
      return json({ ok: true, status });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

// ── Build the Arbetsförmedlingen payload from a jobs row ───────────
// deno-lint-ignore no-explicit-any
function buildPayload(j: any) {
  const problems: string[] = [];
  const lower = (s: unknown) => String(s ?? "").toLowerCase();

  if (!j.verified_opening) {
    problems.push('Not marked as a confirmed Regma vacancy. Tick "Confirmed Regma vacancy" in Edit — only real openings may go on Platsbanken.');
  }
  if (!j.af_occupation_id) {
    problems.push('No occupation chosen. In Edit, search "Yrke för Platsbanken" and pick the closest match.');
  }

  // Deadline: 1–180 days ahead
  let lastPublishDate = j.application_deadline ?? "";
  if (!lastPublishDate) {
    problems.push("No application deadline (sista ansökningsdag). Set one in Edit — at most 180 days ahead.");
  } else {
    const days = (Date.parse(lastPublishDate + "T12:00:00Z") - Date.now()) / 86_400_000;
    if (days < 1) problems.push("The deadline must be at least one day in the future.");
    if (days > 180) problems.push("The deadline can be at most 180 days ahead.");
  }

  // Employment type / duration / extent (text fields → taxonomy IDs)
  const typeText = lower(j.type) + " " + lower(j.duration);
  let employmentType = TAX.employmentType.regular;
  if (/sommar|summer|ferie/.test(typeText)) employmentType = TAX.employmentType.summer;
  if (/behov|on.?call|timanst/.test(typeText)) employmentType = TAX.employmentType.onCall;

  let duration: string | null = TAX.duration.permanent;
  const d = lower(j.duration);
  if (/10 dag|10 day/.test(d)) duration = TAX.duration.tenDays;
  else if (/3 ?- ?6|3–6/.test(d)) duration = TAX.duration.threeToSix;
  else if (/11 dag|upp till 3|up to 3|< ?3/.test(d)) duration = TAX.duration.upToThree;
  else if (/6 mån|6 month|visstid|fixed|temporary|tidsbegr/.test(d)) duration = TAX.duration.sixPlus;
  if (employmentType === TAX.employmentType.summer && duration === TAX.duration.permanent) duration = TAX.duration.upToThree;

  let worktimeExtent: string | null = /del|part/.test(lower(j.extent) + " " + lower(j.type)) ? TAX.extent.part : TAX.extent.full;
  if (employmentType === TAX.employmentType.onCall) { duration = null; worktimeExtent = null; }

  const municipality = TAX.municipality[lower(j.location).trim()] ?? TAX.municipality["göteborg"];
  if (!TAX.municipality[lower(j.location).trim()] && j.location) {
    problems.push(`Location "${j.location}" is published as Göteborg. Only Göteborg is mapped so far.`);
  }

  const description = buildDescription(j);
  const plainLength = description.replace(/<[^>]+>/g, "").length;
  if (plainLength < 100) problems.push(`The ad text is only ${plainLength} characters; Platsbanken requires at least 100. Add a summary, responsibilities or requirements.`);
  if (plainLength > 6500) problems.push(`The ad text is ${plainLength} characters; the maximum is 6500.`);

  const title = String(j.title ?? "").trim();
  if (!title) problems.push("The role has no title.");
  if (title.length > 75) problems.push(`The title is ${title.length} characters; Platsbanken allows 75.`);

  const contactEmail = j.contact_email || COMPANY.contact.email;
  const payload = {
    jobAdResponsibleEmail: COMPANY.responsibleEmail,
    employerWebAddress: COMPANY.web,
    contacts: [{
      firstname: j.contact_name ? String(j.contact_name).split(" ")[0] : COMPANY.contact.firstname,
      surname: j.contact_name ? (String(j.contact_name).split(" ").slice(1).join(" ") || "-") : COMPANY.contact.surname,
      title: COMPANY.contact.title,
      email: contactEmail,
      phoneNumber: (j.contact_phone || COMPANY.contact.phoneNumber).replace(/\s+/g, ""),
    }],
    employmentType,
    duration,
    worktimeExtent,
    wageType: TAX.wageFixed,
    eures: false,
    title: title.slice(0, 75),
    description,
    lastPublishDate,
    totalJobOpenings: Math.max(1, Math.min(499, Number(j.positions) || 1)),
    occupation: j.af_occupation_id ?? "",
    application: {
      method: {
        webAddress: `https://regma.se/career.html?job=${j.id}`,
        email: contactEmail,
      },
      reference: String(j.id).slice(0, 8),
    },
    workplaces: [{
      name: COMPANY.name,
      municipality,
      postalAddress: {
        ...(WORKPLACE.street ? { street: WORKPLACE.street } : {}),
        postalCode: WORKPLACE.postalCode,
        city: WORKPLACE.city,
      },
    }],
  };

  return { payload, problems };
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// deno-lint-ignore no-explicit-any
function buildDescription(j: any) {
  const list = (s: unknown) => {
    const items = String(s ?? "").split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    return items.length ? "<ul>" + items.map((i) => `<li>${esc(i)}</li>`).join("") + "</ul>" : "";
  };
  const parts: string[] = [];
  if (j.summary) parts.push(`<p>${esc(j.summary)}</p>`);
  parts.push("<p><strong>Om Regma IT AB</strong></p>");
  parts.push("<p>Regma IT AB är ett IT-konsultbolag i Angered, Göteborg. Vi arbetar med IT-konsultation, systemutveckling och teknisk rådgivning åt företag i hela Sverige.</p>");
  if (j.responsibilities) parts.push("<p><strong>Arbetsuppgifter</strong></p>" + list(j.responsibilities));
  if (j.requirements) parts.push("<p><strong>Kvalifikationer</strong></p>" + list(j.requirements));
  if (j.nice_to_have) parts.push("<p><strong>Meriterande</strong></p>" + list(j.nice_to_have));
  if (j.salary) parts.push(`<p><strong>Lön</strong></p><p>${esc(j.salary)}</p>`);
  parts.push(`<p><strong>Ansökan</strong></p><p>Ansök via regma.se/career.html?job=${esc(j.id)} eller e-post till ${esc(j.contact_email || COMPANY.contact.email)}. Vi läser ansökningar löpande.</p>`);
  return parts.join("");
}

// Turn Arbetsförmedlingen's error body into something a person can act on
function explainAfError(status: number, body: string) {
  try {
    const parsed = JSON.parse(body);
    const errs = parsed?.cause?.message?.errors ?? [];
    if (errs.length) {
      // deno-lint-ignore no-explicit-any
      return "Arbetsförmedlingen rejected: " + errs.map((e: any) => `${e.field}: ${e.message}`).join("; ");
    }
    const m = parsed?.cause?.message?.message ?? parsed?.message;
    if (m) return `Arbetsförmedlingen (${status}): ${m}`;
  } catch { /* not JSON */ }
  if (status === 401) return "Arbetsförmedlingen rejected the credentials (401). Check AF_CLIENT_ID and AF_CLIENT_SECRET.";
  if (status === 403) return "Arbetsförmedlingen refused (403). Has the consent key been entered under 'Hantera medgivanden', and is AF_EMPLOYER_ID the right kundnummer?";
  if (status === 503) return "Arbetsförmedlingen is temporarily unavailable (503). Try again in a few minutes.";
  return `Arbetsförmedlingen returned ${status}: ${body.slice(0, 300)}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
