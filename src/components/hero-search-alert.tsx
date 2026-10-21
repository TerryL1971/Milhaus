// src/components/hero-search-alert.tsx
// Thin client wrapper so the homepage (an async Server Component) can
// show a dismissible red alert — search/page.tsx redirects here with
// ?searchFailed=<query> when a search matched nothing in any category
// (see that file's own header comment for why this, not a results
// page, is where that case lands). No "reset on a new search" logic
// needed here unlike every grid's own alert — a fresh page load from a
// new search is a fresh mount of this component anyway.

"use client";

import { useState } from "react";
import { SearchNoResultsAlert } from "@/components/search-no-results-alert";

export function HeroSearchAlert({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <SearchNoResultsAlert message={message} onDismiss={() => setDismissed(true)} />;
}
