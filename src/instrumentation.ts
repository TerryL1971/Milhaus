// src/instrumentation.ts
// Next.js's own instrumentation hook — registered automatically, no import
// needed anywhere. Initializes Sentry for the Node.js and Edge runtimes
// (the browser side is instrumentation-client.ts). Also wires
// onRequestError, the hook Next.js calls on a server-side rendering error
// (a Server Component throwing, etc.) — without it those errors never
// reach Sentry, only ones explicitly caught and reported.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
