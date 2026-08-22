-- supabase/migrations/20260822203353_add_listings_featured_flag.sql
-- Lets an admin choose which active listings show in the homepage hero's
-- 3-card fan — previously always hardcoded, disconnected from real
-- listings entirely. The hero falls back to the most recently added
-- active listings to fill any of the 3 slots not covered by a manual
-- pick, so it never looks empty just because nothing's been featured yet.
--
-- No RLS/grant changes needed: it's a plain column on an already-covered
-- table (existing table-level grants and row policies apply to it too).
alter table public.listings add column is_featured boolean not null default false;

create index listings_is_featured_idx on public.listings (is_featured) where is_featured = true;
