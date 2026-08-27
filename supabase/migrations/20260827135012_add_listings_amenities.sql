-- supabase/migrations/20260827135012_add_listings_amenities.sql
-- Property features (pet friendly, garage, garden, ...) — requested by
-- Charlie so listers can check these off and renters can filter by them.
-- Fixed set enforced via CHECK, matching src/lib/amenities.ts exactly; no
-- RLS/grant changes needed, same as the is_featured column — it's a plain
-- column on an already-covered table.
alter table public.listings add column amenities text[] not null default '{}';

alter table public.listings add constraint listings_amenities_valid
  check (amenities <@ array[
    'pet_friendly', 'garage', 'garden', 'balcony', 'parking',
    'furnished', 'elevator', 'washer_dryer', 'dishwasher', 'basement_storage'
  ]::text[]);

-- Lets a filter like "garage + garden" use a GIN index instead of a full
-- table scan once there's real listing volume.
create index listings_amenities_idx on public.listings using gin (amenities);
