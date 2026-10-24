// src/components/coming-soon-panel.tsx
// Shown in place of a homepage "Featured X" row's card grid when that
// category has zero active listings — e.g. once Charlie deletes the
// placeholder/mock data used during development, before real inventory
// exists. One wide panel, not a row of filler cards.

export function ComingSoonPanel({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-canvas-deep bg-canvas/40 px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold text-ink">{heading}</p>
      <p className="text-sm text-ink-soft">{body}</p>
    </div>
  );
}
