-- supabase/migrations/20261109120000_add_legal_compliance.sql
-- German-law compliance pass (Terry's go-ahead, 2026-11-09, after the
-- legal review of the site). Four unrelated additions in one file so
-- they can be pasted into the Supabase SQL Editor in one go:
--
--   1. Energy-certificate fields on homes — § 87 GEG requires property
--      ads to state them; landlords who leave them out get formal
--      warnings (Abmahnungen) from Deutsche Umwelthilfe.
--   2. Withdrawal requests — the online "Vertrag widerrufen" button that
--      § 356a BGB makes compulsory for consumer contracts from
--      19 June 2026. Every request is stored here so it can't be lost
--      if the confirmation email fails.
--   3. Proof of the "start my service now" request — § 356(4) / § 357a
--      BGB: a consumer who ticks it in the cart pays pro rata if they
--      withdraw, and loses the right once the service is fully provided.
--   4. Moderation reasons on listings — Digital Services Act Art. 17:
--      an owner whose listing is taken down must be told why. The email
--      itself is sent by src/app/admin/actions.ts; this keeps a record.
--
-- Safe to run more than once.

-- 1. Energy certificate (Energieausweis) — src/components/listing-form.tsx
alter table public.rental_details
  add column if not exists energy_certificate_type text,
  add column if not exists energy_value_kwh numeric(6, 1),
  add column if not exists energy_class text,
  add column if not exists energy_source text,
  add column if not exists year_built integer;

alter table public.rental_details drop constraint if exists rental_details_energy_certificate_type_check;
alter table public.rental_details add constraint rental_details_energy_certificate_type_check
  check (energy_certificate_type is null or energy_certificate_type in ('demand', 'consumption', 'exempt'));

alter table public.rental_details drop constraint if exists rental_details_energy_value_check;
alter table public.rental_details add constraint rental_details_energy_value_check
  check (energy_value_kwh is null or (energy_value_kwh >= 0 and energy_value_kwh < 10000));

alter table public.rental_details drop constraint if exists rental_details_energy_class_check;
alter table public.rental_details add constraint rental_details_energy_class_check
  check (energy_class is null or energy_class in ('A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'));

alter table public.rental_details drop constraint if exists rental_details_energy_source_check;
alter table public.rental_details add constraint rental_details_energy_source_check
  check (energy_source is null or energy_source in (
    'gas', 'oil', 'electricity', 'district_heating', 'heat_pump', 'wood', 'liquid_gas', 'solar', 'coal', 'other'
  ));

alter table public.rental_details drop constraint if exists rental_details_year_built_check;
alter table public.rental_details add constraint rental_details_year_built_check
  check (year_built is null or (year_built between 1000 and 2100));

-- 2. Withdrawal requests — src/app/[locale]/withdraw, src/app/admin/withdrawals
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  contract_details text not null check (char_length(contract_details) between 1 and 2000),
  ordered_on date,
  status text not null default 'open' check (status in ('open', 'handled')),
  admin_note text,
  confirmation_sent boolean not null default false,
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

alter table public.withdrawal_requests enable row level security;

-- Written only by the server (service role, after its own checks);
-- read and updated only by an admin.
drop policy if exists "Admins read withdrawal requests" on public.withdrawal_requests;
create policy "Admins read withdrawal requests" on public.withdrawal_requests
  for select using (public.is_admin());

drop policy if exists "Admins update withdrawal requests" on public.withdrawal_requests;
create policy "Admins update withdrawal requests" on public.withdrawal_requests
  for update using (public.is_admin());

-- 3. "Start now" request at checkout — src/app/cart/actions.ts
alter table public.listing_payments
  add column if not exists immediate_start_requested_at timestamptz;

-- 4. Why a listing was taken down — src/app/admin/actions.ts
alter table public.listings
  add column if not exists moderation_reason text,
  add column if not exists moderation_note text,
  add column if not exists moderated_at timestamptz;
