// src/components/takedown-form.tsx
// Admin → Reject / Archive. Replaces the old one-click button with a
// native confirm() pop-up (2026-11-09 legal pass): clicking now opens a
// small panel asking why, because the Digital Services Act (Art. 17)
// requires the owner to be told the reason (see src/lib/moderation.ts).
// Opening the panel and pressing its button is also the "are you sure"
// step the pop-up used to be — and Charlie doesn't want pop-ups anyway.
// Plain <details>, so it needs no client JavaScript.

import { TAKEDOWN_REASONS } from "@/lib/moderation";

export function TakedownForm({
  action,
  listingId,
  buttonLabel,
  submitLabel,
  small = false,
}: {
  action: (formData: FormData) => Promise<void>;
  listingId: string;
  buttonLabel: string;
  submitLabel: string;
  small?: boolean;
}) {
  return (
    <details className="group text-left">
      <summary
        className={`cursor-pointer list-none rounded-md border border-canvas-deep font-semibold text-ink-soft hover:border-rust hover:text-rust group-open:border-rust group-open:text-rust [&::-webkit-details-marker]:hidden ${
          small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        }`}
      >
        {buttonLabel}
      </summary>
      <form action={action} className="mt-2 flex w-64 flex-col gap-2 rounded-md border border-canvas-deep bg-canvas/60 p-3">
        <input type="hidden" name="id" value={listingId} />
        <label className="text-xs font-semibold text-ink-soft" htmlFor={`reason-${listingId}`}>
          Reason (emailed to the poster)
        </label>
        <select
          id={`reason-${listingId}`}
          name="reason"
          required
          defaultValue=""
          className="rounded-md border border-canvas-deep bg-paper px-2 py-1.5 text-xs text-charcoal"
        >
          <option value="" disabled>
            Choose a reason…
          </option>
          {Object.entries(TAKEDOWN_REASONS).map(([key, reason]) => (
            <option key={key} value={key}>
              {reason.label}
            </option>
          ))}
        </select>
        <textarea
          name="note"
          rows={3}
          maxLength={1000}
          placeholder="What's wrong, in a sentence or two (needed for illegal / not allowed / other)"
          className="rounded-md border border-canvas-deep bg-paper px-2 py-1.5 text-xs text-charcoal"
        />
        <label className="flex items-center gap-2 text-xs text-charcoal">
          <input type="checkbox" name="fromReport" className="h-3.5 w-3.5" />
          Someone reported it
        </label>
        <button
          type="submit"
          className="rounded-md bg-rust px-3 py-1.5 text-xs font-semibold text-paper hover:bg-brass-deep"
        >
          {submitLabel}
        </button>
      </form>
    </details>
  );
}
