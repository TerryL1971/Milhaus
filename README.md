<!-- README.md -->
# Milhaus

**[www.milhaus.de](https://www.milhaus.de)**

A marketplace for Americans living in Germany — military families, civilians
and expats. One site for everything a move needs:

- **Homes** — for rent and for sale, listed by landlords and by families
  moving out (PCS).
- **Cars** — often US-spec cars sold before a move.
- **Services** — a directory of military-friendly local businesses.
- **Special Offers** — paid promotion cards from local businesses.
- **Events** — a calendar curated by the site owner.

Milhaus is independent: it is **not** run by, affiliated with or endorsed by
any installation's Housing Office or the U.S. Department of Defense. Nothing
on the site may suggest otherwise (no "housing office" stamps, badges or
wording) — see [CLAUDE.md](./CLAUDE.md).

The owner, Charlie, is non-technical and runs the site himself from `/admin`,
so admin tools are built to be used without a developer.

## Screens

| | |
|---|---|
| **Homepage** — search, featured homes / cars / businesses, Special Offers | **Homes** — For rent \| For sale, filters, starred highlights on each card |
| [![Homepage](./docs/screenshots/01-home.png)](./docs/screenshots/01-home.png) | [![Homes page](./docs/screenshots/02-homes.png)](./docs/screenshots/02-homes.png) |
| **Listing detail** — gallery, details, what's nearby, seller card | **Cars** — filters and the sidebar ad slot |
| [![Listing detail](./docs/screenshots/03-listing-detail.png)](./docs/screenshots/03-listing-detail.png) | [![Cars page](./docs/screenshots/04-cars.png)](./docs/screenshots/04-cars.png) |
| **Advertise** — self-serve ad spots (prices set in Admin → Pricing) | **Admin** — Charlie's dashboard |
| [![Advertise page](./docs/screenshots/05-advertise.png)](./docs/screenshots/05-advertise.png) | [![Admin dashboard](./docs/screenshots/06-admin.png)](./docs/screenshots/06-admin.png) |

_Everything in these screenshots is demo content (see [Demo data](#demo-data))._

## How the site makes money

All prices are set by Charlie in **Admin → Pricing** and are €0 until he sets them.

- **Posting fees** per category (home for rent, home for sale, car, service,
  business). Anyone who ticks "I'm an individual" on their profile posts for
  free. A site-wide "free until" date can make everything free for a launch
  promo.
- **30-day listings** — every listing comes down after 30 days; renewing
  costs the posting fee again (Charlie can grant a free 30 days from Admin).
- **Ad spots** — the site banner, the /cars sidebar and Special Offers cards,
  sold for 30 days up to several years. Businesses buy them on `/advertise`
  (cart + Stripe Checkout), or Charlie emails an itemized Stripe invoice from
  **Admin → Ad orders**.

Payment is the gate: a paid (or free) listing goes live immediately, without a
review step. Charlie takes down anything abusive afterwards. **Businesses are
the exception** — a business listing never goes live until the business itself
confirms consent (email link, or Charlie records paper/verbal consent), because
listing a business without its owner's permission is illegal in Germany.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack), React 19 |
| Backend | Supabase — Postgres with Row Level Security, Auth (email code / magic link), Storage |
| Payments | Stripe — Checkout for the cart, Invoices for ad billing, Stripe's own receipts |
| Email | Resend (transactional: consent, expiry warnings, ad emails) + Supabase Auth SMTP |
| Styling | Tailwind CSS v4, theme from the design tokens in CLAUDE.md |
| i18n | next-intl — English (default, unprefixed) and German (`/de`) |
| Hosting | Vercel, with a daily Vercel Cron job |
| Monitoring | Sentry (`@sentry/nextjs`) + Vercel Analytics (only after cookie consent) |

## Local setup

Needs Node.js 20.9+ and npm, and a Supabase project.

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev                     # http://localhost:3000
```

### Environment variables

Documented inline in [.env.example](./.env.example). Never commit `.env.local`.

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything (Supabase → Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Payments, photo uploads, cron, seed scripts. Bypasses RLS |
| `NEXT_PUBLIC_SITE_URL` | Links in emails, sitemap, canonical URLs — `https://www.milhaus.de` in production |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Cart checkout and ad invoices (`sk_test_…` in test mode) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email. `EMAIL_FROM` must be on a domain verified in Resend |
| `CRON_SECRET` | Authenticates Vercel Cron's call to `/api/cron/expire-listings` |
| `NEXT_PUBLIC_SENTRY_DSN` | Error reporting (optional) |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Source-map upload at build time (optional) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console (optional) |

Anything optional that's unset degrades gracefully: emails are skipped with a
log line, payments error only on the checkout routes.

### Supabase setup

Full walkthrough in [supabase/SETUP.md](./supabase/SETUP.md). In short:

1. **Schema** — run every file in [supabase/migrations/](./supabase/migrations/)
   **in filename order** (SQL Editor, or `supabase link` + `supabase db push`).
   Migrations are written to be safe to re-run. They create the tables, RLS
   policies, triggers and the three storage buckets: `listing-photos`,
   `profile-photos` (both public) and `consent-documents` (private).
2. **Auth email** — set up custom SMTP (Authentication → Emails) on a verified
   domain; the built-in mailer is capped at a couple of emails an hour.
   [scripts/configure-supabase-auth.sh](./scripts/configure-supabase-auth.sh)
   and [supabase/templates/](./supabase/templates/) hold the templates.
3. **URL config** — Site URL = `https://www.milhaus.de`; add
   `http://localhost:3000/**` and `https://www.milhaus.de/**` to Redirect URLs.
4. **First admin** — sign in once through the app, then:
   ```sql
   update public.profiles set role = 'owner' where contact_email = 'you@example.com';
   ```
   `owner` and `admin` have identical powers (`isAdminRole` in
   [src/lib/roles.ts](./src/lib/roles.ts)).

### Signing in during development

```
http://localhost:3000/auth/dev-signin?email=you@example.com
```

Signs you in with no email round-trip. It returns 404 unless `NODE_ENV` is `development` and the request
is on localhost, so it's inert in production.

### Demo data

The live database currently contains demo content so the site doesn't look
empty. It must be removed or replaced before launch.

| Script | Creates |
|---|---|
| `node scripts/seed-demo-listings.mjs` | Demo landlord + family accounts with rentals and cars |
| `node scripts/seed-demo-homes-for-sale.mjs` | Four demo sellers, each with a home for sale (`--remove` deletes them) |
| [scripts/demo-ads/](./scripts/demo-ads/) | HTML sources of the demo Special Offers ad graphics |

Demo accounts and businesses are marked "(demo)". Demo photos are CC0; every
source is recorded in [scripts/demo-photos/SOURCES.md](./scripts/demo-photos/SOURCES.md).
Photos on listings created by hand through the site are **not** covered by
that file.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server (Turbopack) on :3000 |
| `npm run build` / `npm run start` | Production build / serve it |
| `npm run lint` | ESLint |
| `bash scripts/deploy-vercel.sh` | Link, push env vars and deploy to Vercel (`VERCEL_TOKEN=…`) |

There is no test suite; changes are checked with `npx tsc --noEmit`, lint, and
by driving the real pages in a browser.

## Project layout

```
src/
  app/
    [locale]/                  Public site, English at / and German at /de
      page.tsx                   Homepage
      listings/  listings/[id]   Homes (?for=sale = homes for sale) and detail
      cars/  services/  offers/  events/  businesses/[id]  products/[id]
      post-ad/                   "What are you posting?" chooser
      post/  post-car/  post-service/  post-product/  post-business/
      edit-listing/[id]          Owner or admin edit
      my-listings/  my-ads/      A user's own listings and bought ad spots
      advertise/                 Self-serve ad spots → cart
      sellers/[id]  search/  sign-in/  for-landlords/  how-verification-works/
      impressum/  privacy/  terms/
    admin/                     Charlie's dashboard (English only, outside [locale])
      page.tsx                   Live / expired / archived listings, + add listing
      pricing/                   Posting prices, launch promo, ad price list
      ads/  ads/orders/          Ad slots + artwork; ad orders and invoices
      businesses/  events/  users/  reports/  listings/new/
    cart/  cart/success/       One Stripe Checkout for everything in the cart
    consent/[token]/           A business confirming it consents to its listing
    api/cron/expire-listings/  Daily job (see vercel.json)
    auth/                      confirm, dev-signin, sign-out
    sitemap.ts, robots.ts, icons
  components/                  Cards, grids, filters, forms (ListingForm does all four kinds)
  lib/                         Typed queries (*-queries.ts), pricing, email, Stripe,
                               fixed vocabularies (bases, amenities, nearby-amenities)
  i18n/                        next-intl routing
  proxy.ts                     Locale routing + Supabase session refresh
messages/                      en.json / de.json — keep the two key-for-key identical
supabase/                      Migrations, auth templates, SETUP.md
scripts/                       Seeds, demo photos/ads, deploy + auth config scripts
public/llms.txt                Site summary for AI search engines
docs/                          Screenshots, marketplace-vision.md (an earlier plan)
```

## Data model

Every table has RLS; the public only ever sees live rows.

- **`listings`** — one table for every kind: `type` is `rental` (homes),
  `car`, `service` or `product` (items for sale — no longer promoted
  publicly). Homes carry `offer_type` `rent` | `sale`. `price_eur_month` is
  the price for every kind (monthly rent, or a one-time price). `status`:
  `draft` → `pending_review` → `active` → `rented` / `expired` / `archived`,
  with `expires_at` 30 days after going live. `source` is always
  `self_listed` now.
- **`rental_details`, `car_details`, `service_details`, `product_details`** —
  the kind-specific fields, one row per listing. Homes include features,
  what's nearby, the up-to-3 `highlights` starred for the card, and
  `available_to` (rentals only).
- **`profiles`** — one per auth user: `role` (`owner`, `admin`, `landlord`,
  `individual_lister`, …), display name, public contact details, photo, bio,
  `is_individual_lister` (free posting).
- **`businesses`** + **`business_consent_log`** — the Services directory and an
  audit trail of every consent event (kept even if a business is deleted).
- **`events`** — Charlie's calendar.
- **`ad_slots`** — every ad on the site (placement `site_banner`,
  `cars_sidebar`, `special_offers`); bought spots carry `duration_days` and
  `ends_at`. **`ad_orders`** / **`ad_order_lines`** — what was bought; priced
  from **`ad_prices`**, **`ad_term_discounts`**, **`ad_price_overrides`**.
- **`cart_items`**, **`listing_payments`** — the cart (a listing, business or
  ad order per line) and the payment ledger keyed by the Stripe session.
- **`listing_prices`**, **`site_settings`** — posting prices and the
  launch-promo date. Also `favorites` and `listing_reports`.

**Security lives mostly in the database.** RLS scopes every read and write, and
triggers enforce the invariants (a non-admin can't make a listing live, change
their own role, or move their listing's expiry date). Where a user-session
write is refused but should be allowed after a server-side check, the code uses
the service-role client on the server — the "trusted path" pattern. Photo and
logo uploads currently work this way, because the live `listing-photos` storage
policy refuses owners' own direct uploads (cause not yet found; the migrations
look correct).

## Things that run on their own

- **Daily at 06:00 UTC** (`vercel.json` → `/api/cron/expire-listings`): takes
  down listings past 30 days, emails owners 3 days before, hides finished ad
  spots, and settles ad invoices paid since the last run.
- **Opening Admin → Ad orders** also checks Stripe for newly paid invoices.
- **A paid cart** publishes its listings, renews renewals and creates bought ad
  spots on the Stripe success page.

## Internationalisation

English is unprefixed (`/listings`), German is `/de/listings`. Browser language
detection is off. `/admin`, `/cart` and `/consent` are English-only and sit
outside `[locale]`. Add every new message key to both `messages/en.json` and
`messages/de.json`.

## Deploying (Vercel)

1. Import the repo; the Next.js preset is detected. Add every environment
   variable above for **Production**, with `NEXT_PUBLIC_SITE_URL` set to
   `https://www.milhaus.de`. The Hobby plan doesn't allow commercial use — the project needs
   a Pro team.
2. Connect **milhaus.de** and **www.milhaus.de** (registered at IONOS) in
   Vercel → Domains, and add the DNS records Vercel shows at IONOS.
3. Verify the sending domain in Resend (its DNS records go at IONOS too), then
   point Supabase Auth SMTP and `EMAIL_FROM` at it.
4. Switch Stripe to live keys once the Stripe account is activated.
5. After deploying, check Vercel → Settings → Cron Jobs → `/api/cron/expire-listings` → Run.

The build is serverless-safe (no filesystem or long-running process assumptions).

## Known gaps

- **Email isn't sending yet**: milhaus.de isn't verified in Resend, so consent,
  expiry-warning and ad emails are skipped until it is.
- **Stripe is in test mode**: no real payments, and Stripe only emails invoices
  to the Stripe account's own team members.
- **Legal pages** (Impressum, privacy policy, terms) were drafted without a
  lawyer and should be reviewed before launch.
- **Demo content and its photos** are still live (see [Demo data](#demo-data)).

## Conventions

- **Every source file starts with a comment giving its own path**, e.g.
  `// src/app/listings/page.tsx`. Hard rule.
- Server Components by default; `"use client"` only where interactivity needs it.
- Fixed vocabularies over free text (`bases.ts`, `amenities.ts`,
  `nearby-amenities.ts`); widen a `CHECK` constraint in a new migration rather
  than loosening a column.
- New migrations are additive and safe to re-run (`if not exists`, `drop … if exists`).
- Small, working commits on `main`, each pushed — progress is reviewed by a
  non-technical owner.
