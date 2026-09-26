// src/components/report-listing-button.tsx
// "Report this listing" — the practical substitute for automated content
// moderation (see listing_reports in supabase/migrations/
// 20260926180000_split_listing_types_and_trust_safety.sql): anyone
// signed in can flag a listing for Charlie to look at, instead of relying
// on him spotting problems himself. Shared across every listing type's
// detail page (rental/car/product), same reasoning as ListingForm being
// one component for every kind rather than three near-duplicates.

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type State = "idle" | "open" | "submitting" | "submitted" | "error";

export function ReportListingButton({ listingId, returnPath }: { listingId: string; returnPath: string }) {
  const t = useTranslations("ReportListing");
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/sign-in?next=${returnPath}`);
      return;
    }

    const { error } = await supabase
      .from("listing_reports")
      .insert({ listing_id: listingId, reporter_id: user.id, reason });

    if (error) {
      setState("error");
      setErrorMessage(error.message);
      return;
    }
    setState("submitted");
  }

  if (state === "submitted") {
    return <p className="mt-6 text-sm text-ink-soft">{t("submitted")}</p>;
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => setState("open")}
        className="mt-6 text-sm text-ink-soft/70 underline decoration-dotted hover:text-rust"
      >
        {t("button")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-2 rounded-md border border-canvas-deep bg-paper p-4"
    >
      <label htmlFor="report-reason" className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
        {t("reasonLabel")}
      </label>
      <textarea
        id="report-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        required
        rows={3}
        placeholder={t("reasonPlaceholder")}
        className="w-full rounded-md border border-canvas-deep bg-canvas px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
      />
      {state === "error" && <p className="text-sm text-rust">{errorMessage}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="rounded-md border border-rust/50 px-3.5 py-1.5 text-xs font-semibold text-rust hover:bg-rust/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? t("submitting") : t("submit")}
        </button>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="rounded-md border border-canvas-deep px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-ink hover:text-ink"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
