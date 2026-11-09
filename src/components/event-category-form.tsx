// src/components/event-category-form.tsx
// Admin → Events: the Category picker + Save on each row. A small client
// component only so it can say what happened — the first version was a
// plain server form, and Terry's first save (2026-11-09) did work but
// looked like "nothing happened": the page reloaded with the same value
// and no message. Now the button reads "Saving…" while it runs, then
// "✓ Saved" (or the error) appears beside it — on the page, no pop-up
// (Charlie's preference). Changing the choice again clears the message.

"use client";

import { useActionState, useState } from "react";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_ADMIN_LABELS,
  type EventCategory,
} from "@/lib/events";

type Result = { ok: true } | { ok: false; message: string } | null;

export function EventCategoryForm({
  action,
  eventId,
  eventTitle,
  current,
}: {
  action: (formData: FormData) => Promise<void>;
  eventId: string;
  eventTitle: string;
  current: EventCategory | null;
}) {
  const [hasCategory, setHasCategory] = useState(current !== null);
  const [result, submit, pending] = useActionState<Result, FormData>(
    async (_previous, formData) => {
      try {
        await action(formData);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "That didn't save — try again.",
        };
      }
    },
    null,
  );
  const [showResult, setShowResult] = useState(true);

  return (
    <form
      action={(formData) => {
        setShowResult(true);
        submit(formData);
      }}
      className="flex flex-col gap-1"
    >
      <input type="hidden" name="id" value={eventId} />
      {/* Picker and Save always on one line — with wrapping allowed, Save
          dropped under the picker on Terry's screen (2026-11-09). */}
      <div className="flex flex-nowrap items-center gap-1.5">
        <select
          name="category"
          required
          defaultValue={current ?? ""}
          onChange={() => {
            setHasCategory(true);
            setShowResult(false);
          }}
          aria-label={`Category for ${eventTitle}`}
          className={`w-40 rounded-md border bg-paper px-2 py-1.5 text-xs text-charcoal ${
            hasCategory ? "border-canvas-deep" : "border-rust"
          }`}
        >
          <option value="" disabled>
            Not set
          </option>
          {EVENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {EVENT_CATEGORY_ADMIN_LABELS[category]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-canvas-deep px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-olive hover:text-olive-deep disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {showResult && !pending && result && (
        <span
          role="status"
          className={`text-xs font-semibold ${result.ok ? "text-olive-deep" : "text-rust"}`}
        >
          {result.ok ? "✓ Saved" : result.message}
        </span>
      )}
    </form>
  );
}
