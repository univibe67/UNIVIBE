import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PasswordRule } from "../../utils/password";

export default function PasswordRules({ password, rules }: { password: string; rules: PasswordRule[] }) {
  const { t } = useTranslation();

  return (
    <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
      {rules.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.labelKey}
            className={`flex items-center gap-1.5 text-xs transition-colors ${met ? "text-emerald-700" : "text-ink-500"}`}
          >
            <span
              className={`grid size-3.5 place-items-center rounded-full ${met ? "bg-emerald-100" : "bg-ink-200"}`}
              aria-hidden="true"
            >
              {met && <Check size={10} strokeWidth={3} />}
            </span>
            {t(rule.labelKey)}
          </li>
        );
      })}
    </ul>
  );
}
