// src/components/cars-grid.tsx
// The /cars browse grid. Deliberately simpler than ListingsGrid (the
// rental browse page) — no filter chips, no URL-driven filter state, just
// a free-text search box (make/model/title) client-side. Matches the
// scope Charlie actually asked for ("post car ads like bookoo.com") —
// bookoo's own browse is a search box and a grid, nothing more.

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { CarListingCard } from "@/components/car-listing-card";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#B9C4D0,#5C6B7A)",
  "linear-gradient(135deg,#C7B8A0,#3E4A57)",
  "linear-gradient(135deg,#A9B4A0,#2C4053)",
  "linear-gradient(135deg,#D3C6A6,#4B5A6B)",
];

export function CarsGrid({ listings }: { listings: Listing[] }) {
  const t = useTranslations("CarsPage");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((listing) =>
      [listing.title, listing.make, listing.model, listing.city]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [listings, query]);

  return (
    <>
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
