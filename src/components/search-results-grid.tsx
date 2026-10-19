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

"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { BusinessCard } from "@/components/business-card";
import { CarListingCard } from "@/components/car-listing-card";
import { EventCard } from "@/components/event-card";
import { ListingCard } from "@/components/listing-card";
import { ProductListingCard } from "@/components/product-listing-card";
import { ServiceListingCard } from "@/components/service-listing-card";
import { BUSINESS_CATEGORY_LABELS, type Business } from "@/lib/businesses";
import type { Event } from "@/lib/events";
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryKey } from "@/lib/product-categories";
import { SERVICE_CATEGORY_LABELS, type ServiceCategoryKey } from "@/lib/service-categories";
import type { Listing } from "@/lib/types";

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
  "linear-gradient(135deg,#D3C6A6,#9AA37E)",
];

// Word-by-word OR matching, not "does the whole typed phrase appear
// verbatim somewhere" — Terry's report: "Baby items", "2024 Mercedes 400
// GLC e", and "3 bedroom house" all found nothing for listings that
// should've matched. Requiring the entire query as one literal substring
// is brittle the moment someone's phrasing doesn't line up with the
// stored text — "Baby items" was never going to appear verbatim
// anywhere, only the category label "Baby & kids" does; "3 bedroom
// house" doesn't match a hyphenated "3-bedroom house" title. Splitting
// the query into words and matching if *any* one of them turns up
// anywhere across the combined fields is strictly more forgiving than
// the old whole-phrase check (every phrase that used to match still
// does — each of its words is trivially a substring of it too) while
// actually finding things a real visitor's loose, casual phrasing was
// always going to produce. False positives are the acceptable failure
// mode here, not false "nothing found"s, for a small community
// marketplace rather than a large noisy catalog. Words under 2
// characters are dropped first, though — found this the hard way
// testing "2024 Mercedes 400 GLC e" against an unrelated Toyota
// listing: the lone "e" token is a substring of almost any text at all
// ("Camry SE", "Böblingen", ...), so a single stray letter from a model
// name was enough to match everything. Numbers like "2024" or "400"
// are long enough to stay meaningful and aren't affected.
function matchesAnyWord(fields: (string | null | undefined)[], q: string): boolean {
  const words = q.split(/\s+/).filter((word) => word.length >= 2);
  if (words.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" \u0000 ").toLowerCase();
  return words.some((word) => haystack.includes(word));
}

// Matches "3 bed", "3 bedroom", "3 bedrooms" (and the bathroom
// equivalents) against the actual bedrooms/bathrooms *count* — word
// matching alone would need the literal word "bed" to appear somewhere,
// which nothing in a listing's own text necessarily contains even when
// it genuinely has 3 bedrooms. A query carries at most one of each —
// nobody searches "3 bed 4 bed" — so a single capture per pattern is
// enough.
const BEDROOM_QUERY = /(\d+)\s*bed(?:room)?s?\b/;
const BATHROOM_QUERY = /(\d+)\s*bath(?:room)?s?\b/;

function matches(listing: Listing, q: string): boolean {
  const fields: (string | null | undefined)[] = [
    listing.title,
    listing.description,
    listing.city,
    listing.address,
    listing.make,
    listing.model,
    listing.year != null ? String(listing.year) : null,
  ];
  if (listing.productCategory) {
    fields.push(PRODUCT_CATEGORY_LABELS[listing.productCategory as ProductCategoryKey]);
  }
  if (listing.serviceCategory) {
    fields.push(SERVICE_CATEGORY_LABELS[listing.serviceCategory as ServiceCategoryKey]);
  }
  if (matchesAnyWord(fields, q)) return true;

  const bedroomQuery = q.match(BEDROOM_QUERY);
  if (bedroomQuery && listing.bedrooms === Number(bedroomQuery[1])) return true;

  const bathroomQuery = q.match(BATHROOM_QUERY);
  if (bathroomQuery && listing.bathrooms === Number(bathroomQuery[1])) return true;

  return false;
}

function matchesBusiness(business: Business, q: string): boolean {
  const fields: (string | null | undefined)[] = [business.name, business.city, business.base, business.description];
  fields.push(BUSINESS_CATEGORY_LABELS[business.category]);
  return matchesAnyWord(fields, q);
}

function matchesEvent(event: Event, q: string): boolean {
  return matchesAnyWord([event.title, event.organizerName, event.city, event.base, event.description], q);
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
    return listings.filter((listing) => matches(listing, q));
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
