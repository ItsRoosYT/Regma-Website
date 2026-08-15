// Supabase Edge Function: erases a user's account and everything attached
// to it. GDPR Article 17 — the right to erasure.
//
// Called from the portal with the user's own access token. It only ever
// deletes the caller's own account: the id comes from the verified token,
// never from the request body, so this cannot be pointed at someone else.
//
// Needs no extra secrets — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
// provided to every function automatically.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response("Not signed in", { status: 401, headers: CORS });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Identify the caller from their token. This is the only source of the
    // user id — a body parameter would let anyone delete anyone.
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return new Response("Invalid session", { status: 401, headers: CORS });
    }

    const uid = user.id;
    const email = user.email ?? "";

    // 1 — remove uploaded CVs. Files live under <user-id>/… in the private
    //     bucket, so listing that prefix finds everything they uploaded.
    const { data: files } = await admin.storage.from("cvs").list(uid, { limit: 200 });
    if (files?.length) {
      await admin.storage.from("cvs").remove(files.map((f) => `${uid}/${f.name}`));
    }

    // 2 — applications
    await admin.from("applications").delete().eq("user_id", uid);

    // 3 — profile
    await admin.from("profiles").delete().eq("id", uid);

    // 4 — newsletter subscription, if they signed up with the same address
    if (email) {
      await admin.from("newsletter_subscribers").delete().eq("email", email);
    }

    // Contact messages are deliberately NOT deleted here: they may be part of
    // an ongoing business conversation, and are not tied to an account. They
    // can be removed on request from the admin inbox.

    // 5 — finally the auth user itself
    const { error: delError } = await admin.auth.admin.deleteUser(uid);
    if (delError) {
      console.error("deleteUser failed for", uid, delError);
      return new Response("Could not delete the account: " + delError.message, {
        status: 500,
        headers: CORS,
      });
    }

    console.log("Account erased:", uid);
    return new Response(JSON.stringify({ deleted: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error: " + (e as Error).message, { status: 500, headers: CORS });
  }
});
