// src/app/auth/confirm/confirm-action.ts
// Completes a magic-link sign-in. This is a POST server action, not a GET
// handler, on purpose: a magic-link token is single-use, and email
// security scanners / browser link-prefetchers issue their own GET to
// every URL in an email. An auto-verifying GET route gets its token spent
// by the scanner before the human clicks, and the real click then fails
// as "expired or already used" — the exact bug this replaces. A GET only
// renders the button (see ./page.tsx); the token is spent only when a
// person submits the form, and Next's built-in server-action origin check
// keeps that POST same-site.

"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// `next` (where to land after sign-in — often a locale-prefixed path like
// /de/listings/abc) rides in a short-lived cookie set by SignInForm just
// before it requests the link, not on the link itself: the email template
// only has {{ .SiteURL }} to build a URL from, and threading a redirect
// target through it depends on the project's redirect-URL allow-list. The
// cookie is same-browser, same-person, and a link scanner never has it.
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

  const cookieStore = await cookies();
  const next = safeNext(cookieStore.get(NEXT_COOKIE)?.value);

  if (typeof tokenHash !== "string" || typeof type !== "string") {
    redirect("/auth/confirm?error=failed");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  if (error) {
    // The real reason — previously swallowed by the old route, which made
    // this undiagnosable. Most common: the one-time token was already
    // spent (a link scanner), or it's simply past its 1-hour expiry.
    console.error("confirmSignIn: verifyOtp failed —", error.message);
    redirect("/auth/confirm?error=failed");
  }

  cookieStore.delete(NEXT_COOKIE);
  redirect(next);
}
