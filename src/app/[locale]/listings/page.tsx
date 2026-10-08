// src/app/[locale]/listings/page.tsx
// Browse homes — the dedicated Homes category page the Unified Category
// UX spec calls for (Top Navigation → Sponsored Banner → Top Horizontal
// Filter Bar → Item Grid), matching /cars, /products, /services.
//
// This didn't exist before: Homes browsing only ever lived embedded in
// the homepage's "Open right now" section, reached via a "/#listings"
// hash link. That meant "View all homes" just scrolled you back down to
// the same section already visible on the page you were on — reported
// directly ("Opens a new page and not scrolled down"). This page is the
// fix: a real separate page, same as every other category gets.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ListingsGrid } from "@/components/listings-grid";
import { SponsorBannerCarousel } from "@/components/sponsor-banner-carousel";
import { Link } from "@/i18n/navigation";
import { getActiveListings } from "@/lib/listings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ListingsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ListingsPage() {
  const t = await getTranslations("ListingsPage");
  const listings = await getActiveListings("rental");

  return (
    <main className="flex-1">
      <SponsorBannerCarousel />
      <div className="mx-auto max-w-[1400px] px-8 py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-[2rem] font-semibold text-ink">{t("heading")}</h1>
            <p className="mt-1 max-w-[52ch] text-ink-soft">{t("subhead")}</p>
          </div>
          <Link
            href="/post"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("postAHome")}
          </Link>
        </div>

        <Suspense fallback={null}>
          <ListingsGrid listings={listings} />
        </Suspense>
      </div>
    </main>
  );
}
