import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, CalendarDays, MessageSquare, Users, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const links = [
    { to: "/admin/dashboard", label: t("Admin_NavigationOverview"), icon: BarChart3 },
    { to: "/admin/events", label: t("Admin_NavigationEvents"), icon: CalendarDays },
    { to: "/admin/users", label: t("Admin_NavigationUsers"), icon: Users },
    { to: "/admin/feedback", label: t("Admin_NavigationFeedback"), icon: MessageSquare },
  ];

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#17212b] md:flex">
      <aside className="w-full border-b border-[#e3e9e5] bg-white p-4 md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col md:border-b-0 md:border-r md:p-6">
        <div className="mb-6 flex items-center gap-3 md:mb-10" translate="no">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1559ac] text-xl font-extrabold text-white">U</div>
          <div><strong className="block text-lg">Uni<span className="text-[#ef3653]">Vibe</span></strong><span className="text-xs text-[#819098]" translate="yes">{t("Admin_BrandSubtitle")}</span></div>
        </div>
        <nav className="flex gap-2 overflow-x-auto md:grid md:content-start">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${isActive ? "bg-[#eaf2ff] text-[#1559ac]" : "text-[#718089] hover:bg-[#f5f7f5]"}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden md:block">
          <div className="mb-3 flex gap-1 rounded-lg bg-[#f5f7f5] p-1">
            {["tr", "en"].map((language) => <button key={language} onClick={() => i18n.changeLanguage(language)} className={`flex-1 rounded-md py-1 text-xs font-extrabold ${i18n.language.startsWith(language) ? "bg-white text-[#1559ac] shadow-sm" : "text-[#819098]"}`}>{language.toUpperCase()}</button>)}
          </div>
          <button onClick={logout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#ef3653] hover:bg-[#fff0f2]"><LogOut size={18} /> {t("Admin_Logout")}</button>
        </div>
      </aside>
      <main className="w-full p-4 md:ml-72 md:p-8 lg:p-10"><Outlet /></main>
    </div>
  );
}