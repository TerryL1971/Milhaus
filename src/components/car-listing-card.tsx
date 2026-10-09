// src/components/car-listing-card.tsx
// A single car ad in the /cars browse grid. Deliberately a separate
// component from ListingCard rather than branching that one on type — a
// car's field set (year/make/model/mileage) and a rental's (bed/bath/
// amenities/stamp) don't overlap enough for one component to stay
// readable, and this way the working rental card is untouched.

import { useTranslations } from "next-intl";
import { FavoriteButton } from "@/components/favorite-button";
import { Link } from "@/i18n/navigation";
import type { Listing } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const mileageFormatter = new Intl.NumberFormat("en-US");

export function CarListingCard({
  listing,
  photoGradient,
  aspectClassName = "aspect-[16/9]",
  isFavorited,
}: {
  listing: Listing;
  photoGradient: string;
  /** Cars' own category spec is 16:9 — the default. The homepage's
   * Featured sections override this to one shared ratio across Homes/
   * Cars/Buy & Sell; the dedicated /cars page doesn't pass this, so it
   * keeps 16:9. */
  aspectClassName?: string;
  /** undefined = don't render the heart at all. */
  isFavorited?: boolean;
}) {
  const t = useTranslations("CarCard");
  const isSold = listing.status === "rented"; // same status column as rentals; "rented" means "off the market" either way

  return (
    <div className="group relative">
      {isFavorited !== undefined && <FavoriteButton listingId={listing.id} isFavorited={isFavorited} />}
      <Link
        href={`/cars/${listing.id}`}
        className="block overflow-hidden rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
      >
      {listing.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
        <img src={listing.photos[0]} alt="" className={`${aspectClassName} w-full object-cover`} />
      ) : (
        <div className={aspectClassName} style={{ background: photoGradient }} />
      )}
      <div className="px-4 pb-4 pt-3.5">
        <div className="mb-1 flex items-start justify-between">
          <span className="font-mono text-[1.08rem] font-semibold text-ink">
            {currencyFormatter.format(listing.priceEurMonth)}
          </span>
          <span
            className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
              isSold ? "bg-rust/10 text-rust line-through" : "bg-olive/15 text-olive-deep"
            }`}
          >
            {isSold ? t("sold") : t("available")}
          </span>
        </div>

        <p className="mb-2 truncate text-[0.95rem] font-medium text-charcoal">
          {listing.year} {listing.make} {listing.model}
        </p>

        <div className="mb-2 flex flex-wrap gap-3 font-mono text-[0.76rem] text-charcoal/80">
          {listing.mileageKm != null && (
            <span>{t("mileage", { km: mileageFormatter.format(listing.mileageKm) })}</span>
          )}
          <span>{listing.city}{listing.distanceToBase ? ` · ${listing.distanceToBase}` : ""}</span>
        </div>

        {(listing.usSpec != null || listing.transmission || listing.lowMileage) && (
          <div className="flex flex-wrap gap-1.5">
            {listing.lowMileage && (
              <span className="rounded-[3px] bg-brass px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
                {t("lowMileage")}
              </span>
            )}
            {listing.usSpec === true && (
              <span className="rounded-[3px] bg-ink px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
                {t("usSpec")}
              </span>
            )}
            {listing.usSpec === false && (
              <span className="rounded-[3px] bg-canvas-deep px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-ink-soft">
                {t("euSpec")}
              </span>
            )}
            {listing.transmission === "automatic" && (
              <span className="rounded-[3px] bg-canvas-deep px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-ink-soft">
                {t("automatic")}
              </span>
            )}
            {listing.transmission === "manual" && (
              <span className="rounded-[3px] bg-canvas-deep px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-ink-soft">
                {t("manual")}
              </span>
            )}
          </div>
        )}
      </div>
      </Link>
    </div>
  );
}
