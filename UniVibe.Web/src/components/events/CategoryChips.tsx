import { LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CATEGORY_KEYS } from "../../utils/categoryLabel";
import type { CategoryKey } from "../../utils/categoryLabel";
import { categoryVisualByKey } from "../../utils/categoryVisual";

interface CategoryChipsProps {
  value: CategoryKey | "";
  onChange: (value: CategoryKey | "") => void;
  className?: string;
}

export default function CategoryChips({ value, onChange, className = "" }: CategoryChipsProps) {
  const { t } = useTranslation();
  const options: { key: CategoryKey | ""; label: string }[] = [
    { key: "", label: t("Admin_All") },
    ...CATEGORY_KEYS.map((key) => ({ key, label: t(key) })),
  ];

  return (
    <div
      role="group"
      aria-label={t("Student_CategoryLabel")}
      className={`no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0 ${className}`}
    >
      {options.map(({ key, label }) => {
        const active = value === key;
        const { icon: Icon, from } = categoryVisualByKey(key);
        return (
          <button
            key={key || "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
              active
                ? "bg-brand-600 text-white shadow-glow"
                : "bg-white text-ink-700 shadow-card ring-1 ring-ink-200/80 hover:text-brand-700 hover:ring-brand-300"
            }`}
          >
            {key ? (
              <Icon size={15} style={active ? undefined : { color: from }} aria-hidden="true" />
            ) : (
              <LayoutGrid size={15} aria-hidden="true" />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
