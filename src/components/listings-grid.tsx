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

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { BASE_NAMES } from "@/lib/bases";
import type { Listing } from "@/lib/types";

const ALL_BASES = "All bases";
const BASES = [ALL_BASES, ...BASE_NAMES];

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
  "linear-gradient(135deg,#C7B8A0,#7E8A6C)",
  "linear-gradient(135deg,#D9CBAF,#B0A184)",
];

export function ListingsGrid({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // `|| ` on purpose, not `??` — an unselected <select name="base"> in the
  // hero form submits as an empty string, not an absent param, and that
  // must also mean "no filter."
  const activeBase = searchParams.get("base") || ALL_BASES;
  const minBedrooms = Number(searchParams.get("bedrooms")) || 0;

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
        return true;
      }),
    [listings, activeBase, minBedrooms],
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
        <p className="text-ink-soft">
          No open listings{activeBase !== ALL_BASES ? ` near ${activeBase}` : ""}
          {minBedrooms > 0 ? ` with ${minBedrooms}+ bedrooms` : ""} right now.
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
        </div>
      )}
    </>
  );
}
