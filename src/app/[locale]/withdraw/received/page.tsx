// src/app/[locale]/withdraw/received/page.tsx
// The on-screen receipt after a withdrawal (see ../actions.ts): what was
// received and when, so the consumer has it even if the confirmation
// email is slow or lands in spam. Looked up by the request's random id
// with the service-role client — the id is only ever in this person's
// own redirect URL, and the page shows nothing beyond what they typed.

import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type SearchParams = Promise<{ id?: string }>;

export default async function WithdrawalReceivedPage({ searchParams }: { searchParams: SearchParams }) {
  const { id } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("WithdrawPage");

  const { data: request } =
    id && /^[0-9a-f-]{36}$/i.test(id)
      ? await createAdminClient()
          .from("withdrawal_requests")
          .select("id, name, email, contract_details, ordered_on, created_at, confirmation_sent")
          .eq("id", id)
          .maybeSingle()
      : { data: null };

  const when = request
    ? new Date(request.created_at as string).toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Europe/Berlin",
      })
    : null;

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-3 font-display text-3xl font-semibold text-ink">{t("receivedHeading")}</h1>
        <p className="mb-8 text-ink-soft">{t("receivedBody")}</p>

        {request && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-md border border-canvas-deep bg-paper p-6 text-[0.95rem]">
            <dt className="text-ink-soft">{t("name")}</dt>
            <dd className="text-charcoal">{request.name as string}</dd>
            <dt className="text-ink-soft">{t("email")}</dt>
            <dd className="break-all text-charcoal">{request.email as string}</dd>
            <dt className="text-ink-soft">{t("contract")}</dt>
            <dd className="whitespace-pre-line text-charcoal">{request.contract_details as string}</dd>
            {request.ordered_on && (
              <>
                <dt className="text-ink-soft">{t("orderedOn")}</dt>
                <dd className="text-charcoal">{request.ordered_on as string}</dd>
              </>
            )}
            <dt className="text-ink-soft">{t("receivedAt")}</dt>
            <dd className="text-charcoal">{when}</dd>
            <dt className="text-ink-soft">{t("reference")}</dt>
            <dd className="break-all font-mono text-xs text-charcoal">{request.id as string}</dd>
          </dl>
        )}

        {request && (
          <p className="mt-4 text-sm text-ink-soft">
            {request.confirmation_sent ? t("emailSent") : t("emailNotSent")}
          </p>
        )}
      </div>
    </main>
  );
}
