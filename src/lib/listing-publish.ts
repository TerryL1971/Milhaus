// src/lib/listing-publish.ts
// Server action ListingForm ("use client", shared by /post, /post-car,
// /post-product, /post-service) calls right after a free self-listing is
// saved — Charlie's call (via Terry, 2026-10-15): with postings
// potentially reaching hundreds a day, he doesn't want to manually
// approve every one before it's visible; he'll monitor the live site and
// take down anything that's cheating instead. Paid listings get the same
// treatment in settleCartPayment (src/app/cart/actions.ts) once Stripe
// confirms payment.
//
// A plain client-side update to status='active' would hit
// enforce_listing_review_gate (supabase/migrations/20260821095414_init_schema.sql)
// — that trigger deliberately blocks a non-admin session from
// self-activating its own listing, specifically to prevent ghost/
// unreviewed posts. It exempts service-role writes on purpose (the
// migration's own comment: "trusted server-side paths ... must stay
// exempt"), so this does the ownership check itself (via the caller's own
// session, same as the "owner reads own listings" RLS policy would) and
// only then flips it with the admin client — the trigger's protection
// stays intact for every other path, this just adds one more trusted one.

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function publishFreeListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: listing } = await supabase
    .from("listings")
    .select("id, status")
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!listing) throw new Error("Listing not found.");
  if (listing.status !== "pending_review") return; // already active, or not actually free

  const admin = createAdminClient();
  const { error } = await admin.from("listings").update({ status: "active" }).eq("id", listingId);
  if (error) throw new Error(error.message);
}
