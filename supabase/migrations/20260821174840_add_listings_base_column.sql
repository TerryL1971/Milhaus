-- supabase/migrations/20260821174840_add_listings_base_column.sql
-- Adds `base` (the nearest military base/community, e.g. "Stuttgart",
-- "Ramstein") to listings. This was already implied by the approved
-- mockup — the hero search bar's "Near base" dropdown, and step 3's
-- "filter chips by city/base" requirement — just missing from the
-- data model's column list in CLAUDE.md. Distinct from `city` (a listing
-- in Böblingen is filed under the Stuttgart base community) and from
-- `distance_to_base` (free text like "12 min to Panzer Kaserne").
--
-- Nullable for now since the post-a-listing form (not built yet) is what
-- will actually populate this on self-listed rows.
alter table public.listings add column base text;

create index listings_base_idx on public.listings (base);
