-- supabase/migrations/20261021120000_add_business_logo_cover_upload_policy.sql
-- Charlie couldn't make sense of "Logo URL" / "Cover image URL" text
-- fields on /post-business — he needed somewhere to actually find a URL
-- for his own logo first, which was never the point (Terry: just upload
-- the file). No new column needed — businesses.logo_url/cover_image_url
-- already exist and already hold a public URL either way; this just lets
-- a real file upload land there instead of requiring the submitter to
-- have hosted the image somewhere else first.
--
-- Reuses the existing listing-photos bucket (no new bucket needed) under
-- a `${businessId}/...` prefix, same ownership-via-row pattern as
-- listing-photos' own "owner upload via listing" policy: the business
-- row has to exist first (not just a bare UUID), so both actual paths
-- that write here create/already have the row before uploading:
--   - A self-serve submission (src/app/[locale]/post-business/actions.ts)
--     inserts the business (owner_id = the submitter) before uploading,
--     so the first clause below matches.
--   - Charlie adding one directly (src/app/admin/businesses/new) has no
--     owner_id at all (it's his own hand-entered row, not a self-serve
--     one) — the second clause covers that by role instead, matching
--     the same admin-bypass reasoning as events' own `_events/` policy.
create policy "listing-photos: write business logo/cover"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (
      exists (
        select 1 from public.businesses
        where id::text = (storage.foldername(name))[1]
          and owner_id = auth.uid()
      )
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'owner')
      )
    )
  );
