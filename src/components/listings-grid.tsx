// src/components/listings-grid.tsx
// The "Open right now" section — a single Filters dropdown (base,
// amenities, bedrooms, move-in) plus the listing grid. Replaced the
// earlier pair of base/amenity pill-chip rows and the separate
// FilterModal popup on the hero's Rentals mini-card — one control
// instead of two UIs quietly driving the same filter state.
//
// Filter state lives in the URL (?base=...&bedrooms=...), not just local
// component state — useListingFilters is the read/write logic, shared
// with nothing else now that FilterModal is gone.

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { FilterDropdown } from "@/components/filter-dropdown";
import { ListingCard } from "@/components/listing-card";
import { Link } from "@/i18n/navigation";
import { AMENITY_KEYS } from "@/lib/amenities";
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
    activeCount,
    toggleBase,
    setBedrooms,
    setMoveIn,
    toggleAmenity,
    clearAll,
  } = useListingFilters();

  const filtered = useMemo(
    () =>
      listings.filter((listing) => {
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
        return true;
      }),
    [listings, activeBases, minBedrooms, moveIn, activeAmenities],
  );

  const hasActiveFilters = activeCount > 0;
  // Only pad the *unfiltered* view — see PlaceholderCard's comment for why.
  const placeholderCount = hasActiveFilters ? 0 : Math.max(0, 3 - filtered.length);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <h2 className="font-display text-[2rem] font-semibold text-ink">{t("heading")}</h2>
        <FilterDropdown
          label={tFilter("title")}
          clearLabel={tFilter("clearAll")}
          activeCount={activeCount}
          onClearAll={clearAll}
          align="right"
          extra={
            <div className="mb-4 flex flex-col gap-3 border-b border-canvas-deep pb-4">
              <div>
                <label htmlFor="filter-movein" className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {tHome("searchMoveIn")}
                </label>
                <input
                  id="filter-movein"
                  type="date"
                  value={moveIn}
                  onChange={(event) => setMoveIn(event.target.value)}
                  className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="filter-bedrooms" className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {tHome("searchBedrooms")}
                </label>
                <select
                  id="filter-bedrooms"
                  value={minBedrooms || ""}
                  onChange={(event) => setBedrooms(Number(event.target.value))}
                  className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
                >
                  <option value="">{tHome("searchAnyBedrooms")}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>
            </div>
          }
          groups={[
            {
              label: t("filterBase"),
              options: BASE_NAMES.map((base) => ({ value: base, label: base })),
              selected: activeBases,
              onToggle: toggleBase,
            },
            {
              label: t("filterAmenities"),
              options: AMENITY_KEYS.map((key) => ({ value: key, label: tAmenities(key) })),
              selected: activeAmenities,
              onToggle: (value) => toggleAmenity(value as (typeof AMENITY_KEYS)[number]),
            },
          ]}
        />
      </div>

      {filtered.length === 0 && hasActiveFilters ? (
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
