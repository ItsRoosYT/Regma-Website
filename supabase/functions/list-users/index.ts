// Supabase Edge Function: returns the list of registered accounts for the
// admin dashboard, plus a few counts.
//
// Listing auth users requires the service role key, which must never reach a
// browser. So the work happens here, and the function verifies the caller is
// a Regma admin before returning anything.
//
// Needs no extra secrets — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
// provided to every function automatically.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OWNER_EMAIL = "rooseveltdjomo81@gmail.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not signed in" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Who is asking? Taken from the verified token, never the request body.
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ error: "Invalid session" }, 401);

    // Are they allowed? Owner, or a row in the admins table.
    let allowed = user.email === OWNER_EMAIL;
    if (!allowed) {
      const { data: row } = await admin
        .from("admins").select("email, is_active").eq("email", user.email).maybeSingle();
      allowed = !!row && row.is_active !== false;
    }
    if (!allowed) return json({ error: "Not an administrator" }, 403);

    // Paginate through every account (the API caps a page at 1000)
    const accounts: Array<Record<string, unknown>> = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return json({ error: error.message }, 500);
      const batch = data?.users ?? [];
      for (const u of batch) {
        accounts.push({
          id: u.id,
          email: u.email,
          name: (u.user_metadata as Record<string, unknown> | null)?.name ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          confirmed: !!u.email_confirmed_at,
          provider: (u.app_metadata as Record<string, unknown> | null)?.provider ?? "email",
        });
      }
      if (batch.length < 200) break;
    }

    // How many of those accounts have actually applied for something
    const { data: apps } = await admin.from("applications").select("user_id");
    const applied = new Set((apps ?? []).map((a: { user_id: string }) => a.user_id));

    const now = Date.now();
    const days = (ms: number) => (now - ms) / 86_400_000;

    const stats = {
      total: accounts.length,
      confirmed: accounts.filter((a) => a.confirmed).length,
      new_this_week: accounts.filter((a) => days(Date.parse(a.created_at as string)) <= 7).length,
      active_30d: accounts.filter((a) =>
        a.last_sign_in_at && days(Date.parse(a.last_sign_in_at as string)) <= 30).length,
      never_signed_in: accounts.filter((a) => !a.last_sign_in_at).length,
      applicants: applied.size,
      via_google: accounts.filter((a) => a.provider === "google").length,
    };

    accounts.forEach((a) => { a.has_applied = applied.has(a.id as string); });
    accounts.sort((a, b) =>
      Date.parse(b.created_at as string) - Date.parse(a.created_at as string));

    return json({ stats, accounts });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
