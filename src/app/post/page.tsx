// src/app/post/page.tsx
// Post-a-listing (build order step 6). Signed-in-only — self-listed
// homes only; housing-office listings come through a separate feed that
// doesn't exist yet (explicitly out of scope per CLAUDE.md).

import { redirect } from "next/navigation";
import { PostListingForm } from "@/components/post-listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function PostListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/post");

  return (
    <main className="flex-1 py-14">
      <div className="mx-auto max-w-[640px] px-8">
        <h1 className="mb-2 font-display text-3xl font-semibold text-ink">List your home</h1>
        <p className="mb-8 text-ink-soft">
          A few details and some photos — we&apos;ll review it, usually the same day, and it goes
          live.
        </p>
        <PostListingForm />
      </div>
    </main>
  );
}
