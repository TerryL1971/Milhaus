// src/app/[locale]/post-service/page.tsx
// Post a service — mirrors src/app/[locale]/post-product/page.tsx exactly
// (same auth gate, same redirect-back-after-sign-in), just pointed at
// ListingForm's kind="service" branch.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ListingForm } from "@/components/listing-form";
import { getPathname, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Offer a service",
  robots: { index: false, follow: false },
};

export default async function PostServicePage() {
  const t = await getTranslations("PostServicePage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    const nextPath = getPathname({ href: "/post-service", locale });
    redirect({ href: `/sign-in?next=${nextPath}`, locale });
  }

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-8 text-ink-soft">{t("body")}</p>
        <ListingForm variant="self-list" kind="service" />
      </div>
    </main>
  );
}
