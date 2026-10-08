// src/components/filter-cluster.tsx
// One labeled dropdown button in the unified top filter bar (Base,
// Category Specifics, Price, Features/Badges — per the Unified Category
// UX spec). Deliberately dumb: it just shows `children` in an anchored
// popover and reports open/closed. The filter bar itself owns all the
// pending-vs-applied state; this component has no opinion on what kind
// of controls live inside (checkboxes, a price range, anything).

"use client";

import { useEffect, useRef, useState } from "react";

export function FilterCluster({
  label,
  icon,
  badge,
  children,
}: {
  label: string;
  icon?: string;
  badge?: number;
  children: React.ReactNode;
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
        className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-canvas-deep bg-paper px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-olive/50 hover:text-ink"
      >
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
        {badge ? <span className="font-mono text-[0.72rem] text-brass-deep">({badge})</span> : null}
        <span aria-hidden="true" className="text-[0.65rem] text-ink-soft/60">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(90vw,300px)] max-h-[70vh] overflow-y-auto rounded-md border border-canvas-deep bg-paper p-4 shadow-[0_14px_34px_rgba(27,42,58,0.18)]">
          {children}
        </div>
      )}
    </div>
  );
}
