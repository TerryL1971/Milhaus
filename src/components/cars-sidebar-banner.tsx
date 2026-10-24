// src/components/cars-sidebar-banner.tsx
// The sidebar ad slot on /cars — cross-fades through every active
// cars_sidebar row on a timer, same pure-CSS technique as
// SponsorBannerCarousel (stacked slides sharing one keyframe, each offset
// by a negative animation-delay so they take turns being visible; no JS,
// so this stays a server component). Originally a single static slot
// ("ad space" as literally asked for) — Charlie's ask once more than one
// advertiser existed: let the slot cycle instead of only ever showing
// whichever has the lowest sort_order.
//
// Sized to the IAB "Half Page Ad" standard (300x600) — the usual fit for
// a vertical sidebar slot, so a real advertiser's creative drops in
// without needing a custom size. Hidden below md (phones — no room for a
// 300px box next to a one-column grid); from md up it still renders at
// its native 300x600, just repositioned: stacked full-width-centered
// below the listing grid on tablets (the page's own flex-col -> lg:flex-row
// switch handles that), and back to a sticky sidebar beside the grid at
// lg. Charlie's call after learning the old lg-only cutoff meant zero
// impressions on tablet traffic — rather than stretching the creative to
// fill a tablet's width (ad units don't scale like that), just move it.
//
// Reads from ad_slots (placement='cars_sidebar') — Charlie manages this
// at /admin/ads — falling back to the same "Advertise here" placeholder
// SponsorBannerCarousel uses when he hasn't added one yet.

import Image from "next/image";
import { getActiveAdSlots } from "@/lib/ad-slots-queries";
import type { AdSlot } from "@/lib/ad-slots";

const FALLBACK_AD: AdSlot = {
  id: "fallback",
  placement: "cars_sidebar",
  advertiserName: "Advertise here",
  imageUrl: null,
  heading: "Advertise here",
  bodyText: "Click to find out how",
  linkUrl: "mailto:info@milhaus.de?subject=Advertising%20on%20Milhaus",
  isActive: true,
  sortOrder: 0,
  createdAt: "",
};

const VISIBLE_SECONDS = 6;
const FADE_SECONDS = 1;

export async function CarsSidebarBanner() {
  const fetchedAds = await getActiveAdSlots("cars_sidebar");
  const ads = fetchedAds.length > 0 ? fetchedAds : [FALLBACK_AD];

  const perSlideSeconds = VISIBLE_SECONDS + FADE_SECONDS;
  const totalSeconds = ads.length * perSlideSeconds;
  const visiblePercent = (VISIBLE_SECONDS / totalSeconds) * 100;
  const fadeEndPercent = (perSlideSeconds / totalSeconds) * 100;
  const animated = ads.length > 1;

  return (
    <aside className="hidden w-full justify-center md:flex lg:block lg:w-[300px] lg:flex-shrink-0">
      <div className="group h-[600px] w-[300px] overflow-hidden rounded-md border border-canvas-deep bg-paper lg:sticky lg:top-[100px]">
        {animated && (
          <style>{`
            @keyframes cars-sidebar-fade {
              0% { opacity: 1; pointer-events: auto; }
              ${visiblePercent}% { opacity: 1; pointer-events: auto; }
              ${fadeEndPercent}% { opacity: 0; pointer-events: none; }
              100% { opacity: 0; pointer-events: none; }
            }
          `}</style>
        )}
        {ads.map((ad, index) => (
          <a
            key={ad.id}
            href={ad.linkUrl}
            target={ad.linkUrl.startsWith("http") ? "_blank" : undefined}
            rel={ad.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
            style={
              animated
                ? {
                    animation: `cars-sidebar-fade ${totalSeconds}s ease-in-out infinite`,
                    animationDelay: `${-(index * perSlideSeconds)}s`,
                  }
                : undefined
            }
            className={`absolute inset-0 block h-full w-full ${
              animated ? "group-hover:[animation-play-state:paused]" : ""
            }`}
          >
            {ad.imageUrl ? (
              <Image src={ad.imageUrl} alt={ad.advertiserName} fill sizes="300px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-6 text-center">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  {ad.heading ?? ad.advertiserName}
                </span>
                {ad.bodyText && <span className="text-sm text-ink-soft/75">{ad.bodyText}</span>}
              </div>
            )}
          </a>
        ))}
      </div>
    </aside>
  );
}
