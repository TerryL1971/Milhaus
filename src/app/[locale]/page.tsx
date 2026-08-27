// src/app/[locale]/page.tsx
// Landing + browse page — ported from
// /design-reference/milhaus-landing-mockup.html. Combines the marketing
// hero with the live listings grid, matching the mockup's single-page
// structure. Listing data is read live from Supabase.

import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ListingsGrid } from "@/components/listings-grid";
import { StampBadge } from "@/components/stamp-badge";
import { Link } from "@/i18n/navigation";
import { BASE_NAMES } from "@/lib/bases";
import { getActiveListings, getFeaturedListings } from "@/lib/listings";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// Position/rotation for the hero's 3-card fan, by index — the cards
// themselves are real listings now (admin-featured, or the most recent
// active ones as a fallback), not hardcoded content. The z-10/20/30 here
// is only the fanned stacking *among the 3 cards* (later card in front,
// matching the mockup) — it must stay below SiteHeader's z-50, or a card
// renders on top of the sticky nav wherever they visually overlap.
const HERO_CARD_STYLES = [
  "absolute left-[10%] top-0 z-10 w-65 -rotate-6",
  "absolute left-[32%] top-10 z-20 w-65 rotate-3",
  "absolute left-[54%] top-2.5 z-30 w-65 -rotate-2",
];

export default async function Home() {
  const t = await getTranslations("HomePage");
  const [listings, featured] = await Promise.all([getActiveListings(), getFeaturedListings(3)]);

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
      <section className="py-18 sm:py-16">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-14 px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-4.5 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-olive-deep">
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-olive" />
              {t("eyebrow")}
            </div>

            <h1 className="mb-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink lg:text-6xl">
              {t("headlineStart")} <em className="italic text-rust">{t("headlineEmphasis")}</em>
              <br />
              {t("headlineEnd")}
            </h1>

            <p className="mb-8 max-w-[46ch] text-lg text-ink-soft">{t("subhead")}</p>

            <form
              action="/#listings"
              className="rounded-md border border-canvas-deep bg-paper p-3.5 shadow-[0_8px_24px_rgba(27,42,58,0.08)]"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.2fr_1fr_0.9fr_auto] sm:items-center">
                <div className="flex flex-col gap-1 border-b border-canvas-deep pb-2.5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3.5">
                  <label htmlFor="hero-base" className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                    {t("searchNearBase")}
                  </label>
                  <select
                    id="hero-base"
                    name="base"
                    defaultValue=""
                    className="bg-transparent py-1 text-[0.92rem] text-charcoal focus:outline-none"
                  >
                    <option value="">{t("searchAnyBase")}</option>
                    {BASE_NAMES.map((base) => (
                      <option key={base} value={base}>
                        {base}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 border-b border-canvas-deep pb-2.5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3.5">
                  <label htmlFor="hero-movein" className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                    {t("searchMoveIn")}
                  </label>
                  <input
                    id="hero-movein"
                    name="movein"
                    type="date"
                    className="bg-transparent py-1 text-[0.92rem] text-charcoal focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="hero-bedrooms" className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                    {t("searchBedrooms")}
                  </label>
                  <select
                    id="hero-bedrooms"
                    name="bedrooms"
                    defaultValue=""
                    className="bg-transparent py-1 text-[0.92rem] text-charcoal focus:outline-none"
                  >
                    <option value="">{t("searchAnyBedrooms")}</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="self-center whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-center text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                >
                  {t("searchButton")}
                </button>
              </div>
            </form>
          </div>

          {featured.length > 0 && (
            <div className="relative hidden h-[380px] lg:block">
              {featured.map((listing, index) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className={`${HERO_CARD_STYLES[index]} overflow-hidden rounded-md border border-canvas-deep bg-paper shadow-[0_14px_34px_rgba(27,42,58,0.16)] transition-transform hover:-translate-y-1`}
                >
                  <div className="relative h-33">
                    {listing.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config here
                      <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)" }}
                      />
                    )}
                    {listing.source === "housing_office" && <StampBadge className="right-2.5 top-2.5" />}
                  </div>
                  <div className="px-3.5 py-3">
                    <div className="font-mono text-[1.02rem] font-semibold text-ink">
                      {currencyFormatter.format(listing.priceEurMonth)} / mo
                    </div>
                    <div className="mt-0.5 text-xs text-ink-soft">
                      {listing.bedrooms} bed · {listing.city}
                      {listing.distanceToBase ? ` · ${listing.distanceToBase}` : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- TRUST STRIP ---------- */}
      <section className="bg-ink py-8.5 text-paper">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-7 px-8 md:grid-cols-3">
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
        <div className="mx-auto max-w-[1180px] px-8">
          <Suspense fallback={null}>
            <ListingsGrid listings={listings} />
          </Suspense>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="bg-canvas-deep py-18">
        <div className="mx-auto max-w-[1180px] px-8">
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
        <div className="mx-auto max-w-[1180px] px-8">
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
