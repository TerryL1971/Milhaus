// src/components/welcome-banner.tsx
// The lighter alternative Terry chose over Charlie's original ask (a
// popup ad at launch and on every visit) — a dismissible strip instead
// of a blocking popup, shown once per visitor rather than every single
// visit. A blocking popup tends to hurt trust/conversion and can get
// silently eaten by the browser's own popup blocker anyway.
//
// MESSAGE is a plain exported constant specifically so Charlie/Terry can
// swap the copy (e.g. once the free-posting period in CLAUDE.md/Charlie's
// ask ends) without touching the component logic. Bump BANNER_VERSION
// when the message changes meaningfully — that resets the "already
// dismissed" state for everyone, since a dismissal of the old message
// shouldn't silently suppress an unrelated new one.

"use client";

import { useEffect, useState } from "react";

const BANNER_VERSION = "1";
const STORAGE_KEY = `milhaus-banner-dismissed-v${BANNER_VERSION}`;

export const MESSAGE = "🎉 Free to post for a limited time — list a home, car, or item today.";

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

export function WelcomeBanner() {
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
      <span>{MESSAGE}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 opacity-80 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
