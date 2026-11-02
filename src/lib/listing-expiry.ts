// src/lib/listing-expiry.ts
// "Another 30 days" for a renewed listing — shared by the free renewal
// (renewMyListing in my-listings/actions.ts) and the paid one, which
// lands here from settleCartPayment once Stripe confirms the charge.
// Server-only: takes the service-role client, since the expiry trigger
// (20261102150000_add_listing_expiry.sql) refuses expiry changes from a
// plain signed-in session.
//
// - expired -> active: the trigger itself sets a fresh now() + 30 days.
// - still active (renewed early, from the 3-day warning): 30 days on top
//   of the time it had left, so renewing early never costs anyone days.

import type { createAdminClient } from "@/lib/supabase/admin";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function extendExpiry(admin: ReturnType<typeof createAdminClient>, listingIds: string[]) {
  if (listingIds.length === 0) return;
  const { data: listings, error } = await admin
    .from("listings")
    .select("id, status, expires_at")
    .in("id", listingIds)
    .in("status", ["active", "expired"]);
  if (error) throw new Error(error.message);

  for (const listing of listings ?? []) {
    const update =
      listing.status === "expired"
        ? { status: "active" }
        : {
            expires_at: new Date(
              Math.max(Date.now(), new Date((listing.expires_at as string | null) ?? Date.now()).getTime()) +
                THIRTY_DAYS_MS,
            ).toISOString(),
            expiry_warning_sent_at: null,
          };
    const { error: updateError } = await admin.from("listings").update(update).eq("id", listing.id);
    if (updateError) throw new Error(updateError.message);
  }

  // A renewal still sitting unpaid in the poster's cart is settled now —
  // e.g. Charlie granted the free 30 days after they'd pressed Renew on
  // a paid category. Leaving the cart line would let them pay for days
  // they already have.
  await admin.from("cart_items").delete().in("listing_id", listingIds);
}
