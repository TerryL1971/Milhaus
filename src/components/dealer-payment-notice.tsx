// src/components/dealer-payment-notice.tsx
// A heads-up shown above ListingForm when the signed-in poster is a
// dealer and this category currently costs something — so they know the
// price before filling out the form, not just when they hit the pay
// step at the end (see /checkout/[listingId], where payment actually
// happens once the form is submitted).

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export function DealerPaymentNotice({ priceEur }: { priceEur: number }) {
  return (
    <div className="mb-5 rounded-md border border-brass/40 bg-brass/8 px-4 py-3 text-sm text-ink-soft">
      As a dealer account, posting in this category costs{" "}
      <span className="font-semibold text-ink">{currencyFormatter.format(priceEur)}</span>. You'll pay
      after filling out the details below, before it's submitted for review.
    </div>
  );
}
