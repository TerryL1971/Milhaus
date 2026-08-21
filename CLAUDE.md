# milhaus — Project Brief for Claude Code

## What this is

A rental-listing marketplace for Americans relocating to Germany (military and expat), combining the structure of a real-estate portal (ImmobilienScout24) with the low-friction posting of a classifieds board (BooKoo). Two supply sources: an on-base housing office feed, and individual families self-listing the home they're moving out of. A car-ads category may be added later — build the listing engine generically enough to support a second content type without a rewrite, but do not build cars now.

Owner/stakeholder: Charlie. He is non-technical, his input will be minimal, and he is 100% responsible for actually working the listings (reviewing submissions, coordinating with the housing office) once the site is live. Build accordingly: the admin/review experience needs to be simple enough for a non-developer to run solo.

A static design mockup already exists at `/design-reference/milhaus-landing-mockup.html` (copy your existing mockup file into this folder before starting). Treat it as the source of truth for visual direction — do not reinvent the design, implement it.

## Tech stack

- **Next.js** (App Router, TypeScript)
- **Supabase** — Postgres database, auth, and file storage (listing photos)
- **Tailwind CSS** — derive the theme config from the design tokens below rather than defaults
- **Vercel** — hosting target (build should be Vercel-deploy-ready from the start: no server assumptions that break on serverless)
- **Stripe** — not needed for MVP, but keep the data model open to a future `is_promoted` / paid-tier flag on listings

## Design tokens (from the approved mockup)

```
--ink:        #1B2A3A   nav / headers / primary dark
--ink-soft:   #2C4053
--canvas:     #F0EDE4   page background
--canvas-deep:#E6E1D2   borders, section backgrounds
--olive:      #6B7353   verified/trust accent, "housing office" stamp
--olive-deep: #545A41
--rust:       #B5502F   status: rented, CTA strip
--brass:      #C89B3C   primary action/CTA color
--charcoal:   #22201B   body text
--paper:      #FBFAF6   card backgrounds

Display font: 'Zilla Slab' (headlines)
Body font:    'IBM Plex Sans' (UI, paragraphs)
Mono font:    'IBM Plex Mono' (prices, specs, labels, eyebrows)
```

Signature UI element: the "stamp" — a dashed-circle badge marking a listing as sourced from the on-base housing office, distinct from a self-listed (PCS family) home. This distinction is a core trust signal for users and should be visible on both the card grid and the listing detail page.

## Data model (MVP)

**listings**
- id, type (`rental` for now; enum, extensible)
- title, description
- address, city, distance_to_base (text is fine for MVP, no geocoding yet)
- price_eur_month, bedrooms, bathrooms, size_sqm
- available_from (date)
- photos (array of storage URLs)
- source (`housing_office` | `self_listed`)
- status (`draft` | `pending_review` | `active` | `rented` | `archived`)
- owner_id (FK to profiles)
- created_at, updated_at, status_changed_at

**profiles**
- id (matches Supabase auth user)
- role (`admin` | `housing_office_partner` | `landlord` | `individual_lister`)
- display_name, contact_email, contact_phone (optional)

## Core MVP scope — build in this order

1. **Project scaffold**: Next.js + TypeScript + Tailwind, Supabase client wired up, env vars documented in `.env.example` (never commit real keys)
2. **Design system**: Tailwind theme config from the tokens above; base layout (nav, footer) matching the mockup
3. **Public browse page**: listing grid, filter chips by city/base, status badge (available/rented), stamp badge on housing_office-sourced cards — port directly from the mockup's structure
4. **Listing detail page**
5. **Auth**: Supabase auth (email/password or magic link) for listers and admin
6. **Post-a-listing flow**: simple multi-step or single form for `self_listed` — photos, price, move-out date. New listings default to `pending_review`
7. **Admin dashboard** (Charlie's tool): list of pending listings to approve/reject, one-click status change to `rented`/`archived`, basic table view of everything live. This needs to be genuinely simple — Charlie is non-technical and will use this daily.
8. **SEO basics**: `app/sitemap.ts` generating a dynamic sitemap from active listings, meta tags per listing page, Google Search Console verification file/tag placeholder
9. **Monitoring**: Sentry (`@sentry/nextjs` via the setup wizard) and Vercel Analytics for Web Vitals — wire up but don't over-invest yet

Do not build: car listings, payments, housing-office bulk-import tooling, or the referral/affiliate monetization ideas. Those come after the MVP is validated with Charlie.

## Conventions

- Every source file starts with a comment giving its own path, e.g. `// src/app/listings/page.tsx` as the first line — this is a hard requirement, not a style suggestion.
- Prefer server components by default; only mark `"use client"` where interactivity actually requires it.
- Keep the admin dashboard and public site in the same app (no separate admin subdomain for MVP) — simpler to ship and maintain solo.
- Commit small, working increments rather than one giant first commit — this project will be reviewed by a non-technical stakeholder (Charlie) who may ask to see progress.

## Working autonomously

If you're picking up work without Terry actively supervising: stick to the build order above, don't invent new scope, and leave a clear summary of what was done (and what's left) at natural stopping points so it's easy to review on return. Flag anything that requires a real decision (e.g. exact Supabase project settings, domain DNS, actual copy/content) rather than guessing.