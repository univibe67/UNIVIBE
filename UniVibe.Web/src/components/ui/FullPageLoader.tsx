import { LoaderCircle } from "lucide-react";

export default function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-ink-500" role="status">
      <LoaderCircle size={26} className="animate-spin text-brand-600" aria-hidden="true" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
