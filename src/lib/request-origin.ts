// src/lib/request-origin.ts
// `new URL(request.url).origin` cannot be trusted for building redirect
// URLs: in this Next.js version's dev server, a request that actually
// arrived on `Host: 127.0.0.1:3000` gets `request.url` rewritten to
// `http://localhost:3000/...` before your handler ever sees it — a
// different origin. A redirect built from that origin makes the browser
// follow it to a *different* host than the one the auth cookie was just
// set on, so the cookie never gets sent back and the "session" silently
// vanishes on the very next request. Reconstructing the origin from the
// actual Host header (trusting x-forwarded-* first, for when this runs
// behind Vercel's proxy in production) sidesteps it entirely.
export function requestOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const isLocal = !!host && (host.startsWith("127.0.0.1") || host.startsWith("localhost"));
  const proto = request.headers.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}
