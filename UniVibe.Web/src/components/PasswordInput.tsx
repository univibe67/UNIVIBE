import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { controlClass } from "./ui/fieldStyles";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput({ className = "", disabled, ...props }: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const label = visible ? t("Auth_HidePassword") : t("Auth_ShowPassword");

  return (
    <span className="relative block">
      <input
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={`h-11 pr-11 pl-3.5 ${controlClass} ${className}`}
        {...props}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          setVisible((current) => !current);
        }}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </span>
  );
}
