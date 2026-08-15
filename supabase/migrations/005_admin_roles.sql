-- Named roles for the admin team.
-- Run AFTER 003 (uses the same is_regma_admin() helper). Safe to re-run.
--
-- Previously "roles" were three loose checkboxes, so every person had to be
-- configured by hand and nothing recorded who invited them or when they were
-- last active. This adds named roles with sensible defaults, while keeping the
-- existing can_manage_* columns as the source of truth for permission checks —
-- so nothing that already works stops working.

-- ── New columns ───────────────────────────────────────────────────
alter table admins add column if not exists name        text;
alter table admins add column if not exists title       text;   -- free text, e.g. "Recruiter"
alter table admins add column if not exists invited_by  text;
alter table admins add column if not exists last_seen   timestamptz;
alter table admins add column if not exists is_active   boolean not null default true;
alter table admins add column if not exists notes       text;

-- Widen the role vocabulary. owner keeps its meaning; the rest are presets
-- that map onto the can_manage_* flags.
do $$ begin
  alter table admins drop constraint if exists admins_role_chk;
  alter table admins add constraint admins_role_chk
    check (role in ('owner','admin','recruiter','editor','viewer'));
exception when others then null; end $$;

-- ── Keep flags consistent with the named role ─────────────────────
-- Presets, applied whenever a role is set or changed. Custom combinations
-- are still possible by using role = 'admin' and setting flags directly.
create or replace function apply_role_defaults()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.role is distinct from old.role then
    case new.role
      when 'owner' then
        new.can_manage_jobs := true;
        new.can_manage_applications := true;
        new.can_manage_admins := true;
      when 'recruiter' then          -- hiring only
        new.can_manage_jobs := true;
        new.can_manage_applications := true;
        new.can_manage_admins := false;
      when 'editor' then             -- job adverts, no applicant data
        new.can_manage_jobs := true;
        new.can_manage_applications := false;
        new.can_manage_admins := false;
      when 'viewer' then             -- read-only
        new.can_manage_jobs := false;
        new.can_manage_applications := false;
        new.can_manage_admins := false;
      when 'admin' then              -- full access, but not owner-protected
        new.can_manage_jobs := true;
        new.can_manage_applications := true;
        new.can_manage_admins := true;
      else null;
    end case;
  end if;
  return new;
end $$;

drop trigger if exists admins_role_defaults on admins;
create trigger admins_role_defaults
  before insert or update on admins
  for each row execute function apply_role_defaults();

-- ── Protect the owner ─────────────────────────────────────────────
-- The owner must never be demotable or deletable, or the project can be
-- locked out of its own dashboard.
create or replace function protect_owner()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    raise exception 'The owner account cannot be removed.';
  end if;
  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    raise exception 'The owner role cannot be changed.';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists admins_protect_owner on admins;
create trigger admins_protect_owner
  before update or delete on admins
  for each row execute function protect_owner();

-- ── Policies ──────────────────────────────────────────────────────
alter table admins enable row level security;

-- Any signed-in admin may read the team list (needed to render the page)
drop policy if exists admins_select on admins;
create policy admins_select on admins
  for select to authenticated using (is_regma_admin());

-- Only people with can_manage_admins may change it
drop policy if exists admins_write on admins;
create policy admins_write on admins
  for all to authenticated
  using (
    coalesce(auth.jwt() ->> 'email', '') = 'rooseveltdjomo81@gmail.com'
    or exists (select 1 from admins a
               where a.email = auth.jwt() ->> 'email' and a.can_manage_admins)
  )
  with check (
    coalesce(auth.jwt() ->> 'email', '') = 'rooseveltdjomo81@gmail.com'
    or exists (select 1 from admins a
               where a.email = auth.jwt() ->> 'email' and a.can_manage_admins)
  );

-- ── Seed the two known accounts ───────────────────────────────────
insert into admins (email, role, name, title)
values ('rooseveltdjomo81@gmail.com', 'owner', 'Roosevelt Djomo', 'Web & Systems Development')
on conflict (email) do update set role = 'owner';

insert into admins (email, role, name, title)
values ('djomoi@yahoo.com', 'admin', 'Isaac Djomo', 'Founder & CEO')
on conflict (email) do update
  set name = excluded.name, title = excluded.title;

update admins set can_manage_jobs = true,
                  can_manage_applications = true,
                  can_manage_admins = true
where email = 'djomoi@yahoo.com';
