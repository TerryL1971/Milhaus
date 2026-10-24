// src/app/[locale]/services/[id]/page.tsx
// Service listing detail page — mirrors the product detail page structure
// (same photo gallery, same public SellerCard, same report button),
// swapped to service fields (category + pricing note instead of
// condition, and a "from" price prefix when it's an estimate).
//
// Orphaned since Services became the Military-Friendly Businesses
// directory: /post-service still works and this page still renders, but
// nothing on the site browses or links to a self-listed "service"-type
// listing anymore (the public /services page only shows businesses now
// — see that route's own header comment). Deliberately always noindex
// below, not just while pending/archived — a page no real visitor can
// ever reach by browsing shouldn't be crawled/indexed either. Also
// excluded from sitemap.ts for the same reason.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ListingPhotoGallery } from "@/components/listing-photo-gallery";
import { ReportListingButton } from "@/components/report-listing-button";
import { SellerCard } from "@/components/seller-card";
import { Link } from "@/i18n/navigation";
import { recordListingView } from "@/lib/listing-views";
import { getListingById, getSellerListings, getSellerProfile } from "@/lib/listings";
import { isAdminRole } from "@/lib/roles";
import { SERVICE_CATEGORY_LABELS, type ServiceCategoryKey } from "@/lib/service-categories";
import { SITE_URL } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.type !== "service") {
    return { title: "Listing not found", robots: { index: false, follow: false } };
  }

  const title = `${listing.title} · ${currencyFormatter.format(listing.priceEurMonth)}`;
  const url = `${SITE_URL}/services/${listing.id}`;

  return {
    title,
    description: listing.description || listing.title,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: listing.description || listing.title,
      url,
      type: "website",
      images: listing.photos[0] ? [{ url: listing.photos[0] }] : undefined,
    },
    robots: { index: false, follow: false },
  };
}

export default async function ServiceDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.type !== "service") notFound();

  const t = await getTranslations("ServiceDetail");
  const isUnavailable = listing.status === "rented";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.ownerId;
  // Charlie's own account is "owner" role (admin-equivalent, see
  // src/lib/roles.ts), not the lister on any real listing — he can't
  // see the view count at all without this, since isOwner alone would
  // never be true for him on someone else's listing.
  let isAdminViewer = false;
  if (user && !isOwner) {
    const { data: viewerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdminViewer = isAdminRole(viewerProfile?.role);
  }
  const canSeeViewCount = isOwner || isAdminViewer;
  await recordListingView(listing.id, user?.id ?? null, listing.ownerId);

  const [seller, otherListings] = await Promise.all([
    getSellerProfile(listing.ownerId),
    getSellerListings(listing.ownerId, listing.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: listing.title,
    description: listing.description || undefined,
    url: `${SITE_URL}/services/${listing.id}`,
    areaServed: listing.city,
    offers: {
      "@type": "Offer",
      price: listing.priceEurMonth,
      priceCurrency: "EUR",
      availability: isUnavailable ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <main className="flex-1 py-10">
      {/* Static JSON we built above, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[860px] px-8">
        <Link href="/services" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          {t("backToServices")}
        </Link>

        <ListingPhotoGallery photos={listing.photos} showStamp={false} alt={listing.title} />

        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">{listing.title}</h1>
            <p className="mt-1 text-ink-soft">{listing.city}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold text-ink">
              {listing.priceIsEstimate && (
                <span className="text-base font-normal text-ink-soft">{t("from")} </span>
              )}
              {currencyFormatter.format(listing.priceEurMonth)}
            </div>
            <span
              className={`mt-1 inline-block rounded-[3px] px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${
                isUnavailable ? "bg-rust/10 text-rust line-through" : "bg-olive/15 text-olive-deep"
              }`}
            >
              {isUnavailable ? t("unavailable") : t("availableStatus")}
            </span>
            {canSeeViewCount && (
              <p className="mt-1 font-mono text-xs text-ink-soft">{t("viewCount", { count: listing.viewCount })}</p>
            )}
          </div>
        </div>

        {(listing.serviceCategory || listing.pricingNote) && (
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y border-canvas-deep py-4 font-mono text-sm text-charcoal/80">
            {listing.serviceCategory && (
              <span>{SERVICE_CATEGORY_LABELS[listing.serviceCategory as ServiceCategoryKey] ?? listing.serviceCategory}</span>
            )}
          </div>
        )}

        {listing.pricingNote && <p className="mt-4 text-sm text-ink-soft">{listing.pricingNote}</p>}

        {listing.description && (
          <p className="mt-6 whitespace-pre-line text-[0.98rem] leading-relaxed text-charcoal">
            {listing.description}
          </p>
        )}

        {seller && (
          <SellerCard
            seller={seller}
            ownerId={listing.ownerId}
            listingTitle={listing.title}
            otherListings={otherListings}
          />
        )}

        <ReportListingButton listingId={listing.id} returnPath={`/services/${listing.id}`} />
      </div>
    </main>
  );
}
