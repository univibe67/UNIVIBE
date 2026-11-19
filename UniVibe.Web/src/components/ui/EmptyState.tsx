import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-3xl border border-dashed border-ink-300 bg-white/60 px-6 py-12 text-center ${className}`}
    >
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100" aria-hidden="true">
        {icon}
      </span>
      <p className="font-display text-lg leading-tight font-bold text-ink-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
