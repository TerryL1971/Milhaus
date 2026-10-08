// src/components/listings-grid.tsx
// The "Open right now" section — the Unified Category UX spec's top
// filter bar (Base / Category Specifics / Price / Features dropdown
// clusters, a keyword box, and an explicit Apply Filters button) plus
// the listing grid. Each dropdown cluster holds its own *pending*
// selections locally; nothing actually re-filters the grid until Apply
// is clicked — that's the one behavioral difference from the single
// "Filters" dropdown this replaced, which applied each checkbox
// instantly. Keyword search is the exception: it filters live, since
// gating a text box behind a button click isn't how search boxes work
// anywhere else on this site.
//
// Filter state lives in the URL (?base=...&bedrooms=...) once Applied —
// useListingFilters is the read/write logic for that "applied" layer.

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { FilterBar } from "@/components/filter-bar";
import { FilterCheckboxList } from "@/components/filter-checkbox-list";
import { FilterCluster } from "@/components/filter-cluster";
import { ListingCard } from "@/components/listing-card";
import { PriceRangeFields } from "@/components/price-range-fields";
import { Link } from "@/i18n/navigation";
import { AMENITY_KEYS, type AmenityKey } from "@/lib/amenities";
import { BASE_NAMES } from "@/lib/bases";
import type { Listing } from "@/lib/types";
import { useListingFilters } from "@/lib/use-listing-filters";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
  "linear-gradient(135deg,#C7B8A0,#7E8A6C)",
  "linear-gradient(135deg,#D9CBAF,#B0A184)",
];

