import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarSearch, MessagesSquare, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "../components/ui/LanguageSwitch";
import Logo from "../components/ui/Logo";
import VibeWave from "../components/ui/VibeWave";

interface AuthLayoutProps {
  title?: string;
  description?: string;
  backTo?: { to: string; label: string };
  wide?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

export default function AuthLayout({ title, description, backTo, wide = false, footer, children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const points = [
    { icon: CalendarSearch, title: t("UI_AuthPointDiscover"), text: t("UI_AuthPointDiscoverText"), tone: "bg-brand-500/25 text-brand-200" },
    { icon: Ticket, title: t("UI_AuthPointJoin"), text: t("UI_AuthPointJoinText"), tone: "bg-emerald-500/20 text-emerald-300" },
    { icon: MessagesSquare, title: t("UI_AuthPointChat"), text: t("UI_AuthPointChatText"), tone: "bg-coral-500/20 text-coral-200" },
  ];

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1fr)_minmax(480px,52%)]">
      <div className="relative isolate flex min-w-0 flex-col px-5 py-5 sm:px-10 sm:py-7">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 lg:hidden"
          style={{ background: "radial-gradient(70% 80% at 20% 0%, rgb(61 139 255 / 0.14), transparent 70%), radial-gradient(50% 70% at 90% 0%, rgb(239 54 83 / 0.08), transparent 70%)" }}
          aria-hidden="true"
        />
        <header className="flex items-center justify-between">
          <Link to="/login" aria-label="UniVibe" className="rounded-lg">
            <Logo />
          </Link>
          <LanguageSwitch />
        </header>

        <main className={`mx-auto flex w-full flex-1 flex-col justify-center py-10 ${wide ? "max-w-2xl" : "max-w-[420px]"}`}>
          {backTo && (
            <Link
              to={backTo.to}
              className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-semibold text-ink-500 transition-colors hover:text-brand-700"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {backTo.label}
            </Link>
          )}
          {title && (
            <div className="mb-8">
              <h1 className="text-[32px] leading-[1.1] font-extrabold text-ink-900 sm:text-[38px]">{title}</h1>
              {description && <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{description}</p>}
            </div>
          )}
          {children}
        </main>

        {footer && <footer className="mx-auto w-full max-w-[420px] text-center">{footer}</footer>}
      </div>

      <aside className="relative isolate m-3 hidden h-[calc(100dvh-1.5rem)] flex-col justify-between overflow-hidden rounded-[32px] p-10 text-white lg:sticky lg:top-3 lg:flex xl:p-14">
        <div
          className="absolute inset-0 -z-20"
          style={{ background: "radial-gradient(70% 60% at 100% 0%, #1f3f7a 0%, transparent 60%), linear-gradient(160deg, #0d1b33 0%, #10284a 60%, #1a2350 100%)" }}
          aria-hidden="true"
        />
        <VibeWave className="absolute inset-0 -z-10 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink-900 via-ink-900/70 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 -z-10 h-1/3 bg-gradient-to-b from-ink-900/80 to-transparent" aria-hidden="true" />

        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur">
            <span className="size-2 rounded-full bg-vibe" aria-hidden="true" />
            UniVibe
          </span>
          <p className="mt-6 max-w-md font-display text-[48px] leading-[1.05] font-extrabold xl:text-[60px]">{t("Login_PageTitle")}</p>
        </div>

        <ul className="grid max-w-lg gap-3">
          {points.map(({ icon: Icon, title: itemTitle, text, tone }) => (
            <li key={itemTitle} className="flex items-center gap-4 rounded-2xl bg-white/8 p-4 ring-1 ring-white/12 backdrop-blur-md">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`} aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] leading-tight font-bold">{itemTitle}</span>
                <span className="mt-1 block text-[13px] leading-snug text-white/70">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
