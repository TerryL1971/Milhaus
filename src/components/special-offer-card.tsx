// src/components/special-offer-card.tsx
// A single card in the homepage's "Special Offers" row — same 300x600
// "Half Page Ad" sizing as /cars' own sidebar ad slot (Charlie's own
// comparison), but shown as a static row of up to 3 at once rather than
// CarsSidebarBanner's single rotating slot. These are "special
// promotions," Charlie's own distinction from the site's banner ads, so
// no cross-fade/carousel here — same AdSlot shape (image, or a plain
// heading/body text fallback) as every other ad placement.

import Image from "next/image";
import type { AdSlot } from "@/lib/ad-slots";

export function SpecialOfferCard({ offer, priority }: { offer: AdSlot; priority?: boolean }) {
  return (
    <a
      href={offer.linkUrl}
      target={offer.linkUrl.startsWith("http") ? "_blank" : undefined}
      rel={offer.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
      // Literal 300x600, not a responsive aspect-ratio box — Charlie's
      // ask was the actual fixed size of the /cars sidebar ad, not just
      // its proportions stretched to fill a grid column.
      className="block h-[600px] w-[300px] flex-shrink-0 overflow-hidden rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
    >
      {offer.imageUrl ? (
        <div className="relative h-full w-full">
          <Image
            src={offer.imageUrl}
            alt={offer.advertiserName}
            fill
            sizes="300px"
            className="object-cover"
            priority={priority}
          />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-6 text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            {offer.heading ?? offer.advertiserName}
          </span>
          {offer.bodyText && <span className="text-sm text-ink-soft/75">{offer.bodyText}</span>}
        </div>
      )}
    </a>
  );
}
