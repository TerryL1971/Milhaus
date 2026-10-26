// src/lib/sentry-scrub.ts
// GDPR data-minimization for error reports — shared by both Sentry init
// points (instrumentation.ts for server/edge, instrumentation-client.ts
// for the browser). sendDefaultPii is left at its default (false), so
// Sentry never attaches an IP address on its own; this is the backstop
// for everything else an error event can still carry: cookies/auth
// headers on the request, breadcrumbs (a typed email, a URL with a
// token in it), and the request body itself. Milhaus doesn't need any
// of that to debug a crash — the stack trace and route are what matter.

import type { ErrorEvent } from "@sentry/nextjs";

const SENSITIVE_HEADER_NAMES = new Set(["cookie", "authorization", "x-forwarded-for"]);

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      for (const name of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADER_NAMES.has(name.toLowerCase())) {
          delete event.request.headers[name];
        }
      }
    }
  }

  // Breadcrumbs can capture typed form input (an email on /sign-in) or
  // full URLs (which could carry a query param with a token) — strip the
  // ones likely to carry that, keep navigation/click breadcrumbs (useful
  // for repro steps, no PII risk) as they are.
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      if (crumb.category === "console" || crumb.category === "xhr" || crumb.category === "fetch") {
        return { ...crumb, data: undefined };
      }
      return crumb;
    });
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }

  return event;
}
