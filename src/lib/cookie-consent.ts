// src/lib/cookie-consent.ts
// Shared constants/helpers for the analytics-consent banner and the
// ConditionalAnalytics gate — kept framework-agnostic (plain
// localStorage, no React) so both a "use client" banner and a "use
// client" gate component can read/write the same choice without needing
// to share React state across what are otherwise two independent
// components in the tree.

export const COOKIE_CONSENT_KEY = "milhaus-cookie-consent";
export const COOKIE_CONSENT_EVENT = "milhaus-cookie-consent-change";

export type ConsentChoice = "accepted" | "declined";

export function getStoredConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    // Private browsing / blocked storage — treat as "no choice made yet"
    // rather than crash; the banner will just keep showing, which is the
    // safe default (no analytics loads until a real choice is stored).
    return null;
  }
}

export function setStoredConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  } catch {
    // Can't persist the choice — nothing to do; ConditionalAnalytics
    // will just ask again next load, which is the safe failure mode.
  }
  // storage events don't fire in the same tab that made the change —
  // this is what lets ConditionalAnalytics react immediately without a
  // reload, in the same tab the banner's button was clicked in.
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}
