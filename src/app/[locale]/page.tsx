// src/app/[locale]/page.tsx
// Landing + browse page — ported from
// /design-reference/milhaus-landing-mockup.html. Combines the marketing
// hero with the live listings grid, matching the mockup's single-page
// structure. Listing data is read live from Supabase.

import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FilterModal } from "@/components/filter-modal";
import { ListingsGrid } from "@/components/listings-grid";
import { StampBadge } from "@/components/stamp-badge";
import { getPathname, Link } from "@/i18n/navigation";
import { BASE_NAMES } from "@/lib/bases";
import { getActiveListings, getFeaturedListings } from "@/lib/listings";
import type { Listing } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// Position/rotation for each mini-hero's 2-card fan, by index — small
// enough to fit a quarter-width column (4 categories side by side) rather
// than the old single full-width hero's 3-card fan. Real listings
// (admin-featured, or most recent active as a fallback), not hardcoded
// content. z-10/20 only orders the 2 cards *within* their own fan; it
// must stay below SiteHeader's z-50.
const MINI_FAN_STYLES = [
  "absolute left-0 top-0 z-10 w-[70%] -rotate-6",
  "absolute left-[16%] top-6 z-20 w-[70%] rotate-2",
  "absolute left-[32%] top-2 z-30 w-[70%] -rotate-2",
];

function miniCardPrice(listing: Listing): string {
  const price = currencyFormatter.format(listing.priceEurMonth);
  if (listing.type === "rental") return `${price} / mo`;
  if (listing.type === "service" && listing.priceIsEstimate) return `from ${price}`;
  return price;
}

function miniCardDetail(listing: Listing): string {
  switch (listing.type) {
    case "rental":
      return `${listing.bedrooms} bed · ${listing.city}`;
    case "car":
      return `${listing.year} ${listing.make} · ${listing.city}`;
    default:
      return listing.city;
  }
}

