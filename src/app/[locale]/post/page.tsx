// src/app/[locale]/post/page.tsx
// Post-a-listing (build order step 6). Signed-in-only, always
// self-listed — an admin can also add one directly at
// /admin/listings/new (same form, different variant). ?for=sale posts a
// home for sale instead of for rent, at its own posting price.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ListingForm } from "@/components/listing-form";
import { PostingPriceNotice } from "@/components/posting-price-notice";
import { getPathname, redirect } from "@/i18n/navigation";
import { getPostingPriceForProfile } from "@/lib/listing-prices";
import { getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "List your home",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ for?: string }>;

export default async function PostListingPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("PostPage");
  const forSale = (await searchParams).for === "sale";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    const nextPath = getPathname({ href: forSale ? "/post?for=sale" : "/post", locale });
    redirect({ href: `/sign-in?next=${nextPath}`, locale });
    return;
  }

  const profile = await getProfile(user.id);
  const priceEur = await getPostingPriceForProfile(forSale ? "rental_sale" : "rental", profile?.isIndividualLister ?? false);

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">
          {forSale ? t("saleHeading") : t("heading")}
        </h1>
        <p className="mb-8 text-ink-soft">{forSale ? t("saleBody") : t("body")}</p>
        {priceEur !== null && <PostingPriceNotice priceEur={priceEur} />}
        <ListingForm variant="self-list" priceEur={priceEur} offerType={forSale ? "sale" : "rent"} />
      </div>
    </main>
  );
}
