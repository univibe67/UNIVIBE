import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, User } from 'lucide-react';

export default function StudentLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/student/home', icon: Home, label: 'Ana Sayfa' },
    { path: '/student/events', icon: Calendar, label: 'Etkinlikler' },
    { path: '/student/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full pb-16">
        <Outlet /> 
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Highlight active if exactly matches, or if '/student' matches '/student/home' implicitly, 
            // but we'll use exact path matching or base path matching
            const isActive = location.pathname === item.path || (item.path === '/student/home' && location.pathname === '/student');
            
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