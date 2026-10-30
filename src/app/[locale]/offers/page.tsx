// src/app/[locale]/offers/page.tsx
// "Special Offers" — moved here from /products (Terry's call, 2026-10-26:
// that route name was a leftover from when this was the real Buy & Sell
// browse grid; the URL should match what's actually here now). Charlie
// manages these at /admin/ads (placement: special_offers) — same simple
// system as the site banner / cars sidebar ad, just a third placement,
// rather than a whole new content type + admin page. Cards are as wide
// as the Homes/Cars/Services cards (stretch to fill their grid column)
// with a fixed 600px height. Shows every active offer, not capped at 3
// like the homepage's own row — see src/components/special-offer-card.tsx
// and src/lib/ad-slots.ts for the full reasoning.
//
// /post-product (the old posting flow) and /products/[id] (existing real
// listings' detail pages, unrelated to this route now) still work —
// just nothing on the public site links to either any more, same as
// /post-service's own orphaned state.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SpecialOfferCard } from "@/components/special-offer-card";
import { SponsorBannerCarousel } from "@/components/sponsor-banner-carousel";
import { getActiveAdSlots } from "@/lib/ad-slots-queries";
import { firstPhotoIndices } from "@/lib/priority-indices";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OffersPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function OffersPage() {
  const t = await getTranslations("OffersPage");
  const offers = await getActiveAdSlots("special_offers");
  const priorityIndices = firstPhotoIndices(offers, (offer) => Boolean(offer.imageUrl), 3);

  return (
    <main className="flex-1">
      <SponsorBannerCarousel />
      <div className="mx-auto max-w-[1600px] px-8 py-8 sm:py-11 lg:py-14">
        <div className="mb-8">
          <h1 className="font-display text-[clamp(1.5rem,7.5vw,2rem)] font-semibold text-ink">{t("heading")}</h1>
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
