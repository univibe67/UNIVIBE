import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "../../services/toast";

export default function Toaster() {
  const { t } = useTranslation();
  const items = useSyncExternalStore(toast.subscribe, toast.getItems);

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-[76px] z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.tone === "error" ? "alert" : "status"}
          className="animate-rise-in pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-ink-200 bg-white py-3 pr-2 pl-3.5 text-[13px] leading-relaxed font-medium text-ink-800 shadow-raised"
        >
          {item.tone === "success" ? (
            <CircleCheck size={18} className="mt-px shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <CircleAlert size={18} className="mt-px shrink-0 text-coral-600" aria-hidden="true" />
          )}
          <p className="min-w-0 flex-1 break-words">{item.text}</p>
          <button
            type="button"
            onClick={() => toast.dismiss(item.id)}
            aria-label={t("Admin_Close")}
            className="grid size-6 shrink-0 place-items-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
