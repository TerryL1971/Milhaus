// src/app/[locale]/search/page.tsx
// Cross-category search — where the homepage hero's unified search bar
// lands when "All categories" is picked (or left alone): one search,
// every listing type plus businesses and events, instead of requiring
// the visitor to already know which category page to check first (the
// actual fix for "how would someone even know Items for sale is where a
// baby crib would be").
//
// Picking a *specific* category, though, redirects straight to that
// category's own dedicated page (CATEGORY_REDIRECT_PATHS below) instead
// of staying on this generic page narrowed to one type. Terry/Charlie:
// landing on a page titled "Search results" after choosing "Rentals"
// read like a dead end with none of /listings' own richer filter bar
// (bedrooms, amenities, price, move-in date) available — whereas
// /listings, /cars, /products and /services already have everything
// this page's results would show plus that filter bar, and each already
// accepts ?q=/?base= as the search's starting point (see each grid's
// own initialQuery/initialBase prop), so there's no real loss
// redirecting there instead. "Services" was the first of these fixed
// (Charlie caught it first — "Services" in the dropdown is the self-
// listed "service" ListingType, but what he expects there is the
// Military-Friendly Businesses directory, a different table entirely);
// the other three are the same fix, generalized once that pattern was
// proven out.
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link, redirect } from "@/i18n/navigation";
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

// Where each specific category redirects to — "service" goes to the
// Businesses directory, not a dedicated page for the "service"
// ListingType itself (dog walking, photography, moving help), which has
// no browse page of its own; see the file-top comment for why that's
// the right redirect anyway. Since these cover every ListingType, every
// request that reaches past this redirect has no specific category
// (or an unrecognized one) — "all categories" the only case left to
// render below, optionally narrowed by ?base=.
const CATEGORY_REDIRECT_PATHS: Record<ListingType, string> = {
  rental: "/listings",
  car: "/cars",
  product: "/products",
  service: "/services",
};

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, category, base } = await searchParams;
  const t = await getTranslations("SearchPage");

  if (category && category in CATEGORY_REDIRECT_PATHS) {
    const locale = await getLocale();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (base) params.set("base", base);
    const query = params.toString();
    const path = CATEGORY_REDIRECT_PATHS[category as ListingType];
    redirect({ href: query ? `${path}?${query}` : path, locale });
  }

  const [results, businesses, events] = await Promise.all([
    Promise.all(ALL_TYPES.map((type) => getActiveListings(type))),
    getActiveBusinesses(),
    getActiveEvents(),
  ]);
  let listings: Listing[] = results.flat();
  if (base) listings = listings.filter((listing) => listingBases(listing).includes(base));
  listings.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // "Showing Stuttgart only" — base names (Stuttgart, Kaiserslautern,
  // ...) are the same spelling in both languages, so the raw value
  // drops straight into the template with no label lookup needed, same
  // as everywhere else this app shows a base name.
  const isFiltered = Boolean(base);
  const subhead = base ? t("subheadLocation", { location: base }) : t("subhead");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[1600px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className={isFiltered ? "mb-1 text-ink-soft" : "mb-8 text-ink-soft"}>{subhead}</p>
        {isFiltered && (
          <Link href="/search" className="mb-8 inline-block text-sm text-olive-deep hover:underline">
            {t("clearFilters")}
          </Link>
        )}
        <Suspense fallback={null}>
          <SearchResultsGrid listings={listings} businesses={businesses} events={events} initialQuery={q} />
        </Suspense>
      </div>
    </main>
  );
}
