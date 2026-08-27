// src/components/language-toggle.tsx
// The DE/EN button in the header — always shows the *other* language's
// code (EN on German pages, DE on English pages) and switches to it on the
// same page. A small client component (not part of SiteHeader itself)
// because building the cross-locale link needs the current pathname, and
// next-intl only exposes that via a client hook.

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function LanguageToggle({ className }: { className?: string }) {
  const pathname = usePathname();
  const locale = useLocale();
  const other = locale === "en" ? "de" : "en";
  const t = useTranslations("SiteHeader");

  return (
    <Link href={pathname} locale={other} className={className} aria-label={t("languageToggle")}>
      {other.toUpperCase()}
    </Link>
  );
}
