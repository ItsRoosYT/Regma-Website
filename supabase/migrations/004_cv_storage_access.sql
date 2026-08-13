-- CV storage access.
-- Run AFTER 003_admin_inbox.sql (this file uses the is_regma_admin() helper
-- that 003 creates). Safe to re-run.
--
-- THE BUG THIS FIXES
-- CVs upload to the `cvs` bucket at  <applicant-user-id>/<timestamp>_<file>.
-- Supabase Storage masks a denied read as "Object not found" (404 rather than
-- 403, so nobody can probe for files that exist). With no policy granting
-- admins access, an admin opening someone else's CV therefore sees
-- "Object not found" even though the file is sitting there intact.
--
-- Nothing is wrong with the uploads. The files are fine. Only the read
-- permission was missing.

-- ── Bucket ────────────────────────────────────────────────────────
-- Private: CVs are personal data and must never be world-readable.
-- Access is only ever granted through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do update set public = false;

-- ── Policies ──────────────────────────────────────────────────────
-- storage.objects already has RLS enabled by Supabase.

-- An applicant may upload into their own folder only.
drop policy if exists cvs_owner_insert on storage.objects;
create policy cvs_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- An applicant may read back their own CV.
drop policy if exists cvs_owner_select on storage.objects;
create policy cvs_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins may read every CV. This is the missing piece: it is what lets
-- createSignedUrl() succeed in the admin dashboard.
drop policy if exists cvs_admin_select on storage.objects;
create policy cvs_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'cvs' and is_regma_admin());

-- Admins may delete a CV (e.g. on request, or with the application).
drop policy if exists cvs_admin_delete on storage.objects;
create policy cvs_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'cvs' and is_regma_admin());

-- ── Check it worked ───────────────────────────────────────────────
-- Signed in as an admin, this should list stored CVs rather than nothing:
--   select name, created_at from storage.objects where bucket_id = 'cvs'
--   order by created_at desc limit 20;
--
-- If it returns rows but the dashboard still says "Object not found", the
-- application row's cv_path no longer matches an object — compare:
--   select cv_name, cv_path from applications where cv_path is not null;
