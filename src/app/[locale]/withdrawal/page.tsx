// src/app/[locale]/withdrawal/page.tsx
// The withdrawal policy (Widerrufsbelehrung) and model withdrawal form —
// required for every paid service sold to a consumer (§ 312g, § 355 BGB,
// Art. 246a EGBGB). Added 2026-11-09 after the legal review. German on
// /de, English on /; the text itself lives in src/lib/withdrawal-notice.ts
// so the order confirmation email repeats exactly the same words. Linked
// from the footer, the cart (next to the "Order and pay" button) and the
// online withdrawal form at /withdraw.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import { PUBLIC_SITE_URL } from "@/lib/site-url";
import { withdrawalNotice } from "@/lib/withdrawal-notice";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("WithdrawalPage");
  return pageMetadata({
    locale: await getLocale(),
    path: "/withdrawal",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function WithdrawalPolicyPage() {
  const locale = await getLocale();
  const t = await getTranslations("WithdrawalPage");
  const notice = withdrawalNotice(
    locale === "de" ? "de" : "en",
    `${PUBLIC_SITE_URL}${locale === "de" ? "/de" : ""}/withdraw`,
  );

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[760px] px-8">
        <h1 className="mb-3 font-display text-3xl font-semibold text-ink">{notice.title}</h1>
        <p className="mb-8 text-sm text-ink-soft">{t("intro")}</p>

        <Link
          href="/withdraw"
          className="mb-10 inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
        >
          {t("withdrawButton")}
        </Link>

        {notice.sections.map((section) => (
          <section key={section.heading} className="mb-8">
            <h2 className="mb-3 font-display text-xl font-semibold text-ink">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-3 text-[0.95rem] leading-relaxed text-charcoal">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="rounded-md border border-canvas-deep bg-paper p-6">
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">{notice.formTitle}</h2>
          <p className="mb-4 text-sm text-ink-soft">{notice.formIntro}</p>
          <ul className="flex flex-col gap-3 text-[0.95rem] text-charcoal">
            {notice.formLines.map((line) => (
              <li key={line} className="border-b border-dashed border-canvas-deep pb-3 last:border-0">
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
