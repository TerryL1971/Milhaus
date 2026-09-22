-- supabase/migrations/20260922100000_add_car_listing_type.sql
-- Second listing type: car ads. CLAUDE.md flagged this from day one —
-- "type is extensible... build the listing engine generically enough to
-- support a second content type without a rewrite" — so this reuses the
-- existing `listings` table and the same review pipeline rather than a
-- parallel schema or a second admin queue.
--
-- Design choices worth knowing about later:
--   * `type` now allows 'car' alongside 'rental'.
--   * Car-only columns (make/model/year/mileage_km) are nullable — always
--     NULL on a rental row, required on a car row via the check below.
--   * Rental-only columns (address/bedrooms/bathrooms) are relaxed to
--     nullable for the same reason, in the other direction.
--   * price_eur_month is kept as the one price column for both types —
--     for a car it holds the one-time asking price. Only the UI's
--     "/ month" suffix is type-conditional, not the schema.
--   * source stays housing_office | self_listed, but a car ad is always
--     self_listed — there's no housing-office equivalent for cars. That's
--     enforced in the app layer (the post-a-car form never offers
--     housing_office), not here, since a future dealer feed might want it.
--   * Nothing about RLS, storage policies, or the review-gate trigger
--     needs to change — they all key off status/owner_id/role, not type.

-- Replace the ('rental')-only check with one that also allows 'car'.
-- listings_type_check is Postgres's default generated name for the
-- original inline `type text ... check (type in ('rental'))` column
-- constraint (confirmed against the live schema, not guessed).
alter table public.listings
  drop constraint if exists listings_type_check;

alter table public.listings
  add constraint listings_type_check check (type in ('rental', 'car'));

alter table public.listings
  alter column address drop not null,
  alter column bedrooms drop not null,
  alter column bathrooms drop not null;

alter table public.listings
  add column make text,
  add column model text,
  add column year integer check (year is null or (year between 1900 and 2100)),
  add column mileage_km integer check (mileage_km is null or mileage_km >= 0);

alter table public.listings
  add constraint listings_type_fields_check check (
    (type = 'rental' and address is not null and bedrooms is not null and bathrooms is not null)
    or
    (type = 'car' and make is not null and model is not null and year is not null)
  );

comment on column public.listings.price_eur_month is
  'The listing''s asking price. Monthly rent for type=rental; one-time asking price for type=car — only the UI''s "/ month" suffix is type-conditional.';
