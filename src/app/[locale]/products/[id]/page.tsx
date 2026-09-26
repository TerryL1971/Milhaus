// src/app/[locale]/products/[id]/page.tsx
// Product listing detail page — mirrors the car detail page structure
// (same photo gallery, same public SellerCard), swapped to product
// fields (category + condition instead of make/model/year/mileage).

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ListingPhotoGallery } from "@/components/listing-photo-gallery";
import { SellerCard } from "@/components/seller-card";
import { Link } from "@/i18n/navigation";
import { getListingById, getSellerListings, getSellerProfile } from "@/lib/listings";
import { CONDITION_LABELS, PRODUCT_CATEGORY_LABELS, type ConditionKey, type ProductCategoryKey } from "@/lib/product-categories";
import { SITE_URL } from "@/lib/site-url";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
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
    robots: listing.status === "active" ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.type !== "product") notFound();

  const t = await getTranslations("ProductDetail");
  const isSold = listing.status === "rented";

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
      priceCurrency: "EUR",
      availability: isSold ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <main className="flex-1 py-10">
      {/* Static JSON we built above, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[860px] px-8">
        <Link href="/products" className="mb-6 inline-block text-sm text-ink-soft hover:text-ink">
          {t("backToProducts")}
        </Link>

        <ListingPhotoGallery photos={listing.photos} showStamp={false} />

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
      </div>
    </main>
  );
}
