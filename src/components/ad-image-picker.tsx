// src/components/ad-image-picker.tsx
// The "Upload the image" button on Admin → Ads (add and edit), with a
// crop screen like other sites use for profile photos. Terry, 2026-11-13:
// Milinsure sent their banner as a 2048×682 picture with thick pink bands
// above and below the actual 2048×156 strip, so the banner showed tiny.
// Charlie shouldn't need a photo editor to fix that.
//
// How it works:
//   - Charlie picks a file. The image appears with a crop frame he can
//     drag, and resize from its edges and corners.
//   - The frame starts on the image without its blank edges: any border
//     that's one flat colour (Milinsure's pink, white, black) is trimmed
//     automatically ("Trim blank edges" redoes it, "Whole image" undoes it).
//   - The frame keeps the shape of the spot where it has a fixed shape:
//     Cars sidebar 1:2 (300×600), Special Offers 5:6 (about 500×600). The
//     site banner has no fixed shape (fluid width, fixed height), so its
//     frame is free.
//   - Every change re-crops the image in the browser and puts the cropped
//     file into the form's own "image" field, so the server receives a
//     ready-cropped file (src/app/admin/ads/actions.ts) and nothing else
//     changes. A preview shows it at the size the spot shows it.
//
// Uses react-image-crop for the frame.

"use client";

import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type { AdPlacement } from "@/lib/ad-slots";

/** Width ÷ height the crop frame keeps, per spot. null = any shape. */
const ASPECTS: Record<AdPlacement, number | null> = {
  site_banner: null,
  cars_sidebar: 300 / 600,
  special_offers: 500 / 600,
};

/** Wide enough for sharp retina screens, small enough to upload quickly. */
const MAX_OUTPUT_WIDTH = 3072;
/** The server takes up to 3 MB (src/app/admin/ads/actions.ts). */
const MAX_BYTES = 3 * 1024 * 1024;

/** The part of the image inside a flat-coloured border, as a percent crop.
 * Reads a scaled-down copy, compares each edge row/column with the
 * top-left corner's colour, and stops at the first row/column where more
 * than 2% of pixels differ (JPEG noise makes "flat" never quite flat). */
function trimmedArea(image: HTMLImageElement): PercentCrop {
  const whole: PercentCrop = { unit: "%", x: 0, y: 0, width: 100, height: 100 };
  const scale = Math.min(1, 600 / Math.max(image.naturalWidth, image.naturalHeight));
  const w = Math.max(1, Math.round(image.naturalWidth * scale));
  const h = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return whole;
  context.drawImage(image, 0, 0, w, h);
  let data: Uint8ClampedArray;
  try {
    data = context.getImageData(0, 0, w, h).data;
  } catch {
    return whole;
  }
  const [r0, g0, b0] = [data[0], data[1], data[2]];
  const differs = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0) > 60;
  };
  const rowHasContent = (y: number) => {
    let count = 0;
    for (let x = 0; x < w; x++) if (differs(x, y)) count++;
    return count > w * 0.02;
  };
  const columnHasContent = (x: number, top: number, bottom: number) => {
    let count = 0;
    for (let y = top; y <= bottom; y++) if (differs(x, y)) count++;
    return count > (bottom - top + 1) * 0.02;
  };
  let top = 0;
  while (top < h - 1 && !rowHasContent(top)) top++;
  let bottom = h - 1;
  while (bottom > top && !rowHasContent(bottom)) bottom--;
  let left = 0;
  while (left < w - 1 && !columnHasContent(left, top, bottom)) left++;
  let right = w - 1;
  while (right > left && !columnHasContent(right, top, bottom)) right--;
  // Nothing found, or nothing to trim: use the whole image.
  if (bottom - top < 4 || right - left < 4) return whole;
  // A pixel in from each side, so a soft JPEG edge of the border colour
  // doesn't stay in.
  const pad = 1;
  const x = Math.min(left + pad, right);
  const y = Math.min(top + pad, bottom);
  return {
    unit: "%",
    x: (x / w) * 100,
    y: (y / h) * 100,
    width: ((Math.max(right - pad, x) - x + 1) / w) * 100,
    height: ((Math.max(bottom - pad, y) - y + 1) / h) * 100,
  };
}

