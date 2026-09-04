// src/app/apple-icon.tsx
// iOS home-screen icon — Next.js auto-links this too. Needs a full-bleed
// background (unlike the favicon): iOS masks it into a rounded square
// itself and a transparent icon looks broken on a springboard, so this
// one is the ink/brass/paper treatment instead of transparent.

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B2A3A",
        }}
      >
        <svg width="122" height="96" viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg">
          <path d="M40,24 L72,52 L72,84 L8,84 L8,52 Z" fill="none" stroke="#C89B3C" strokeWidth="7" />
          <path d="M97,34 L129,62 L129,94 L65,94 L65,62 Z" fill="#FBFAF6" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
