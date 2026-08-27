// src/components/listing-photo-gallery.tsx
// All photos show as thumbnails (including whichever one is currently the
// hero) — clicking one swaps the large hero image to it. Not a fixed hero
// + a separate "more photos" strip; every photo is reachable the same way.

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { StampBadge } from "@/components/stamp-badge";

export function ListingPhotoGallery({
  photos,
  showStamp,
}: {
  photos: string[];
  showStamp: boolean;
}) {
  const t = useTranslations("PhotoGallery");
  const [selected, setSelected] = useState(0);
  const hero = photos[selected];

  return (
    <>
      <div className="relative h-72 overflow-hidden rounded-md sm:h-96">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config here
          <img src={hero} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: "linear-gradient(135deg, #C9B896, #8E9B7A 60%, #6B7353)" }}
          />
        )}
        {showStamp && <StampBadge size="lg" className="right-4 top-4" />}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={t("showPhoto", { number: index + 1 })}
              aria-current={index === selected}
              className={`h-20 overflow-hidden rounded-md sm:h-24 ${
                index === selected
                  ? "ring-2 ring-olive ring-offset-2 ring-offset-canvas"
                  : "opacity-75 transition-opacity hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not worth next/image's config here */}
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
