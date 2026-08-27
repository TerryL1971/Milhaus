// src/app/[locale]/post/page.tsx
// Post-a-listing (build order step 6). Signed-in-only, always self-listed
// — housing-office listings are added by an admin instead, at
// /admin/listings/new (same form, different variant).

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ListingForm } from "@/components/listing-form";
import { getPathname, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "List your home",
  robots: { index: false, follow: false },
};

export default async function PostListingPage() {
  const t = await getTranslations("PostPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    const nextPath = getPathname({ href: "/post", locale });
    redirect({ href: `/sign-in?next=${nextPath}`, locale });
  }

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-8 text-ink-soft">{t("body")}</p>
        <ListingForm variant="self-list" />
      </div>
    </main>
  );
}
