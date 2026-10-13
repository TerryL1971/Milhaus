// src/app/consent/[token]/page.tsx
// Where the business consent-confirmation email actually lands. No
// auth wall — whoever clicks this almost certainly has no Milhaus
// account, by design (see src/lib/consent-email.ts).

import { notFound } from "next/navigation";
import { confirmConsent, declineConsent } from "@/app/consent/[token]/actions";
import { getBusinessByConsentToken } from "@/lib/businesses-queries";

type Params = Promise<{ token: string }>;

export default async function ConsentPage({ params }: { params: Params }) {
  const { token } = await params;
  const business = await getBusinessByConsentToken(token);
  if (!business) notFound();

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[480px] px-8 text-center">
        {business.consentStatus === "confirmed" ? (
          <>
            <p className="mb-2 font-display text-xl font-semibold text-ink">Thanks — confirmed</p>
            <p className="text-sm text-ink-soft">
              {business.name} is confirmed for the Military-Friendly Businesses directory. Charlie will
              take it from here.
            </p>
          </>
        ) : business.consentStatus === "revoked" ? (
          <>
            <p className="mb-2 font-display text-xl font-semibold text-ink">Noted</p>
            <p className="text-sm text-ink-soft">
              This listing for {business.name} has been taken down and won&apos;t go live.
            </p>
          </>
        ) : (
          <>
            <p className="mb-2 font-display text-xl font-semibold text-ink">Confirm your business listing</p>
            <p className="mb-6 text-sm text-ink-soft">
              Someone has submitted <strong>{business.name}</strong> to be listed in the Military-Friendly
              Businesses directory on Milhaus. If that&apos;s you — the owner, or someone authorized to
              speak for the business — confirm below. If you don&apos;t recognize this, you can decline
              instead; nothing goes live without your confirmation either way.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <form action={confirmConsent}>
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="w-full rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,box-shadow] hover:-translate-y-px hover:bg-brass-deep sm:w-auto"
                >
                  Yes, confirm this listing
                </button>
              </form>
              <form action={declineConsent}>
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-canvas-deep px-5 py-2.5 text-sm font-semibold text-ink-soft transition-[transform] hover:-translate-y-px hover:border-rust hover:text-rust sm:w-auto"
                >
                  No, this isn&apos;t mine
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
