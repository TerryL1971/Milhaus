-- supabase/migrations/20261009120000_universal_pricing_business_posting_and_cart.sql
-- Three changes from the same conversation, charging-related:
--
-- 1. Every listing type now costs something to post (not just dealer
--    accounts) — Terry's call, a real reversal of the original "only
--    dealers pay" model. No schema change needed for this part; it's
--    the app-layer gate in getDealerGatePrice that changes, not the
--    listing_prices table itself.
--
-- 2. Businesses become a real paid self-serve submission — previously
--    Charlie hand-entered every row with no owner and no review step.
--    Adds owner_id (null = one of Charlie's original hand-entered
--    rows, not a self-serve submission) and status (the same draft ->
--    pending_review -> active pipeline every other listing type
--    already has). Existing rows default to status='active' so
--    nothing Charlie already entered disappears. 'business' also joins
--    listing_prices as a 5th priced category, reusing the exact same
--    admin pricing table/page rather than a separate one.
--
-- 3. cart_items — the actual "shopping cart." One row per unpaid draft
--    (a listing OR a business, never both) a signed-in user has queued
--    up; checking out pays for everything in the cart in one Stripe/
--    PayPal session. price_eur is a snapshot at add-time so a later
--    admin price change doesn't retroactively change what's already in
--    someone's cart.

alter table public.businesses
  add column owner_id uuid references public.profiles(id) on delete cascade,
  add column status text not null default 'active'
    check (status in ('draft', 'pending_review', 'active', 'archived'));

-- An owner can see their own submission regardless of is_active/status
-- (so they can find it again while it's still pending_review) — the
-- existing "public reads active" policy only covers is_active=true.
create policy "businesses: owners read their own" on public.businesses
  for select
  using (owner_id = auth.uid());

create policy "businesses: owners insert their own" on public.businesses
  for insert
  with check (owner_id = auth.uid() and status in ('draft', 'pending_review'));

alter table public.listing_prices drop constraint listing_prices_type_check;
alter table public.listing_prices add constraint listing_prices_type_check
  check (type in ('rental', 'car', 'product', 'service', 'business'));
insert into public.listing_prices (type, price_eur) values ('business', 0);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  price_eur numeric(8, 2) not null check (price_eur >= 0),
  created_at timestamptz not null default now(),
  check (
    (listing_id is not null and business_id is null) or
    (listing_id is null and business_id is not null)
  )
);

alter table public.cart_items enable row level security;

create policy "cart_items: users manage their own" on public.cart_items
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index cart_items_user_id_idx on public.cart_items (user_id);
