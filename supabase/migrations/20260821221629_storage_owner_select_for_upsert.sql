-- supabase/migrations/20260821221629_storage_owner_select_for_upsert.sql
-- Restores a SELECT policy on storage.objects — narrow this time, scoped
-- to the same "a listings row with this id exists and you own it" check
-- as the insert/update/delete policies, not the broad "select = true" one
-- that got removed for leaking the ability to list the whole bucket.
--
-- Without any SELECT policy, `upload(..., { upsert: true })` breaks: it
-- compiles to `INSERT ... ON CONFLICT (name, bucket_id) DO UPDATE`, and
-- Postgres needs SELECT visibility under RLS to even check whether a
-- conflicting row exists — with zero SELECT policies, that check can never
-- succeed, so the whole statement is rejected as an RLS violation
-- regardless of whether a real conflict exists. Reproduced directly
-- against a local Postgres before writing this fix.
create policy "listing-photos: owner select via listing"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and exists (
      select 1 from public.listings
      where id::text = (storage.foldername(name))[1]
        and owner_id = auth.uid()
    )
  );
