-- Platsbanken / Arbetsförmedlingen support for the jobs table.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is IF NOT EXISTS.

-- ── Publishing gate ───────────────────────────────────────────────
-- verified_opening must be true before a role can be exported to
-- Platsbanken. Arbetsförmedlingen's annonseringsvillkor require ads to
-- concern genuine vacancies the advertiser can actually fill; breaching
-- that removes the ad and, on repeat, suspends the employer account.
-- Defaults to false so imported/sample roles are never publishable by
-- accident — it has to be an explicit decision per role.
alter table jobs add column if not exists verified_opening boolean not null default false;

-- ── Advert metadata ───────────────────────────────────────────────
alter table jobs add column if not exists application_deadline date;
alter table jobs add column if not exists contact_name  text;
alter table jobs add column if not exists contact_email text;
alter table jobs add column if not exists contact_phone text;

-- Platsbanken form fields that have no equivalent on the site yet
alter table jobs add column if not exists extent      text;  -- Omfattning: Heltid / Deltid
alter table jobs add column if not exists duration    text;  -- Varaktighet: Tillsvidare / 6 mån ...
alter table jobs add column if not exists start_date  text;  -- Tillträde: "Enligt överenskommelse"
alter table jobs add column if not exists positions   integer default 1;  -- Antal platser

-- ── Posting tracker ───────────────────────────────────────────────
alter table jobs add column if not exists posted_to_af    boolean not null default false;
alter table jobs add column if not exists posted_to_af_at timestamptz;

-- Find publishable roles quickly
create index if not exists jobs_verified_open_idx
  on jobs (verified_opening, is_open)
  where verified_opening = true;

-- ── Sanity check ──────────────────────────────────────────────────
-- Should return 0 until a real vacancy is confirmed.
-- select count(*) as publishable from jobs where verified_opening;
