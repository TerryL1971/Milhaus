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

// Word-by-word AND matching, not "does the whole typed phrase appear
// verbatim somewhere" — Terry's report: "3 bedroom house" and "Baby
// crib" found nothing for listings that should've matched, since
// requiring the entire query as one literal substring is brittle the
// moment someone's phrasing doesn't line up with the stored text
// exactly ("3 bedroom house" doesn't match a hyphenated "3-bedroom
// house" title).
//
// A first pass tried OR (match if *any* query word turns up anywhere)
// instead — more forgiving, but turned out *too* forgiving: searching
// "3 bedroom house" started surfacing a propane grill (category
// "Household", which literally contains the substring "house") and a
// house-cleaning service (title has the word "House"), neither of which
// anyone searching for a 3-bedroom house to rent wants to see. AND — a
// listing has to match *every* word in the query somewhere across its
// fields, same as how most real search boxes treat a multi-word
// query — fixes that: the grill and the cleaning service don't have
// "bedroom" anywhere, so they're correctly excluded, while the actual
// 3-bedroom listing still has both "bedroom" (within "3-bedroom") and
// "house" in its own title. The one trade-off: an overly generic filler
// word in the query (e.g. "items" in "Baby items", which isn't
// literally stored anywhere even for a real baby-category listing) can
// make an otherwise-good match miss — accepted as the better failure
// mode than the noise AND replaces.
//
// Words under 2 characters are dropped first — found this the hard way
// testing "2024 Mercedes 400 GLC e" against an unrelated Toyota
// listing: the lone "e" token is a substring of almost any text at all
// ("Camry SE", "Böblingen", ...), so a single stray letter from a model
// name was enough to match everything. Numbers like "2024" or "400"
// are long enough to stay meaningful and aren't affected.
function matchesAllWords(fields: (string | null | undefined)[], q: string): boolean {
  const words = q.split(/\s+/).filter((word) => word.length >= 2);
  if (words.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" \u0000 ").toLowerCase();
  return words.every((word) => haystack.includes(word));
}

// "3 bed", "3 bedroom(s)" (and the bathroom equivalents) are pulled out
// of the query and treated as an exact bedrooms/bathrooms *count* filter
// on their own, not left in the pool of free-text words — first tried as
// just another OR'd/AND'd word, but that's genuinely ambiguous: a real
// product search turned up "Graco convertible crib + mattress" for
// "3 Bed" purely because its own description happens to say "Converts
// to toddler bed" — a real word match, but not what anyone typing a
// number-of-bedrooms query is looking for. Pulling "3 bed" out as its
// own required condition (listing.bedrooms === 3, car/product/service
// listings excluded outright since bedrooms is null for them) and
// matching whatever's left of the query as free text gets both parts
// right. A query carries at most one of each — nobody searches "3 bed
// 4 bed" — so a single capture per pattern is enough.
const BEDROOM_QUERY = /(\d+)\s*bed(?:room)?s?\b/;
const BATHROOM_QUERY = /(\d+)\s*bath(?:room)?s?\b/;

function matches(listing: Listing, q: string): boolean {
  let freeTextQuery = q;

  const bedroomQuery = q.match(BEDROOM_QUERY);
  if (bedroomQuery) {
    if (listing.bedrooms !== Number(bedroomQuery[1])) return false;
    freeTextQuery = freeTextQuery.replace(bedroomQuery[0], " ");
  }

  const bathroomQuery = q.match(BATHROOM_QUERY);
  if (bathroomQuery) {
    if (listing.bathrooms !== Number(bathroomQuery[1])) return false;
    freeTextQuery = freeTextQuery.replace(bathroomQuery[0], " ");
  }

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
  return matchesAllWords(fields, freeTextQuery);
}

function matchesBusiness(business: Business, q: string): boolean {
  const fields: (string | null | undefined)[] = [business.name, business.city, business.base, business.description];
  fields.push(BUSINESS_CATEGORY_LABELS[business.category]);
  return matchesAllWords(fields, q);
}

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
