-- supabase/migrations/20261013130000_add_listing_bases_array.sql
-- Charlie's ask: a dealer/business selling a car isn't tied to one base
-- the way a rental is — they might advertise it at one base, a region
-- (e.g. Ramstein + Kaiserslautern), or every location. `base` (singular)
-- stays as every listing's one "primary" value, used everywhere that
-- already expects a single string (admin table, card subtitles); `bases`
-- holds the full set for car listings that advertise at more than one.
-- Null/empty on every other type, and on a car with just one base picked
-- (no point duplicating `base` into a one-element array).

alter table listings
  add column bases text[];
