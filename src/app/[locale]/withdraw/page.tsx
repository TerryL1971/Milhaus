// src/app/[locale]/withdraw/page.tsx
// "Withdraw from contract" / "Vertrag widerrufen" — the confirmation
// page behind the withdrawal button § 356a BGB requires (2026-11-09
// legal pass; see ./actions.ts for what the law asks and how each part
// is met). Reached from the footer link on every page, the withdrawal
// policy page and the order confirmation email. Name and email are
// pre-filled for a signed-in user, but signing in is never required.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { submitWithdrawal } from "@/app/[locale]/withdraw/actions";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("WithdrawPage");
  return pageMetadata({
    locale: await getLocale(),
    path: "/withdraw",
    title: t("heading"),
    description: t("metaDescription"),
  });
}

const labelClass = "mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75";
const inputClass =
  "w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none";

export default async function WithdrawPage() {
  const t = await getTranslations("WithdrawPage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-3 font-display text-3xl font-semibold text-ink">{t("heading")}</h1>
        <p className="mb-2 text-ink-soft">{t("intro")}</p>
        <p className="mb-8 text-sm text-ink-soft">
          {t("policyLead")}{" "}
          <Link href="/withdrawal" className="font-semibold text-olive-deep hover:underline">
            {t("policyLink")}
          </Link>
        </p>

        <form
          action={submitWithdrawal}
          className="flex flex-col gap-4 rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]"
        >
          <div>
            <label htmlFor="name" className={labelClass}>
              {t("name")}
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={200}
              autoComplete="name"
              defaultValue={profile?.display_name ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              defaultValue={user?.email ?? ""}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-ink-soft">{t("emailHint")}</p>
          </div>
          <div>
            <label htmlFor="contractDetails" className={labelClass}>
              {t("contract")}
            </label>
            <textarea
              id="contractDetails"
              name="contractDetails"
              required
              maxLength={2000}
              rows={3}
              placeholder={t("contractPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="max-w-[220px]">
            <label htmlFor="orderedOn" className={labelClass}>
              {t("orderedOn")}
            </label>
            <input id="orderedOn" name="orderedOn" type="date" className={inputClass} />
          </div>
          {/* Honeypot — hidden from people, see actions.ts. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <button
            type="submit"
            className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("confirmButton")}
          </button>
        </form>
      </div>
    </main>
  );
}
