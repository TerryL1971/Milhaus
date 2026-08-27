// src/app/[locale]/listings/[id]/page.tsx
// Listing detail page (build order step 4). Shows the full graphical
// StampBadge for housing_office listings — the grid card only has room for
// the compact checkmark/dash line, but CLAUDE.md calls for the stamp to be
// visible on both the grid and here.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ListingPhotoGallery } from "@/components/listing-photo-gallery";
import { getPathname, Link } from "@/i18n/navigation";
import { AMENITY_LABELS, type AmenityKey } from "@/lib/amenities";
import { getListingById, getOwnerContact } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // null unless RLS actually allows it (signed in + owner has an active
  // listing) — see getOwnerContact and its migration. A signed-out visitor,
  // or a not-yet-migrated database, both just fall back to "sign in".
  const ownerContact = user ? await getOwnerContact(listing.ownerId) : null;

  // Locale-prefixed so signing in from the German page returns here in
  // German too, not silently back to the English default.
  const nextPath = getPathname({ href: `/listings/${listing.id}`, locale });

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

        <div className="mt-6 flex gap-6 border-y border-canvas-deep py-4 font-mono text-sm text-charcoal/80">
          <span>{listing.bedrooms} {t("bed")}</span>
          <span>{listing.bathrooms} {t("bath")}</span>
          {listing.sizeSqm != null && <span>{listing.sizeSqm} m²</span>}
          {listing.availableFrom && (
            <span>{t("available", { date: dateFormatter.format(new Date(listing.availableFrom)) })}</span>
          )}
        </div>

        {listing.description && (
          <p className="mt-6 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal">
            {listing.description}
          </p>
        )}

        {listing.amenities.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {listing.amenities.map((key) => (
              <span
                key={key}
                className="rounded-full border border-canvas-deep bg-canvas px-3 py-1 text-sm text-ink-soft"
              >
                {AMENITY_LABELS[key as AmenityKey] ?? key}
              </span>
            ))}
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

        <div className="mt-8 rounded-md border border-canvas-deep bg-paper p-5">
          {ownerContact ? (
            <>
              <p className="mb-3 text-sm font-semibold text-ink">{t("interestedHeading")}</p>
              <div className="flex flex-col gap-2 text-sm">
                {ownerContact.contactEmail && (
                  <a
                    href={`mailto:${ownerContact.contactEmail}?subject=${encodeURIComponent(`About: ${listing.title}`)}`}
                    className="inline-block w-fit rounded-md bg-brass px-5 py-2.5 font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                  >
                    {t("emailButton", { name: ownerContact.displayName ?? t("theLister") })}
                  </a>
                )}
                {ownerContact.contactPhone && (
                  <a
                    href={`tel:${ownerContact.contactPhone.replace(/[^+\d]/g, "")}`}
                    className="text-ink-soft hover:text-ink"
                  >
                    {ownerContact.contactPhone}
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-ink-soft">{t("signInToContact")}</p>
              <Link
                href={`/sign-in?next=${nextPath}`}
                className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
              >
                {t("signIn")}
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
