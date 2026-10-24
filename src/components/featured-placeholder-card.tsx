// src/components/featured-placeholder-card.tsx
// Fills out a homepage "Featured X" row to 3 cards when real inventory is
// thin (a brand-new launch, or just a slow week) — so Charlie sees the
// section's real layout from day one instead of it vanishing. Same
// dashed-border "empty slot" treatment as ListingsGrid's own
// PlaceholderCard, just sized to the homepage's shared 16:9 featured-card
// aspect instead of the browse grid's taller card.

import { Link } from "@/i18n/navigation";

export function FeaturedPlaceholderCard({
  heading,
  body,
  ctaLabel,
  ctaHref,
}: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-canvas-deep bg-canvas/40 p-6 text-center">
      <p className="font-display text-base font-semibold text-ink">{heading}</p>
      <p className="text-sm text-ink-soft">{body}</p>
      <Link href={ctaHref} className="mt-2 text-sm font-semibold text-olive-deep hover:underline">
        {ctaLabel} →
      </Link>
    </div>
  );
}
