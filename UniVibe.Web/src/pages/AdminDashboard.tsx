import { useState, useEffect } from "react";
import {
  Users,
  CalendarDays,
  CheckCircle,
  XCircle,
  Ban,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

interface EventItem {
  id: string;
  title: string;
  organizerName?: string;
  eventDate: string;
  status: string | number;
}

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string | number;
  isActive: boolean;
}

const getAdminIdFromToken = () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const decoded = JSON.parse(jsonPayload);
    return decoded[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ];
  } catch (error) {
    console.error("Token çözülemedi", error);
    return null;
  }
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"events" | "users">("events");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "danger" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: () => {},
  });

  const currentAdminId = getAdminIdFromToken();
  const safeAdminId = currentAdminId ? currentAdminId.toLowerCase() : null;

  const fetchEvents = async () => {
    try {
      const data = (await api.get("/AdminEvent/all")) as any;
      setEvents(data);
    } catch (error) {
      console.error("Etkinlikler çekilirken hata:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = (await api.get("/AdminUser/all")) as any;
      setUsers(data);
    } catch (error) {
      console.error("Kullanıcılar çekilirken hata:", error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchEvents(), fetchUsers()]).finally(() =>
      setIsLoading(false),
    );
  }, []);

  const handleApproveEvent = async (id: string) => {
    try {
      await api.put(`/AdminEvent/approve/${id}`);
      fetchEvents();
    } catch (error: any) {
      alert(error || t("Admin_Error_Approve"));
    }
  };

  const handleRejectEvent = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t("Admin_Reject") + "?",
      message: t("Admin_Confirm_RejectEvent"),
      type: "warning",
      onConfirm: async () => {
        try {
          await api.put(`/AdminEvent/reject/${id}`);
          fetchEvents();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          alert(error || t("Admin_Error_Reject"));
        }
      },
    });
  };

  const handleSuspendUser = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t("Admin_Ban") + "?",
      message: t("Admin_Confirm_SuspendUser"),
      type: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/AdminUser/suspend/${id}`);
          fetchUsers();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          alert(error || t("Admin_Error_Suspend"));
        }
      },
    });
  };

  const handleActivateUser = async (id: string) => {
    try {
      await api.put(`/AdminUser/activate/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error || t("Admin_Error_Activate"));
    }
  };

  const totalUsers = users.length;
  const pendingEventsCount = events.filter(
    (e) => e.status === 1 || String(e.status).toLowerCase() === "pending",
  ).length;
  const activeEventsCount = events.filter(
    (e) => e.status === 2 || String(e.status).toLowerCase() === "approved",
  ).length;

  const localeStr = i18n.language === "en" ? "en-US" : "tr-TR";

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{t("Admin_Title")}</h1>

        <div className="flex items-center gap-4">
          {isLoading && <RefreshCw className="animate-spin text-blue-600" />}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => i18n.changeLanguage("tr")}
              className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                i18n.language === "tr"
                  ? "bg-white text-gray-800 shadow"
                  : "text-gray-500"
              }`}
            >
              TR
            </button>
            <button
              onClick={() => i18n.changeLanguage("en")}
              className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                i18n.language === "en"
                  ? "bg-white text-gray-800 shadow"
                  : "text-gray-500"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              {t("Admin_TotalUsers")}
            </p>
            <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              {t("Admin_PendingEvents")}
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {pendingEventsCount}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CalendarDays size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              {t("Admin_ActiveEvents")}
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {activeEventsCount}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 py-4 font-medium text-sm transition-colors ${
              activeTab === "events"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("Admin_Tab_Events")}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-4 font-medium text-sm transition-colors ${
              activeTab === "users"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("Admin_Tab_Users")}
          </button>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === "events" && (
            <>
              {events.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 py-4">
                  {t("Admin_NoEvents")}
                </p>
              )}

              <div className="md:hidden space-y-4">
                {events.map((event) => {
                  const statusStr = String(event.status).toLowerCase();
                  const isPending =
                    event.status === 1 || statusStr === "pending";
                  const isApproved =
                    event.status === 2 || statusStr === "approved";
                  const isRejected =
                    event.status === 3 || statusStr === "rejected";

                  return (
                    <div
                      key={event.id}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {event.organizerName || t("Admin_Unknown")}
                          </p>
                        </div>
                        <div>
                          {isPending && (
                            <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-xs font-medium">
                              {t("Admin_Status_Pending")}
                            </span>
                          )}
                          {isApproved && (
                            <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-medium">
                              {t("Admin_Status_Approved")}
                            </span>
                          )}
                          {isRejected && (
                            <span className="bg-red-100 text-red-700 py-1 px-3 rounded-full text-xs font-medium">
                              {t("Admin_Status_Rejected")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-50">
                        <span className="text-sm text-gray-500">
                          {event.eventDate
                            ? new Date(event.eventDate).toLocaleDateString(
                                localeStr,
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : t("Admin_NoDate")}
                        </span>
                        <div className="flex gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveEvent(event.id)}
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() => handleRejectEvent(event.id)}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <XCircle size={20} />
                              </button>
                            </>
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
                      <th className="pb-3 font-medium">
                        {t("Admin_EventName")}
                      </th>
                      <th className="pb-3 font-medium">
                        {t("Admin_Organizer")}
                      </th>
                      <th className="pb-3 font-medium">{t("Admin_Date")}</th>
                      <th className="pb-3 font-medium">{t("Admin_Status")}</th>
                      <th className="pb-3 font-medium text-right">
                        {t("Admin_Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const statusStr = String(event.status).toLowerCase();
                      const isPending =
                        event.status === 1 || statusStr === "pending";
                      const isApproved =
                        event.status === 2 || statusStr === "approved";
                      const isRejected =
                        event.status === 3 || statusStr === "rejected";

                      return (
                        <tr
                          key={event.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 font-medium text-gray-800">
                            {event.title}
                          </td>
                          <td className="py-4 text-gray-600">
                            {event.organizerName || t("Admin_Unknown")}
                          </td>
                          <td className="py-4 text-gray-600">
                            {event.eventDate
                              ? new Date(event.eventDate).toLocaleDateString(
                                  localeStr,
                                  {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )
                              : t("Admin_NoDate")}
                          </td>
                          <td className="py-4">
                            {isPending && (
                              <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-xs font-medium">
                                {t("Admin_Status_Pending")}
                              </span>
                            )}
                            {isApproved && (
                              <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-medium">
                                {t("Admin_Status_Approved")}
                              </span>
                            )}
                            {isRejected && (
                              <span className="bg-red-100 text-red-700 py-1 px-3 rounded-full text-xs font-medium">
                                {t("Admin_Status_Rejected")}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right flex justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApproveEvent(event.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title={t("Admin_Approve")}
                                >
                                  <CheckCircle size={20} />
                                </button>
                                <button
                                  onClick={() => handleRejectEvent(event.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title={t("Admin_Reject")}
                                >
                                  <XCircle size={20} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "users" && (
            <>
              {users.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 py-4">
                  {t("Admin_NoUsers")}
                </p>
              )}

              <div className="md:hidden space-y-4">
                {users.map((user) => {
                  const isActive = user.isActive;
                  const isCurrentAdmin =
                    safeAdminId && user.id.toLowerCase() === safeAdminId;

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
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <span
                          className={`py-1 px-2 rounded-md text-xs font-medium ${
                            isAdmin
                              ? "bg-purple-100 text-purple-700"
                              : isTeacher
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {displayRole}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-50">
                        <div>
                          {isActive ? (
                            <span className="text-green-600 flex items-center gap-1 text-sm">
                              <CheckCircle size={16} /> {t("Admin_User_Active")}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1 text-sm">
                              <Ban size={16} /> {t("Admin_User_Banned")}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isCurrentAdmin ? (
                            <span className="bg-blue-50 text-blue-600 py-1.5 px-3 rounded-lg text-xs font-semibold">
                              {t("Admin_YourAccount")}
                            </span>
                          ) : isAdmin ? (
                            <span className="text-gray-400 text-xs py-1.5 px-3 font-medium">
                              {t("Admin_CannotBanAdmin")}
                            </span>
                          ) : isActive ? (
                            <button
                              onClick={() => handleSuspendUser(user.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg"
                            >
                              <Ban size={16} /> {t("Admin_Ban")}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 bg-green-50 rounded-lg"
                            >
                              <CheckCircle size={16} /> {t("Admin_Unban")}
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
                      <th className="pb-3 font-medium text-right">
                        {t("Admin_Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isActive = user.isActive;
                      const isCurrentAdmin =
                        safeAdminId && user.id.toLowerCase() === safeAdminId;

                      const roleStr = String(user.role).toLowerCase();
                      const isAdmin = user.role === 3 || roleStr === "admin";
                      const isTeacher =
                        user.role === 2 || roleStr === "teacher";
                      const isStudent =
                        user.role === 1 || roleStr === "student";

                      const displayRole = isAdmin
                        ? t("Role_Admin")
                        : isTeacher
                          ? t("Role_Teacher")
                          : isStudent
                            ? t("Role_Student")
                            : roleStr;

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 font-medium text-gray-800">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="py-4 text-gray-600">{user.email}</td>
                          <td className="py-4 text-gray-600">
                            <span
                              className={`py-1 px-2 rounded-md text-xs font-medium ${
                                isAdmin
                                  ? "bg-purple-100 text-purple-700"
                                  : isTeacher
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {displayRole}
                            </span>
                          </td>
                          <td className="py-4">
                            {isActive ? (
                              <span className="text-green-600 flex items-center gap-1 text-sm">
                                <CheckCircle size={16} />{" "}
                                {t("Admin_User_Active")}
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
                            ) : isActive ? (
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
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
