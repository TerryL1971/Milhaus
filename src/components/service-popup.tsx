// src/components/service-popup.tsx
// The 30-second pop-up — Charlie's "Milhaus Service" sign-up (his design,
// 2026-11-09): "Arrive in Stuttgart. We've got your back.", four things
// he can help with (tick any), an email address and "Get in touch with
// us". Until then the site had a no-pop-ups rule (Charlie's own earlier
// preference); this is the one exception he asked for.
//
// History: first built the same day as a paid ad spot sold on
// /advertise, on a misreading of the ask. When Terry saw Charlie's design
// he had that spot removed (supabase/migrations/20261109210000_service_popup.sql).
// The layout here was built from a blurry photo of the design; adjust it
// when Charlie's original file arrives.
//
// When it appears (unchanged from the first version, tested in the
// browser on 2026-11-09):
//   - Not in the first 30 seconds of a visit. The clock starts on the
//     first page of the visit and keeps running across pages
//     (sessionStorage), so moving around the site doesn't restart it.
//   - At most once per visit (Charlie, 2026-11-09 — first built as once
//     a day): once it has appeared it won't appear again until the
//     visitor comes back in a new browser session (sessionStorage, which
//     the browser clears when the site's tabs are closed).
//   - Never while the cookie banner is still waiting for an answer —
//     it waits until the visitor has chosen, then appears a few seconds
//     later.
//   - Never on pages where someone is filling in a form or reading a
//     legal text (posting, editing, signing in, contact, withdrawal,
//     terms, privacy, Impressum). If the 30 seconds run out on one of
//     those pages, it waits for the next ordinary page.
// If the browser blocks storage, it shows once per page load after 30
// seconds rather than failing.
//
// No "Ad" label: it's Milhaus's own service on Milhaus's own site, not a
// paid ad for someone else. Closes with the × button, the Escape key or
// a click outside it; focus moves to the × so keyboard users can close
// it too. After sending, the thank-you stays in the pop-up until closed.

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { COOKIE_CONSENT_EVENT, getStoredConsent } from "@/lib/cookie-consent";
import { SERVICE_EMAIL, SERVICE_INTERESTS, type ServiceInterest } from "@/lib/milhaus-service";
import { sendServiceRequest, type ServiceRequestResult } from "@/lib/service-request-actions";

const DELAY_MS = 30_000;
/** After the cookie banner is answered, how long before the pop-up. */
const AFTER_CONSENT_MS = 4_000;
const VISIT_START_KEY = "milhaus-visit-started";
const SHOWN_KEY = "milhaus-popup-shown";

/** Path prefixes (without /de) where the pop-up never appears. */
const QUIET_PATHS = ["/post", "/edit-listing", "/sign-in", "/contact", "/withdraw", "/terms", "/privacy", "/impressum"];

const INTEREST_ICONS: Record<ServiceInterest, string> = {
  car: "🚗",
  apartment: "🏠",
  bureaucracy: "📄",
  advice: "💬",
};

