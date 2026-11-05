// src/components/listing-photo-gallery.tsx
// All photos show as thumbnails (including whichever one is currently the
// hero) — clicking one swaps the large hero image to it. Not a fixed hero
// + a separate "more photos" strip; every photo is reachable the same way.
// Tapping the large photo opens it full-screen (PhotoLightbox), where it
// can be pinched/zoomed and swiped through (Charlie, 2026-11-05).

"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { LightboxTrigger } from "@/components/photo-lightbox";

export function ListingPhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  /** What this listing actually is, for descriptive alt text — e.g.
   * "2-bedroom home in Ramstein" or "2019 Toyota Camry SE". */
  alt: string;
}) {
  const t = useTranslations("PhotoGallery");
  const [selected, setSelected] = useState(0);
  const hero = photos[selected];

  return (
    <>
      {hero ? (
        <LightboxTrigger photos={photos} index={selected} alt={alt} className="group relative h-72 w-full overflow-hidden rounded-md sm:h-96">
          <Image src={hero} alt={alt} fill sizes="(min-width: 640px) 860px, 100vw" className="object-cover" priority />
          <span
            aria-hidden="true"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors group-hover:bg-black/75"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3h5v5M8 17H3v-5M17 3l-6 6M3 17l6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("enlargeBadge")}
          </span>
        </LightboxTrigger>
      ) : (
        <div className="relative h-72 overflow-hidden rounded-md sm:h-96">
          <div
            className="h-full w-full"
            style={{ background: "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)" }}
          />
        </div>
      )}

      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={t("showPhoto", { number: index + 1 })}
              aria-current={index === selected}
              className={`relative h-20 overflow-hidden rounded-md sm:h-24 ${
                index === selected
                  ? "ring-2 ring-olive ring-offset-2 ring-offset-canvas"
                  : "opacity-75 transition-opacity hover:opacity-100"
              }`}
            >
              <Image src={photo} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
