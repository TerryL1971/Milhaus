// src/components/price-range-fields.tsx
// Min/max number inputs for the "Price" filter cluster — identical
// across every browse page, so pulled out once rather than retyped 4x.

export function PriceRangeFields({
  min,
  max,
  onMinChange,
  onMaxChange,
  minLabel,
  maxLabel,
}: {
  min: number | null;
  max: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
          {minLabel}
        </label>
        <input
          type="number"
          min="0"
          value={min ?? ""}
          onChange={(event) => onMinChange(event.target.value ? Number(event.target.value) : null)}
          className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft/75">
          {maxLabel}
        </label>
        <input
          type="number"
          min="0"
          value={max ?? ""}
          onChange={(event) => onMaxChange(event.target.value ? Number(event.target.value) : null)}
          className="w-full rounded-md border border-canvas-deep bg-paper px-3 py-2 text-[0.95rem] text-charcoal focus:border-olive focus:outline-none"
        />
      </div>
    </div>
  );
}
