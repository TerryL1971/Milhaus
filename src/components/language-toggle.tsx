// src/components/language-toggle.tsx
// The DE/EN button in the header — always shows the *other* language's
// code (EN on German pages, DE on English pages) and switches to it on the
// same page. A small client component (not part of SiteHeader itself)
// because building the cross-locale link needs the current pathname, and
// next-intl only exposes that via a client hook.

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function LanguageToggle({
  className,
  preservePath = true,
}: {
  className?: string;
  // false on pages outside the [locale] segment (currently just /admin —
  // see src/app/admin/layout.tsx). usePathname() there returns the bare
  // "/admin"-style path, and next-intl has no way to know that path has no
  // German counterpart: it would happily build /de/admin/..., which 404s
  // (confirmed by hand — clicked DE from /admin, then "+ Add listing",
  // landed on a real 404). Sending the toggle to the homepage instead is
  // the honest option: there's nowhere translated to preserve.
  preservePath?: boolean;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const other = locale === "en" ? "de" : "en";
  const t = useTranslations("SiteHeader");

  return (
    <Link
      href={preservePath ? pathname : "/"}
      locale={other}
      className={className}
      aria-label={t("languageToggle")}
    >
      {other.toUpperCase()}
    </Link>
  );
}
