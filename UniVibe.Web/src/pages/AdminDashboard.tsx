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
import { api } from "../services/api";

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"events" | "users">("events");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      fetchEvents(); // Başarılı olursa listeyi yenile
    } catch (error: any) {
      alert(error || "Onaylama başarısız.");
    }
  };

  const handleRejectEvent = async (id: string) => {
    if (!window.confirm("Bu etkinliği reddetmek istediğinize emin misiniz?"))
      return;
    try {
      await api.put(`/AdminEvent/reject/${id}`);
      fetchEvents();
    } catch (error: any) {
      alert(error || "Reddetme başarısız.");
    }
  };

  const handleSuspendUser = async (id: string) => {
    if (
      !window.confirm(
        "Bu kullanıcıyı banlamak/askıya almak istediğinize emin misiniz?",
      )
    )
      return;
    try {
      await api.put(`/AdminUser/suspend/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error || "Kullanıcı banlanamadı.");
    }
  };

  const handleActivateUser = async (id: string) => {
    try {
      await api.put(`/AdminUser/activate/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error || "Kullanıcı aktifleştirilemedi.");
    }
  };

  const totalUsers = users.length;
  const pendingEventsCount = events.filter(
    (e) => e.status === 0 || String(e.status).toLowerCase() === "pending",
  ).length;
  const activeEventsCount = events.filter(
    (e) => e.status === 1 || String(e.status).toLowerCase() === "approved",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        {isLoading && <RefreshCw className="animate-spin text-blue-600" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Toplam Kullanıcı
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
              Onay Bekleyen Etkinlik
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
              Aktif Etkinlikler
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
            Etkinlik Yönetimi
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-4 font-medium text-sm transition-colors ${
              activeTab === "users"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Kullanıcı Yönetimi
          </button>
        </div>

        <div className="p-6">
          {activeTab === "events" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 font-medium">Etkinlik Adı</th>
                    <th className="pb-3 font-medium">Düzenleyen</th>
                    <th className="pb-3 font-medium">Tarih</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 && !isLoading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-gray-500"
                      >
                        Kayıtlı etkinlik bulunamadı.
                      </td>
                    </tr>
                  )}
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
                          {event.organizerName || "Bilinmiyor"}
                        </td>
                        <td className="py-4 text-gray-600">
                          {event.eventDate
                            ? new Date(event.eventDate).toLocaleDateString(
                                "tr-TR",
                                {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                },
                              )
                            : "Tarih Yok"}
                        </td>
                        <td className="py-4">
                          {isPending && (
                            <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-xs font-medium">
                              Bekliyor
                            </span>
                          )}
                          {isApproved && (
                            <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-medium">
                              Onaylandı
                            </span>
                          )}
                          {isRejected && (
                            <span className="bg-red-100 text-red-700 py-1 px-3 rounded-full text-xs font-medium">
                              Reddedildi
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right flex justify-end gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveEvent(event.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Onayla"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() => handleRejectEvent(event.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reddet"
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
          )}

          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-sm">
                    <th className="pb-3 font-medium">Kullanıcı</th>
                    <th className="pb-3 font-medium">E-posta</th>
                    <th className="pb-3 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Durum</th>
                    <th className="pb-3 font-medium text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && !isLoading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-gray-500"
                      >
                        Kayıtlı kullanıcı bulunamadı.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => {
                    const isActive = user.isActive;

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
                            className={`py-1 px-2 rounded-md text-xs font-medium ${user.role === "Admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4">
                          {isActive ? (
                            <span className="text-green-600 flex items-center gap-1 text-sm">
                              <CheckCircle size={16} /> Aktif
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1 text-sm">
                              <Ban size={16} /> Banlı
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right flex justify-end gap-2">
                          {user.role !== "Admin" &&
                            (isActive ? (
                              <button
                                onClick={() => handleSuspendUser(user.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors ml-auto"
                              >
                                <Ban size={16} /> Banla
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors ml-auto"
                              >
                                <CheckCircle size={16} /> Banı Kaldır
                              </button>
                            ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
