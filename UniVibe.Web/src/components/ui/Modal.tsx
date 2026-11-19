import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const openStack: symbol[] = [];

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-2xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  size?: keyof typeof sizes;
  footer?: ReactNode;
  bare?: boolean;
  ariaLabel?: string;
  dismissible?: boolean;
  children: ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  size = "md",
  footer,
  bare = false,
  ariaLabel,
  dismissible = true,
  children,
}: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    if (!open) return;

    const token = Symbol("modal");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    openStack.push(token);
    document.body.style.overflow = "hidden";

    const firstField = dialog?.querySelector<HTMLElement>("input:not([type=file]), textarea, select");
    (firstField ?? dialog)?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== token) return;

      if (event.key === "Escape") {
        event.stopPropagation();
        if (dismissibleRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openStack.splice(openStack.indexOf(token), 1);
      if (openStack.length === 0) document.body.style.overflow = "";
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="animate-fade-in absolute inset-0 bg-ink-900/55 backdrop-blur-[2px]"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`animate-rise-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop outline-none sm:max-h-[88dvh] sm:rounded-3xl ${sizes[size]}`}
      >
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Admin_Close")}
            className={`absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full transition-colors ${
              bare
                ? "bg-ink-900/55 text-white backdrop-blur-sm hover:bg-ink-900/75"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-900"
            }`}
          >
            <X size={18} />
          </button>
        )}
        {title && (
          <header className="flex shrink-0 items-start gap-3.5 border-b border-ink-100 px-5 py-4 pr-14 sm:px-6">
            {icon}
            <div className="min-w-0">
              <h2 id={titleId} className="text-[20px] leading-snug font-bold text-ink-900">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-[13px] leading-relaxed text-ink-500">
                  {description}
                </p>
              )}
            </div>
          </header>
        )}
        <div className={`min-h-0 flex-1 overflow-y-auto ${bare ? "" : "px-5 py-5 sm:px-6"}`}>{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-ink-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
