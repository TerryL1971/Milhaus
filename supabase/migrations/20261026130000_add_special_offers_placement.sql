-- supabase/migrations/20261026130000_add_special_offers_placement.sql
-- Charlie's ask: a homepage "Special Offers" row of up to 3 cards, sized
-- like the /cars sidebar ad (300x600) — explicitly not the same thing
-- as a banner ad, just managed the same simple way he already knows
-- (/admin/ads), so this is a third ad_slots placement rather than a
-- whole new content type + admin page. Replaces the homepage's old
-- "Featured Buy & Sell" preview of real product listings.

alter table public.ad_slots drop constraint ad_slots_placement_check;
alter table public.ad_slots add constraint ad_slots_placement_check
  check (placement in ('site_banner', 'cars_sidebar', 'special_offers'));
