// src/components/products-grid.tsx
// The /products browse grid — a single Filters dropdown (base, category,
// condition) next to the search box, replacing what used to be three
// separate pill-chip rows above the search input. Every filter is
// multi-select (0 to all), same comma-joined-URL-param pattern as the
// Homes page's FilterDropdown.

"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FilterDropdown } from "@/components/filter-dropdown";
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

function useMultiParam(key: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const values = useMemo(() => (searchParams.get(key) ?? "").split(",").filter(Boolean), [searchParams, key]);

  function toggle(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
    if (next.length > 0) params.set(key, next.join(","));
    else params.delete(key);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return { values, toggle };
}

export function ProductsGrid({ listings, initialQuery = "" }: { listings: Listing[]; initialQuery?: string }) {
  const t = useTranslations("ProductsPage");
  const tFilter = useTranslations("FilterModal");
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();

  const base = useMultiParam("base");
  const category = useMultiParam("category");
  const condition = useMultiParam("condition");
  const activeCount = base.values.length + category.values.length + condition.values.length;

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (base.values.length > 0 && (!listing.base || !base.values.includes(listing.base))) return false;
      if (category.values.length > 0 && (!listing.productCategory || !category.values.includes(listing.productCategory)))
        return false;
      if (condition.values.length > 0 && (!listing.condition || !condition.values.includes(listing.condition)))
        return false;
      if (!q) return true;
      const categoryLabel = listing.productCategory
        ? PRODUCT_CATEGORY_LABELS[listing.productCategory as ProductCategoryKey]
        : null;
      return [listing.title, listing.city, categoryLabel].filter(Boolean).some((field) =>
        field!.toLowerCase().includes(q),
      );
    });
  }, [listings, query, base.values, category.values, condition.values]);

  return (
    <>
      <div className="mb-7 flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-canvas-deep bg-paper px-4 py-2.5 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
        />
        <FilterDropdown
          label={t("filtersLabel")}
          clearLabel={tFilter("clearAll")}
          activeCount={activeCount}
          onClearAll={clearAll}
          align="right"
          groups={[
            { label: t("filterBase"), options: BASE_NAMES.map((b) => ({ value: b, label: b })), selected: base.values, onToggle: base.toggle },
            {
              label: t("filterCategory"),
              options: PRODUCT_CATEGORY_KEYS.map((key) => ({ value: key, label: PRODUCT_CATEGORY_LABELS[key] })),
              selected: category.values,
              onToggle: category.toggle,
            },
            {
              label: t("filterCondition"),
              options: CONDITION_KEYS.map((key) => ({ value: key, label: CONDITION_LABELS[key as ConditionKey] })),
              selected: condition.values,
              onToggle: condition.toggle,
            },
          ]}
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
