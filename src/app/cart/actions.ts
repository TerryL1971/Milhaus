// src/app/cart/actions.ts
// Server actions for the cart — checking out pays for every item in one
// Stripe/PayPal transaction rather than one per listing (see
// src/app/checkout/[listingId]/actions.ts, the original single-item
// version this generalizes). Every item in the cart is already a saved
// `draft` listing or business, owned by the signed-in caller (ListingForm
// and the business-posting form both insert into cart_items right after
// saving their draft) — this just prices and pays for all of them at
// once, then flips every one to pending_review together.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendInvoiceEmail } from "@/lib/invoice-email";
import { capturePaypalOrder, createPaypalOrder } from "@/lib/paypal";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getCart(userId: string) {
  const supabase = await createClient();
  const { data: items, error } = await supabase.from("cart_items").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!items || items.length === 0) throw new Error("Your cart is empty.");

  const listingIds = items.filter((i) => i.listing_id).map((i) => i.listing_id as string);
  const businessIds = items.filter((i) => i.business_id).map((i) => i.business_id as string);

  const [{ data: listings }, { data: businesses }] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    businessIds.length > 0
      ? supabase.from("businesses").select("id, name").in("id", businessIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  return items.map((item) => ({
    ...item,
    name: item.listing_id
      ? (listings?.find((l) => l.id === item.listing_id)?.title ?? "Listing fee")
      : (businesses?.find((b) => b.id === item.business_id)?.name ?? "Business listing fee"),
  }));
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");
  return user;
}

export async function removeFromCart(formData: FormData) {
  const cartItemId = formData.get("cartItemId") as string;
  const user = await requireUser();

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("cart_items")
    .select("listing_id, business_id")
    .eq("id", cartItemId)
    .eq("user_id", user.id)
    .single();
  if (!item) return;

  // An abandoned draft has no other path to ever going live — clean it
  // up along with the cart entry rather than leaving an orphaned row.
  if (item.listing_id) await supabase.from("listings").delete().eq("id", item.listing_id).eq("status", "draft");
  if (item.business_id) await supabase.from("businesses").delete().eq("id", item.business_id).eq("status", "draft");

  await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id);
  revalidatePath("/cart");
}

export async function startCartStripeCheckout() {
  const user = await requireUser();
  const items = await getCart(user.id);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    client_reference_id: user.id,
    metadata: { userId: user.id },
    line_items: items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price_eur) * 100),
      },
      quantity: 1,
    })),
    success_url: `${SITE_URL}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/cart`,
  });

  const admin = createAdminClient();
  await admin.from("listing_payments").insert(
    items.map((item) => ({
      listing_id: item.listing_id,
      business_id: item.business_id,
      provider: "stripe",
      provider_reference: session.id,
      amount_eur: item.price_eur,
      status: "pending",
    })),
  );

  redirect(session.url!);
}

export async function createPaypalOrderForCart(): Promise<string> {
  const user = await requireUser();
  const items = await getCart(user.id);
  const total = items.reduce((sum, item) => sum + Number(item.price_eur), 0);
  const orderId = await createPaypalOrder(user.id, total);

  const admin = createAdminClient();
  await admin.from("listing_payments").insert(
    items.map((item) => ({
      listing_id: item.listing_id,
      business_id: item.business_id,
      provider: "paypal",
      provider_reference: orderId,
      amount_eur: item.price_eur,
      status: "pending",
    })),
  );

  return orderId;
}

