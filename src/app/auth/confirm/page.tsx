// src/app/auth/confirm/page.tsx
// Where the magic-link email lands. Deliberately a page with a button, not
// an auto-verifying URL — see ./confirm-action.ts for the full reasoning
// (single-use tokens vs. email link scanners). A GET here only renders;
// nothing is verified until a person clicks Confirm.

import Link from "next/link";
import { confirmSignIn } from "./confirm-action";

export const metadata = {
  title: "Confirm sign-in — milhaus",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ token_hash?: string; type?: string; error?: string }>;

export default async function ConfirmSignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token_hash: tokenHash, type, error } = await searchParams;
  const canConfirm = Boolean(tokenHash && type);

  return (
    <main className="flex flex-1 items-center justify-center px-8 py-20">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">Sign in to milhaus</h1>

        {error === "failed" ? (
          <>
            <p className="mb-6 rounded-md bg-rust/10 px-4 py-3 text-sm text-rust">
              That link has expired or was already used. Head back and request a fresh one — or
              use the 6-digit code from the same email.
            </p>
            <Link href="/sign-in" className="text-sm font-semibold text-olive-deep hover:underline">
              Back to sign in
            </Link>
          </>
        ) : canConfirm ? (
          <>
            <p className="mb-6 text-sm text-ink-soft">
              One more click to confirm it was really you who asked to sign in.
            </p>
            <form action={confirmSignIn}>
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={type} />
              <button
                type="submit"
                className="w-full rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep"
              >
                Confirm sign-in
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mb-6 text-sm text-ink-soft">
              This sign-in link is incomplete. Request a fresh one.
            </p>
            <Link href="/sign-in" className="text-sm font-semibold text-olive-deep hover:underline">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
