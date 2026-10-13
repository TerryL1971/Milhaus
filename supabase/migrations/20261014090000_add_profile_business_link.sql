-- supabase/migrations/20261014090000_add_profile_business_link.sql
-- Terry's ask, looking at the public seller profile page (/sellers/[id]):
-- it needs "text like a LinkedIn profile would have, plus a logo to their
-- business provided that give one, and a link to their website" —
-- bio already covers the headline text (profiles.bio, added earlier),
-- this adds the optional "Company" line underneath it: a small logo image
-- plus an outbound link, for a self-lister who also runs their own
-- small business (a photographer, a dog walker, etc. — not the separate
-- Charlie-run businesses directory, which is for display-advertiser
-- businesses he's vetted and charges for a listing). Both nullable and
-- self-set, same as bio/display_name — shown only when provided.

alter table profiles
  add column website_url text,
  add column business_logo_url text;
