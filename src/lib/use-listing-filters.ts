// src/lib/use-listing-filters.ts
// Filter state for the Homes browse page's Filters dropdown
// (FilterDropdown, next to the "Open right now" heading) — base,
// amenities, bedrooms, and move-in all read/write the same URL search
// params through this one hook rather than each owning its own state.

"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AMENITY_KEYS, type AmenityKey } from "@/lib/amenities";

export function useListingFilters() {
  const t = useTranslations("ListingsGrid");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sentinel kept for callers that still want a single "no base filter"
  // label (e.g. the hero's plain-HTML search-by-base <select>, a
  // different control than the checkbox filter below).
  const ALL_BASES = t("allBases");

  // Bases are a multi-select (0 to all) now, same comma-joined-param
  // pattern as amenities below — an empty selection means "no filter",
  // not "show nothing."
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

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}#listings`, { scroll: false });
  }

  function toggleBase(base: string) {
    const next = activeBases.includes(base) ? activeBases.filter((b) => b !== base) : [...activeBases, base];
    updateParams({ base: next.length > 0 ? next.join(",") : null });
  }

  function setBedrooms(count: number) {
    updateParams({ bedrooms: count > 0 ? String(count) : null });
  }

  function setMoveIn(date: string) {
    updateParams({ movein: date || null });
  }

  function toggleAmenity(key: AmenityKey) {
    const next = activeAmenities.includes(key)
      ? activeAmenities.filter((k) => k !== key)
      : [...activeAmenities, key];
    updateParams({ amenities: next.length > 0 ? next.join(",") : null });
  }

  function clearAll() {
    router.replace(`${pathname}#listings`, { scroll: false });
  }

  const activeCount =
    activeBases.length + (minBedrooms > 0 ? 1 : 0) + (moveIn ? 1 : 0) + activeAmenities.length;

  return {
    ALL_BASES,
    activeBases,
    minBedrooms,
    moveIn,
    activeAmenities,
    activeCount,
    toggleBase,
    setBedrooms,
    setMoveIn,
    toggleAmenity,
    clearAll,
  };
}
