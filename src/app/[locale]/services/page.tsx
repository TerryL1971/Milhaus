// src/app/[locale]/services/page.tsx
// Browse services — now the Military-Friendly Businesses directory
// (per Terry: "The Services category is the Military-Friendly
// Businesses"), not the self-listed individual-services feature this
// replaced. Charlie hand-enters each business from /admin/businesses;
// there's no post-a-service flow here anymore.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BusinessesGrid } from "@/components/businesses-grid";
import { SponsorBannerCarousel } from "@/components/sponsor-banner-carousel";
import { getActiveBusinesses } from "@/lib/businesses-queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ServicesPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

type SearchParams = Promise<{ q?: string }>;

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("ServicesPage");
  const { q } = await searchParams;
  const businesses = await getActiveBusinesses();

  return (
    <main className="flex-1">
      <SponsorBannerCarousel />
      <div className="mx-auto max-w-[1400px] px-8 py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-[2rem] font-semibold text-ink">{t("heading")}</h1>
            <p className="mt-1 max-w-[52ch] text-ink-soft">{t("subhead")}</p>
          </div>
          <a
            href="mailto:hello@example.com?subject=Business%20suggestion%20for%20Milhaus"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("offerSomething")}
          </a>
        </div>

        <Suspense fallback={null}>
          <BusinessesGrid businesses={businesses} initialQuery={q} />
        </Suspense>
      </div>
    </main>
  );
}
