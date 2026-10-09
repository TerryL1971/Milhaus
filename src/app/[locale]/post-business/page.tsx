// src/app/[locale]/post-business/page.tsx
// Submit a business to the Military-Friendly Businesses directory — the
// paid self-serve replacement for "Suggest a business" (a mailto link
// before this). Same auth-gate/redirect-back pattern as /post, /post-car,
// /post-product.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { submitBusiness } from "@/app/[locale]/post-business/actions";
import { PostingPriceNotice } from "@/components/posting-price-notice";
import { getPathname, redirect } from "@/i18n/navigation";
import { BASE_NAMES } from "@/lib/bases";
import { BUSINESS_CATEGORY_KEYS, BUSINESS_CATEGORY_LABELS, BUSINESS_TAG_KEYS, BUSINESS_TAG_LABELS } from "@/lib/businesses";
import { getPostingPrice } from "@/lib/listing-prices";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Suggest a business",
  robots: { index: false, follow: false },
};

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none";

export default async function PostBusinessPage() {
  const t = await getTranslations("PostBusinessPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    const nextPath = getPathname({ href: "/post-business", locale });
    redirect({ href: `/sign-in?next=${nextPath}`, locale });
  }

  const priceEur = await getPostingPrice("business");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-8 text-ink-soft">{t("body")}</p>
        {priceEur !== null && <PostingPriceNotice priceEur={priceEur} />}

        <form action={submitBusiness} className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              {t("name")}
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className={labelClass}>
                {t("category")}
              </label>
              <select id="category" name="category" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  {t("chooseOne")}
                </option>
                {BUSINESS_CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {BUSINESS_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="base" className={labelClass}>
                {t("nearestBase")}
              </label>
              <select id="base" name="base" defaultValue="" className={inputClass}>
                <option value="">{t("notBaseSpecific")}</option>
                {BASE_NAMES.map((base) => (
                  <option key={base} value={base}>
                    {base}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>
              {t("city")}
            </label>
            <input id="city" name="city" required className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>{t("tags")}</span>
            <div className="flex flex-wrap gap-4">
              {BUSINESS_TAG_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm text-charcoal">
                  <input
                    type="checkbox"
                    name={`tag_${key}`}
                    className="h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
                  />
                  <span>{BUSINESS_TAG_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="logoUrl" className={labelClass}>
              {t("logoUrl")}
            </label>
            <input id="logoUrl" name="logoUrl" type="url" placeholder="https://…" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="websiteUrl" className={labelClass}>
                {t("websiteUrl")}
              </label>
              <input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://…" className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                {t("phone")}
              </label>
              <input id="phone" name="phone" type="tel" className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {priceEur !== null ? t("submitWithPrice", { price: priceEur }) : t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
