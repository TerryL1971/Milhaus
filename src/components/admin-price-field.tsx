// src/components/admin-price-field.tsx
// One price box with its own Save button, used for every price on
// Admin → Pricing: the posting prices, and the advertising prices
// (1. price for 30 days, 2. discount for longer runs, 3. the price
// list).
//
// Terry, 2026-11-11: after changing several prices he couldn't tell
// which ones still needed saving, so he saved them all. He wanted to
// keep a Save button on each row (a single Save-all button was tried
// the same day and he preferred these), with the box highlighted when
// its price has changed but isn't saved yet:
//   - changed, not saved: red outline, "Not saved yet" under it, and
//     that row's Save button turns red;
//   - after saving: "✓ Saved" (or what went wrong) — on the page, no
//     pop-up (Charlie's preference).
// "Changed" is compared with the saved value from the server, which
// updates after a save, so the highlight goes away by itself. A box
// that may be left empty (the price list's own-price boxes, where
// empty means "use the worked-out price") counts empty as a value.

"use client";

import { type ReactNode, useActionState, useState } from "react";
import type { SavePriceResult } from "@/app/admin/pricing/actions";

/** "5", "5.0" and "5.00" are the same price; empty stays empty. */
function normalise(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  const number = Number(trimmed);
  return Number.isFinite(number) ? String(number) : trimmed;
}

export function AdminPriceField({
  action,
  hidden,
  name,
  savedValue,
  ariaLabel,
  min = "0",
  max,
  step = "0.50",
  required = true,
  placeholder,
  label,
  labelClassName = "w-48 font-medium text-ink",
  suffix,
  fixed = false,
  inputWidth = "w-24",
  className = "flex flex-wrap items-center gap-2",
  messageAlign = "left",
}: {
  action: (previous: SavePriceResult, formData: FormData) => Promise<SavePriceResult>;
  /** Hidden fields that say which price this is (type, placement, days). */
  hidden: Record<string, string>;
  name: string;
  /** The saved value as text — "" when nothing is saved. */
  savedValue: string;
  ariaLabel: string;
  min?: string;
  max?: string;
  step?: string;
  required?: boolean;
  placeholder?: string;
  /** Text before the box (the row's name), and its classes. Plain text
   * rather than elements: elements handed over from the server page
   * made React warn about missing keys. */
  label?: string;
  labelClassName?: string;
  /** Text between the box and Save (e.g. "% off"). */
  suffix?: string;
  /** Shows the small "Fixed" tag after Save (the price list). */
  fixed?: boolean;
  inputWidth?: string;
  className?: string;
  messageAlign?: "left" | "right";
}) {
  const [value, setValue] = useState(savedValue);
  const [result, submit, pending] = useActionState(action, null);
  const [showResult, setShowResult] = useState(false);
  const changed = normalise(value) !== normalise(savedValue);

  const messageClass = `text-[0.7rem] font-semibold ${messageAlign === "right" ? "text-right" : ""}`;
  let message: ReactNode = null;
  if (!pending) {
    if (showResult && result && !result.ok) {
      message = (
        <p role="alert" className={`${messageClass} text-rust`}>
          {result.message}
        </p>
      );
    } else if (changed) {
      message = <p className={`${messageClass} text-brass`}>Not saved yet</p>;
    } else if (showResult && result?.ok) {
      message = (
        <p role="status" className={`${messageClass} text-olive-deep`}>
          ✓ Saved
        </p>
      );
    }
  }

  return (
    <div>
      <form
        action={(formData) => {
          setShowResult(true);
          submit(formData);
        }}
        className={className}
      >
        {Object.entries(hidden).map(([key, hiddenValue]) => (
          <input key={key} type="hidden" name={key} value={hiddenValue} />
        ))}
        {label && <span className={labelClassName}>{label}</span>}
        <input
          type="number"
          name={name}
          min={min}
          max={max}
          step={step}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            setValue(event.target.value);
            setShowResult(false);
          }}
          aria-label={ariaLabel}
          className={`${inputWidth} rounded-md border px-3 py-1.5 text-sm text-charcoal placeholder:text-ink-soft/50 focus:outline-none ${
            changed
              ? "border-brass bg-paper font-semibold ring-2 ring-brass/30"
              : "border-canvas-deep bg-canvas focus:border-olive"
          }`}
        />
        {suffix && <span className="text-sm text-ink-soft">{suffix}</span>}
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
        {fixed && (
          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-olive-deep">Fixed</span>
        )}
      </form>
      {message && <div className="mt-1">{message}</div>}
    </div>
  );
}
