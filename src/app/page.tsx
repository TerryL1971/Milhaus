// src/app/page.tsx
// Placeholder home page for the initial scaffold. The real landing page
// (design system, hero, listing grid) is built in a later step, ported
// from /design-reference/milhaus-landing-mockup.html.

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-16 text-center">
      <h1 className="text-3xl font-semibold">milhaus</h1>
      <p className="max-w-md text-sm text-neutral-600">
        Project scaffold is up. The public site is under construction.
      </p>
    </main>
  );
}
