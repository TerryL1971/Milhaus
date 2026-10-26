// src/instrumentation-client.ts
// Sentry init for the browser. Next.js loads this file automatically by
// its filename/location — nothing imports it explicitly.

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // sendDefaultPii defaults to false (not set here) — Sentry won't attach
  // IP addresses on its own. beforeSend is the GDPR-minimization backstop
  // for everything else an error event can still carry: request cookies/
  // headers (session tokens), breadcrumbs (a typed email, a URL with a
  // query param), request body data. See src/lib/sentry-scrub.ts.
  beforeSend: scrubSentryEvent,
});

// Traces client-side navigations as part of the same performance
// instrumentation above — without this Sentry only sees page loads, not
// route transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
