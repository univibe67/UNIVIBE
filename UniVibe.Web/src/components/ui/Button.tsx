import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
