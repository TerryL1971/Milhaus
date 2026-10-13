// src/app/[locale]/post-business/page.tsx
// List your own business in the Military-Friendly Businesses directory
// — the paid self-serve replacement for the old "Suggest a business"
// mailto link. Renamed from "Suggest" (Terry: listing someone else's
// business without their permission is illegal in Germany — ran into
// this on European-Living.live) — framed throughout as the owner/an
// authorized rep listing their own business, with a required
// attestation checkbox below, enforced server-side too in
// actions.ts/submitBusiness (not just a client-side nicety). Same
// auth-gate/redirect-back pattern as /post, /post-car, /post-product.

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
  title: "List your business",
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="logoUrl" className={labelClass}>
                {t("logoUrl")}
              </label>
              <input id="logoUrl" name="logoUrl" type="url" placeholder="https://…" className={inputClass} />
            </div>
            <div>
              <label htmlFor="coverImageUrl" className={labelClass}>
                {t("coverImageUrl")}
              </label>
              <input id="coverImageUrl" name="coverImageUrl" type="url" placeholder="https://…" className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              {t("description")}
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder={t("descriptionPlaceholder")}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="promotion" className={labelClass}>
              {t("promotion")}
            </label>
            <input id="promotion" name="promotion" placeholder={t("promotionPlaceholder")} className={inputClass} />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="instagramUrl" className={labelClass}>
                {t("instagramUrl")}
              </label>
              <input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                placeholder="https://instagram.com/…"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="facebookUrl" className={labelClass}>
                {t("facebookUrl")}
              </label>
              <input
                id="facebookUrl"
                name="facebookUrl"
                type="url"
                placeholder="https://facebook.com/…"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="whatsappNumber" className={labelClass}>
              {t("whatsappNumber")}
            </label>
            <input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              placeholder="+49…"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-ink-soft/75">{t("whatsappNumberHint")}</p>
          </div>

          {/* Legal requirement, not a formality — listing a business
              without the owner's permission is illegal in Germany.
              `required` blocks a normal submit client-side; the server
              action re-checks this field too, since a required
              attribute alone can be bypassed. */}
          <label className="flex items-start gap-2 rounded-md border border-canvas-deep bg-canvas/40 p-3 text-sm text-charcoal">
            <input
              type="checkbox"
              name="ownerConfirmation"
              required
              className="mt-0.5 h-4 w-4 rounded border-canvas-deep text-olive focus:ring-olive"
            />
            <span>{t("ownerConfirmation")}</span>
          </label>

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
