// src/components/site-header.tsx
// Sticky nav bar — ported from the "NAV" section of
// /design-reference/milhaus-landing-mockup.html.

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-ink text-paper">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-[18px]">
        <Link
          href="/"
          className="flex items-baseline gap-0.5 font-display text-2xl font-bold tracking-tight"
        >
          milhaus<span className="text-brass">.</span>
        </Link>

        <nav className="hidden gap-7 text-[0.92rem] font-medium md:flex">
          <Link href="/#listings" className="opacity-85 transition-opacity hover:opacity-100">
            Browse listings
          </Link>
          <Link href="/#how" className="opacity-85 transition-opacity hover:opacity-100">
            List your home
          </Link>
          <Link href="#" className="opacity-85 transition-opacity hover:opacity-100">
            For landlords
          </Link>
        </nav>

        <div className="flex items-center gap-4.5">
          <Link
            href="/sign-in"
            className="rounded-md border border-paper/35 px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
          >
            Sign in
          </Link>
          <Link
            href="/#listings"
            className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            Browse listings
          </Link>
        </div>
      </div>
    </header>
  );
}
