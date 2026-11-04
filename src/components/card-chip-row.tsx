// src/components/card-chip-row.tsx
// The one-line row of feature chips on a home's card (Terry, 2026-11-04:
// however many the lister highlights, the card shows one line). Measures
// the chips against the card's width and shows as many as fit, then a
// "+N more" chip for the rest — recomputed when the card resizes (grid
// columns change with the screen). Before it has measured (first paint)
// it shows the first three, same as the card always used to.

"use client";

import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";

const GAP_PX = 6; // gap-1.5
const chipClass = "whitespace-nowrap rounded-full bg-canvas px-2 py-0.5 text-[0.68rem] text-ink-soft";

export function CardChipRow({ chips }: { chips: { key: string; label: string }[] }) {
  const t = useTranslations("ListingCard");
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(Math.min(3, chips.length));

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    function fit() {
      const available = row!.clientWidth;
      const widths = [...measure!.children].map((child) => (child as HTMLElement).offsetWidth);
      const moreWidth = widths.pop() ?? 0; // the last measured chip is "+N more"
      let used = 0;
      let count = 0;
      for (const [index, width] of widths.entries()) {
        const next = used + (count > 0 ? GAP_PX : 0) + width;
        const restHidden = index < widths.length - 1;
        // Leave room for "+N more" unless this is the very last chip.
        if (next + (restHidden ? GAP_PX + moreWidth : 0) > available) break;
        used = next;
        count += 1;
      }
      setVisible(count);
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
  }, [chips]);

  if (chips.length === 0) return null;
  const hidden = chips.length - visible;

  return (
    <div className="relative mt-2">
      <div ref={rowRef} className="flex gap-1.5 overflow-hidden">
        {chips.slice(0, visible).map((chip) => (
          <span key={chip.key} className={chipClass}>
            {chip.label}
          </span>
        ))}
        {hidden > 0 && <span className={chipClass}>{t("moreAmenities", { count: hidden })}</span>}
      </div>
      {/* Off-screen copy of every chip (plus a "+N more" sized for the
          worst case) — what fit() measures. */}
      <div ref={measureRef} aria-hidden="true" className="invisible absolute left-0 top-0 flex gap-1.5">
        {chips.map((chip) => (
          <span key={chip.key} className={chipClass}>
            {chip.label}
          </span>
        ))}
        <span className={chipClass}>{t("moreAmenities", { count: chips.length })}</span>
      </div>
    </div>
  );
}
