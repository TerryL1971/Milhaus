-- supabase/migrations/20261013160000_add_profile_cover_image.sql
-- Terry's clarification: the LinkedIn-style hero-photo + overlapping
-- avatar reference was for seller profiles (whoever posted a home/car),
-- not just the business directory this was first built for. A person's
-- profile already has photo_url (their avatar); this is the wide banner
-- image behind it, same relationship as businesses.cover_image_url to
-- businesses.logo_url.

alter table profiles
  add column cover_image_url text;
