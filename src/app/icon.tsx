// src/app/icon.tsx
// Site favicon — Next.js's file-based icon convention, auto-linked into
// every page's <head> with no other wiring needed. Generated via
// next/og's ImageResponse rather than a static file, so the exact same
// path data as src/components/logo-icon.tsx (and the concept page it came
// from) can be reused directly instead of hand-exporting a PNG. Sits at
// the app root (not under [locale]) — applies site-wide, admin included,
// same as favicon.ico did before this replaced it.

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg">
        <path d="M40,24 L72,52 L72,84 L8,84 L8,52 Z" fill="none" stroke="#C89B3C" strokeWidth="7" />
        <path d="M97,34 L129,62 L129,94 L65,94 L65,62 Z" fill="#1B2A3A" />
      </svg>
    ),
    { ...size },
  );
}
