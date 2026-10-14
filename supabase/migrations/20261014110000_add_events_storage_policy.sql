-- supabase/migrations/20261014110000_add_events_storage_policy.sql
-- Event cover/gallery photos are uploaded to listing-photos (same public
-- bucket everything else uses) under a `_events/{eventId}/...` prefix —
-- not a real listings.id, so the existing "owner upload via listing"
-- policy (which checks the path's first segment against a listing the
-- uploader owns) doesn't and shouldn't match it. Rather than reach for
-- the service-role admin client in the create-event server action (which
-- would bypass RLS entirely and move the real authorization check out of
-- the database, unlike every other admin action in this codebase), this
-- adds a narrow policy: an admin/owner-role profile may insert under
-- `_events/` specifically. No matching update/select policy — events are
-- create-once (no edit page, same as businesses), so every upload targets
-- a fresh path and never needs upsert's ON CONFLICT check.

create policy "listing-photos: admins write under _events"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = '_events'
    and exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'))
  );
