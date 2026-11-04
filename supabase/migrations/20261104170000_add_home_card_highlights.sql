-- supabase/migrations/20261104170000_add_home_card_highlights.sql
-- Terry's ask (2026-11-04): when someone lists a home (for rent or for
-- sale) they star which features / what's-nearby items show on its
-- card, and the card fits them on one line. Holds amenity and
-- nearby-amenity keys in the order they were starred; the two key sets
-- don't overlap, so one list covers both. Empty = the card falls back to
-- the first few features, as before.
--
-- Safe to run more than once.

alter table public.rental_details
  add column if not exists highlights text[] not null default '{}';
