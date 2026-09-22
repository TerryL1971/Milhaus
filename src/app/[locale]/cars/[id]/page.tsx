// src/app/[locale]/cars/[id]/page.tsx
// Car listing detail page — mirrors src/app/[locale]/listings/[id]/page.tsx
// (same photo gallery, same "contact the lister" box and its RLS-gated
// getOwnerContact, same sign-in redirect), swapped to car fields. No stamp
// badge here: a car ad is always self_listed, there's no housing-office
// equivalent for cars.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ListingPhotoGallery } from "@/components/listing-photo-gallery";
import { getPathname, Link } from "@/i18n/navigation";
import { getListingById, getOwnerContact } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site-url";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const mileageFormatter = new Intl.NumberFormat("en-US");

type Params = Promise<{ id: string; locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.type !== "car") {
    return { title: "Listing not found", robots: { index: false, follow: false } };
  }

  const title = `${listing.year} ${listing.make} ${listing.model} · ${currencyFormatter.format(listing.priceEurMonth)}`;
  const description = listing.description || `${listing.year} ${listing.make} ${listing.model} for sale in ${listing.city}.`;
  const url = `${SITE_URL}/cars/${listing.id}`;

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
    robots: listing.status === "active" ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function CarDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.type !== "car") notFound();

  const t = await getTranslations("CarDetail");
  const locale = await getLocale();

  const isSold = listing.status === "rented";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownerContact = user ? await getOwnerContact(listing.ownerId) : null;

  const nextPath = getPathname({ href: `/cars/${listing.id}`, locale });

  // Structured data for search/AI answer engines — same reasoning as the
  // rental detail page's RealEstateListing block, Vehicle is schema.org's
  // equivalent for a car for sale.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: listing.title || `${listing.year} ${listing.make} ${listing.model}`,
    description: listing.description || undefined,
    url: `${SITE_URL}/cars/${listing.id}`,
    datePosted: listing.createdAt,
    image: listing.photos.length > 0 ? listing.photos : undefined,
    manufacturer: listing.make || undefined,
    model: listing.model || undefined,
    vehicleModelDate: listing.year || undefined,
    mileageFromOdometer: listing.mileageKm
      ? { "@type": "QuantitativeValue", value: listing.mileageKm, unitCode: "KMT" }
      : undefined,
    offers: {
      "@type": "Offer",
      price: listing.priceEurMonth,
      priceCurrency: "EUR",
      availability: isSold ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <main className="flex-1 py-10">
      {/* Static JSON we built above, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[860px] px-8">
        <Link href="/cars" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          {t("backToCars")}
        </Link>

        <ListingPhotoGallery photos={listing.photos} showStamp={false} />

        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              {listing.year} {listing.make} {listing.model}
            </h1>
            <p className="mt-1 text-ink-soft">
              {listing.city}
              {listing.distanceToBase ? ` · ${listing.distanceToBase}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold text-ink">
              {currencyFormatter.format(listing.priceEurMonth)}
            </div>
            <span
              className={`mt-1 inline-block rounded-[3px] px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${
                isSold ? "bg-rust/10 text-rust line-through" : "bg-olive/15 text-olive-deep"
              }`}
            >
              {isSold ? t("sold") : t("availableStatus")}
            </span>
          </div>
        </div>

        {listing.mileageKm != null && (
          <div className="mt-6 flex gap-6 border-y border-canvas-deep py-4 font-mono text-sm text-charcoal/80">
            <span>{t("mileage", { km: mileageFormatter.format(listing.mileageKm) })}</span>
          </div>
        )}

        {listing.description && (
          <p className="mt-6 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal">
            {listing.description}
          </p>
        )}

        <div className="mt-8 rounded-md border border-canvas-deep bg-paper p-5">
          {ownerContact ? (
            <>
              <p className="mb-3 text-sm font-semibold text-ink">{t("interestedHeading")}</p>
              <div className="flex flex-col gap-2 text-sm">
                {ownerContact.contactEmail && (
                  <a
                    href={`mailto:${ownerContact.contactEmail}?subject=${encodeURIComponent(`About: ${listing.year} ${listing.make} ${listing.model}`)}`}
                    className="inline-block w-fit rounded-md bg-brass px-5 py-2.5 font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                  >
                    {t("emailButton", { name: ownerContact.displayName ?? t("theSeller") })}
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
