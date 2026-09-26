// src/components/cars-grid.tsx
// The /cars browse grid — base + make filter chips (URL-driven, same
// pattern as ListingsGrid's base/amenity chips on the rental page) plus
// the existing free-text search box, all combined with AND logic. Make
// options are derived from whatever's actually listed rather than a fixed
// list — unlike bases, "every car make that could ever be sold here"
// isn't a fixed, known set.

"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CarListingCard } from "@/components/car-listing-card";
import { BASE_NAMES } from "@/lib/bases";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#B9C4D0,#5C6B7A)",
  "linear-gradient(135deg,#C7B8A0,#3E4A57)",
  "linear-gradient(135deg,#A9B4A0,#2C4053)",
  "linear-gradient(135deg,#D3C6A6,#4B5A6B)",
];

const chipClass = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 font-mono text-[0.74rem] tracking-wide transition-colors ${
    active
      ? "border-olive bg-olive text-paper"
      : "border-canvas-deep bg-paper text-ink-soft hover:border-olive/50"
  }`;

export function CarsGrid({ listings, initialQuery = "" }: { listings: Listing[]; initialQuery?: string }) {
  const t = useTranslations("CarsPage");
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ALL_BASES = t("allBases");
  const ALL_MAKES = t("allMakes");
  const activeBase = searchParams.get("base") || ALL_BASES;
  const activeMake = searchParams.get("make") || ALL_MAKES;
  const makes = useMemo(
    () => Array.from(new Set(listings.map((l) => l.make).filter((m): m is string => !!m))).sort(),
    [listings],
  );

  function setParam(key: string, value: string, allValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === allValue) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (activeBase !== ALL_BASES && listing.base !== activeBase) return false;
      if (activeMake !== ALL_MAKES && listing.make !== activeMake) return false;
      if (!q) return true;
      return [listing.title, listing.make, listing.model, listing.city]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [listings, query, activeBase, activeMake, ALL_BASES, ALL_MAKES]);

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {[ALL_BASES, ...BASE_NAMES].map((base) => (
          <button
            key={base}
            type="button"
            onClick={() => setParam("base", base, ALL_BASES)}
            className={chipClass(activeBase === base)}
          >
            {base}
          </button>
        ))}
      </div>

      {makes.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {[ALL_MAKES, ...makes].map((make) => (
            <button
              key={make}
              type="button"
              onClick={() => setParam("make", make, ALL_MAKES)}
              className={chipClass(activeMake === make)}
            >
              {make}
            </button>
          ))}
        </div>
      )}

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
