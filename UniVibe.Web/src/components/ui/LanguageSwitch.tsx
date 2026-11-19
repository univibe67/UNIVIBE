import { useTranslation } from "react-i18next";

export default function LanguageSwitch({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.language || "tr").toLowerCase().startsWith("en") ? "en" : "tr";
  const dark = tone === "dark";

  return (
    <div
      role="group"
      aria-label={t("UI_Language")}
      className={`inline-flex rounded-lg p-0.5 ${dark ? "bg-white/10 ring-1 ring-white/15" : "bg-ink-100 ring-1 ring-ink-200/70"} ${className}`}
    >
      {(["tr", "en"] as const).map((language) => {
        const active = current === language;
        return (
          <button
            key={language}
            type="button"
            lang={language}
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(language)}
            className={`h-7 min-w-8 rounded-md px-1.5 text-[11px] font-bold transition-colors ${
              active
                ? dark
                  ? "bg-white text-brand-800"
                  : "bg-white text-brand-700 shadow-card"
                : dark
                  ? "text-white/65 hover:text-white"
                  : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {language.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
