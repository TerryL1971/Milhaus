// src/components/sign-in-form.tsx
// Magic-link sign-in: email in, link out, no password. Ported visual style
// (paper card, brass button) from the mockup's search-bar treatment.
//
// Two ways to finish, because email link-scanners routinely spend the
// one-time token in a magic link before the recipient clicks it:
//   1. the link — lands on /auth/confirm, which makes you click a button
//      (so a scanner's GET can't complete it), then verifies.
//   2. the 6-digit code in the same email — typed back in here, immune to
//      link scanning entirely.

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";
type CodeStatus = "idle" | "verifying" | "error";

export function SignInForm({ next }: { next: string }) {
  const t = useTranslations("SignIn");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");
  const [codeError, setCodeError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    // The magic link can't carry `next` itself (the email template only
    // has {{ .SiteURL }} to work with) — stash it in a short-lived cookie
    // that /auth/confirm reads back. Lax so it survives the top-level
    // navigation in from the email.
    document.cookie = `mh_signin_next=${encodeURIComponent(next)}; path=/; max-age=1800; samesite=lax`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  async function handleCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeStatus("verifying");
    setCodeError("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (error) {
      setCodeStatus("error");
      setCodeError(error.message);
      return;
    }
    // Full navigation, not a client-side push — the session cookie was
    // just set and every Server Component up the tree needs to re-read it.
    window.location.assign(next);
  }

  if (status === "sent") {
    return (
      <div className="rounded-md border border-canvas-deep bg-paper p-6">
        <p className="mb-1 text-center font-display text-xl font-semibold text-ink">
          {t("checkEmailHeading")}
        </p>
        <p className="mb-5 text-center text-sm text-ink-soft">
          {t.rich("checkEmailBody", {
            email,
            strong: (chunks) => <span className="font-medium text-charcoal">{chunks}</span>,
          })}
        </p>

        <form onSubmit={handleCodeSubmit} className="border-t border-canvas-deep pt-5">
          <label
            htmlFor="code"
            className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75"
          >
            {t("codeLabel")}
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="mb-4 w-full border-b border-canvas-deep bg-transparent py-2 font-mono text-lg tracking-[0.3em] text-charcoal placeholder:text-charcoal/40 focus:outline-none"
          />
          {codeStatus === "error" && <p className="mb-4 text-sm text-rust">{codeError}</p>}
          <button
            type="submit"
            disabled={codeStatus === "verifying" || code.trim().length < 6}
            className="w-full rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {codeStatus === "verifying" ? t("verifying") : t("verifyCode")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-canvas-deep bg-paper p-6 shadow-[0_8px_24px_rgba(27,42,58,0.08)]"
    >
      <label
        htmlFor="email"
        className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75"
      >
        {t("email")}
      </label>
      <input
        id="email"
        type="email"
        required
        autoFocus
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t("emailPlaceholder")}
        className="mb-4 w-full border-b border-canvas-deep bg-transparent py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:outline-none"
      />

      {status === "error" && <p className="mb-4 text-sm text-rust">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? t("sending") : t("sendLink")}
      </button>
    </form>
  );
}
