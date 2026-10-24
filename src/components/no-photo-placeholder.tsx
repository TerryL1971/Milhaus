// src/components/no-photo-placeholder.tsx
// Shown in a listing card's photo slot when that specific listing has no
// photos in storage yet — a small camera icon + label over the existing
// gradient, instead of a blank color square that reads like a loading or
// broken-image state rather than a deliberate "no photo" one.

export function NoPhotoPlaceholder({ gradient, label }: { gradient: string; label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5" style={{ background: gradient }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 text-ink/35">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5h2.379a1.5 1.5 0 0 0 1.06-.44l.922-.92A1.5 1.5 0 0 1 8.92 4.2h4.16a1.5 1.5 0 0 1 1.061.44l.922.92a1.5 1.5 0 0 0 1.06.44H19.5A1.5 1.5 0 0 1 21 7.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-10Z"
        />
        <circle cx="12" cy="12.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-ink/45">{label}</span>
    </div>
  );
}
