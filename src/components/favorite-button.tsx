// src/components/favorite-button.tsx
// The heart icon overlaid on a Homes/Cars card. A plain <form> posting
// to a server action — no client JS needed. Rendered as a sibling of
// the card's own <Link>, not nested inside it: an <a> can't contain a
// nested interactive <button> without breaking click handling (the
// heart click would also trigger the card's own navigation), so the
// card component wraps both in a shared `relative` parent instead of
// putting this inside the anchor.

import { toggleFavorite } from "@/app/actions/favorites";

export function FavoriteButton({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) {
  return (
    <form action={toggleFavorite} className="absolute right-2.5 top-2.5 z-10">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="wasFavorited" value={String(isFavorited)} />
      <button
        type="submit"
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorited}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition-colors hover:bg-ink/80"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={isFavorited ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className={isFavorited ? "text-rust" : "text-paper"}
          aria-hidden="true"
        >
          <path d="M12 21s-7.5-4.6-10-9.1C.6 8.8 1.8 5 5.3 4 7.6 3.3 9.8 4.3 12 7c2.2-2.7 4.4-3.7 6.7-3 3.5 1 4.7 4.8 3.3 7.9C19.5 16.4 12 21 12 21z" />
        </svg>
      </button>
    </form>
  );
}
