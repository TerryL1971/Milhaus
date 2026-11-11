-- supabase/migrations/20261111120000_promotion_settings.sql
-- Admin → Promotion (Terry's ask for Charlie, 2026-11-11): Charlie turns a
-- free-posting promotion on or off himself, picks which categories it
-- covers (e.g. "free car ads all July"), sets the dates, and writes the
-- banner text shown at the top of every page while it runs.
--
-- Builds on the one-row site_settings table from
-- 20261019090000_add_site_settings_free_until.sql. free_until stays the
-- promotion's end (the moment it stops: midnight Berlin time after the
-- last free day); the new columns are the rest of the promotion.
-- Safe to run more than once.

alter table public.site_settings
  add column if not exists promo_enabled boolean not null default false,
  add column if not exists promo_starts_at timestamptz,
  -- Which posting prices the promotion makes free (listing_prices.type
  -- values). null = every category, which is how the old launch promo
  -- worked.
  add column if not exists promo_types text[],
  add column if not exists promo_banner boolean not null default true,
  add column if not exists promo_banner_en text,
  add column if not exists promo_banner_de text;

-- Keep whatever the old launch promo was doing: a date that was set
-- counts as "on" (the current one has already ended, so nothing
-- changes on the site).
update public.site_settings
  set promo_enabled = true
  where free_until is not null and promo_enabled = false and promo_starts_at is null;

alter table public.site_settings drop constraint if exists site_settings_promo_banner_length;
alter table public.site_settings
  add constraint site_settings_promo_banner_length
  check (coalesce(char_length(promo_banner_en), 0) <= 200 and coalesce(char_length(promo_banner_de), 0) <= 200);
