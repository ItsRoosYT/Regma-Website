-- Admin inbox for contact messages.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run.
--
-- Also fixes the likely reason messages "don't show" in the dashboard:
-- if contact_submissions has no SELECT policy for signed-in admins, the
-- form INSERT succeeds but the dashboard read returns nothing.

-- ── Message lifecycle ─────────────────────────────────────────────
alter table contact_submissions
  add column if not exists status text not null default 'new';
alter table contact_submissions
  add column if not exists replied_at timestamptz;

do $$ begin
  alter table contact_submissions
    add constraint contact_status_chk check (status in ('new','read','archived'));
exception when duplicate_object then null; end $$;

-- ── Who counts as an admin ────────────────────────────────────────
-- Owner email, or any row in the admins table. SECURITY DEFINER so the
-- check works even though the admins table itself is protected.
create or replace function is_regma_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'rooseveltdjomo81@gmail.com'
      or exists (select 1 from admins a where a.email = auth.jwt() ->> 'email');
$$;

-- ── Policies ──────────────────────────────────────────────────────
alter table contact_submissions enable row level security;

-- anyone may send a message (this is what the public form does)
drop policy if exists contact_public_insert on contact_submissions;
create policy contact_public_insert on contact_submissions
  for insert to anon, authenticated with check (true);

-- admins may read, update (status/replied_at) and delete
drop policy if exists contact_admin_select on contact_submissions;
create policy contact_admin_select on contact_submissions
  for select to authenticated using (is_regma_admin());

drop policy if exists contact_admin_update on contact_submissions;
create policy contact_admin_update on contact_submissions
  for update to authenticated using (is_regma_admin()) with check (is_regma_admin());

drop policy if exists contact_admin_delete on contact_submissions;
create policy contact_admin_delete on contact_submissions
  for delete to authenticated using (is_regma_admin());

-- ── Same guarantee for the other dashboard tables ─────────────────
-- Policies are OR'd, so adding an admin-read policy cannot revoke access
-- that already works. This makes "the admin dashboard shows everything"
-- true for applications and newsletter signups as well.

alter table applications enable row level security;

drop policy if exists apps_public_insert on applications;
create policy apps_public_insert on applications
  for insert to anon, authenticated with check (true);

drop policy if exists apps_admin_select on applications;
create policy apps_admin_select on applications
  for select to authenticated using (is_regma_admin() or email = auth.jwt() ->> 'email');

drop policy if exists apps_admin_update on applications;
create policy apps_admin_update on applications
  for update to authenticated using (is_regma_admin()) with check (is_regma_admin());

drop policy if exists apps_admin_delete on applications;
create policy apps_admin_delete on applications
  for delete to authenticated using (is_regma_admin());

alter table newsletter_subscribers enable row level security;

drop policy if exists nl_public_insert on newsletter_subscribers;
create policy nl_public_insert on newsletter_subscribers
  for insert to anon, authenticated with check (true);

drop policy if exists nl_admin_select on newsletter_subscribers;
create policy nl_admin_select on newsletter_subscribers
  for select to authenticated using (is_regma_admin());

drop policy if exists nl_admin_delete on newsletter_subscribers;
create policy nl_admin_delete on newsletter_subscribers
  for delete to authenticated using (is_regma_admin());

-- ── Sanity check ──────────────────────────────────────────────────
-- While signed in as the owner this should list messages, not error:
-- select id, name, status, created_at from contact_submissions order by created_at desc;

-- ── Clean up diagnostic rows ──────────────────────────────────────
-- A test row was inserted while diagnosing why the inbox appeared empty.
-- Remove it (and any other obvious probes):
delete from contact_submissions where email = 'diag@example.com';
