// src/components/cars-grid.tsx
// The /cars browse grid — the Unified Category UX spec's top filter bar:
// Base 📍, Category Specifics 🏷 (make/year), Price 💰, Features/Badges ⭐
// (transmission, US/EU spec) dropdown clusters, a keyword box, and an
// explicit Apply Filters button. Make and year options are derived from
// whatever's actually listed rather than a fixed list — unlike bases,
// "every car make/year that could ever be sold here" isn't a fixed,
// known set.
//
// Filter state is plain local state now, not URL params — the old
// per-click-writes-the-URL model doesn't fit an explicit Apply button
// (each toggle would've raced the next one against a stale
// searchParams snapshot). Resets on reload; that's an acceptable trade
// for a bar whose whole point is "nothing happens until you click
// Apply" anyway.

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { CarListingCard } from "@/components/car-listing-card";
import { FilterBar } from "@/components/filter-bar";
import { FilterCheckboxList } from "@/components/filter-checkbox-list";
import { FilterCluster } from "@/components/filter-cluster";
import { PriceRangeFields } from "@/components/price-range-fields";
import { BASE_NAMES } from "@/lib/bases";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#B9C4D0,#5C6B7A)",
  "linear-gradient(135deg,#C7B8A0,#3E4A57)",
  "linear-gradient(135deg,#A9B4A0,#2C4053)",
  "linear-gradient(135deg,#D3C6A6,#4B5A6B)",
];

type Applied = {
  base: string[];
  make: string[];
  year: string[];
  transmission: string[];
  spec: string[];
  priceMin: number | null;
  priceMax: number | null;
};

const EMPTY_APPLIED: Applied = { base: [], make: [], year: [], transmission: [], spec: [], priceMin: null, priceMax: null };

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CarsGrid({ listings, initialQuery = "" }: { listings: Listing[]; initialQuery?: string }) {
  const t = useTranslations("CarsPage");
  const tFilter = useTranslations("FilterModal");
  const [query, setQuery] = useState(initialQuery);

  const [applied, setApplied] = useState<Applied>(EMPTY_APPLIED);
  const [pending, setPending] = useState<Applied>(EMPTY_APPLIED);

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

  const activeCount =
    applied.base.length +
    applied.make.length +
    applied.year.length +
    applied.transmission.length +
    applied.spec.length +
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
      if (applied.make.length > 0 && (!listing.make || !applied.make.includes(listing.make))) return false;
      if (applied.year.length > 0 && (listing.year == null || !applied.year.includes(String(listing.year)))) return false;
      if (applied.transmission.length > 0 && (!listing.transmission || !applied.transmission.includes(listing.transmission)))
        return false;
      if (applied.spec.length > 0) {
        const listingSpec = listing.usSpec === true ? "us" : listing.usSpec === false ? "eu" : null;
        if (!listingSpec || !applied.spec.includes(listingSpec)) return false;
      }
      if (applied.priceMin != null && listing.priceEurMonth < applied.priceMin) return false;
      if (applied.priceMax != null && listing.priceEurMonth > applied.priceMax) return false;
      if (!q) return true;
      return [listing.title, listing.make, listing.model, listing.city]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [listings, query, applied]);

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
          badge={pending.make.length + pending.year.length || undefined}
        >
          <div className="flex flex-col gap-4">
            {makes.length > 0 && (
              <div>
                <span className="mb-1.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {t("filterMake")}
                </span>
                <FilterCheckboxList
                  options={makes.map((m) => ({ value: m, label: m }))}
                  selected={pending.make}
                  onToggle={(value) => setPending((p) => ({ ...p, make: toggleIn(p.make, value) }))}
                />
              </div>
            )}
            {years.length > 0 && (
              <div>
                <span className="mb-1.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {t("filterYear")}
                </span>
                <FilterCheckboxList
                  options={years.map((y) => ({ value: y, label: y }))}
                  selected={pending.year}
                  onToggle={(value) => setPending((p) => ({ ...p, year: toggleIn(p.year, value) }))}
                />
              </div>
            )}
          </div>
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
            minLabel={tFilter("priceMin")}
            maxLabel={tFilter("priceMax")}
          />
        </FilterCluster>

        <FilterCluster
          label={tFilter("filterFeatures")}
          icon="⭐"
          badge={pending.transmission.length + pending.spec.length || undefined}
        >
          <div className="flex flex-col gap-4">
            <div>
              <span className="mb-1.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                {t("filterTransmission")}
              </span>
              <FilterCheckboxList
                options={[
                  { value: "automatic", label: t("transOptAutomatic") },
                  { value: "manual", label: t("transOptManual") },
                ]}
                selected={pending.transmission}
                onToggle={(value) => setPending((p) => ({ ...p, transmission: toggleIn(p.transmission, value) }))}
              />
            </div>
            <div>
              <span className="mb-1.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                {t("filterUsSpec")}
              </span>
              <FilterCheckboxList
                options={[
                  { value: "us", label: t("specOptUs") },
                  { value: "eu", label: t("specOptEu") },
                ]}
                selected={pending.spec}
                onToggle={(value) => setPending((p) => ({ ...p, spec: toggleIn(p.spec, value) }))}
              />
            </div>
          </div>
        </FilterCluster>

        {activeCount > 0 && (
          <button type="button" onClick={handleClearAll} className="text-sm font-semibold text-ink-soft hover:text-rust">
            {tFilter("clearAll")}
          </button>
        )}
      </FilterBar>

      {filtered.length === 0 ? (
        <p className="text-ink-soft">
          {listings.length === 0 ? t("emptyNone") : t("emptyNoMatch")}
        </p>
      ) : (
        // 4 columns, not 3 — on its own page, Cars should read as
        // smaller cards than Homes (which stays at 3), per Terry.
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
