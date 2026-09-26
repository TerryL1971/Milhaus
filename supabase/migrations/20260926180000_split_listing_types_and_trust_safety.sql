-- supabase/migrations/20260926180000_split_listing_types_and_trust_safety.sql
-- Two changes prompted by the same conversation with Charlie:
--
-- 1. Split the wide `listings` table into a slim shared table plus one
--    details table per type (rental_details/car_details/product_details,
--    service_details later). The wide-table-with-a-3-way-check-constraint
--    pattern (see the now-removed listings_type_fields_check) was already
--    getting unwieldy at 3 types and would only get worse at 4+ — this
--    swaps it for real per-type NOT NULL constraints and a join instead of
--    a growing OR chain. Existing rental/car data is migrated, not lost.
--
-- 2. First pass at trust & safety, which is a separate concern from the
--    schema shape: profiles.status so Charlie can suspend/ban someone
--    (blocks new posts, doesn't touch their existing listings or their
--    ability to sign in/browse — a deliberate, simple scope for now), and
--    a listing_reports table so any signed-in user can flag a listing for
--    Charlie to review, instead of relying on him spotting problems alone.

-- ============================================================================
-- 1. Per-type details tables
-- ============================================================================

create table public.rental_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  address text not null,
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms integer not null check (bathrooms >= 0),
  size_sqm numeric(8, 2) check (size_sqm is null or size_sqm >= 0),
  available_from date,
  amenities text[] not null default '{}',
  parking_spaces integer check (parking_spaces is null or parking_spaces >= 0),
  nearby_amenities text[] not null default '{}',
  internet_type text check (internet_type is null or internet_type in ('dsl', 'cable', 'fiber')),
  internet_speed_mbps integer check (internet_speed_mbps is null or internet_speed_mbps >= 0),
  heat_type text check (heat_type is null or heat_type in ('gas', 'oil', 'electric')),
  stove_type text check (stove_type is null or stove_type in ('induction', 'standard'))
);

create table public.car_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null check (year between 1900 and 2100),
  mileage_km integer check (mileage_km is null or mileage_km >= 0)
);

create table public.product_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  product_category text not null
    check (product_category in ('electronics', 'furniture', 'household', 'clothing', 'baby_kids', 'other')),
  condition text not null check (condition in ('new', 'like_new', 'good', 'fair'))
);

-- Carry over existing data before the source columns disappear.
insert into public.rental_details
  (listing_id, address, bedrooms, bathrooms, size_sqm, available_from,
   parking_spaces, nearby_amenities, internet_type, internet_speed_mbps, heat_type, stove_type)
select id, address, bedrooms, bathrooms, size_sqm, available_from,
       parking_spaces, coalesce(nearby_amenities, '{}'), internet_type, internet_speed_mbps, heat_type, stove_type
from public.listings
where type = 'rental';

insert into public.car_details (listing_id, make, model, year, mileage_km)
select id, make, model, year, mileage_km
from public.listings
where type = 'car';

insert into public.product_details (listing_id, product_category, condition)
select id, product_category, condition
from public.listings
where type = 'product';

-- Drop the now-migrated columns from the parent table, and the
-- cross-type check constraint that existed only to fake per-type
-- required fields on a shared table — real NOT NULLs on the details
-- tables replace it. (No `amenities` column drop here: it was declared
-- in an earlier migration file that, as it turns out, was never actually
-- applied to this project — confirmed against the live schema while
-- doing this refactor. rental_details.amenities above is that feature's
-- first real, working column.)
alter table public.listings
  drop constraint if exists listings_type_fields_check,
  drop column address,
  drop column bedrooms,
  drop column bathrooms,
  drop column size_sqm,
  drop column available_from,
  drop column parking_spaces,
  drop column nearby_amenities,
  drop column internet_type,
  drop column internet_speed_mbps,
  drop column heat_type,
  drop column stove_type,
  drop column make,
  drop column model,
  drop column year,
  drop column mileage_km,
  drop column product_category,
  drop column condition;

-- RLS: same three-way shape on every details table — public can read the
-- details of an active listing, an owner can read/write their own
-- (regardless of status), an admin can read/write everything. Ownership
-- isn't a column on these tables, so every policy joins back to listings.
-- Written out per table (not a loop over dollar-quoted `format()` calls)
-- so nothing depends on how the migration runner parses nested
-- dollar-quoting.

alter table public.rental_details enable row level security;

