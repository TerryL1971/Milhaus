-- supabase/migrations/20261013140000_add_individual_lister_self_flag.sql
-- Charlie's ask: individuals/military ID card holders post for free;
-- businesses/dealers still pay. Self-declared (a checkbox on the
-- poster's own profile), not admin-reviewed — Terry's call, honor
-- system for now.
--
-- Deliberately NOT reusing the existing `role` enum (which already has
-- an "individual_lister" value, unused for pricing since the
-- charge-everyone change) — `role` is admin-only settable today and
-- also carries admin/owner access levels; letting a user write to that
-- column themselves would risk them setting it to something with more
-- access than intended. A dedicated boolean can't do that.

alter table profiles
  add column is_individual_lister boolean not null default false;

-- Anyone can set this on their own row (same as display_name/bio
-- already allow) — RLS already has an "update own profile" policy from
-- the initial schema; this column is covered by it automatically since
-- it's a plain column grant, not a new policy.
