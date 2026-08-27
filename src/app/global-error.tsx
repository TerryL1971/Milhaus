// src/app/global-error.tsx
// Last-resort error boundary — only fires if the root layout itself
// throws (SiteHeader/SiteFooter breaking, a font failing to load, etc.),
// which regular error.tsx boundaries can't catch since they render
// *inside* the layout. Reports to Sentry, then falls back to Next's own
// minimal error UI — deliberately not styled with the site's Tailwind
// classes, since if the layout is what broke, that CSS may not be
// reliable either.

"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html suppressHydrationWarning>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
