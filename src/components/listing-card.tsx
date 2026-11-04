// src/components/listing-card.tsx
// A single listing in the browse grid — ported from the ".g-card" rules in
// /design-reference/milhaus-landing-mockup.html.

import { useTranslations } from "next-intl";
import Image from "next/image";
import { CardChipRow } from "@/components/card-chip-row";
import { FavoriteButton } from "@/components/favorite-button";
import { NoPhotoPlaceholder } from "@/components/no-photo-placeholder";
import { Link } from "@/i18n/navigation";
import type { AmenityKey } from "@/lib/amenities";
import { NEARBY_AMENITY_KEYS, type NearbyAmenityKey } from "@/lib/nearby-amenities";
import type { Listing } from "@/lib/types";

// Homes and services price in EUR (actual German rents/quotes); cars and
// items for sale price in USD (Terry's split — see ListingCard's sibling
// car/product card components). The posting fee charged to list
// something is separate again and always EUR (see getPostingPrice).
// Kept as en-US formatting in both languages on purpose: the price
// format isn't part of what changes with the language toggle.
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
  priority,
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
  /** Set on the first card of the homepage's Featured Homes row — it's
   * the page's actual LCP element (first section below the hero), and
   * without this Next.js lazy-loads it and flags it as hurting LCP.
   * Every other caller leaves this unset. */
  priority?: boolean;
}) {
  const t = useTranslations("ListingCard");
  const tAmenities = useTranslations("Amenities");
  const tNearby = useTranslations("NearbyAmenities");
  const isRented = listing.status === "rented";
  const isForSale = listing.offerType === "sale";

  return (
    // h-full on both: a card fills its grid row, so one with feature
    // chips doesn't stand taller than its neighbours (Featured Homes).
    <div className="group relative h-full">
      {isFavorited !== undefined && <FavoriteButton listingId={listing.id} isFavorited={isFavorited} />}
      <Link
        href={`/listings/${listing.id}`}
        className="block h-full overflow-hidden rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
      >
      <div className={`relative ${aspectClassName}`}>
        {listing.photos[0] ? (
          <Image
            src={listing.photos[0]}
            alt={`${listing.bedrooms}-bedroom home in ${listing.city}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <NoPhotoPlaceholder gradient={photoGradient} label={t("noPhotoYet")} />
        )}
        {(listing.type === "rental" || listing.isNew || listing.amenities.includes("furnished") || (!isForSale && listing.amenities.includes("pet_friendly"))) && (
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {/* For rent / For sale on every home (Charlie, 2026-11-04) —
                they sit side by side on the homepage's Featured Homes. */}
            {listing.type === "rental" && (
              <span className="rounded-[3px] bg-ink px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
                {isForSale ? t("forSaleBadge") : t("forRentBadge")}
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
            {/* Not on a home for sale (Terry, 2026-11-04) — pets are a
                renter's question, not a buyer's. */}
            {!isForSale && listing.amenities.includes("pet_friendly") && (
              <span className="rounded-[3px] bg-ink px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
                {tAmenities("pet_friendly")}
              </span>
            )}
          </div>
        )}
        {/* Bottom-left so it never competes with the top-left badge stack
            or the favorite heart top-right. "everyone" is the unrestricted
            default, so it gets no badge. Never on a home for sale: anyone
            can buy a house (Terry, 2026-11-04). */}
        {!isForSale && listing.availableTo && listing.availableTo !== "everyone" && (
          <span className="absolute bottom-2.5 left-2.5 rounded-[3px] bg-ink/90 px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-paper">
            {listing.availableTo === "military_only" ? t("availableToMilitaryOnly") : t("availableToMilitaryAndExpats")}
          </span>
        )}
      </div>
      <div className="px-4 pb-4 pt-3.5">
        {/* Price and the bed/bath/sqm row below used to be font-mono, per
            CLAUDE.md's original design tokens ("Mono font: prices, specs,
            labels, eyebrows") — Charlie's later ask was to move away from
            that for these two specifically, matching his own reference
            mockup's card sample. Explicit font-body (IBM Plex Sans, the
            project's body font — see globals.css) rather than just
            dropping font-mono and relying on inheriting it from <body>,
            so the choice is visible here, not implicit. Small uppercase
            pill badges (status chip, amenity/feature tags) are untouched
            and still mono, same as every other card type. */}
        <div className="mb-1 flex items-start justify-between">
          <span className="font-body text-[1.08rem] font-semibold text-ink">
            {currencyFormatter.format(listing.priceEurMonth)}
            {isForSale ? "" : ` ${t("perMonth")}`}
          </span>
          <span
            className={`rounded-[3px] px-2 py-0.5 font-mono text-[0.66rem] font-semibold uppercase tracking-wider ${
              isRented
                ? "bg-rust/10 text-rust line-through"
                : "bg-olive/15 text-olive-deep"
            }`}
          >
            {isRented ? (isForSale ? t("sold") : t("rented")) : t("available")}
          </span>
        </div>

        <p className="mb-2 text-[0.86rem] text-ink-soft">
          {listing.city}
          {listing.distanceToBase ? ` · ${listing.distanceToBase}` : ""}
        </p>

        <div className="flex gap-3 font-body text-[0.76rem] text-charcoal/80">
          <span>{listing.bedrooms} {t("bed")}</span>
          <span>{listing.bathrooms} {t("bath")}</span>
          {listing.sizeSqm != null && <span>{listing.sizeSqm} m²</span>}
        </div>

        {/* What the lister starred (features and what's nearby), else
            their first features — one line, see CardChipRow. */}
        <CardChipRow
          chips={(listing.highlights.length > 0 ? listing.highlights : listing.amenities)
            .filter((key) => !(isForSale && key === "pet_friendly"))
            .map((key) =>
              (NEARBY_AMENITY_KEYS as string[]).includes(key)
                ? { key, label: `📍 ${tNearby(key as NearbyAmenityKey)}` }
                : { key, label: tAmenities(key as AmenityKey) },
            )}
        />
      </div>
      </Link>
    </div>
  );
}
