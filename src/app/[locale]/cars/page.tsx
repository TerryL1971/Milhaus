// src/app/[locale]/cars/page.tsx
// Browse cars — the second listing type CLAUDE.md's data model always
// anticipated ("type is extensible... e.g. 'car'"), built out at Charlie's
// request. Same review pipeline as housing listings (pending_review ->
// admin approves -> active), same admin dashboard; this page and
// /post-car are the only car-specific additions to an otherwise shared
// engine. Deliberately simpler than the rental browse page — a search box
// and a grid, matching what Charlie actually asked for.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CarsGrid } from "@/components/cars-grid";
import { Link } from "@/i18n/navigation";
import { getActiveListings } from "@/lib/listings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CarsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

type SearchParams = Promise<{ q?: string }>;

export default async function CarsPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("CarsPage");
  const { q } = await searchParams;
  const listings = await getActiveListings("car");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-display text-[2rem] font-semibold text-ink">{t("heading")}</h1>
            <p className="mt-1 max-w-[52ch] text-ink-soft">{t("subhead")}</p>
          </div>
          <Link
            href="/post-car"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("sellYourCar")}
          </Link>
        </div>

        <Suspense fallback={null}>
          <CarsGrid listings={listings} initialQuery={q} />
        </Suspense>
      </div>
    </main>
  );
}
