import { Users, Clock, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdminStatsGridProps {
  totalUsers: number;
  pendingEventsCount: number;
  activeEventsCount: number;
}

export default function AdminStatsGrid({
  totalUsers,
  pendingEventsCount,
  activeEventsCount,
}: AdminStatsGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg shrink-0">
          <Users size={24} className="sm:w-7 sm:h-7" />
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {t("Admin_TotalUsers")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {totalUsers}
          </p>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg shrink-0">
          <Clock size={24} className="sm:w-7 sm:h-7" />
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {t("Admin_PendingEvents")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {pendingEventsCount}
          </p>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
        <div className="p-3 bg-green-100 text-green-600 rounded-lg shrink-0">
          <CalendarDays size={24} className="sm:w-7 sm:h-7" />
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {t("Admin_ActiveEvents")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {activeEventsCount}
          </p>
        </div>
      </div>
    </div>
  );
}