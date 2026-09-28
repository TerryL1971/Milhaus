// src/app/checkout/[listingId]/success/page.tsx
// Landing page after payment. Two arrivals:
// - Stripe redirects here with ?session_id=... after its own hosted
//   checkout page — this route is what actually confirms the payment
//   (retrieves the session from Stripe directly, doesn't trust the
//   redirect alone) and flips the listing to pending_review.
// - PayPal never leaves the checkout page; its button already called
//   capturePaypalOrderAction server-side (the real confirmation) before
//   pushing here with ?provider=paypal, so this just displays success.

import Link from "next/link";
import { notFound } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = Promise<{ listingId: string }>;
type SearchParams = Promise<{ session_id?: string; provider?: string }>;

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { listingId } = await params;
  const { session_id: sessionId, provider } = await searchParams;

  if (provider === "paypal") {
    return <Confirmation />;
  }

  if (!sessionId) notFound();

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== listingId || session.payment_status !== "paid") {
    return (
      <main className="flex-1 py-14">
        <div className="mx-auto max-w-[480px] px-8 text-center">
          <p className="mb-2 font-display text-xl font-semibold text-ink">Payment not confirmed</p>
          <p className="mb-4 text-sm text-ink-soft">
            If you completed payment and see this, contact the site admin — nothing was charged twice.
          </p>
          <Link href={`/checkout/${listingId}`} className="text-sm font-semibold text-olive-deep hover:underline">
            Back to checkout
          </Link>
        </div>
      </main>
    );
  }

  // Idempotent on purpose — a refresh of this page shouldn't error or
  // double-process just because the payment was already confirmed once.
  const admin = createAdminClient();
  await admin
    .from("listing_payments")
    .update({ status: "succeeded", updated_at: new Date().toISOString() })
    .eq("provider_reference", sessionId)
    .eq("status", "pending");
  await admin
    .from("listings")
    .update({ status: "pending_review", status_changed_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("status", "draft");

  return <Confirmation />;
}

function Confirmation() {
  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[480px] px-8 text-center">
        <p className="mb-2 font-display text-xl font-semibold text-ink">Payment received</p>
        <p className="mb-4 text-sm text-ink-soft">
          Your listing has been submitted for review — we'll take a look, usually the same day.
        </p>
        <Link href="/my-listings" className="text-sm font-semibold text-olive-deep hover:underline">
          Go to My listings
        </Link>
      </div>
    </main>
  );
}
