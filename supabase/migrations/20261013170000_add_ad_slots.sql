-- supabase/migrations/20261013170000_add_ad_slots.sql
-- Charlie's ask: a way to add/manage the banner ads he charges
-- advertisers for, himself, instead of asking for a code change every
-- time someone buys a spot. Two placements exist today, matching the two
-- real ad surfaces already built:
--   - 'site_banner'   the horizontal SponsorBannerCarousel strip, shown
--                      on the homepage and every category page
--   - 'cars_sidebar'   the single sidebar slot on /cars only
--                      (src/components/cars-sidebar-banner.tsx)
--
-- Same shape SponsorBannerCarousel's old hardcoded SLIDES array already
-- used: either a real image (image_url + link_url), or a plain text
-- fallback (heading + body_text + link_url) for an advertiser with no
-- creative yet — "Advertise here" is just a row of this table Charlie
-- can't delete, not a special case in the code.

create table public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('site_banner', 'cars_sidebar')),
  -- Who Charlie is actually billing for this slot — shown only in
  -- /admin/ads, never on the public site (the ad itself is the image or
  -- heading/body text below).
  advertiser_name text not null,
  image_url text,
  heading text,
  body_text text,
  link_url text not null,
  is_active boolean not null default true,
  -- Lower sorts first — the site_banner carousel cycles through active
  -- rows in this order; cars_sidebar only ever shows the first.
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ad_slots enable row level security;

-- Public (including anon) can read active ads — same visibility model
-- as businesses/listings.
create policy "ad_slots: public reads active" on public.ad_slots
  for select
  using (is_active = true);

-- Only admins manage ad slots. role in ('admin', 'owner') — not just
-- 'admin' like the businesses table's own policy — to match
-- isAdminRole()'s actual definition (src/lib/roles.ts) and not quietly
-- lock out an 'owner'-role account the way that one would.
create policy "ad_slots: admins manage" on public.ad_slots
  for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'))
  );

create index ad_slots_placement_active_idx on public.ad_slots (placement, is_active, sort_order);
