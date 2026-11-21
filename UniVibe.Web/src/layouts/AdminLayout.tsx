import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, LayoutDashboard, LogOut, MessageSquare, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "../components/ui/LanguageSwitch";
import Logo from "../components/ui/Logo";
import { adminStore, useAdminStore } from "../services/adminStore";
import { tokenService } from "../services/tokenService";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { stats } = useAdminStore();

  useEffect(() => {
    void adminStore.refresh();
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const links = [
    { to: "/admin/dashboard", label: t("Admin_NavigationOverview"), icon: LayoutDashboard },
    { to: "/admin/events", label: t("Admin_NavigationEvents"), icon: CalendarDays, badge: stats.pendingEvents },
    { to: "/admin/users", label: t("Admin_NavigationUsers"), icon: Users },
    { to: "/admin/feedback", label: t("Admin_NavigationFeedback"), icon: MessageSquare },
  ];

  const logout = () => {
    tokenService.clearTokens();
    navigate("/login");
  };

  const utilityLink =
    "flex h-11 shrink-0 items-center gap-3 rounded-xl px-3.5 text-sm font-medium whitespace-nowrap text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900";

  return (
    <div className="relative isolate min-h-dvh lg:pl-[284px]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        style={{ background: "radial-gradient(50% 70% at 30% 0%, rgb(61 139 255 / 0.12), transparent 70%), radial-gradient(40% 60% at 95% 0%, rgb(239 54 83 / 0.07), transparent 70%)" }}
        aria-hidden="true"
      />
      <aside className="z-30 m-3 flex flex-col rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70 lg:fixed lg:inset-y-0 lg:left-0 lg:w-[260px]">
        <div className="flex h-[72px] shrink-0 items-center justify-between gap-3 px-5">
          <Link to="/admin/dashboard" className="rounded-lg" aria-label="UniVibe">
            <Logo />
          </Link>
          <LanguageSwitch />
        </div>

        <nav
          aria-label={t("Admin_BrandSubtitle")}
          className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pt-3"
        >
          {links.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex h-11 shrink-0 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "bg-brand-gradient text-white shadow-glow" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {Boolean(badge) && (
                <span className="rounded-full bg-coral-500 px-1.5 py-0.5 text-[11px] leading-none font-bold text-white tabular-nums ring-2 ring-white/70">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={logout} className={`${utilityLink} lg:hidden`}>
            <LogOut size={18} aria-hidden="true" />
            {t("Admin_Logout")}
          </button>
        </nav>

        <div className="hidden shrink-0 border-t border-ink-100 p-3 lg:block">
          <button type="button" onClick={logout} className={`${utilityLink} w-full`}>
            <LogOut size={18} aria-hidden="true" />
            {t("Admin_Logout")}
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}