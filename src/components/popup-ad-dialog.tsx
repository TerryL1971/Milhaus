// src/components/popup-ad-dialog.tsx
// The pop-up ad's timing and dialog (Charlie's ask, 2026-11-09 — see
// popup-ad.tsx for the background). The rules:
//
//   - Not in the first 30 seconds of a visit. The clock starts on the
//     first page of the visit and keeps running across pages
//     (sessionStorage), so moving around the site doesn't restart it.
//   - At most once per visit (Charlie, 2026-11-09 — first built as once
//     a day, changed the same day): once it has appeared, it won't appear
//     again until the visitor comes back in a new browser session
//     (sessionStorage, which the browser clears when the site's tabs
//     are closed).
//   - Never while the cookie banner is still waiting for an answer —
//     two things fighting for the bottom of the screen. It waits until
//     the visitor has chosen, then appears a few seconds later.
//   - Never on pages where someone is filling in a form or reading a
//     legal text (posting, editing, signing in, contact, withdrawal,
//     terms, privacy, Impressum) — interrupting those would cost Charlie
//     more than the ad earns. If the timer runs out on one of those
//     pages, it waits for the next ordinary page.
//
// If the browser blocks storage, it shows once per page load after 30
// seconds rather than failing — the try/catch wrappers
// below just fall back to "no record".
//
// Labelled "Ad" / "Anzeige" like every other paid ad (§ 5a UWG — see
// ad-label.tsx). Closes with the × button, the Escape key or a click
// outside it; focus moves to the × so keyboard users can close it too.

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdLabel } from "@/components/ad-label";
import { usePathname } from "@/i18n/navigation";
import { COOKIE_CONSENT_EVENT, getStoredConsent } from "@/lib/cookie-consent";

export interface PopupAdContent {
  id: string;
  advertiserName: string;
  imageUrl: string | null;
  heading: string | null;
  bodyText: string | null;
  linkUrl: string;
}

const DELAY_MS = 30_000;
/** After the cookie banner is answered, how long before the pop-up. */
const AFTER_CONSENT_MS = 4_000;
const VISIT_START_KEY = "milhaus-visit-started";
const SHOWN_KEY = "milhaus-popup-shown";

/** Path prefixes (without /de) where the pop-up never appears. */
const QUIET_PATHS = [
  "/post",
  "/edit-listing",
  "/sign-in",
  "/contact",
  "/withdraw",
  "/terms",
  "/privacy",
  "/impressum",
];

function readNumber(storage: () => Storage, key: string): number | null {
  try {
    const value = Number(storage().getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeNumber(storage: () => Storage, key: string, value: number) {
  try {
    storage().setItem(key, String(value));
  } catch {
    // Storage blocked — see the header comment.
  }
}

const session = () => sessionStorage;

export function PopupAdDialog({ ads }: { ads: PopupAdContent[] }) {
  const t = useTranslations("PopupAd");
  const pathname = usePathname();
  const [ad, setAd] = useState<PopupAdContent | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const quiet = QUIET_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}`));

  const show = useCallback(() => {
    if (readNumber(session, SHOWN_KEY)) return;
    writeNumber(session, SHOWN_KEY, Date.now());
    setAd(ads[Math.floor(Math.random() * ads.length)]);
  }, [ads]);

  useEffect(() => {
    if (ad || quiet) return;
    if (readNumber(session, SHOWN_KEY)) return;

    let visitStart = readNumber(session, VISIT_START_KEY);
    if (!visitStart) {
      visitStart = Date.now();
      writeNumber(session, VISIT_START_KEY, visitStart);
    }
    const wait = Math.max(0, visitStart + DELAY_MS - Date.now());

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
  }, [ad, quiet, show]);

  useEffect(() => {
    if (!ad) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAd(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ad]);

  if (!ad) return null;

  const external = ad.linkUrl.startsWith("http");
  const linkProps = {
    href: ad.linkUrl,
    target: external ? "_blank" : undefined,
    rel: external ? "noopener noreferrer sponsored" : undefined,
    onClick: () => setAd(null),
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) setAd(null);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("dialogLabel", { name: ad.advertiserName })}
        className="relative w-full max-w-[440px] overflow-hidden rounded-md bg-paper shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      >
        <AdLabel />
        <button
          ref={closeRef}
          type="button"
          onClick={() => setAd(null)}
          aria-label={t("close")}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-xl leading-none text-white hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
        >
          ×
        </button>
        {ad.imageUrl ? (
          <a {...linkProps} className="relative block aspect-square w-full">
            <Image src={ad.imageUrl} alt={ad.advertiserName} fill sizes="(min-width: 480px) 440px, 92vw" className="object-cover" />
          </a>
        ) : (
          <div className="px-6 pb-6 pt-12 text-center">
            <p className="mb-2 font-display text-2xl font-semibold text-ink">{ad.heading ?? ad.advertiserName}</p>
            {ad.bodyText && <p className="mb-5 text-charcoal">{ad.bodyText}</p>}
            <a
              {...linkProps}
              className="inline-block rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper hover:bg-brass-deep"
            >
              {t("learnMore")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
