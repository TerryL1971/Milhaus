-- supabase/migrations/20260821205811_storage_ownership_via_listing.sql
-- Pivots listing-photos ownership from "${auth.uid()}/..." folders to
-- "${listing.id}/..." folders — discussed with Terry when the post-a-
-- listing form's design came up, implementing it now that the form
-- actually needs it.
--
-- Why: a lister needs to see all their own listing's photos grouped
-- together, and the upload has to happen for a *listing* that already
-- exists (create the draft row first, then attach photos to it) rather
-- than a flat per-user bucket. Ownership is now verified by checking that
-- a listings row exists with that id AND owner_id = auth.uid() — the
-- listing row must exist before its folder can be written to, which is
-- exactly the post-a-listing flow's sequence (create draft -> upload
-- photos -> mark pending_review).

drop policy "listing-photos: owner upload" on storage.objects;
drop policy "listing-photos: owner update" on storage.objects;
drop policy "listing-photos: owner delete" on storage.objects;

create policy "listing-photos: owner upload via listing"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and exists (
      select 1 from public.listings
      where id::text = (storage.foldername(name))[1]
        and owner_id = auth.uid()
    )
  );

create policy "listing-photos: owner update via listing"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and exists (
      select 1 from public.listings
      where id::text = (storage.foldername(name))[1]
        and owner_id = auth.uid()
    )
  );

create policy "listing-photos: owner delete via listing"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and exists (
      select 1 from public.listings
      where id::text = (storage.foldername(name))[1]
        and owner_id = auth.uid()
    )
  );
