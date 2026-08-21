// src/app/page.tsx
// Landing + browse page — ported from
// /design-reference/milhaus-landing-mockup.html. Combines the marketing
// hero with the live listings grid, matching the mockup's single-page
// structure. Listing data is read live from Supabase.

import Link from "next/link";
import { ListingsGrid } from "@/components/listings-grid";
import { StampBadge } from "@/components/stamp-badge";
import { getActiveListings } from "@/lib/listings";

const trustItems = [
  {
    heading: "Sourced with base housing",
    body: "Direct feed from the on-base housing office, not scraped or guessed.",
  },
  {
    heading: "Every listing reviewed",
    body: "Self-listed homes are checked before they go live — no ghost posts.",
  },
  {
    heading: "Down the day it's rented",
    body: "No calling about a place that's been gone for three weeks.",
  },
];

const howSteps = [
  {
    num: "01",
    heading: "Post your home",
    body: "A few photos, the price, and the date you're out. No agency, no paperwork.",
  },
  {
    num: "02",
    heading: "We check it",
    body: "A quick review, usually same day, so every listing on the site can be trusted.",
  },
  {
    num: "03",
    heading: "Mark it rented",
    body: "One tap and it's off the site — no one calls about a place that's already gone.",
  },
];

export default async function Home() {
  const listings = await getActiveListings();
  return (
    <main className="flex-1">
      {/* ---------- HERO ---------- */}
      <section className="py-18 sm:py-16">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-14 px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-4.5 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-olive-deep">
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-olive" />
              For Americans moving to Germany
            </div>

            <h1 className="mb-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink lg:text-6xl">
              Find home <em className="italic text-rust">before</em>
              <br />
              you land.
            </h1>

            <p className="mb-8 max-w-[46ch] text-lg text-ink-soft">
              Housing-office listings and homes from families rotating out —
              verified, in plain English, and taken down the day they&apos;re
              gone.
            </p>

            <div className="rounded-md border border-canvas-deep bg-paper p-3.5 shadow-[0_8px_24px_rgba(27,42,58,0.08)]">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.2fr_1fr_0.9fr_auto] sm:items-center">
                <div className="flex flex-col gap-1 border-b border-canvas-deep pb-2.5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3.5">
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                    Near base
                  </label>
                  <select className="bg-transparent py-1 text-[0.92rem] text-charcoal focus:outline-none">
                    <option>Stuttgart / Panzer</option>
                    <option>Kaiserslautern</option>
                    <option>Ramstein</option>
                    <option>Wiesbaden</option>
                    <option>Grafenwöhr</option>
                    <option>Spangdahlem</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 border-b border-canvas-deep pb-2.5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3.5">
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                    Move-in
                  </label>
                  <input
                    type="text"
                    placeholder="Any time"
                    className="bg-transparent py-1 text-[0.92rem] text-charcoal placeholder:text-charcoal/50 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                    Bedrooms
                  </label>
                  <select className="bg-transparent py-1 text-[0.92rem] text-charcoal focus:outline-none">
                    <option>Any</option>
                    <option>1+</option>
                    <option>2+</option>
                    <option>3+</option>
                  </select>
                </div>
                <Link
                  href="/#listings"
                  className="self-center whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-center text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                >
                  Search
                </Link>
              </div>
            </div>
          </div>

          <div className="relative hidden h-[380px] lg:block" aria-hidden="true">
            <div className="absolute left-[10%] top-0 z-10 w-65 -rotate-6 overflow-hidden rounded-md border border-canvas-deep bg-paper shadow-[0_14px_34px_rgba(27,42,58,0.16)]">
              <div
                className="relative h-33"
                style={{
                  background:
                    "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)",
                }}
              >
                <StampBadge className="right-2.5 top-2.5" />
              </div>
              <div className="px-3.5 py-3">
                <div className="font-mono text-[1.02rem] font-semibold text-ink">
                  €1,180 / mo
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  3 bed · Böblingen · 12 min to base
                </div>
              </div>
            </div>

            <div className="absolute left-[32%] top-10 z-20 w-65 rotate-3 overflow-hidden rounded-md border border-canvas-deep bg-paper shadow-[0_14px_34px_rgba(27,42,58,0.16)]">
              <div
                className="h-33"
                style={{
                  background:
                    "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)",
                }}
              />
              <div className="px-3.5 py-3">
                <div className="font-mono text-[1.02rem] font-semibold text-ink">
                  €950 / mo
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  2 bed · Sindelfingen · PCS listing
                </div>
              </div>
            </div>

            <div className="absolute left-[54%] top-2.5 z-30 w-65 -rotate-2 overflow-hidden rounded-md border border-canvas-deep bg-paper shadow-[0_14px_34px_rgba(27,42,58,0.16)]">
              <div
                className="relative h-33"
                style={{
                  background:
                    "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)",
                }}
              >
                <StampBadge className="right-2.5 top-2.5" />
              </div>
              <div className="px-3.5 py-3">
                <div className="font-mono text-[1.02rem] font-semibold text-ink">
                  €1,420 / mo
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">
                  4 bed · Herrenberg · 18 min to base
                </div>
              </div>
            </div>
          </div>
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
          <ListingsGrid listings={listings} />
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="bg-canvas-deep py-18">
        <div className="mx-auto max-w-[1180px] px-8">
          <h2 className="font-display text-[2rem] font-semibold text-ink">
            Moving out? List it in five minutes.
          </h2>
          <div className="mt-8.5 grid grid-cols-1 gap-7.5 md:grid-cols-3">
            {howSteps.map((step) => (
              <div key={step.num}>
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
            PCSing to Germany soon?
          </h2>
          <p className="mb-5.5 text-[0.96rem] opacity-90">
            Start looking before you&apos;ve even packed a box.
          </p>
          <Link
            href="/#listings"
            className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Browse open listings
          </Link>
        </div>
      </section>
    </main>
  );
}
