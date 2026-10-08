-- supabase/migrations/20261008160000_add_favorites_and_lister_badges.sql
-- Two unrelated additions from the same conversation:
--
-- 1. Favorites — a signed-in user can heart a listing from the Homes or
--    Cars browse grid; their favorites then sort first on those pages.
--    One row per (user, listing). RLS: a user only ever sees/writes
--    their own rows — this is a private "my favorites" list, not a
--    public like-count.
--
-- 2. is_new (rental_details) / low_mileage (car_details) — two of the
--    "Key Badges" from the category spec that don't correspond to
--    anything computable from existing data. Terry's call: the person
--    listing the item decides, same as how product condition already
--    has a self-reported "like_new" option — not an auto-computed
--    "listed in the last N days" rule.

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "favorites: users manage their own" on public.favorites
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index favorites_listing_id_idx on public.favorites (listing_id);

alter table public.rental_details add column is_new boolean not null default false;
alter table public.car_details add column low_mileage boolean not null default false;
