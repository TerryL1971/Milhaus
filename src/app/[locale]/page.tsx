// src/app/[locale]/page.tsx
// Landing + browse page — ported from
// /design-reference/milhaus-landing-mockup.html. Combines the marketing
// hero with the live listings grid, matching the mockup's single-page
// structure. Listing data is read live from Supabase.

import { getLocale, getTranslations } from "next-intl/server";
import { BusinessCard } from "@/components/business-card";
import { CarListingCard } from "@/components/car-listing-card";
import { ListingCard } from "@/components/listing-card";
import { ProductListingCard } from "@/components/product-listing-card";
import { SponsorBannerCarousel } from "@/components/sponsor-banner-carousel";
import { getPathname, Link } from "@/i18n/navigation";
import { BASE_NAMES } from "@/lib/bases";
import { getFeaturedBusinesses } from "@/lib/businesses-queries";
import { getFeaturedListings } from "@/lib/listings";

// Same fallback-when-no-photo treatment as ListingsGrid/CarsGrid, just a
// local copy sized to 3 (these "Featured X" sections never show more).
const RENTAL_PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C63)",
];
const CAR_PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#B9C4D0,#5C6B7A)",
  "linear-gradient(135deg,#C7B8A0,#3E4A57)",
  "linear-gradient(135deg,#A9B4A0,#2C4053)",
];
const PRODUCT_PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#D8C9A8,#A9AE83)",
  "linear-gradient(135deg,#C3B79D,#8C9873)",
  "linear-gradient(135deg,#CBBBA0,#8E7C67)",
];

