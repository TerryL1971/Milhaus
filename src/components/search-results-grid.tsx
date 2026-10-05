// src/components/search-results-grid.tsx
// The /search results grid — mixes all four listing types in one set of
// results (the actual fix for "how would someone even know to go look in
// Items for sale for a baby crib": one search box, not four separate
// ones). Renders whichever card type fits each listing, same switch
// pattern already used by SellerCard and /sellers/[id].

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { CarListingCard } from "@/components/car-listing-card";
import { ListingCard } from "@/components/listing-card";
import { ProductListingCard } from "@/components/product-listing-card";
import { ServiceListingCard } from "@/components/service-listing-card";
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryKey } from "@/lib/product-categories";
import { SERVICE_CATEGORY_LABELS, type ServiceCategoryKey } from "@/lib/service-categories";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
];

function matches(listing: Listing, q: string): boolean {
  const fields: (string | null | undefined)[] = [
    listing.title,
    listing.city,
    listing.address,
    listing.make,
    listing.model,
  ];
  if (listing.productCategory) {
    fields.push(PRODUCT_CATEGORY_LABELS[listing.productCategory as ProductCategoryKey]);
  }
  if (listing.serviceCategory) {
    fields.push(SERVICE_CATEGORY_LABELS[listing.serviceCategory as ServiceCategoryKey]);
  }
  return fields.filter(Boolean).some((field) => field!.toLowerCase().includes(q));
}

export function SearchResultsGrid({ listings, initialQuery = "" }: { listings: Listing[]; initialQuery?: string }) {
  const t = useTranslations("SearchPage");
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((listing) => matches(listing, q));
  }, [listings, query]);

  return (
    <>
      <div className="mb-7">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full max-w-md rounded-md border border-canvas-deep bg-paper px-4 py-2.5 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-soft">{listings.length === 0 ? t("emptyNone") : t("emptyNoMatch")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing, index) => {
            const photoGradient = PHOTO_GRADIENTS[index % PHOTO_GRADIENTS.length];
            switch (listing.type) {
              case "car":
                return <CarListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
              case "product":
                return <ProductListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
              case "service":
                return <ServiceListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
              default:
                return <ListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
            }
          })}
        </div>
      )}
    </>
  );
}
