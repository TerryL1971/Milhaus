-- supabase/migrations/20260823132745_profiles_role_as_enum.sql
-- `role` has been a plain text column with a CHECK constraint since the
-- start. That's functionally fine (the app's admin/users page has its own
-- ROLE_LABELS dropdown), but Supabase Studio's Table Editor only renders a
-- complete dropdown of allowed values for a real Postgres enum type — for a
-- text+check column it instead suggests whatever values already happen to
-- exist in the data, so a role nobody's been assigned yet (landlord, so
-- far) never shows up as an option there.
--
-- Converts role to a native enum, and adds a 5th value: 'owner'. Same
-- occasion, different motivation — Charlie needs a role distinct from
-- 'admin' once he has an account, but functionally equal to it (nothing
-- admin can reach should be owner-only, per the actual requirement). Rather
-- than sprinkle `role in ('admin', 'owner')` through every RLS policy and
-- page guard, is_admin() and enforce_listing_review_gate() below both
-- broaden their single existing admin check to cover 'owner' too — one
-- choke point on the SQL side, and an isAdminRole() helper doing the same
-- on the app side (see src/lib/roles.ts). A future admin with a narrower
-- role is still just a matter of adding another enum value later; nothing
-- here assumes only two tiers exist.
create type public.profile_role as enum ('owner', 'admin', 'housing_office_partner', 'landlord', 'individual_lister');

-- Must drop the check constraint *before* changing the column type: its
-- stored expression compares role against explicitly text-typed literals
-- (role = 'admin'::text OR ...), and Postgres re-validates that expression
-- against the new column type during the ALTER COLUMN TYPE below — an
-- explicitly-typed text literal doesn't get the implicit cast an untyped
-- one would, so it fails with "operator does not exist: profile_role =
-- text" if the constraint is still attached.
alter table public.profiles drop constraint profiles_role_check;

alter table public.profiles alter column role drop default;
alter table public.profiles
  alter column role type public.profile_role using role::public.profile_role;
alter table public.profiles alter column role set default 'individual_lister'::public.profile_role;

-- Broaden the one function every "is this caller an admin" check already
-- goes through (profiles' own RLS, prevent_role_self_escalation, and the
-- listings policies below) so 'owner' gets identical access without
-- touching any of those call sites individually.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner')
  );
$$;

-- This one checks the role directly rather than through is_admin() (it
-- also allows housing_office_partner to self-activate their own feed),
-- so it needs the same broadening applied here explicitly.
create or replace function public.enforce_listing_review_gate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if new.status = 'active' and old.status is distinct from 'active' and auth.uid() is not null then
    select role into actor_role from public.profiles where id = auth.uid();
    if actor_role is null or actor_role not in ('owner', 'admin', 'housing_office_partner') then
      raise exception 'Only an admin can activate a listing.';
    end if;
  end if;
  return new;
end;
$$;
