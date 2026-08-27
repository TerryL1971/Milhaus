// src/components/listing-card.tsx
// A single listing in the browse grid — ported from the ".g-card" rules in
// /design-reference/milhaus-landing-mockup.html.

import Link from "next/link";
import { AMENITY_LABELS, type AmenityKey } from "@/lib/amenities";
import type { Listing } from "@/lib/types";

// en-US formatting reads "€1,180" (matching the mockup) rather than the
// de-DE "1.180 €" — the audience is English-speaking Americans, even
// though the currency is Euros.
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function ListingCard({
  listing,
  photoGradient,
}: {
  listing: Listing;
  photoGradient: string;
}) {
  const isRented = listing.status === "rented";
  const isHousingOffice = listing.source === "housing_office";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
    >
      {listing.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config for a placeholder SVG
        <img
          src={listing.photos[0]}
          alt=""
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="h-40" style={{ background: photoGradient }} />
      )}
      <div className="px-4 pb-4 pt-3.5">
        <div className="mb-1 flex items-start justify-between">
          <span className="font-mono text-[1.08rem] font-semibold text-ink">
            {currencyFormatter.format(listing.priceEurMonth)} / mo
          </span>
          <span
            className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
              isRented
                ? "bg-rust/10 text-rust line-through"
                : "bg-olive/15 text-olive-deep"
            }`}
          >
            {isRented ? "Rented" : "Available"}
          </span>
        </div>

        <p className="mb-2 text-[0.86rem] text-ink-soft">
          {listing.city}
          {listing.distanceToBase ? ` · ${listing.distanceToBase}` : ""}
        </p>

        <div className="flex gap-3 font-mono text-[0.76rem] text-charcoal/80">
          <span>{listing.bedrooms} bed</span>
          <span>{listing.bathrooms} bath</span>
          {listing.sizeSqm != null && <span>{listing.sizeSqm} m²</span>}
        </div>

        {listing.amenities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {listing.amenities.slice(0, 3).map((key) => (
              <span
                key={key}
                className="rounded-full bg-canvas px-2 py-0.5 text-[0.68rem] text-ink-soft"
              >
                {AMENITY_LABELS[key as AmenityKey] ?? key}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[0.68rem] text-ink-soft">
                +{listing.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        <p
          className={`mt-2.5 flex items-center gap-1.5 text-[0.72rem] ${
            isHousingOffice ? "text-olive-deep" : "text-[#8A8272]"
          }`}
        >
          <span className="font-bold">{isHousingOffice ? "✓" : "—"}</span>
          {isHousingOffice ? "Housing office listing" : "Listed by outgoing family"}
        </p>
      </div>
    </Link>
  );
}
