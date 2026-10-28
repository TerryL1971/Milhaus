// src/components/confirm-submit-button.tsx
// A plain `<button type="submit">` inside a server-action `<form>`, but
// guarded by a native confirm() first. Built for the admin dashboard's
// Reject/Archive buttons — Charlie runs that page solo, daily, and those
// two sit right next to lower-stakes actions at the same visual weight;
// one misclick otherwise takes a real submitter's listing off the queue
// or off the live site with no way back except Relist (which isn't even
// offered for a rejected-not-archived listing). Everything here still
// submits the real server action on confirm — this only ever intercepts
// the click to ask first, never replaces the form's own submit.

"use client";

import type { ReactNode } from "react";

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
}: {
  confirmMessage: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
