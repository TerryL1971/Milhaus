-- supabase/migrations/20261103120000_add_ad_orders.sql
-- Charlie's ask (2026-11-03): a business can buy ad spots in bulk (10,
-- 20 at a time) for 30 days, 90 days, 6 months, 1 year, or more than a
-- year, billed as an itemized order. Terry's decisions, same day:
--   - what's sold is the existing ad_slots placements (site banner, cars
--     sidebar, Special Offers), not listing credits;
--   - two ways to buy: the advertiser does it themselves on /advertise
--     (straight into the existing cart + Stripe Checkout), or Charlie
--     builds the order in /admin/ads/orders and Stripe emails the
--     advertiser an itemized invoice with a Pay button;
--   - pricing: Charlie sets one 30-day price per placement plus a
--     discount % for each longer term, and can type a fixed price for
--     any placement + term to override that maths. A term over a year
--     is just N × the 1-year price.
--
-- Paying for an order creates one ad_slots row per spot bought, hidden
-- until it has artwork. Its clock starts when it first goes live (not
-- at payment), so an advertiser who takes a week to send artwork still
-- gets every day they paid for.
--
-- Safe to run more than once.

-- 1. Price list --------------------------------------------------------

create table if not exists public.ad_prices (
  placement text primary key check (placement in ('site_banner', 'cars_sidebar', 'special_offers')),
  monthly_eur numeric(8, 2) not null default 0 check (monthly_eur >= 0),
  updated_at timestamptz not null default now()
);

insert into public.ad_prices (placement) values ('site_banner'), ('cars_sidebar'), ('special_offers')
on conflict do nothing;

