-- supabase/migrations/20261104120000_add_homes_for_sale.sql
-- Charlie's ask (2026-11-04): homes for sale alongside homes for rent.
-- Terry's decisions, same day: the homepage Categories dropdown offers
-- "Homes for Rent" and "Homes for Sale"; the Homes page gets a
-- For rent | For sale switch; and posting a home for sale has its own
-- price in Admin → Pricing.
--
-- A home for sale is still a type='rental' listing (same photos,
-- details, "Available to", editing, 30-day expiry, review pipeline) with
-- offer_type='sale'. price_eur_month holds the asking price for those,
-- the same way it already holds a car's one-time price.
--
-- Safe to run more than once.

alter table public.listings
  add column if not exists offer_type text not null default 'rent'
    check (offer_type in ('rent', 'sale'));

create index if not exists listings_type_offer_type_idx on public.listings (type, offer_type) where status = 'active';

-- Its own posting price, starting free like every other category.
alter table public.listing_prices drop constraint if exists listing_prices_type_check;
alter table public.listing_prices add constraint listing_prices_type_check
  check (type in ('rental', 'rental_sale', 'car', 'product', 'service', 'business'));
insert into public.listing_prices (type, price_eur) values ('rental_sale', 0)
on conflict do nothing;
