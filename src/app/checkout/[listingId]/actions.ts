// src/app/checkout/[listingId]/actions.ts
// Server actions for the dealer-posting checkout flow. A listing only
// reaches here if it's still in `draft` (ListingForm stops short of
// submitting it for review when the poster is a dealer and the category
// costs something — see src/components/listing-form.tsx) and belongs to
// the signed-in caller; both are re-checked here rather than trusted from
// the client, since anyone could otherwise call these actions directly
// with someone else's listing id.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { capturePaypalOrder, createPaypalOrder } from "@/lib/paypal";
import { getListingPrice } from "@/lib/listing-prices";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/types";

const TYPE_LABELS: Record<ListingType, string> = {
  rental: "Rental listing fee",
  car: "Car listing fee",
  product: "Item listing fee",
  service: "Service listing fee",
};

async function getPayableListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, type, owner_id, status")
    .eq("id", listingId)
    .single();
  if (error || !listing) throw new Error("Listing not found.");
  if (listing.owner_id !== user.id) throw new Error("That's not your listing.");
  if (listing.status !== "draft") throw new Error("This listing has already been submitted or paid for.");

  const priceEur = await getListingPrice(listing.type as ListingType);
  if (priceEur <= 0) throw new Error("This category doesn't currently require payment.");

  return { listing, priceEur };
}

export async function startStripeCheckout(listingId: string) {
  const { listing, priceEur } = await getPayableListing(listingId);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: listing.id,
    metadata: { listingId: listing.id },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: TYPE_LABELS[listing.type as ListingType] },
          unit_amount: Math.round(priceEur * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/checkout/${listing.id}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/checkout/${listing.id}`,
  });

  const admin = createAdminClient();
  await admin.from("listing_payments").insert({
    listing_id: listing.id,
    provider: "stripe",
    provider_reference: session.id,
    amount_eur: priceEur,
    status: "pending",
  });

  redirect(session.url!);
}

export async function createPaypalOrderAction(listingId: string): Promise<string> {
  const { listing, priceEur } = await getPayableListing(listingId);
  const orderId = await createPaypalOrder(listing.id, priceEur);

  const admin = createAdminClient();
  await admin.from("listing_payments").insert({
    listing_id: listing.id,
    provider: "paypal",
    provider_reference: orderId,
    amount_eur: priceEur,
    status: "pending",
  });

  return orderId;
}

export async function capturePaypalOrderAction(listingId: string, orderId: string): Promise<{ ok: boolean }> {
  const { listing } = await getPayableListing(listingId);
  const result = await capturePaypalOrder(orderId);

  const admin = createAdminClient();
  if (result.status !== "COMPLETED") {
    await admin
      .from("listing_payments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("provider_reference", orderId);
    return { ok: false };
  }

  await admin
    .from("listing_payments")
    .update({ status: "succeeded", updated_at: new Date().toISOString() })
    .eq("provider_reference", orderId);
  await admin
    .from("listings")
    .update({ status: "pending_review", status_changed_at: new Date().toISOString() })
    .eq("id", listing.id)
    .eq("status", "draft");

  revalidatePath("/my-listings");
  return { ok: true };
}
