// src/components/placeholder-card.tsx
// An invitation card that fills an empty spot in a homepage row ("Your
// home could be here — Post a home"). Terry's ask, 2026-11-14, the night
// the demo content came off the live site: the rows had been full of demo
// cards, and he wanted placeholders where they were, so a new site doesn't
// look empty. Each row shows CARDS_PER_ROW spots; real posts fill them
// first and these fill the rest, so they disappear one by one as real
// posts arrive. The whole card links to posting in that category.
//
// Same size as the real cards beside it (pass the same aspect class), with
// a dashed border so it reads as an empty spot, not a listing.
//
// Replaces ComingSoonPanel (one wide "Featured Homes coming soon" box per
// empty row, 2026-10-24), which showed only when a row was completely
// empty and left half-empty rows with gaps.

import { Link } from "@/i18n/navigation";

export type PlaceholderKind = "home" | "car" | "business" | "offer";

const ICONS: Record<PlaceholderKind, string> = {
  // Outline icons, 24×24 (Heroicons-style strokes).
  home: "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5",
  car: "M3 13 5 7.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Zm0 0h18M7 16h.01M17 16h.01",
  business: "M3 9.5 4.5 4h15L21 9.5M3 9.5h18M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5",
  offer: "M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1Zm12-1.5a4 4 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12",
};

/** Which empty spots to show at each screen width, as class names, one per
 * spot after the real ones. Phones show one card per line, so a single
 * invitation only when the row has no real posts at all (four stacked
 * invitations is a lot of scrolling). Two-across screens fill out the last
 * pair. Wide screens fill the row to `perRow`. */
export function placeholderSpots(realCount: number, perRow: number): string[] {
  const spots: string[] = [];
  for (let position = realCount; position < perRow; position++) {
    const phone = realCount === 0 && position === 0;
    const twoAcross = position < Math.max(2, Math.ceil(realCount / 2) * 2);
    spots.push(`${phone ? "flex" : "hidden"} ${twoAcross ? "sm:flex" : "sm:hidden"} xl:flex`);
  }
  return spots;
}

export function PlaceholderCard({
  kind,
  href,
  heading,
  body,
  cta,
  aspectClassName,
  tall = false,
  className = "flex",
}: {
  kind: PlaceholderKind;
  href: string;
  heading: string;
  body: string;
  cta: string;
  /** The real cards' photo shape, e.g. "aspect-[16/9]". */
  aspectClassName?: string;
  /** Special Offers cards are one tall image (600px) rather than photo + text. */
  tall?: boolean;
  /** Visibility per screen width, from placeholderSpots(). */
  className?: string;
}) {
  const icon = (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper text-brass ring-1 ring-canvas-deep">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path d={ICONS[kind]} />
      </svg>
    </span>
  );
  const text = (
    <>
      <p className="font-display text-[1.05rem] font-semibold leading-snug text-ink">{heading}</p>
      <p className="mt-1 text-[0.82rem] leading-snug text-ink-soft">{body}</p>
      <p className="mt-3 text-sm font-semibold text-brass group-hover:underline">{cta} →</p>
    </>
  );

  return (
    <Link
      href={href}
      className={`${className} group h-full flex-col overflow-hidden rounded-md border border-dashed border-ink-soft/30 bg-canvas/60 transition-[box-shadow,transform,border-color] hover:-translate-y-0.5 hover:border-brass/60 hover:shadow-[0_12px_28px_rgba(27,42,58,0.10)] ${
        tall ? "aspect-[5/6] w-full items-center justify-center p-8 text-center sm:aspect-auto sm:h-[600px]" : ""
      }`}
    >
      {tall ? (
        <>
          {icon}
          <div className="mt-4">{text}</div>
        </>
      ) : (
        <>
          <div className={`flex items-center justify-center bg-canvas-deep/40 ${aspectClassName ?? "aspect-[16/9]"}`}>{icon}</div>
          <div className="px-4 pb-4 pt-3.5">{text}</div>
        </>
      )}
    </Link>
  );
}
