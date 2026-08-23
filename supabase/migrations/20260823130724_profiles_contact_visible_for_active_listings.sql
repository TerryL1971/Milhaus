-- supabase/migrations/20260823130724_profiles_contact_visible_for_active_listings.sql
-- The listing detail page's "contact the lister" box only ever showed a
-- "Sign in" prompt, even to a signed-in user, because there was no way for
-- one user to read another's contact_email/contact_phone: profiles' only
-- SELECT policies scope to "your own row" or "an admin's row". A renter
-- looking at a listing had nothing to read.
--
-- Adds a narrow SELECT policy: any authenticated user can read the profile
-- of someone who owns at least one *active* listing — exactly the case the
-- detail page needs (a pending/rejected/archived listing's owner stays
-- private, since RLS on listings already hides those rows from non-owners
-- anyway). This does mean an active lister's contact_email is knowable by
-- any signed-in user who queries for it, not only visitors of that one
-- listing page (RLS is row-scoped, not query-context-scoped) — acceptable
-- for MVP, the same tradeoff most classifieds sites make by putting a
-- phone number in the ad itself.
create policy "profiles: contact info readable for active listing owners"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.listings
      where listings.owner_id = profiles.id
        and listings.status = 'active'
    )
  );
