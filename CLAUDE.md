<!-- CLAUDE.md -->
# Milhaus — Project Brief

Read this before changing anything. It's for any developer (or AI coding
assistant) working on the site: what Milhaus is, the rules that must not be
broken, and the decisions behind the way it works. [README.md](./README.md)
covers setup, the full data model and deployment.

## What this is

**Milhaus** (www.milhaus.de — always written with a capital M) is a
marketplace for Americans living in Germany: U.S. military members, DoD
civilians, their families and expats. It has five sections:

- **Homes** — for rent and for sale, posted by landlords and by families
  moving out (PCS). One Homes page with a For rent | For sale switch.
- **Cars** — often U.S.-spec cars sold before a move (prices in US dollars).
- **Services** — a directory of military-friendly local businesses.
- **Special Offers** — paid promotion cards from local businesses.
- **Events** — a calendar curated by the owner.

The site earns money from posting fees, 30-day renewals and ad spots (banner,
Cars sidebar, Special Offers), all priced by the owner in Admin → Pricing.

**Owner:** Charlie. He is non-technical and runs the site alone from `/admin`
— there's no routine approval queue, but he manages prices, ads, invoices,
businesses, consent, events and takedowns. Every admin tool must be usable without a
developer. Terry built the site and is handing it over; after that, Charlie
may hire someone else to change it.

## Rules that must not be broken

1. **No Housing Office affiliation — ever.** After a meeting with the on-base
   Housing Office (2026-11-04), nothing on the site may suggest the Housing
   Office lists, approves or endorses a home: no stamp, no "Housing Approved"
   badge or filter, no "housing office listing" label, no such wording in
   copy, metadata or `public/llms.txt`. The `listings.source` column and the
   `housing_office_partner` role still exist in the database for history, but
   every listing is `self_listed` and nothing may set or show the other value.
2. **No business is listed without its own consent.** Listing a business
   without the owner's permission is illegal in Germany. A business goes live
   only after the business itself confirms (email link) or Charlie records
   paper/verbal consent — payment alone is never enough. See
   `src/lib/businesses-queries.ts` (`tryActivateBusiness`).
3. **Every source file starts with a comment giving its own path**, e.g.
   `// src/app/[locale]/cars/page.tsx`. Hard requirement.
4. **Keep the "why" comments, and keep them true.** Comments record whose
   request a piece of code was, what was decided and what broke before (e.g.
   "Charlie's ask, 2026-11-04"). They're the project's memory for Terry, for
   anyone reading the code on GitHub, and for whoever maintains it next.
   Write them so a stranger can follow them; when code changes, update its
   comment; never strip them out in a clean-up.
5. **Never commit secrets.** Keys live in `.env.local` (git-ignored) and in
   Vercel's environment variables. `.env.example` documents them. The GitHub
   repo is public.

## How the site works (decisions to respect)

- **Payment is the gate, not review.** A listing goes live as soon as it's
  paid for, or immediately if posting is free (free category, the "free
  until" launch promo, or a user who ticked "I'm an individual"). There is no
  manual approval step; Charlie takes down anything abusive afterwards.
- **Every listing lasts 30 days.** A daily Vercel Cron job
  (`/api/cron/expire-listings`) takes it down, emails the owner 3 days
  before, and renewing costs the posting fee again. Charlie can grant a free
  30 days from Admin.
- **Homes for sale** are `type = 'rental'` listings with `offer_type =
  'sale'` — they share every home feature. They never show "Pet friendly" or
  "Available to" (anyone can buy a house). Homes for rent may be "US Military
  only" or "US Military & Expats".
- **Card highlights:** a lister stars up to **3** features / what's-nearby
  items, and only as many as fit one line on the narrowest card. The form
  enforces it; cards never show half a label.
- **Homepage Featured Homes** shows 2 for rent and 1 for sale.
- **Ads:** businesses buy spots on `/advertise` (cart + Stripe Checkout), or
  Charlie emails an itemized Stripe invoice from Admin → Ad orders. A bought
  spot's time starts when it first goes live with artwork.
- **Photo uploads go through the server** (signed upload URLs or the
  service-role client after an ownership check). The live `listing-photos`
  storage policy refuses users' direct uploads.
- **No pop-ups** (Charlie's preference) — use an on-page message or banner.
- **On phones, scale elements in place** rather than moving them elsewhere
  in the layout, and check every change at phone width.

## Tech stack

- **Next.js 16** (App Router, TypeScript), React 19 — Server Components by
  default; `"use client"` only where interactivity needs it.
- **Supabase** — Postgres with Row Level Security, Auth, Storage. Security
  lives in RLS and triggers; server code uses the service-role client only
  after its own permission check.
- **Stripe** — Checkout (cart) and Invoices (ads), with Stripe's own receipts.
- **Resend** — transactional email (consent, expiry warnings, ad emails),
  best-effort: email failures never block a save.
- **Tailwind CSS v4** — theme in `src/app/globals.css`.
- **next-intl** — English (unprefixed) and German (`/de`). Every message key
  must exist in both `messages/en.json` and `messages/de.json`. `/admin`,
  `/cart` and `/consent` are English-only and live outside `[locale]`.
- **Vercel** hosting + Cron; **Sentry** errors; Vercel Analytics (only after
  cookie consent).

## Design

Colours come from Charlie's spec (Milaus_Layout-Frontpage.pdf, 2026-10-08):
navy, red and cream. They're defined once in `src/app/globals.css`:

```
--ink:         #101842   navy — header, headings, dark UI
--ink-soft:    #2C345E   softer navy — secondary text
--canvas:      #F8F7F2   cream — page background
--canvas-deep: #E6E1D2   borders, section backgrounds
--paper:       #FBFAF6   card backgrounds
--charcoal:    #22201B   body text
--olive:       #6B7353   supporting accent (status chips, focus rings)
--olive-deep:  #545A41
--brass / --rust: #7B101A   red — primary buttons and CTAs (two legacy names, one colour)
--brass-deep:  #5C0C14   red hover
```

Fonts: **Libre Baskerville** for page and section headings (`font-display`),
**Work Sans** for everything else (`font-body`) — including all listing
content (cards and detail pages, Charlie 2026-11-06). IBM Plex Mono
(`font-mono`) remains for small labels outside listings. The CSS variables
still carry their original names (`--font-zilla-slab`, `--font-ibm-plex-sans`)
from the first design; they point at the fonts above.

`design-reference/milhaus-landing-mockup.html` is the original mockup — kept
for history; the live site and Charlie's spec have moved on from it.

## Working on it

- **Database changes:** add a new, additive migration in
  `supabase/migrations/` (safe to re-run: `if not exists`, `drop … if
  exists`). The Supabase access token is not available, so migration SQL is
  pasted into the Supabase SQL Editor by hand — and code that needs a new
  column must not be deployed before that SQL has run.
- **Checks before committing:** `npx tsc --noEmit`, `npm run lint` (clean),
  and the change tried in a real browser at desktop and phone width.
- **Commits:** small, working, and pushed to `main` (Vercel deploys it).
  Progress is followed by a non-technical owner.
- **Demo content** (accounts and businesses marked "(demo)", demo listings,
  demo ads) must be removed before launch — see README → Demo data.
- **Flag, don't guess,** anything that needs a real decision from Charlie or
  Terry: prices, legal wording, domain/DNS, account settings, new copy.
