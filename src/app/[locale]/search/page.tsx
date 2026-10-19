// src/app/[locale]/search/page.tsx
// Cross-category search — where the homepage hero's unified search bar
// lands. The actual fix for "how would someone even know Items for sale
// is where a baby crib would be": one search, every type, instead of
// requiring the visitor to already know which of the four category pages
// to check. A specific category can still narrow results (the hero's
// category dropdown sets ?category=), but "all categories" is the
// default and the whole point.
//
// Businesses and events are fetched alongside listings for that same
// "all categories" default (Terry: the bar was only ever finding Cars/
// Rentals/Items for sale/Services) — but only then. They aren't
// `ListingType`s themselves (no dropdown option narrows to just one of
// them the way "Cars" does), so picking a specific listing category is
// treated as "only that," same as before.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SearchResultsGrid } from "@/components/search-results-grid";
import { getActiveBusinesses } from "@/lib/businesses-queries";
import { getActiveEvents } from "@/lib/events-queries";
import { getActiveListings } from "@/lib/listings";
import { listingBases } from "@/lib/listing-bases";
import type { Listing, ListingType } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SearchPage");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

type SearchParams = Promise<{ q?: string; category?: string; base?: string }>;

const ALL_TYPES: ListingType[] = ["rental", "car", "product", "service"];

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, category, base } = await searchParams;
  const t = await getTranslations("SearchPage");

  const isSpecificListingType = Boolean(category) && (ALL_TYPES as string[]).includes(category!);
  const types: ListingType[] = isSpecificListingType ? [category as ListingType] : ALL_TYPES;

  const [results, businesses, events] = await Promise.all([
    Promise.all(types.map((type) => getActiveListings(type))),
    isSpecificListingType ? Promise.resolve([]) : getActiveBusinesses(),
    isSpecificListingType ? Promise.resolve([]) : getActiveEvents(),
  ]);
  let listings: Listing[] = results.flat();
  if (base) listings = listings.filter((listing) => listingBases(listing).includes(base));
  listings.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[1600px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-8 text-ink-soft">{t("subhead")}</p>
        <Suspense fallback={null}>
          <SearchResultsGrid listings={listings} businesses={businesses} events={events} initialQuery={q} />
        </Suspense>
      </div>
    </main>
  );
}