/** Fits the spot's shape inside an area, centred in it. */
function fitAspect(area: PercentCrop, aspect: number | null, image: HTMLImageElement): PercentCrop {
  if (!aspect) return area;
  const areaW = (area.width / 100) * image.naturalWidth;
  const areaH = (area.height / 100) * image.naturalHeight;
  const crop =
    areaW / areaH > aspect
      ? makeAspectCrop({ unit: "%", height: area.height }, aspect, image.naturalWidth, image.naturalHeight)
      : makeAspectCrop({ unit: "%", width: area.width }, aspect, image.naturalWidth, image.naturalHeight);
  return {
    ...crop,
    x: area.x + (area.width - crop.width) / 2,
    y: area.y + (area.height - crop.height) / 2,
  };
}

async function cropToFile(image: HTMLImageElement, crop: PercentCrop, original: File): Promise<File | null> {
  const sx = (crop.x / 100) * image.naturalWidth;
  const sy = (crop.y / 100) * image.naturalHeight;
  const sw = (crop.width / 100) * image.naturalWidth;
  const sh = (crop.height / 100) * image.naturalHeight;
  if (sw < 1 || sh < 1) return null;
  const scale = Math.min(1, MAX_OUTPUT_WIDTH / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  // PNG keeps text and logos crisp; JPEG for photos, or if a PNG is too big.
  const toBlob = (type: string, quality?: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = original.type === "image/png" ? await toBlob("image/png") : null;
  for (const quality of [0.92, 0.85, 0.75, 0.6]) {
    if (blob && blob.size <= MAX_BYTES) break;
    blob = await toBlob("image/jpeg", quality);
  }
  if (!blob) return null;
  const base = original.name.replace(/\.[^.]+$/, "") || "ad";
  const ext = blob.type === "image/png" ? "png" : "jpg";
  return new File([blob], `${base}-cropped.${ext}`, { type: blob.type });
}

export function AdImagePicker({
  placement,
  placementSelectId,
}: {
  /** The spot, when the page already knows it (editing an ad). */
  placement?: AdPlacement;
  /** Or the id of the form's placement dropdown (adding an ad). */
  placementSelectId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const originalRef = useRef<File | null>(null);
  const [chosenPlacement, setChosenPlacement] = useState<AdPlacement | null>(placement ?? null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState<PercentCrop>();
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const aspect = chosenPlacement ? ASPECTS[chosenPlacement] : null;

  // Adding an ad: follow the Placement dropdown, so the frame takes that
  // spot's shape (and changes shape if Charlie changes the dropdown).
  useEffect(() => {
    if (!placementSelectId) return;
    const select = document.getElementById(placementSelectId) as HTMLSelectElement | null;
    if (!select) return;
    const read = () => setChosenPlacement((select.value || null) as AdPlacement | null);
    read();
    select.addEventListener("change", read);
    return () => select.removeEventListener("change", read);
  }, [placementSelectId]);

  // Re-fit the frame when the spot's shape changes.
  useEffect(() => {
    const image = imageRef.current;
    if (!image || !image.naturalWidth) return;
    const area = trimmedArea(image);
    const next = fitAspect(area, aspect, image);
    const timer = setTimeout(() => {
      setCrop(next);
      void apply(next);
    }, 0);
    return () => clearTimeout(timer);
  }, [aspect]);


  /** Puts the cropped file into the form's "image" field. */
  async function apply(next: PercentCrop) {
    const image = imageRef.current;
    const original = originalRef.current;
    const input = inputRef.current;
    if (!image || !original || !input) return;
    const file = await cropToFile(image, next, original);
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    // Free the previous preview's memory as it's replaced. (Not in an
    // effect clean-up: React runs those early in development, which freed
    // the image before it had loaded.)
    const url = URL.createObjectURL(file);
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
    setNote(file.size > MAX_BYTES ? "This image is still over 3 MB — crop it smaller." : null);
  }

  function onChoose() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNote("That isn't an image file — choose a JPG or PNG.");
      return;
    }
    originalRef.current = file;
    setCrop(undefined);
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setNote(null);
    const url = URL.createObjectURL(file);
    setSource((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
  }

  function onImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    const next = fitAspect(trimmedArea(image), aspect, image);
    setCrop(next);
    void apply(next);
  }

  function useWhole() {
    const image = imageRef.current;
    if (!image) return;
    const next = aspect
      ? centerCrop(
          makeAspectCrop({ unit: "%", width: 100 }, aspect, image.naturalWidth, image.naturalHeight),
          image.naturalWidth,
          image.naturalHeight,
        )
      : ({ unit: "%", x: 0, y: 0, width: 100, height: 100 } as PercentCrop);
    // A tall image in a wide frame: makeAspectCrop can overshoot; fit it.
    const fitted = next.height > 100 ? fitAspect({ unit: "%", x: 0, y: 0, width: 100, height: 100 }, aspect, image) : next;
    setCrop(fitted);
    void apply(fitted);
  }

  function trim() {
    const image = imageRef.current;
    if (!image) return;
    const next = fitAspect(trimmedArea(image), aspect, image);
    setCrop(next);
    void apply(next);
  }

  const buttonClass =
    "rounded-md border border-canvas-deep bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-olive hover:text-olive-deep";

  return (
    <div>
      {/* Styled as a real button (Terry, 2026-11-13) — the browser's own
          file box looked like plain text Charlie might not click. The
          chosen file's name shows beside it. */}
      <input
        ref={inputRef}
        id="image"
        name="image"
        type="file"
        accept="image/*"
        onChange={onChoose}
        className="block w-full text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-paper hover:file:bg-ink-soft"
      />

      {source && (
        <div className="mt-3 rounded-md border border-canvas-deep bg-paper p-3">
          <p className="mb-2 text-xs text-ink-soft">
            <span className="font-semibold text-charcoal">Crop:</span> drag the frame to move it, or its edges
            and corners to resize it. Only what&apos;s inside the frame is used.
            {aspect
              ? " The frame keeps the shape of this spot."
              : chosenPlacement === "site_banner"
                ? " The banner can be any shape — a long, thin strip fills it best."
                : " Choose the placement above and the frame takes that spot's shape."}
          </p>
          <div className="flex justify-center bg-[repeating-conic-gradient(#e6e1d2_0_25%,#fbfaf6_0_50%)] bg-[length:16px_16px]">
            <ReactCrop
              crop={crop}
              aspect={aspect ?? undefined}
              keepSelection
              ruleOfThirds
              onChange={(_pixel, percent) => setCrop(percent)}
              onComplete={(_pixel, percent) => void apply(percent)}
            >
              {/* A local preview of the chosen file (blob: URL), which
                  next/image can't optimise. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imageRef} src={source} alt="The chosen image" onLoad={onImageLoad} className="max-h-[420px] w-auto" />
            </ReactCrop>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={trim} className={buttonClass}>
              Trim blank edges
            </button>
            <button type="button" onClick={useWhole} className={buttonClass}>
              Whole image
            </button>
          </div>

          {preview && (
            <div className="mt-4">
              <p className="mb-1 font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
                How it will look on the site
              </p>
              {chosenPlacement === "cars_sidebar" ? (
                // Half size of the real 300×600 spot.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-[300px] w-[150px] rounded object-contain" />
              ) : chosenPlacement === "special_offers" ? (
                // Half size of the real card (about 500×600, object-cover).
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-[300px] w-[250px] rounded object-cover" />
              ) : (
                // The banner: full width, 96px tall, image fitted inside.
                <div className="flex h-24 w-full items-center justify-center bg-canvas">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {note && (
        <p role="alert" className="mt-2 text-xs font-semibold text-rust">
          {note}
        </p>
      )}
    </div>
  );
}
