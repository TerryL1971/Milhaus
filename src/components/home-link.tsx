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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function HomeLink({ className, children }: { className?: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      className={className}
      onClick={(event) => {
        if (pathname !== "/") return; // real navigation to "/" — let Link handle it normally
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.location.hash) {
          window.history.replaceState(null, "", "/");
        }
      }}
    >
      {children}
    </Link>
  );
}
