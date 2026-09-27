// src/components/avatar.tsx
// Shared "who is this" circle — a photo if they've uploaded one, initials
// otherwise. Used anywhere someone's identity needs a compact visual: the
// nav bar's own-account entry point, SellerCard, the standalone seller
// profile page, and the profile editor's own preview — one component so
// the initials logic (and its look) can't quietly drift between them, and
// so the same circle can later become the "click the poster to write to
// them" affordance wherever a listing shows who posted it.

const SIZES = {
  sm: { box: "h-8 w-8", text: "text-xs" },
  md: { box: "h-16 w-16", text: "text-xl" },
  lg: { box: "h-20 w-20", text: "text-2xl" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

export function Avatar({
  name,
  photoUrl,
  size = "md",
  className = "",
}: {
  /** Whatever the caller already uses as this person's display name —
   * pass its own fallback chain in (displayName ?? email ?? "?", etc.). */
  name: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { box, text } = SIZES[size];

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
      <img
        src={photoUrl}
        alt=""
        className={`${box} flex-none rounded-full border border-canvas-deep object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex ${box} flex-none items-center justify-center rounded-full border border-canvas-deep bg-canvas font-display font-semibold text-ink-soft ${text} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