create policy "rental_details: public reads for active listings"
  on public.rental_details for select
  using (exists (select 1 from public.listings where listings.id = rental_details.listing_id and listings.status = 'active'));

create policy "rental_details: owner reads own"
  on public.rental_details for select
  using (exists (select 1 from public.listings where listings.id = rental_details.listing_id and listings.owner_id = auth.uid()));

create policy "rental_details: admins read all"
  on public.rental_details for select
  using (public.is_admin());

create policy "rental_details: owner inserts own"
  on public.rental_details for insert
  to authenticated
  with check (exists (select 1 from public.listings where listings.id = rental_details.listing_id and listings.owner_id = auth.uid()));

create policy "rental_details: owner updates own"
  on public.rental_details for update
  using (exists (select 1 from public.listings where listings.id = rental_details.listing_id and listings.owner_id = auth.uid()));

create policy "rental_details: admins update all"
  on public.rental_details for update
  using (public.is_admin());

grant select, insert, update on public.rental_details to authenticated;
grant select on public.rental_details to anon;
grant all on public.rental_details to service_role;

alter table public.car_details enable row level security;

create policy "car_details: public reads for active listings"
  on public.car_details for select
  using (exists (select 1 from public.listings where listings.id = car_details.listing_id and listings.status = 'active'));

create policy "car_details: owner reads own"
  on public.car_details for select
  using (exists (select 1 from public.listings where listings.id = car_details.listing_id and listings.owner_id = auth.uid()));

create policy "car_details: admins read all"
  on public.car_details for select
  using (public.is_admin());

create policy "car_details: owner inserts own"
  on public.car_details for insert
  to authenticated
  with check (exists (select 1 from public.listings where listings.id = car_details.listing_id and listings.owner_id = auth.uid()));

create policy "car_details: owner updates own"
  on public.car_details for update
  using (exists (select 1 from public.listings where listings.id = car_details.listing_id and listings.owner_id = auth.uid()));

create policy "car_details: admins update all"
  on public.car_details for update
  using (public.is_admin());

grant select, insert, update on public.car_details to authenticated;
grant select on public.car_details to anon;
grant all on public.car_details to service_role;

alter table public.product_details enable row level security;

create policy "product_details: public reads for active listings"
  on public.product_details for select
  using (exists (select 1 from public.listings where listings.id = product_details.listing_id and listings.status = 'active'));

create policy "product_details: owner reads own"
  on public.product_details for select
  using (exists (select 1 from public.listings where listings.id = product_details.listing_id and listings.owner_id = auth.uid()));

create policy "product_details: admins read all"
  on public.product_details for select
  using (public.is_admin());

create policy "product_details: owner inserts own"
  on public.product_details for insert
  to authenticated
  with check (exists (select 1 from public.listings where listings.id = product_details.listing_id and listings.owner_id = auth.uid()));

create policy "product_details: owner updates own"
  on public.product_details for update
  using (exists (select 1 from public.listings where listings.id = product_details.listing_id and listings.owner_id = auth.uid()));

create policy "product_details: admins update all"
  on public.product_details for update
  using (public.is_admin());

grant select, insert, update on public.product_details to authenticated;
grant select on public.product_details to anon;
grant all on public.product_details to service_role;

-- ============================================================================
-- 2. Trust & safety, first pass
-- ============================================================================

alter table public.profiles
  add column status text not null default 'active' check (status in ('active', 'suspended', 'banned'));

-- A suspended/banned account keeps its sign-in and can still browse and
-- contact sellers — this only stops *new* posts, deliberately narrow in
-- scope. Existing listings aren't touched automatically; Charlie still
-- archives those by hand if he wants them down too.
drop policy if exists "listings: authenticated users create their own listings" on public.listings;
create policy "listings: authenticated users create their own listings"
  on public.listings for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and (status in ('draft', 'pending_review') or public.is_admin())
    and exists (select 1 from public.profiles where id = auth.uid() and status = 'active')
  );

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

comment on table public.listing_reports is
  'Community-reported listings — the practical substitute for automated content moderation at this scale: people flag it, Charlie reviews it.';

create index listing_reports_status_idx on public.listing_reports (status);

alter table public.listing_reports enable row level security;

create policy "listing_reports: reporter inserts own"
  on public.listing_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "listing_reports: admins read all"
  on public.listing_reports for select
  using (public.is_admin());

create policy "listing_reports: admins update (resolve)"
  on public.listing_reports for update
  using (public.is_admin());

grant select, insert, update on public.listing_reports to authenticated;
grant all on public.listing_reports to service_role;
