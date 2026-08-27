// src/components/listings-grid.tsx
// The "Open right now" section — filter chips + listing grid, ported from
// the ".listings-section" rules in
// /design-reference/milhaus-landing-mockup.html.
//
// Filter state lives in the URL (?base=...&bedrooms=...), not just local
// component state, so the hero search form (a plain HTML GET form, no JS)
// and these chips (client-side clicks) both drive the same filter instead
// of being two disconnected UIs that silently don't affect each other.

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { Link } from "@/i18n/navigation";
import { AMENITY_KEYS, type AmenityKey } from "@/lib/amenities";
import { BASE_NAMES } from "@/lib/bases";
import type { Listing } from "@/lib/types";

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
  const tAmenities = useTranslations("Amenities");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sentinel for "no base filter" — locale-aware, but that's harmless: it
  // never leaks into the URL (selecting it does params.delete, not set),
  // it only ever gets compared against itself within this component.
  const ALL_BASES = t("allBases");
  const BASES = [ALL_BASES, ...BASE_NAMES];

  // `|| ` on purpose, not `??` — an unselected <select name="base"> in the
  // hero form submits as an empty string, not an absent param, and that
  // must also mean "no filter."
  const activeBase = searchParams.get("base") || ALL_BASES;
  const minBedrooms = Number(searchParams.get("bedrooms")) || 0;
  // moveIn stays a plain "YYYY-MM-DD" string on purpose — that's exactly
  // what <input type="date"> submits and what availableFrom is stored as,
  // so comparing the two lexically avoids any Date/timezone parsing at all.
  const moveIn = searchParams.get("movein") || "";
  const activeAmenities = useMemo(
    () =>
      (searchParams.get("amenities") ?? "")
        .split(",")
        .filter((key): key is AmenityKey => AMENITY_KEYS.includes(key as AmenityKey)),
    [searchParams],
  );

  function toggleAmenity(key: AmenityKey) {
    const next = activeAmenities.includes(key)
      ? activeAmenities.filter((k) => k !== key)
      : [...activeAmenities, key];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length === 0) {
      params.delete("amenities");
    } else {
      params.set("amenities", next.join(","));
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}#listings`, { scroll: false });
  }

  function setActiveBase(base: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (base === ALL_BASES) {
      params.delete("base");
    } else {
      params.set("base", base);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}#listings`, { scroll: false });
  }

  const filtered = useMemo(
    () =>
      listings.filter((listing) => {
        if (activeBase !== ALL_BASES && listing.base !== activeBase) return false;
        if (minBedrooms > 0 && listing.bedrooms < minBedrooms) return false;
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
    [listings, activeBase, minBedrooms, moveIn, activeAmenities, ALL_BASES],
  );

  const hasActiveFilters =
    activeBase !== ALL_BASES || minBedrooms > 0 || !!moveIn || activeAmenities.length > 0;
  // Only pad the *unfiltered* view — see PlaceholderCard's comment for why.
  const placeholderCount = hasActiveFilters ? 0 : Math.max(0, 3 - filtered.length);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <h2 className="font-display text-[2rem] font-semibold text-ink">{t("heading")}</h2>
        <div className="flex flex-wrap gap-2">
          {BASES.map((base) => (
            <button
              key={base}
              type="button"
              onClick={() => setActiveBase(base)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.74rem] tracking-wide transition-colors ${
                activeBase === base
                  ? "border-olive bg-olive text-paper"
                  : "border-canvas-deep bg-paper text-ink-soft hover:border-olive/50"
              }`}
            >
              {base}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-7 flex flex-wrap gap-2">
        {AMENITY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleAmenity(key)}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.74rem] tracking-wide transition-colors ${
              activeAmenities.includes(key)
                ? "border-brass bg-brass/15 text-brass-deep"
                : "border-canvas-deep bg-paper text-ink-soft hover:border-brass/50"
            }`}
          >
            {tAmenities(key)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && hasActiveFilters ? (
        <p className="text-ink-soft">
          {t("emptyPrefix")}
          {activeBase !== ALL_BASES ? ` ${t("emptyNear", { base: activeBase })}` : ""}
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
