// src/components/sign-in-form.tsx
// Magic-link sign-in: email in, link out, no password. Ported visual style
// (paper card, brass button) from the mockup's search-bar treatment.

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

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

  if (status === "sent") {
    return (
      <div className="rounded-md border border-canvas-deep bg-paper p-6 text-center">
        <p className="mb-1 font-display text-xl font-semibold text-ink">Check your email</p>
        <p className="text-sm text-ink-soft">
          We sent a sign-in link to <span className="font-medium text-charcoal">{email}</span>.
          Click it to finish signing in.
        </p>
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
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoFocus
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="mb-4 w-full border-b border-canvas-deep bg-transparent py-2 text-[0.95rem] text-charcoal placeholder:text-charcoal/40 focus:outline-none"
      />

      {status === "error" && (
        <p className="mb-4 text-sm text-rust">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}
