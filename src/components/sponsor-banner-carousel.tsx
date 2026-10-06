// src/components/sponsor-banner-carousel.tsx
// One banner slot above the homepage hero, showing exactly one
// advertiser at a time — cross-fades to the next on a timer. Pure CSS
// (no JS): slides are stacked on top of each other and each gets the
// same shared keyframe, offset by a negative animation-delay so they
// take turns being the visible one. The keyframe's percentage
// breakpoints are computed here (not hardcoded) so the timing stays
// correct regardless of how many slides exist.
//
// Sized to the IAB "Leaderboard" standard, 728×90px — the industry-
// standard size for exactly this placement (a banner across the top of
// a page), in use for 20+ years. Real advertisers should design their
// creative AT that canvas size; it'll fill the slot edge to edge with no
// letterboxing. A bare logo (like the UCG one below) is a stand-in for a
// real creative, not one itself — some empty space around it here is
// expected and fine for a mock-up, but a submitted ad should be the full
// 728×90 image, not just a logo file.
//
// SLIDES below is a mock-up for Charlie to see the carousel effect, not
// real paid placements yet: UCG (Used Car Guys) is a real logo Terry
// provided directly for this demo; the other two businesses are
// invented placeholders (no logos fabricated for them — just styled
// text, same spirit as the "Advertise here" slot). Swap/extend this list
// once real advertisers sign up.

type Slide =
  | { kind: "image"; imageUrl: string; alt: string; href: string }
  | { kind: "text"; heading: string; body: string; href: string };

const SLIDES: Slide[] = [
  {
    kind: "image",
    // Cropped tight to the lockup (trims the wide white margin the
    // source file had above/below it) so it fills more of the slot —
    // a bare logo still won't go edge to edge like a real 728×90
    // creative, but this gets it a lot closer.
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
    heading: "Advertise here — click to find out how",
    body: "",
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
    <div className="w-full py-3">
      {/* No background/border on this wrapper on purpose — an earlier
          version had one, and against the page's own canvas-colored
          background it read as a second, much wider "banner" with the
          actual 728×90 ad box floating lost in the middle of it. The
          dashed box below is the only thing that should look like the
          ad slot. aspect-[728/90] keeps the real Leaderboard proportions
          at any screen width, capped at the actual 728px the standard
          calls for so it never scales up past that on a wide desktop.
          Padding lives on this outer div, not the `relative` one below —
          an absolutely positioned child measures `inset-0` from its
          ancestor's padding edge, not its content edge, so padding on
          the `relative` element itself wouldn't actually inset anything. */}
      <div className="mx-auto max-w-[728px] px-8">
        <div className="group relative aspect-[728/90] w-full">
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
              className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-md border border-dashed border-brass/50 bg-brass/8 px-4 text-center transition-colors hover:border-brass hover:bg-brass/15 ${
                animated ? "group-hover:[animation-play-state:paused]" : ""
              }`}
            >
              {slide.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
                <img src={slide.imageUrl} alt={slide.alt} className="h-full w-full object-contain p-1.5" />
              ) : (
                <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-brass-deep">
                  {slide.heading}
                  {slide.body && (
                    <span className="block normal-case tracking-normal text-ink-soft">{slide.body}</span>
                  )}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
