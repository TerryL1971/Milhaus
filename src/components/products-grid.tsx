// src/components/products-grid.tsx
// The /products browse grid — base + category + condition filter chips
// (URL-driven, same pattern as ListingsGrid's chips on the rental page)
// plus the existing free-text search box, all combined with AND logic.

"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductListingCard } from "@/components/product-listing-card";
import { BASE_NAMES } from "@/lib/bases";
import {
  CONDITION_KEYS,
  CONDITION_LABELS,
  PRODUCT_CATEGORY_KEYS,
  PRODUCT_CATEGORY_LABELS,
  type ConditionKey,
  type ProductCategoryKey,
} from "@/lib/product-categories";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C67)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
];

const chipClass = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 font-mono text-[0.74rem] tracking-wide transition-colors ${
    active
      ? "border-olive bg-olive text-paper"
      : "border-canvas-deep bg-paper text-ink-soft hover:border-olive/50"
  }`;

export function ProductsGrid({ listings, initialQuery = "" }: { listings: Listing[]; initialQuery?: string }) {
  const t = useTranslations("ProductsPage");
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ALL_BASES = t("allBases");
  const ALL_CATEGORIES = t("allCategories");
  const ALL_CONDITIONS = t("allConditions");
  const activeBase = searchParams.get("base") || ALL_BASES;
  const activeCategory = searchParams.get("category") || ALL_CATEGORIES;
  const activeCondition = searchParams.get("condition") || ALL_CONDITIONS;

  function setParam(key: string, value: string, allValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === allValue) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (activeBase !== ALL_BASES && listing.base !== activeBase) return false;
      if (activeCategory !== ALL_CATEGORIES && listing.productCategory !== activeCategory) return false;
      if (activeCondition !== ALL_CONDITIONS && listing.condition !== activeCondition) return false;
      if (!q) return true;
      const category = listing.productCategory
        ? PRODUCT_CATEGORY_LABELS[listing.productCategory as ProductCategoryKey]
        : null;
      return [listing.title, listing.city, category].filter(Boolean).some((field) =>
        field!.toLowerCase().includes(q),
      );
    });
  }, [listings, query, activeBase, activeCategory, activeCondition, ALL_BASES, ALL_CATEGORIES, ALL_CONDITIONS]);

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {[ALL_BASES, ...BASE_NAMES].map((base) => (
          <button
            key={base}
            type="button"
            onClick={() => setParam("base", base, ALL_BASES)}
            className={chipClass(activeBase === base)}
          >
            {base}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setParam("category", ALL_CATEGORIES, ALL_CATEGORIES)}
          className={chipClass(activeCategory === ALL_CATEGORIES)}
        >
          {ALL_CATEGORIES}
        </button>
        {PRODUCT_CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setParam("category", key, ALL_CATEGORIES)}
            className={chipClass(activeCategory === key)}
          >
            {PRODUCT_CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setParam("condition", ALL_CONDITIONS, ALL_CONDITIONS)}
          className={chipClass(activeCondition === ALL_CONDITIONS)}
        >
          {ALL_CONDITIONS}
        </button>
        {CONDITION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setParam("condition", key, ALL_CONDITIONS)}
            className={chipClass(activeCondition === key)}
          >
            {CONDITION_LABELS[key as ConditionKey]}
          </button>
        ))}
      </div>

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
