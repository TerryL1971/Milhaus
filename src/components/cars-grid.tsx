// src/components/cars-grid.tsx
// The /cars browse grid — the Unified Category UX spec's top filter bar:
// Base 📍, Category Specifics 🏷 (make/year), Price 💰, Transmission /
// Spec ⭐ (renamed from the generic "Features/Badges" label the spec's
// other grids still use — Charlie's ask, this cluster is specifically
// transmission + US/EU spec, not tags) dropdown clusters, a keyword box,
// and an explicit Apply Filters button. Make and year options are derived from
// whatever's actually listed rather than a fixed list — unlike bases,
// "every car make/year that could ever be sold here" isn't a fixed,
// known set.
//
// Filter state is plain local state now, not URL params — the old
// per-click-writes-the-URL model doesn't fit an explicit Apply button
// (each toggle would've raced the next one against a stale
// searchParams snapshot). Resets on reload; that's an acceptable trade
// for a bar whose whole point is "nothing happens until you click
// Apply" anyway. initialQuery/initialBase are the one exception — seeded
// once from ?q=/?base= when the homepage's unified search bar sends a
// "Cars" pick straight here (see search/page.tsx's redirect) instead of
// to the generic /search page, so the visitor lands already filtered to
// what they searched for rather than on an empty grid.

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { CarListingCard } from "@/components/car-listing-card";
import { FilterBar } from "@/components/filter-bar";
import { FilterCheckboxList } from "@/components/filter-checkbox-list";
import { FilterCluster } from "@/components/filter-cluster";
import { PriceRangeFields } from "@/components/price-range-fields";
import { SearchNoResultsAlert } from "@/components/search-no-results-alert";
import { BASE_NAMES } from "@/lib/bases";
import { CAR_BODY_TYPE_KEYS, CAR_BODY_TYPE_LABELS } from "@/lib/car-body-types";
import { listingBases } from "@/lib/listing-bases";
import { firstPhotoIndices } from "@/lib/priority-indices";
import { matchesListing } from "@/lib/search-matching";
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
  bodyType: string[];
  transmission: string[];
  spec: string[];
  priceMin: number | null;
  priceMax: number | null;
};

