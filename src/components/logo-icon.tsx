// src/components/logo-icon.tsx
// The "Handoff" mark — two houses, one passing to the other, echoing the
// site's actual mechanic: an outgoing family's home becomes an incoming
// family's home. Left house stays an outline (departing, brass); right
// house is solid (arrived) — takes its color from `currentColor`, so it
// reads correctly on both the ink header and paper surfaces just by
// setting text color on a parent.
//
// Same path data as the concept reviewed and approved at
// https://claude.ai/code/artifact/ebf20db8-3b76-4100-9cc0-131bcd44a3a8 —
// keep any future tweaks to the mark in sync with that page's "The
// Handoff" section if it's ever revisited.

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 110" className={className} aria-hidden="true">
      <path d="M40,24 L72,52 L72,84 L8,84 L8,52 Z" fill="none" stroke="#C89B3C" strokeWidth="4" />
      <path d="M97,34 L129,62 L129,94 L65,94 L65,62 Z" fill="currentColor" />
    </svg>
  );
}
