// src/components/site-header.tsx
// Sticky nav bar — ported from the "NAV" section of
// /design-reference/milhaus-landing-mockup.html. Async server component:
// reads the session on every request to swap "Sign in" for the signed-in
// state, so it's never stale the way a client-fetched version could be.

import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { Avatar } from "@/components/avatar";
import { HomeLink } from "@/components/home-link";
import { LanguageToggle } from "@/components/language-toggle";
import { Link } from "@/i18n/navigation";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

const toggleButtonClass =
  "rounded-md border border-brass/50 px-4 py-2 text-sm font-semibold text-brass transition-[transform,box-shadow] hover:-translate-y-px hover:border-brass";

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
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-8 py-[18px]">
        <HomeLink className="flex flex-shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, not worth next/image's config here */}
          <img src="/brand/milhaus-logo-cream-red-horizontal.png" alt="Milhaus" className="h-10 w-auto" />
        </HomeLink>

        {/* Trimmed from 6 items to 4 — "List your home" and "For
            landlords" moved to the footer only. Fewer, clearer choices is
            itself a discoverability win, on top of the hero's unified
            search being the primary way to find something now. */}
        <nav className="hidden gap-6 whitespace-nowrap text-[0.92rem] font-medium md:flex">
          <Link href="/#listings" className="opacity-85 transition-opacity hover:opacity-100">
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
        </nav>

        <div className="flex flex-shrink-0 items-center gap-3">
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
              <Link
                href="/post-ad"
                className="rounded-md border border-paper/35 px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
              >
                {t("postAd")}
              </Link>
              <Link
                href="/sign-in"
                className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
              >
                {t("signIn")}
              </Link>
            </>
          )}
          {user && (
            <Link
              href="/post-ad"
              className="rounded-md border border-paper/35 px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
            >
              {t("postAd")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
