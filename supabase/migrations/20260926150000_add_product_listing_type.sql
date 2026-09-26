-- supabase/migrations/20260926150000_add_product_listing_type.sql
-- Third listing type: general items for sale ("Products"), the next step
-- in the Services/Products expansion scoped in docs/marketplace-vision.md
-- (Products first, Services after — Terry's call). Same pattern as `car`:
-- widen `type`, add nullable category-specific columns, reuse the review
-- pipeline and admin dashboard as-is.
--
-- price_eur_month is reused again as the one-time asking price (same
-- reasoning as the car migration) — title/description/photos/city/base
-- are shared columns already on the table.

alter table public.listings
  drop constraint if exists listings_type_check;

alter table public.listings
  add constraint listings_type_check check (type in ('rental', 'car', 'product'));

alter table public.listings
  add column product_category text
    check (product_category is null or product_category in (
      'electronics', 'furniture', 'household', 'clothing', 'baby_kids', 'other'
    )),
  add column condition text
    check (condition is null or condition in ('new', 'like_new', 'good', 'fair'));

alter table public.listings
  drop constraint if exists listings_type_fields_check;

alter table public.listings
  add constraint listings_type_fields_check check (
    (type = 'rental' and address is not null and bedrooms is not null and bathrooms is not null)
    or
    (type = 'car' and make is not null and model is not null and year is not null)
    or
    (type = 'product' and product_category is not null and condition is not null)
  );
