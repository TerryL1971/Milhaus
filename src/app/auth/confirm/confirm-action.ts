// src/app/auth/confirm/confirm-action.ts
// Completes a magic-link sign-in. This is a POST server action, not a GET
// handler, on purpose: the sign-in token is single-use, and email security
// scanners / browser link-prefetchers issue their own GET to every URL in
// an email. An auto-verifying GET route gets its token spent by the
// scanner before the human clicks, and the real click then fails. A GET
// only renders the button (see ./page.tsx); the token is spent only when a
// person submits the form, and Next's built-in server-action origin check
// keeps that POST same-site.
//
// Handles both link shapes Supabase produces:
//   ?token_hash=…&type=…  — verifyOtp (custom template / OTP hash)
//   ?code=…               — exchangeCodeForSession (PKCE; what the browser
//                            client's signInWithOtp actually generates)

"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// `next` (where to land after sign-in — often a locale-prefixed path like
// /de/listings/abc) rides in a short-lived cookie set by SignInForm just
// before it requests the link, not on the link itself.
const NEXT_COOKIE = "mh_signin_next";

// Only same-origin relative paths — `next` originates from a URL the user
// could have tampered with, so without this it'd be an open redirect.
function safeNext(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export async function confirmSignIn(formData: FormData) {
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");
  const code = formData.get("code");

  const cookieStore = await cookies();
  const next = safeNext(cookieStore.get(NEXT_COOKIE)?.value);
  const supabase = await createClient();

  const result =
    typeof code === "string" && code
      ? await supabase.auth.exchangeCodeForSession(code)
      : typeof tokenHash === "string" && typeof type === "string"
        ? await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash })
        : null;

  if (!result) {
    redirect("/auth/confirm?error=failed");
  }
  if (result.error) {
    // The real reason — previously swallowed, which made this
    // undiagnosable. Usually: the one-time token was already spent, it's
    // past its expiry, or (for ?code=) the PKCE verifier cookie is gone
    // because the link was opened in a different browser.
    console.error("confirmSignIn failed —", result.error.message);
    redirect("/auth/confirm?error=failed");
  }

  cookieStore.delete(NEXT_COOKIE);
  redirect(next);
}
