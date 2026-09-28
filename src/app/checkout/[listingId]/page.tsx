// src/app/checkout/[listingId]/page.tsx
// "Pay to post" — where ListingForm sends a dealer once their listing is
// saved as a draft, for a category Charlie's priced. Outside the
// [locale] segment on purpose, same as /admin — a short transactional
// flow doesn't need i18n routing, matching that existing precedent.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startStripeCheckout } from "@/app/checkout/[listingId]/actions";
import { PaypalCheckoutButton } from "@/components/paypal-checkout-button";
import { getListingPrice } from "@/lib/listing-prices";
import { createClient } from "@/lib/supabase/server";
import type { ListingType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Pay to post",
  robots: { index: false, follow: false },
};

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

type Params = Promise<{ listingId: string }>;

export default async function CheckoutPage({ params }: { params: Params }) {
  const { listingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/checkout/${listingId}`);

  const { data: listing } = await supabase
    .from("listings")
    .select("id, type, title, owner_id, status")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.owner_id !== user.id) notFound();

  if (listing.status !== "draft") {
    return (
      <main className="flex-1 py-14">
        <div className="mx-auto max-w-[520px] px-8 text-center">
          <p className="mb-2 font-display text-xl font-semibold text-ink">
            {listing.status === "pending_review" || listing.status === "active"
              ? "This listing is already paid for"
              : "This listing isn't waiting on payment"}
          </p>
          <Link href="/my-listings" className="text-sm font-semibold text-olive-deep hover:underline">
            Go to My listings
          </Link>
        </div>
      </main>
    );
  }

  const priceEur = await getListingPrice(listing.type as ListingType);
  if (priceEur <= 0) redirect("/my-listings");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[480px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Pay to post</h1>
        <p className="mb-8 text-ink-soft">
          &ldquo;{listing.title}&rdquo; is saved and ready to go &mdash; this category costs{" "}
          <span className="font-semibold text-ink">{currencyFormatter.format(priceEur)}</span> to submit
          for review.
        </p>

        <div className="flex flex-col gap-3 rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]">
          <form action={startStripeCheckout.bind(null, listing.id)}>
            <button
              type="submit"
              className="w-full rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
            >
              Pay with card ({currencyFormatter.format(priceEur)})
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-ink-soft/60">
            <span className="h-px flex-1 bg-canvas-deep" />
            or
            <span className="h-px flex-1 bg-canvas-deep" />
          </div>

          <PaypalCheckoutButton listingId={listing.id} />
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft/60">
          Test mode &mdash; no real money changes hands yet.
        </p>
      </div>
    </main>
  );
}
