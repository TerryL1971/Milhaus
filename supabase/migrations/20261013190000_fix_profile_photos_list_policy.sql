-- supabase/migrations/20261013190000_fix_profile_photos_list_policy.sql
-- Same issue, same fix as supabase/migrations/20260821150254_fix_storage_list_policy.sql
-- + 20260821221629_storage_owner_select_for_upsert.sql already applied to
-- listing-photos — just never done for profile-photos too. Terry spotted
-- Supabase's own dashboard warning on it directly: a broad
-- `using (bucket_id = 'profile-photos')` SELECT policy lets any client
-- call Storage's list endpoint and enumerate every file in the bucket
-- (every user's folder/filename), not just fetch a file whose path they
-- already know. A public bucket doesn't need this at all — direct
-- `/storage/v1/object/public/...` reads bypass RLS entirely for public
-- buckets, which is what every <img src={photoUrl}> in this app actually
-- uses (Avatar, SellerCard, the profile/business pages, etc.) — this
-- policy was never what made those work.
--
-- Narrowing to owner-only (not dropping entirely) for the same reason as
-- listing-photos: `upload(path, file, { upsert: true })` compiles to
-- `INSERT ... ON CONFLICT ... DO UPDATE`, and Postgres needs SELECT
-- visibility under RLS to evaluate that conflict check — with zero
-- SELECT policies, the upsert in profile-editor.tsx's photo/cover upload
-- would start failing as an RLS violation.

drop policy "profile-photos: public read" on storage.objects;

create policy "profile-photos: owner select via path"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
