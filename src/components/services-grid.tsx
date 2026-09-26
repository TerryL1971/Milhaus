// src/components/services-grid.tsx
// The /services browse grid — same shape as products-grid.tsx: a free-text
// search box (title/city/category), no URL-driven filter chips.

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ServiceListingCard } from "@/components/service-listing-card";
import { SERVICE_CATEGORY_LABELS, type ServiceCategoryKey } from "@/lib/service-categories";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#B9C4B0,#6B7353)",
  "linear-gradient(135deg,#C9C2A8,#8C9873)",
  "linear-gradient(135deg,#AEB99E,#545A41)",
  "linear-gradient(135deg,#C3BFA6,#79835F)",
];

export function ServicesGrid({ listings, initialQuery = "" }: { listings: Listing[]; initialQuery?: string }) {
  const t = useTranslations("ServicesPage");
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((listing) => {
      const category = listing.serviceCategory
        ? SERVICE_CATEGORY_LABELS[listing.serviceCategory as ServiceCategoryKey]
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
