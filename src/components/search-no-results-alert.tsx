// src/components/search-no-results-alert.tsx
// A dismissible red alert shown above a page's own search bar when a
// search/filter attempt finds nothing — Terry: wanted this above the
// search bar, not a gray line of text sitting where the results grid
// would otherwise be, and dismissible with an "×" rather than a message
// that just lingers there. Shared by every grid with its own search box
// (ListingsGrid/CarsGrid/ProductsGrid/BusinessesGrid/EventsBrowser) plus
// the homepage, for the one case search/page.tsx's redirect can't send
// anywhere at all (nothing matched in any category — see that file).
//
// Each caller owns its own "dismissed" boolean rather than this
// component tracking it internally — a *new* search that also finds
// nothing needs to re-show the alert, and only the caller knows when
// the search actually changed.

"use client";

export function SearchNoResultsAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1 -mt-1 flex-none rounded-md px-2 py-1 text-base font-semibold leading-none text-rust hover:bg-rust/15"
      >
        ×
      </button>
    </div>
  );
}
