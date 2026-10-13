// src/components/business-card.tsx
// A single row in the /services (Military-Friendly Businesses) directory
// — "Compact Row/Banner" per the category spec: logo, rating + review
// count, name/category, tag pills, no big photo (these are established
// local businesses, not listings with buyer-submitted photos).
//
// Not one big wrapping <a> anymore (it was, to websiteUrl alone) — once
// a business can also list Instagram/Facebook/WhatsApp/phone, each needs
// its own separate clickable icon link (nested <a>s aren't valid), so
// the card itself is a plain div and the social row at the bottom holds
// the individual links.

import { BUSINESS_CATEGORY_LABELS, BUSINESS_TAG_LABELS, type Business, type BusinessTagKey } from "@/lib/businesses";

export function BusinessCard({ business }: { business: Business }) {
  return (
    <div className="group flex items-center gap-4 rounded-md border border-canvas-deep bg-paper p-4 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(27,42,58,0.12)]">
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
          <div className="mb-2 flex flex-wrap gap-1.5">
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
        <BusinessSocialLinks business={business} />
      </div>
    </div>
  );
}

function BusinessSocialLinks({ business }: { business: Business }) {
  const links: { href: string; label: string; icon: React.ReactNode }[] = [];
  if (business.websiteUrl) links.push({ href: business.websiteUrl, label: "Website", icon: <WebsiteIcon /> });
  if (business.instagramUrl) links.push({ href: business.instagramUrl, label: "Instagram", icon: <InstagramIcon /> });
  if (business.facebookUrl) links.push({ href: business.facebookUrl, label: "Facebook", icon: <FacebookIcon /> });
  if (business.whatsappNumber) {
    links.push({
      href: `https://wa.me/${business.whatsappNumber.replace(/[^0-9]/g, "")}`,
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
    });
  }
  if (business.phone) links.push({ href: `tel:${business.phone}`, label: "Call", icon: <PhoneIcon /> });

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : undefined}
          rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
          title={link.label}
          aria-label={link.label}
          // Stops a click here from also bubbling to any future ancestor
          // link/clickable wrapper — harmless today (the card has none)
          // but these are exactly the links that must never trigger
          // something else's navigation.
          onClick={(e) => e.stopPropagation()}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-canvas-deep text-ink-soft transition-colors hover:border-olive hover:text-olive-deep"
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

const iconProps = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "currentColor" };

function WebsiteIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 6h-3.1a15.6 15.6 0 00-1.38-4.08A8.03 8.03 0 0118.93 8zM12 4.04c.83 1.1 1.5 2.5 1.93 3.96h-3.86c.43-1.46 1.1-2.86 1.93-3.96zM4.26 14a8.2 8.2 0 010-4h3.52a16.8 16.8 0 000 4H4.26zm.81 2h3.1c.32 1.5.8 2.88 1.38 4.08A8.03 8.03 0 015.07 16zm3.1-8H5.07a8.03 8.03 0 014.48-4.08A15.6 15.6 0 008.17 8zM12 19.96c-.83-1.1-1.5-2.5-1.93-3.96h3.86c-.43 1.46-1.1 2.86-1.93 3.96zM14.25 14h-4.5a14.8 14.8 0 010-4h4.5a14.8 14.8 0 010 4zm.3 5.08c.58-1.2 1.06-2.58 1.38-4.08h3.1a8.03 8.03 0 01-4.48 4.08zM16.22 14a16.8 16.8 0 000-4h3.52a8.2 8.2 0 010 4h-3.52z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 2c-2.72 0-3.06.01-4.12.06-1.06.05-1.79.22-2.43.47a4.9 4.9 0 00-1.77 1.15A4.9 4.9 0 002.53 5.45c-.25.64-.42 1.37-.47 2.43C2 8.94 2 9.28 2 12s.01 3.06.06 4.12c.05 1.06.22 1.79.47 2.43.26.66.6 1.22 1.15 1.77s1.11.9 1.77 1.15c.64.25 1.37.42 2.43.47C8.94 22 9.28 22 12 22s3.06-.01 4.12-.06c1.06-.05 1.79-.22 2.43-.47a4.9 4.9 0 001.77-1.15 4.9 4.9 0 001.15-1.77c.25-.64.42-1.37.47-2.43.05-1.06.06-1.4.06-4.12s-.01-3.06-.06-4.12c-.05-1.06-.22-1.79-.47-2.43a4.9 4.9 0 00-1.15-1.77A4.9 4.9 0 0018.55 2.5c-.64-.25-1.37-.42-2.43-.47C15.06 2.01 14.72 2 12 2zm0 1.8c2.67 0 2.99.01 4.04.06.98.04 1.5.21 1.86.34.47.18.8.4 1.15.75.35.35.57.68.75 1.15.13.36.3.88.34 1.86.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.04.98-.21 1.5-.34 1.86-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.13-.88.3-1.86.34-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.98-.04-1.5-.21-1.86-.34a3.1 3.1 0 01-1.15-.75 3.1 3.1 0 01-.75-1.15c-.13-.36-.3-.88-.34-1.86-.05-1.05-.06-1.37-.06-4.04s.01-2.99.06-4.04c.04-.98.21-1.5.34-1.86.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.13.88-.3 1.86-.34 1.05-.05 1.37-.06 4.04-.06zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-8.4a1.17 1.17 0 100-2.34 1.17 1.17 0 000 2.34z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.56c0-.86.24-1.44 1.47-1.44h1.56V4.46c-.27-.04-1.2-.12-2.27-.12-2.25 0-3.79 1.37-3.79 3.89v2.17H8v2.96h2.47V21h3.03z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.45 1.33 4.95L2 22l5.2-1.36a9.9 9.9 0 004.84 1.23h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm0 18.2a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.09.81.83-3.01-.2-.31a8.23 8.23 0 11 7.95 3.84zm4.52-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.78.96-.14.17-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.74 2.65 4.21 3.72.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.17.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.28z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z" />
    </svg>
  );
}
