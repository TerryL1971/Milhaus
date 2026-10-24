// src/components/sponsor-banner-carousel.tsx
// One banner slot above the homepage hero (and every other category
// page's grid), showing exactly one advertiser at a time — cross-fades
// to the next on a timer. Pure CSS (no JS): slides are stacked on top of
// each other and each gets the same shared keyframe, offset by a
// negative animation-delay so they take turns being the visible one.
// The keyframe's percentage breakpoints are computed here (not
// hardcoded) so the timing stays correct regardless of how many slides
// exist.
//
// Full width of the page's own content container (max-w-[1600px], same
// as the nav/hero/grid everywhere else on the site) with a fixed height
// — per Charlie's frontpage mockup, where the ad spans edge to edge the
// same as everything else on the page, not a small centered box (an
// earlier version sized this to the IAB "Full Banner" standard, 468px
// wide; that's the right size for a small sidebar-style unit, not a
// full-width banner like the mockup shows). Real advertisers design
// their creative at roughly this shape and supply it as a single image;
// the slot itself has no background, border, or other chrome of its
// own — whatever the advertiser's image looks like (solid background
// baked in, or transparent) is exactly what shows.
//
// Slides come from the ad_slots table now (Charlie manages them at
// /admin/ads) instead of a hardcoded array — falls back to a single
// "Advertise here" placeholder slide when he hasn't added any yet,
// rather than showing an empty strip.

import Image from "next/image";
import { getActiveAdSlots } from "@/lib/ad-slots-queries";

type Slide =
  | { kind: "image"; imageUrl: string; alt: string; href: string }
  | { kind: "text"; heading: string; body: string; href: string };

const FALLBACK_SLIDE: Slide = {
  kind: "text",
  heading: "Advertise here",
  body: "Click to find out how",
  href: "mailto:info@milhaus.de?subject=Advertising%20on%20Milhaus",
};

const VISIBLE_SECONDS = 6;
const FADE_SECONDS = 1;

export async function SponsorBannerCarousel() {
  const ads = await getActiveAdSlots("site_banner");
  const slides: Slide[] =
    ads.length > 0
      ? ads.map((ad) =>
          ad.imageUrl
            ? { kind: "image", imageUrl: ad.imageUrl, alt: ad.advertiserName, href: ad.linkUrl }
            : { kind: "text", heading: ad.heading ?? ad.advertiserName, body: ad.bodyText ?? "", href: ad.linkUrl },
        )
      : [FALLBACK_SLIDE];

  const perSlideSeconds = VISIBLE_SECONDS + FADE_SECONDS;
  const totalSeconds = slides.length * perSlideSeconds;
  const visiblePercent = (VISIBLE_SECONDS / totalSeconds) * 100;
  const fadeEndPercent = (perSlideSeconds / totalSeconds) * 100;
  const animated = slides.length > 1;

  return (
    <div className="w-full bg-canvas py-2">
      {/* bg-canvas is explicit here on purpose — floating this row on the
          hero photo (tried that) meant no background of its own, but
          Terry wanted the small cream strip back. py-2 keeps that strip
          tight to the ad's own height rather than a tall band.
          max-w-[1600px] matches the content container everywhere else on
          the site, so the banner spans the full page width; h-20/h-24
          (not an aspect-ratio lock) keeps the height modest and fixed
          regardless of how wide the container gets. Padding lives on
          this outer div, not the `relative` one below — an absolutely
          positioned child measures `inset-0` from its ancestor's padding
          edge, not its content edge, so padding on the `relative`
          element itself wouldn't actually inset anything. */}
      <div className="mx-auto max-w-[1600px] px-8">
        <div className="group relative h-20 w-full sm:h-24">
          {animated && (
            <style>{`
              @keyframes sponsor-carousel-fade {
                0% { opacity: 1; pointer-events: auto; }
                ${visiblePercent}% { opacity: 1; pointer-events: auto; }
                ${fadeEndPercent}% { opacity: 0; pointer-events: none; }
                100% { opacity: 0; pointer-events: none; }
              }
            `}</style>
          )}
          {slides.map((slide, index) => (
            <a
              key={index}
              href={slide.href}
              target={slide.href.startsWith("http") ? "_blank" : undefined}
              rel={slide.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={
                animated
                  ? {
                      animation: `sponsor-carousel-fade ${totalSeconds}s ease-in-out infinite`,
                      animationDelay: `${-(index * perSlideSeconds)}s`,
                    }
                  : undefined
              }
              className={`absolute inset-0 flex items-center justify-center overflow-hidden text-center ${
                animated ? "group-hover:[animation-play-state:paused]" : ""
              }`}
            >
              {slide.kind === "image" ? (
                // No background/border — whatever the advertiser's image looks
                // like (solid background baked in, or transparent) is the ad.
                <Image src={slide.imageUrl} alt={slide.alt} fill sizes="100vw" className="object-contain py-0.5" />
              ) : (
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  {slide.heading}
                  {slide.body && <span className="block normal-case tracking-normal opacity-75">{slide.body}</span>}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
