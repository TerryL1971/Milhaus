// src/app/page.tsx
// Placeholder home page. The real landing page (hero, search bar, listing
// grid) is built in a later step, ported from
// /design-reference/milhaus-landing-mockup.html.

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-16 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">milhaus</h1>
      <p className="max-w-md text-sm text-ink-soft">
        Project scaffold is up. The public site is under construction.
      </p>
    </main>
  );
}
