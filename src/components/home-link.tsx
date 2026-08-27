// src/components/home-link.tsx
// The "Milhaus." logo link in SiteHeader. Split out as its own tiny client
// component so SiteHeader itself can stay a server component — only the
// logo needs interactivity.
//
// Bug this fixes: several nav links (Browse listings, the homepage CTA,
// "back to listings") point at "/#listings". Once you've landed on that
// hash, a plain <Link href="/"> back to the logo is same-route navigation
// as far as the router's concerned, so it doesn't reset scroll — you stay
// wherever the #listings anchor left you. Explicitly scroll to top (and
// strip the hash from the URL bar) whenever you're already on "/".
//
// Built before the i18n work and never revisited — used plain next/link,
// so clicking the logo from a German page silently dropped you to the
// bare (English) "/" instead of "/de". Reported directly: "click DE, then
// click on a new page, the new page is in English." Now uses the
// locale-aware Link/usePathname from @/i18n/navigation instead, so href="/"
// correctly resolves to "/de" while viewing a German page.

"use client";

import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";

export function HomeLink({ className, children }: { className?: string; children: ReactNode }) {
  const pathname = usePathname(); // locale-stripped — "/" on both "/" and "/de"

  return (
    <Link
      href="/"
      className={className}
      onClick={(event) => {
        if (pathname !== "/") return; // real navigation to "/" — let Link handle it normally
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }}
    >
      {children}
    </Link>
  );
}
