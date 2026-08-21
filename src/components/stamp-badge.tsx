// src/components/stamp-badge.tsx
// The "stamp" — milhaus's signature trust signal marking a listing as
// sourced from the on-base housing office. Ported from the ".stamp" rule
// in /design-reference/milhaus-landing-mockup.html. Used on the hero card
// fan here, and reused on the listing detail page.

export function StampBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute right-2.5 top-2.5 flex h-13 w-13 -rotate-12 items-center justify-center rounded-full border-2 border-dashed border-olive bg-paper/90 ${className}`}
    >
      <span className="text-center font-mono text-[0.5rem] font-semibold uppercase leading-tight tracking-wide text-olive-deep">
        Housing
        <br />
        Office
      </span>
    </div>
  );
}
