export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerSoft" | "successSoft";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "iconSm";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-glow hover:bg-brand-700 active:bg-brand-800",
  secondary: "border border-ink-200 bg-white text-ink-800 shadow-card hover:border-brand-300 hover:text-brand-700",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger: "bg-coral-500 text-white shadow-[0_10px_24px_-10px_rgb(239_54_83/0.7)] hover:bg-coral-600",
  dangerSoft: "bg-coral-50 text-coral-700 hover:bg-coral-100",
  successSoft: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
  icon: "size-11",
  iconSm: "size-9",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}
