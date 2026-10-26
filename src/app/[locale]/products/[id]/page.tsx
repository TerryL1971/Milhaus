// src/app/[locale]/products/[id]/page.tsx
// Product listing detail page — mirrors the car detail page structure
// (same photo gallery, same public SellerCard), swapped to product
// fields (category + condition instead of make/model/year/mileage).
//
// Orphaned since 2026-10-26, same as /services/[id]: /products itself
// became Charlie's "Special Offers" page (real promo cards, not these
// self-listed items), so nothing browses or links to these individual
// listings any more. Still postable via /post-product, still a real
// page if someone has the direct link — just unconditionally noindexed
// and out of the sitemap, matching /services/[id]'s own treatment.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ListingPhotoGallery } from "@/components/listing-photo-gallery";
import { ReportListingButton } from "@/components/report-listing-button";
import { SellerCard } from "@/components/seller-card";
import { Link } from "@/i18n/navigation";
import { recordListingView } from "@/lib/listing-views";
import { getListingById, getSellerListings, getSellerProfile } from "@/lib/listings";
import { CONDITION_LABELS, PRODUCT_CATEGORY_LABELS, type ConditionKey, type ProductCategoryKey } from "@/lib/product-categories";
import { isAdminRole } from "@/lib/roles";
import { SITE_URL } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.type !== "product") {
    return { title: "Listing not found", robots: { index: false, follow: false } };
  }

  const title = `${listing.title} · ${currencyFormatter.format(listing.priceEurMonth)}`;
  const url = `${SITE_URL}/products/${listing.id}`;

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
    twitter: {
      card: "summary_large_image",
      title,
      description: listing.description || listing.title,
      images: listing.photos[0] ? [listing.photos[0]] : undefined,
    },
    robots: { index: false, follow: false },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.type !== "product") notFound();

  const t = await getTranslations("ProductDetail");
  const isSold = listing.status === "rented";

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
    "@type": "Product",
    name: listing.title,
    description: listing.description || undefined,
    url: `${SITE_URL}/products/${listing.id}`,
    image: listing.photos.length > 0 ? listing.photos : undefined,
    itemCondition: listing.condition ? `https://schema.org/${listing.condition === "new" ? "NewCondition" : "UsedCondition"}` : undefined,
    offers: {
      "@type": "Offer",
      price: listing.priceEurMonth,
      priceCurrency: "USD",
      availability: isSold ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Milhaus", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Items for sale", item: `${SITE_URL}/products` },
      { "@type": "ListItem", position: 3, name: listing.title, item: `${SITE_URL}/products/${listing.id}` },
    ],
  };

  return (
    <main className="flex-1 py-10">
      {/* Static JSON we built above, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-[860px] px-8">
        <Link href="/products" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          {t("backToProducts")}
        </Link>

        <ListingPhotoGallery photos={listing.photos} showStamp={false} alt={listing.title} />

        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">{listing.title}</h1>
            <p className="mt-1 text-ink-soft">{listing.city}</p>
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
            {canSeeViewCount && (
              <p className="mt-1 font-mono text-xs text-ink-soft">{t("viewCount", { count: listing.viewCount })}</p>
            )}
          </div>
        </div>

        {(listing.productCategory || listing.condition) && (
          <div className="mt-6 flex gap-6 border-y border-canvas-deep py-4 font-mono text-sm text-charcoal/80">
            {listing.productCategory && (
              <span>{PRODUCT_CATEGORY_LABELS[listing.productCategory as ProductCategoryKey] ?? listing.productCategory}</span>
            )}
            {listing.condition && (
              <span>{CONDITION_LABELS[listing.condition as ConditionKey] ?? listing.condition}</span>
            )}
          </div>
        )}

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

        <ReportListingButton listingId={listing.id} returnPath={`/products/${listing.id}`} />
      </div>
    </main>
  );
}
