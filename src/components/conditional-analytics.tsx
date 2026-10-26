// src/components/conditional-analytics.tsx
// Wraps @vercel/analytics' own <Analytics /> so it only mounts once a
// visitor has accepted cookies/tracking — previously it loaded
// unconditionally for every visitor, with no consent gate at all.
// useSyncExternalStore (not useEffect+useState) is the correct React API
// for "subscribe to a non-React data source" — localStorage plus our own
// COOKIE_CONSENT_EVENT — and its getServerSnapshot means the server-
// rendered output is always "not accepted" (no localStorage during SSR),
// so there's no hydration mismatch to work around.

"use client";

import { Analytics } from "@vercel/analytics/next";
import { useSyncExternalStore } from "react";
import { COOKIE_CONSENT_EVENT, getStoredConsent } from "@/lib/cookie-consent";

function subscribe(onChange: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return getStoredConsent() === "accepted";
}

function getServerSnapshot() {
  return false;
}

export function ConditionalAnalytics() {
  const accepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!accepted) return null;
  return <Analytics />;
}
