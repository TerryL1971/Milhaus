// src/components/special-offer-card.tsx
// A single card in the homepage's "Special Offers" row and the
// /products ("Special Offers") page's own grid. First built at a literal
// 300x600 (exactly matching /cars' sidebar ad, per Charlie's own
// comparison) — Terry's follow-up: that read as too narrow next to the
// Homes/Cars/Services cards' own grid-column width, like a card was
// missing. Now as wide as those cards (stretches to fill its grid
// column, same as ListingCard/CarListingCard/BusinessCard), height still
// locked to 600px — the one dimension Charlie's sidebar-ad comparison
// was really about. These are "special promotions," Charlie's own
// distinction from the site's banner ads, so no cross-fade/carousel
// here — same AdSlot shape (image, or a plain heading/body text
// fallback) as every other ad placement.

import Image from "next/image";
import type { AdSlot } from "@/lib/ad-slots";

export function SpecialOfferCard({ offer, priority }: { offer: AdSlot; priority?: boolean }) {
  return (
    <a
      href={offer.linkUrl}
      target={offer.linkUrl.startsWith("http") ? "_blank" : undefined}
      rel={offer.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
      // Below sm: the spec'd ~500x600 (5:6) shape instead of a fixed 600px
      // at full phone width — that was a near-full-screen photo per card.
      className="block aspect-[5/6] w-full overflow-hidden sm:aspect-auto sm:h-[600px] rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
    >
      {offer.imageUrl ? (
        <div className="relative h-full w-full">
          <Image
            src={offer.imageUrl}
            alt={offer.advertiserName}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
