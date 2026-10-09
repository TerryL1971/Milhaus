// src/app/[locale]/listings/[id]/page.tsx
// Listing detail page (build order step 4). Shows the full graphical
// StampBadge for housing_office listings — the grid card only has room for
// the compact checkmark/dash line, but CLAUDE.md calls for the stamp to be
// visible on both the grid and here.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ListingPhotoGallery } from "@/components/listing-photo-gallery";
import { ReportListingButton } from "@/components/report-listing-button";
import { SellerCard } from "@/components/seller-card";
import { Link } from "@/i18n/navigation";
import { AMENITY_LABELS, type AmenityKey } from "@/lib/amenities";
import { NEARBY_AMENITY_LABELS, type NearbyAmenityKey } from "@/lib/nearby-amenities";
import { getListingById, getSellerListings, getSellerProfile } from "@/lib/listings";
import { SITE_URL } from "@/lib/site-url";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type Params = Promise<{ id: string; locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: "Listing not found", robots: { index: false, follow: false } };

  const title = `${listing.city} · ${currencyFormatter.format(listing.priceEurMonth)}/mo`;
  const description = listing.description || `${listing.bedrooms}-bedroom home in ${listing.city}.`;
  const url = `${SITE_URL}/listings/${listing.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: listing.photos[0] ? [{ url: listing.photos[0] }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: listing.photos[0] ? [listing.photos[0]] : undefined,
    },
    // Pending/rented/archived listings resolve here but shouldn't be
    // indexed — only what's genuinely available belongs in search results.
    robots: listing.status === "active" ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const t = await getTranslations("ListingDetail");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", year: "numeric" });

  const isRented = listing.status === "rented";
  const isHousingOffice = listing.source === "housing_office";

  // Public — no sign-in wall, per Charlie's call (see SellerCard). Comes
  // back null only if the owner has no active listing (the RLS policy's
  // condition), which can't actually happen for the listing we're looking
  // at right here, but the type stays nullable since getSellerProfile is
  // shared with the standalone /sellers/[id] page.
  const [seller, otherListings] = await Promise.all([
    getSellerProfile(listing.ownerId),
    getSellerListings(listing.ownerId, listing.id),
  ]);

  // Structured data — helps both traditional search (rich results) and
  // AI answer engines (ChatGPT/Perplexity/Google AI Overviews lean on
  // schema.org markup to extract facts like price and availability
  // reliably, rather than parsing prose). Deliberately not translated —
  // schema.org values are for machine consumption, and mixing languages
  // here would only complicate parsing.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description || undefined,
    url: `${SITE_URL}/listings/${listing.id}`,
    datePosted: listing.createdAt,
    image: listing.photos.length > 0 ? listing.photos : undefined,
    numberOfBedrooms: listing.bedrooms,
    numberOfBathroomsTotal: listing.bathrooms,
    floorSize: listing.sizeSqm
      ? { "@type": "QuantitativeValue", value: listing.sizeSqm, unitCode: "MTK" }
      : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressCountry: "DE",
    },
    offers: {
      "@type": "Offer",
      price: listing.priceEurMonth,
      priceCurrency: "EUR",
      availability: isRented ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <main className="flex-1 py-10">
      {/* Static JSON we built above, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[860px] px-8">
        <Link href="/#listings" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          {t("backToListings")}
        </Link>

        <ListingPhotoGallery photos={listing.photos} showStamp={isHousingOffice} />

        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              {listing.city}
              {listing.distanceToBase ? ` · ${listing.distanceToBase}` : ""}
            </h1>
            <p className="mt-1 text-ink-soft">{listing.address}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold text-ink">
              {currencyFormatter.format(listing.priceEurMonth)}
              <span className="text-base font-normal text-ink-soft"> / mo</span>
            </div>
            <span
              className={`mt-1 inline-block rounded-[3px] px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${
                isRented ? "bg-rust/10 text-rust line-through" : "bg-olive/15 text-olive-deep"
              }`}
            >
              {isRented ? t("rented") : t("availableStatus")}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y border-canvas-deep py-4 font-mono text-sm text-charcoal/80">
          <span>{listing.bedrooms} {t("bed")}</span>
          <span>{listing.bathrooms} {t("bath")}</span>
          {listing.sizeSqm != null && <span>{listing.sizeSqm} m²</span>}
          {listing.parkingSpaces != null && (
            <span>{t("parking", { count: listing.parkingSpaces })}</span>
          )}
          {listing.availableFrom && (
            <span>{t("available", { date: dateFormatter.format(new Date(listing.availableFrom)) })}</span>
          )}
        </div>

        {(listing.internetType || listing.heatType || listing.stoveType) && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {listing.internetType && (
              <span>
                {t("internet")}: {t(`internetType.${listing.internetType}`)}
                {listing.internetSpeedMbps != null ? ` · ${listing.internetSpeedMbps} Mbps` : ""}
              </span>
            )}
            {listing.heatType && (
              <span>
                {t("heat")}: {t(`heatType.${listing.heatType}`)}
              </span>
            )}
            {listing.stoveType && (
              <span>
                {t("stove")}: {t(`stoveType.${listing.stoveType}`)}
              </span>
            )}
          </div>
        )}

        {listing.description && (
          <p className="mt-6 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal">
            {listing.description}
          </p>
        )}

        {listing.amenities.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
              {t("featuresHeading")}
            </p>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-canvas-deep bg-canvas px-3 py-1 text-sm text-ink-soft"
                >
                  {AMENITY_LABELS[key as AmenityKey] ?? key}
                </span>
              ))}
            </div>
          </div>
        )}

        {listing.nearbyAmenities.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
              {t("nearbyHeading")}
            </p>
            <div className="flex flex-wrap gap-2">
              {listing.nearbyAmenities.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-olive/40 bg-olive/10 px-3 py-1 text-sm text-olive-deep"
                >
                  {NEARBY_AMENITY_LABELS[key as NearbyAmenityKey] ?? key}
                </span>
              ))}
            </div>
          </div>
        )}

        <p
          className={`mt-6 flex items-center gap-1.5 text-sm ${
            isHousingOffice ? "text-olive-deep" : "text-[#8A8272]"
          }`}
        >
          <span className="font-bold">{isHousingOffice ? "✓" : "—"}</span>
          {isHousingOffice ? t("housingOfficeListing") : t("listedByFamily")}
        </p>

        {seller && (
          <SellerCard
            seller={seller}
            ownerId={listing.ownerId}
            listingTitle={listing.title}
            otherListings={otherListings}
          />
        )}

        <ReportListingButton listingId={listing.id} returnPath={`/listings/${listing.id}`} />
      </div>
    </main>
  );
}
