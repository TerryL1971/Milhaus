// src/lib/listing-edit.ts
// Server actions behind ListingForm's photo uploads — edit mode
// (/edit-listing/[id]) and, since 2026-11-04, new posts too: the photo
// half, which the browser's own Supabase session can't always do by
// itself. The listing-photos storage policies only let a
// listing's *owner* write under `${listingId}/...`
// (20260821205811_storage_ownership_via_listing.sql), so Charlie fixing
// someone else's listing from /admin would be refused. Rather than a new
// storage policy (another SQL step for Terry to run by hand), these check
// "owner or admin" themselves via the caller's own session, then use the
// admin client for the storage operation only — same trusted-path
// pattern as publishFreeListing in src/lib/listing-publish.ts.
//
// The text/details half of an edit stays a plain browser-side update:
// the existing "owner updates own" / "admins update all" RLS policies on
// listings and every *_details table already cover it.

"use server";

import { isAdminRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "listing-photos";

async function assertCanEditListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  // RLS lets anyone read an *active* listing, so finding the row isn't
  // proof of anything on its own — the owner/admin check below is.
  const [{ data: listing }, { data: profile }] = await Promise.all([
    supabase.from("listings").select("id, owner_id").eq("id", listingId).maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);
  if (!listing) throw new Error("Listing not found.");
  if (listing.owner_id !== user.id && !isAdminRole(profile?.role)) {
    throw new Error("You can only edit your own listings.");
  }
}

/** One signed upload slot per new photo. Every path gets a fresh,
 * timestamped filename rather than reusing photo-N — Supabase's CDN keeps
 * serving the old bytes for an overwritten path. */
export async function createListingPhotoUploads(listingId: string, extensions: string[]) {
  await assertCanEditListing(listingId);
  const admin = createAdminClient();
  const stamp = Date.now();

  return Promise.all(
    extensions.map(async (ext, index) => {
      const path = `${listingId}/photo-${stamp}-${index + 1}.${ext}`;
      const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message ?? "Couldn't prepare the photo upload.");
      const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      return { path, token: data.token, publicUrl };
    }),
  );
}

/** Deletes photos the editor removed, after the listing itself has been
 * saved without them. Only ever touches files inside this listing's own
 * folder, whatever URLs the caller passes in. */
export async function deleteRemovedListingPhotos(listingId: string, photoUrls: string[]) {
  await assertCanEditListing(listingId);
  const marker = `/object/public/${BUCKET}/`;
  const paths = photoUrls
    .map((url) => decodeURIComponent(url.split(marker)[1] ?? ""))
    .filter((path) => path.startsWith(`${listingId}/`));
  if (paths.length === 0) return;

  const { error } = await createAdminClient().storage.from(BUCKET).remove(paths);
  // The listing no longer references these, so a failed cleanup only
  // leaves an orphaned file behind — not worth failing the save over.
  if (error) console.error("deleteRemovedListingPhotos failed:", error.message);
}
