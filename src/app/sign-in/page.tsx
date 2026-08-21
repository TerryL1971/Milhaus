// src/app/sign-in/page.tsx
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { createClient } from "@/lib/supabase/server";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-8 py-20">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center font-display text-3xl font-semibold text-ink">
          Sign in
        </h1>
        <p className="mb-6 text-center text-sm text-ink-soft">
          No password — we&apos;ll email you a link.
        </p>

        {error === "link-expired" && (
          <p className="mb-4 rounded-md bg-rust/10 px-4 py-3 text-center text-sm text-rust">
            That link expired or was already used. Request a new one below.
          </p>
        )}

        <SignInForm />
      </div>
    </main>
  );
}
