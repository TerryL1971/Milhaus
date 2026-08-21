// src/components/listings-grid.tsx
// The "Open right now" section — filter chips + listing grid, ported from
// the ".listings-section" rules in
// /design-reference/milhaus-landing-mockup.html. Chip filtering is
// client-side over the (currently mock) listing set.

"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { BASE_NAMES } from "@/lib/bases";
import type { Listing } from "@/lib/types";

const BASES = ["All bases", ...BASE_NAMES];

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
  "linear-gradient(135deg,#C7B8A0,#7E8A6C)",
  "linear-gradient(135deg,#D9CBAF,#B0A184)",
];

export function ListingsGrid({ listings }: { listings: Listing[] }) {
  const [activeBase, setActiveBase] = useState("All bases");

  const filtered = useMemo(
    () =>
      activeBase === "All bases"
        ? listings
        : listings.filter((listing) => listing.base === activeBase),
    [listings, activeBase],
  );

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <h2 className="font-display text-[2rem] font-semibold text-ink">Open right now</h2>
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

      {filtered.length === 0 ? (
        <p className="text-ink-soft">No open listings near {activeBase} right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing, index) => (
            <ListingCard
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
