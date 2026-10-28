// src/lib/friendly-error.ts
// Supabase/Postgres error messages are internal implementation detail —
// driver text, sometimes literally "Error sending confirmation email" —
// never meant for an end user to read directly. A first-time visitor
// hitting a raw message like that reads it as "the site is broken," full
// stop, with no idea what to do next. These classify the handful of
// patterns that actually show up in practice into a translation key in
// the "Errors" namespace; anything unrecognized falls back to "generic"
// rather than ever rendering raw text.

export type FriendlyErrorKey = "generic" | "rateLimit" | "codeInvalid" | "network";

export function classifyAuthError(message: string): FriendlyErrorKey {
  const text = message.toLowerCase();
  if (text.includes("rate limit")) return "rateLimit";
  if (text.includes("expired") || text.includes("invalid") || text.includes("token")) return "codeInvalid";
  if (text.includes("fetch") || text.includes("network")) return "network";
  return "generic";
}

export function classifyFormError(message: string): FriendlyErrorKey {
  const text = message.toLowerCase();
  if (text.includes("fetch") || text.includes("network")) return "network";
  return "generic";
}
