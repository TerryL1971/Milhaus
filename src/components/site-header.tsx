// src/components/site-header.tsx
// Sticky nav bar — ported from the "NAV" section of
// /design-reference/milhaus-landing-mockup.html. Async server component:
// reads the session on every request to swap "Sign in" for the signed-in
// state, so it's never stale the way a client-fetched version could be.

import { getTranslations } from "next-intl/server";
import Image from "next/image";
import NextLink from "next/link";
import { Avatar } from "@/components/avatar";
import { HomeLink } from "@/components/home-link";
import { LanguageToggle } from "@/components/language-toggle";
import { MobileNavToggle } from "@/components/mobile-nav-toggle";
import { Link } from "@/i18n/navigation";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

// Cream (text-paper), matching the logo wordmark and every other nav
// link/button — these two (DE/Admin) used to be the one red (text-brass)
// pair in an otherwise all-cream header, which read as inconsistent
// rather than intentional (unlike Post An Ad/Sign In's solid brass
// background, the site's one deliberate primary-CTA accent).
const toggleButtonClass =
  "rounded-md border border-paper/35 px-4 py-2 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70";

export async function SiteHeader({ translatedPage = true }: { translatedPage?: boolean } = {}) {
  const t = await getTranslations("SiteHeader");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let accountName = "";
  let accountPhotoUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name, photo_url")
      .eq("id", user.id)
      .single();
    isAdmin = isAdminRole(profile?.role);
    accountName = profile?.display_name ?? user.email ?? "?";
    accountPhotoUrl = profile?.photo_url ?? null;
  }

  return (
    <header className="sticky top-0 z-50 bg-ink text-paper">
      <div className="relative mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-8 py-[18px]">
        <HomeLink className="flex flex-shrink-0 items-center">
          {/* h-7, not h-10, below md — this logo file is a ~8.5:1 wide
              lockup; at h-10 it renders ~338px wide, which alone exceeds
              the ~329px of content width a typical phone viewport has
              left after this header's own px-8 padding. flex-shrink-0
              (needed so desktop's nav/buttons don't squeeze the logo)
              meant it held that full width regardless, pushing
              MobileNavToggle's hamburger button off-screen entirely
              rather than just tight against it — not a hidden/non-
              rendering button, an overflowing one. h-7 (~237px wide)
              leaves comfortable room for the button beside it even on
              the narrowest common phone widths. */}
          <Image
            src="/brand/milhaus-logo-cream-red-horizontal.png"
            alt="Milhaus"
            width={1994}
            height={236}
            priority
            className="h-7 w-auto md:h-10"
          />
        </HomeLink>

        {/* Trimmed from 6 items to 4 — "List your home" and "For
            landlords" moved to the footer only. Fewer, clearer choices is
            itself a discoverability win, on top of the hero's unified
            search being the primary way to find something now. Events
            added back as a 5th per Charlie's ideas slide (2026-10-14). */}
        <nav className="hidden gap-6 whitespace-nowrap text-[0.92rem] font-medium md:flex">
          <Link href="/listings" className="opacity-85 transition-opacity hover:opacity-100">
            {t("homes")}
          </Link>
          <Link href="/cars" className="opacity-85 transition-opacity hover:opacity-100">
            {t("cars")}
          </Link>
          <Link href="/products" className="opacity-85 transition-opacity hover:opacity-100">
            {t("buySell")}
          </Link>
          <Link href="/services" className="opacity-85 transition-opacity hover:opacity-100">
            {t("services")}
          </Link>
          <Link href="/events" className="opacity-85 transition-opacity hover:opacity-100">
            {t("events")}
          </Link>
        </nav>

        <div className="hidden flex-shrink-0 items-center gap-3 md:flex">
          {/* Same slot/style as the Admin link — DE/EN always shows here;
              Admin joins it alongside for admins, rather than replacing it. */}
          <LanguageToggle className={toggleButtonClass} preservePath={translatedPage} />
          {user ? (
            <>
              {/* Plain next/link, not the i18n one — /admin sits outside
                  the [locale] segment entirely (see src/app/admin/layout.tsx),
                  so it shouldn't get a locale prefix. */}
              {isAdmin && (
                <NextLink href="/admin" className={toggleButtonClass}>
                  {t("admin")}
                </NextLink>
              )}
              {/* The avatar doubles as the way into /my-listings — a
                  compact circle instead of the email text this replaced,
                  so it also works as the "click the poster" affordance
                  pattern used elsewhere (SellerCard, /sellers/[id]). */}
              <Link href="/my-listings" title={accountName} className="opacity-85 hover:opacity-100">
                <Avatar name={accountName} photoUrl={accountPhotoUrl} size="sm" />
              </Link>
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="rounded-md border border-paper/35 px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
                >
                  {t("signOut")}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* "Browse listings" is now covered by the nav's "Homes" link
                  (and the hero's own unified search); this slot is a single
                  prominent CTA instead — one click to a chooser between the
                  four post flows, matching the "Post an Ad" button Charlie
                  asked for. Outlined, not solid — the mockup's solid-red
                  treatment is reserved for "Log In", the one action that
                  should draw the eye most when logged out. */}
              {/* text-base, not text-sm — Charlie's "Big Letters" ask
                  (his ideas slide) for these two specifically; every
                  other nav link/button stays at its existing size. */}
              <Link
                href="/post-ad"
                className="rounded-md border border-paper/35 px-5 py-2.5 text-base font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
              >
                {t("postAd")}
              </Link>
              <Link
                href="/sign-in"
                className="rounded-md bg-brass px-5 py-2.5 text-base font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
              >
                {t("signIn")}
              </Link>
            </>
          )}
          {user && (
            <Link
              href="/post-ad"
              className="rounded-md border border-paper/35 px-5 py-2.5 text-base font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
            >
              {t("postAd")}
            </Link>
          )}
        </div>

        <MobileNavToggle
          translatedPage={translatedPage}
          isAdmin={isAdmin}
          isSignedIn={!!user}
          accountName={accountName}
          accountPhotoUrl={accountPhotoUrl}
        />
      </div>
    </header>
  );
}
