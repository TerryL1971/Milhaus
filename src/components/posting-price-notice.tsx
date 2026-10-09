// src/components/posting-price-notice.tsx
// A heads-up shown above the posting form when this category currently
// costs something — so the poster knows the price before filling out
// the form, not just when they hit the pay step at the end. Replaces
// DealerPaymentNotice: posting fees apply to everyone now, not just
// dealer accounts.

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export function PostingPriceNotice({ priceEur }: { priceEur: number }) {
  return (
    <div className="mb-5 rounded-md border border-brass/40 bg-brass/8 px-4 py-3 text-sm text-ink-soft">
      Posting in this category costs{" "}
      <span className="font-semibold text-ink">{currencyFormatter.format(priceEur)}</span>. It's added to
      your cart after you fill out the details below — you can post more than one thing and pay for all
      of them together.
    </div>
  );
}
