// src/components/welcome-banner.tsx
// The lighter alternative Terry chose over Charlie's original ask (a
// popup ad at launch and on every visit) — a dismissible strip instead
// of a blocking popup, shown once per visitor rather than every single
// visit. A blocking popup tends to hurt trust/conversion and can get
// silently eaten by the browser's own popup blocker anyway.
//
// Since 2026-11-11 (Terry's ask) it only appears while posting really
// is free: src/components/promo-banner.tsx shows it only while the
// "free until" launch promo in Admin → Pricing is running, so it comes
// down by itself when that date passes. Before, the message was fixed
// English text that stayed up whatever the prices were. The text now
// lives in messages/*.json (PromoBanner) and arrives as `message`. Bump
// BANNER_VERSION when the message changes meaningfully — that resets
// the "already dismissed" state for everyone, since a dismissal of the
// old message shouldn't silently suppress an unrelated new one.

"use client";

import { useEffect, useState } from "react";

const BANNER_VERSION = "1";
const STORAGE_KEY = `milhaus-banner-dismissed-v${BANNER_VERSION}`;


function wasNotYetDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "1";
  } catch {
    // Private window / blocked storage — just show it this one time;
    // dismiss will no-op on the storage write below but still hides it
    // for this page view.
    return true;
  }
}

export function WelcomeBanner({ message, dismissLabel }: { message: string; dismissLabel: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reading localStorage (an external, browser-only system) can only
    // happen after mount — there's no server-rendered equivalent to stay
    // consistent with, so starting hidden and flipping visible here is
    // the standard, SSR-safe way to gate on it without a hydration
    // mismatch. The lint rule below assumes every setState-in-effect is
    // reacting to a *subscription*; a one-time external read like this
    // one doesn't fit that shape.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(wasNotYetDismissed());
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing more to do — see the comment above.
    }
  }

  if (!visible) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-olive px-4 py-2 text-center text-sm font-medium text-paper">
      <span>{message}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={dismissLabel}
        className="flex-shrink-0 opacity-80 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
