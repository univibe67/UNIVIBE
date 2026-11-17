import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { BarChart3, CalendarDays, MessageSquare, Users, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { tokenService } from "../services/tokenService";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const links = [
    { to: "/admin/dashboard", label: t("Admin_NavigationOverview"), icon: BarChart3 },
    { to: "/admin/events", label: t("Admin_NavigationEvents"), icon: CalendarDays },
    { to: "/admin/users", label: t("Admin_NavigationUsers"), icon: Users },
    { to: "/admin/feedback", label: t("Admin_NavigationFeedback"), icon: MessageSquare },
  ];

  const logout = () => {
    tokenService.clearTokens();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#17212b] md:flex">
      <aside className="w-full border-b border-[#e3e9e5] bg-white p-4 md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col md:border-b-0 md:border-r md:p-6">
        <div className="mb-6 flex items-center justify-between gap-2 md:mb-8">
          <div className="flex items-center gap-3" translate="no">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1559ac] text-xl font-extrabold text-white">U</div>
            <div>
              <strong className="block text-lg leading-tight">Uni<span className="text-[#ef3653]">Vibe</span></strong>
              <span className="text-xs text-[#819098]" translate="yes">{t("Admin_BrandSubtitle")}</span>
            </div>
          </div>
          <div className="flex shrink-0 rounded-lg bg-[#f5f7f5] p-1 border border-[#e3e9e5]">
            {["tr", "en"].map((language) => {
              const currentLang = (i18n.language || "tr").toLowerCase();
              const isEn = currentLang.startsWith("en");
              const isActive = language === "tr" ? !isEn : isEn;
              return (
                <button
                  key={language}
                  type="button"
                  onClick={() => i18n.changeLanguage(language)}
                  className={`rounded-md px-2 py-0.5 text-xs font-extrabold transition ${
                    isActive ? "bg-white text-[#1559ac] shadow-sm" : "text-[#819098] hover:text-[#17212b]"
                  }`}
                >
                  {language.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto md:grid md:content-start md:gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  isActive || (to === "/admin/dashboard" && (location.pathname === "/admin" || location.pathname === "/admin/"))
                    ? "bg-[#eaf2ff] text-[#1559ac]"
                    : "text-[#718089] hover:bg-[#f5f7f5]"
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={logout}
            className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#ef3653] hover:bg-[#fff0f2] transition"
          >
            <LogOut size={18} /> {t("Admin_Logout")}
          </button>
        </nav>
      </aside>
      <main className="w-full p-4 md:ml-72 md:p-8 lg:p-10"><Outlet /></main>
    </div>
  );
}
