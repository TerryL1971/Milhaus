// src/app/[locale]/services/page.tsx
// Browse services — the fourth listing type (docs/marketplace-vision.md:
// Services last, after Products). Same review pipeline and admin
// dashboard as every other type; this and /post-service are the only
// service-specific additions to the shared engine.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ServicesGrid } from "@/components/services-grid";
import { Link } from "@/i18n/navigation";
import { getActiveListings } from "@/lib/listings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ServicesPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

type SearchParams = Promise<{ q?: string }>;

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("ServicesPage");
  const { q } = await searchParams;
  const listings = await getActiveListings("service");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-olive-deep">
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-olive" />
              {t("eyebrow")}
            </div>
            <h1 className="font-display text-[2rem] font-semibold text-ink">{t("heading")}</h1>
            <p className="mt-1 max-w-[52ch] text-ink-soft">{t("subhead")}</p>
          </div>
          <Link
            href="/post-service"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("offerSomething")}
          </Link>
        </div>

        <Suspense fallback={null}>
          <ServicesGrid listings={listings} initialQuery={q} />
        </Suspense>
      </div>
    </main>
  );
}
