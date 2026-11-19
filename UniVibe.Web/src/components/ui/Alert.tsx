import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

const tones = {
  error: { box: "border-coral-200 bg-coral-50 text-coral-700", icon: CircleAlert },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CircleCheck },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: TriangleAlert },
  info: { box: "border-brand-100 bg-brand-50 text-brand-800", icon: Info },
};

interface AlertProps {
  tone?: keyof typeof tones;
  title?: string;
  className?: string;
  children: ReactNode;
}

export default function Alert({ tone = "error", title, className = "", children }: AlertProps) {
  const { box, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed ${box} ${className}`}
    >
      <Icon size={17} className="mt-px shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className="break-words">{children}</div>
      </div>
    </div>
  );
}
