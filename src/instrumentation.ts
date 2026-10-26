// src/instrumentation.ts
// Next.js's own instrumentation hook — registered automatically, no import
// needed anywhere. Initializes Sentry for the Node.js and Edge runtimes
// (the browser side is instrumentation-client.ts). Also wires
// onRequestError, the hook Next.js calls on a server-side rendering error
// (a Server Component throwing, etc.) — without it those errors never
// reach Sentry, only ones explicitly caught and reported.

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      // Same GDPR-minimization scrubbing as the browser side — see
      // src/lib/sentry-scrub.ts. Server-side events are more likely to
      // carry raw cookies/auth headers than client-side ones, so this
      // matters here too, not just in instrumentation-client.ts.
      beforeSend: scrubSentryEvent,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
