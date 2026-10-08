// src/components/businesses-grid.tsx
// The /services (Military-Friendly Businesses) browse list — a single
// Filters dropdown (base, category) next to the search box, same pattern
// as cars-grid.tsx/products-grid.tsx. Rows instead of a photo grid, since
// these have no listing photos (see business-card.tsx).

"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BusinessCard } from "@/components/business-card";
import { FilterDropdown } from "@/components/filter-dropdown";
import { BASE_NAMES } from "@/lib/bases";
import { BUSINESS_CATEGORY_KEYS, BUSINESS_CATEGORY_LABELS, type Business } from "@/lib/businesses";

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

export function BusinessesGrid({ businesses, initialQuery = "" }: { businesses: Business[]; initialQuery?: string }) {
  const t = useTranslations("ServicesPage");
  const tFilter = useTranslations("FilterModal");
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();

  const base = useMultiParam("base");
  const category = useMultiParam("category");
  const activeCount = base.values.length + category.values.length;

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((business) => {
      if (base.values.length > 0 && (!business.base || !base.values.includes(business.base))) return false;
      if (category.values.length > 0 && !category.values.includes(business.category)) return false;
      if (!q) return true;
      return [business.name, business.city, BUSINESS_CATEGORY_LABELS[business.category]]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [businesses, query, base.values, category.values]);

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
              options: BUSINESS_CATEGORY_KEYS.map((key) => ({ value: key, label: BUSINESS_CATEGORY_LABELS[key] })),
              selected: category.values,
              onToggle: category.toggle,
            },
          ]}
        />
      </div>

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
