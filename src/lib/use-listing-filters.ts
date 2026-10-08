// src/lib/use-listing-filters.ts
// Applied filter state for the Homes browse page — read from the URL
// (?base=...&bedrooms=...), written in one batch by applyFilters rather
// than per-checkbox-click. That batching matches the Unified Category UX
// spec's top filter bar: dropdown clusters hold their own pending
// selections locally (see ListingsGrid) and only become "applied" (i.e.
// actually filter the grid) when the bar's single "Apply Filters" button
// is clicked.

"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AMENITY_KEYS, type AmenityKey } from "@/lib/amenities";

export interface ListingFiltersUpdate {
  bases?: string[];
  amenities?: AmenityKey[];
  minBedrooms?: number;
  moveIn?: string;
  priceMin?: number | null;
  priceMax?: number | null;
  housingOfficeOnly?: boolean;
}

export function useListingFilters() {
  const t = useTranslations("ListingsGrid");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sentinel kept for callers that still want a single "no base filter"
  // label (e.g. the hero's plain-HTML search-by-base <select>, a
  // different control than the checkbox filter below).
  const ALL_BASES = t("allBases");

  const activeBases = useMemo(
    () => (searchParams.get("base") ?? "").split(",").filter(Boolean),
    [searchParams],
  );
  const minBedrooms = Number(searchParams.get("bedrooms")) || 0;
  // moveIn stays a plain "YYYY-MM-DD" string — exactly what
  // <input type="date"> submits and what availableFrom is stored as, so
  // comparing lexically avoids any Date/timezone parsing.
  const moveIn = searchParams.get("movein") || "";
  const activeAmenities = useMemo(
    () =>
      (searchParams.get("amenities") ?? "")
        .split(",")
        .filter((key): key is AmenityKey => AMENITY_KEYS.includes(key as AmenityKey)),
    [searchParams],
  );
  const priceMinRaw = searchParams.get("priceMin");
  const priceMaxRaw = searchParams.get("priceMax");
  const priceMin = priceMinRaw ? Number(priceMinRaw) : null;
  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : null;
  const housingOfficeOnly = searchParams.get("housingApproved") === "1";

  function applyFilters(updates: ListingFiltersUpdate) {
    const params = new URLSearchParams(searchParams.toString());
    const set = (key: string, value: string | null) => {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    };

    if (updates.bases !== undefined) set("base", updates.bases.length > 0 ? updates.bases.join(",") : null);
    if (updates.amenities !== undefined) set("amenities", updates.amenities.length > 0 ? updates.amenities.join(",") : null);
    if (updates.minBedrooms !== undefined) set("bedrooms", updates.minBedrooms > 0 ? String(updates.minBedrooms) : null);
    if (updates.moveIn !== undefined) set("movein", updates.moveIn || null);
    if (updates.priceMin !== undefined) set("priceMin", updates.priceMin != null ? String(updates.priceMin) : null);
    if (updates.priceMax !== undefined) set("priceMax", updates.priceMax != null ? String(updates.priceMax) : null);
    if (updates.housingOfficeOnly !== undefined) set("housingApproved", updates.housingOfficeOnly ? "1" : null);

    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}#listings`, { scroll: false });
  }

  function clearAll() {
    router.replace(`${pathname}#listings`, { scroll: false });
  }

  const activeCount =
    activeBases.length +
    (minBedrooms > 0 ? 1 : 0) +
    (moveIn ? 1 : 0) +
    activeAmenities.length +
    (priceMin != null ? 1 : 0) +
    (priceMax != null ? 1 : 0) +
    (housingOfficeOnly ? 1 : 0);

  return {
    ALL_BASES,
    activeBases,
    minBedrooms,
    moveIn,
    activeAmenities,
    priceMin,
    priceMax,
    housingOfficeOnly,
    activeCount,
    applyFilters,
    clearAll,
  };
}
