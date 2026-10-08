-- supabase/migrations/20261008150000_add_businesses_directory.sql
-- Military-Friendly Businesses directory, from Charlie's homepage
-- mockup — a separate, much smaller feature than listings: Charlie
-- hand-enters each business himself (name, category, rating/review
-- count, a few tag flags) rather than businesses self-registering, so
-- this skips all of the review pipeline/ownership machinery listings
-- have. No owner_id, no status workflow — just is_active, so Charlie
-- can hide one without deleting its data.
--
-- rating/review_count are plain admin-entered numbers, not computed
-- from a real review system — there isn't one. tags is a small fixed
-- set (english_friendly/military_friendly/vat_form_accepted), same
-- array-of-keys pattern as listings.amenities elsewhere in this schema.

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (
    category in ('car_sales', 'moving_relocation', 'auto_repair', 'food_dining', 'real_estate', 'legal_financial', 'health_wellness', 'shopping_retail', 'other')
  ),
  city text not null,
  base text, -- nullable: not every business is tied to one specific garrison
  rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  review_count integer check (review_count is null or review_count >= 0),
  tags text[] not null default '{}',
  logo_url text,
  website_url text,
  phone text,
  is_active boolean not null default true,
  is_featured boolean not null default false, -- shows in the homepage's 4-card strip
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

-- Public (including anon) can read active businesses — same visibility
-- model as the public listings grid.
create policy "businesses: public reads active" on public.businesses
  for select
  using (is_active = true);

-- Only admins manage the directory — Charlie enters these himself, no
-- self-registration flow.
create policy "businesses: admins manage" on public.businesses
  for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index businesses_is_active_idx on public.businesses (is_active);
create index businesses_is_featured_idx on public.businesses (is_featured);
