// src/components/cookie-consent-banner.tsx
// GDPR consent gate for analytics — shown until a visitor accepts or
// declines, then never again (their choice is final either way; there's
// no settings page to change it from yet, same MVP-scope trade-off as
// everything else flagged in the GDPR audit this came out of). Starts
// hidden and reveals post-mount, same SSR-safe pattern as
// WelcomeBanner — localStorage only exists client-side, so there's no
// server-rendered equivalent to stay consistent with.

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getStoredConsent, setStoredConsent } from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const t = useTranslations("CookieConsent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // One-time read of whether a choice already exists — not a
    // subscription, so the usual set-state-in-effect lint concern
    // (see WelcomeBanner's own comment on this) doesn't really apply,
    // but disabling it the same way keeps this consistent with that
    // established pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(getStoredConsent() === null);
  }, []);

  function choose(choice: "accepted" | "declined") {
    setStoredConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-canvas-deep bg-paper px-4 py-3 shadow-[0_-4px_16px_rgba(27,42,58,0.12)]">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <p className="max-w-[70ch] text-sm text-charcoal">
          {t("message")}{" "}
          <Link href="/privacy" className="font-semibold text-olive-deep hover:underline">
            {t("learnMore")}
          </Link>
        </p>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="rounded-md border border-canvas-deep px-4 py-2 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-olive hover:text-olive-deep"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-md bg-brass px-4 py-2 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
