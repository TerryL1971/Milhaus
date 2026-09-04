// src/proxy.ts
// Two responsibilities composed into one: next-intl's locale routing
// (rewriting /de/... to the [locale] segment, redirecting a bare / to the
// visitor's preferred locale on first visit) and refreshing the Supabase
// auth session on every request, so Server Components always see current
// auth state. (Named "proxy" per Next.js 16's renamed middleware
// convention.)

import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// Everything under src/app that isn't inside src/app/[locale] — /admin,
// /auth's route handlers, and the generated files — sits outside the
// locale segment entirely (see src/app/admin/layout.tsx). next-intl
// doesn't know that: its "as-needed" rewrite treats every unprefixed path
// as belonging to the default locale's [locale] tree regardless. Caught
// this by hand for each one as they were added (first /admin 404ing, then
// sitemap.xml and robots.txt, now /icon and /apple-icon once those
// existed) rather than all at once — worth listing explicitly here
// instead of a prefix guess, so a future addition outside [locale]
// doesn't silently hit the same bug again.
const ROUTES_OUTSIDE_LOCALE = ["/sitemap.xml", "/robots.txt", "/icon", "/apple-icon"];

function isOutsideLocaleRouting(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/auth/") ||
    ROUTES_OUTSIDE_LOCALE.includes(pathname)
  );
}

function route(request: NextRequest) {
  return isOutsideLocaleRouting(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : handleI18nRouting(request);
}

export async function proxy(request: NextRequest) {
  // Decide the response shape first (a plain pass-through, an i18n
  // rewrite/redirect, or — for /admin & /auth — untouched) — everything
  // below layers Supabase's Set-Cookie writes onto whatever it returns,
  // rather than building a competing response.
  let response = route(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Before a Supabase project is configured (e.g. .env.local not yet
  // filled in), skip the session refresh instead of 500ing every request.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[proxy] Skipping Supabase session refresh — NEXT_PUBLIC_SUPABASE_URL / " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Copy .env.example to " +
          ".env.local and fill in your Supabase project keys.",
      );
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Mutate the request's cookies too, not just the response's — do
        // not remove: a token refreshed mid-request must be visible to
        // this same request's Server Component render, not just the next
        // request. Re-deciding the route after that mutation (rather than
        // reusing the earlier `response`) keeps its rewrite/redirect
        // decision based on the same up-to-date request.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = route(request);
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not remove: this refreshes the auth token and must run before any
  // other logic that depends on the session.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
