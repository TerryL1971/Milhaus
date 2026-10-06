// src/components/filter-dropdown.tsx
// One "Filters" button that opens an anchored checkbox panel, replacing
// the rows of individual pill-chip buttons every browse page (Homes,
// Cars, Buy & Sell, Services) used to render inline. Each group is a
// multi-select (0 to all) checkbox list — base, amenities, make,
// category, condition, transmission, etc. — plus an optional `extra`
// slot for controls that don't fit the checkbox shape (move-in date,
// minimum bedrooms). Unlike FilterModal (which this replaces on the
// Homes page), this opens as a small anchored popover next to its
// trigger rather than a centered full-screen dialog — lighter-weight,
// and it reads as part of the search row rather than a separate
// "advanced filters" feature.

"use client";

import { useEffect, useRef, useState } from "react";

export type FilterCheckboxGroup = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
};

export function FilterDropdown({
  label,
  groups,
  activeCount,
  onClearAll,
  clearLabel,
  extra,
  align = "left",
}: {
  label: string;
  groups: FilterCheckboxGroup[];
  activeCount: number;
  onClearAll: () => void;
  clearLabel: string;
  /** Non-checkbox controls (a date input, a min-bedrooms select) shown
   * above the checkbox groups, inside the same panel. */
  extra?: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="relative flex items-center gap-2 rounded-md border border-canvas-deep bg-paper px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-olive/50 hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
        {label}
        {activeCount > 0 && (
          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brass px-1 font-mono text-[0.65rem] font-semibold text-paper">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute top-full z-30 mt-2 w-[min(90vw,340px)] max-h-[70vh] overflow-y-auto rounded-md border border-canvas-deep bg-paper p-4 shadow-[0_14px_34px_rgba(27,42,58,0.18)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {extra}

          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.label}>
                <span className="mb-1.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {group.label}
                </span>
                <div className="flex flex-col gap-1.5">
                  {group.options.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-charcoal">
                      <input
                        type="checkbox"
                        checked={group.selected.includes(option.value)}
                        onChange={() => group.onToggle(option.value)}
                        className="h-4 w-4 flex-shrink-0 rounded border-canvas-deep text-olive focus:ring-olive"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-canvas-deep pt-3">
            <button
              type="button"
              onClick={onClearAll}
              disabled={activeCount === 0}
              className="text-sm font-semibold text-ink-soft hover:text-rust disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-soft"
            >
              {clearLabel}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-brass px-4 py-2 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
            >
              {label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
