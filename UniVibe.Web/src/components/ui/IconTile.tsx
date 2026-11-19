import type { ReactNode } from "react";

const tones = {
  brand: "bg-brand-50 text-brand-600",
  danger: "bg-coral-50 text-coral-600",
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
  neutral: "bg-ink-100 text-ink-600",
};

interface IconTileProps {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}

export default function IconTile({ tone = "brand", className = "size-10", children }: IconTileProps) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl ${tones[tone]} ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}
