import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StudentLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/student/home', icon: Home, label: t('Nav_Home') },
    { path: '/student/events', icon: Calendar, label: t('Nav_Events') },
    { path: '/student/profile', icon: User, label: t('Nav_Profile') },
  ];

  return (
    <div className="student-page flex flex-col">
      <main className="flex-1 w-full pb-16">
        <Outlet /> 
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Highlight active if exactly matches, or if '/student' matches '/student/home' implicitly, 
            // but we'll use exact path matching or base path matching
            const isActive = location.pathname === item.path ||
              (item.path === '/student/home' && location.pathname === '/student');
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}