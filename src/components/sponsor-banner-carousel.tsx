// src/components/sponsor-banner-carousel.tsx
// One banner slot above the homepage hero, showing exactly one
// advertiser at a time — cross-fades to the next on a timer. Pure CSS
// (no JS): slides are stacked on top of each other and each gets the
// same shared keyframe, offset by a negative animation-delay so they
// take turns being the visible one. The keyframe's percentage
// breakpoints are computed here (not hardcoded) so the timing stays
// correct regardless of how many slides exist.
//
// Sized to the IAB "Full Banner" standard, 468×60px — confirmed against
// BooKoo's own ad slot (inspected via devtools: their image renders at
// exactly 468×60, 39:5). Real advertisers design their creative AT that
// canvas size and supply it as a single image; the slot itself has no
// background, border, or other chrome of its own — whatever the
// advertiser's image looks like (solid background baked in, or
// transparent) is exactly what shows. Earlier versions composited a
// headline/CTA around the bare UCG logo and put every slide on a
// dashed-border or solid-color box — both were us inventing ad design
// that isn't ours to invent; a real placement is just the advertiser's
// own image, nothing added.
//
// SLIDES below is a mock-up for Charlie to see the carousel effect, not
// real paid placements yet: UCG (Used Car Guys) is a real logo Terry
// provided directly for this demo; the other two businesses are
// invented placeholders with no logo to show, so they fall back to
// plain text. Swap/extend this list once real advertisers sign up.

type Slide =
  | { kind: "image"; imageUrl: string; alt: string; href: string }
  | { kind: "text"; heading: string; body: string; href: string };

const SLIDES: Slide[] = [
  {
    kind: "image",
    // Cropped tight to the lockup (trims the wide white margin the
    // source file had above/below it).
    imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/_site/banners/ucg-logo-cropped.png`,
    alt: "UCG Used Car Guys — usedcarguys.net",
    href: "https://www.usedcarguys.net",
  },
  {
    kind: "text",
    heading: "Kaiserslautern Auto Detailing",
    body: "Full details & PCS prep — mention Milhaus for 10% off",
    href: "#",
  },
  {
    kind: "text",
    heading: "Ramstein Movers Express",
    body: "Door to door, stateside to Germany",
    href: "#",
  },
  {
    kind: "text",
    heading: "Advertise here",
    body: "Click to find out how",
    href: "mailto:hello@example.com?subject=Advertising%20on%20Milhaus",
  },
];

const VISIBLE_SECONDS = 6;
const FADE_SECONDS = 1;

export function SponsorBannerCarousel() {
  const perSlideSeconds = VISIBLE_SECONDS + FADE_SECONDS;
  const totalSeconds = SLIDES.length * perSlideSeconds;
  const visiblePercent = (VISIBLE_SECONDS / totalSeconds) * 100;
  const fadeEndPercent = (perSlideSeconds / totalSeconds) * 100;
  const animated = SLIDES.length > 1;

  return (
    <div className="w-full bg-canvas py-2">
      {/* bg-canvas is explicit here on purpose — floating this row on the
          hero photo (tried that) meant no background of its own, but
          Terry wanted the small cream strip back. py-2 keeps that strip
          tight to the ad's own height rather than a tall band.
          aspect-[468/60] is the IAB "Full Banner" standard (confirmed
          against BooKoo's own ad slot), capped at the actual 468px so
          it never scales up past that on a wide desktop. Padding lives
          on this outer div, not the `relative` one below — an
          absolutely positioned child measures `inset-0` from its
          ancestor's padding edge, not its content edge, so padding on
          the `relative` element itself wouldn't actually inset anything. */}
      <div className="mx-auto max-w-[468px] px-8">
        <div className="group relative aspect-[468/60] w-full">
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
          {SLIDES.map((slide, index) => (
            <a
              key={index}
              href={slide.href}
              target={slide.kind === "image" ? "_blank" : undefined}
              rel={slide.kind === "image" ? "noopener noreferrer" : undefined}
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
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
                <img src={slide.imageUrl} alt={slide.alt} className="h-full w-full object-contain py-0.5" />
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
