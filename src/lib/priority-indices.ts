// src/lib/priority-indices.ts
// Picks which cards in a grid's first row should get Next.js Image's
// `priority` prop. A single `findIndex` (just the very first match)
// wasn't enough: every card in a row renders at the same pixel size, so
// which one the browser actually measures as the LCP element can land on
// any of them depending on decode/network timing — not necessarily the
// first. Prioritizing the whole first row (not just index 0) is what
// actually stops the warning from bouncing between cards across reloads.

export function firstPhotoIndices<T>(items: T[], hasPhoto: (item: T) => boolean, rowSize: number): Set<number> {
  const indices = new Set<number>();
  for (let i = 0; i < items.length && indices.size < rowSize; i++) {
    if (hasPhoto(items[i])) indices.add(i);
  }
  return indices;
}
