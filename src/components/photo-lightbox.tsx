// src/components/photo-lightbox.tsx
// Full-screen photo viewer (Charlie, 2026-11-05: "when you look at the
// pictures, can they enlarge?" — and on a phone or tablet, a gesture
// should enlarge them). Opened from any listing or event photo.
//
// Touch: pinch to zoom, drag to pan a zoomed photo, double-tap to zoom
// in/out, swipe left/right for the next photo, swipe down to close.
// Mouse/keyboard: arrows (buttons or keys), double-click or the wheel to
// zoom, Esc to close. Gestures are handled here with pointer events (the
// overlay sets touch-action: none) rather than left to the browser, so
// pinching zooms the photo instead of the whole page.
//
// Shows the original upload (unoptimized), not a resized copy — zooming
// in on a downsized image would just show blur.

"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_PX = 60;

type Point = { x: number; y: number };

/** Keeps a zoomed photo from being dragged off-screen: it can move at
 * most as far as it overhangs the viewport at this scale. */
function clampOffset(offset: Point, scale: number): Point {
  const maxX = ((scale - 1) * window.innerWidth) / 2;
  const maxY = ((scale - 1) * window.innerHeight) / 2;
  return { x: Math.min(maxX, Math.max(-maxX, offset.x)), y: Math.min(maxY, Math.max(-maxY, offset.y)) };
}

