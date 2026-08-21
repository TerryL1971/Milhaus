// src/components/stamp-badge.tsx
// The "stamp" — milhaus's signature trust signal marking a listing as
// sourced from the on-base housing office. Ported from the ".stamp" rule
// in /design-reference/milhaus-landing-mockup.html. Used on the hero card
// fan and the listing detail page, at two sizes.
//
// Position is entirely the caller's responsibility via `className` (e.g.
// "right-2.5 top-2.5") — it isn't baked in here, since a fixed default
// would just collide with a caller's override: Tailwind classes have equal
// specificity, so which one wins depends on generated CSS order, not JSX
// order, making "append an overriding className" unreliable for anything
// this component already sets.

const SIZES = {
  md: { box: "h-13 w-13", text: "text-[0.5rem]" },
  lg: { box: "h-16 w-16", text: "text-[0.62rem]" },
};

export function StampBadge({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { box, text } = SIZES[size];
  return (
    <div
      className={`absolute flex ${box} -rotate-12 items-center justify-center rounded-full border-2 border-dashed border-olive bg-paper/90 ${className}`}
    >
      <span
        className={`text-center font-mono ${text} font-semibold uppercase leading-tight tracking-wide text-olive-deep`}
      >
        Housing
        <br />
        Office
      </span>
    </div>
  );
}
