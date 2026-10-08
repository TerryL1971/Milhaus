// src/components/business-card.tsx
// A single row in the /services (Military-Friendly Businesses) directory
// — "Compact Row/Banner" per the category spec: logo, rating + review
// count, name/category, tag pills, no big photo (these are established
// local businesses, not listings with buyer-submitted photos).

import { BUSINESS_CATEGORY_LABELS, BUSINESS_TAG_LABELS, type Business, type BusinessTagKey } from "@/lib/businesses";

export function BusinessCard({ business }: { business: Business }) {
  const Wrapper = business.websiteUrl ? "a" : "div";
  const wrapperProps = business.websiteUrl
    ? { href: business.websiteUrl, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group flex items-center gap-4 rounded-md border border-canvas-deep bg-paper p-4 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]"
    >
      {business.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external logo URL
        <img src={business.logoUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-md object-contain" />
      ) : (
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-ink font-display text-xl font-semibold text-paper">
          {business.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="truncate font-display text-base font-semibold text-ink">{business.name}</span>
          {business.rating != null && (
            <span className="whitespace-nowrap font-mono text-[0.8rem] text-brass-deep">
              ★ {business.rating.toFixed(1)}
              {business.reviewCount != null && (
                <span className="text-ink-soft"> ({business.reviewCount})</span>
              )}
            </span>
          )}
        </div>
        <p className="mb-1.5 font-mono text-[0.76rem] text-charcoal/80">
          {BUSINESS_CATEGORY_LABELS[business.category]} · {business.city}
          {business.base ? ` · Near ${business.base}` : ""}
        </p>
        {business.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {business.tags.map((tag: BusinessTagKey) => (
              <span
                key={tag}
                className="rounded-[3px] bg-olive/15 px-2 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-olive-deep"
              >
                {BUSINESS_TAG_LABELS[tag]}
              </span>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
