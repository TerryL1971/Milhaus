// src/components/site-header.tsx
// Sticky nav bar — ported from the "NAV" section of
// /design-reference/milhaus-landing-mockup.html. Async server component:
// reads the session on every request to swap "Sign in" for the signed-in
// state, so it's never stale the way a client-fetched version could be.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          <Link href="/post" className="opacity-85 transition-opacity hover:opacity-100">
            List your home
          </Link>
          <Link href="#" className="opacity-85 transition-opacity hover:opacity-100">
            For landlords
          </Link>
        </nav>

        <div className="flex items-center gap-4.5">
          {user ? (
            <>
              <span className="hidden text-sm opacity-85 sm:inline">{user.email}</span>
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="rounded-md border border-paper/35 px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-md border border-paper/35 px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
            >
              Sign in
            </Link>
          )}
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
