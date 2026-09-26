// src/components/products-grid.tsx
// The /products browse grid — same shape as cars-grid.tsx: a free-text
// search box (title/city/category), no URL-driven filter chips. Reused
// as-is on the homepage's "Items for sale" section, same pattern as
// ListingsGrid/CarsGrid already are there.

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ProductListingCard } from "@/components/product-listing-card";
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryKey } from "@/lib/product-categories";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
];

export function ProductsGrid({ listings }: { listings: Listing[] }) {
  const t = useTranslations("ProductsPage");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((listing) => {
      const category = listing.productCategory
        ? PRODUCT_CATEGORY_LABELS[listing.productCategory as ProductCategoryKey]
        : null;
      return [listing.title, listing.city, category].filter(Boolean).some((field) =>
        field!.toLowerCase().includes(q),
      );
    });
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
          {filtered.map((listing, index) => (
            <ProductListingCard
              key={listing.id}
              listing={listing}
              photoGradient={PHOTO_GRADIENTS[index % PHOTO_GRADIENTS.length]}
            />
          ))}
        </div>
      )}
    </>
  );
}