// Shown to fill out the grid to 3 cards when real inventory is thin (a
// brand-new launch, or just a slow week) — but never disguised as actual
// listings. No price, no address, no photo of a specific house; a dashed
// border and centered text instead of the ListingCard treatment, same
// visual language as an "empty slot" UI convention. Never shown while a
// filter is active — padding a filtered, specific result set with generic
// filler would be actively misleading ("3 listings near Ramstein" when
// there's really 1), not just decorative.
function PlaceholderCard({ variant }: { variant: 0 | 1 | 2 }) {
  const t = useTranslations("ListingsGrid");
  const content: { heading: string; body: string; ctaLabel?: string; ctaHref?: string }[] = [
    { heading: t("placeholder1Heading"), body: t("placeholder1Body") },
    { heading: t("placeholder2Heading"), body: t("placeholder2Body"), ctaLabel: t("placeholder2Cta"), ctaHref: "/post" },
    { heading: t("placeholder3Heading"), body: t("placeholder3Body"), ctaLabel: t("placeholder3Cta"), ctaHref: "/for-landlords" },
  ];
  const { heading, body, ctaLabel, ctaHref } = content[variant];

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-canvas-deep bg-canvas/40 p-6 text-center">
      <p className="font-display text-base font-semibold text-ink">{heading}</p>
      <p className="text-sm text-ink-soft">{body}</p>
      {ctaHref && (
        <Link href={ctaHref} className="mt-2 text-sm font-semibold text-olive-deep hover:underline">
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}

export function ListingsGrid({ listings }: { listings: Listing[] }) {
  const t = useTranslations("ListingsGrid");
  const tHome = useTranslations("HomePage");
  const tAmenities = useTranslations("Amenities");
  const tFilter = useTranslations("FilterModal");
  const locale = useLocale();
  const {
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
  } = useListingFilters();

  const [keyword, setKeyword] = useState("");

  // Pending — what's checked/typed in the (still-open or just-closed)
  // dropdowns, not yet applied to the grid. Re-synced from the applied
  // values whenever Apply or Clear actually changes them.
  const [pendingBases, setPendingBases] = useState(activeBases);
  const [pendingAmenities, setPendingAmenities] = useState<AmenityKey[]>(activeAmenities);
  const [pendingBedrooms, setPendingBedrooms] = useState(minBedrooms);
  const [pendingMoveIn, setPendingMoveIn] = useState(moveIn);
  const [pendingPriceMin, setPendingPriceMin] = useState(priceMin);
  const [pendingPriceMax, setPendingPriceMax] = useState(priceMax);
  const [pendingHousingOnly, setPendingHousingOnly] = useState(housingOfficeOnly);

  function handleApply() {
    applyFilters({
      bases: pendingBases,
      amenities: pendingAmenities,
      minBedrooms: pendingBedrooms,
      moveIn: pendingMoveIn,
      priceMin: pendingPriceMin,
      priceMax: pendingPriceMax,
      housingOfficeOnly: pendingHousingOnly,
    });
  }

  function handleClearAll() {
    setPendingBases([]);
    setPendingAmenities([]);
    setPendingBedrooms(0);
    setPendingMoveIn("");
    setPendingPriceMin(null);
    setPendingPriceMax(null);
    setPendingHousingOnly(false);
    clearAll();
  }

  function toggleIn<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return listings.filter((listing) => {
      if (activeBases.length > 0 && (!listing.base || !activeBases.includes(listing.base))) return false;
      if (minBedrooms > 0 && listing.bedrooms != null && listing.bedrooms < minBedrooms) return false;
      // "I need to move in by this date" — a listing works if it's
      // already available, or becomes available on/before that date.
      // A listing with no availableFrom set stays in rather than getting
      // hidden by missing data.
      if (moveIn && listing.availableFrom && listing.availableFrom > moveIn) return false;
      // AND, not OR — "garage + garden" means both, matching how real
      // estate filters usually read (each additional check narrows the
      // results further, rather than broadening them).
      if (activeAmenities.some((key) => !listing.amenities.includes(key))) return false;
      if (priceMin != null && listing.priceEurMonth < priceMin) return false;
      if (priceMax != null && listing.priceEurMonth > priceMax) return false;
      if (housingOfficeOnly && listing.source !== "housing_office") return false;
      if (!q) return true;
      return [listing.title, listing.city, listing.address].filter(Boolean).some((field) =>
        field!.toLowerCase().includes(q),
      );
    });
  }, [listings, keyword, activeBases, minBedrooms, moveIn, activeAmenities, priceMin, priceMax, housingOfficeOnly]);

  const hasActiveFilters = activeCount > 0;
  // Only pad the *unfiltered* view — see PlaceholderCard's comment for why.
  const placeholderCount = hasActiveFilters || keyword ? 0 : Math.max(0, 3 - filtered.length);

  return (
    <>
      <div className="mb-5">
        <h2 className="font-display text-[2rem] font-semibold text-ink">{t("heading")}</h2>
      </div>

      <FilterBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        keywordPlaceholder={t("searchPlaceholder")}
        activeCount={activeCount}
        activeLabel={(count) => tFilter("activeFiltersLabel", { count })}
        onApply={handleApply}
        applyLabel={tFilter("applyFilters")}
      >
        <FilterCluster label={t("filterBase")} icon="📍" badge={pendingBases.length || undefined}>
          <FilterCheckboxList
            options={BASE_NAMES.map((base) => ({ value: base, label: base }))}
            selected={pendingBases}
            onToggle={(value) => setPendingBases((prev) => toggleIn(prev, value))}
          />
        </FilterCluster>

        <FilterCluster
          label={tFilter("filterCategorySpecifics")}
          icon="🏷"
          badge={(pendingBedrooms > 0 ? 1 : 0) + (pendingMoveIn ? 1 : 0) || undefined}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="filter-movein" className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                {tHome("searchMoveIn")}
              </label>
              <input
                id="filter-movein"
                type="date"
                value={pendingMoveIn}
                onChange={(event) => setPendingMoveIn(event.target.value)}
                className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="filter-bedrooms" className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                {tHome("searchBedrooms")}
              </label>
              <select
                id="filter-bedrooms"
                value={pendingBedrooms || ""}
                onChange={(event) => setPendingBedrooms(Number(event.target.value))}
                className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
              >
                <option value="">{tHome("searchAnyBedrooms")}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>
        </FilterCluster>

        <FilterCluster
          label={tFilter("filterPrice")}
          icon="💰"
          badge={(pendingPriceMin != null ? 1 : 0) + (pendingPriceMax != null ? 1 : 0) || undefined}
        >
          <PriceRangeFields
            min={pendingPriceMin}
            max={pendingPriceMax}
            onMinChange={setPendingPriceMin}
            onMaxChange={setPendingPriceMax}
            minLabel={tFilter("priceMin")}
            maxLabel={tFilter("priceMax")}
          />
        </FilterCluster>

        <FilterCluster
          label={tFilter("filterFeatures")}
          icon="⭐"
          badge={pendingAmenities.length + (pendingHousingOnly ? 1 : 0) || undefined}
        >
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={pendingHousingOnly}
                onChange={(event) => setPendingHousingOnly(event.target.checked)}
                className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
              />
              <span>{tFilter("housingApprovedOnly")}</span>
            </label>
            <div>
              <span className="mb-1.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                {t("filterAmenities")}
              </span>
              <FilterCheckboxList
                options={AMENITY_KEYS.map((key) => ({ value: key, label: tAmenities(key) }))}
                selected={pendingAmenities}
                onToggle={(value) => setPendingAmenities((prev) => toggleIn(prev, value as AmenityKey))}
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

      {filtered.length === 0 && (hasActiveFilters || keyword) ? (
        <p className="text-ink-soft">
          {t("emptyPrefix")}
          {activeBases.length > 0 ? ` ${t("emptyNear", { base: activeBases.join(", ") })}` : ""}
          {minBedrooms > 0 ? ` ${t("emptyBedrooms", { count: minBedrooms })}` : ""}
          {moveIn
            ? ` ${t("emptyMoveIn", { date: new Date(`${moveIn}T00:00:00`).toLocaleDateString(locale, { month: "long", day: "numeric" }) })}`
            : ""}
          {activeAmenities.length > 0
            ? ` ${t("emptyAmenities", { list: activeAmenities.map((key) => tAmenities(key)).join(", ") })}`
            : ""}{" "}
          {t("emptySuffix")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing, index) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              photoGradient={PHOTO_GRADIENTS[index % PHOTO_GRADIENTS.length]}
            />
          ))}
          {Array.from({ length: placeholderCount }).map((_, index) => (
            <PlaceholderCard key={`placeholder-${index}`} variant={index as 0 | 1 | 2} />
          ))}
        </div>
      )}
    </>
  );
}
