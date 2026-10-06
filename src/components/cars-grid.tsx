// src/components/cars-grid.tsx
// The /cars browse grid — a single Filters dropdown (base, make, year,
// transmission, US/EU spec) next to the search box, replacing what used
// to be separate base/make pill-chip rows above the search input. Make
// and year options are derived from whatever's actually listed rather
// than a fixed list — unlike bases, "every car make/year that could ever
// be sold here" isn't a fixed, known set. Every filter is multi-select
// (0 to all), same comma-joined-URL-param pattern as the Homes page's
// FilterDropdown.

"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CarListingCard } from "@/components/car-listing-card";
import { FilterDropdown } from "@/components/filter-dropdown";
import { BASE_NAMES } from "@/lib/bases";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#B9C4D0,#5C6B7A)",
  "linear-gradient(135deg,#C7B8A0,#3E4A57)",
  "linear-gradient(135deg,#A9B4A0,#2C4053)",
  "linear-gradient(135deg,#D3C6A6,#4B5A6B)",
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

export function CarsGrid({ listings, initialQuery = "" }: { listings: Listing[]; initialQuery?: string }) {
  const t = useTranslations("CarsPage");
  const tFilter = useTranslations("FilterModal");
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const base = useMultiParam("base");
  const make = useMultiParam("make");
  const year = useMultiParam("year");
  const transmission = useMultiParam("transmission");
  const spec = useMultiParam("spec"); // "us" | "eu"

  const makes = useMemo(
    () => Array.from(new Set(listings.map((l) => l.make).filter((m): m is string => !!m))).sort(),
    [listings],
  );
  const years = useMemo(
    () =>
      Array.from(new Set(listings.map((l) => l.year).filter((y): y is number => y != null)))
        .sort((a, b) => b - a)
        .map(String),
    [listings],
  );

  const activeCount = base.values.length + make.values.length + year.values.length + transmission.values.length + spec.values.length;

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (base.values.length > 0 && (!listing.base || !base.values.includes(listing.base))) return false;
      if (make.values.length > 0 && (!listing.make || !make.values.includes(listing.make))) return false;
      if (year.values.length > 0 && (listing.year == null || !year.values.includes(String(listing.year)))) return false;
      if (transmission.values.length > 0 && (!listing.transmission || !transmission.values.includes(listing.transmission)))
        return false;
      if (spec.values.length > 0) {
        const listingSpec = listing.usSpec === true ? "us" : listing.usSpec === false ? "eu" : null;
        if (!listingSpec || !spec.values.includes(listingSpec)) return false;
      }
      if (!q) return true;
      return [listing.title, listing.make, listing.model, listing.city]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [listings, query, base.values, make.values, year.values, transmission.values, spec.values]);

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
            ...(makes.length > 0
              ? [{ label: t("filterMake"), options: makes.map((m) => ({ value: m, label: m })), selected: make.values, onToggle: make.toggle }]
              : []),
            ...(years.length > 0
              ? [{ label: t("filterYear"), options: years.map((y) => ({ value: y, label: y })), selected: year.values, onToggle: year.toggle }]
              : []),
            {
              label: t("filterTransmission"),
              options: [
                { value: "automatic", label: t("transOptAutomatic") },
                { value: "manual", label: t("transOptManual") },
              ],
              selected: transmission.values,
              onToggle: transmission.toggle,
            },
            {
              label: t("filterUsSpec"),
              options: [
                { value: "us", label: t("specOptUs") },
                { value: "eu", label: t("specOptEu") },
              ],
              selected: spec.values,
              onToggle: spec.toggle,
            },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-soft">
          {listings.length === 0 ? t("emptyNone") : t("emptyNoMatch")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing, index) => (
            <CarListingCard
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
