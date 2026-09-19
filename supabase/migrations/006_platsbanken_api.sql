-- Direct publishing to Platsbanken through Arbetsförmedlingen's API.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is IF NOT EXISTS.
--
-- Adds nothing that changes existing behaviour — only columns the
-- `platsbanken` Edge Function reads and writes.

-- The occupation ("yrke") Platsbanken files the ad under. A concept ID from
-- Arbetsförmedlingen's taxonomy, e.g. 'z5AM_ayf_WcL' = "Projektledare, IT".
-- The label is kept too, so the admin form can show it without a lookup.
alter table jobs add column if not exists af_occupation_id    text;
alter table jobs add column if not exists af_occupation_label text;

-- What happened on Platsbanken
alter table jobs add column if not exists af_ad_id       text;         -- Arbetsförmedlingen's ad number
alter table jobs add column if not exists af_env         text;         -- 'sandbox' or 'prod'
alter table jobs add column if not exists af_status      text;         -- PUBLISHED / UNPUBLISHED
alter table jobs add column if not exists af_last_sync   timestamptz;
alter table jobs add column if not exists af_last_error  text;
