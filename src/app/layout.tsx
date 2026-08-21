// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "milhaus — Find home before you land",
  description:
    "A rental-listing marketplace for Americans relocating to Germany, combining on-base housing office listings with self-listed homes from families rotating out.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
