// src/app/[locale]/products/page.tsx
// "Special Offers" — Charlie's ask: this used to be the real Buy & Sell
// browse grid (self-listed items for sale); he wants it replaced
// entirely with promotional cards instead, the same "special offers"
// concept as the homepage's own Special Offers row, just showing every
// active one here (not capped at 3). Same ad_slots placement
// (special_offers) Charlie manages at /admin/ads — see
// src/components/special-offer-card.tsx and src/lib/ad-slots.ts for the
// full reasoning.
//
// /post-product (the old posting flow) and /products/[id] (existing real
// listings' detail pages) still work — just nothing on the public site
// links to either any more, same as /post-service's own orphaned state.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SpecialOfferCard } from "@/components/special-offer-card";
import { SponsorBannerCarousel } from "@/components/sponsor-banner-carousel";
import { getActiveAdSlots } from "@/lib/ad-slots-queries";
import { firstPhotoIndices } from "@/lib/priority-indices";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ProductsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ProductsPage() {
  const t = await getTranslations("ProductsPage");
  const offers = await getActiveAdSlots("special_offers");
  const priorityIndices = firstPhotoIndices(offers, (offer) => Boolean(offer.imageUrl), 3);

  return (
    <main className="flex-1">
      <SponsorBannerCarousel />
      <div className="mx-auto max-w-[1600px] px-8 py-8 sm:py-11 lg:py-14">
        <div className="mb-8">
          <h1 className="font-display text-[2rem] font-semibold text-ink">{t("heading")}</h1>
          <p className="mt-1 max-w-[52ch] text-ink-soft">{t("subhead")}</p>
        </div>

        {offers.length === 0 ? (
          <p className="text-ink-soft">{t("emptyNone")}</p>
        ) : (
          // Same 3-across grid as every other card type on the site
          // (Homes/Cars/Services) — cards stretch to fill their column
          // width, with SpecialOfferCard's own fixed 600px height.
          // Wraps to a new row every 3rd card regardless of how many
          // total offers exist (e.g. 12 active offers reads as 4 rows
          // of 3).
          <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer, index) => (
              <SpecialOfferCard key={offer.id} offer={offer} priority={priorityIndices.has(index)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
