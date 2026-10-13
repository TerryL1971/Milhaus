// src/components/cars-sidebar-banner.tsx
// A single sidebar ad slot, /cars only (Charlie's ask) — not a carousel
// like SponsorBannerCarousel (the horizontal strip above every category
// page's grid); just one static slot, "ad space" as literally asked for.
// Sized to the IAB "Half Page Ad" standard (300x600) — the usual fit for
// a vertical sidebar slot, so a real advertiser's creative drops in
// without needing a custom size. Hidden below lg: no room for a sidebar
// at that width, and this page's grid already reflows to fewer columns.
//
// No real advertiser yet — AD below is a placeholder exactly like
// SponsorBannerCarousel's own "Advertise here" fallback slide. Swap it
// for a real { imageUrl, alt, href } once someone buys the spot.

type Ad = { kind: "placeholder" } | { kind: "image"; imageUrl: string; alt: string; href: string };

const AD: Ad = { kind: "placeholder" };

export function CarsSidebarBanner() {
  return (
    <aside className="hidden w-[300px] flex-shrink-0 lg:block">
      <div className="sticky top-[100px] h-[600px] w-[300px] overflow-hidden rounded-md border border-canvas-deep bg-paper">
        {AD.kind === "image" ? (
          <a href={AD.href} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- external advertiser image */}
            <img src={AD.imageUrl} alt={AD.alt} className="h-full w-full object-cover" />
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
