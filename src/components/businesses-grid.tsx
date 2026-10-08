// src/components/businesses-grid.tsx
// The /services (Military-Friendly Businesses) browse list — the
// Unified Category UX spec's top filter bar: Base 📍, Category
// Specifics 🏷 (service type, min rating), Features/Badges ⭐ (tags —
// VAT form accepted, English/military friendly) dropdown clusters, a
// keyword box, and an explicit Apply Filters button. No Price cluster —
// the spec's own per-category filter list for Services doesn't include
// one (these aren't priced listings). Rows instead of a photo grid,
// since these have no listing photos (see business-card.tsx). Plain
// local state, not URL params — see cars-grid.tsx's header comment for
// why.

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { BusinessCard } from "@/components/business-card";
import { FilterBar } from "@/components/filter-bar";
import { FilterCheckboxList } from "@/components/filter-checkbox-list";
import { FilterCluster } from "@/components/filter-cluster";
import { BASE_NAMES } from "@/lib/bases";
import {
  BUSINESS_CATEGORY_KEYS,
  BUSINESS_CATEGORY_LABELS,
  BUSINESS_TAG_KEYS,
  BUSINESS_TAG_LABELS,
  type Business,
} from "@/lib/businesses";

type Applied = {
  base: string[];
  category: string[];
  minRating: number;
  tags: string[];
};

const EMPTY_APPLIED: Applied = { base: [], category: [], minRating: 0, tags: [] };

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function BusinessesGrid({ businesses, initialQuery = "" }: { businesses: Business[]; initialQuery?: string }) {
  const t = useTranslations("ServicesPage");
  const tFilter = useTranslations("FilterModal");
  const [query, setQuery] = useState(initialQuery);

  const [applied, setApplied] = useState<Applied>(EMPTY_APPLIED);
  const [pending, setPending] = useState<Applied>(EMPTY_APPLIED);

  const activeCount =
    applied.base.length + applied.category.length + (applied.minRating > 0 ? 1 : 0) + applied.tags.length;

  function handleApply() {
    setApplied(pending);
  }

  function handleClearAll() {
    setPending(EMPTY_APPLIED);
    setApplied(EMPTY_APPLIED);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((business) => {
      if (applied.base.length > 0 && (!business.base || !applied.base.includes(business.base))) return false;
      if (applied.category.length > 0 && !applied.category.includes(business.category)) return false;
      if (applied.minRating > 0 && (business.rating == null || business.rating < applied.minRating)) return false;
      if (applied.tags.some((tag) => !business.tags.includes(tag as (typeof business.tags)[number]))) return false;
      if (!q) return true;
      return [business.name, business.city, BUSINESS_CATEGORY_LABELS[business.category]]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [businesses, query, applied]);

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

        <FilterCluster
          label={tFilter("filterCategorySpecifics")}
          icon="🏷"
          badge={pending.category.length + (pending.minRating > 0 ? 1 : 0) || undefined}
        >
          <div className="flex flex-col gap-4">
            <div>
              <span className="mb-1.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                {t("filterCategory")}
              </span>
              <FilterCheckboxList
                options={BUSINESS_CATEGORY_KEYS.map((key) => ({ value: key, label: BUSINESS_CATEGORY_LABELS[key] }))}
                selected={pending.category}
                onToggle={(value) => setPending((p) => ({ ...p, category: toggleIn(p.category, value) }))}
              />
            </div>
            <div>
              <label htmlFor="filter-min-rating" className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                {t("filterMinRating")}
              </label>
              <select
                id="filter-min-rating"
                value={pending.minRating || ""}
                onChange={(event) => setPending((p) => ({ ...p, minRating: Number(event.target.value) }))}
                className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
              >
                <option value="">{t("filterAnyRating")}</option>
                <option value="3">★ 3+</option>
                <option value="4">★ 4+</option>
                <option value="4.5">★ 4.5+</option>
              </select>
            </div>
          </div>
        </FilterCluster>

        <FilterCluster label={tFilter("filterFeatures")} icon="⭐" badge={pending.tags.length || undefined}>
          <FilterCheckboxList
            options={BUSINESS_TAG_KEYS.map((key) => ({ value: key, label: BUSINESS_TAG_LABELS[key] }))}
            selected={pending.tags}
            onToggle={(value) => setPending((p) => ({ ...p, tags: toggleIn(p.tags, value) }))}
          />
        </FilterCluster>

        {activeCount > 0 && (
          <button type="button" onClick={handleClearAll} className="text-sm font-semibold text-ink-soft hover:text-rust">
            {tFilter("clearAll")}
          </button>
        )}
      </FilterBar>

      {filtered.length === 0 ? (
        <p className="text-ink-soft">{businesses.length === 0 ? t("emptyNone") : t("emptyNoMatch")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </>
  );
}
