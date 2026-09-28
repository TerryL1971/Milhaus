// src/components/dealer-payment-notice.tsx
// Shown instead of ListingForm when a signed-in dealer tries to post a
// category Charlie has priced — checkout isn't wired up yet (pending
// Stripe/PayPal test-mode API keys), so this is honest about that rather
// than showing a form that would fail or silently post for free.

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export function DealerPaymentNotice({ priceEur }: { priceEur: number }) {
  return (
    <div className="rounded-md border border-canvas-deep bg-paper p-6 text-center">
      <p className="mb-1 font-display text-xl font-semibold text-ink">
        This category costs {currencyFormatter.format(priceEur)} to post
      </p>
      <p className="text-sm text-ink-soft">
        Dealer accounts pay per listing in this category. Checkout isn&apos;t connected yet — check
        back soon, or contact the site admin if you need to post before then.
      </p>
    </div>
  );
}
