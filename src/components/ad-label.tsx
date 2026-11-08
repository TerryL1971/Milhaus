// src/components/ad-label.tsx
// The small "Ad" / "Anzeige" tag on every paid ad (site banner, Cars
// sidebar, Special Offers cards). German competition law (§ 5a UWG)
// requires paid advertising to be recognisable as advertising — legal
// check, 2026-11-08. Not shown on the "Advertise here" placeholder,
// which is Milhaus's own message, not someone's paid ad.

import { useTranslations } from "next-intl";

export function AdLabel({ className = "left-2 top-2" }: { className?: string }) {
  const t = useTranslations("AdLabel");
  return (
    <span
      className={`pointer-events-none absolute z-10 rounded-[3px] bg-black/55 px-1.5 py-0.5 font-body text-[0.6rem] font-semibold uppercase tracking-wider text-white ${className}`}
    >
      {t("label")}
    </span>
  );
}
