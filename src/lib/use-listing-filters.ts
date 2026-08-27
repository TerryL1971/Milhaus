// src/lib/use-listing-filters.ts
// Shared filter state for the browse page — used by both ListingsGrid (the
// base/amenity chips) and FilterModal (the hero's filter icon). Both write
// to the same URL search params, so extracted once rather than duplicated
// in two places that could quietly drift out of sync — e.g. an amenity key
// getting validated one way in one place and another way in the other.

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

  // Sentinel for "no base filter" — locale-aware, but harmless: it never
  // leaks into the URL (selecting it deletes the param, never sets it to
  // this value), it's only ever compared against itself.
  const ALL_BASES = t("allBases");

  // `|| ` on purpose, not `??` — an unselected <select name="base"> in the
  // hero form submits as an empty string, not an absent param, and that
  // must also mean "no filter."
  const activeBase = searchParams.get("base") || ALL_BASES;
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

  function setActiveBase(base: string) {
    updateParams({ base: base === ALL_BASES ? null : base });
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
    (activeBase !== ALL_BASES ? 1 : 0) +
    (minBedrooms > 0 ? 1 : 0) +
    (moveIn ? 1 : 0) +
    activeAmenities.length;

  return {
    ALL_BASES,
    activeBase,
    minBedrooms,
    moveIn,
    activeAmenities,
    activeCount,
    setActiveBase,
    setBedrooms,
    setMoveIn,
    toggleAmenity,
    clearAll,
  };
}
