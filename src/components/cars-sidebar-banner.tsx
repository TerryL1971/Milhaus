// src/components/cars-sidebar-banner.tsx
// A single sidebar ad slot, /cars only (Charlie's ask) — not a carousel
// like SponsorBannerCarousel (the horizontal strip above every category
// page's grid); just one static slot, "ad space" as literally asked for.
// Sized to the IAB "Half Page Ad" standard (300x600) — the usual fit for
// a vertical sidebar slot, so a real advertiser's creative drops in
// without needing a custom size. Hidden below lg: no room for a sidebar
// at that width, and this page's grid already reflows to fewer columns.
//
// Reads from ad_slots (placement='cars_sidebar') — Charlie manages this
// at /admin/ads — and shows the lowest sort_order active row; falls back
// to the same "Advertise here" placeholder SponsorBannerCarousel uses
// when he hasn't added one yet.

import { getActiveAdSlots } from "@/lib/ad-slots-queries";

export async function CarsSidebarBanner() {
  const ads = await getActiveAdSlots("cars_sidebar");
  const ad = ads[0];

  return (
    <aside className="hidden w-[300px] flex-shrink-0 lg:block">
      <div className="sticky top-[100px] h-[600px] w-[300px] overflow-hidden rounded-md border border-canvas-deep bg-paper">
        {ad?.imageUrl ? (
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- external advertiser image */}
            <img src={ad.imageUrl} alt={ad.advertiserName} className="h-full w-full object-cover" />
          </a>
        ) : ad ? (
          <a
            href={ad.linkUrl}
            className="flex h-full w-full flex-col items-center justify-center gap-1 p-6 text-center"
          >
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              {ad.heading ?? ad.advertiserName}
            </span>
            {ad.bodyText && <span className="text-sm text-ink-soft/75">{ad.bodyText}</span>}
          </a>
        ) : (
          <a
            href="mailto:hello@example.com?subject=Advertising%20on%20Milhaus"
            className="flex h-full w-full flex-col items-center justify-center gap-1 p-6 text-center"
          >
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Advertise here
            </span>
            <span className="text-sm text-ink-soft/75">Click to find out how</span>
          </a>
        )}
      </div>
    </aside>
  );
}
