-- supabase/migrations/20261109180000_add_popup_ad_and_contact.sql
-- Two of Charlie's asks from 2026-11-09 (via Terry), in one file so they
-- can be pasted into the Supabase SQL Editor in one go:
--
--   1. A pop-up ad that appears after a visitor has been on the site for
--      30 seconds, at most once a day. Terry's decision: it's a fourth
--      paid ad spot ("popup"), sold on /advertise like the other three
--      and priced by Charlie in Admin → Pricing. Its price starts at 0,
--      which keeps it off sale until Charlie sets one.
--   2. A Contact page with a form ("help with something specific").
--      Messages are stored here as well as emailed to info@milhaus.de,
--      so nothing is lost if the email fails; Charlie reads them in
--      Admin → Messages.
--
-- Safe to run more than once.

-- 1. The "popup" ad placement ------------------------------------------

-- Three tables each have a CHECK listing the allowed placements; two were
-- declared inline, so drop them by what they say rather than guessing
-- Postgres's generated names (same approach as the ad orders migration).
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
  check (placement in ('site_banner', 'cars_sidebar', 'special_offers', 'popup'));
alter table public.ad_prices add constraint ad_prices_placement_check
  check (placement in ('site_banner', 'cars_sidebar', 'special_offers', 'popup'));
alter table public.ad_order_lines add constraint ad_order_lines_placement_check
  check (placement in ('site_banner', 'cars_sidebar', 'special_offers', 'popup'));

insert into public.ad_prices (placement) values ('popup') on conflict do nothing;

-- 2. Contact messages --------------------------------------------------

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  topic text not null check (topic in (
    'listing', 'finding', 'advertising', 'payment', 'report', 'business', 'other'
  )),
  message text not null check (char_length(message) between 1 and 5000),
  -- Optional: which page they were on, when they came from a link that
  -- passes it (e.g. a listing's "Need help?").
  page text check (page is null or char_length(page) <= 500),
  status text not null default 'open' check (status in ('open', 'handled')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

alter table public.contact_messages enable row level security;

-- Written only by the server (service role, after its own checks);
-- read and updated only by an admin.
drop policy if exists "Admins read contact messages" on public.contact_messages;
create policy "Admins read contact messages" on public.contact_messages
  for select using (public.is_admin());

drop policy if exists "Admins update contact messages" on public.contact_messages;
create policy "Admins update contact messages" on public.contact_messages
  for update using (public.is_admin());

drop policy if exists "Admins delete contact messages" on public.contact_messages;
create policy "Admins delete contact messages" on public.contact_messages
  for delete using (public.is_admin());

create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);
