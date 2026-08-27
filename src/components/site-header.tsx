// src/components/site-header.tsx
// Sticky nav bar — ported from the "NAV" section of
// /design-reference/milhaus-landing-mockup.html. Async server component:
// reads the session on every request to swap "Sign in" for the signed-in
// state, so it's never stale the way a client-fetched version could be.

import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { HomeLink } from "@/components/home-link";
import { LanguageToggle } from "@/components/language-toggle";
import { Link } from "@/i18n/navigation";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

const toggleButtonClass =
  "rounded-md border border-brass/50 px-4 py-2 text-sm font-semibold text-brass transition-[transform,box-shadow] hover:-translate-y-px hover:border-brass";

export async function SiteHeader() {
  const t = await getTranslations("SiteHeader");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = isAdminRole(profile?.role);
  }

  return (
    <header className="sticky top-0 z-50 bg-ink text-paper">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-[18px]">
        <HomeLink className="flex items-baseline gap-0.5 font-display text-2xl font-bold tracking-tight">
          Milhaus<span className="text-brass">.</span>
        </HomeLink>

        <nav className="hidden gap-7 text-[0.92rem] font-medium md:flex">
          <Link href="/#listings" className="opacity-85 transition-opacity hover:opacity-100">
            {t("browseListings")}
          </Link>
          <Link href="/post" className="opacity-85 transition-opacity hover:opacity-100">
            {t("listYourHome")}
          </Link>
          <Link href="/for-landlords" className="opacity-85 transition-opacity hover:opacity-100">
            {t("forLandlords")}
          </Link>
        </nav>

        <div className="flex items-center gap-4.5">
          {/* Same slot/style as the Admin link — DE/EN always shows here;
              Admin joins it alongside for admins, rather than replacing it. */}
          <LanguageToggle className={toggleButtonClass} />
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
              <span className="hidden text-sm opacity-85 sm:inline">{user.email}</span>
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
            <Link
              href="/sign-in"
              className="rounded-md border border-paper/35 px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70"
            >
              {t("signIn")}
            </Link>
          )}
          <Link
            href="/#listings"
            className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("browseListings")}
          </Link>
        </div>
      </div>
    </header>
  );
}
