// src/components/listing-card.tsx
// A single listing in the browse grid — ported from the ".g-card" rules in
// /design-reference/milhaus-landing-mockup.html.

import { useTranslations } from "next-intl";
import { FavoriteButton } from "@/components/favorite-button";
import { Link } from "@/i18n/navigation";
import type { AmenityKey } from "@/lib/amenities";
import type { Listing } from "@/lib/types";

// en-US formatting reads "€1,180" (matching the mockup) rather than the
// de-DE "1.180 €" — the audience is English-speaking Americans, even
// though the currency is Euros. Kept as en-US in both languages on
// purpose, for the same reason: the price format isn't part of what
// changes with the language toggle.
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function ListingCard({
  listing,
  photoGradient,
  aspectClassName = "aspect-[4/3]",
  isFavorited,
}: {
  listing: Listing;
  photoGradient: string;
  /** Homes' own category spec is 4:3 — the default. The homepage's
   * Featured sections override this to one shared ratio across Homes/
   * Cars/Buy & Sell so those three rows look like the same card size;
   * the dedicated /listings page doesn't pass this, so it keeps 4:3. */
  aspectClassName?: string;
  /** undefined = don't render the heart at all (e.g. my-listings, a
   * seller's own profile — favoriting your own listing isn't a thing);
   * a real boolean = render it, filled or not. */
  isFavorited?: boolean;
}) {
  const t = useTranslations("ListingCard");
  const tAmenities = useTranslations("Amenities");
  const isRented = listing.status === "rented";
  const isHousingOffice = listing.source === "housing_office";

  return (
    <div className="group relative">
      {isFavorited !== undefined && <FavoriteButton listingId={listing.id} isFavorited={isFavorited} />}
      <Link
        href={`/listings/${listing.id}`}
        className="block overflow-hidden rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
      >
      <div className="relative">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config for a placeholder SVG
          <img
            src={listing.photos[0]}
            alt=""
            className={`${aspectClassName} w-full object-cover`}
          />
        ) : (
          <div className={aspectClassName} style={{ background: photoGradient }} />
        )}
        {(isHousingOffice || listing.isNew || listing.amenities.includes("furnished") || listing.amenities.includes("pet_friendly")) && (
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {isHousingOffice && (
              <span className="rounded-[3px] bg-ink px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
                {t("housingApprovedBadge")}
              </span>
            )}
            {listing.isNew && (
              <span className="rounded-[3px] bg-brass px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
                {t("newBadge")}
              </span>
            )}
            {listing.amenities.includes("furnished") && (
              <span className="rounded-[3px] bg-ink px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
                {tAmenities("furnished")}
              </span>
            )}
            {listing.amenities.includes("pet_friendly") && (
              <span className="rounded-[3px] bg-ink px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
                {tAmenities("pet_friendly")}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="px-4 pb-4 pt-3.5">
        <div className="mb-1 flex items-start justify-between">
          <span className="font-mono text-[1.08rem] font-semibold text-ink">
            {currencyFormatter.format(listing.priceEurMonth)} {t("perMonth")}
          </span>
          <span
            className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
              isRented
                ? "bg-rust/10 text-rust line-through"
                : "bg-olive/15 text-olive-deep"
            }`}
          >
            {isRented ? t("rented") : t("available")}
          </span>
        </div>

        <p className="mb-2 text-[0.86rem] text-ink-soft">
          {listing.city}
          {listing.distanceToBase ? ` · ${listing.distanceToBase}` : ""}
        </p>

        <div className="flex gap-3 font-mono text-[0.76rem] text-charcoal/80">
          <span>{listing.bedrooms} {t("bed")}</span>
          <span>{listing.bathrooms} {t("bath")}</span>
          {listing.sizeSqm != null && <span>{listing.sizeSqm} m²</span>}
        </div>

        {listing.amenities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {listing.amenities.slice(0, 3).map((key) => (
              <span
                key={key}
                className="rounded-full bg-canvas px-2 py-0.5 text-[0.68rem] text-ink-soft"
              >
                {tAmenities(key as AmenityKey)}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[0.68rem] text-ink-soft">
                {t("moreAmenities", { count: listing.amenities.length - 3 })}
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
          {isHousingOffice ? t("housingOfficeListing") : t("listedByFamily")}
        </p>
      </div>
      </Link>
    </div>
  );
}
