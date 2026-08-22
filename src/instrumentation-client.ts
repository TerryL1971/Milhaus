// src/instrumentation-client.ts
// Sentry init for the browser. Next.js loads this file automatically by
// its filename/location — nothing imports it explicitly.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// Traces client-side navigations as part of the same performance
// instrumentation above — without this Sentry only sees page loads, not
// route transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
