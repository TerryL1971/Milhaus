// src/app/[locale]/post-product/page.tsx
// Post an item for sale — mirrors src/app/[locale]/post-car/page.tsx
// exactly (same auth gate, same redirect-back-after-sign-in), just pointed
// at ListingForm's kind="product" branch instead of the car fields.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ListingForm } from "@/components/listing-form";
import { PostingPriceNotice } from "@/components/posting-price-notice";
import { getPathname, redirect } from "@/i18n/navigation";
import { getPostingPriceForProfile } from "@/lib/listing-prices";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sell an item",
  robots: { index: false, follow: false },
};

export default async function PostProductPage() {
  const t = await getTranslations("PostProductPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    const nextPath = getPathname({ href: "/post-product", locale });
    redirect({ href: `/sign-in?next=${nextPath}`, locale });
    return;
  }

  const profile = await getProfile(user.id);
  const priceEur = await getPostingPriceForProfile("product", profile?.isIndividualLister ?? false);

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-8 text-ink-soft">{t("body")}</p>
        {priceEur !== null && <PostingPriceNotice priceEur={priceEur} />}
        <ListingForm variant="self-list" kind="product" priceEur={priceEur} />
      </div>
    </main>
  );
}