export async function capturePaypalOrderForCart(orderId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const result = await capturePaypalOrder(orderId);

  const admin = createAdminClient();
  if (result.status !== "COMPLETED") {
    await admin
      .from("listing_payments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("provider_reference", orderId);
    return { ok: false };
  }

  await settleCartPayment(orderId);
  revalidatePath("/my-listings");
  revalidatePath("/cart");
  return { ok: true };
}

/** Shared by both the Stripe success page and the PayPal capture action —
 * flips every listing/business tied to this payment reference to
 * pending_review, and empties the cart for whoever just paid. Idempotent:
 * the `.eq("status", "pending")` / `.eq("status", "draft")` guards mean a
 * repeat call (a refreshed success page) doesn't re-process or error. */
export async function settleCartPayment(providerReference: string) {
  const admin = createAdminClient();

  const { data: payments } = await admin
    .from("listing_payments")
    .select("listing_id, business_id, amount_eur, provider")
    .eq("provider_reference", providerReference)
    .eq("status", "pending");

  // Nothing pending under this reference — either already settled by an
  // earlier call (a refreshed success page) or not a real payment. Either
  // way there's no invoice to (re-)send.
  if (!payments || payments.length === 0) return;

  await admin
    .from("listing_payments")
    .update({ status: "succeeded", updated_at: new Date().toISOString() })
    .eq("provider_reference", providerReference)
    .eq("status", "pending");

  const listingIds = payments.filter((p) => p.listing_id).map((p) => p.listing_id as string);
  const businessIds = payments.filter((p) => p.business_id).map((p) => p.business_id as string);

  if (listingIds.length > 0) {
    await admin
      .from("listings")
      .update({ status: "pending_review", status_changed_at: new Date().toISOString() })
      .in("id", listingIds)
      .eq("status", "draft");
  }
  if (businessIds.length > 0) {
    await admin
      .from("businesses")
      .update({ status: "pending_review" })
      .in("id", businessIds)
      .eq("status", "draft");
  }

  // Find whoever owns these and clear their cart — a payment reference
  // only ever belongs to one user's checkout.
  const ownerId = await findPaymentOwner(listingIds, businessIds);
  if (ownerId) {
    await admin.from("cart_items").delete().eq("user_id", ownerId);
    await sendSettlementInvoice({ ownerId, listingIds, businessIds, payments, providerReference });
  }
}

/** Best-effort: a failed invoice email should never undo a settlement
 * that already happened (the listing is already pending_review, the
 * payment already succeeded). sendInvoiceEmail itself never throws. */
async function sendSettlementInvoice({
  ownerId,
  listingIds,
  businessIds,
  payments,
  providerReference,
}: {
  ownerId: string;
  listingIds: string[];
  businessIds: string[];
  payments: { listing_id: string | null; business_id: string | null; amount_eur: number; provider: string }[];
  providerReference: string;
}) {
  const admin = createAdminClient();

  const [{ data: authUser }, { data: profile }, { data: listings }, { data: businesses }, adminEmails] = await Promise.all([
    admin.auth.admin.getUserById(ownerId),
    admin.from("profiles").select("display_name").eq("id", ownerId).single(),
    listingIds.length > 0 ? admin.from("listings").select("id, title").in("id", listingIds) : Promise.resolve({ data: [] }),
    businessIds.length > 0 ? admin.from("businesses").select("id, name").in("id", businessIds) : Promise.resolve({ data: [] }),
    getAdminEmails(),
  ]);

  const email = authUser?.user?.email;
  if (!email) return;

  const items = payments.map((payment) => ({
    name: payment.listing_id
      ? (listings?.find((l) => l.id === payment.listing_id)?.title ?? "Listing fee")
      : (businesses?.find((b) => b.id === payment.business_id)?.name ?? "Business listing fee"),
    priceEur: Number(payment.amount_eur),
  }));

  await sendInvoiceEmail({
    to: email,
    // Charlie's ask: he wants a copy of every receipt for his own tax
    // records — BCC every admin/owner profile rather than a hardcoded
    // address, so it stays correct if who's an admin ever changes.
    adminBcc: adminEmails,
    buyerName: profile?.display_name || email,
    invoiceNumber: providerReference.slice(-10).toUpperCase(),
    provider: payments[0].provider === "stripe" ? "stripe" : "paypal",
    items,
  });
}

/** Supabase's admin API has no "get users by id list" call, just
 * getUserById one at a time — fine here since there are only ever a
 * handful of admin/owner accounts. */
async function getAdminEmails(): Promise<string[]> {
  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("id").in("role", ["admin", "owner"]);
  if (!admins || admins.length === 0) return [];

  const results = await Promise.all(admins.map((a) => admin.auth.admin.getUserById(a.id)));
  return results.map((r) => r.data.user?.email).filter((email): email is string => !!email);
}

async function findPaymentOwner(listingIds: string[], businessIds: string[]): Promise<string | null> {
  const admin = createAdminClient();
  if (listingIds.length > 0) {
    const { data } = await admin.from("listings").select("owner_id").eq("id", listingIds[0]).single();
    return data?.owner_id ?? null;
  }
  if (businessIds.length > 0) {
    const { data } = await admin.from("businesses").select("owner_id").eq("id", businessIds[0]).single();
    return data?.owner_id ?? null;
  }
  return null;
}
