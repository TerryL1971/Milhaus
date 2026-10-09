// src/components/products-grid.tsx
// The /products browse grid — the Unified Category UX spec's top filter
// bar: Base 📍, Category Specifics 🏷 (category), Price 💰, Features/
// Badges ⭐ (condition) dropdown clusters, a keyword box, and an explicit
// Apply Filters button. Plain local state, not URL params — see
// cars-grid.tsx's header comment for why (an explicit Apply button
// doesn't fit the old per-click-writes-the-URL model).

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { FilterBar } from "@/components/filter-bar";
import { FilterCheckboxList } from "@/components/filter-checkbox-list";
import { FilterCluster } from "@/components/filter-cluster";
import { PriceRangeFields } from "@/components/price-range-fields";
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

type Applied = {
  base: string[];
  category: string[];
  condition: string[];
  priceMin: number | null;
  priceMax: number | null;
};

const EMPTY_APPLIED: Applied = { base: [], category: [], condition: [], priceMin: null, priceMax: null };

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProductsGrid({
  listings,
  initialQuery = "",
  favoriteIds,
}: {
  listings: Listing[];
  initialQuery?: string;
  /** null = signed-out visitor (no hearts at all); array (possibly
   * empty) = signed in, these listing IDs are favorited. */
  favoriteIds: string[] | null;
}) {
  const t = useTranslations("ProductsPage");
  const tFilter = useTranslations("FilterModal");
  const [query, setQuery] = useState(initialQuery);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds ?? []), [favoriteIds]);

  const [applied, setApplied] = useState<Applied>(EMPTY_APPLIED);
  const [pending, setPending] = useState<Applied>(EMPTY_APPLIED);

  const activeCount =
    applied.base.length +
    applied.category.length +
    applied.condition.length +
    (applied.priceMin != null ? 1 : 0) +
    (applied.priceMax != null ? 1 : 0);

  function handleApply() {
    setApplied(pending);
  }

  function handleClearAll() {
    setPending(EMPTY_APPLIED);
    setApplied(EMPTY_APPLIED);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (applied.base.length > 0 && (!listing.base || !applied.base.includes(listing.base))) return false;
      if (applied.category.length > 0 && (!listing.productCategory || !applied.category.includes(listing.productCategory)))
        return false;
      if (applied.condition.length > 0 && (!listing.condition || !applied.condition.includes(listing.condition)))
        return false;
      if (applied.priceMin != null && listing.priceEurMonth < applied.priceMin) return false;
      if (applied.priceMax != null && listing.priceEurMonth > applied.priceMax) return false;
      if (!q) return true;
      const categoryLabel = listing.productCategory
        ? PRODUCT_CATEGORY_LABELS[listing.productCategory as ProductCategoryKey]
        : null;
      return [listing.title, listing.city, categoryLabel].filter(Boolean).some((field) =>
        field!.toLowerCase().includes(q),
      );
    });
  }, [listings, query, applied]);

  // Favorited listings first — stable sort, so everything else keeps
  // its existing relative order.
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => Number(favoriteIdSet.has(b.id)) - Number(favoriteIdSet.has(a.id))),
    [filtered, favoriteIdSet],
  );

  return (
    <>
      <FilterBar
        keyword={query}
        onKeywordChange={setQuery}
        keywordPlaceholder={t("searchPlaceholder")}
        activeCount={activeCount}
        activeLabel={(count) => tFilter("activeFiltersLabel", { count })}
        onApply={handleApply}
        applyLabel={tFilter("applyFilters")}
      >
        <FilterCluster label={t("filterBase")} icon="📍" badge={pending.base.length || undefined}>
          <FilterCheckboxList
            options={BASE_NAMES.map((b) => ({ value: b, label: b }))}
            selected={pending.base}
            onToggle={(value) => setPending((p) => ({ ...p, base: toggleIn(p.base, value) }))}
          />
        </FilterCluster>

        <FilterCluster label={tFilter("filterCategorySpecifics")} icon="🏷" badge={pending.category.length || undefined}>
          <FilterCheckboxList
            options={PRODUCT_CATEGORY_KEYS.map((key) => ({ value: key, label: PRODUCT_CATEGORY_LABELS[key] }))}
            selected={pending.category}
            onToggle={(value) => setPending((p) => ({ ...p, category: toggleIn(p.category, value) }))}
          />
        </FilterCluster>

        <FilterCluster
          label={tFilter("filterPrice")}
          icon="💰"
          badge={(pending.priceMin != null ? 1 : 0) + (pending.priceMax != null ? 1 : 0) || undefined}
        >
          <PriceRangeFields
            min={pending.priceMin}
            max={pending.priceMax}
            onMinChange={(value) => setPending((p) => ({ ...p, priceMin: value }))}
            onMaxChange={(value) => setPending((p) => ({ ...p, priceMax: value }))}
            minLabel={tFilter("priceMinUsd")}
            maxLabel={tFilter("priceMaxUsd")}
          />
        </FilterCluster>

        <FilterCluster label={tFilter("filterFeatures")} icon="⭐" badge={pending.condition.length || undefined}>
          <FilterCheckboxList
            options={CONDITION_KEYS.map((key) => ({ value: key, label: CONDITION_LABELS[key as ConditionKey] }))}
            selected={pending.condition}
            onToggle={(value) => setPending((p) => ({ ...p, condition: toggleIn(p.condition, value) }))}
          />
        </FilterCluster>

        {activeCount > 0 && (
          <button type="button" onClick={handleClearAll} className="text-sm font-semibold text-ink-soft hover:text-rust">
            {tFilter("clearAll")}
          </button>
        )}
      </FilterBar>

      {sorted.length === 0 ? (
        <p className="text-ink-soft">{listings.length === 0 ? t("emptyNone") : t("emptyNoMatch")}</p>
      ) : (
        // 4 columns, not 3 — on its own page, Buy & Sell should read as
        // smaller cards than Homes (which stays at 3), per Terry.
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((listing, index) => (
            <ProductListingCard
              key={listing.id}
              listing={listing}
              photoGradient={PHOTO_GRADIENTS[index % PHOTO_GRADIENTS.length]}
              isFavorited={favoriteIds ? favoriteIdSet.has(listing.id) : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}
