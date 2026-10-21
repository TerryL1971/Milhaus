// src/components/business-card.tsx
// A single tile in the /services (Military-Friendly Businesses)
// directory — redesigned per Charlie's ask to be photo-forward like the
// car/product tiles instead of the old compact logo+text row: a cover
// image up top (falling back to a gradient, same pattern CarListingCard
// uses for a missing photo), the logo as a small badge overlapping its
// corner, name/category, a promotion callout, a truncated description
// preview, and the social-links row. The whole tile now links to the
// business's own profile page (src/app/[locale]/businesses/[id]) instead
// of going straight to the external website.

import { BUSINESS_CATEGORY_LABELS, type Business } from "@/lib/businesses";
import { BusinessSocialLinks } from "@/components/business-social-links";
import { Link } from "@/i18n/navigation";

const PHOTO_GRADIENT = "linear-gradient(135deg,#C3B79D,#8C9873)";

export function BusinessCard({ business }: { business: Business }) {
  return (
    <div className="group relative overflow-hidden rounded-md border border-canvas-deep bg-paper transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]">
      <Link href={`/businesses/${business.id}`} className="block">
        {business.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external cover image URL
          <img src={business.coverImageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div className="aspect-[16/9]" style={{ background: PHOTO_GRADIENT }} />
        )}

        <div className="flex items-start gap-3 px-4 pt-3.5">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external logo URL
            <img
              src={business.logoUrl}
              alt=""
              className="relative z-10 -mt-8 h-12 w-12 flex-shrink-0 rounded-md border-2 border-paper bg-paper object-contain shadow-sm"
            />
          ) : (
            <div className="relative z-10 -mt-8 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border-2 border-paper bg-ink font-display text-lg font-semibold text-paper shadow-sm">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="truncate font-display text-base font-semibold text-ink">{business.name}</span>
              {business.rating != null && (
                <span className="whitespace-nowrap font-mono text-[0.78rem] text-brass-deep">
                  ★ {business.rating.toFixed(1)}
                </span>
              )}
            </div>
            <p className="font-mono text-[0.74rem] text-charcoal/80">
              {BUSINESS_CATEGORY_LABELS[business.category]} · {business.city}
            </p>
          </div>
        </div>

        <div className="px-4 pb-4 pt-2.5">
          {business.promotion && (
            <p className="mb-2 rounded-[3px] bg-brass/15 px-2 py-1 font-mono text-[0.7rem] font-semibold text-brass-deep">
              {business.promotion}
            </p>
          )}
          {business.description && (
            <p className="mb-2.5 line-clamp-2 text-sm text-ink-soft">{business.description}</p>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4">
        <BusinessSocialLinks business={business} />
      </div>
    </div>
  );
}
