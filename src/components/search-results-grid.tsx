// src/components/search-results-grid.tsx
// The /search results grid — mixes all four listing types in one set of
// results (the actual fix for "how would someone even know to go look in
// Items for sale for a baby crib": one search box, not four separate
// ones). Renders whichever card type fits each listing, same switch
// pattern already used by SellerCard and /sellers/[id].
//
// Businesses and events are a separate concern from that switch, not
// folded into it — they aren't `Listing`s (different shape entirely, no
// `type` discriminant to switch on) and conceptually aren't "ads" the
// way the four listing types are; they get their own small sections
// below the main grid instead, only shown when there's a keyword match
// and only ever populated for an unfiltered ("all categories") search
// (see search/page.tsx).
//
// The natural-language keyword matching itself (word-boundary AND
// matching, bedroom/bathroom count extraction, etc.) lives in
// lib/search-matching.ts, not here — see that file's own header for the
// reasoning behind it. It's shared with ListingsGrid/CarsGrid/
// ProductsGrid/BusinessesGrid now too, not just this page.

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { BusinessCard } from "@/components/business-card";
import { CarListingCard } from "@/components/car-listing-card";
import { EventCard } from "@/components/event-card";
import { ListingCard } from "@/components/listing-card";
import { ProductListingCard } from "@/components/product-listing-card";
import { ServiceListingCard } from "@/components/service-listing-card";
import type { Business } from "@/lib/businesses";
import type { Event } from "@/lib/events";
import { matchesAllWords, matchesBusiness, matchesListing } from "@/lib/search-matching";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
];

function matchesEvent(event: Event, q: string): boolean {
  return matchesAllWords([event.title, event.organizerName, event.city, event.base, event.description], q);
}

export function SearchResultsGrid({
  listings,
  businesses = [],
  events = [],
  initialQuery = "",
}: {
  listings: Listing[];
  businesses?: Business[];
  events?: Event[];
  initialQuery?: string;
}) {
  const t = useTranslations("SearchPage");
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((listing) => matchesListing(listing, q));
  }, [listings, query]);

  const filteredBusinesses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter((business) => matchesBusiness(business, q));
  }, [businesses, query]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => matchesEvent(event, q));
  }, [events, query]);

  const hasAnyResults = filtered.length > 0 || filteredBusinesses.length > 0 || filteredEvents.length > 0;

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

      {!hasAnyResults ? (
        <p className="text-ink-soft">{listings.length === 0 ? t("emptyNone") : t("emptyNoMatch")}</p>
      ) : (
        <>
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((listing, index) => {
                const photoGradient = PHOTO_GRADIENTS[index % PHOTO_GRADIENTS.length];
                switch (listing.type) {
                  case "car":
                    return <CarListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
                  case "product":
                    return <ProductListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
                  case "service":
                    return <ServiceListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
                  default:
                    return <ListingCard key={listing.id} listing={listing} photoGradient={photoGradient} />;
                }
              })}
            </div>
          )}

          {filteredBusinesses.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">{t("businessesHeading")}</h2>
              <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBusinesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            </div>
          )}

          {filteredEvents.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">{t("eventsHeading")}</h2>
              <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
