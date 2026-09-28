-- supabase/migrations/20260928120100_listing_prices_and_payments.sql
-- Second half of the dealer-pricing feature (see 20260928120000 for the
-- `dealer` role this depends on) — the price table Charlie edits from
-- admin, and a ledger of payment attempts once Stripe/PayPal checkout
-- exists. No app code reads these yet; this just lands the shape early
-- so the checkout work (still blocked on test-mode API keys) has
-- somewhere to write to.

-- One row per listing type, price in EUR. Defaults to 0 (free) — nobody
-- gets charged until Charlie actually sets a number here.
create table public.listing_prices (
  type text primary key check (type in ('rental', 'car', 'product', 'service')),
  price_eur numeric(8, 2) not null default 0 check (price_eur >= 0),
  updated_at timestamptz not null default now()
);

insert into public.listing_prices (type, price_eur) values
  ('rental', 0),
  ('car', 0),
  ('product', 0),
  ('service', 0);

alter table public.listing_prices enable row level security;

-- Public reads it (the posting flow needs to show "this costs €X" before
-- a dealer pays), only an admin can change it.
create policy "listing_prices: anyone reads"
  on public.listing_prices for select
  using (true);

create policy "listing_prices: admins update"
  on public.listing_prices for update
  using (public.is_admin());

grant select on public.listing_prices to anon, authenticated;
grant update on public.listing_prices to authenticated;
grant all on public.listing_prices to service_role;

-- One row per payment attempt (not per listing — a failed or abandoned
-- checkout shouldn't overwrite the record of what happened, and a dealer
-- retrying after a failure gets a fresh row rather than a lost one).
create table public.listing_payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paypal')),
  provider_reference text,
  amount_eur numeric(8, 2) not null check (amount_eur >= 0),
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listing_payments_listing_id_idx on public.listing_payments (listing_id);

comment on table public.listing_payments is
  'Payment attempts for dealer listings. Written by the checkout flow (still pending Stripe/PayPal test-mode keys) via service_role — a webhook or server action confirming payment isn''t acting as the listing owner''s own session, so it needs to bypass RLS rather than satisfy the owner-write policy below.';

alter table public.listing_payments enable row level security;

create policy "listing_payments: owner reads own"
  on public.listing_payments for select
  using (exists (select 1 from public.listings where listings.id = listing_payments.listing_id and listings.owner_id = auth.uid()));

create policy "listing_payments: admins read all"
  on public.listing_payments for select
  using (public.is_admin());

grant select on public.listing_payments to authenticated;
grant all on public.listing_payments to service_role;
