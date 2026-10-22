// src/lib/listing-views.ts
// Records a detail-page view — the one write lib/listings.ts itself
// doesn't do (that file's own header says "reads" only; see
// listing-publish.ts for the same read/write split elsewhere). Needs
// the admin client: RLS only lets a listing's own owner or an admin
// UPDATE a listings row, but a view can come from anyone, including a
// signed-out visitor (see
// supabase/migrations/20261022120000_add_listing_view_count.sql, which
// also has the atomic-increment RPC this calls — a read-then-write
// from here would race under concurrent visitors).
//
// Skipped entirely when the viewer is the listing's own owner, so an
// owner checking their own listing doesn't inflate the number Terry
// wants sellers to trust as "how many people have looked" — not "how
// many times I've refreshed this page myself."

import { createAdminClient } from "@/lib/supabase/admin";

export async function recordListingView(listingId: string, viewerId: string | null, ownerId: string): Promise<void> {
  if (viewerId === ownerId) return;
  const admin = createAdminClient();
  const { error } = await admin.rpc("increment_listing_view_count", { listing_id: listingId });
  if (error) console.error("recordListingView failed:", error.message);
}
