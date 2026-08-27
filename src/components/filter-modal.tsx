// src/components/filter-modal.tsx
// The hero's filter icon — opens a modal covering every filter dimension
// (base, move-in, bedrooms, amenities) in one place, with a badge showing
// how many are active and a one-click "Clear all." Filters apply live as
// you change them (each control writes straight to the URL via
// useListingFilters, same as the chips below) rather than needing a
// separate "Apply" step — matches how the chips already behave, so this
// isn't a second, differently-behaved filter UI bolted onto the first.

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AMENITY_KEYS } from "@/lib/amenities";
import { BASE_NAMES } from "@/lib/bases";
import { useListingFilters } from "@/lib/use-listing-filters";

export function FilterModal() {
  const t = useTranslations("FilterModal");
  const tHome = useTranslations("HomePage");
  const tForm = useTranslations("ListingForm");
  const tAmenities = useTranslations("Amenities");
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const {
    ALL_BASES,
    activeBase,
    minBedrooms,
    moveIn,
    activeAmenities,
    activeCount,
    setActiveBase,
    setBedrooms,
    setMoveIn,
    toggleAmenity,
    clearAll,
  } = useListingFilters();

  // Escape to close, and give focus to the dialog on open / back to the
  // trigger on close — a modal that traps a keyboard user without a way
  // out, or silently drops focus into the page body, is worse than not
  // having one.
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";
    const trigger = triggerRef.current;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={activeCount > 0 ? t("openLabelWithCount", { count: activeCount }) : t("openLabel")}
        className="relative flex h-[42px] w-[42px] flex-none items-center justify-center rounded-md border border-canvas-deep bg-paper text-ink-soft transition-colors hover:border-olive/50 hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rust px-1 font-mono text-[0.65rem] font-semibold text-paper">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop — click to close, same as Escape. */}
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-modal-title"
            tabIndex={-1}
            className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-md bg-paper p-6 shadow-[0_20px_50px_rgba(27,42,58,0.3)] focus:outline-none"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="filter-modal-title" className="font-display text-xl font-semibold text-ink">
                {t("title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="text-2xl leading-none text-ink-soft hover:text-ink"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label htmlFor="modal-base" className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {tHome("searchNearBase")}
                </label>
                <select
                  id="modal-base"
                  value={activeBase === ALL_BASES ? "" : activeBase}
                  onChange={(event) => setActiveBase(event.target.value || ALL_BASES)}
                  className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
                >
                  <option value="">{tHome("searchAnyBase")}</option>
                  {BASE_NAMES.map((base) => (
                    <option key={base} value={base}>
                      {base}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-movein" className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {tHome("searchMoveIn")}
                </label>
                <input
                  id="modal-movein"
                  type="date"
                  value={moveIn}
                  onChange={(event) => setMoveIn(event.target.value)}
                  className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-bedrooms" className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {tHome("searchBedrooms")}
                </label>
                <select
                  id="modal-bedrooms"
                  value={minBedrooms || ""}
                  onChange={(event) => setBedrooms(Number(event.target.value))}
                  className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
                >
                  <option value="">{tHome("searchAnyBedrooms")}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>

              <div>
                <span className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                  {tForm("features")}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_KEYS.map((key) => (
                    <label key={key} className="flex min-w-0 items-center gap-2 text-sm text-charcoal">
                      <input
                        type="checkbox"
                        checked={activeAmenities.includes(key)}
                        onChange={() => toggleAmenity(key)}
                        className="h-4 w-4 flex-shrink-0 rounded border-canvas-deep text-olive focus:ring-olive"
                      />
                      <span>{tAmenities(key)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-canvas-deep pt-4">
              <button
                type="button"
                onClick={clearAll}
                disabled={activeCount === 0}
                className="text-sm font-semibold text-ink-soft hover:text-rust disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-soft"
              >
                {t("clearAll")}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
              >
                {t("done")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