function readNumber(key: string): number | null {
  try {
    const value = Number(sessionStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number) {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // Storage blocked — see the header comment.
  }
}

export function ServicePopup() {
  const t = useTranslations("ServicePopup");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const quiet = QUIET_PATHS.some((prefix) => pathname.startsWith(prefix));
  const [result, action, pending] = useActionState<ServiceRequestResult, FormData>(sendServiceRequest, null);

  useEffect(() => {
    if (open || quiet || readNumber(SHOWN_KEY)) return;

    let visitStart = readNumber(VISIT_START_KEY);
    if (!visitStart) {
      visitStart = Date.now();
      writeNumber(VISIT_START_KEY, visitStart);
    }
    const wait = Math.max(0, visitStart + DELAY_MS - Date.now());

    const show = () => {
      if (readNumber(SHOWN_KEY)) return;
      writeNumber(SHOWN_KEY, Date.now());
      setOpen(true);
    };
    let consentTimer: ReturnType<typeof setTimeout> | undefined;
    const onConsent = () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
      consentTimer = setTimeout(show, AFTER_CONSENT_MS);
    };
    const timer = setTimeout(() => {
      if (getStoredConsent() === null) {
        window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
      } else {
        show();
      }
    }, wait);

    return () => {
      clearTimeout(timer);
      clearTimeout(consentTimer);
      window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
    };
  }, [open, quiet]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-3 sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-popup-heading"
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[460px] overflow-y-auto rounded-2xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-7"
        style={{ background: "linear-gradient(160deg,#F3EDDD 0%,#E6DCBF 100%)" }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-ink-soft hover:bg-ink/10 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
        >
          ×
        </button>

        {/* Logo with the red script "Service" sweeping under its right
            end, as in Charlie's design. */}
        <div className="relative mb-5 mr-6 mt-2 pb-7">
          <Image
            src="/brand/milhaus-logo-full-color-horizontal.png"
            alt="Milhaus"
            width={1994}
            height={236}
            className="h-auto w-[78%]"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 -rotate-6 text-[2.6rem] leading-none text-brass sm:text-[3rem]"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Service
          </span>
        </div>

        <h2
          id="service-popup-heading"
          className="mb-3 text-right font-display text-[1.45rem] font-bold leading-tight text-ink sm:text-[1.7rem]"
        >
          {t("headingLine1")}
          <br />
          {t("headingLine2")}
        </h2>
        <p className="mb-5 text-[0.9rem] leading-snug text-charcoal">{t("intro")}</p>

        {result?.ok ? (
          <div role="status" className="rounded-xl bg-paper/90 p-5 text-center">
            <p className="mb-1 font-display text-lg font-semibold text-ink">{t("sentHeading")}</p>
            <p className="text-sm text-charcoal">{t("sentBody")}</p>
          </div>
        ) : (
          <form action={action} className="rounded-xl bg-paper/90 p-4 sm:p-5">
            <fieldset>
              <legend className="mb-3 font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-ink-soft">
                {t("helpLegend")} <span className="font-normal text-ink-soft/60">{t("selectAny")}</span>
              </legend>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {SERVICE_INTERESTS.map((interest) => (
                  <label
                    key={interest}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-canvas-deep bg-paper px-2.5 py-2.5 text-[0.8rem] font-medium text-ink has-[:checked]:border-olive has-[:checked]:bg-olive/10 sm:text-[0.85rem]"
                  >
                    <input type="checkbox" name="interests" value={interest} className="h-4 w-4 flex-shrink-0 accent-olive" />
                    <span aria-hidden="true">{INTEREST_ICONS[interest]}</span>
                    {/* min-w-0 + hyphens: long German words ("Wohnungssuche")
                        ran out of the tile on phones. */}
                    <span className="min-w-0 hyphens-auto break-words">{t(`interest_${interest}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label
              htmlFor="service-popup-email"
              className="mb-1.5 block font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-ink-soft"
            >
              {t("emailLabel")}
            </label>
            <div className="relative mb-4">
              <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60">
                ✉
              </span>
              <input
                id="service-popup-email"
                name="email"
                type="email"
                required
                maxLength={320}
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-lg border border-canvas-deep bg-paper py-2.5 pl-9 pr-3 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
              />
            </div>
            <input type="hidden" name="page" value={pathname} />
            {/* Honeypot — hidden from people, see service-request-actions.ts. */}
            <div className="hidden" aria-hidden="true">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>

            {result && !result.ok && (
              <p role="alert" className="mb-3 rounded-md bg-rust/10 px-3 py-2 text-sm text-rust">
                {result.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-paper transition-[transform] hover:-translate-y-px disabled:opacity-60"
            >
              {pending ? t("sending") : `${t("submit")} ➤`}
            </button>
            <p className="mt-3 text-center text-[0.72rem] text-ink-soft">
              {t("orEmail")}{" "}
              <a href={`mailto:${SERVICE_EMAIL}`} className="font-semibold text-ink underline">
                {SERVICE_EMAIL}
              </a>
            </p>
            <p className="mt-1 text-center text-[0.68rem] text-ink-soft/70">{t("privacyNote")}</p>
          </form>
        )}
      </div>
    </div>
  );
}
