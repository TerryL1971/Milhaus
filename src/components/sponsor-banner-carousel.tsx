// src/components/sponsor-banner-carousel.tsx
// One full-width banner slot above the homepage hero, showing exactly
// one advertiser at a time — cross-fades to the next on a timer once
// there's more than one. Pure CSS (no JS): slides are stacked on top of
// each other and each gets the same shared keyframe, offset by a
// negative animation-delay so they take turns being the visible one.
// The keyframe's percentage breakpoints are computed here (not
// hardcoded) so the timing stays correct regardless of how many slides
// exist — add more entries to SLIDES once Charlie actually sells a spot.

type Slide = {
  cta: string;
  href: string;
};

const SLIDES: Slide[] = [
  { cta: "Advertise here — click to find out how", href: "mailto:hello@example.com?subject=Advertising%20on%20Milhaus" },
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
      <div className="group relative mx-auto h-14 max-w-[1400px] px-8">
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
            style={
              animated
                ? {
                    animation: `sponsor-carousel-fade ${totalSeconds}s ease-in-out infinite`,
                    animationDelay: `${-(index * perSlideSeconds)}s`,
                  }
                : undefined
            }
            className={`flex h-14 items-center justify-center rounded-md border border-dashed border-brass/50 bg-brass/8 px-4 text-center transition-colors hover:border-brass hover:bg-brass/15 ${
              animated ? "absolute inset-x-8 group-hover:[animation-play-state:paused]" : ""
            }`}
          >
            <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-brass-deep">
              {slide.cta}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
