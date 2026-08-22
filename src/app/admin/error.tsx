// src/app/admin/error.tsx
// Catches a failed moderation action (e.g. an expired session) with a
// plain-language message and a retry button, instead of a raw crash
// screen — Charlie uses this page daily.

"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-8 py-20">
      <div className="max-w-md rounded-md border border-canvas-deep bg-paper p-6 text-center">
        <p className="mb-2 font-display text-xl font-semibold text-ink">Something went wrong</p>
        <p className="mb-5 text-sm text-ink-soft">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
