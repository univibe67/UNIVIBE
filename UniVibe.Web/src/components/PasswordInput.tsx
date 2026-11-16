import React, { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className = "",
      containerClassName = "",
      type: _type,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useTranslation();

    const toggleAriaLabel = showPassword
      ? t("Auth_HidePassword") || "Şifreyi gizle"
      : t("Auth_ShowPassword") || "Şifreyi göster";

    return (
      <div className={`password-input-wrapper relative w-full ${containerClassName}`.trim()}>
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={`password-input-control w-full ${className}`.trim()}
          {...props}
          value={props.value ?? ""}
          onChange={(e) => {
            if (props.onChange) {
              props.onChange(e);
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          className="password-toggle-btn absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer select-none rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={toggleAriaLabel}
          title={toggleAriaLabel}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
