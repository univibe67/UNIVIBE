import type { ReactNode } from "react";

const tones = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-coral-50 text-coral-700",
  solid: "bg-white/95 text-ink-800 shadow-card backdrop-blur-sm",
};

export type BadgeTone = keyof typeof tones;

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

export default function Badge({ tone = "neutral", className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
