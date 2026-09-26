// src/components/service-listing-card.tsx
// A single item in the /services browse grid — same pattern as
// product-listing-card.tsx, swapped to service fields (category instead
// of condition, and a "from" prefix when the price is an estimate rather
// than a fixed number).

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SERVICE_CATEGORY_LABELS, type ServiceCategoryKey } from "@/lib/service-categories";
import type { Listing } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function ServiceListingCard({
  listing,
  photoGradient,
}: {
  listing: Listing;
  photoGradient: string;
}) {
  const t = useTranslations("ServiceCard");
  const isUnavailable = listing.status === "rented"; // same status column as every listing type; "rented" means "not currently taking clients"

  return (
    <Link
      href={`/services/${listing.id}`}
      className="group block overflow-hidden rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
    >
      {listing.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
        <img src={listing.photos[0]} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40" style={{ background: photoGradient }} />
      )}
      <div className="px-4 pb-4 pt-3.5">
        <div className="mb-1 flex items-start justify-between">
          <span className="font-mono text-[1.08rem] font-semibold text-ink">
            {listing.priceIsEstimate && <span className="mr-1 text-[0.7rem] font-normal text-ink-soft">{t("from")}</span>}
            {currencyFormatter.format(listing.priceEurMonth)}
          </span>
          <span
            className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
              isUnavailable ? "bg-rust/10 text-rust line-through" : "bg-olive/15 text-olive-deep"
            }`}
          >
            {isUnavailable ? t("unavailable") : t("available")}
          </span>
        </div>

        <p className="mb-2 truncate text-[0.95rem] font-medium text-charcoal">{listing.title}</p>

        <div className="flex flex-wrap gap-3 font-mono text-[0.76rem] text-charcoal/80">
          {listing.serviceCategory && (
            <span>{SERVICE_CATEGORY_LABELS[listing.serviceCategory as ServiceCategoryKey] ?? listing.serviceCategory}</span>
          )}
          <span>{listing.city}</span>
        </div>
      </div>
    </Link>
  );
}
