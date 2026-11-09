-- supabase/migrations/20261109210000_service_popup.sql
-- The 30-second pop-up is Charlie's own "Milhaus Service" sign-up, not
-- a paid ad spot. 20261109180000_add_popup_ad_and_contact.sql (same day)
-- added a sellable "popup" ad placement on a misreading of his ask; when
-- Terry saw Charlie's design (a form: "Arrive in Stuttgart. We've got
-- your back." — car & registration, apartment support, bureaucracy help,
-- general advice, plus an email address) he chose to remove that spot
-- entirely. This file:
--
--   1. takes "popup" back out of the ad placements (it was never sold:
--      its price was still 0, so nothing could have been bought);
--   2. adds service_requests for what the pop-up's form sends. Charlie
--      reads them in Admin → Messages; each is also emailed to him.
--
-- Safe to run more than once.

-- 1. Remove the "popup" ad placement -----------------------------------

delete from public.ad_price_overrides where placement = 'popup';
delete from public.ad_prices where placement = 'popup';
delete from public.ad_slots where placement = 'popup';

do $$
declare
  c record;
begin
  for c in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where contype = 'c'
      and conrelid in ('public.ad_slots'::regclass, 'public.ad_prices'::regclass, 'public.ad_order_lines'::regclass)
      and pg_get_constraintdef(oid) like '%placement%'
      and pg_get_constraintdef(oid) like '%special_offers%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

alter table public.ad_slots add constraint ad_slots_placement_check
  check (placement in ('site_banner', 'cars_sidebar', 'special_offers'));
alter table public.ad_prices add constraint ad_prices_placement_check
  check (placement in ('site_banner', 'cars_sidebar', 'special_offers'));
alter table public.ad_order_lines add constraint ad_order_lines_placement_check
  check (placement in ('site_banner', 'cars_sidebar', 'special_offers'));

-- 2. Milhaus Service requests ------------------------------------------

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null check (char_length(email) between 3 and 320),
  -- Which boxes they ticked; may be empty ("select any").
  interests text[] not null default '{}' check (
    interests <@ array['car', 'apartment', 'bureaucracy', 'advice']::text[]
  ),
  locale text not null default 'en' check (locale in ('en', 'de')),
  -- The page they were on when the pop-up appeared.
  page text check (page is null or char_length(page) <= 500),
  status text not null default 'open' check (status in ('open', 'handled')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

alter table public.service_requests enable row level security;

-- Written only by the server (service role, after its own checks);
-- read, updated and deleted only by an admin.
drop policy if exists "Admins read service requests" on public.service_requests;
create policy "Admins read service requests" on public.service_requests
  for select using (public.is_admin());

drop policy if exists "Admins update service requests" on public.service_requests;
create policy "Admins update service requests" on public.service_requests
  for update using (public.is_admin());

drop policy if exists "Admins delete service requests" on public.service_requests;
create policy "Admins delete service requests" on public.service_requests
  for delete using (public.is_admin());

create index if not exists service_requests_status_idx on public.service_requests (status, created_at desc);
