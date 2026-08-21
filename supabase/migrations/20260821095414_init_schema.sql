-- supabase/migrations/20260821095414_init_schema.sql
-- Initial schema for milhaus: profiles + listings, RLS policies, and the
-- listing-photos storage bucket. Mirrors the MVP data model in CLAUDE.md.
--
-- Design choices worth knowing about later:
--   * `type`/`role`/`source`/`status` are TEXT + CHECK constraints rather
--     than Postgres ENUMs, since CLAUDE.md calls out `type` as needing to
--     stay extensible (a future `car` listing type) and CHECK constraints
--     are far cheaper to widen later than ALTER TYPE.
--   * A trigger blocks a non-admin from flipping a listing straight to
--     `active` — that transition is reserved for admin review. This is the
--     one invariant ("no ghost/unreviewed posts") worth enforcing at the
--     database level, not just in app code.
--   * Listing photos are expected to be uploaded under a
--     `${auth.uid()}/...` path in the `listing-photos` bucket — storage
--     policies below check that prefix to scope write access to the owner.

create extension if not exists pgcrypto;

-- ============================================================================
-- profiles
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'individual_lister'
    check (role in ('admin', 'housing_office_partner', 'landlord', 'individual_lister')),
  display_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per Supabase auth user; role drives what they can do.';

-- security definer + fixed search_path so RLS policies that call this
-- (including profiles' own policies) don't recurse into profiles' RLS.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, contact_email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: admins read all rows"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles: update own row"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admins update all rows"
  on public.profiles for update
  using (public.is_admin());

-- Prevent a non-admin from granting themselves a higher role through the
-- "update own row" policy above (RLS alone can't restrict a single column).
-- Only intervenes on genuine self-service edits (auth.uid() = the row being
-- changed) — a direct update from the dashboard, a seed script, or
-- service_role (auth.uid() is null there) is a trusted path and must stay
-- able to promote the very first admin.
create function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role and auth.uid() = old.id and not public.is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- Row Level Security policies only govern *which rows* a role can see —
-- the API roles (anon/authenticated/service_role) still need the
-- underlying table-level GRANTs before Postgres lets them touch the table
-- at all. Newer Supabase projects no longer grant these automatically for
-- new tables, so this is not optional boilerplate.
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- ============================================================================
-- listings
-- ============================================================================

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'rental'
    check (type in ('rental')), -- extend this list when adding e.g. 'car'
  title text not null,
  description text not null default '',
  address text not null,
  city text not null,
  distance_to_base text,
  price_eur_month numeric(10, 2) not null check (price_eur_month >= 0),
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms integer not null check (bathrooms >= 0),
  size_sqm numeric(8, 2) check (size_sqm >= 0),
  available_from date,
  photos text[] not null default '{}',
  source text not null check (source in ('housing_office', 'self_listed')),
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'active', 'rented', 'archived')),
  -- Future paid-tier flag (Stripe is explicitly out of scope for MVP —
  -- CLAUDE.md just asks that the column exist so it's not a later migration).
  is_promoted boolean not null default false,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now()
);

comment on table public.listings is 'Rental listings (type is extensible for a future car category).';

create index listings_status_idx on public.listings (status);
create index listings_owner_id_idx on public.listings (owner_id);
create index listings_city_idx on public.listings (city);

create trigger set_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create function public.set_listing_status_changed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
  end if;
  return new;
end;
$$;

create trigger listings_set_status_changed_at
  before update on public.listings
  for each row execute function public.set_listing_status_changed_at();

-- Only an admin (or housing_office_partner, for the future bulk-import
-- path) can move a listing to `active` — that's the review gate that makes
-- "every listing reviewed" true. Everyone else can still move between the
-- other statuses (draft -> pending_review, or self-serve -> rented/archived,
-- per the "mark it rented" flow in CLAUDE.md).
--
-- auth.uid() is null outside a real end-user JWT session — a direct update
-- from the dashboard, a seed/import script, or service_role. Those are
-- trusted server-side paths (service_role already bypasses RLS structurally)
-- and must stay exempt, or there'd be no way to activate anything before
-- the app-level admin dashboard exists.
create function public.enforce_listing_review_gate()
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
    if actor_role is null or actor_role not in ('admin', 'housing_office_partner') then
      raise exception 'Only an admin can activate a listing.';
    end if;
  end if;
  return new;
end;
$$;

create trigger listings_enforce_review_gate
  before update on public.listings
  for each row execute function public.enforce_listing_review_gate();

alter table public.listings enable row level security;

create policy "listings: public reads active listings"
  on public.listings for select
  using (status = 'active');

create policy "listings: owner reads own listings"
  on public.listings for select
  using (auth.uid() = owner_id);

create policy "listings: admins read all listings"
  on public.listings for select
  using (public.is_admin());

create policy "listings: authenticated users create their own listings"
  on public.listings for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and (status in ('draft', 'pending_review') or public.is_admin())
  );

create policy "listings: owner updates own listings"
  on public.listings for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "listings: admins update all listings"
  on public.listings for update
  using (public.is_admin());

-- No delete policy: listings are retired via status = 'archived' rather
-- than being deleted, so the default deny is intentional.

grant select on public.listings to anon, authenticated;
grant insert, update on public.listings to authenticated;
grant all on public.listings to service_role;

-- ============================================================================
-- storage: listing photos
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "listing-photos: public read"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

-- Uploads must live under `${auth.uid()}/...` so ownership is enforceable
-- from the path alone.
create policy "listing-photos: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing-photos: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing-photos: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
