-- supabase/migrations/20261013120000_add_business_social_links.sql
-- Charlie's ask: businesses should be able to show Instagram, Facebook,
-- and WhatsApp on their directory listing, clickable with the matching
-- logo — on top of the website_url/phone the table already had.
-- whatsapp_number is kept separate from phone (not reused) since a
-- wa.me link needs a specific international-digits-only format, not
-- necessarily how someone types their regular contact phone number.

alter table businesses
  add column instagram_url text,
  add column facebook_url text,
  add column whatsapp_number text;
