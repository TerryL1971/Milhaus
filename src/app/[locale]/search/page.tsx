// src/app/[locale]/search/page.tsx
// No longer a results page — Terry: a whole separate "Search results"
// page mixing every type together added a page nobody needed once each
// category could show its own matches on its own page with its own
// full filter bar (see /listings, /cars, /services, /events, each of
// which already accepts ?q=/?base= as its own starting filter — the
// earlier redirect-to-the-right-category work this builds on).
// This route never renders anything now, purely a server-side redirect:
//
// NOTE: "product" still redirects to /offers for nav consistency (it's
// the only page left at that position), but /offers doesn't actually
// read ?q=/?base= at all — it's a static grid of Charlie's ad cards now,
// not a searchable listing grid, since real self-listed items have no
// browse page any more (see /offers' own header comment). A real
// "product" search silently lands on /offers with its query ignored —
// a known, not-yet-addressed gap from the Buy & Sell retirement, not
// something this rename fixes.
//
// - A specific category (?category=rental/car/product/service) goes
//   straight to that category's own page, same as before.
// - "All categories" (or an unrecognized category) picks whichever
//   single page actually has the most matches for this query/location
//   and sends the visitor straight there instead of a generic results
//   page mixing types together. "Service" counts both the self-listed
//   "service" ListingType and the Military-Friendly Businesses
//   directory together, since both land on /services (same reasoning
//   as the specific-category redirect for "service" below).
// - Nothing matches anywhere — the one case with no page to send
//   someone to — redirects home instead, where a dismissible red alert
//   says so above the hero search bar (see page.tsx's own
//   `searchFailed` handling), rather than a results page just showing
//   "nothing found."

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getActiveBusinesses } from "@/lib/businesses-queries";
import { getActiveEvents } from "@/lib/events-queries";
import { listingBases } from "@/lib/listing-bases";
import { getActiveListings } from "@/lib/listings";
import { matchesBusiness, matchesEvent, matchesListing } from "@/lib/search-matching";
import type { Listing, ListingType } from "@/lib/types";

type SearchParams = Promise<{ q?: string; category?: string; base?: string }>;

const CATEGORY_REDIRECT_PATHS: Record<ListingType, string> = {
  rental: "/listings",
  car: "/cars",
  product: "/offers",
  service: "/services",
};

function buildQueryString(q?: string, base?: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (base) params.set("base", base);
  return params.toString();
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, category, base } = await searchParams;
  const locale = await getLocale();
  const query = buildQueryString(q, base);

  if (category && category in CATEGORY_REDIRECT_PATHS) {
    const path = CATEGORY_REDIRECT_PATHS[category as ListingType];
    redirect({ href: query ? `${path}?${query}` : path, locale });
  }

  const lowerQ = (q ?? "").trim().toLowerCase();

  const [rentals, cars, products, services, businesses, events] = await Promise.all([
    getActiveListings("rental"),
    getActiveListings("car"),
    getActiveListings("product"),
    getActiveListings("service"),
    getActiveBusinesses(),
    getActiveEvents(),
  ]);

  function countListings(listings: Listing[]): number {
    return listings.filter((listing) => {
      if (base && !listingBases(listing).includes(base)) return false;
      if (lowerQ && !matchesListing(listing, lowerQ)) return false;
      return true;
    }).length;
  }

  const businessCount = businesses.filter((business) => {
    if (base && business.base !== base) return false;
    if (lowerQ && !matchesBusiness(business, lowerQ)) return false;
    return true;
  }).length;

  const eventCount = events.filter((event) => {
    if (base && event.base !== base) return false;
    if (lowerQ && !matchesEvent(event, lowerQ)) return false;
    return true;
  }).length;

  const counts = [
    { path: "/listings", count: countListings(rentals) },
    { path: "/cars", count: countListings(cars) },
    { path: "/products", count: countListings(products) },
    { path: "/services", count: countListings(services) + businessCount },
    { path: "/events", count: eventCount },
  ];

  const best = counts.reduce((max, entry) => (entry.count > max.count ? entry : max), counts[0]);

  if (best.count === 0) {
    const params = new URLSearchParams();
    if (q) params.set("searchFailed", q);
    redirect({ href: params.toString() ? `/?${params.toString()}` : "/", locale });
  }

  redirect({ href: query ? `${best.path}?${query}` : best.path, locale });
}
