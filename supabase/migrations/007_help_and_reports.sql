-- Help centre + anonymous reporting.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is IF NOT EXISTS / CREATE OR REPLACE.
--
-- WHY THIS EXISTS
-- Applicants who hit a problem had nowhere to go. The only route was emailing
-- djomoi@yahoo.com, which means putting your name to a complaint and sending it
-- to the company you are complaining about. Nobody does that. The result was
-- that a total sign-up outage ran for weeks with no signal reaching anyone.
--
-- This table is the missing channel. It is deliberately anonymous: no user_id,
-- no auth required, and the email field is optional.

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  -- Short human-quotable code, e.g. "RG-7K2M9Q". The reporter keeps this and
  -- can check the status later without ever identifying themselves.
  code        text unique not null,
  category    text not null,
  message     text not null,
  -- Optional. Blank means truly anonymous and we cannot reply.
  email       text,
  -- new → seen → resolved
  status      text not null default 'new',
  -- Staff-written note the reporter is allowed to read via the code lookup.
  reply       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reports_status_idx  on reports (status, created_at desc);
create index if not exists reports_code_idx    on reports (code);

alter table reports enable row level security;

-- ── Anyone may file a report, signed in or not ────────────────────
-- This is the whole point: no account, no barrier.
drop policy if exists reports_public_insert on reports;
create policy reports_public_insert on reports
  for insert to anon, authenticated
  with check (true);

-- Deliberately NO public select policy. A report must never be readable by
-- guessing or enumerating — the only public read path is check_report() below,
-- which requires knowing the exact code.

-- ── Admins can read and manage everything ─────────────────────────
-- is_regma_admin() comes from 003_admin_inbox.sql. Fall back to the owner
-- address if that migration has not been run, so this file works standalone.
do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_regma_admin') then
    execute $p$
      drop policy if exists reports_admin_all on reports;
      create policy reports_admin_all on reports
        for all to authenticated
        using (is_regma_admin()) with check (is_regma_admin());
    $p$;
  else
    execute $p$
      drop policy if exists reports_admin_all on reports;
      create policy reports_admin_all on reports
        for all to authenticated
        using (auth.jwt() ->> 'email' = 'rooseveltdjomo81@gmail.com')
        with check (auth.jwt() ->> 'email' = 'rooseveltdjomo81@gmail.com');
    $p$;
  end if;
end $$;

-- ── Anonymous status lookup ───────────────────────────────────────
-- SECURITY DEFINER so it can read past RLS, but it only ever returns the one
-- row whose code matches exactly, and never returns the reporter's email.
-- Codes are 8 random chars from a 32-char alphabet (~10^12 combinations), so
-- enumeration is impractical.
create or replace function check_report(p_code text)
returns table (code text, category text, status text, reply text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select r.code, r.category, r.status, r.reply, r.created_at
  from reports r
  where r.code = upper(trim(p_code))
  limit 1;
$$;

revoke all on function check_report(text) from public;
grant execute on function check_report(text) to anon, authenticated;

-- Keep updated_at honest
create or replace function reports_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists reports_touch_trg on reports;
create trigger reports_touch_trg before update on reports
  for each row execute function reports_touch();

-- ── Check it worked ───────────────────────────────────────────────
-- As an admin this should return 0 rows rather than an error:
--   select count(*) from reports;
-- And this should return nothing (no such code) rather than an error:
--   select * from check_report('RG-XXXXXX');
