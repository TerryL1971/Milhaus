// src/components/filter-bar.tsx
// The row shell for the Unified Category UX spec's top filter bar:
// filter-cluster dropdown buttons (passed as children) + a keyword box +
// an "N active filters applied" indicator + an explicit Apply Filters
// button + a Clear Filters button right next to it. Every browse page
// uses this same shell; only which clusters go inside differ (see
// ListingsGrid/CarsGrid/ProductsGrid/BusinessesGrid).
//
// Clear used to be one of each grid's own `children` — a plain text
// link sitting among the filter-cluster dropdown buttons, gated on
// activeCount (structured filters) alone. Terry: it needed to sit next
// to Apply instead, not buried over on the left; moving it here, next
// to Apply, put it where he expected it. That move also fixed a real
// gap, not just a cosmetic one — activeCount never counted the keyword
// box, so a page landed on via the homepage's search bar (just a
// keyword, no structured filters — see search/page.tsx's redirect) had
// no way to clear it at all. Gating on `keyword` too fixes that.

export function FilterBar({
  children,
  keyword,
  onKeywordChange,
  keywordPlaceholder,
  activeCount,
  activeLabel,
  onApply,
  applyLabel,
  onClear,
  clearLabel,
}: {
  children: React.ReactNode;
  keyword: string;
  onKeywordChange: (value: string) => void;
  keywordPlaceholder: string;
  activeCount: number;
  activeLabel: (count: number) => string;
  onApply: () => void;
  applyLabel: string;
  onClear: () => void;
  clearLabel: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center gap-2">
      {children}
      <input
        type="search"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder={keywordPlaceholder}
        className="min-w-[180px] flex-1 rounded-md border border-canvas-deep bg-paper px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-olive focus:outline-none"
      />
      {activeCount > 0 && (
        <span className="whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-wide text-brass-deep">
          {activeLabel(activeCount)}
        </span>
      )}
      <button
        type="button"
        onClick={onApply}
        className="whitespace-nowrap rounded-md bg-brass px-4 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
      >
        {applyLabel}
      </button>
      {(activeCount > 0 || keyword) && (
        <button
          type="button"
          onClick={onClear}
          className="whitespace-nowrap rounded-md border border-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-rust hover:text-rust"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
