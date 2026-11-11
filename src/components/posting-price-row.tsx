// src/components/posting-price-row.tsx
// Admin → Pricing: one category's price box and its own Save button.
// Terry, 2026-11-11: after changing several prices he couldn't tell
// which ones still needed saving, so he saved them all. He wanted to
// keep a Save button on each row (a single Save-all button was tried
// the same day and he preferred these), with the box highlighted when
// its price has changed but isn't saved yet:
//   - changed, not saved: red outline and "Not saved yet" under it,
//     and that row's Save button turns red;
//   - after saving: "✓ Saved" (or what went wrong) — on the page, no
//     pop-up (Charlie's preference).
// "Changed" is compared with the saved price from the server, which
// updates after a save, so the highlight goes away by itself.

"use client";

import { useActionState, useState } from "react";
import type { SavePriceResult } from "@/app/admin/pricing/actions";
import type { PriceableType } from "@/lib/listing-prices";

export function PostingPriceRow({
  type,
  label,
  savedPrice,
  action,
}: {
  type: PriceableType;
  label: string;
  savedPrice: number;
  action: (previous: SavePriceResult, formData: FormData) => Promise<SavePriceResult>;
}) {
  const [value, setValue] = useState(String(savedPrice));
  const [result, submit, pending] = useActionState(action, null);
  const [showResult, setShowResult] = useState(false);
  const changed = value === "" || Number(value) !== savedPrice;

  return (
    <form
      action={(formData) => {
        setShowResult(true);
        submit(formData);
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="type" value={type} />
      <div className="flex justify-end gap-2">
        <input
          type="number"
          name="priceEur"
          min="0"
          step="0.50"
          required
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setShowResult(false);
          }}
          aria-label={`Price for ${label}`}
          className={`w-24 rounded-md border px-3 py-1.5 text-sm text-charcoal focus:outline-none ${
            changed
              ? "border-brass bg-paper font-semibold ring-2 ring-brass/30"
              : "border-canvas-deep bg-canvas focus:border-olive"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
            changed
              ? "border-brass bg-brass text-paper hover:bg-brass-deep"
              : "border-canvas-deep text-ink-soft hover:border-olive hover:text-olive-deep"
          }`}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {pending ? null : showResult && result && !result.ok ? (
        <p role="alert" className="max-w-[16rem] text-right text-[0.7rem] font-semibold text-rust">
          {result.message}
        </p>
      ) : changed ? (
        <p className="text-[0.7rem] font-semibold text-brass">Not saved yet</p>
      ) : (
        showResult &&
        result?.ok && (
          <p role="status" className="text-[0.7rem] font-semibold text-olive-deep">
            ✓ Saved
          </p>
        )
      )}
    </form>
  );
}