const EMPTY_APPLIED: Applied = {
  base: [],
  make: [],
  year: [],
  bodyType: [],
  transmission: [],
  spec: [],
  priceMin: null,
  priceMax: null,
};

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CarsGrid({
  listings,
  initialQuery = "",
  initialBase = "",
  favoriteIds,
}: {
  listings: Listing[];
  initialQuery?: string;
  /** Carried over from the homepage's unified search bar (?base=) when a
   * visitor picks "Cars" and a location and hits Search there — see
   * search/page.tsx's redirect. */
  initialBase?: string;
  /** null = signed-out visitor (no hearts at all); array (possibly
   * empty) = signed in, these listing IDs are favorited. */
  favoriteIds: string[] | null;
}) {
  const t = useTranslations("CarsPage");
  const tFilter = useTranslations("FilterModal");
  const [query, setQuery] = useState(initialQuery);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds ?? []), [favoriteIds]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setAlertDismissed(false);
  }

  const initialApplied = useMemo(
    () => (initialBase ? { ...EMPTY_APPLIED, base: [initialBase] } : EMPTY_APPLIED),
    [initialBase],
  );
  const [applied, setApplied] = useState<Applied>(initialApplied);
  const [pending, setPending] = useState<Applied>(initialApplied);

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
    applied.bodyType.length +
    applied.transmission.length +
    applied.spec.length +
    (applied.priceMin != null ? 1 : 0) +
    (applied.priceMax != null ? 1 : 0);

  function handleApply() {
    setApplied(pending);
    setAlertDismissed(false);
  }

  function handleClearAll() {
    setPending(EMPTY_APPLIED);
    setApplied(EMPTY_APPLIED);
    setQuery("");
    setAlertDismissed(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (applied.base.length > 0 && !listingBases(listing).some((b) => applied.base.includes(b))) return false;
      if (applied.make.length > 0 && (!listing.make || !applied.make.includes(listing.make))) return false;
      if (applied.year.length > 0 && (listing.year == null || !applied.year.includes(String(listing.year)))) return false;
      if (applied.bodyType.length > 0 && (!listing.bodyType || !applied.bodyType.includes(listing.bodyType))) return false;
      if (applied.transmission.length > 0 && (!listing.transmission || !applied.transmission.includes(listing.transmission)))
        return false;
      if (applied.spec.length > 0) {
        const listingSpec = listing.usSpec === true ? "us" : listing.usSpec === false ? "eu" : null;
        if (!listingSpec || !applied.spec.includes(listingSpec)) return false;
      }
      if (applied.priceMin != null && listing.priceEurMonth < applied.priceMin) return false;
      if (applied.priceMax != null && listing.priceEurMonth > applied.priceMax) return false;
      if (!q) return true;
      return matchesListing(listing, q);
    });
  }, [listings, query, applied]);

  // Favorited listings first — stable sort, so everything else keeps
  // its existing relative order.
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => Number(favoriteIdSet.has(b.id)) - Number(favoriteIdSet.has(a.id))),
    [filtered, favoriteIdSet],
  );

  // Zero inventory (nothing posted yet) stays a plain line of text in
  // the grid area — not a search failure, so not the red alert. Zero
  // *matches* against real inventory is the alert case instead.
  const noInventory = listings.length === 0;
  const noResults = !noInventory && sorted.length === 0;
  // Whichever card actually renders a photo first is a real LCP
  // candidate on this page — see ListingCard's same-named prop.
  const priorityIndices = firstPhotoIndices(sorted, (listing) => listing.photos.length > 0, 3);

  return (
    <>
      {noResults && !alertDismissed && (
        <SearchNoResultsAlert message={t("emptyNoMatch")} onDismiss={() => setAlertDismissed(true)} />
      )}

      <FilterBar
        keyword={query}
        onKeywordChange={handleQueryChange}
        keywordPlaceholder={t("searchPlaceholder")}
        activeCount={activeCount}
        activeLabel={(count) => tFilter("activeFiltersLabel", { count })}
        onApply={handleApply}
        applyLabel={tFilter("applyFilters")}
        onClear={handleClearAll}
        clearLabel={tFilter("clearAll")}
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
          badge={pending.make.length + pending.year.length + pending.bodyType.length || undefined}
        >
          <div className="flex flex-col gap-4">
            {/* Fixed vocab (unlike make/year below, which are derived
                from whatever's actually listed) — body type isn't
                something free text ever reliably contains ("2019 Toyota
                Camry SE" never says "sedan"), so it needs an explicit
                filter the same way it needs an explicit field on the
                listing itself; see car-body-types.ts and the migration
                that added it. */}
            <div>
              <span className="mb-1.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                {t("filterBodyType")}
              </span>
              <FilterCheckboxList
                options={CAR_BODY_TYPE_KEYS.map((key) => ({ value: key, label: CAR_BODY_TYPE_LABELS[key] }))}
                selected={pending.bodyType}
                onToggle={(value) => setPending((p) => ({ ...p, bodyType: toggleIn(p.bodyType, value) }))}
              />
            </div>
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
            minLabel={tFilter("priceMinUsd")}
            maxLabel={tFilter("priceMaxUsd")}
          />
        </FilterCluster>

        {/* Own label, not the shared tFilter("filterFeatures") every
            other grid's ⭐ cluster uses (tags/badges) — this one is
            specifically Transmission + Spec, per Charlie's ask. */}
        <FilterCluster
          label={t("filterTransmissionSpec")}
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
      </FilterBar>

      {noInventory ? (
        <p className="text-ink-soft">{t("emptyNone")}</p>
      ) : (
        !noResults && (
          // 3 columns + 4:3, matching Homes exactly — Charlie's call,
          // reversing the earlier "Cars reads smaller, 4 columns" choice.
          <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((listing, index) => (
              <CarListingCard
                key={listing.id}
                listing={listing}
                photoGradient={PHOTO_GRADIENTS[index % PHOTO_GRADIENTS.length]}
                aspectClassName="aspect-[4/3]"
                isFavorited={favoriteIds ? favoriteIdSet.has(listing.id) : undefined}
                priority={priorityIndices.has(index)}
              />
            ))}
          </div>
        )
      )}
    </>
  );
}
