import { CheckCircle, Ban, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string | number;
  isActive: boolean;
  isDeleted?: boolean;
}

interface AdminUserSectionProps {
  users: UserItem[];
  isLoading: boolean;
  safeAdminId: string | null;
  handleSuspendUser: (id: string) => void;
  handleActivateUser: (id: string) => void;
}

export default function AdminUserSection({
  users,
  isLoading,
  safeAdminId,
  handleSuspendUser,
  handleActivateUser,
}: AdminUserSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      {users.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 py-10 sm:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm sm:text-base">
          {t("Admin_NoUsers")}
        </p>
      )}

      <div className="md:hidden space-y-4">
        {users.map((user) => {
          const isActive = user.isActive;
          const isDeleted = user.isDeleted === true || (user as any).IsDeleted === true;
          const isCurrentAdmin = safeAdminId && user.id.toLowerCase() === safeAdminId;

          const roleStr = String(user.role).toLowerCase();
          const isAdmin = user.role === 3 || roleStr === "admin";
          const isTeacher = user.role === 2 || roleStr === "teacher";
          const isStudent = user.role === 1 || roleStr === "student";

          const displayRole = isAdmin
            ? t("Role_Admin")
            : isTeacher
              ? t("Role_Teacher")
              : isStudent
                ? t("Role_Student")
                : roleStr;

          return (
            <div
              key={user.id}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex justify-between items-start w-full">
                  <div className="pr-2">
                    <h3 className="font-bold text-gray-800 text-base break-words leading-tight">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 break-all">
                      {user.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 py-1 px-2.5 rounded-md text-[10px] sm:text-xs font-medium ${isAdmin ? "bg-purple-100 text-purple-700" : isTeacher ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    {displayRole}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-50">
                <div>
                  {isDeleted ? (
                    <span className="text-gray-500 flex items-center gap-1.5 text-xs font-medium">
                      <AlertCircle size={14} /> {t("Admin_User_AccountDeleted")}
                    </span>
                  ) : isActive ? (
                    <span className="text-green-600 flex items-center gap-1.5 text-xs font-medium">
                      <CheckCircle size={14} /> {t("Admin_User_Active")}
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1.5 text-xs font-medium">
                      <Ban size={14} /> {t("Admin_User_Banned")}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {isCurrentAdmin ? (
                    <span className="bg-blue-50 text-blue-600 py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-semibold">
                      {t("Admin_YourAccount")}
                    </span>
                  ) : isAdmin ? (
                    <span className="text-gray-400 text-[10px] sm:text-xs py-1.5 px-2 font-medium">
                      {t("Admin_CannotBanAdmin")}
                    </span>
                  ) : isActive || isDeleted ? (
                    <button
                      onClick={() => handleSuspendUser(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Ban size={14} /> {t("Admin_Ban")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateUser(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <CheckCircle size={14} /> {t("Admin_Unban")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-sm">
              <th className="pb-3 font-medium">{t("Admin_User")}</th>
              <th className="pb-3 font-medium">{t("Admin_Email")}</th>
              <th className="pb-3 font-medium">{t("Admin_Role")}</th>
              <th className="pb-3 font-medium">{t("Admin_Status")}</th>
              <th className="pb-3 font-medium text-right">{t("Admin_Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isActive = user.isActive;
              const isDeleted = user.isDeleted === true || (user as any).IsDeleted === true;
              const isCurrentAdmin = safeAdminId && user.id.toLowerCase() === safeAdminId;

              const roleStr = String(user.role).toLowerCase();
              const isAdmin = user.role === 3 || roleStr === "admin";
              const isTeacher = user.role === 2 || roleStr === "teacher";
              const isStudent = user.role === 1 || roleStr === "student";

              const displayRole = isAdmin
                ? t("Role_Admin")
                : isTeacher
                  ? t("Role_Teacher")
                  : isStudent
                    ? t("Role_Student")
                    : roleStr;

              return (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 font-medium text-gray-800">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="py-4 text-gray-600">{user.email}</td>
                  <td className="py-4 text-gray-600">
                    <span
                      className={`py-1 px-2 rounded-md text-xs font-medium ${isAdmin ? "bg-purple-100 text-purple-700" : isTeacher ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {displayRole}
                    </span>
                  </td>
                  <td className="py-4">
                    {isDeleted ? (
                      <span className="text-gray-500 flex items-center gap-1 text-sm">
                        <AlertCircle size={16} /> {t("Admin_User_AccountDeleted")}
                      </span>
                    ) : isActive ? (
                      <span className="text-green-600 flex items-center gap-1 text-sm">
                        <CheckCircle size={16} /> {t("Admin_User_Active")}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1 text-sm">
                        <Ban size={16} /> {t("Admin_User_Banned")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right flex justify-end gap-2">
                    {isCurrentAdmin ? (
                      <span className="bg-blue-50 text-blue-600 py-1.5 px-3 rounded-lg text-sm font-semibold cursor-not-allowed ml-auto flex items-center">
                        {t("Admin_YourAccount")}
                      </span>
                    ) : isAdmin ? (
                      <span className="text-gray-400 text-sm py-1.5 px-3 ml-auto flex items-center font-medium">
                        {t("Admin_CannotBanAdmin")}
                      </span>
                    ) : isActive || isDeleted ? (
                      <button
                        onClick={() => handleSuspendUser(user.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors ml-auto"
                      >
                        <Ban size={16} /> {t("Admin_Ban")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateUser(user.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors ml-auto"
                      >
                        <CheckCircle size={16} /> {t("Admin_Unban")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}