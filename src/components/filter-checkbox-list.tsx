// src/components/filter-checkbox-list.tsx
// Plain checkbox list rendered inside a FilterCluster popover — pulled
// out once it started repeating across every "Features/Badges"- and
// "Category Specifics"-type cluster.

export function FilterCheckboxList({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm text-charcoal">
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
            className="h-4 w-4 flex-shrink-0 rounded border-canvas-deep text-olive focus:ring-olive"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
