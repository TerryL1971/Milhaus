// src/components/sponsor-banner-carousel.tsx
// One continuously scrolling banner strip, sitting above the homepage
// hero — replaces the four separate per-card "Sponsored spot" banners
// that used to live on the category cards further down the page. Pure
// CSS animation (@keyframes marquee in globals.css), no JS: the slide
// list is repeated to fill the strip, then that whole set is duplicated
// once more so the scroll loops with no visible seam. Hovering pauses it
// (standard marquee behavior — lets someone actually read/click a slide).
//
// Only one real slide exists right now (no sponsors signed up yet); add
// more entries to SLIDES once Charlie actually sells a spot; cta/href
// let this be reused for that without changing the plumbing below.

type Slide = {
  cta: string;
  href: string;
};

const SLIDES: Slide[] = [
  { cta: "Advertise here — click to find out how", href: "mailto:hello@example.com?subject=Advertising%20on%20Milhaus" },
];

// Repeated so the strip reads as a continuous ribbon even with only one
// real slide, rather than one banner with a huge empty gap before it
// loops back around.
const REPEAT_COUNT = 6;

export function SponsorBannerCarousel() {
  const baseTrack = Array.from({ length: REPEAT_COUNT }, (_, i) => SLIDES[i % SLIDES.length]);
  const track = [...baseTrack, ...baseTrack];

  return (
    <div className="w-full border-b border-canvas-deep bg-canvas py-3">
      <div className="group mx-auto max-w-[1400px] overflow-hidden px-8">
        <div className="flex w-max animate-[marquee_34s_linear_infinite] gap-5 group-hover:[animation-play-state:paused]">
          {track.map((slide, index) => (
            <a
              key={index}
              href={slide.href}
              className="flex h-12 w-[300px] flex-none items-center justify-center rounded-md border border-dashed border-brass/50 bg-brass/8 px-4 text-center transition-colors hover:border-brass hover:bg-brass/15"
            >
              <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-brass-deep">
                {slide.cta}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
