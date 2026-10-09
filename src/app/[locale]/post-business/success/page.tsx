// src/app/[locale]/post-business/success/page.tsx
// Landing page after submitting a business that's currently free to
// list (priceEur was null — nothing to pay, submitted straight to
// pending_review). A paid submission skips this entirely and lands in
// /cart instead.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Submitted",
  robots: { index: false, follow: false },
};

export default async function PostBusinessSuccessPage() {
  const t = await getTranslations("PostBusinessPage");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[480px] px-8 text-center">
        <p className="mb-2 font-display text-xl font-semibold text-ink">{t("successTitle")}</p>
        <p className="mb-4 text-sm text-ink-soft">{t("successBody")}</p>
        <Link href="/services" className="text-sm font-semibold text-olive-deep hover:underline">
          {t("successCta")}
        </Link>
      </div>
    </main>
  );
}
