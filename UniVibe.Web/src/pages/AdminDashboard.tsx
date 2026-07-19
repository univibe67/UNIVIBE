import { useState, useEffect } from "react";
import { RefreshCw, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import AdminStatsGrid from "../components/AdminStatsGrid";
import AdminEventSection from "../components/AdminEventSection";
import AdminUserSection from "../components/AdminUserSection";

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"events" | "users">("events");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [eventFilter, setEventFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [currentEventPage, setCurrentEventPage] = useState(1);
  const eventsPerPage = 5;

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

  const processedEvents = events
    .filter((event) => {
      if (eventFilter === "all") return true;
      const statusStr = String(event.status).toLowerCase();
      if (eventFilter === "pending")
        return event.status === 1 || statusStr === "pending";
      if (eventFilter === "approved")
        return event.status === 2 || statusStr === "approved";
      if (eventFilter === "rejected")
        return event.status === 3 || statusStr === "rejected";
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();

      if (eventFilter === "pending") {
        return dateB - dateA;
      }

      return dateA - dateB;
    });

  const totalEventPages = Math.ceil(processedEvents.length / eventsPerPage);
  const indexOfLastEvent = currentEventPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEventsOnPage = processedEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent,
  );

  useEffect(() => {
    setCurrentEventPage(1);
  }, [eventFilter, activeTab]);

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

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/");
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {t("Admin_Title")}
        </h1>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          {isLoading && <RefreshCw className="animate-spin text-blue-600" />}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
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
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100 shadow-sm"
              title={i18n.language === "en" ? "Logout" : "Çıkış Yap"}
            >
              <LogOut size={18} strokeWidth={2.5} />
              <span className="hidden sm:block text-sm font-bold">
                {i18n.language === "en" ? "Logout" : "Çıkış"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <AdminStatsGrid
        totalUsers={totalUsers}
        pendingEventsCount={pendingEventsCount}
        activeEventsCount={activeEventsCount}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 py-3 sm:py-4 font-medium text-sm transition-colors ${
              activeTab === "events"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("Admin_Tab_Events")}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-3 sm:py-4 font-medium text-sm transition-colors ${
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
            <AdminEventSection
              events={events}
              isLoading={isLoading}
              eventFilter={eventFilter}
              setEventFilter={setEventFilter}
              processedEvents={processedEvents}
              currentEventsOnPage={currentEventsOnPage}
              currentEventPage={currentEventPage}
              totalEventPages={totalEventPages}
              setCurrentEventPage={setCurrentEventPage}
              indexOfFirstEvent={indexOfFirstEvent}
              indexOfLastEvent={indexOfLastEvent}
              localeStr={localeStr}
              handleApproveEvent={handleApproveEvent}
              handleRejectEvent={handleRejectEvent}
            />
          )}

          {activeTab === "users" && (
            <AdminUserSection
              users={users}
              isLoading={isLoading}
              safeAdminId={safeAdminId}
              handleSuspendUser={handleSuspendUser}
              handleActivateUser={handleActivateUser}
            />
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