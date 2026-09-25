-- supabase/migrations/20260926090000_add_rental_details_and_profile_photo.sql
-- Two independent additions from the same round of Charlie feedback:
--
-- 1. Rental-specific detail fields Americans relocating here actually ask
--    about: how many parking spaces (street parking permits aren't
--    available to them), what's nearby (schools/groceries/etc — distinct
--    from the in-unit "features" amenities column), internet, heat, and
--    stove type. All nullable/optional, rental-only in practice (never
--    set on a car row) but not DB-enforced that way — nothing about them
--    is safety-critical enough to need the type_fields_check treatment
--    make/model/year already gets.
--
-- 2. A public seller profile: photo + bio on `profiles`, shown on every
--    listing's contact card and on a standalone profile page. Contact
--    info on that card is fully public (no viewer sign-in) — Charlie's
--    explicit call, modeled directly on bookoo's own seller-card pattern.

alter table public.listings
  add column parking_spaces integer check (parking_spaces is null or parking_spaces >= 0),
  add column nearby_amenities text[] not null default '{}',
  add column internet_type text check (internet_type is null or internet_type in ('dsl', 'cable', 'fiber')),
  add column internet_speed_mbps integer check (internet_speed_mbps is null or internet_speed_mbps >= 0),
  add column heat_type text check (heat_type is null or heat_type in ('gas', 'oil', 'electric')),
  add column stove_type text check (stove_type is null or stove_type in ('induction', 'standard'));

alter table public.profiles
  add column photo_url text,
  add column bio text;

-- profiles.photo_url is filled by the profile-photos bucket below;
-- read is public (the whole point — the photo shows on public listing
-- pages), write is owner-scoped by the `${auth.uid()}/...` path prefix,
-- same convention as the listing-photos bucket.
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "profile-photos: public read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

create policy "profile-photos: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile-photos: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile-photos: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public profiles need public *contact* info too (Charlie's call, see
-- above), not just "signed-in visitors" as the earlier
-- profiles_contact_visible_for_active_listings migration set up. Same
-- policy, same USING clause — just widened to include anonymous readers.
alter policy "profiles: contact info readable for active listing owners"
  on public.profiles
  to anon, authenticated;

grant select on public.profiles to anon;