export default async function Home() {
  const t = await getTranslations("HomePage");
  const tCars = await getTranslations("CarsPage");
  const tProducts = await getTranslations("ProductsPage");
  const tServices = await getTranslations("ServicesPage");
  const locale = await getLocale();
  const [listings, featuredRentals, featuredCars, featuredProducts, featuredServices] = await Promise.all([
    getActiveListings(),
    getFeaturedListings("rental", 3),
    getFeaturedListings("car", 3),
    getFeaturedListings("product", 3),
    getFeaturedListings("service", 3),
  ]);

  // One card per category — hero content (eyebrow/heading/subhead/photo
  // fan) and the search control merged into a single unit rather than two
  // separate rows. Rentals keeps its punchy headline/emphasis split and a
  // "near base" select (it has more filters than a single text box can
  // hold — move-in date and bedrooms live in FilterModal instead); the
  // other three reuse their own page's copy and a plain text search.
  const categories = [
    {
      key: "rental",
      eyebrow: t("eyebrow"),
      heading: (
        <>
          {t("headlineStart")} <em className="italic text-rust">{t("headlineEmphasis")}</em> {t("headlineEnd")}
        </>
      ),
      subhead: t("subhead"),
      featured: featuredRentals,
      hrefBase: "/listings",
      search: { kind: "base-select" as const, action: "/#listings" },
    },
    {
      key: "cars",
      eyebrow: tCars("eyebrow"),
      heading: tCars("heading"),
      subhead: tCars("subhead"),
      featured: featuredCars,
      hrefBase: "/cars",
      search: { kind: "text" as const, action: getPathname({ href: "/cars", locale }), placeholder: tCars("searchPlaceholder") },
    },
    {
      key: "products",
      eyebrow: tProducts("eyebrow"),
      heading: tProducts("heading"),
      subhead: tProducts("subhead"),
      featured: featuredProducts,
      hrefBase: "/products",
      search: {
        kind: "text" as const,
        action: getPathname({ href: "/products", locale }),
        placeholder: tProducts("searchPlaceholder"),
      },
    },
    {
      key: "services",
      eyebrow: tServices("eyebrow"),
      heading: tServices("heading"),
      subhead: tServices("subhead"),
      featured: featuredServices,
      hrefBase: "/services",
      search: {
        kind: "text" as const,
        action: getPathname({ href: "/services", locale }),
        placeholder: tServices("searchPlaceholder"),
      },
    },
  ];

  const trustItems = [
    { heading: t("trust1Heading"), body: t("trust1Body") },
    { heading: t("trust2Heading"), body: t("trust2Body") },
    { heading: t("trust3Heading"), body: t("trust3Body") },
  ];
  const howSteps = [
    { num: "01", heading: t("how1Heading"), body: t("how1Body") },
    { num: "02", heading: t("how2Heading"), body: t("how2Body") },
    { num: "03", heading: t("how3Heading"), body: t("how3Body") },
  ];

  return (
    <main className="flex-1">
      {/* ---------- HERO ---------- */}
      {/* All four categories in one card each — a reserved sponsored-spot
          banner up top (not wired to real payment yet, see CLAUDE.md's
          "not needed for MVP" call on Stripe — this is just the space),
          then hero content (eyebrow/heading/subhead/photo fan), then the
          search control, all merged into a single unit instead of a
          separate hero row and search row. */}
      <section className="bg-canvas-deep py-14">
        <div className="mx-auto max-w-[1400px] px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category.key}
                className="flex flex-col rounded-md border border-canvas-deep bg-paper p-5 shadow-[0_8px_24px_rgba(27,42,58,0.06)]"
              >
                <div className="mb-4 flex h-14 items-center justify-center rounded-md border border-dashed border-brass/50 bg-brass/8">
                  <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-brass-deep">
                    {t("sponsoredSpot")}
                  </span>
                </div>

                <h1 className="mb-1.5 font-display text-xl font-semibold leading-[1.1] tracking-tight text-ink">
                  {category.heading}
                </h1>

                <p className="mb-4 text-sm text-ink-soft">{category.subhead}</p>

                {category.featured.length > 0 && (
                  <div className="relative mb-5 h-[160px]">
                    {category.featured.map((listing, index) => (
                      <Link
                        key={listing.id}
                        href={`${category.hrefBase}/${listing.id}`}
                        className={`${MINI_FAN_STYLES[index]} overflow-hidden rounded-md border border-canvas-deep bg-paper shadow-[0_10px_26px_rgba(27,42,58,0.14)] transition-transform hover:-translate-y-1`}
                      >
                        <div className="relative h-16">
                          {listing.photos[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config here
                            <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={{ background: "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)" }}
                            />
                          )}
                          {listing.source === "housing_office" && <StampBadge className="right-2 top-2 scale-75" />}
                        </div>
                        <div className="px-2.5 py-1.5">
                          <div className="font-mono text-[0.82rem] font-semibold text-ink">
                            {miniCardPrice(listing)}
                          </div>
                          <div className="mt-0.5 truncate text-[0.7rem] text-ink-soft">{miniCardDetail(listing)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-auto">
                  {category.search.kind === "base-select" ? (
                    <form action={category.search.action} className="flex gap-2">
                      <select
                        name="base"
                        defaultValue=""
                        className="min-w-0 flex-1 rounded-md border border-canvas-deep bg-canvas px-3 py-2 text-sm text-charcoal focus:border-olive focus:outline-none"
                      >
                        <option value="">{t("searchAnyBase")}</option>
                        {BASE_NAMES.map((base) => (
                          <option key={base} value={base}>
                            {base}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="flex-none whitespace-nowrap rounded-md bg-brass px-4 py-2 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                      >
                        {t("searchButton")}
                      </button>
                      <FilterModal />
                    </form>
                  ) : (
                    <form action={category.search.action} className="flex gap-2">
                      <input
                        type="search"
                        name="q"
                        placeholder={category.search.placeholder}
                        className="min-w-0 flex-1 rounded-md border border-canvas-deep bg-canvas px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="flex-none whitespace-nowrap rounded-md bg-brass px-4 py-2 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                      >
                        {t("searchButton")}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- TRUST STRIP ---------- */}
      <section className="bg-ink py-8.5 text-paper">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-7 px-8 md:grid-cols-3">
          {trustItems.map((item, index) => (
            <div key={item.heading} className="flex gap-3.5">
              <div className="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-full border-[1.5px] border-brass font-mono text-sm text-brass">
                {index + 1}
              </div>
              <p className="text-sm opacity-85">
                <strong className="mb-0.5 block text-[0.94rem] font-semibold">
                  {item.heading}
                </strong>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- LISTINGS ---------- */}
      <section id="listings" className="py-18">
        <div className="mx-auto max-w-[1400px] px-8">
          <Suspense fallback={null}>
            <ListingsGrid listings={listings} />
          </Suspense>
        </div>
      </section>

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
            href="/#listings"
            className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </main>
  );
}
