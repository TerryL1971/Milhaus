-- supabase/migrations/20261013150000_add_business_profile_fields.sql
-- Charlie's ask: business listings should be more visual — a photo-
-- forward tile like the car cards, room to write about the business and
-- list promotions/discounts, and a real clickable profile page with a
-- hero/cover image plus the existing logo as a profile-picture-style
-- avatar (LinkedIn-style layout was the reference).
--
-- logo_url already exists and becomes the "profile picture"; these three
-- are new. `description` is long-form "about the business" copy,
-- distinct from nothing that existed before (businesses had no body text
-- at all). `promotion` is a short one-liner, not a structured
-- discount/code system — just something to display prominently, e.g.
-- "10% off for military ID holders".

alter table businesses
  add column cover_image_url text,
  add column description text,
  add column promotion text;