export default async function Home() {
  const t = await getTranslations("HomePage");
  const locale = await getLocale();
  const [featuredRentals, featuredCars, featuredProducts, featuredBusinesses] = await Promise.all([
    getFeaturedListings("rental", 3),
    getFeaturedListings("car", 3),
    getFeaturedListings("product", 3),
    getFeaturedBusinesses(4),
  ]);

  const howSteps = [
    { num: "01", heading: t("how1Heading"), body: t("how1Body") },
    { num: "02", heading: t("how2Heading"), body: t("how2Body") },
    { num: "03", heading: t("how3Heading"), body: t("how3Body") },
  ];

  const heroImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/_site/hero-home.jpg`;
  const searchAction = getPathname({ href: "/search", locale });

  return (
    <main className="flex-1">
      {/* One site-wide scrolling banner instead of the four separate
          per-card "Sponsored spot" boxes this replaced — its own small
          cream strip above the hero, not floating on the photo (tried
          that; Terry wanted the cream strip back, just kept small). */}
      <SponsorBannerCarousel />

      {/* ---------- PHOTO HERO + UNIFIED SEARCH ---------- */}
      {/* One search box across all four categories, not four separate
          ones — the actual fix for "how would someone even know Items
          for sale is where a baby crib would be." Submits to /search,
          which fans out across every type unless a specific category is
          picked. */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config here */}
          <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/35" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-8 py-20 sm:py-28">
          <h1 className="mb-3 max-w-[20ch] font-display text-4xl font-bold leading-[1.1] tracking-tight text-paper lg:text-6xl">
            {t("headlineLine1")}
            <br />
            {t("headlineLine2")}
          </h1>

          <p className="mb-8 max-w-[56ch] text-lg text-paper/90">{t("subhead")}</p>

          <form
            action={searchAction}
            className="flex flex-col gap-2.5 rounded-md bg-paper p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.3)] sm:flex-row sm:items-center"
          >
            <input
              type="search"
              name="q"
              placeholder={t("heroSearchPlaceholder")}
              className="min-w-0 flex-[1.4] rounded-md border border-canvas-deep bg-canvas px-4 py-2.5 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
            />
            <select
              name="category"
              defaultValue=""
              className="rounded-md border border-canvas-deep bg-canvas px-3 py-2.5 text-sm text-charcoal focus:border-olive focus:outline-none"
            >
              <option value="">{t("heroAllCategories")}</option>
              <option value="rental">{t("heroCategoryRentals")}</option>
              <option value="car">{t("heroCategoryCars")}</option>
              <option value="product">{t("heroCategoryItems")}</option>
              <option value="service">{t("heroCategoryServices")}</option>
            </select>
            {/* A fixed-list <select> rather than free-text — "Location /
                Garrison / Base" in the mockup reads like it could be
                freeform/autocomplete, but this site only ever filters by
                the same fixed set of bases everywhere else, so a select
                keeps this consistent rather than accepting text that
                wouldn't actually match anything. */}
            <span className="relative flex-1">
              <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60">
                📍
              </span>
              <select
                name="base"
                defaultValue=""
                className="w-full rounded-md border border-canvas-deep bg-canvas py-2.5 pl-8 pr-3 text-sm text-charcoal focus:border-olive focus:outline-none"
              >
                <option value="">{t("heroLocationPlaceholder")}</option>
                {BASE_NAMES.map((base) => (
                  <option key={base} value={base}>
                    {base}
                  </option>
                ))}
              </select>
            </span>
            <button
              type="submit"
              className="flex-none whitespace-nowrap rounded-md bg-brass px-6 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
            >
              {t("searchButton")}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-paper/70">{t("heroTagline")}</p>
            <p className="font-[family-name:var(--font-script)] text-2xl text-brass">{t("scriptTagline")}</p>
          </div>
        </div>
      </section>

      {/* ---------- FEATURED HOMES / FEATURED CARS ---------- */}
      {/* Per Charlie's frontpage mockup — dedicated rows with the full
          card treatment (photo, badges, price/specs), distinct from the
          hero's small mini-card fan above. Same "don't show an empty
          section" rule as Military-Friendly Businesses below: only
          renders once there's at least one featured item of that type. */}
      {featuredRentals.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-[2rem] font-semibold text-ink">{t("featuredHomesHeading")}</h2>
              <Link href="/listings" className="text-sm font-semibold text-olive-deep hover:underline">
                {t("featuredHomesViewAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredRentals.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} photoGradient={RENTAL_PHOTO_GRADIENTS[index % RENTAL_PHOTO_GRADIENTS.length]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredCars.length > 0 && (
        <section className="bg-canvas-deep py-14">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-[2rem] font-semibold text-ink">{t("featuredCarsHeading")}</h2>
              <Link href="/cars" className="text-sm font-semibold text-olive-deep hover:underline">
                {t("featuredCarsViewAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCars.map((listing, index) => (
                <CarListingCard key={listing.id} listing={listing} photoGradient={CAR_PHOTO_GRADIENTS[index % CAR_PHOTO_GRADIENTS.length]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- MILITARY-FRIENDLY BUSINESSES ---------- */}
      {/* Charlie hand-enters these from /admin/businesses — only shows
          up at all once he's featured at least one, same "don't show an
          empty/fake section" rule the rest of the homepage follows. */}
      {featuredBusinesses.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-[2rem] font-semibold text-ink">{t("businessesHeading")}</h2>
              <Link href="/services" className="text-sm font-semibold text-olive-deep hover:underline">
                {t("businessesViewAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featuredBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- FEATURED BUY & SELL ---------- */}
      {featuredProducts.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-[1400px] px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-[2rem] font-semibold text-ink">{t("featuredProductsHeading")}</h2>
              <Link href="/products" className="text-sm font-semibold text-olive-deep hover:underline">
                {t("featuredProductsViewAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((listing, index) => (
                <ProductListingCard key={listing.id} listing={listing} photoGradient={PRODUCT_PHOTO_GRADIENTS[index % PRODUCT_PHOTO_GRADIENTS.length]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="bg-canvas-deep py-18">
        <div className="mx-auto max-w-[1400px] px-8">
          <h2 className="font-display text-[2rem] font-semibold text-ink">{t("howHeading")}</h2>
          <div className="mt-8.5 grid grid-cols-1 gap-7.5 md:grid-cols-3">
            {howSteps.map((step) => (
              <div key={step.heading}>
                <div className="mb-2.5 font-display text-[2.6rem] font-bold leading-none text-brass/90">
                  {step.num}
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-ink">
                  {step.heading}
                </h3>
                <p className="max-w-[32ch] text-sm text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA STRIP ---------- */}
      <section className="bg-rust py-11 text-center text-paper">
        <div className="mx-auto max-w-[1400px] px-8">
          <h2 className="mb-2.5 font-display text-[1.7rem] font-semibold text-paper">
            {t("ctaHeading")}
          </h2>
          <p className="mb-5.5 text-[0.96rem] opacity-90">{t("ctaBody")}</p>
          <Link
            href="/listings"
            className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </main>
  );
}
