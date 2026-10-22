-- supabase/migrations/20261022120000_add_listing_view_count.sql
-- "So they can see how many people have looked" (Terry) — a plain view
-- counter on every listing, shown only to the listing's own owner (on
-- /my-listings and on the detail page itself), never publicly. Lives on
-- `listings` itself, not a per-type details table, since it applies the
-- same way to all four listing types.
--
-- Incremented via a dedicated RPC rather than a plain client-side
-- UPDATE: RLS only lets a listing's owner or an admin UPDATE a listings
-- row (see 20260821095414_init_schema.sql), but a view can come from
-- anyone, including a signed-out visitor — so the increment has to run
-- through the service-role admin client instead (see
-- src/lib/listing-views.ts), and a SQL function gives an atomic
-- `+ 1` that a read-then-write from application code couldn't guarantee
-- under concurrent visitors.

alter table public.listings
  add column view_count integer not null default 0;

create or replace function public.increment_listing_view_count(listing_id uuid)
returns void
language sql
as $$
  update public.listings set view_count = view_count + 1 where id = listing_id;
$$;