export function PhotoLightbox({
  photos,
  startIndex,
  alt,
  onClose,
}: {
  photos: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}) {
  const t = useTranslations("PhotoGallery");
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragY, setDragY] = useState(0); // swipe-down-to-close feedback
  const [animating, setAnimating] = useState(false);

  const closeRef = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{
    start: Point;
    startOffset: Point;
    startScale: number;
    pinchDistance: number | null;
    moved: boolean;
  } | null>(null);
  const lastTap = useRef<{ time: number; point: Point } | null>(null);

  const count = photos.length;
  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);
  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setIndex((current) => (current + delta + count) % count);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    },
    [count],
  );

  // Keyboard, scroll lock, focus.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [go, onClose]);

  // Zoom towards a point (in screen coordinates relative to the centre),
  // so whatever is under the finger/cursor stays under it.
  function zoomTo(nextScale: number, focus: Point) {
    const clamped = Math.min(MAX_SCALE, Math.max(1, nextScale));
    if (clamped === 1) {
      resetZoom();
      return;
    }
    const ratio = clamped / scale;
    setOffset((current) =>
      clampOffset({ x: focus.x - (focus.x - current.x) * ratio, y: focus.y - (focus.y - current.y) * ratio }, clamped),
    );
    setScale(clamped);
  }

  function centred(event: { clientX: number; clientY: number }): Point {
    return { x: event.clientX - window.innerWidth / 2, y: event.clientY - window.innerHeight / 2 };
  }

  function onPointerDown(event: React.PointerEvent) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setAnimating(false);
    const points = [...pointers.current.values()];
    gesture.current = {
      start: { x: event.clientX, y: event.clientY },
      startOffset: offset,
      startScale: scale,
      pinchDistance: points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : null,
      moved: false,
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;
    const points = [...pointers.current.values()];

    if (points.length === 2 && g.pinchDistance) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const mid = centred({ clientX: (points[0].x + points[1].x) / 2, clientY: (points[0].y + points[1].y) / 2 });
      const next = Math.min(MAX_SCALE, Math.max(1, g.startScale * (distance / g.pinchDistance)));
      const ratio = next / g.startScale;
      setScale(next);
      setOffset(clampOffset({ x: mid.x - (mid.x - g.startOffset.x) * ratio, y: mid.y - (mid.y - g.startOffset.y) * ratio }, next));
      g.moved = true;
      return;
    }

    const dx = event.clientX - g.start.x;
    const dy = event.clientY - g.start.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) g.moved = true;
    if (scale > 1) {
      setOffset(clampOffset({ x: g.startOffset.x + dx, y: g.startOffset.y + dy }, scale));
    } else if (dy > 0 && Math.abs(dy) > Math.abs(dx)) {
      setDragY(dy);
    }
  }

  function onPointerUp(event: React.PointerEvent) {
    const g = gesture.current;
    const wasPinch = pointers.current.size === 2;
    pointers.current.delete(event.pointerId);
    if (!g) return;
    if (wasPinch) {
      // One finger still down after a pinch: carry on as a pan from here.
      const remaining = [...pointers.current.values()][0];
      if (remaining) {
        gesture.current = { start: remaining, startOffset: offset, startScale: scale, pinchDistance: null, moved: true };
      } else {
        gesture.current = null;
      }
      if (scale <= 1.02) resetZoom();
      return;
    }
    gesture.current = null;
    setAnimating(true);

    const dx = event.clientX - g.start.x;
    const dy = event.clientY - g.start.y;

    if (!g.moved) {
      // A tap: two within 300ms is a double-tap → toggle zoom there.
      const now = Date.now();
      const point = { x: event.clientX, y: event.clientY };
      const previous = lastTap.current;
      if (previous && now - previous.time < 300 && Math.hypot(point.x - previous.point.x, point.y - previous.point.y) < 30) {
        lastTap.current = null;
        if (scale > 1) resetZoom();
        else zoomTo(DOUBLE_TAP_SCALE, centred(event));
      } else {
        lastTap.current = { time: now, point };
      }
      return;
    }

    if (scale > 1) return; // that was a pan
    setDragY(0);
    if (dy > 120 && Math.abs(dy) > Math.abs(dx)) onClose();
    else if (dx <= -SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(1);
    else if (dx >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(-1);
  }

  function onWheel(event: React.WheelEvent) {
    setAnimating(false);
    zoomTo(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), centred(event));
  }

  const controlClass =
    "flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-2xl text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur transition-colors hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] select-none bg-black/95"
      style={{ touchAction: "none", opacity: dragY ? Math.max(0.4, 1 - dragY / 400) : 1 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y + dragY}px) scale(${scale})`,
          transition: animating ? "transform 180ms ease-out" : "none",
          cursor: scale > 1 ? "grab" : "zoom-in",
        }}
      >
        <Image
          key={photos[index]}
          src={photos[index]}
          alt={`${alt} — ${index + 1} / ${count}`}
          fill
          unoptimized
          draggable={false}
          sizes="100vw"
          className="object-contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 sm:p-4">
        <span className="rounded-full bg-black/40 px-3 py-1 font-mono text-sm text-white">
          {t("counter", { current: index + 1, total: count })}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label={t("close")} className={`pointer-events-auto ${controlClass}`}>
          ×
        </button>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t("previous")}
            className={`absolute left-3 top-1/2 -translate-y-1/2 sm:left-5 ${controlClass}`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t("next")}
            className={`absolute right-3 top-1/2 -translate-y-1/2 sm:right-5 ${controlClass}`}
          >
            ›
          </button>
        </>
      )}

      {scale === 1 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <span className="rounded-full bg-black/55 px-3 py-1 text-center text-xs text-white/85 backdrop-blur">
            {t("zoomHint")}
          </span>
        </p>
      )}
    </div>
  );
}

/** Wraps anything (a photo) so tapping it opens the lightbox at `index`.
 * Usable from server components, e.g. the event page's photo grid. */
export function LightboxTrigger({
  photos,
  index,
  alt,
  className,
  children,
}: {
  photos: string[];
  index: number;
  alt: string;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("PhotoGallery");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("enlarge", { number: index + 1 })}
        className={`block cursor-zoom-in ${className ?? ""}`}
      >
        {children}
      </button>
      {/* Portalled to <body>: not nested inside the button (a dialog full
          of buttons can't live in one), and clear of any parent's
          overflow, transform or stacking context. */}
      {open &&
        createPortal(
          <PhotoLightbox photos={photos} startIndex={index} alt={alt} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}
