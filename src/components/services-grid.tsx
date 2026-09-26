// src/components/services-grid.tsx
// The /services browse grid — base + category filter chips (URL-driven,
// same pattern as ListingsGrid's chips on the rental page) plus the
// existing free-text search box, all combined with AND logic.

"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ServiceListingCard } from "@/components/service-listing-card";
import { BASE_NAMES } from "@/lib/bases";
import { SERVICE_CATEGORY_KEYS, SERVICE_CATEGORY_LABELS, type ServiceCategoryKey } from "@/lib/service-categories";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#B9C4B0,#6B7353)",
  "linear-gradient(135deg,#C9C2A8,#8C9873)",
  "linear-gradient(135deg,#AEB99E,#545A41)",
  "linear-gradient(135deg,#C3BFA6,#79835F)",
];

const chipClass = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 font-mono text-[0.74rem] tracking-wide transition-colors ${
    active
      ? "border-olive bg-olive text-paper"
      : "border-canvas-deep bg-paper text-ink-soft hover:border-olive/50"
  }`;

export function ServicesGrid({ listings, initialQuery = "" }: { listings: Listing[]; initialQuery?: string }) {
  const t = useTranslations("ServicesPage");
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ALL_BASES = t("allBases");
  const ALL_CATEGORIES = t("allCategories");
  const activeBase = searchParams.get("base") || ALL_BASES;
  const activeCategory = searchParams.get("category") || ALL_CATEGORIES;

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
      if (activeCategory !== ALL_CATEGORIES && listing.serviceCategory !== activeCategory) return false;
      if (!q) return true;
      const category = listing.serviceCategory
        ? SERVICE_CATEGORY_LABELS[listing.serviceCategory as ServiceCategoryKey]
        : null;
      return [listing.title, listing.city, category].filter(Boolean).some((field) =>
        field!.toLowerCase().includes(q),
      );
    });
  }, [listings, query, activeBase, activeCategory, ALL_BASES, ALL_CATEGORIES]);

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

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setParam("category", ALL_CATEGORIES, ALL_CATEGORIES)}
          className={chipClass(activeCategory === ALL_CATEGORIES)}
        >
          {ALL_CATEGORIES}
        </button>
        {SERVICE_CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setParam("category", key, ALL_CATEGORIES)}
            className={chipClass(activeCategory === key)}
          >
            {SERVICE_CATEGORY_LABELS[key]}
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
            <ServiceListingCard
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
