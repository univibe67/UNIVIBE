import { useId } from "react";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1559ac" />
          <stop offset="1" stopColor="#3d8bff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9.5" fill={`url(#${id}-g)`} />
      <path d="M10 9.5v7.8a6 6 0 0 0 12 0v-3.6" fill="none" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="22" cy="8.6" r="2.5" fill="#ef3653" />
    </svg>
  );
}

export default function Logo({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const light = tone === "light";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} translate="no">
      <LogoMark />
      <span className={`font-display text-[20px] font-extrabold tracking-tight ${light ? "text-white" : "text-ink-900"}`}>
        Uni<span className={light ? "text-coral-400" : "text-coral-500"}>Vibe</span>
      </span>
    </span>
  );
}
