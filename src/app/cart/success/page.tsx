// src/app/cart/success/page.tsx
// Landing page after a cart checkout. Two arrivals, same split as the
// original single-listing version (src/app/checkout/[listingId]/success):
// - Stripe redirects here with ?session_id=... — this route confirms the
//   session directly with Stripe (doesn't trust the redirect alone) and
//   settles every item tied to it.
// - PayPal's capture already happened server-side before the button
//   pushed here with ?provider=paypal, so this just displays success.

import Link from "next/link";
import { notFound } from "next/navigation";
import { settleCartPayment } from "@/app/cart/actions";
import { getStripe } from "@/lib/stripe";

type SearchParams = Promise<{ session_id?: string; provider?: string }>;

export default async function CartSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { session_id: sessionId, provider } = await searchParams;

  if (provider === "paypal") {
    return <Confirmation />;
  }

  if (!sessionId) notFound();

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return (
      <main className="flex-1 py-14">
        <div className="mx-auto max-w-[480px] px-8 text-center">
          <p className="mb-2 font-display text-xl font-semibold text-ink">Payment not confirmed</p>
          <p className="mb-4 text-sm text-ink-soft">
            If you completed payment and see this, contact the site admin — nothing was charged twice.
          </p>
          <Link href="/cart" className="text-sm font-semibold text-olive-deep hover:underline">
            Back to cart
          </Link>
        </div>
      </main>
    );
  }

  // Idempotent on purpose — a refresh of this page shouldn't error or
  // double-process just because the payment was already settled once.
  await settleCartPayment(sessionId);

  return <Confirmation />;
}

function Confirmation() {
  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[480px] px-8 text-center">
        <p className="mb-2 font-display text-xl font-semibold text-ink">Payment received</p>
        <p className="mb-4 text-sm text-ink-soft">
          Everything in your cart has been submitted for review — we'll take a look, usually the same
          day.
        </p>
        <Link href="/my-listings" className="text-sm font-semibold text-olive-deep hover:underline">
          Go to My listings
        </Link>
      </div>
    </main>
  );
}
