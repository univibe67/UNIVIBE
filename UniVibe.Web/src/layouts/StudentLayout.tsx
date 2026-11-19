import { useEffect } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarDays, Compass, Plus, ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import Avatar from "../components/ui/Avatar";
import LanguageSwitch from "../components/ui/LanguageSwitch";
import Logo from "../components/ui/Logo";
import { currentUser, displayNameOf, useCurrentUser } from "../services/currentUser";
import { tokenService } from "../services/tokenService";

const HOME_PATHS = ["/", "/student", "/student/home"];

function TabLink({ to, label, active, children }: { to: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`grid size-12 place-items-center rounded-xl transition-colors ${
        active ? "bg-brand-50 text-brand-700" : "text-ink-400 hover:text-ink-700"
      }`}
    >
      {children}
    </NavLink>
  );
}

export default function StudentLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useCurrentUser();
  const isAdmin = tokenService.getRole() === "Admin";

  useEffect(() => {
    void currentUser.load();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const creating = pathname === "/student/events/new";
  const links = [
    { to: "/student/home", label: t("Student_Discover"), active: HOME_PATHS.includes(pathname) },
    { to: "/student/events", label: t("UI_MyEvents"), active: pathname.startsWith("/student/events") && !creating },
    { to: "/student/profile", label: t("Nav_Profile"), active: pathname === "/student/profile" },
  ];

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          background:
            "radial-gradient(60% 70% at 12% 0%, rgb(61 139 255 / 0.16), transparent 70%), radial-gradient(45% 60% at 92% 4%, rgb(239 54 83 / 0.10), transparent 70%), radial-gradient(40% 50% at 55% 0%, rgb(16 185 129 / 0.08), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("UI_SkipToContent")}
      </a>

      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link to="/student/home" aria-label="UniVibe" className="rounded-lg">
            <Logo />
          </Link>

          <nav aria-label={t("UI_MainNavigation")} className="hidden items-center gap-0.5 md:flex">
            {links.map(({ to, label, active }) => (
              <NavLink
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                }`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                aria-label={t("Admin_BrandSubtitle")}
                title={t("Admin_BrandSubtitle")}
                className="grid size-10 place-items-center rounded-xl text-ink-500 transition-colors hover:bg-ink-100 hover:text-brand-700 max-md:hidden"
              >
                <ShieldCheck size={18} aria-hidden="true" />
              </Link>
            )}
            <LanguageSwitch />
            <Link
              to="/student/events/new"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-gradient px-4 text-sm font-bold text-white shadow-glow transition hover:brightness-110 max-md:hidden"
            >
              <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
              {t("Student_CreateEvent")}
            </Link>
            <Link to="/student/profile" aria-label={t("Student_Profile")} className="rounded-full max-md:hidden">
              <Avatar name={displayNameOf(user)} src={user?.profilePictureUrl} className="size-10 text-xs ring-2 ring-white shadow-card" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-32 sm:px-6 sm:pt-12 md:pb-20">
        <Outlet />
      </main>

      <nav aria-label={t("UI_MainNavigation")} className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 md:hidden">
        <div className="flex items-center gap-1 rounded-2xl bg-white/90 p-1.5 shadow-pop ring-1 ring-ink-200/80 backdrop-blur-xl">
          <TabLink to={links[0].to} label={links[0].label} active={links[0].active}>
            <Compass size={21} aria-hidden="true" />
          </TabLink>
          <TabLink to={links[1].to} label={links[1].label} active={links[1].active}>
            <CalendarDays size={21} aria-hidden="true" />
          </TabLink>
          <NavLink
            to="/student/events/new"
            aria-label={t("Student_CreateEvent")}
            aria-current={creating ? "page" : undefined}
            className="grid h-12 w-16 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow"
          >
            <Plus size={23} strokeWidth={2.6} aria-hidden="true" />
          </NavLink>
          <TabLink to={links[2].to} label={links[2].label} active={links[2].active}>
            <UserRound size={21} aria-hidden="true" />
          </TabLink>
        </div>
      </nav>
    </div>
  );
}