-- One row per term Charlie can discount. 30 is the base price (always
-- 0%), the rest are his "buy longer, pay less per month" discounts.
create table if not exists public.ad_term_discounts (
  days integer primary key check (days in (30, 90, 180, 365)),
  discount_pct numeric(5, 2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  updated_at timestamptz not null default now()
);

insert into public.ad_term_discounts (days) values (30), (90), (180), (365)
on conflict do nothing;

-- Charlie's "just charge this" price for one placement + term, used
-- instead of monthly × months × discount when present.
create table if not exists public.ad_price_overrides (
  placement text not null references public.ad_prices(placement) on delete cascade,
  days integer not null references public.ad_term_discounts(days) on delete cascade,
  price_eur numeric(10, 2) not null check (price_eur >= 0),
  updated_at timestamptz not null default now(),
  primary key (placement, days)
);

alter table public.ad_prices enable row level security;
alter table public.ad_term_discounts enable row level security;
alter table public.ad_price_overrides enable row level security;

-- Prices are public — /advertise shows them to anyone.
drop policy if exists "ad_prices: public reads" on public.ad_prices;
create policy "ad_prices: public reads" on public.ad_prices for select using (true);
drop policy if exists "ad_prices: admins manage" on public.ad_prices;
create policy "ad_prices: admins manage" on public.ad_prices for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ad_term_discounts: public reads" on public.ad_term_discounts;
create policy "ad_term_discounts: public reads" on public.ad_term_discounts for select using (true);
drop policy if exists "ad_term_discounts: admins manage" on public.ad_term_discounts;
create policy "ad_term_discounts: admins manage" on public.ad_term_discounts for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ad_price_overrides: public reads" on public.ad_price_overrides;
create policy "ad_price_overrides: public reads" on public.ad_price_overrides for select using (true);
drop policy if exists "ad_price_overrides: admins manage" on public.ad_price_overrides;
create policy "ad_price_overrides: admins manage" on public.ad_price_overrides for all
  using (public.is_admin()) with check (public.is_admin());

-- 2. Orders ------------------------------------------------------------

-- One order = one checkout (a single /advertise "add to cart") or one
-- emailed invoice (any number of lines). Written only by server code
-- with the service-role client, so a buyer can never set their own
-- price — the policies below are read-only for everyone but admins.
create table if not exists public.ad_orders (
  id uuid primary key default gen_random_uuid(),
  -- The signed-in buyer for a self-serve order; null for an invoice sent
  -- to someone who's never signed up.
  user_id uuid references public.profiles(id) on delete set null,
  advertiser_name text not null,
  advertiser_email text not null,
  source text not null check (source in ('cart', 'invoice')),
  -- cart: sitting in someone's cart · open: invoice sent, unpaid ·
  -- paid: spots created · void: invoice cancelled
  status text not null default 'cart' check (status in ('cart', 'open', 'paid', 'void')),
  stripe_invoice_id text unique,
  stripe_invoice_url text,
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.ad_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ad_orders(id) on delete cascade,
  placement text not null check (placement in ('site_banner', 'cars_sidebar', 'special_offers')),
  -- 30, 90, 180, or a whole number of years (365, 730, 1095, …).
  days integer not null check (days in (30, 90, 180) or (days >= 365 and days % 365 = 0)),
  quantity integer not null check (quantity between 1 and 100),
  unit_price_eur numeric(10, 2) not null check (unit_price_eur >= 0),
  created_at timestamptz not null default now()
);

create index if not exists ad_order_lines_order_id_idx on public.ad_order_lines (order_id);
create index if not exists ad_orders_user_id_idx on public.ad_orders (user_id);

alter table public.ad_orders enable row level security;
alter table public.ad_order_lines enable row level security;

drop policy if exists "ad_orders: buyers read own" on public.ad_orders;
create policy "ad_orders: buyers read own" on public.ad_orders for select using (user_id = auth.uid());
drop policy if exists "ad_orders: admins manage" on public.ad_orders;
create policy "ad_orders: admins manage" on public.ad_orders for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ad_order_lines: buyers read own" on public.ad_order_lines;
create policy "ad_order_lines: buyers read own" on public.ad_order_lines for select
  using (exists (select 1 from public.ad_orders where ad_orders.id = ad_order_lines.order_id and ad_orders.user_id = auth.uid()));
drop policy if exists "ad_order_lines: admins manage" on public.ad_order_lines;
create policy "ad_order_lines: admins manage" on public.ad_order_lines for all
  using (public.is_admin()) with check (public.is_admin());

-- 3. The cart and the payments ledger learn about ad orders -------------

alter table public.cart_items add column if not exists ad_order_id uuid references public.ad_orders(id) on delete cascade;
alter table public.listing_payments add column if not exists ad_order_id uuid references public.ad_orders(id) on delete cascade;

-- Both had an "exactly one of listing_id / business_id" check; it's now
-- exactly one of three. cart_items' was declared inline, so drop it by
-- what it says rather than guessing Postgres's generated name.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname from pg_constraint
    where conrelid = 'public.cart_items'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%listing_id%business_id%'
  loop
    execute format('alter table public.cart_items drop constraint %I', constraint_name);
  end loop;
end;
$$;

alter table public.cart_items drop constraint if exists cart_items_item_check;
alter table public.cart_items add constraint cart_items_item_check
  check (num_nonnulls(listing_id, business_id, ad_order_id) = 1);

alter table public.listing_payments drop constraint if exists listing_payments_item_check;
alter table public.listing_payments add constraint listing_payments_item_check
  check (num_nonnulls(listing_id, business_id, ad_order_id) = 1);

create index if not exists listing_payments_ad_order_id_idx on public.listing_payments (ad_order_id);

-- 4. Paid ad spots on ad_slots ------------------------------------------

-- Charlie's existing hand-added ads leave all of these null and never
-- expire, exactly as before.
alter table public.ad_slots
  add column if not exists order_line_id uuid references public.ad_order_lines(id) on delete set null,
  add column if not exists owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists duration_days integer check (duration_days > 0),
  add column if not exists ends_at timestamptz;

-- A bought spot exists before its artwork does, so it has no link yet —
-- but nothing goes live without one.
alter table public.ad_slots alter column link_url drop not null;
alter table public.ad_slots drop constraint if exists ad_slots_live_needs_link;
alter table public.ad_slots add constraint ad_slots_live_needs_link
  check (not is_active or link_url is not null);

create index if not exists ad_slots_owner_id_idx on public.ad_slots (owner_id);

-- The clock starts the first time a bought spot goes live.
create or replace function public.set_ad_slot_ends_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_active and new.duration_days is not null and new.ends_at is null then
    new.ends_at = now() + make_interval(days => new.duration_days);
  end if;
  return new;
end;
$$;

drop trigger if exists ad_slots_set_ends_at on public.ad_slots;
create trigger ad_slots_set_ends_at
  before insert or update on public.ad_slots
  for each row execute function public.set_ad_slot_ends_at();

-- Public sees an ad only while it's live and paid-up. The daily cron
-- also flips finished ones to hidden, but this means one never shows
-- even an hour past its end.
drop policy if exists "ad_slots: public reads active" on public.ad_slots;
create policy "ad_slots: public reads active" on public.ad_slots
  for select
  using (is_active = true and (ends_at is null or ends_at > now()));

drop policy if exists "ad_slots: owners read their own" on public.ad_slots;
create policy "ad_slots: owners read their own" on public.ad_slots
  for select
  using (owner_id = auth.uid());
