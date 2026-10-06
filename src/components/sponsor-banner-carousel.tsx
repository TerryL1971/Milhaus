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
// creative AT that canvas size.
//
// Each slide fills the box edge to edge with its own background —
// no dashed border, no translucent "placeholder" tint. An earlier
// version used a bare logo on a wireframe-looking dashed box and it
// read as broken/unfinished (a real banner, like BooKoo's UCG ad,
// is a flush rectangle with its own designed background, not a logo
// floating in empty space). SLIDES below is a mock-up for Charlie to
// see the carousel effect, not real paid placements yet: UCG (Used
// Car Guys) is a real logo Terry provided directly for this demo; the
// other two businesses are invented placeholders. Swap/extend this
// list once real advertisers sign up — a real advertiser would ideally
// hand over a full 728×90 creative rather than just a logo, at which
// point its slide can just be the `image` kind with no heading/cta.

type Slide =
  | {
      kind: "image";
      imageUrl: string;
      alt: string;
      href: string;
      heading: string;
      cta: string;
    }
  | { kind: "block"; heading: string; body: string; href: string; tone: "olive" | "ink" | "rust" };

const SLIDES: Slide[] = [
  {
    kind: "image",
    // Cropped tight to the lockup (trims the wide white margin the
    // source file had above/below it).
    imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/_site/banners/ucg-logo-cropped.png`,
    alt: "UCG Used Car Guys — usedcarguys.net",
    href: "https://www.usedcarguys.net",
    heading: "The easy way to sell your car in Stuttgart",
    cta: "Sell My Car",
  },
  {
    kind: "block",
    heading: "Kaiserslautern Auto Detailing",
    body: "Full details & PCS prep — mention Milhaus for 10% off",
    href: "#",
    tone: "olive",
  },
  {
    kind: "block",
    heading: "Ramstein Movers Express",
    body: "Door to door, stateside to Germany",
    href: "#",
    tone: "ink",
  },
  {
    kind: "block",
    heading: "Advertise here",
    body: "Click to find out how",
    href: "mailto:hello@example.com?subject=Advertising%20on%20Milhaus",
    tone: "rust",
  },
];

const TONE_CLASSES: Record<"olive" | "ink" | "rust", string> = {
  olive: "bg-olive text-paper",
  ink: "bg-ink text-paper",
  rust: "bg-rust text-paper",
};

const VISIBLE_SECONDS = 6;
const FADE_SECONDS = 1;

export function SponsorBannerCarousel() {
  const perSlideSeconds = VISIBLE_SECONDS + FADE_SECONDS;
  const totalSeconds = SLIDES.length * perSlideSeconds;
  const visiblePercent = (VISIBLE_SECONDS / totalSeconds) * 100;
  const fadeEndPercent = (perSlideSeconds / totalSeconds) * 100;
  const animated = SLIDES.length > 1;

  return (
    <div className="w-full py-4">
      {/* No background/border on this wrapper on purpose — each slide
          below carries its own full-bleed background, so this strip
          should otherwise be invisible against the page behind it.
          aspect-[728/90] keeps the real Leaderboard proportions at any
          screen width, capped at the actual 728px the standard calls
          for so it never scales up past that on a wide desktop. Padding
          lives on this outer div, not the `relative` one below — an
          absolutely positioned child measures `inset-0` from its
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
              className={`absolute inset-0 flex items-center overflow-hidden rounded-md shadow-sm ring-1 ring-black/5 ${
                slide.kind === "image" ? "justify-between gap-4 bg-paper px-5" : "justify-center px-5 " + TONE_CLASSES[slide.tone]
              } ${animated ? "group-hover:[animation-play-state:paused]" : ""}`}
            >
              {slide.kind === "image" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL */}
                  <img src={slide.imageUrl} alt={slide.alt} className="h-9 w-auto flex-shrink-0 object-contain" />
                  <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-ink sm:text-base">
                    {slide.heading}
                  </span>
                  <span className="flex-shrink-0 rounded-full bg-rust px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-paper">
                    {slide.cta}
                  </span>
                </>
              ) : (
                <span className="text-center font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                  {slide.heading}
                  {slide.body && <span className="block normal-case tracking-normal opacity-85">{slide.body}</span>}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
