// src/lib/search-matching.ts
// Natural-language keyword matching shared by every grid that takes a
// free-text search box — originally lived only in search-results-grid.tsx
// (the cross-category /search page), but each category page's own grid
// (ListingsGrid, CarsGrid, ProductsGrid, BusinessesGrid) used a much
// dumber "does the whole typed phrase appear verbatim somewhere" check of
// its own. That gap was invisible as long as the homepage's hero search
// always landed on /search — but once a specific category redirects
// straight to its own page instead (see search/page.tsx), that page's
// own naive matching is what actually runs against the carried-over
// query, and it failed on exactly the phrasing this file was built to
// handle ("3 bedroom house" typed into /listings came back empty, same
// bug Terry originally reported against /search before this existed).
// Centralizing it here instead of copy-pasting it again into every grid.

import { BUSINESS_CATEGORY_LABELS, type Business } from "@/lib/businesses";
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryKey } from "@/lib/product-categories";
import { SERVICE_CATEGORY_LABELS, type ServiceCategoryKey } from "@/lib/service-categories";
import type { Listing } from "@/lib/types";

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
// Words under 2 characters are dropped first (numbers are exempt — see
// below) — found this the hard way testing "2024 Mercedes 400 GLC e"
// against an unrelated Toyota listing: the lone "e" token is a
// substring of almost any text at all ("Camry SE", "Böblingen", ...),
// so a single stray letter from a model name was enough to match
// everything.
//
// Matching is whole-word, not "is this text found anywhere in the
// field" — AND-across-words (above) stopped a propane grill from
// matching "3 bedroom house" via its "Household" category, but plain
// substring matching alone still let "2 door car"/"4 door car"/bare
// "car" all match a photography *service* listing, because its own
// description happens to read "...holiday cards" (contains "car") and
// "Outdoor or in-home..." (contains "door"). Word-boundary matching
// (\b) treats "car" and "cards", or "door" and "outdoor", as the
// different words they actually are. The trade-off this introduces: a
// compound like "townhouse" no longer matches a bare "house" query,
// since "house" isn't its own separate word there — accepted, since
// letting "car" match inside "cards" caused real, repeated false
// positives on one of the four main listing types, a worse failure
// than a townhouse not surfacing for the single word "house" alone
// (multi-word queries like "3 bedroom house" still find it fine, since
// "bedroom" alone already narrows correctly).
function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchesAllWords(fields: (string | null | undefined)[], q: string): boolean {
  const words = q.split(/\s+/).filter((word) => word.length >= 2 || /^\d+$/.test(word));
  if (words.length === 0) return true;
  const haystack = fields.filter(Boolean).join(" \u0000 ").toLowerCase();
  return words.every((word) => new RegExp(`\\b${escapeForRegExp(word)}\\b`).test(haystack));
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

export function matchesListing(listing: Listing, q: string): boolean {
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
    // A bare "car" search has nothing else to go on — unlike products/
    // services below, nothing in a car's own title/make/model
    // necessarily contains the literal word "car" (e.g. "2019 Toyota
    // Camry SE" doesn't), so without this, the only way bare "car" ever
    // matched anything was a coincidental substring hit elsewhere
    // (fixed above) rather than a real one. Tried the equivalent "home"
    // for rentals too, but dropped it — rentals' own titles/descriptions
    // already say "home"/"house"/"apartment" often enough on their own
    // (no equivalent total gap the way cars have), and all it added was
    // new noise: "home" is also a perfectly real word several *service*
    // listings' own descriptions use ("in-home sessions", etc.), so it
    // started pulling those in too.
    listing.type === "car" ? "car" : null,
  ];
  if (listing.productCategory) {
    fields.push(PRODUCT_CATEGORY_LABELS[listing.productCategory as ProductCategoryKey]);
  }
  if (listing.serviceCategory) {
    fields.push(SERVICE_CATEGORY_LABELS[listing.serviceCategory as ServiceCategoryKey]);
  }
  return matchesAllWords(fields, freeTextQuery);
}

export function matchesBusiness(business: Business, q: string): boolean {
  const fields: (string | null | undefined)[] = [business.name, business.city, business.base, business.description];
  fields.push(BUSINESS_CATEGORY_LABELS[business.category]);
  return matchesAllWords(fields, q);
}
