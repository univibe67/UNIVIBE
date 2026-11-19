import type { ReactNode } from "react";

interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export default function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1 ring-1 ring-ink-200/70 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
              active ? "bg-white text-brand-700 shadow-card" : "text-ink-600 hover:text-ink-900"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-none font-bold tabular-nums ${
                  active ? "bg-brand-600 text-white" : "bg-ink-200/80 text-ink-700"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
