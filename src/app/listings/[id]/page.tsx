// src/app/listings/[id]/page.tsx
// Listing detail page (build order step 4). Shows the full graphical
// StampBadge for housing_office listings — the grid card only has room for
// the compact checkmark/dash line, but CLAUDE.md calls for the stamp to be
// visible on both the grid and here.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StampBadge } from "@/components/stamp-badge";
import { getListingById } from "@/lib/listings";
import { SITE_URL } from "@/lib/site-url";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

type Params = Promise<{ id: string }>;

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

  const isRented = listing.status === "rented";
  const isHousingOffice = listing.source === "housing_office";

  // Structured data — helps both traditional search (rich results) and
  // AI answer engines (ChatGPT/Perplexity/Google AI Overviews lean on
  // schema.org markup to extract facts like price and availability
  // reliably, rather than parsing prose).
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
          ← Back to listings
        </Link>

        <div className="relative h-72 overflow-hidden rounded-md sm:h-96">
          {listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config here
            <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)" }}
            />
          )}
          {isHousingOffice && <StampBadge size="lg" className="right-4 top-4" />}
        </div>

        {listing.photos.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {listing.photos.slice(1).map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config here
              <img key={photo} src={photo} alt="" className="h-20 w-full rounded-md object-cover sm:h-24" />
            ))}
          </div>
        )}

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
              {isRented ? "Rented" : "Available"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-6 border-y border-canvas-deep py-4 font-mono text-sm text-charcoal/80">
          <span>{listing.bedrooms} bed</span>
          <span>{listing.bathrooms} bath</span>
          {listing.sizeSqm != null && <span>{listing.sizeSqm} m²</span>}
          {listing.availableFrom && (
            <span>Available {dateFormatter.format(new Date(listing.availableFrom))}</span>
          )}
        </div>

        {listing.description && (
          <p className="mt-6 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal">
            {listing.description}
          </p>
        )}

        <p
          className={`mt-6 flex items-center gap-1.5 text-sm ${
            isHousingOffice ? "text-olive-deep" : "text-[#8A8272]"
          }`}
        >
          <span className="font-bold">{isHousingOffice ? "✓" : "—"}</span>
          {isHousingOffice ? "Housing office listing" : "Listed by outgoing family"}
        </p>

        <div className="mt-8 rounded-md border border-canvas-deep bg-paper p-5">
          <p className="mb-3 text-sm text-ink-soft">
            Interested in this home? Sign in to contact the lister.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
