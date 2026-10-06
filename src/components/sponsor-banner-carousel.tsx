// src/components/sponsor-banner-carousel.tsx
// One banner slot above the homepage hero, showing exactly one
// advertiser at a time — cross-fades to the next on a timer. Pure CSS
// (no JS): slides are stacked on top of each other and each gets the
// same shared keyframe, offset by a negative animation-delay so they
// take turns being the visible one. The keyframe's percentage
// breakpoints are computed here (not hardcoded) so the timing stays
// correct regardless of how many slides exist.
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
    imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/_site/banners/ucg-logo.png`,
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
    <div className="w-full border-b border-canvas-deep bg-canvas py-3">
      <div className="group relative mx-auto h-16 max-w-[640px] px-8">
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
            className={`flex h-16 items-center justify-center rounded-md border border-dashed border-brass/50 bg-brass/8 px-4 text-center transition-colors hover:border-brass hover:bg-brass/15 ${
              animated ? "absolute inset-x-0 group-hover:[animation-play-state:paused]" : ""
            }`}
          >
            {slide.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
              <img src={slide.imageUrl} alt={slide.alt} className="h-full w-auto object-contain" />
            ) : (
              <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-brass-deep">
                {slide.heading}
                {slide.body && <span className="block normal-case tracking-normal text-ink-soft">{slide.body}</span>}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
