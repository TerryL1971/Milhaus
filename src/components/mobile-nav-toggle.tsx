// src/components/mobile-nav-toggle.tsx
// The hamburger menu for small screens — SiteHeader's nav links and
// right-side actions are both `hidden` below md with no mobile
// alternative at all today, so on a phone there's currently no way to
// reach Homes/Cars/Buy & sell/Services, or Sign in/Post an ad, from the
// header. This renders instead, `md:hidden`, as a dropdown panel under
// the sticky header with everything SiteHeader normally spreads across
// those two desktop clusters, stacked.
//
// "use client" only for the open/closed toggle — everything it displays
// (labels, links, isAdmin/account data) comes from SiteHeader's own
// server-side render as props, same data it already uses for the
// desktop version.

"use client";

import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { LanguageToggle } from "@/components/language-toggle";
import { Link } from "@/i18n/navigation";

const navLinkClass = "block py-2.5 text-[0.95rem] font-medium opacity-85 transition-opacity hover:opacity-100";
const actionLinkClass =
  "block rounded-md border border-paper/35 px-4 py-2.5 text-center text-sm font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:border-paper/70";
// "Post An Ad" and "Log In" specifically, per Charlie's "Big Letters" ask
// (his ideas slide) — bigger than the rest of this menu's action rows
// (Admin/My Listings/Sign out keep actionLinkClass as-is), same base
// style otherwise. A separate constant rather than appending text-base
// to actionLinkClass in the className string — Tailwind doesn't
// guarantee the later class in a concatenated string wins over an
// earlier conflicting one.
const ctaLinkClass = actionLinkClass.replace("text-sm", "text-base");

type MobileNavToggleProps = {
  translatedPage: boolean;
  isAdmin: boolean;
  isSignedIn: boolean;
  accountName: string;
  accountPhotoUrl: string | null;
};

export function MobileNavToggle({
  translatedPage,
  isAdmin,
  isSignedIn,
  accountName,
  accountPhotoUrl,
}: MobileNavToggleProps) {
  const t = useTranslations("SiteHeader");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-md border border-paper/35"
      >
        <span className={`h-[2px] w-5 bg-paper transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
        <span className={`h-[2px] w-5 bg-paper transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`h-[2px] w-5 bg-paper transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-t border-paper/15 bg-ink px-8 py-5 shadow-[0_14px_34px_rgba(0,0,0,0.25)]">
          <nav className="mb-4 flex flex-col divide-y divide-paper/10 border-b border-paper/10 pb-1 text-paper">
            <Link href="/listings" className={navLinkClass} onClick={close}>
              {t("homes")}
            </Link>
            <Link href="/cars" className={navLinkClass} onClick={close}>
              {t("cars")}
            </Link>
            <Link href="/products" className={navLinkClass} onClick={close}>
              {t("buySell")}
            </Link>
            <Link href="/services" className={navLinkClass} onClick={close}>
              {t("services")}
            </Link>
          </nav>

          <div className="flex flex-col gap-2.5">
            <LanguageToggle
              className="rounded-md border border-brass/50 px-4 py-2.5 text-center text-sm font-semibold text-brass transition-[transform,box-shadow] hover:-translate-y-px hover:border-brass"
              preservePath={translatedPage}
            />

            {isSignedIn ? (
              <>
                {isAdmin && (
                  <NextLink href="/admin" className={actionLinkClass} onClick={close}>
                    {t("admin")}
                  </NextLink>
                )}
                <Link href="/my-listings" className={`${actionLinkClass} flex items-center justify-center gap-2`} onClick={close}>
                  <Avatar name={accountName} photoUrl={accountPhotoUrl} size="sm" />
                  {accountName}
                </Link>
                <Link href="/post-ad" className={ctaLinkClass} onClick={close}>
                  {t("postAd")}
                </Link>
                <form action="/auth/sign-out" method="post">
                  <button type="submit" className={`${actionLinkClass} w-full`}>
                    {t("signOut")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/post-ad" className={ctaLinkClass} onClick={close}>
                  {t("postAd")}
                </Link>
                <Link
                  href="/sign-in"
                  className="block rounded-md bg-brass px-4 py-2.5 text-center text-base font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
                  onClick={close}
                >
                  {t("signIn")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
