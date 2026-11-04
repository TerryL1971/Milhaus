// src/components/copy-link-button.tsx
// "Copy invoice link" on Admin → Ad orders — so Charlie can paste an
// invoice's Pay link into his own email, WhatsApp or text when the
// emailed one hasn't arrived (Stripe test mode, or a spam folder). Says
// "Copied!" for a moment; if the browser won't allow clipboard access,
// it shows the link selected instead so it can be copied by hand.

"use client";

import { useState } from "react";

export function CopyLinkButton({ url, label, className }: { url: string; label: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("manual");
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        {state === "copied" ? "Copied!" : label}
      </button>
      {state === "manual" && (
        <input
          readOnly
          value={url}
          autoFocus
          onFocus={(event) => event.currentTarget.select()}
          className="w-full max-w-md rounded-md border border-canvas-deep bg-paper px-2 py-1 text-xs text-charcoal"
        />
      )}
    </>
  );
}
