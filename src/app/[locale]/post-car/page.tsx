// src/app/[locale]/post-car/page.tsx
// Post a car ad — mirrors src/app/[locale]/post/page.tsx exactly (same
// auth gate, same redirect-back-after-sign-in), just pointed at
// ListingForm's kind="car" branch instead of the rental fields.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DealerPaymentNotice } from "@/components/dealer-payment-notice";
import { ListingForm } from "@/components/listing-form";
import { getPathname, redirect } from "@/i18n/navigation";
import { getDealerGatePrice } from "@/lib/listing-prices";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sell your car",
  robots: { index: false, follow: false },
};

export default async function PostCarPage() {
  const t = await getTranslations("PostCarPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    const nextPath = getPathname({ href: "/post-car", locale });
    redirect({ href: `/sign-in?next=${nextPath}`, locale });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const gatePrice = await getDealerGatePrice(profile?.role, "car");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-8 text-ink-soft">{t("body")}</p>
        {gatePrice !== null ? (
          <DealerPaymentNotice priceEur={gatePrice} />
        ) : (
          <ListingForm variant="self-list" kind="car" />
        )}
      </div>
    </main>
  );
}
