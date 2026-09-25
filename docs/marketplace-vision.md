# docs/marketplace-vision.md
# "Beat bookoo" — plan for Services + Products + a seller-approval gate
#
# Written 2026-09-26 per Charlie's request (relayed by Terry) to scope this
# before writing code — it's a bigger change than anything shipped so far:
# it touches the data model, the review pipeline, and the posting flow for
# EVERY category, including today's already-live housing and car listings.
# Not started. This is the plan to react to, not a build log.

## What Charlie asked for

> "Something more organized, more search options for house rentals, cars,
> services, and products. He also wants to have people that want to list
> something for sale to have them explain how they will serve the
> Americans before being allowed to post their house, car, services, and
> items for sale."

Two distinct asks bundled together:

1. **Two more listing categories** — Services (e.g. a mechanic, a moving
   company, tutoring) and Products (general classifieds items — furniture,
   electronics, whatever isn't a house or a car), plus real faceted search
   across all four categories.
2. **A seller-approval gate** — before anyone can post *anything* (a house,
   a car, a service, or an item), they write a short explanation of how
   they'll serve the American community here, and an admin approves that
   *once, per person* — separate from, and before, the existing per-listing
   review.

## Why this is bigger than the car-ads addition

Car ads reused the existing `listings` table by widening `type` and adding
a few nullable columns — clean because a car and a rental are similar
enough shapes (a physical thing, a price, a location, a review pipeline).

This request changes the *gate* in front of the whole site, not just the
listing table:

- Today: sign in → post → pending_review → admin approves the **listing**.
- Asked for: sign in → submit a **seller application** → admin approves
  the **person** → *then* they can post anything, which still goes through
  the existing per-listing review.

That's a new state that lives on `profiles`, not `listings`, and it needs
its own admin queue (distinct from "Needs review" on the current
dashboard, since approving a person and approving a listing are different
decisions Charlie makes at different times).

## Proposed shape

### 1. Seller application (profiles-level gate)

- `profiles.seller_status`: `unverified | pending | approved | rejected`
  (default `unverified` for everyone who signs up).
- A one-time form (shown the first time a signed-in user tries to reach
  any "Post a ___" page) asking how they'll serve the American community
  here — free text, maybe a couple of prompts ("What are you listing?
  How does it help someone relocating?").
- `/post`, `/post-car`, and the future `/post-service` / `/post-item` all
  check `seller_status === 'approved'` before rendering the form; anything
  else redirects to the application (or a "pending review" holding page).
- New admin section: **"Seller applications"** — a queue separate from
  "Needs review," approve/reject with the same one-click pattern already
  used for listings. Rejecting doesn't delete the account, just leaves
  them unable to post (they can still browse/contact sellers).
- Existing accounts (anyone who's already posted a rental or a car) get
  grandfathered to `approved` in the migration — don't make Charlie
  re-approve people who already passed the old bar.

### 2. Services and Products as two more `listings.type` values

Same pattern as `car`: widen the `type` check constraint, add
category-specific nullable columns, reuse `status`/`source`/review flow.

- **Services**: no physical item — drop the address/bedrooms-shaped fields
  entirely, keep title/description/photos/price (may be "starting at" or
  "contact for quote" — needs a `price_is_estimate` boolean or a
  `pricing_note` text field instead of forcing a hard number).
  Category-specific: a `service_category` (e.g. moving, auto repair,
  tutoring, cleaning — fixed list, same reasoning as `AMENITY_KEYS`: exact
  filtering beats fuzzy free text).
- **Products**: closest to bookoo's general classifieds. Title/description/
  photos/price/condition (`new | like_new | good | fair`), a
  `product_category` fixed list (electronics, furniture, household,
  other).
- Both reuse `city`/`base`/`distance_to_base` (pickup location still
  matters), `source` stays `self_listed` only (no housing-office
  equivalent, same as cars), same admin review pipeline, no new queue.

### 3. Faceted search across all four categories

Today's "search" is either URL-driven filter chips (rentals) or a plain
client-side text filter (cars) — neither generalizes to 4 categories with
different facets each (bedrooms don't apply to a couch; make/model doesn't
apply to a house).

Proposed: a single `/browse` (or keep per-category pages, TBD with
Charlie) with:
- A category selector (Rentals / Cars / Services / Products) up top.
- Facets that swap based on the selected category — reuse the existing
  `use-listing-filters.ts` URL-state pattern, extended to be
  category-aware instead of rental-only.
- A cross-category free-text search (title/description/make/model/
  service_category/product_category) for the "I don't know which category
  this is in" case bookoo's search box covers.

This is the part most worth prototyping early and showing Charlie, since
"more organized, more search options" was his own framing of the goal —
it's the most visible/valuable piece, and the one most worth getting
feedback on before building out both new categories in full.

## Suggested sequencing (not a commitment, a starting point to react to)

1. Seller-application gate first, applied to the *existing* two
   categories (rental, car) — smallest slice that's still genuinely
   useful, and de-risks the trickiest part (an approval flow that gates
   people, not listings) before multiplying it across 4 categories.
2. Products category (closest to bookoo's actual model, broadest appeal).
3. Search/filter rework, generalized across rental/car/product.
4. Services category (needs the pricing-note wrinkle worked out — the one
   place a plain number doesn't fit).

## Open questions for Charlie (via Terry) before coding starts

- Should a rejected seller-application be able to reapply, or is it final?
- Does the application form need Charlie's own custom questions, or is
  free text enough for now?
- One `/browse` with a category switcher, or keep separate pages
  (`/cars`, `/products`, `/services`) like today's `/cars` — bigger nav
  either way; worth seeing which he prefers before building the search UI.
- Products' `condition` field and Services' category list — draft lists
  above, need his sign-off (he knows the community's actual needs better
  than a guess here).
