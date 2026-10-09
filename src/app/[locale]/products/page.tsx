// src/app/[locale]/products/page.tsx
// Browse products — the third listing type (docs/marketplace-vision.md:
// Products before Services). Same review pipeline and admin dashboard as
// every other type; this and /post-product are the only product-specific
// additions to the shared engine.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ProductsGrid } from "@/components/products-grid";
import { SponsorBannerCarousel } from "@/components/sponsor-banner-carousel";
import { Link } from "@/i18n/navigation";
import { getFavoriteListingIds } from "@/lib/favorites-queries";
import { getActiveListings } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ProductsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

type SearchParams = Promise<{ q?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("ProductsPage");
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [listings, favoriteIds] = await Promise.all([
    getActiveListings("product"),
    getFavoriteListingIds(user?.id),
  ]);

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
            href="/post-product"
            className="whitespace-nowrap rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("sellSomething")}
          </Link>
        </div>

        <Suspense fallback={null}>
          <ProductsGrid listings={listings} initialQuery={q} favoriteIds={user ? Array.from(favoriteIds) : null} />
        </Suspense>
      </div>
    </main>
  );
}
