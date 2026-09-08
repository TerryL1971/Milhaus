// src/app/auth/dev-signin/route.ts
// DEV-ONLY sign-in shortcut — visit /auth/dev-signin?email=you@example.com
// and you're signed in, no email round-trip.
//
// Why this exists: Supabase's shared mailer is capped at 2 messages/hour,
// and magic links get their single-use token spent by email/browser link
// scanners before you click. Neither is worth fighting during local
// development. This mints a token with the service-role key and verifies
// it in one request.
//
// Safe to ship: it 404s unless NODE_ENV is "development" AND the request
// arrived on a loopback host, so it's inert on Vercel regardless of how
// env vars are set.

import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { requestOrigin } from "@/lib/request-origin";

function notFound() {
  return new NextResponse("Not found", { status: 404 });
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const isLoopback = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  if (process.env.NODE_ENV !== "development" || !isLoopback) return notFound();

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return new NextResponse(
      "Add ?email=you@example.com — dev-only, signs you in with no email round-trip.",
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return new NextResponse(
      "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
      { status: 500 },
    );
  }

  // Service-role client, only to mint a token hash for this email.
  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    return new NextResponse(
      `Could not generate a token for ${email}: ${error?.message ?? "no token returned"}`,
      { status: 500 },
    );
  }

  // Verify it on the cookie-writing SSR client so the session lands in
  // this browser. Build the redirect first so setAll can attach cookies.
  const response = NextResponse.redirect(`${requestOrigin(request)}/`);
  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const { error: verifyError } = await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash });
  if (verifyError) {
    return new NextResponse(`Verify failed: ${verifyError.message}`, { status: 500 });
  }

  return response;
}
